# Contract Operations Console

A full-stack contract management application built for the Full-Stack Engineering Assignment.

## Live deployment

| | URL |
|---|-----|
| **App** | https://tractus-devesh.duckdns.org |
| **Swagger UI** | https://tractus-devesh.duckdns.org/api/docs |
| **OpenAPI JSON** | https://tractus-devesh.duckdns.org/api/openapi.json |

Hosted on **Oracle Cloud** (Ubuntu 24.04, Mumbai) with Docker Compose, Caddy, and free DuckDNS.

**Evaluation access:** No login required — select an organization from the dropdown to begin.

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
- **OpenAPI docs** — Swagger UI + JSON spec at `/api/docs` (production-aware server URL)
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
| `API_PUBLIC_URL` | API | Public API origin for OpenAPI/Swagger (optional; Docker sets from `NEXT_PUBLIC_SOCKET_URL`) |
| `TRUST_PROXY` | API | Set to `true` behind Nginx/Caddy when not using `NODE_ENV=production` |
| `DOMAIN` | Caddy | Public hostname (e.g. `tractus-you.duckdns.org`) when using domain compose |
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

## API Documentation

Interactive Swagger UI and machine-readable OpenAPI spec (no API keys — use `organizationId` from `GET /api/organizations`).

**Local:**

- Swagger UI: http://localhost:3001/api/docs
- OpenAPI JSON: http://localhost:3001/api/openapi.json

**Production:**

- App: https://tractus-devesh.duckdns.org
- Swagger UI: https://tractus-devesh.duckdns.org/api/docs
- OpenAPI JSON: https://tractus-devesh.duckdns.org/api/openapi.json

The spec’s `servers` URL is set from `API_PUBLIC_URL` (or `NEXT_PUBLIC_SOCKET_URL` in Docker Compose prod). Behind Caddy, set all three env vars to `https://<DOMAIN>` (see `.env.production.example`).

## Tests

Requires PostgreSQL running. Tests use a **separate database** (`tractus_test` by default) so they do not overwrite dev seed data:

```bash
pnpm db:push
pnpm test
```

Optional: set `TEST_DATABASE_URL` in `apps/api/.env` to override the test database.

If you previously ran tests against `tractus` and see **Test Client** instead of Acme/Globex data, restore dev seed:

```bash
pnpm db:seed:force
```

## Status Workflow

| Status | Allowed actions |
|--------|-----------------|
| DRAFT | Edit, delete, finalize |
| FINALIZED | Archive only |
| ARCHIVED | None |

## Deployment

### Oracle Cloud (OCI) — recommended

Deploy the **full stack on one Always Free VM** with Docker Compose (PostgreSQL + API + Web + Caddy).

