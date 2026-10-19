/**
 * Reading the product AND its feature cut out of the URL.
 *
 * Every demo page is served under a prefix that names both: the product
 * (`/condo`, `/apartment`) and which optional features that cut of it
 * shows, as `+token` suffixes:
 *
 *   /condo                                  plain
 *   /condo+savings                          savings story
 *   /condo+savings+storage                  savings and storage
 *   /condo+long-term-parking                long-term parking only
 *   /condo+long-term-parking+storage        both, no savings
 *   /apartment                              the Apartments product
 *
 * The link is the single source of truth for what a visitor sees: the
 * one they were sent decides it, and nothing in the interface can
 * quietly move them to a different cut. The Settings toggles are the
 * one exception, and they work by REWRITING THE URL - see
 * `pathWithFeatures` - so the address bar never disagrees with the
 * screen, and whatever a prospect copies out of it reproduces exactly
 * what they were looking at.
 *
 * Parsed rather than enumerated. There are three independent switches,
 * so a list of named cuts would be eight entries that have to be kept
 * in step with eight rewrite rules and a settings screen; reading the
 * tokens means a combination nobody has written down still works.
 *
 * Rewrites mean the app's own routes are still unprefixed -
 * /condo+storage/bookings renders the page at /bookings - but
 * `usePathname()` returns what the browser shows, prefix and all. So
 * layouts have to strip it before they can match a route to a nav item.
 *
 * DEMO ONLY. The real dashboard resolves the product from the session
 * and the features from per-building columns a super admin sets
 * (`buildings.storage_spots_enabled`, `.long_term_parking_enabled`).
 * Nothing in this file describes how the product will work.
 */

export const CONDO_PREFIX = '/condo';
export const APARTMENT_PREFIX = '/apartment';

/**
 * The savings cut's canonical spelling, and the one it was called while
 * it was being specified.
 *
 * "+earnings" is served as an ALIAS rather than redirected, because a
 * link in a deck gets pasted from memory and a visitor should stay on
 * whichever they arrived at rather than being moved mid-demo.
 */
export const CONDO_SAVINGS_PREFIX = `${CONDO_PREFIX}+savings`;

/** The three optional features a cut can carry. */
export type DemoFeature = 'savings' | 'longTermParking' | 'storage';

/**
 * Token spellings, in the order they are written back into a URL.
 *
 * Several spellings each, deliberately: these links are typed into
 * emails and decks as often as they are copied, and a near miss landing
 * on the plain cut is the kind of thing nobody notices until a prospect
 * is already looking at the wrong screen. The FIRST entry is canonical
 * and is what `pathWithFeatures` writes.
 */
const FEATURE_TOKENS: { feature: DemoFeature; tokens: readonly string[] }[] = [
  { feature: 'savings', tokens: ['savings', 'earnings'] },
  {
    feature: 'longTermParking',
    tokens: ['long-term-parking', 'long-term', 'longterm', 'long-term-bookings'],
  },
  { feature: 'storage', tokens: ['storage', 'storages'] },
];

/** Product spellings. Plural is accepted for the same reason. */
const PRODUCT_TOKENS: { product: 'condo' | 'apartment'; tokens: readonly string[] }[] = [
  { product: 'apartment', tokens: ['apartment', 'apartments', 'apt'] },
  { product: 'condo', tokens: ['condo', 'condos', 'hoa'] },
];

export type ParsedPrefix = {
  product: 'condo' | 'apartment';
  /** The prefix exactly as the browser shows it, for building links. */
  prefix: string;
  features: Set<DemoFeature>;
};

/**
 * The prefix at the head of this path, or null if it names no product.
 *
 * Matches `/<product>(+<token>)*` and stops at the next `/`, so
 * "/condo+storage/bookings" yields prefix "/condo+storage" and route
 * "/bookings".
 */
