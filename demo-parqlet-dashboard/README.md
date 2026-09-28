# Parqlet demo dashboard

The site behind **demo.parqlet.com**. A fork of `web-dashboard` that runs
entirely on mock data, so a prospect can click through the real product
without an account, a backend, or a database.

It shows **both** variants, switched from the header:

| Variant | Building | What it demonstrates |
|---|---|---|
| **HOA** | The Meridian | Residents share their own spots; guests are paid for in credits. |
| **Apartments** | Oakline Park | The building owns some spots and can charge a dollar extra on those; everything else is 1 credit, as in a Condo. |

## Why it is a fork and not a flag in the real dashboard

The real dashboard's mock mode exists for local development and is driven by
`NEXT_PUBLIC_MOCK_ENABLED`. Relying on that for a public site would mean one
missing environment variable turns the demo into a live client pointed at a
backend that rejects it — and that failure looks like an outage, not a
misconfiguration. Here the flag is committed in `.env.production` and inlined
at build time, so the deployed demo cannot be anything but mock.

Keeping it separate also means demo-only changes — no sign-in, a header
variant switcher, invented figures — never risk reaching a paying client.

## No sign-in

`fetchMe()` in `app/components/auth/auth-provider.tsx` resolves synchronously
from `app/lib/demo/variants.ts`. The backend and localhost auth paths were
removed rather than left unreachable, so nobody has to work out which one is
live. There is no session and no cookie.

## The data

`app/lib/mock-data/*.json`, served by the same `handleRequest` helper every
API route already uses. It is entirely synthetic — every address is a 555
number and every email is `@email.com`. No production data has ever been in
this repository.

The building ids in `app/lib/demo/variants.ts` must match `buildings.json`.
If they drift, every building-scoped screen renders empty, because the mock
API filters on exactly those ids.

## Running it

```bash
npm install
npm run dev -- --port 3005
```

## Deploying

Vercel, connected to `main`. Nothing needs to be set in the Vercel dashboard:
`.env.production` is committed on purpose and carries everything the build
needs. `NEXT_PUBLIC_API_URL` is empty, meaning "same origin", so preview
deployments work on their own URLs without being rebuilt.

`demo.parqlet.com` is a CNAME to Vercel, proxied through Cloudflare.
