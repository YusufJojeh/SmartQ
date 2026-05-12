# AI Assistant Deployment Guide

## Pre-Deployment Checklist

- [ ] All 37+ tests passing
- [ ] Frontend builds without errors (`npm run build`)
- [ ] No TypeScript errors (`npm run build`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Code review completed
- [ ] Database backups created
- [ ] SSL certificate valid
- [ ] CORS configured (if needed)
- [ ] Logging infrastructure ready
- [ ] Monitoring alerts configured

---

## Step 1: Environment Configuration

### 1.1 Set Environment Variables

Create/update `.env` in project root:

```bash
# OpenAI Configuration (Primary Provider)
OPENAI_API_KEY=sk-your-actual-key-here
OPENAI_BASE_URL=https://api.openai.com
OPENAI_MODEL=gpt-4o-mini

# Ollama Configuration (Local Fallback - Optional)
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama2

# Assistant Behavior Configuration
AI_ASSISTANT_FALLBACK_ENABLED=true
AI_ASSISTANT_TIMEOUT=30
AI_ASSISTANT_MAX_TOKENS=800

# Other Laravel settings
APP_DEBUG=false
APP_ENV=production
LOG_CHANNEL=stack
```

### 1.2 Verify Environment

```bash
php artisan config:cache
php artisan config:show services.assistant
```

Output should show all assistant config loaded correctly.

### 1.3 Validate Configuration

```bash
php artisan assistant:test-configuration
```

This custom command (if implemented) will:
- Test OpenAI connectivity
- Test Ollama connectivity (if enabled)
- Verify API key validity
- Test timeout settings

---

## Step 2: Database Migrations

### 2.1 Run Migrations

```bash
php artisan migrate
```

This runs three migrations in order:
1. `2026_05_12_000001_create_assistant_conversations_table.php`
2. `2026_05_12_000002_create_assistant_messages_table.php`
3. `2026_05_12_000003_create_assistant_tool_calls_table.php`

### 2.2 Verify Schema

```bash
php artisan tinker
>>> Schema::hasTable('assistant_conversations')
=> true
>>> Schema::getColumnListing('assistant_conversations')
=> ['id', 'user_id', 'scope', 'session_id', 'owner_key', 'created_at', 'updated_at']
```

### 2.3 Check Indexes

```bash
php artisan migrate:status
```

Verify all three assistant migrations show "Batch 1" (or latest batch number).

### 2.4 Backup Database

Before going live:

```bash
# MySQL
mysqldump -u user -p database > backup_2026_05_12.sql

# PostgreSQL
pg_dump database > backup_2026_05_12.sql

# Store in secure location (S3, backup service, etc.)
```

---

## Step 3: Frontend Build

### 3.1 Build JavaScript

```bash
npm run build
```

Output should show:
```
✓ compiled successfully
✓ 5 files changed, 195 insertions(+)
```

### 3.2 Verify Assets

```bash
ls -la public/js/
ls -la public/css/
```

Should contain compiled `app.js` and `app.css` with timestamps.

### 3.3 Clear Cache

```bash
php artisan cache:clear
php artisan view:clear
```

---

## Step 4: Testing

### 4.1 Run Full Test Suite

```bash
php artisan test
```

Expected output:
```
Tests:  37+ passed
Time:   ~5-10 seconds
```

### 4.2 Run Feature Tests Only

```bash
php artisan test tests/Feature/AssistantTest.php
```

### 4.3 Run Unit Tests Only

```bash
php artisan test tests/Unit/Services/
```

### 4.4 Verify Database Tests Don't Leak

```bash
php artisan test --debug
# Should see 3 migrations run and rollback for each test
```

---

## Step 5: Route Verification

### 5.1 List Assistant Routes

```bash
php artisan route:list | grep assistant
```

Expected output:
```
GET     /assistant                       assistant.public
GET     /ai-assistant                    ai-assistant
GET     /assistant/history               assistant.history
POST    /assistant/respond               assistant.respond
```

### 5.2 Test Public Routes

```bash
curl http://localhost:8000/assistant
curl -X POST http://localhost:8000/assistant/respond \
  -H "Content-Type: application/json" \
  -d '{"message":"test","context":{"scope":"public",...}}'
```

### 5.3 Test Protected Routes

```bash
# Should redirect to login (302)
curl http://localhost:8000/ai-assistant

# With auth cookie, should work (200)
curl -b "laravel_session=..." http://localhost:8000/ai-assistant
```

---

## Step 6: Ollama Setup (Optional - For Fallback)

### 6.1 Install Ollama

On your deployment server:

```bash
# macOS
brew install ollama

# Linux
curl https://ollama.ai/install.sh | sh

# Windows
# Download from https://ollama.ai
```

### 6.2 Start Ollama Service

```bash
# Run in background
ollama serve &

# Verify running on port 11434
curl http://127.0.0.1:11434/api/tags
```

### 6.3 Pull Model

```bash
ollama pull llama2

# Or your preferred model
ollama pull mistral
```

### 6.4 Configure in .env

```
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama2
AI_ASSISTANT_FALLBACK_ENABLED=true
```

### 6.5 Test Ollama

```bash
curl http://127.0.0.1:11434/api/generate \
  -d '{
    "model": "llama2",
    "prompt": "Why is the sky blue?",
    "stream": false
  }'
```

---

## Step 7: Rate Limiting Configuration

### 7.1 Verify Rate Limit Middleware

```bash
php artisan route:list | grep throttle
```

Routes should show:
- `/assistant/history` with throttle:30,1
- `/assistant/respond` with throttle:20,1

### 7.2 Configure Cache for Rate Limiting

In `config/cache.php`, ensure rate limiting cache driver is fast:

```php
'default' => env('CACHE_DRIVER', 'redis'), // Redis preferred
// or
'default' => env('CACHE_DRIVER', 'array'), // In-memory for testing
```

### 7.3 Test Rate Limiting

```bash
# Run 31 requests in a loop
for i in {1..31}; do
  curl http://localhost:8000/assistant/history?session_id=test
done

# Request 31 should return 429
```

---

## Step 8: Logging Configuration

### 8.1 Configure Log Channel

In `config/logging.php`:

```php
'channels' => [
    'stack' => [
        'driver' => 'stack',
        'channels' => ['single', 'syslog'],
    ],
    'single' => [
        'driver' => 'single',
        'path' => storage_path('logs/laravel.log'),
        'level' => 'debug',
    ],
]
```

### 8.2 Create Assistant-Specific Log

Optional: Create dedicated assistant log channel:

```php
// config/logging.php
'assistant' => [
    'driver' => 'single',
    'path' => storage_path('logs/assistant.log'),
    'level' => 'info',
],
```

### 8.3 Configure Log Rotation

In `config/logging.php`:

```php
'single' => [
    'driver' => 'single',
    'path' => storage_path('logs/laravel.log'),
    'level' => 'debug',
    'days' => 7, // Keep 7 days
],
```

### 8.4 Create Log Directory

```bash
mkdir -p storage/logs
chmod 755 storage/logs
```

---

## Step 9: Monitoring Setup

### 9.1 Application Monitoring

Configure monitoring alerts for:
- HTTP 503 responses (provider failures)
- HTTP 429 responses (rate limiting)
- Database connection errors
- Slow queries (>5s)
- Provider timeouts

### 9.2 Database Monitoring

```sql
-- Monitor table growth
SELECT TABLE_NAME, table_rows, round(((data_length + index_length) / 1024 / 1024), 2) as size_mb
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'queue_db' AND TABLE_NAME LIKE 'assistant%';
```

### 9.3 Log Monitoring

Watch for patterns:
```
ERROR Assistant respond error
WARN Authorization denied
ERROR OpenAI connection failed
ERROR Ollama unreachable
```

### 9.4 Set Up Alerts

Configure monitoring tool (New Relic, DataDog, etc.) to alert on:
- Error rate > 1%
- Response time p95 > 5s
- Database connection pool exhaustion
- Provider fallback rate > 10%

---

## Step 10: Security Hardening

### 10.1 HTTPS/SSL

Ensure all routes use HTTPS in production:

```php
// app/Http/Middleware/ForceHttps.php
if (!$this->app->environment('local') && !request()->isSecure()) {
    return redirect()->secure(request()->getRequestUri());
}
```

### 10.2 CORS Configuration

In `config/cors.php`:

```php
'paths' => ['api/*', 'assistant/*'],
'allowed_methods' => ['*'],
'allowed_origins' => ['https://yourdomain.com'],
'allowed_origins_patterns' => [],
'allowed_headers' => ['*'],
'exposed_headers' => ['X-RateLimit-*'],
'max_age' => 0,
'supports_credentials' => true,
```

### 10.3 API Key Security

- [ ] API key never logged
- [ ] API key never sent in error messages
- [ ] API key rotated monthly
- [ ] API key stored in env vars (not config files)
- [ ] API key not in git history

Verify:
```bash
git log --all -S "sk-" --oneline
# Should return empty
```

### 10.4 Database Security

- [ ] Database backups encrypted
- [ ] Database access restricted by IP
- [ ] SQL injection prevention (use ORMs, prepared statements)
- [ ] Query timeout configured

### 10.5 CSRF Protection

Routes are protected by Laravel's CSRF middleware. Verify:

```bash
php artisan tinker
>>> \App\Http\Middleware\VerifyCsrfToken::class
=> "App\Http\Middleware\VerifyCsrfToken"
```

---

## Step 11: Smoke Tests

### 11.1 Manual Smoke Test

```bash
# 1. Can access public page
curl http://localhost:8000/assistant

# 2. Can submit message (public)
curl -X POST http://localhost:8000/assistant/respond \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test",
    "context": {
      "scope": "public",
      "url": "/assistant",
      "route": "assistant.public",
      "locale": "en",
      "session_id": "test123"
    }
  }'

# 3. Can fetch history
curl http://localhost:8000/assistant/history

# 4. Protected route redirects (without auth)
curl http://localhost:8000/ai-assistant -I
# Should return 302 Location
```

### 11.2 Check Error Logs

```bash
tail -f storage/logs/laravel.log | grep -i "error\|exception"
```

Should show no errors during smoke tests.

### 11.3 Verify Database Writes

```bash
php artisan tinker
>>> DB::table('assistant_conversations')->count()
=> 1 (from smoke test)
>>> DB::table('assistant_messages')->count()
=> 2 (user + assistant)
```

---

## Step 12: Performance Tuning

### 12.1 Enable Query Optimization

```php
// config/database.php
'strict' => false, // Better performance
'engine' => 'InnoDB', // For transactions
```

### 12.2 Configure Connection Pooling

```php
// config/database.php
'connections' => [
    'mysql' => [
        'driver' => 'mysql',
        'pool' => [
            'min' => 2,
            'max' => 10,
        ],
    ],
],
```

### 12.3 Cache Configuration

```bash
# Verify Redis running (if using Redis cache)
redis-cli ping
# Should return: PONG
```

### 12.4 View Caching

```bash
php artisan view:cache
# Caches all Blade templates
```

---

## Step 13: Deployment to Production

### 13.1 Final Pre-Flight Checks

```bash
# 1. All tests passing
php artisan test --no-output --quiet
echo "Exit code: $?" # Should be 0

# 2. No uncommitted changes
git status --short
# Should be empty

# 3. Frontend built
test -f public/js/app.js && echo "Frontend OK" || echo "Frontend MISSING"

# 4. Environment configured
php artisan config:show services.assistant
# Should show all assistant settings
```

### 13.2 Deploy Code

```bash
# Push to production branch
git push production main

# OR manually deploy
git clone <repo> production
cd production
composer install --no-dev
npm run build
php artisan migrate --force
```

### 13.3 Warm Up Cache

```bash
php artisan cache:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

### 13.4 Verify Deployment

```bash
# Check app is running
curl https://yourdomain.com/assistant
# Should return 200 OK

# Check routes registered
php artisan route:list | grep assistant
# Should list 4 assistant routes

# Check database
php artisan tinker
>>> Schema::hasTable('assistant_conversations')
=> true
```

---

## Step 14: Go-Live Steps

### 14.1 Enable Public Access

1. Configure DNS (if needed)
2. Enable firewall rules for port 443 (HTTPS)
3. Verify SSL certificate
4. Verify domain DNS resolving

### 14.2 Announce Feature

1. Send notification to users
2. Update documentation
3. Train staff on feature
4. Create support guidelines

### 14.3 Monitor Initial Traffic

```bash
# Watch logs in real-time
tail -f storage/logs/laravel.log

# Monitor performance
watch 'ps aux | grep php'
```

### 14.4 First 24 Hours

- [ ] No critical errors in logs
- [ ] Response times acceptable (<5s)
- [ ] Rate limiting working
- [ ] No customer complaints
- [ ] Database growing normally (not exploding)
- [ ] All tools executing successfully

---

## Rollback Procedure

### Quick Rollback (If Something Goes Wrong)

```bash
# 1. Revert code
git revert HEAD
git push production

# 2. Clear cache
php artisan cache:clear

# 3. Restart services (if using supervisord)
supervisorctl restart laravel-worker

# 4. Monitor logs
tail -f storage/logs/laravel.log
```

### Full Rollback (Database Reset)

Only if data corruption or database errors:

```bash
# 1. Backup current database
mysqldump -u user -p database > backup_corrupted.sql

# 2. Revert migrations
php artisan migrate:rollback --step=3

# 3. Revert code
git revert HEAD

# 4. Clear everything
php artisan cache:clear
php artisan view:clear
php artisan config:clear
```

---

## Maintenance Procedures

### Daily (Automated)

- Database backups
- Log rotation
- Cache cleanup

### Weekly

- Review error logs for patterns
- Verify both LLM providers accessible
- Check database growth
- Monitor storage space

### Monthly

- Analyze performance metrics
- Review slow query logs
- Update dependencies (carefully)
- Rotate API keys
- Archive old logs

### Quarterly

- Full security audit
- Penetration testing
- Disaster recovery drill
- Performance optimization review

---

## Troubleshooting

### Issue: "An error occurred processing your request"

**Symptoms**: All requests return 503

**Solutions**:
1. Check OpenAI API key is valid
2. Verify Ollama running (if fallback enabled)
3. Check database connectivity
4. Review logs: `tail -f storage/logs/laravel.log`

### Issue: "Too Many Requests" (429)

**Symptoms**: Valid requests get rate limited

**Solutions**:
1. Wait for X-RateLimit-Reset time
2. Reduce request frequency
3. Increase rate limit in routes if intentional

### Issue: Database queries slow

**Symptoms**: Response times >5s

**Solutions**:
1. Add indexes: `php artisan make:migration add_assistant_indexes`
2. Optimize queries: check `php artisan tinker` → `DB::enableQueryLog()`
3. Archive old records: delete messages older than 1 year
4. Enable query caching

### Issue: Ollama not responding

**Symptoms**: OpenAI works but fallback never triggers

**Solutions**:
1. Verify Ollama running: `curl http://127.0.0.1:11434/api/tags`
2. Check model pulled: `ollama list`
3. Restart Ollama: `pkill ollama && ollama serve &`
4. Check OLLAMA_BASE_URL in .env

---

## Success Indicators

System is successfully deployed when:

✅ All 4 routes accessible (public and auth)  
✅ All 37+ tests passing  
✅ Response times <5s  
✅ No critical errors in logs  
✅ Database growing at expected rate  
✅ Both LLM providers accessible  
✅ Rate limiting working  
✅ Authorization checks enforcing permissions  
✅ PII redacted before LLM  
✅ Monitoring alerts configured  

---

## Support Contacts

Create support runbook with:
- On-call engineer contact
- OpenAI support link
- Ollama community forum
- Database admin contact
- DevOps team contact
