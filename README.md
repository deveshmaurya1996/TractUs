# Contract Operations Console

A full-stack, multi-tenant contract management application built for the Full-Stack Engineering Assignment. Organizations are fully isolated: every contract operation is scoped by `organizationId` on the server.

**Repository:** [github.com/deveshmaurya1996/TractUs](https://github.com/deveshmaurya1996/TractUs)

## Live deployment

| | URL |
|---|-----|
| **App** | https://tractus-devesh.duckdns.org |
| **Swagger UI** | https://tractus-devesh.duckdns.org/api/docs |
| **OpenAPI JSON** | https://tractus-devesh.duckdns.org/api/openapi.json |

Hosted on **Oracle Cloud** (Ubuntu 24.04, Mumbai) with Docker Compose, Caddy, and free DuckDNS.

**Evaluation access:** No login required — use the **organization switcher** in the header (Acme Corp or Globex Inc).

## Features

### Frontend

- **Organization switcher** — global header control; selection persisted in `sessionStorage`; create new organizations from the UI
- **Contract list** — server-side search, status filter, and pagination (MUI DataGrid)
- **Create contracts** — manual form, JSON paste editor, or `.json` file upload; optional PDF on single create
- **Bulk create** — paste or upload a JSON **array** of contracts; preview count before submit
- **Edit draft** — modal on the list page and contract detail page
- **Status actions** — Finalize (DRAFT → FINALIZED) and Archive (FINALIZED → ARCHIVED) with clear labels
- **Delete draft** — confirmation dialog on the list page and contract detail page
- **Contract detail** — overview, line items, PDF view/upload, audit history
- **Validation feedback** — Zod errors on forms and JSON input; API errors shown in snackbars
- **Real-time updates** — Socket.io refreshes the list and detail views across browser tabs
- **Empty & loading states** — overlays and empty-state messaging when no org or no contracts

### Backend

- **Multi-tenant isolation** — all contract routes require `organizationId`; cross-org access returns 404
- **Status workflow** — invalid transitions return **409 Conflict** with a clear message
- **Duplicate prevention** — duplicate PO reference or identical contract content within an org returns **409**
- **JSON validation** — shared Zod schemas in `@tractus/validation`
- **Audit trail** — events for create, update, status change, delete, and PDF upload
- **OpenAPI** — Swagger UI + JSON spec with production-aware server URL
- **Integration tests** — Vitest + Supertest (31 tests) against a separate `tractus_test` database

### DevOps

- **Docker Compose** — PostgreSQL + API + Web with `docker compose up --build`
- **CI** — GitHub Actions: test, lint, build on every push/PR
- **CD** — auto-deploy to Oracle VM after CI passes on `master`

## Architecture

```
┌─────────────┐     HTTPS      ┌──────────────┐
│   Browser   │◄──────────────►│    Caddy     │  (production only)
│  Next.js 15 │                │  :80 / :443  │
└──────┬──────┘                └──────┬───────┘
       │ REST + Socket.io              │
       ▼                               ▼
┌─────────────┐                ┌──────────────┐
│  apps/web   │                │   apps/api   │
│  TanStack   │   workspace    │   Express    │
│  Query      │◄──────────────►│   Prisma     │
│  MUI        │   packages/*   │   Socket.io  │
└─────────────┘                └──────┬───────┘
                                      │
                                      ▼
                               ┌──────────────┐
                               │  PostgreSQL  │
                               └──────────────┘
```

**Request flow**

1. User selects an organization (stored in React context + `sessionStorage`).
2. Web calls `GET /api/contracts?organizationId=…` with search/filter/pagination query params.
3. API validates input with Zod, scopes queries by `organizationId`, and returns `{ success, data, message }`.
4. Mutations emit Socket.io events; all connected clients invalidate TanStack Query caches.

**Shared packages**

| Package | Role |
|---------|------|
| `@tractus/types` | API and domain TypeScript types |
| `@tractus/validation` | Zod schemas (contracts, search, organizations) |
| `@tractus/ui` | Loading overlay, empty state, confirm dialog |
| `@tractus/utils` | Dates, status helpers, API/socket URL defaults |

## Tech Stack

| Layer | Technologies |
|-------|----------------|
| Monorepo | TurboRepo, pnpm workspaces |
| Frontend | Next.js 15, React, MUI, TanStack Query, React Hook Form, Zod, Socket.io Client |
| Backend | Express, Prisma, PostgreSQL, Socket.io, Zod, Pino |
| Infra | Docker Compose, Caddy (HTTPS), GitHub Actions, Oracle Cloud |

## Project structure

```
├── apps/
│   ├── api/
│   │   ├── prisma/           # schema, seed
│   │   ├── scripts/          # db helpers, backfill, test DB setup
│   │   └── src/
│   │       ├── routes/       # contracts, organizations, docs
│   │       ├── lib/          # prisma, duplicates, persistence, socket
│   │       └── __tests__/    # Vitest integration tests
│   └── web/
│       └── src/
│           ├── app/          # list + contract detail pages
│           ├── components/   # dialogs, org switcher, forms
│           ├── contexts/     # organization selection
│           ├── hooks/        # queries, mutations, socket
│           └── lib/          # API clients
├── packages/
│   ├── types/
│   ├── validation/
│   ├── ui/
│   └── utils/
├── docker/                   # Dockerfiles, Caddyfile, api entrypoint
├── docker-compose.yml
├── docker-compose.prod.yml
├── docker-compose.domain.yml
└── .github/workflows/        # ci.yml, deploy.yml
```

## Prerequisites

- Node.js 20+
- pnpm 10+
- Docker & Docker Compose (for full stack or Postgres only)

## Environment variables

Copy `.env.example` to `.env` at the **repo root** (enough for most local dev):

```bash
cp .env.example .env
```

Optional app-level overrides:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

| Variable | App | Description |
|----------|-----|-------------|
| `DATABASE_URL` | API | PostgreSQL connection string |
| `PORT` | API | API server port (default `3001`) |
| `LOG_LEVEL` | API | Pino log level (default `info`) |
| `API_PUBLIC_URL` | API | Public API origin for OpenAPI/Swagger |
| `TRUST_PROXY` | API | Set to `true` behind a reverse proxy |
| `DOMAIN` | Caddy | Public hostname when using domain compose |
| `NEXT_PUBLIC_API_URL` | Web | Frontend API base URL (baked in at **web build time**) |
| `NEXT_PUBLIC_SOCKET_URL` | Web | Socket.io server URL (baked in at **web build time**) |

**Loading order:** root `Tract-Us/.env` first; `apps/api/.env` or `apps/web/.env.local` override if present.

## Running locally

### Option A — Docker (recommended)

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:3001 |
| Swagger | http://localhost:3001/api/docs |
| PostgreSQL | localhost:5433 (host) / `postgres:5432` (internal) |

On first start the API container runs `db:push`, `db:backfill-content-hash`, and `db:seed` (seed skips if data already exists).

Stop with `docker compose down`.

### Option B — Native (pnpm)

1. **Start PostgreSQL** (Docker is fine for DB only):

   ```bash
   docker compose up -d postgres
   ```

2. **Install and prepare the database:**

   ```bash
   pnpm install
   pnpm db:generate
   pnpm db:push
   pnpm db:seed
   ```

3. **Start dev servers:**

   ```bash
   pnpm dev
   ```

   - Frontend: http://localhost:3000
   - API: http://localhost:3001

## Database schema and migrations

This project uses **Prisma `db push`** (schema sync) rather than versioned SQL migrations — appropriate for the assignment and Docker-first workflow.

Schema: `apps/api/prisma/schema.prisma`

Notable fields:

- `Contract.contentHash` — SHA-256 of normalized JSON; used for duplicate-content detection
- `Contract.deletedAt` — soft delete for draft contracts

**Production / Docker startup** (`docker/api-entrypoint.sh`):

1. `pnpm db:push` — apply schema
2. `pnpm db:backfill-content-hash` — fill `contentHash` for any legacy rows
3. `pnpm db:seed` — seed demo data if needed
4. Start API

Manual backfill (after schema changes):

```bash
pnpm --filter @tractus/api db:backfill-content-hash
```

## Seed data

```bash
pnpm db:seed          # skip if contracts already exist
pnpm db:seed:force    # wipe and reseed
```

`pnpm db:seed` skips when the expected contract count is already present. After `pnpm test` (which uses `tractus_test`), dev data is untouched; reseed dev with `pnpm db:seed:force` if needed.

**If the UI looks empty after seeding:**

1. Confirm Postgres is running and `DATABASE_URL` points at the DB you seeded (`localhost:5433` for local Docker).
2. Hard refresh — org IDs change after reseed; clear stale `sessionStorage` or re-select an organization in the header switcher.

**Seeded content** (matches assignment: 2 orgs, 5 contracts across statuses):

| Organization | Contracts | Status mix |
|--------------|-----------|------------|
| Acme Corp | 3 | 1 DRAFT, 1 FINALIZED, 1 ARCHIVED |
| Globex Inc | 2 | 1 DRAFT, 1 FINALIZED |

Each contract includes audit events (create + status changes where applicable).

## API endpoints

### Organizations

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/organizations` | List organizations |
| `POST` | `/api/organizations` | Create organization (`{ "name": "..." }`) |

### Contracts

All contract routes except `POST /api/contracts` require `?organizationId=<uuid>`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/contracts` | List — `search`, `status`, `page`, `limit` |
| `GET` | `/api/contracts/:id` | Contract details |
| `POST` | `/api/contracts` | Create (`organizationId` + `fieldData` in body) |
| `PATCH` | `/api/contracts/:id` | Update draft only |
| `PATCH` | `/api/contracts/:id/status` | Transition status |
| `DELETE` | `/api/contracts/:id` | Soft-delete draft only |
| `GET` | `/api/contracts/:id/events` | Audit trail |
| `POST` | `/api/contracts/:id/pdf` | Upload PDF (draft, multipart `pdf`) |
| `GET` | `/api/contracts/:id/pdf` | Download/view PDF |

### Common response shapes

**Success**

```json
{ "success": true, "data": { ... } }
```

**Validation error (400)**

```json
{ "success": false, "message": "client_name: Client name is required" }
```

**Conflict (409)** — workflow or duplicate

```json
{
  "success": false,
  "message": "Only draft contracts can be edited.",
  "errors": ["po_ref"],
  "data": { "existingContractId": "..." }
}
```

Stack traces are never returned to clients; errors are logged server-side with Pino.

## API documentation

| Environment | Swagger UI | OpenAPI JSON |
|-------------|------------|--------------|
| Local | http://localhost:3001/api/docs | http://localhost:3001/api/openapi.json |
| Production | https://tractus-devesh.duckdns.org/api/docs | https://tractus-devesh.duckdns.org/api/openapi.json |

Use `organizationId` from `GET /api/organizations` for all contract calls.

## Status workflow

```
DRAFT ──► FINALIZED ──► ARCHIVED
```

| Current status | Allowed next | UI actions |
|----------------|--------------|------------|
| DRAFT | FINALIZED | Edit, delete, finalize, PDF upload |
| FINALIZED | ARCHIVED | Archive only |
| ARCHIVED | — | Read-only |

Invalid transitions (e.g. DRAFT → ARCHIVED) return **409 Conflict**.

## Real-time updates

The API emits Socket.io events after mutations:

| Event | When |
|-------|------|
| `contract.created` | New contract |
| `contract.updated` | Draft edited |
| `contract.status.changed` | Finalize or archive |
| `contract.deleted` | Draft soft-deleted |

The web app subscribes via `useContractsSocket` (list) and `useContractSocket` (detail) and invalidates TanStack Query caches — **no manual refresh** needed when testing in two browser tabs.

**Try it:** open the app in two tabs on the same contract — finalize or delete in tab A and watch tab B update automatically (list refreshes; detail shows updated status or “Contract not found” after delete).

## Tests

Requires PostgreSQL. Tests use a **separate database** (`tractus_test`) so dev seed data is not wiped:

```bash
pnpm db:push
pnpm test
pnpm lint
pnpm build
```

CI runs the same pipeline on GitHub Actions (`.github/workflows/ci.yml`).

Test suite highlights:

- Multi-tenant isolation (404 across orgs)
- Status workflow 409s
- Duplicate PO and duplicate content 409s
- JSON validation and strict schema keys
- Server-side search and pagination
- Audit events on create and status change
- Production build output (`dist/index.js` exists)

## Deployment

### Oracle Cloud (OCI)

Full stack on one Always Free VM: PostgreSQL + API + Web + Caddy (HTTPS).

**Production URLs** (single origin):

| What | URL |
|------|-----|
| App | https://tractus-devesh.duckdns.org |
| API | https://tractus-devesh.duckdns.org/api/... |
| Swagger | https://tractus-devesh.duckdns.org/api/docs |

**Quick setup**

1. Create an OCI VM (Ubuntu 22.04/24.04), open ports **22**, **80**, **443**.
2. Point a [DuckDNS](https://www.duckdns.org) subdomain at the VM public IP.
3. Clone, configure, deploy:

   ```bash
   git clone https://github.com/deveshmaurya1996/TractUs.git Tract-Us
   cd Tract-Us
   cp .env.production.example .env
   # Edit DOMAIN, NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SOCKET_URL, API_PUBLIC_URL
   bash scripts/deploy-vm.sh
   ```

   Or manually:

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.domain.yml up --build -d
   ```

On **1 GB RAM** VMs, add swap before building (`scripts/deploy-vm.sh` does this). Rebuilds can take **30–90 minutes**.

**Verify deployment**

```bash
curl https://tractus-devesh.duckdns.org/api/health
# {"status":"ok"}
```

On the VM:

```bash
cd ~/Tract-Us && git log -1 --oneline
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.domain.yml ps
```

### CI/CD

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| **CI** | Push/PR to `main`/`master` | Install → test → lint → build |
| **Deploy** | After CI succeeds on `master` (or manual) | SSH to VM → `git pull` → `docker compose up --build` → health check |

A green **CI** build alone does not update production — confirm the **Deploy** workflow also succeeded.

**Manual redeploy on the VM:**

```bash
bash scripts/redeploy-vm.sh
```

### IP-only fallback (no HTTPS)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` to `http://<PUBLIC_IP>:3001` (and API URL with `/api` suffix for the web build args).

## Required contract JSON schema

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
      "total": "number (optional, auto-calculated if omitted)"
    }
  ]
}
```

**Bulk create:** pass a JSON **array** of objects matching this schema.

## Future improvements

- Authentication and role-based access (admin vs viewer)
- Prisma migrations instead of `db push` for production schema versioning
- Socket.io rooms per organization for tighter broadcast scoping
- Debounced server-side search input
- Skeleton loaders and richer fetch-error states on the web app
- E2E tests (Playwright) for the two-tab real-time reviewer flow

## License

Built as a take-home assignment project.
