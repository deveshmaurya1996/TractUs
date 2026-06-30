# Contract Operations Console

A full-stack contract management application built for the Full-Stack Engineering Assignment.

## Features

- **Organization-scoped operations** — all contract API calls require an `organizationId`
- **JSON upload & validation** — upload contract JSON with Zod schema validation and field-level error feedback
- **Contract CRUD** — create, read, update, soft-delete (draft only)
- **Status workflow** — DRAFT → FINALIZED → ARCHIVED (invalid transitions return 409)
- **Search & filter** — server-side search by client name, contract ID, PO ref; filter by status
- **Pagination** — server-side pagination on the contract list
- **Audit trail** — full event history per contract (create, update, status change, delete)
- **Real-time updates** — Socket.io broadcasts status changes across browser tabs
- **PDF attachments** — upload and view PDF on draft contracts
- **API tests** — Vitest + Supertest integration tests
- **Docker Compose** — full stack (PostgreSQL + API + Web) with `docker compose up`

## Tech Stack

| Layer | Technologies |
|-------|----------------|
| Monorepo | TurboRepo, pnpm |
| Frontend | Next.js 15, React, MUI, TanStack Query, React Hook Form, Zod, Socket.io Client |
| Backend | Express, Prisma, PostgreSQL, Socket.io, Zod, Pino |
| Shared | `@tractus/types`, `@tractus/validation`, `@tractus/ui`, `@tractus/utils` |

## Prerequisites

- Node.js 20+
- pnpm 10+
- Docker & Docker Compose

## Environment Variables

Copy `.env.example` to `.env` at the **repo root** (enough for most local dev):

```bash
cp .env.example .env
```

**App-level examples** (optional overrides):

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

| Variable | App | Description |
|----------|-----|-------------|
| `DATABASE_URL` | API | PostgreSQL connection string |
| `PORT` | API | API server port (default `3001`) |
| `LOG_LEVEL` | API | Pino log level (default `info`) |
| `NEXT_PUBLIC_API_URL` | Web | Frontend API base URL |
| `NEXT_PUBLIC_SOCKET_URL` | Web | Socket.io server URL |

**Env loading order** (root first, app-level overrides if present):

| App | Root `.env` | Optional override |
|-----|-------------|-------------------|
| API | `Tract-Us/.env` | `apps/api/.env` |
| Web | `Tract-Us/.env` | `apps/web/.env` or `.env.local` |

You do **not** need separate env files in `apps/api` or `apps/web` unless you want to override values locally.

## Local Development

### Option A — Docker (full stack)

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- API: http://localhost:3001
- PostgreSQL: localhost:5433 (host) / `postgres:5432` (internal)

Stop with `docker compose down`.

### Option B — Native (pnpm)

1. **Start PostgreSQL**
   ```bash
   docker-compose up -d
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Generate Prisma client, push schema & seed**
   ```bash
   pnpm db:generate
   pnpm db:push
   pnpm db:seed
   ```
   Schema lives at `apps/api/prisma/schema.prisma`.

4. **Start dev servers**
   ```bash
   pnpm dev
   ```

   This starts the API and web app in parallel (no Turbo required on Windows).

   - Frontend: http://localhost:3000
   - API: http://localhost:3001

## Seed Data

Run the seed script after `db:push`:

```bash
pnpm db:seed
```

To **reset and reseed** (clears all data first):

```bash
pnpm db:seed:force
```

`pnpm db:seed` skips only when **contracts already exist**. If the DB is empty (e.g. after `pnpm test`, which wipes data), a normal `pnpm db:seed` will populate it — you do not need `--force` unless you want to replace existing contracts.

**If the UI looks empty after seeding:**
1. Confirm Postgres is running and `DATABASE_URL` in `apps/api/.env` points to `localhost:5433` (same DB you seeded).
2. Refresh the app — org IDs change after reseed; stale `sessionStorage` can point at old organizations.
3. Run `pnpm db:seed` again (or `pnpm db:seed:force` to fully reset).

Seeds:
- **2 organizations**: Acme Corp (6 contracts), Globex Inc (6 contracts)
- **12 contracts** across DRAFT, FINALIZED, and ARCHIVED statuses
- **Audit events** for each contract (create + status changes)

## API Endpoints

### Organizations
- `GET /api/organizations` — list organizations

### Contracts (all routes require `?organizationId=<uuid>` except `POST`)
- `GET /api/contracts` — list with search, status filter, pagination
- `GET /api/contracts/:id` — contract details
- `POST /api/contracts` — create contract (`organizationId` in body)
- `PATCH /api/contracts/:id` — update draft contract
- `PATCH /api/contracts/:id/status` — transition status
- `DELETE /api/contracts/:id` — soft-delete draft contract
- `GET /api/contracts/:id/events` — audit trail
- `POST /api/contracts/:id/pdf` — upload PDF (draft only, multipart field `pdf`)
- `GET /api/contracts/:id/pdf` — download/view PDF

## Tests

Requires PostgreSQL running (same `DATABASE_URL` as dev):

```bash
pnpm db:push
pnpm test
```

## Status Workflow

| Status | Allowed actions |
|--------|-----------------|
| DRAFT | Edit, delete, finalize |
| FINALIZED | Archive only |
| ARCHIVED | None |

## Deployment

> **Note:** Deploy the API and web app separately (e.g. Railway/Render for API + Vercel for Next.js), with a managed PostgreSQL instance.

1. Set all environment variables on both services
2. Run `pnpm db:push` against the production database
3. Build: `pnpm build`
4. Start API: `pnpm --filter @tractus/api start`
5. Start web: `pnpm --filter @tractus/web start`

**Deployed URL:** _Add your production URL here after deployment_

**Evaluation access:** No login required — select an organization from the dropdown to begin.

## Project Structure

```
├── apps/
│   ├── api/          # Express REST API + Socket.io + Prisma
│   └── web/          # Next.js frontend
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── validation/   # Zod schemas
│   ├── ui/           # Shared UI components
│   └── utils/        # Shared utilities (date-fns, API URLs)
├── docker-compose.yml
└── turbo.json
```

## Required Contract JSON Schema

```json
{
  "client_name": "string (required)",
  "po_ref_no": "string (required)",
  "po_date": "YYYY-MM-DD (required)",
  "payment_terms": "string (optional)",
  "delivery_terms": "string (optional)",
  "items": [
    {
      "description": "string (required)",
      "quantity": "number > 0 (required)",
      "quantity_unit": "string (optional)",
      "unit_price": "number >= 0 (required)",
      "pricing_unit": "string (optional)",
      "total": "number (optional)"
    }
  ]
}
```
