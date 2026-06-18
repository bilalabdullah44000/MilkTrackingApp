# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Milk Procurement & Distribution Management System

## Quick Start
```bash
# Start all services with Docker
cp .env.example .env
docker compose up -d

# Seed database with test data (after DB is up)
cd backend && cp .env.example .env && npm install && npm run seed

# Local dev (without Docker — needs PostgreSQL running)
cd backend && npm install && npm run start:dev   # :4000
cd frontend && npm install && npm run dev         # :3000
```

## Architecture
- **Backend**: NestJS 10 + GraphQL (code-first) + TypeORM + PostgreSQL
- **Frontend**: React 19 + Vite + MUI v5 + Apollo Client + React Hook Form + Zod
- **Auth**: JWT (access token 15m, refresh token 7d) with RBAC (OWNER / WORKER)
- **Pattern**: Clean Architecture + CQRS (Repository pattern)

## Key Commands
```bash
# Backend
cd backend
npm run test          # unit tests (Jest)
npm run test:cov      # coverage report
npm run test:e2e      # integration tests (needs running PostgreSQL)
npm run seed          # seed test data

# Frontend
cd frontend
npm run dev           # dev server at :3000
npm run type-check    # TypeScript check
npm run test:run      # Vitest unit tests
npx playwright test --config=e2e/playwright.config.ts   # E2E
```

## Seed Credentials
- **Owner**: `owner@milkdairy.com` / `Owner@1234`
- **Worker**: `worker@milkdairy.com` / `Worker@1234`

## Folder Structure
```
backend/src/
  common/           # Decorators, guards, filters, custom scalars
  config/           # NestJS ConfigModule setup
  database/seeds/   # Seed script with 30 days of sample data
  modules/
    auth/           # JWT login/refresh, Passport JWT strategy
    users/          # User management (OWNER only)
    vendors/        # Vendor CRUD (OWNER only)
    customers/      # Customer CRUD (OWNER full, Worker view)
    milk-purchases/ # Purchase transactions (OWNER only)
    milk-deliveries/# Delivery transactions (both) + bulk add
    dashboard/      # Aggregated financial stats (OWNER only)
    billing/        # Monthly statements → PDF (OWNER only)

frontend/src/
  apollo/           # Apollo Client + auth link + error handler
  contexts/         # AuthContext (JWT in localStorage)
  layouts/          # OwnerLayout (sidebar), WorkerLayout (bottom nav)
  pages/            # Feature pages (login, dashboard, vendors, etc.)
  routes/           # ProtectedRoute (auth) + OwnerRoute (RBAC)
  graphql/          # All GQL queries & mutations as gql`` tags
  utils/            # formatters.ts, pdfGenerator.ts (jsPDF)
```

## RBAC Rules
| Feature              | OWNER      | WORKER     |
|----------------------|------------|------------|
| Dashboard stats      | Full       | None       |
| Vendors              | Full CRUD  | No access  |
| Customers            | Full CRUD  | View only  |
| Purchases            | Full CRUD  | No access  |
| Deliveries           | Full CRUD  | Add only   |
| Bulk Deliveries      | Yes        | Yes        |
| Billing & Invoices   | Full       | No access  |
| Team / Users         | Full       | No access  |

## GraphQL Endpoint
`http://localhost:4000/graphql` — Apollo Sandbox available in development.

## Environment Variables
Copy `backend/.env.example` → `backend/.env` and fill in DB/JWT values.
