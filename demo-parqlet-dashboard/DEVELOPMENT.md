# Development

## Quick Start

```bash
cd ~/work/parqlet-admin-dashboard
npm run dev -- --port 3005
```

Open **http://localhost:3005** — the app loads with mock data automatically.

No backend, no database, no Caddy needed.

---

## How It Works

All data comes from `app/lib/mock-data/*.json` files. Next.js API routes under `app/api/*` serve this data locally — the frontend never makes external requests.

Key routes:
- `GET /api/buildings` — all 3 buildings
- `GET /api/bookings?buildingId=&tab=` — filtered bookings
- `GET /api/residents?buildingId=` — filtered residents
- `GET /api/auth/me` — current user (see below)

---

## Switching User Roles

A floating **DEV MODE** toggle in the bottom-right corner lets you switch between:

| User | Role | Access |
|------|------|--------|
| Margo | Super Admin | All 3 buildings |
| Yaroslav | Super Admin | All 3 buildings |
| Jordan Manager | HOA Admin | 44 East Avenue only |
| Mike Chen | HOA Admin | Riverside Towers only |

Selection persists in localStorage. Only visible on `localhost`.

---

## Mock Data

All data lives in `app/lib/mock-data/`:

| File | Contents |
|------|----------|
| `buildings.json` | 3 buildings (Austin TX, Austin TX, Denver CO) |
| `residents.json` | 75 residents (25 per building) |
| `bookings.json` | 65 bookings across all buildings |
| `alerts.json` | Alerts per building |
| `support_tickets.json` | Support tickets |
| `sync_logs.json` | Sync history |
| `invoices.json` | Billing history |
| `building_credits.json` | Credit counters |
| `users.json`, `subscriptions.json`, `team_members.json` | Auth + billing |

To refresh data from the real database, run the export script or manually query the DB and update the JSON files.

---

## Architecture

### Frontend (`parqlet-admin-dashboard`)
- Next.js 16.2, App Router, TypeScript, Tailwind CSS v4, shadcn/ui v4
- Design tokens: `app/tokens.css`
- Route groups: `(hoa)` = HOA admin pages, `(superadmin)` = super admin pages

### Backend (`parqlet-backend`)
- Hono + Drizzle ORM + PostgreSQL
- Port 3002 (Docker), proxied via Caddy to `api.parqlet.com`
- Not needed for local design work

### Database (Production PostgreSQL)
- Hosted on GCP VM at `34.23.109.24`
- Container: `parqlet-db` on `parqlet-net`
- Dev connection: `postgres://postgres:***@localhost:5432/parqlet`

---

## Scripts

```bash
npm run dev        # Next.js dev server on :3005
npm run build      # Production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

---

## Production Deploy

Frontend: GH Actions builds Docker image, deployed to GCP VM via `appleboy/ssh-action`.

Backend: Docker container on port 3002, Caddy reverse-proxies `api.parqlet.com` → `localhost:3002`.

Env var `NEXT_PUBLIC_API_URL` is baked into the bundle at build time — change it and rebuild.
