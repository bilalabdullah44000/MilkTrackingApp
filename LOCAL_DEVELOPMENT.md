# Local Development Guide

This guide covers two ways to run the app locally: using **Docker Compose** (recommended, requires no manual DB setup) and running each service **manually** (more control, faster hot-reload).

---

## Prerequisites

| Tool | Minimum version | Check |
|------|----------------|-------|
| Node.js | 20.x | `node --version` |
| npm | 10.x | `npm --version` |
| Docker & Docker Compose | 24.x / v2 | `docker --version` |
| PostgreSQL *(manual path only)* | 15 or 16 | `psql --version` |

---

## Option A — Docker Compose (Recommended)

Everything (database, backend, frontend) runs in containers. No manual DB setup required.

### 1. Clone and configure environment

```bash
# Copy the root env file (controls Docker service ports)
cp .env.example .env

# Copy the backend env file (controls NestJS config)
cp backend/.env.example backend/.env
```

The defaults work out of the box. Edit `backend/.env` only if you need custom JWT secrets for your local setup.

### 2. Start all services

```bash
docker compose up -d
```

This starts:
- **postgres** on port `5432`
- **backend** (NestJS) on port `4000`
- **frontend** (Vite dev server) on port `3000`

Check that all three are running:

```bash
docker compose ps
```

### 3. Seed the database

Run this once after the first `up` (or after a data wipe):

```bash
docker compose exec backend npm run seed
```

### 4. Open the app

| URL | What it is |
|-----|-----------|
| `http://localhost:3000` | Frontend (React app) |
| `http://localhost:4000/graphql` | GraphQL Sandbox (Apollo) |

### 5. Log in

| Role | Email | Password |
|------|-------|----------|
| Owner (admin) | `owner@milkdairy.com` | `Owner@1234` |
| Worker | `worker@milkdairy.com` | `Worker@1234` |

### Stopping the app

```bash
docker compose down          # stop containers, keep DB data
docker compose down -v       # stop and wipe the database volume
```

---

## Option B — Manual (No Docker)

Run each service directly on your machine for faster hot-reload and easier debugging.

### 1. Create and start a PostgreSQL database

If you have PostgreSQL installed locally:

```bash
# Connect as the postgres superuser
psql -U postgres

# Inside psql, run:
CREATE USER milk_user WITH PASSWORD 'milk_pass';
CREATE DATABASE milk_db OWNER milk_user;
\q
```

Or, if you prefer to keep Docker only for the database:

```bash
docker compose up -d postgres
```

### 2. Configure the backend

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and verify these values match your database:

```env
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=milk_user
DB_PASSWORD=milk_pass
DB_NAME=milk_db

JWT_SECRET=any_long_random_string_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=another_long_random_string_here
JWT_REFRESH_EXPIRES_IN=7d

PORT=4000
CORS_ORIGIN=http://localhost:3000
```

### 3. Install backend dependencies and run

```bash
# Still inside backend/
npm install

# Start the NestJS dev server (auto-restarts on file changes)
npm run start:dev
```

The backend starts at `http://localhost:4000`.  
TypeORM's `synchronize: true` (in development mode) will auto-create all database tables on first startup — no manual migration needed.

You should see:

```
Application running on: http://localhost:4000/graphql
```

### 4. Seed the database

Open a second terminal:

```bash
cd backend
npm run seed
```

This inserts two users, three vendors, eight customers, and 30 days of purchase and delivery records. You will see confirmation output ending with:

```
=== Seed Complete ===
Owner login: owner@milkdairy.com / Owner@1234
Worker login: worker@milkdairy.com / Worker@1234
```

> Re-running the seed script is safe — it clears existing data before inserting.

### 5. Configure and run the frontend

Open a third terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend starts at `http://localhost:3000`. It proxies all `/graphql` requests to `http://localhost:4000`, so no extra configuration is needed.

### 6. Open the app

Navigate to `http://localhost:3000` and log in with either seed account from the table above.

---

## Running Tests

### Backend unit tests

```bash
cd backend
npm run test          # run once
npm run test:watch    # watch mode
npm run test:cov      # with coverage report (target: 80%)
```

### Backend integration tests (needs a running database)

```bash
cd backend
npm run test:e2e
```

These tests create and tear down their own records, so they are safe to run against your local dev database.

### Frontend unit tests

```bash
cd frontend
npm run test:run      # run once (Vitest)
npm run test          # watch mode
```

### End-to-end tests (Playwright)

The app must be running before you execute E2E tests.

```bash
# Install browsers once
cd frontend
npx playwright install --with-deps chromium

# Run all E2E specs
npx playwright test --config=e2e/playwright.config.ts

# Run a specific spec
npx playwright test e2e/auth.spec.ts --config=e2e/playwright.config.ts

# Open the HTML report after a run
npx playwright show-report
```

---

## Common Issues

### `ECONNREFUSED` on backend startup

The backend cannot reach PostgreSQL. Check that:
1. The database container or service is running (`docker compose ps` or `pg_isready -U milk_user -d milk_db`).
2. `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` in `backend/.env` match your database.

### `Port 4000 already in use`

Another process is occupying the port. Find and stop it:

```bash
lsof -i :4000        # find the PID
kill -9 <PID>
```

Or change `PORT=4001` in `backend/.env` and update the `proxy` target in `frontend/vite.config.ts` to match.

### Tables not found / `relation does not exist`

TypeORM `synchronize` creates tables on startup. If it is not running:
- Confirm `NODE_ENV=development` in `backend/.env` (synchronize is disabled in production).
- Check the backend startup logs for TypeORM connection errors.

### Seed fails with `duplicate key value`

The database already has seed data from a previous run. The seed script deletes all records before inserting, but if there are foreign-key constraints blocking the delete, clear the tables manually:

```bash
psql -U milk_user -d milk_db -c "TRUNCATE milk_deliveries, milk_purchases, customers, vendors, users RESTART IDENTITY CASCADE;"
```

Then re-run `npm run seed`.

### GraphQL Sandbox not loading

The Apollo Sandbox is enabled in development mode (`NODE_ENV=development`). Make sure that variable is set in `backend/.env`, then restart the backend.

---

## Project Structure Reference

```
app/
├── docker-compose.yml       # Orchestrates all three services
├── .env.example             # Root env (Docker port mappings)
├── backend/
│   ├── .env.example         # Backend env template — copy to .env
│   ├── src/
│   │   ├── modules/         # Feature modules (auth, vendors, customers, …)
│   │   ├── common/          # Shared guards, decorators, scalars
│   │   └── database/seeds/  # Seed script
│   └── test/                # Integration (e2e) test specs
└── frontend/
    ├── src/
    │   ├── pages/           # One page component per route
    │   ├── layouts/         # OwnerLayout (sidebar), WorkerLayout (bottom nav)
    │   ├── graphql/         # All GQL query and mutation definitions
    │   └── utils/           # formatters, PDF generator
    └── e2e/                 # Playwright specs + config
```
