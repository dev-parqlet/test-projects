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
/**
 * The Condo demo WITH the savings story: the dashboard's savings card and
 * the Savings item in the sidebar.
 *
 * Two cuts of one product, not two products. In a Condo the residents own
 * every spot, so the money their sharing generates is theirs - and HOA
 * boards told us in so many words that a dashboard pitching the BUILDING
 * on making money off it reads wrong. So /condo drops that story, and this
 * prefix keeps it for the buildings set up before September 2026, who were
 * shown it and still expect it.
 *
 * Everything else is identical. The data, the nav, the screens and the
 * identity are the same; the prefix only decides whether two pieces of
 * savings UI are drawn. Making it a second product would have duplicated
 * two dozen routes to hide one card.
 */
export const CONDO_SAVINGS_PREFIX = '/condo+savings';

/**
 * Both spellings of the savings cut. "+earnings" is what it was called
 * while it was being specified, and a link in a deck gets pasted from
 * memory - so both are served, and a visitor stays on whichever they
 * arrived at rather than being moved mid-demo.
 */
export const CONDO_SAVINGS_PREFIXES = [CONDO_SAVINGS_PREFIX, '/condo+earnings'] as const;

export const APARTMENT_PREFIX = '/apartment';

/** Every prefix, longest first, so "/condo+savings" is never read as "/condo". */
const PREFIXES = [APARTMENT_PREFIX, ...CONDO_SAVINGS_PREFIXES, CONDO_PREFIX] as const;

/**
 * The path with its product prefix removed, e.g. "/condo/bookings" ->
 * "/bookings" and "/condo" -> "/". An unprefixed path is returned as-is, so
 * this is safe to apply unconditionally.
 */
export function stripProductPrefix(pathname: string): string {
  for (const prefix of PREFIXES) {
    if (pathname === prefix) return '/';
    if (pathname.startsWith(prefix + '/')) return pathname.slice(prefix.length);
  }
  return pathname;
}

/** Which product this path belongs to, or null if it names neither. */
export function productFromPath(pathname: string): 'condo' | 'apartment' | null {
  if (hasPrefix(pathname, APARTMENT_PREFIX)) return 'apartment';
  // Both Condo cuts ARE the Condo product - same identity, same building,
  // same data. Only `condoShowsSavings` tells them apart.
  if (condoShowsSavings(pathname) || hasPrefix(pathname, CONDO_PREFIX)) return 'condo';
  return null;
}

function hasPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(prefix + '/');
}

/**
 * Does this URL show the savings card and the Savings nav item?
 *
 * Only the longer Condo prefix does. Apartments is unaffected: a building
 * that owns its spots really is earning, and its Earnings screen stays.
 */
export function condoShowsSavings(pathname: string): boolean {
  return CONDO_SAVINGS_PREFIXES.some((p) => hasPrefix(pathname, p));
}

/** The savings prefix this path is on, or null. */
function condoSavingsPrefix(pathname: string): string | null {
  return CONDO_SAVINGS_PREFIXES.find((p) => hasPrefix(pathname, p)) ?? null;
}

/**
 * The prefix a link from inside one product must carry, so a router push
 * cannot drop a visitor out of the product they were sent to. Defaults to
 * the Condo prefix on an unprefixed path, which is where the shared pages
 * live.
 */
export function productPrefix(pathname: string): string {
  if (productFromPath(pathname) === 'apartment') return APARTMENT_PREFIX;
  // A link built inside the savings cut has to keep its visitor there, or
  // the first click would quietly drop them into the cut without it.
  return condoSavingsPrefix(pathname) ?? CONDO_PREFIX;
}

/**
 * Paths that belong to NEITHER product.
 *
 * Standalone pages, reached by typing the URL and linked from nothing.
 * They carry no building, no identity and no sidebar, so the front door
 * must let them through rather than asking a visitor to pick a product
 * before showing them a page that has nothing to do with either.
 */
const UNSCOPED_PATHS = ['/demo-home'];

export function isUnscopedPath(pathname: string): boolean {
  return UNSCOPED_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}
