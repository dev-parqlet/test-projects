# ── Stage 1: Install dependencies ──────────────────────────────────────────────
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --ignore-scripts

# ── Stage 2: Build ────────────────────────────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app

# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, so they
# must be present here (not just at container runtime). Pass via `docker build
# --build-arg` or compose `build.args`.
#
# NEXT_PUBLIC_API_URL is the dashboard's own origin — the browser calls it so
# auth cookies stay same-origin. The dashboard's /api/* routes then proxy
# server-to-server to the backend (BACKEND_API_URL below). The CI build path
# (GitHub Actions `docker/build-push-action`) doesn't pass build args by
# default, so we bake in a default to avoid an empty string being inlined into
# the bundle (which would bypass the `?? "https://api..."` fallbacks at client
# call sites and break URL construction with ERR_INVALID_URL). Override at
# build time to point at staging/etc.
ARG NEXT_PUBLIC_API_URL=https://dashboard.parqlet.com
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── Stage 3: Runtime ──────────────────────────────────────────────────────────
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# BACKEND_API_URL is the upstream the dashboard's /api/* proxy routes forward
# to. Kept separate from NEXT_PUBLIC_API_URL (the dashboard's own origin, baked
# into the client bundle at build time above) so browser calls stay
# same-origin and the proxy can use cookies safely server-to-server. The VM
# env_file overrides this at runtime; the value below is the fallback for
# local docker-compose runs.
ENV BACKEND_API_URL=https://api.parqlet.com

# Cloud Run expects PORT env var; Next.js uses it
EXPOSE 8080

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

CMD ["node", "server.js"]
