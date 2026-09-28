/**
 * Reading the product out of the URL.
 *
 * Every demo page is served under /condo/... or /apartment/..., so the path
 * is the single source of truth for which product a visitor is looking at:
 * the link they were sent decides it, and there is nothing in the interface
 * that can quietly move them to the other one.
 *
 * Rewrites mean the app's own routes are still unprefixed - /condo/bookings
 * renders the page at /bookings - but `usePathname()` returns what the
 * browser shows, prefix and all. So layouts have to strip it before they
 * can match a route to a nav item.
 *
 * DEMO ONLY. The real dashboard resolves the product from the session and
 * from the building type chosen when the building was set up, not from the
 * address bar. Nothing in this file describes how the product will work.
 */

export const CONDO_PREFIX = '/condo';
export const APARTMENT_PREFIX = '/apartment';

/**
 * The path with its product prefix removed, e.g. "/condo/bookings" ->
 * "/bookings" and "/condo" -> "/". An unprefixed path is returned as-is, so
 * this is safe to apply unconditionally.
 */
export function stripProductPrefix(pathname: string): string {
  for (const prefix of [APARTMENT_PREFIX, CONDO_PREFIX]) {
    if (pathname === prefix) return '/';
    if (pathname.startsWith(prefix + '/')) return pathname.slice(prefix.length);
  }
  return pathname;
}

/** Which product this path belongs to, or null if it names neither. */
export function productFromPath(pathname: string): 'condo' | 'apartment' | null {
  if (pathname === APARTMENT_PREFIX || pathname.startsWith(APARTMENT_PREFIX + '/')) return 'apartment';
  if (pathname === CONDO_PREFIX || pathname.startsWith(CONDO_PREFIX + '/')) return 'condo';
  return null;
}

/**
 * The prefix a link from inside one product must carry, so a router push
 * cannot drop a visitor out of the product they were sent to. Defaults to
 * the Condo prefix on an unprefixed path, which is where the shared pages
 * live.
 */
export function productPrefix(pathname: string): string {
  return productFromPath(pathname) === 'apartment' ? APARTMENT_PREFIX : CONDO_PREFIX;
}
