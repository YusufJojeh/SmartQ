# AI Assistant System - Production Readiness Guide

## System Overview

The AI Assistant system is a bounded, fact-based Q&A system designed for queue operations management. It provides both public (customer-facing) and operations (staff-facing) interfaces with multi-provider LLM support, comprehensive audit logging, and strict permission enforcement.

### Core Architecture

```
User Request
    ↓
Request Validation (StoreAssistantMessageRequest)
    ↓
Context Builder (scope, user role, branch, locale)
    ↓
Intent Router (keyword matching → tool selection)
    ↓
Policy Guard (role-based authorization)
    ↓
Tool Registry (execute 7 specialized tools)
    ↓
Context Redaction (remove PII before LLM)
    ↓
LLM Provider (OpenAI → Ollama fallback)
    ↓
Message Storage (database persistence)
    ↓
Response Formatter (add provider metadata)
    ↓
User Response (JSON)
```

### Key Features

- **Dual-Provider LLM**: OpenAI primary, Ollama local fallback
- **7 Specialized Tools**: Queue status, branch load, ticket lookup, counter management, reports, delay analysis, policy
- **Multi-Scope Isolation**: Public (anonymous) and Operations (authenticated)
- **Role-Based Access Control**: Guest, Teller, Manager, Super Admin
- **PII Redaction**: Automatic sensitive data removal before LLM calls
- **Complete Audit Trail**: Every tool execution logged with input, output, status, duration
- **Permission Enforcement**: Authorization checks happen in code, not prompts
- **Rate Limiting**: 30/min (history), 20/min (respond)

---

## Request Flow Diagram

```
┌─────────────────────────────────────────────────┐
│ POST /assistant/respond                         │
│ {message, context}                              │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│ Request Validation                              │
│ - message required, max 5000 chars             │
│ - context required, scope in:public,operations │
│ - session_id required                          │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│ Context Builder                                 │
│ - Extract user_id, user_role, branch_id        │
│ - Determine scope (auto from auth state)        │
│ - Detect locale, capture URL/route             │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│ Intent Router                                   │
│ - Keyword matching (English + Arabic)          │
│ - Extract ticket codes via regex                │
│ - Select 1-3 tools for execution                │
└──────────────────┬──────────────────────────────┘
                   ↓
         ┌─────────┴─────────┐
         ↓                   ↓
    ┌─────────────────┐ ┌──────────────┐
    │ Policy Guard    │ │ Tool Input   │
    │ (authorize)     │ │ Validator    │
    │ (access check)  │ │ (normalize)  │
    └────────┬────────┘ └──────┬───────┘
             │                 │
             └────────┬────────┘
                      ↓
         ┌─────────────────────────────┐
         │ Tool Registry               │
         │ - Execute authorized tools  │
         │ - Collect results           │
         │ - Log each execution        │
         └────────────┬────────────────┘
                      ↓
         ┌─────────────────────────────┐
         │ Context Redaction           │
         │ - Remove email, phone, etc. │
         │ - Redact token/secret fields│
         │ - Build LLM context         │
         └────────────┬────────────────┘
                      ↓
         ┌─────────────────────────────┐
         │ LLM Provider Selection      │
         │ - Try OpenAI first          │
         │ - On failure → Ollama       │
         │ - On both failure → Error   │
         └────────────┬────────────────┘
                      ↓
         ┌─────────────────────────────┐
         │ Message Storage             │
         │ - Create/find conversation  │
         │ - Store user + assistant    │
         │ - Track provider used       │
         └────────────┬────────────────┘
                      ↓
         ┌─────────────────────────────┐
         │ Response Formatter          │
         │ - Add provider metadata     │
         │ - Add fallback flag         │
         │ - Include tool results      │
         └────────────┬────────────────┘
                      ↓
         ┌─────────────────────────────┐
         │ JSON Response               │
         │ {message, providerUsed,     │
         │  fallbackUsed, toolResults} │
         └─────────────────────────────┘
```

---

