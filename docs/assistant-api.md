# AI Assistant API Reference

## Overview

The AI Assistant API provides two main endpoints for chat interaction:
- `GET /assistant/history` - Fetch conversation history
- `POST /assistant/respond` - Submit a message and get a response

Both endpoints are rate-limited and provide comprehensive response metadata including provider information and tool results.

---

## Authentication

### Public Endpoints (No Auth Required)
- `GET /assistant` - Public assistant page
- `GET /assistant/history` - Fetch history (public scope)
- `POST /assistant/respond` - Send message (public scope)

### Protected Endpoints (Auth Required)
- `GET /ai-assistant` - Operations assistant page (requires login)

Authentication uses Laravel's standard session-based auth. No API tokens required.

---

## Endpoints

### GET /assistant/history

Fetch conversation history for a session or conversation.

#### Request

```http
GET /assistant/history?conversation_id=123
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `conversation_id` | integer | Optional | Filter by specific conversation ID. If omitted, returns all conversations for session. |

#### Request Headers

```
Content-Type: application/json
Accept: application/json
```

#### Response Format

```json
{
  "messages": [
    {
      "id": 1,
      "role": "user",
      "content": "What is the queue status?",
      "createdAt": "2026-05-12T10:30:00Z",
      "metadata": null
    },
    {
      "id": 2,
      "role": "assistant",
      "content": "The queue currently has 5 waiting tickets...",
      "createdAt": "2026-05-12T10:30:05Z",
      "metadata": {
        "provider": "openai",
        "fallbackUsed": false
      }
    }
  ],
  "conversationId": 123
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `messages` | array | Array of message objects |
| `messages[].id` | integer | Message database ID |
| `messages[].role` | string | Either "user" or "assistant" |
| `messages[].content` | string | Message text content |
| `messages[].createdAt` | string | ISO 8601 timestamp |
| `messages[].metadata` | object | Provider metadata (null for user messages) |
| `messages[].metadata.provider` | string | "openai" or "ollama" |
| `messages[].metadata.fallbackUsed` | boolean | Whether fallback provider was used |
| `conversationId` | integer | Conversation ID |

#### Status Codes

| Code | Description |
|------|-------------|
| `200` | Success, messages returned |
| `429` | Rate limit exceeded (30/minute) |

#### Example Request

```bash
curl -X GET "http://localhost:8000/assistant/history?conversation_id=123" \
  -H "Content-Type: application/json"
```

#### Example Response

```json
{
  "messages": [
    {
      "id": 1,
      "role": "user",
      "content": "What is the queue status?",
      "createdAt": "2026-05-12T10:30:00Z",
      "metadata": null
    },
    {
      "id": 2,
      "role": "assistant",
      "content": "The queue has 5 tickets waiting...",
      "createdAt": "2026-05-12T10:30:05Z",
      "metadata": {
        "provider": "openai",
        "fallbackUsed": false
      }
    }
  ],
  "conversationId": 123
}
```

---

### POST /assistant/respond

Send a message to the assistant and get a response with tool execution metadata.

#### Request

```http
POST /assistant/respond
Content-Type: application/json

{
  "message": "What is the queue status?",
  "context": {
    "scope": "public",
    "url": "/assistant",
    "route": "assistant.public",
    "locale": "en",
    "session_id": "user_session_abc123",
    "page": {
      "branch_id": 1,
      "some_field": "some_value"
    }
  }
}
```

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | User message (max 5000 chars). Empty/whitespace rejected. |
| `context` | object | Yes | Execution context (see below) |
| `context.scope` | string | Yes | Either "public" or "operations" (must match auth state) |
| `context.url` | string | Yes | Current page URL (e.g., "/assistant") |
| `context.route` | string | Yes | Current route name (e.g., "assistant.public") |
| `context.locale` | string | Yes | Locale code ("en" or "ar") |
| `context.session_id` | string | Yes | Session identifier for conversation isolation |
| `context.page` | object | Optional | Page context (sensitive fields auto-redacted) |

#### Request Validation Rules

- `message`: required, string, max 5000 characters, must not be empty/whitespace
- `context`: required, must be object with all required fields
- `context.scope`: required, must be one of: "public", "operations"
- `context.session_id`: required, string
- **Scope Enforcement**:
  - If user is authenticated: `scope` must be "operations"
  - If user is unauthenticated: `scope` must be "public"

#### Response Format (Success)

```json
{
  "message": "The queue currently has 5 waiting tickets with an estimated wait time of 15 minutes.",
  "success": true,
  "providerUsed": "openai",
  "fallbackUsed": false,
  "dataChecked": true,
  "toolResults": [
    {
      "tool": "queue.status",
      "status": "success",
      "timestamp": "2026-05-12T10:30:05Z",
      "callId": 42
    }
  ],
  "conversationId": 123
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | Assistant response text |
| `success` | boolean | Whether request was successful |
| `providerUsed` | string | "openai", "ollama", or null |
| `fallbackUsed` | boolean | Whether Ollama was used as fallback |
| `dataChecked` | boolean | Whether tool execution verified data accuracy |
| `toolResults` | array | Array of tool execution results |
| `toolResults[].tool` | string | Tool name (e.g., "queue.status") |
| `toolResults[].status` | string | "success", "denied", or "failed" |
| `toolResults[].timestamp` | string | Execution timestamp (ISO 8601) |
| `toolResults[].callId` | integer | Audit log call ID |
| `conversationId` | integer | Created or existing conversation ID |

#### Response Format (Error)

```json
{
  "error": "An error occurred processing your request.",
  "success": false
}
```

Error responses never expose:
- API endpoints or provider URLs
- API keys or credentials
- Stack traces
- Provider-specific error details

---

## Tool Results

The `toolResults` array shows which tools were executed and their outcomes.

### Possible Tool Names

| Tool | Purpose | Public | Teller | Manager | Super Admin |
|------|---------|--------|--------|---------|------------|
| `queue.status` | Current queue status | ✅ | ✅ | ✅ | ✅ |
| `ticket.status` | Look up specific ticket | ✅ | ✅ | ✅ | ✅ |
| `branch.load` | Branch capacity analysis | ✅ | ✅ | ✅ | ✅ |
| `counters.status` | Active counter information | ✅ | ✅ | ✅ | ✅ |
| `reports.summary` | Daily/weekly statistics | ❌ | ❌ | ✅ | ✅ |
| `delay.explain` | Wait time analysis | ✅ | ✅ | ✅ | ✅ |
| `policy.read` | Current queue policy | ✅ | ✅ | ✅ | ✅ |

### Tool Status Values

| Status | Meaning |
|--------|---------|
| `success` | Tool executed successfully, results available |
| `denied` | User lacks permission to execute tool |
| `failed` | Tool execution encountered error |

---

## Status Codes

### 200 OK
Request successful, response generated.

```json
{
  "message": "...",
  "success": true,
  "providerUsed": "openai",
  ...
}
```

### 422 Unprocessable Entity
Validation failed. Common causes:
- Missing required field
- Invalid scope value
- Message exceeds 5000 chars
- Scope doesn't match auth state

Response includes validation errors:
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "message": ["The message field is required."],
    "context.scope": ["The scope must be one of: public, operations."]
  }
}
```

### 403 Forbidden
Authentication state doesn't match scope:
- Authenticated user trying to use "public" scope
- Unauthenticated user trying to use "operations" scope

```json
{
  "error": "Authenticated users must use operations scope."
}
```

### 429 Too Many Requests
Rate limit exceeded.

```json
{
  "message": "Too Many Requests"
}
```

Headers included:
```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1652345400
```

### 503 Service Unavailable
Both LLM providers unavailable or misconfigured.

```json
{
  "error": "An error occurred processing your request.",
  "success": false
}
```

---

## Rate Limiting

Both endpoints are rate-limited per user/IP:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `GET /assistant/history` | 30 | 1 minute |
| `POST /assistant/respond` | 20 | 1 minute |

Rate limit headers in all responses:
```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 18
X-RateLimit-Reset: 1652345400
```

When limit exceeded:
- Status: `429 Too Many Requests`
- Wait until `X-RateLimit-Reset` (Unix timestamp)

---

## Examples

### Example 1: Public User Checking Queue Status

```bash
curl -X POST "http://localhost:8000/assistant/respond" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the queue status?",
    "context": {
      "scope": "public",
      "url": "/assistant",
      "route": "assistant.public",
      "locale": "en",
      "session_id": "abc123def456"
    }
  }'
```

Response:
```json
{
  "message": "The queue currently has 5 waiting tickets with an average wait time of 12 minutes.",
  "success": true,
  "providerUsed": "openai",
  "fallbackUsed": false,
  "dataChecked": true,
  "toolResults": [
    {
      "tool": "queue.status",
      "status": "success",
      "timestamp": "2026-05-12T10:30:05Z",
      "callId": 42
    }
  ],
  "conversationId": 15
}
```

### Example 2: Manager Requesting Reports

```bash
curl -X POST "http://localhost:8000/assistant/respond" \
  -H "Content-Type: application/json" \
  -H "Cookie: XSRF-TOKEN=...; laravel_session=..." \
  -d '{
    "message": "Show me todays statistics",
    "context": {
      "scope": "operations",
      "url": "/ai-assistant",
      "route": "ai-assistant",
      "locale": "en",
      "session_id": "mgr_session_789"
    }
  }'
```

Response:
```json
{
  "message": "Today we processed 142 tickets with an average service time of 8.5 minutes. Peak load was between 10am-12pm with 28 concurrent customers.",
  "success": true,
  "providerUsed": "openai",
  "fallbackUsed": false,
  "dataChecked": true,
  "toolResults": [
    {
      "tool": "reports.summary",
      "status": "success",
      "timestamp": "2026-05-12T14:00:00Z",
      "callId": 128
    }
  ],
  "conversationId": 23
}
```

### Example 3: Teller Denied Reports Access

```bash
curl -X POST "http://localhost:8000/assistant/respond" \
  -H "Content-Type: application/json" \
  -H "Cookie: XSRF-TOKEN=...; laravel_session=..." \
  -d '{
    "message": "Show me reports",
    "context": {
      "scope": "operations",
      "url": "/ai-assistant",
      "route": "ai-assistant",
      "locale": "en",
      "session_id": "teller_session_456"
    }
  }'
```

Response:
```json
{
  "message": "I don't have access to generate reports. Please contact your manager.",
  "success": true,
  "providerUsed": "openai",
  "fallbackUsed": false,
  "dataChecked": true,
  "toolResults": [
    {
      "tool": "reports.summary",
      "status": "denied",
      "timestamp": "2026-05-12T10:45:00Z",
      "callId": 99
    }
  ],
  "conversationId": 20
}
```

Note: Even though access was denied, response is still `success: true` because the authorization check executed successfully. The `toolResults` show the denial status.

### Example 4: Scope Validation Error

```bash
curl -X POST "http://localhost:8000/assistant/respond" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello",
    "context": {
      "scope": "invalid_scope",
      "url": "/assistant",
      "route": "assistant.public",
      "locale": "en",
      "session_id": "test"
    }
  }'
```

Response (422):
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "context.scope": ["The context.scope must be one of: public, operations."]
  }
}
```

### Example 5: Conversation History

```bash
curl -X GET "http://localhost:8000/assistant/history?conversation_id=15" \
  -H "Content-Type: application/json"
