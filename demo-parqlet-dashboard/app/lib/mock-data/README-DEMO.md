# Demo identity

`auth-me.json` is served verbatim by `GET /api/auth/me`, so it must contain
**nothing but the response** — no `_comment` keys. Anyone can open devtools on
the demo and read it.

The demo signs in as one person and never offers a sign-in screen:

| Field | Value | Why it matters |
|---|---|---|
| `role` | `admin` | Must NOT be `super_admin`, or the super-admin navigation appears and the demo stops resembling what a client is sold. |
| `buildingId` | `e6565d1b-…702cd` | 44 East Avenue's id in `buildings.json`. If the two ever diverge, every building-scoped screen renders empty. |
| `buildingIds` / `buildings` | same building | Different screens read different shapes. The auth provider only derives the singular from the plural, never the reverse, and the building switcher renders from `buildings`. |

Changing the demo's building means changing all four together.