export function parsePrefix(pathname: string): ParsedPrefix | null {
  const head = pathname.split('/')[1] ?? '';
  if (!head) return null;
  // Decoded, because a "+" survives being pasted but can arrive
  // percent-encoded from a client that escaped it.
  const decoded = safeDecode(head).toLowerCase();
  const [productToken, ...rest] = decoded.split('+');

  const product = PRODUCT_TOKENS.find((p) => p.tokens.includes(productToken))?.product;
  if (!product) return null;

  const features = new Set<DemoFeature>();
  for (const token of rest) {
    const match = FEATURE_TOKENS.find((f) => f.tokens.includes(token));
    if (match) features.add(match.feature);
  }

  return { product, prefix: `/${head}`, features };
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/**
 * The path with its product prefix removed, e.g.
 * "/condo+storage/bookings" -> "/bookings" and "/condo" -> "/". An
 * unprefixed path is returned as-is, so this is safe to apply
 * unconditionally.
 */
export function stripProductPrefix(pathname: string): string {
  const parsed = parsePrefix(pathname);
  if (!parsed) return pathname;
  const rest = pathname.slice(parsed.prefix.length);
  return rest.length > 0 ? rest : '/';
}

/** Which product this path belongs to, or null if it names neither. */
export function productFromPath(pathname: string): 'condo' | 'apartment' | null {
  return parsePrefix(pathname)?.product ?? null;
}

/**
 * Does this URL show the savings card and the Savings nav item?
 *
 * Only a Condo cut carrying the token. Apartments is unaffected: a
 * building that owns its spots really is earning, and its Earnings
 * screen stays whatever the prefix says.
 */
export function condoShowsSavings(pathname: string): boolean {
  const parsed = parsePrefix(pathname);
  return parsed?.product === 'condo' && parsed.features.has('savings');
}

/**
 * Long-term parking: the Long-term bookings tab on the Bookings table,
 * and the long-term screens behind it.
 */
export function showsLongTermParking(pathname: string): boolean {
  return parsePrefix(pathname)?.features.has('longTermParking') ?? false;
}

/**
 * Storage: the Storage bookings page, and the Storage # column in the
 * resident directory.
 */
export function showsStorage(pathname: string): boolean {
  return parsePrefix(pathname)?.features.has('storage') ?? false;
}

/** Both switches at once, for a screen that needs to ask about both. */
export function demoFeatures(pathname: string): {
  savings: boolean;
  longTermParking: boolean;
  storage: boolean;
} {
  const f = parsePrefix(pathname)?.features;
  return {
    savings: f?.has('savings') ?? false,
    longTermParking: f?.has('longTermParking') ?? false,
    storage: f?.has('storage') ?? false,
  };
}

/**
 * The prefix a link from inside one cut must carry, so a router push
 * cannot drop a visitor out of the cut they were sent to. Defaults to
 * the Condo prefix on an unprefixed path, which is where the shared
 * pages live.
 */
export function productPrefix(pathname: string): string {
  return parsePrefix(pathname)?.prefix ?? CONDO_PREFIX;
}

/**
 * The same page, with a different set of features switched on.
 *
 * This is what the Settings toggles navigate to. Rewriting the URL
 * rather than holding the choice in state is the whole design: the
 * address bar is the source of truth everywhere else in this demo, and
 * a toggle that changed the screen without changing the link would mean
 * the link a prospect copies does not reproduce what they were shown.
 *
 * The product token is preserved exactly as it was typed, so somebody
 * who arrived at "/condos+storage" stays on "condos".
 */
export function pathWithFeatures(
  pathname: string,
  next: Partial<Record<DemoFeature, boolean>>,
): string {
  const parsed = parsePrefix(pathname);
  if (!parsed) return pathname;

  const features = new Set(parsed.features);
  for (const [key, on] of Object.entries(next) as [DemoFeature, boolean][]) {
    if (on) features.add(key);
    else features.delete(key);
  }

  const productToken = safeDecode(parsed.prefix.slice(1)).split('+')[0];
  // Canonical order and canonical spelling, so two routes to the same
  // cut produce the same URL.
  const tokens = FEATURE_TOKENS.filter((f) => features.has(f.feature)).map((f) => f.tokens[0]);
  const prefix = `/${[productToken, ...tokens].join('+')}`;
  return prefix + stripProductPrefixRoute(pathname);
}

/** The route part, "" for the prefix root (so we do not emit a trailing "/"). */
function stripProductPrefixRoute(pathname: string): string {
  const parsed = parsePrefix(pathname);
  if (!parsed) return '';
  return pathname.slice(parsed.prefix.length);
}

/**
 * Paths that belong to NEITHER product.
 *
 * Standalone pages, reached by typing the URL and linked from nothing
 * but the front door. They carry no building, no identity and no
 * sidebar, so the gate must let them through rather than asking a
 * visitor to pick a product before showing them a page that has nothing
 * to do with either.
 */
const UNSCOPED_PATHS = ['/demo-home', '/landing-hero'];

/**
 * "/" is the front door itself, which lists every cut.
 *
 * It must not be gated: wrapping the chooser in a chooser would ask a
 * visitor to pick a product before showing them the list of products.
 */
export function isFrontDoor(pathname: string): boolean {
  return pathname === '/';
}

export function isUnscopedPath(pathname: string): boolean {
  return UNSCOPED_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}