## Provider Fallback Behavior

### Primary: OpenAI
- **Model**: Configurable via `OPENAI_MODEL` env (default: `gpt-4o-mini`)
- **Base URL**: Configurable via `OPENAI_BASE_URL`
- **Timeout**: `AI_ASSISTANT_TIMEOUT` (default: 30s)
- **Max Tokens**: `AI_ASSISTANT_MAX_TOKENS` (default: 800)

### Fallback: Ollama (Local Only)
- **Base URL**: Must be localhost (http://127.0.0.1:11434)
- **Model**: Configurable via `OLLAMA_MODEL` (default: `llama2`)
- **No Remote Access**: Ollama can only run locally for security

### Failover Logic
```
1. Try OpenAI
   ├─ Success → Return response
   └─ Failure (timeout, auth, network) → Step 2

2. If fallback enabled, try Ollama
   ├─ Success → Return response (fallbackUsed: true)
   └─ Failure → Step 3

3. Return 503 error (never expose provider details)
```

---

## Permission Model

### Public Scope (Unauthenticated)
- **Allowed Tools**: `ticket.status` only
- **Fields Accessible**: ticket_number, display_code, status, estimated_wait_minutes
- **Filtered Fields**: customer_name, customer_phone, teller_id, branch_id

### Operations Scope (Authenticated)

#### Guest Role
- No additional permissions (same as public)

#### Teller Role
- **Allowed Tools**: All except `reports.summary`
- **Own Branch**: Can query own branch only
- **Cross-Branch**: Denied

#### Manager Role
- **Allowed Tools**: All including `reports.summary`
- **Own Branch**: Can query own branch
- **Cross-Branch**: Denied (can only see own branch data)

#### Super Admin Role
- **Allowed Tools**: All 7 tools
- **Access**: Full access to all branches and data

### Authorization Enforcement
All authorization happens in code (PolicyGuard), not in LLM prompts:
```php
// Example: PolicyGuard.authorize()
if ($toolName === 'reports.summary' && $context['user_role'] === 'teller') {
    return false; // Denied in code, logged as 'denied'
}
```

---

## PII Redaction Rules

### Automatic Redaction Patterns
The following field names trigger automatic redaction:
- `email`, `customer_email`, `user_email`
- `phone`, `customer_phone`, `branch_phone`
- `token`, `api_key`, `secret`, `password`
- `bearer`, `authorization`
- `customer_name` (in public scope)
- `address`, `ssn`, `credit_card`
- Any field matching regex: `/email|phone|token|password|secret|api_key|bearer|authorization|customer_name|address|ssn|credit_card|@/i`

### Redaction Locations
1. **Frontend** (JavaScript): `buildAssistantContext()` in `lib/assistant-context.ts`
2. **Backend** (PHP): `AssistantService::redactContext()` before LLM call

### Example Redaction
```php
Input:  ['customer_email' => 'john@example.com', 'status' => 'waiting']
Output: ['customer_email' => '[redacted]', 'status' => 'waiting']
```

---

## Rate Limiting

### Endpoints Protected
- **GET /assistant/history**: 30 requests/minute
- **POST /assistant/respond**: 20 requests/minute

### Implementation
Uses Laravel's `throttle` middleware:
```php
Route::get('/assistant/history', [...])
    ->middleware('throttle:30,1')
    
Route::post('/assistant/respond', [...])
    ->middleware('throttle:20,1')
```

### Rate Limit Headers
All responses include:
- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Requests left
- `X-RateLimit-Reset`: Reset timestamp (Unix seconds)

### Exceeding Limits
Returns `429 Too Many Requests` with body:
```json
{
  "message": "Too Many Requests"
}
```

---

## Safe Error Handling

### Principle: Never Expose Internal Details
Error responses to users never include:
- Provider URLs or endpoint paths
- API keys or authentication details
- Database connection strings
- Stack traces or internal exception messages
- Provider-specific error codes

### Error Response Format
```json
{
  "error": "An error occurred processing your request.",
  "success": false
}
```

### Internal Logging
All errors logged with full context internally:
```php
Log::error('Assistant respond error', [
    'error' => $e->getMessage(),
    'provider' => $providerAttempted,
    'user_id' => auth()->id(),
])
```

### Exception Handling
```php
try {
    $response = $this->assistantService->respond(...);
} catch (\Exception $e) {
    \Log::error(...); // Log full details internally
    return response()->json([
        'error' => 'An error occurred processing your request.',
        'success' => false,
    ], 503);
}
```

---

## Monitoring Checklist

### Daily Checks
- [ ] Verify both OpenAI and Ollama availability
- [ ] Check error logs for repeated failures
- [ ] Monitor response times (should be <5s typically)
- [ ] Review rate limit rejections
- [ ] Spot-check audit logs for permission denials

### Weekly Reviews
- [ ] Analyze tool execution statistics
- [ ] Review conversation patterns (common queries)
- [ ] Check provider fallback rate
- [ ] Verify database growth is reasonable
- [ ] Test complete failover path (both providers)

### Database Monitoring
Tables to watch:
- `assistant_conversations`: Should grow linearly with new conversations
- `assistant_messages`: Should grow with conversation activity
- `assistant_tool_calls`: Should grow with message activity (1-3x message rate)

### Performance Metrics
- **Response Time**: <5s for 95th percentile
- **Tool Execution**: <2s average
- **Provider Response**: <3s average
- **Database Query**: <100ms average

### Log Patterns to Alert On
```
ERROR Assistant respond error
ERROR OpenAI connection timeout
ERROR Ollama unreachable
WARN Authorization denied (repeated)
```

---

## Deployment Prerequisites

### Environment Variables Required
```
# OpenAI Configuration
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com
OPENAI_MODEL=gpt-4o-mini

# Ollama Configuration (Optional)
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama2

# Behavior Configuration
AI_ASSISTANT_FALLBACK_ENABLED=true
AI_ASSISTANT_TIMEOUT=30
AI_ASSISTANT_MAX_TOKENS=800
```

### Database Migrations
```bash
php artisan migrate
```

Runs 3 migrations:
1. `assistant_conversations` table
2. `assistant_messages` table
3. `assistant_tool_calls` table

### Frontend Build
```bash
npm run build
```

Compiles TypeScript components and bundles them.

### Service Configuration
Verify in `config/services.php`:
```php
'assistant' => [
    'openai' => [
        'key' => env('OPENAI_API_KEY'),
        'base_url' => env('OPENAI_BASE_URL', 'https://api.openai.com'),
        'model' => env('OPENAI_MODEL', 'gpt-4o-mini'),
    ],
    'ollama' => [
        'base_url' => env('OLLAMA_BASE_URL', 'http://127.0.0.1:11434'),
        'model' => env('OLLAMA_MODEL', 'llama2'),
    ],
    'fallback_enabled' => env('AI_ASSISTANT_FALLBACK_ENABLED', true),
    'timeout' => env('AI_ASSISTANT_TIMEOUT', 30),
    'max_tokens' => env('AI_ASSISTANT_MAX_TOKENS', 800),
]
```

---

## Rollback Procedure

### Quick Rollback (Keep DB Changes)
```bash
git revert <commit-hash>
npm run build
php artisan cache:clear
```

The assistant routes will return 503 until reverted back to working commit.

### Full Rollback (Database Reset)
```bash
git revert <commit-hash>
php artisan migrate:rollback --step=3  # Rolls back the 3 assistant migrations
npm run build
php artisan cache:clear
```

**Important**: Only do full rollback if there are corrupted records in assistant tables.

---

## Performance Tuning

### Timeout Configuration
- **Increase** `AI_ASSISTANT_TIMEOUT` if LLM provider is slow
- **Decrease** if you want faster timeouts (not recommended <10s)
- Typical: 30s

### Max Tokens Configuration
- **Increase** `AI_ASSISTANT_MAX_TOKENS` for longer responses
- **Decrease** for faster responses and lower costs
- Typical: 800 (balance between detail and speed)

### Database Optimization
Indexes are created by migrations on:
- `assistant_conversations`: (scope, session_id), (user_id, scope)
- `assistant_messages`: (assistant_conversation_id, created_at), (created_at)
- `assistant_tool_calls`: (assistant_conversation_id, created_at), (tool_name, status, created_at), (user_id, created_at)

These support common query patterns. Add more if you identify slow queries.

---

## Security Best Practices

### Do's
- ✅ Always validate `context.scope` server-side
- ✅ Log all tool executions (you have 37+ tests for this)
- ✅ Redact PII before LLM calls
- ✅ Use HTTPS in production
- ✅ Rotate OPENAI_API_KEY periodically
- ✅ Monitor error logs for injection attempts
- ✅ Keep Ollama local-only

### Don'ts
- ❌ Don't trust user-supplied scope parameter
- ❌ Don't expose API keys in error messages
- ❌ Don't skip validation on input
- ❌ Don't run Ollama as publicly accessible endpoint
- ❌ Don't trust LLM for authorization (use PolicyGuard)
- ❌ Don't store plain-text API keys (use env vars)

---

## Troubleshooting

### OpenAI Failures
**Symptom**: "An error occurred" response, logs show OpenAI timeout
**Solution**:
1. Verify OPENAI_API_KEY is set and valid
2. Check OPENAI_BASE_URL (should be https://api.openai.com unless using proxy)
3. Increase AI_ASSISTANT_TIMEOUT if network is slow
4. Fallback to Ollama will activate if enabled

### Ollama Not Responding
**Symptom**: Fallback doesn't kick in, still get errors
**Solution**:
1. Verify Ollama is running: `curl http://127.0.0.1:11434/api/tags`
2. Check OLLAMA_BASE_URL is set correctly
3. Verify firewall allows local 127.0.0.1:11434
4. Pull the model: `ollama pull llama2`

### Rate Limiting Issues
**Symptom**: Getting 429 responses
**Solution**:
1. Check X-RateLimit-Reset header to see when limit resets
2. Reduce request frequency
3. Adjust throttle limits in routes/web.php if needed (affects all users)

### PII Leaking in Logs
**Symptom**: Email/phone visible in context before LLM call
**Solution**:
1. Verify redactValue() is being called in buildAssistantContext()
2. Check SENSITIVE_PATTERNS regex matches your fields
3. Add field names to SENSITIVE_PATTERNS if missing

### Conversation Isolation Issues
**Symptom**: User A sees User B's conversation
**Solution**:
1. Verify owner_key is set correctly in AssistantConversation
2. Check history() endpoint filters by user_id for operations scope
3. Review database data for corrupted owner_key values

---

## Maintenance

### Database Cleanup
After system runs for months, `assistant_messages` and `assistant_tool_calls` tables grow large.

Periodic cleanup (optional, keep conversations for audit):
```sql
-- Archive old tool calls (keep last 90 days)
DELETE FROM assistant_tool_calls 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Archive old messages (keep last 1 year for compliance)
DELETE FROM assistant_messages 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
```

### Model Updates
When updating LLM models:
1. Test new model thoroughly in staging
2. Update OPENAI_MODEL or OLLAMA_MODEL env var
3. Run few production requests and monitor response quality
4. Update documentation with new model name

### Provider Migration
To switch from OpenAI to custom LLM:
1. Implement new provider class (extends same interface)
2. Add config in config/services.php
3. Update AssistantService to try new provider
4. Test fallback chain
5. Monitor provider switching metrics

---

## Success Indicators

System is healthy when:
- ✅ Response times consistently <5s
- ✅ <1% error rate (503 responses)
- ✅ <5% fallback activation rate
- ✅ Authorization logs show expected denials
- ✅ No security-related errors in logs
- ✅ Tests pass 100% (37+tests)
- ✅ Database query performance acceptable
- ✅ Rate limits not being hit excessively
