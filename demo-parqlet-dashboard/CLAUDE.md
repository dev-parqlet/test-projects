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
| **Two variants** | HOA (44 East Avenue) and Apartments (Riverside Towers), chosen at the front door by `DemoGate` or via `?v=hoa` / `?v=apartments`, and switchable from the header. |
| **No super admin** | Both identities are `admin`. The super-admin console is an internal tool; showing it would misrepresent what a client buys. |

## Gotchas

- The building ids in `app/lib/demo/variants.ts` must match
  `app/lib/mock-data/buildings.json`. If they drift, every building-scoped
  screen renders empty, because the mock API filters on exactly those ids.
- `auth-me.json` is served verbatim by the API. Never put comments or notes
  in it - anyone can read it from devtools.
- Mock data is synthetic (555 numbers, `@email.com`). Keep it that way; this
  repo must never carry production data.
