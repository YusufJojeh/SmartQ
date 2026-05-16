# Deployment Readiness

SmartQ is a single-organization, multi-branch queue management platform. Do not add tenant, SaaS, subscription, billing, or platform-admin infrastructure for deployment.

## Production Environment Checklist

- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL=https://your-smartq-domain.example`
- `APP_KEY` generated and stored in the secret manager
- `APP_TIMEZONE` set to the organization's operational timezone
- `DB_CONNECTION=mysql` or the approved production database driver
- `QUEUE_CONNECTION=database` or `redis`
- `CACHE_STORE=redis` or another production-safe shared cache
- `SESSION_DRIVER=database` or `redis`
- `BROADCAST_CONNECTION=reverb` when realtime is enabled
- `LOG_CHANNEL=stack` with centralized log collection
- Mail credentials configured for password reset and notifications
- OpenAI/Ollama assistant variables set only if the assistant is enabled for production

Never commit `.env`, database dumps, private keys, Reverb secrets, OpenAI keys, or backup archives.

## Required Processes

Run these as supervised services with restart policies:

- Web/PHP-FPM application process
- Nginx or another reverse proxy
- Queue worker: `php artisan queue:work --sleep=3 --tries=3 --max-time=3600`
- Scheduler: `php artisan schedule:run` every minute
- Reverb: `php artisan reverb:start --host=0.0.0.0 --port=8080`

After each deploy:

```bash
composer install --no-dev --optimize-autoloader
npm ci
npm run build
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan queue:restart
php artisan reverb:restart
```

## Reverb And Queue Notes

- Queue ticket events currently implement `ShouldBroadcastNow`, so realtime queue updates do not depend on the queue worker.
- The queue worker is still required for normal Laravel queued jobs and future notifications.
- Keep Reverb secrets synchronized between Laravel and the frontend `VITE_REVERB_*` build-time variables.
- Use explicit `allowed_origins` in `config/reverb.php` for production domains.
- If running multiple Reverb instances, enable Reverb scaling with Redis and test fan-out before launch.

## Nginx Notes

- Serve Laravel through the `public/` directory only.
- Deny direct access to `.env`, `storage/`, `database/`, and source files.
- Pass PHP requests to PHP-FPM with the correct `SCRIPT_FILENAME`.
- Proxy websocket traffic to Reverb with HTTP/1.1 upgrade headers.
- Terminate TLS at Nginx or a trusted load balancer and use WSS for browsers.
- Set request body limits appropriate for the app; SmartQ does not require large uploads by default.

Example websocket proxy location:

```nginx
location /app/ {
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_pass http://127.0.0.1:8080;
}
```

## Backups

- Back up the production database at least daily.
- Retain point-in-time backups if the database provider supports them.
- Include `storage/app` if production file storage is used.
- Exclude `node_modules`, `vendor`, caches, logs, and build artifacts from backups unless required by the hosting model.
- Test restore into a staging environment on a schedule.
- Protect backups with encryption and access controls matching production data sensitivity.

## Monitoring And Logging

Monitor:

- HTTP 5xx rate and latency
- Queue worker liveness and failed jobs
- Reverb process liveness and connection count
- Database CPU, connections, slow queries, and storage
- Disk usage for logs and local storage
- Login failures and assistant provider failures
- Audit log volume and unexpected privileged actions

Alert on:

- Web app unavailable
- Queue worker stopped
- Reverb stopped when realtime is enabled
- Failed jobs above threshold
- Database backup failure
- Storage usage above threshold

## Release Smoke Checks

- Public join flow issues a ticket and redirects to tracking.
- Public display board shows called and waiting tickets.
- Teller can call, start, hold/cancel, and complete tickets.
- Manager can open branch-scoped management screens.
- Reports page loads and CSV export downloads for authorized users.
- Audit logs record management, queue, and report export activity.
- Assistant public/operations scopes do not expose protected operations to public users.
