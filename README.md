# SmartQ Root App

SmartQ is a Laravel 12 + Inertia React 19 queue management application. This repository contains the root app only.

## Stack

- Backend: Laravel 12, PHP 8.2+
- Frontend: Inertia.js, React 19, TypeScript, Tailwind CSS
- Auth: Laravel session auth
- Roles/permissions: Spatie Permission
- Tests: PHPUnit via `php artisan test` and `composer test`
- Build: Vite

## Local Setup

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
```

Run the app in separate terminals:

```bash
php artisan serve
npm run dev
```

## Test And Build Commands

These are the commands currently used for local verification and CI:

```bash
npm run typecheck
npm run lint
npm run build
php artisan test --testdox
composer test
```

## Playwright E2E Smoke

The root app now includes a minimal Playwright smoke suite for:

- public queue join and track
- teller call/start/complete lifecycle
- management page rendering and dialog-open checks
- reports page rendering

Run it with:

```bash
npm run e2e
```

For local browser debugging:

```bash
npm run e2e:headed
```

The suite uses a dedicated `.env.e2e` file and a deterministic `E2eSmokeSeeder`. It does not rely on demo or production data.

## Access Model

- Public users can join the queue, track a ticket, view public branch display screens, and use the public assistant for ticket-status lookups only.
- Staff-only routes are protected by authenticated, active-user, and staff-role middleware.
- `super_admin` can access all internal areas.
- `manager` can access branch-scoped reports and management areas allowed by permission.
- `teller` can access the teller console, dashboard, tickets, and operations assistant.
- Public self-registration is disabled. Staff accounts are created through management user CRUD.

## Teller Lifecycle

The teller console follows the enforced backend lifecycle:

```text
waiting -> called -> in_service -> on_hold -> in_service -> completed
```

If supported by the current ticket state, tellers may also cancel a ticket. Backend validation rejects invalid transitions, inactive tellers, tellers without active counters, and cross-scope mutations.

## Assistant Boundaries

- Public assistant scope is limited to ticket-safe lookups.
- Operations assistant access requires an active authenticated staff user.
- Assistant page context is intentionally minimized before requests are sent to the backend.

## CI And Deployment Notes

- `.github/workflows/ci.yml` runs the real backend and frontend verification commands listed above.
- `.github/workflows/ci.yml` also runs the Playwright smoke suite against the root app with a dedicated SQLite E2E database.
- No visual-regression suite is configured in this root app today.
- `.github/workflows/deploy.yml` is a readiness stub only. It verifies production dependency installation and asset building, but it does not perform a server deployment.
