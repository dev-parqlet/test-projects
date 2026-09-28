# Parqlet demo dashboard — notes

This is the site behind **demo.parqlet.com**. It is a fork of `web-dashboard`
that runs entirely on mock data. See README.md for why it is a fork.

**Do not copy deploy instructions from `web-dashboard` into this folder.**
That repo deploys to GCP VMs via GitHub Actions; this one deploys through
Vercel from the `dev-parqlet/test-projects` repo with the root directory set
to `demo-parqlet-dashboard`. The inherited workflows were deleted on purpose.

## Running locally

```bash
npm install
npm run dev -- --port 3005
```

## What is different from the real dashboard

| | |
|---|---|
| **Mock mode** | Pinned in the committed `.env.production`, inlined at build time. It cannot be switched off by a Vercel setting, which is the point: a missing env var must never turn the demo into a live client pointed at a backend that rejects it. |
| **Auth** | `fetchMe()` resolves synchronously from `app/lib/demo/variants.ts`. There is no session, no cookie and no `/api/auth/me` call. The backend and localhost paths were deleted rather than left unreachable. |
| **Two variants** | HOA (The Meridian) and Apartments (Oakline Park), chosen at the front door by `DemoGate` or via `?v=hoa` / `?v=apartments`, and switchable from the header. |
| **No super admin** | Both identities are `admin`. The super-admin console is an internal tool; showing it would misrepresent what a client buys. |

## Gotchas

- The building ids in `app/lib/demo/variants.ts` must match
  `app/lib/mock-data/buildings.json`. If they drift, every building-scoped
  screen renders empty, because the mock API filters on exactly those ids.
- `auth-me.json` is served verbatim by the API. Never put comments or notes
  in it - anyone can read it from devtools.
- Mock data is synthetic (555 numbers, `@email.com`, the two demo domains
  `themeridian.com` / `oaklinepark.com`). Keep it that way; this repo must
  never carry production data.
- **Dates are rebased at serve time.** Every mock JSON file is authored
  against `DEMO_EPOCH` in `app/lib/handle-request.ts`, and `handleMock`
  shifts every date forward by the whole days between that epoch and today.
  It exists because the corpus is a fixed dump and a fixed dump ages: by
  September, every ticket and invoice on screen was four months old. Author
  new mock data against the epoch, never against "today", or it will drift
  from the rest of the corpus by however long the two differ.
- The demo has exactly TWO buildings. A third (Parkview Condos) was carried
  over from the production dump; no demo identity could reach it, so every
  building-scoped screen hid it and every unscoped one leaked it.
