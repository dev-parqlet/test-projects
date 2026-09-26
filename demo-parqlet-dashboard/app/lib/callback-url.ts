/**
 * Helpers for the `?callbackUrl=` round trip between a guarded page and /sign-in.
 *
 * A guard sends an unauthenticated visitor to
 * `/sign-in?callbackUrl=<where they were headed>`; once the session resolves,
 * /sign-in must send them *back* there instead of to the role's default landing
 * page. Both sides of that round trip live here so they can't drift.
 */

/** Where a role lands when no callbackUrl was supplied. Mirrors app/page.tsx. */
export function defaultLandingFor(role: string | undefined): string {
  return role === "super_admin" ? "/super-admin" : "/dashboard";
}

/**
 * Accept only same-origin, path-absolute targets.
 *
 * Rejects `//evil.com` and `/\evil.com` — browsers treat both as
 * protocol-relative and would navigate off-site — along with anything carrying
 * a scheme, so a crafted `?callbackUrl=` can't turn /sign-in into an open
 * redirect. Also rejects /sign-in itself, which would loop.
 *
 * Expects an already-decoded value (URLSearchParams.get() decodes for you);
 * decoding again here would let a double-encoded `%252F%252Fevil.com` through.
 */
export function sanitizeCallbackUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return null;
  if (raw === "/sign-in" || raw.startsWith("/sign-in?")) return null;
  return raw;
}

/** Reads and validates `?callbackUrl=` from the current URL. Client-side only. */
export function readCallbackUrl(): string | null {
  if (typeof window === "undefined") return null;
  return sanitizeCallbackUrl(new URLSearchParams(window.location.search).get("callbackUrl"));
}

/**
 * The /sign-in URL to bounce the current visitor to, preserving exactly where
 * they were headed — path *and* query string *and* hash — so deep links like
 * /buildings/123?tab=units survive the round trip.
 */
export function signInUrlForCurrentLocation(): string {
  if (typeof window === "undefined") return "/sign-in";
  const { pathname, search, hash } = window.location;
  const target = sanitizeCallbackUrl(`${pathname}${search}${hash}`);
  return target ? `/sign-in?callbackUrl=${encodeURIComponent(target)}` : "/sign-in";
}