**Prerequisites:** OCI account, Always Free VM (Ampere A1 or `VM.Standard.E2.1.Micro`), Ubuntu 22.04/24.04, public IP, free [DuckDNS](https://www.duckdns.org) subdomain. On **1 GB RAM** shapes, add **2 GB swap** before building (see `scripts/deploy-vm.sh`).

#### One URL for everything (recommended for assignments)

Frontend, API, Socket.io, and Swagger share the same hostname:

| What | URL |
|------|-----|
| App | `https://tractus-devesh.duckdns.org` |
| API | `https://tractus-devesh.duckdns.org/api/...` |
| Swagger UI | `https://tractus-devesh.duckdns.org/api/docs` |

1. **Create a VM** (OCI Console → Compute → Instances).

2. **Get a free subdomain** at [duckdns.org](https://www.duckdns.org) and point it at your VM **public IP**.

3. **Open ingress ports** (VCN security list → Default Security List → Add Ingress Rules):
   - `22` — SSH
   - `80` — HTTP (Let's Encrypt)
   - `443` — HTTPS  
   Do **not** expose Postgres (`5433`) or app ports `3000`/`3001` (Caddy handles public traffic).

4. **SSH into the VM** and install Docker:

   ```bash
   sudo apt update && sudo apt install -y git docker.io docker-compose-v2
   sudo usermod -aG docker $USER
   # log out and back in
   ```

5. **Clone and configure** (or run the one-shot script):

   ```bash
   git clone https://github.com/deveshmaurya1996/TractUs.git Tract-Us
   cd Tract-Us
   cp .env.production.example .env
   ```

   Edit `.env` — set your DuckDNS name (all four values must match):

   ```env
   DOMAIN=tractus-devesh.duckdns.org
   NEXT_PUBLIC_API_URL=https://tractus-devesh.duckdns.org/api
   NEXT_PUBLIC_SOCKET_URL=https://tractus-devesh.duckdns.org
   API_PUBLIC_URL=https://tractus-devesh.duckdns.org
   ```

   **Quick deploy** (swap + Docker + compose):

   ```bash
   bash scripts/deploy-vm.sh
   ```

6. **Build and start** (includes Caddy for HTTPS):

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.domain.yml up --build -d
   ```

   First start runs `db:push` and `db:seed` automatically (seed only if the DB is empty/partial). Caddy requests a Let's Encrypt certificate on first visit (may take 1–2 minutes after ports 80/443 are open).

7. **Verify:** open https://tractus-devesh.duckdns.org, select **Acme Corp** or **Globex Inc**. Swagger: https://tractus-devesh.duckdns.org/api/docs.

**Useful commands on the VM:**

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.domain.yml logs -f caddy
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.domain.yml logs -f api
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.domain.yml ps
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.domain.yml exec api pnpm db:seed:force
```

#### Auto-deploy on push to `master`

After CI passes, GitHub Actions SSHs into the VM, runs `git pull`, and rebuilds Docker (`/.github/workflows/deploy.yml`).

**One-time setup** — add these [repository secrets](https://github.com/deveshmaurya1996/TractUs/settings/secrets/actions):

| Secret | Value |
|--------|-------|
| `OCI_HOST` | `161.118.180.183` |
| `OCI_USER` | `ubuntu` |
| `OCI_SSH_PRIVATE_KEY` | Contents of your `ssh-key-2026-06-25.key` file |

From your machine (with [GitHub CLI](https://cli.github.com/) logged in):

```bash
gh secret set OCI_HOST --body "161.118.180.183" --repo deveshmaurya1996/TractUs
gh secret set OCI_USER --body "ubuntu" --repo deveshmaurya1996/TractUs
gh secret set OCI_SSH_PRIVATE_KEY --repo deveshmaurya1996/TractUs < "C:\Users\deves\Downloads\ssh-key-2026-06-25.key"
```

**Flow:** push to `master` → CI runs tests/lint/build → if green, Deploy workflow runs → production updates at https://tractus-devesh.duckdns.org

Rebuilds on the 1 GB VM can take **30–90 minutes**. You can also trigger a deploy manually: GitHub → **Actions** → **Deploy** → **Run workflow**.

**Manual redeploy on the VM** (without GitHub Actions):

```bash
bash scripts/redeploy-vm.sh
```

#### IP-only fallback (no DuckDNS)

Open ports `22`, `3000`, `3001` on OCI. In `.env`:

```env
NEXT_PUBLIC_API_URL=http://YOUR_PUBLIC_IP:3001/api
NEXT_PUBLIC_SOCKET_URL=http://YOUR_PUBLIC_IP:3001
```

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

- App: `http://<PUBLIC_IP>:3000`
- Swagger: `http://<PUBLIC_IP>:3001/api/docs`

**Notes:**
- Uses **PostgreSQL in Docker**, not Oracle Database — no Prisma changes needed.
- PDF uploads persist in the `uploads_data` Docker volume.
- Set an OCI **billing alert** and **stop/delete** the VM when finished to stay on free tier.

### Other clouds (AWS / Azure / GCP)

Same pattern: small VM + Docker Compose (+ `docker-compose.domain.yml` for a single HTTPS URL), or split API (VM/container) + managed Postgres. Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` to your public API URL at **web build time**.

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
