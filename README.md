# SmartQ - Cloud Queue Management System

SmartQ is a digital, cloud-based queue management system built to remove the need for physical waiting lines. Customers can join a queue remotely via their mobile device, track their position in real time across dynamic gradient-infused ticket views, while staff manage operations via a premium, high-density operations dashboard.

This monolithic platform acts as a strict, production-ready graduation project, built rigorously on modern SaaS architecture using **Laravel 12**, **React 19**, **Inertia.js**, and highly styled primitives provided by **shadcn/ui** and **Tailwind CSS**.

---

## ⚡ Tech Stack

*   **Backend:** Laravel 12, PHP 8.3+, MySQL 8
*   **Frontend:** React 19, TypeScript, Inertia.js
*   **Styling & UI:** Tailwind CSS, shadcn/ui, Recharts, customized tokens.
*   **Testing:** Pest (Backend), Playwright (E2E / Visual Regression)

## 🏗️ Architecture & Philosophy

SmartQ is crafted as a **Modular Monolith**. It avoids premature microservices logic, keeping all queue transitions, ticket generation locking, priority algorithms, and domain models safely within Laravel. The repository strictly enforces clean boundaries:

*   **Service Layer & Thin Controllers:** Complex queue operations (e.g., ticket assignment, transactional queue sequencing, safe ticket state transitions) are isolated in `App\Services\QueueService.php`.
*   **Role-Based Access Control (RBAC):** Leverages Spatie's permission package directly in the routing and middleware.
*   **Atomic Front-end Components:** The UI is systematically broken down into reusable primitives (`PageHeader`, `KpiCard`, `TicketStatusBadge`) without styling inconsistencies.
*   **AESTHETICS:** The UI is explicitly designed to replicate Top-Tier operational SaaS software. Clean colors, proper visual density logic, multi-platform adaptive UI flow, and smooth layout components are primary implementation goals.

---

## 🚀 Setup & Installation (Local Development)

### 1. Requirements
*   PHP 8.3+
*   Node.js 20+
*   Composer
*   MySQL/MariaDB (or SQLite for fast testing)

### 2. Bootstrapping
Clone the repository and install dependencies:
```bash
git clone https://github.com/your-username/smartq.git
cd smartq

composer install
npm install
```

### 3. Environment & Database
```bash
cp .env.example .env
php artisan key:generate
```
The default in `.env.example` is **MySQL** (matching the production target and CI). Create the database and update the `DB_*` values in `.env`:
```bash
mysql -u root -p -e "CREATE DATABASE smartq;"
```
For fast local testing without MySQL, switch to SQLite by uncommenting the SQLite block in `.env.example` (and creating `database/database.sqlite`).

Then migrate and optionally seed. **Note:** The seeder builds robust, realistic history to immediately populate dashboard charts.
```bash
php artisan migrate --seed
```

### 3a. CI / GitHub Secrets
The GitHub Actions workflows (`ci.yml`, `tests.yml`) connect to a MySQL service container using a single repository secret. Set it once in **Settings → Secrets and variables → Actions**:

| Secret | Used by | Notes |
| :--- | :--- | :--- |
| `DB_PASSWORD` | `mysql` service container, Pest, PHPUnit, Playwright | Any non-empty value (CI databases are ephemeral) |

### 4. Running the application
In separate terminals, run your local backend server and Vite bundler tool:
```bash
php artisan serve
npm run dev
```

---

## 🧪 Testing

SmartQ heavily enforces code stability via multi-layered testing.

**Run Backend Logic Tests (Pest)**
Validates Queue priority domains, RBAC scope boundaries, branch protections, and transactional ticketing APIs.
```bash
php artisan test
```

**Run End-to-End Tests (Playwright)**
Make sure everything flows smoothly from a user's perspective, running through UI auth forms to queue wait states.
```bash
npx playwright test
```

---

## 🔑 Demo Credentials

To experience the platform immediately following database seeding, utilize these exact credentials:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@smartq.local` | `password` |
| **Manager** | `manager@smartq.local` | `password` |
| **Teller** | `teller@smartq.local` | `password` |

*(Customers do not require authentication to join the public queue web flow)*

---

## 🌐 Deployment Notes (Production)

SmartQ is designed to function strictly as a standard Laravel monolithic deployment.
1. Target an Ubuntu VPS running **Laravel Forge** or Dockerize the app using Laravel Sail / Octane natively.
2. The GitHub Workflow (`.github/workflows/ci.yml`) is automatically designed to run backend tests, `npm build` checking, and E2E verifications against each commit.
3. Queue monitoring utilizes background database queuing or Redis based off `.env` mapping. Ensure queue workers are daemonized (`php artisan queue:listen`).