```

Response:
```json
{
  "messages": [
    {
      "id": 29,
      "role": "user",
      "content": "What is the queue status?",
      "createdAt": "2026-05-12T10:30:00Z",
      "metadata": null
    },
    {
      "id": 30,
      "role": "assistant",
      "content": "The queue currently has 5 waiting tickets...",
      "createdAt": "2026-05-12T10:30:05Z",
      "metadata": {
        "provider": "openai",
        "fallbackUsed": false
      }
    },
    {
      "id": 31,
      "role": "user",
      "content": "How long is the wait?",
      "createdAt": "2026-05-12T10:31:00Z",
      "metadata": null
    },
    {
      "id": 32,
      "role": "assistant",
      "content": "The average wait time is approximately 12 minutes.",
      "createdAt": "2026-05-12T10:31:05Z",
      "metadata": {
        "provider": "openai",
        "fallbackUsed": false
      }
    }
  ],
  "conversationId": 15
}
```

---

## Best Practices

### Session IDs
- Generate unique session ID on client startup: `const sessionId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}``
- Store in localStorage for persistence across page reloads
- Use same session_id for all requests in a conversation

### Error Handling
- Always check `success` field
- Display user-friendly error message from `error` field
- Never expose `toolResults` details to end users unless needed for debugging

### Performance
- Cache conversation history client-side when possible
- Don't fetch history on every message (only on page load)
- Implement debouncing if auto-submitting user input

### Security
- Always validate `context.scope` matches user auth state on client
- Never send sensitive data in `message` field
- Never put API keys or passwords in page context
- Validate all user input before submission

---

## Provider Information

### OpenAI (Primary)
- **Model**: Configurable, typically `gpt-4o-mini`
- **Base URL**: `https://api.openai.com`
- **Timeout**: 30 seconds
- **Max Tokens**: 800

When used: All requests attempt OpenAI first.

### Ollama (Fallback)
- **Model**: Configurable, typically `llama2`
- **Base URL**: Localhost only `http://127.0.0.1:11434`
- **Timeout**: 30 seconds
- **Max Tokens**: 800

When used: Only if OpenAI fails and fallback is enabled.

### Provider Metadata
Response includes which provider handled the request:
- `providerUsed`: "openai", "ollama", or null
- `fallbackUsed`: true if Ollama was used

If both fail:
- Status: `503 Service Unavailable`
- Error: "An error occurred processing your request."
- No provider information exposed
