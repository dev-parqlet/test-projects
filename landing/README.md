# ParQlet Landing Page

Static marketing site for ParQlet — served from Cloudflare Pages.

**Live:** https://parqlet-landing.pages.dev
**Custom domain:** https://www.parqlet.com

## Architecture

```
Browser → Cloudflare Pages (SSL, CDN) → static HTML/CSS/JS
                                     → API calls → api.parqlet.com (backend)
```

- Static files in `dist/` — plain HTML, CSS, JS (no framework)
- Forms POST to `https://api.parqlet.com/api/leads/early-access` and `/api/leads/book-demo`
- Backend lives in `~/work/parqlet-backend/` — Hono.js, separate deployment

## Development

```bash
# Edit static files directly in dist/
# Or rebuild from Next.js source (if applicable)

# Serve locally
python3 -m http.server 8080 --directory dist/
```

## Deploy

Push to `main` — GitHub Actions auto-deploys to Cloudflare Pages.

```bash
git push origin main
```

**GitHub secrets required:**
| Secret | Value |
|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | `32d03e512eeb3822f722289e07b5dae7` |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Pages edit scope |

## Adding content changes

1. Edit `dist/index.html`, `dist/styles.css`, or `dist/main.js`
2. Commit and push
3. CI deploys automatically in ~30s

## Images

All images live in `dist/images/` and are committed to git.

To refresh images from the Next.js source:
```bash
cp -r public/images/* dist/images/
```

## Backend (API)

Form submissions go to the backend API at `api.parqlet.com`:

- `POST /api/leads/early-access` — `{ email }`
- `POST /api/leads/book-demo` — `{ fullName, email, company, building, city, role, details }`

Backend repo: `~/work/parqlet-backend/`
