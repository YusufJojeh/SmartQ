# Realtime Broadcasting

SmartQ uses Laravel broadcast events for branch-scoped queue updates. The product is single-organization and multi-branch; there are no tenants or SaaS channels.

## Current Implementation

Backend events are dispatched from `App\Services\QueueService` after the database transaction completes:

| Event | Trigger | Channel | Broadcast name | Payload notes |
| --- | --- | --- | --- | --- |
| `TicketJoined` | public ticket issue | `branch.{branch_id}` | `ticket.joined` | ticket id, branch id, service id, display code, status, service name, priority, timestamp |
| `TicketCalled` | teller calls next | `branch.{branch_id}` | `ticket.called` | ticket id, branch id, service id, counter id/name, display code, status, timestamp |
| `TicketCompleted` | teller completes service | `branch.{branch_id}` | `ticket.completed` | ticket id, branch id, service id, counter id, display code, status, timestamp |
| `TicketCancelled` | teller/manager/admin cancels | `branch.{branch_id}` | `ticket.cancelled` | ticket id, branch id, service id, counter id, display code, status, timestamp |

All queue events implement `ShouldBroadcastNow` so display boards and teller consoles receive updates without waiting for a queue worker. Payloads intentionally exclude customer name, phone, teller details, and notes.

## Frontend Integration

The frontend initializes Echo in `resources/js/echo.ts` only when `VITE_REVERB_APP_KEY` is present. If the key is missing, no websocket connection is attempted and the existing polling/focus refresh remains the fallback.

Branch listeners are centralized in `resources/js/hooks/use-branch-realtime.ts`.

Current listeners:

- Public display board: `resources/js/pages/public/display.tsx`
- Teller console: `resources/js/pages/teller/console.tsx`

Both screens listen to `branch.{id}` and reload only the required Inertia props when queue events arrive.

## Local Reverb Setup

Install dependencies:

```bash
composer install
npm install
```

Set local `.env` values:

```env
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=smartq
REVERB_APP_KEY=smartq-local-key
REVERB_APP_SECRET=smartq-local-secret
REVERB_HOST=127.0.0.1
REVERB_PORT=8080
REVERB_SCHEME=http
REVERB_ALLOWED_ORIGINS=http://localhost,http://127.0.0.1:8000
REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=8080

VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

Run the app, Vite, queue worker, and Reverb:

```bash
php artisan serve
npm run dev
php artisan queue:work
php artisan reverb:start --host=0.0.0.0 --port=8080
```

## Docker Notes

`docker-compose.yml` already defines a `reverb` service:

```bash
docker compose up -d app nginx db redis worker scheduler reverb
```

Expose Reverb through the same trusted network path as the Laravel app. For production TLS, terminate HTTPS/WSS at the proxy and set:

```env
REVERB_SCHEME=https
REVERB_PORT=443
VITE_REVERB_SCHEME=https
VITE_REVERB_PORT=443
```

## Remaining Realtime Work

- Add public ticket tracking listeners if the tracking page needs websocket updates instead of polling/manual refresh.
- Add a browser-level websocket smoke test for Reverb in an environment where `BROADCAST_CONNECTION=reverb` and a Reverb process are running.
- Set production `REVERB_ALLOWED_ORIGINS` to the exact SmartQ domain list.
