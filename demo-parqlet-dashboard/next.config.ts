import type { NextConfig } from "next";

/**
 * Every demo URL names its product.
 *
 * The two demos are sent to different prospects, so the link itself has to
 * say which one it opens: /condo/... and /apartment/.... A `?v=` parameter
 * did not survive being pasted into an email, and a header switcher meant
 * one prospect could wander into the other product's dashboard mid-call.
 *
 * Rewrites rather than moved files. The pages are already separated by
 * product - `(hoa)` and `(apartments)` share nothing - so this only changes
 * what the address bar says, and the nav emits the prefixed hrefs. Moving
 * two dozen route folders to achieve the same string would have been a much
 * larger change for the same result.
 *
 * ORDER MATTERS. Next matches the first rewrite that fits, so the shared
 * admin pages (which live outside /apartments) must come before the catch-all
 * that would send /apartment/settings to a non-existent /apartments/settings.
 *
 * DEMO ONLY - do not carry this into the product. Here the URL decides the
 * product because there is no login and no account: a link is the only way
 * to say which demo to open. In the real dashboard the variant comes from
 * who signed in and from the building type a super admin picked when the
 * building was created, and the URL says nothing about it.
 */
const APARTMENT_SHARED = [
  "subscription",
  "access",
  "settings",
  "profile",
  "notifications",
  // The resident list and the reward ledger are the same screens in both
  // products - a resident is a resident and a $25 card is a $25 card - so
  // Apartments links at them rather than growing a second copy. The nav they
  // render with comes from the URL (see lib/demo/nav-for-path.ts), so an
  // Apartments visitor keeps the Apartments sidebar on them.
  "residents",
  "reward-redemption",
];


/**
 * Every Condo cut, longest prefix first.
 *
 * The savings token has two spellings ("savings" and the older
 * "earnings"), and the other two switches are independent, so this is
 * the cross product: 2 savings spellings x 2 long-term x 2 storage,
 * plus the no-savings cuts. Sorted by length descending so Next never
 * matches "/condo" against a URL that carried more tokens.
 */
function condoRewrites() {
  const SAVINGS = [null, "savings", "earnings"] as const;
  const LONG_TERM = [null, "long-term-parking"] as const;
  const STORAGE = [null, "storage"] as const;
  /**
   * Both spellings of the product, for the same reason "+earnings" is
   * served beside "+savings": these links are typed into emails and
   * decks as often as they are copied, and "/condos+storage" 404ing
   * because somebody pluralised it is the kind of thing nobody notices
   * until a prospect is already looking at an error page. The parser
   * accepts both, so the rewrites have to as well.
   */
  const PRODUCTS = ["condo", "condos"] as const;

  const prefixes: string[] = [];
  for (const p of PRODUCTS) {
    for (const s of SAVINGS) {
      for (const l of LONG_TERM) {
        for (const st of STORAGE) {
          const tokens = [s, l, st].filter(Boolean) as string[];
          prefixes.push([p, ...tokens].join("+"));
        }
      }
    }
  }
  // De-duplicated because the plain "condo" cut is produced three times
  // (once per savings spelling, all of which are null there).
  const unique = [...new Set(prefixes)].sort((a, b) => b.length - a.length);

  return unique.flatMap((prefix) => {
    const escaped = prefix.replace(/\+/g, "\\+");
    return [
      { source: `/${escaped}`, destination: "/dashboard" },
      { source: `/${escaped}/:path*`, destination: "/:path*" },
    ];
  });
}

const nextConfig: NextConfig = {
  output: "standalone",
  // The browser may resolve localhost to 127.0.0.1 for the dev HMR socket.
  // Allow that loopback origin so webpack HMR can connect on port 3010.
  allowedDevOrigins: ["127.0.0.1"],
  async rewrites() {
    return [
      // Pages both products share, which are not under /apartments.
      ...["/apartment", "/apartments"].flatMap((prefix) => [
        { source: `${prefix}/tickets`, destination: "/tickets" },
        { source: `${prefix}/tickets/:path*`, destination: "/tickets/:path*" },
        ...APARTMENT_SHARED.map((p) => ({
          source: `${prefix}/${p}`,
          destination: `/${p}`,
        })),
      ]),

      // The Apartments product's own pages. Both spellings, for the
      // same reason the Condo cuts carry both: a link gets pluralised
      // on its way into an email.
      ...["/apartment", "/apartments"].flatMap((p) => [
        { source: p, destination: "/apartments" },
        { source: `${p}/:path*`, destination: "/apartments/:path*" },
      ]),

      // The Condo product, in all its cuts. Every one serves the SAME
      // pages; the prefix is what tells the screens which optional
      // features this building is being shown. See
      // lib/demo/product-path.ts.
      //
      // GENERATED from the flag combinations rather than listed, because
      // three independent switches is eight cuts and eight more aliases
      // for the "+earnings" spelling - a hand-written list would be
      // twenty-odd lines kept in step with a parser that already knows
      // the rule.
      //
      // Longest first. A rewrite list is matched in order, so
      // "/condo+savings" listed after "/condo" would never be reached.
      //
      // The backslash escapes the "+" for path-to-regexp, which
      // otherwise reads it as a "one or more" modifier and refuses the
      // route.
      //
      // "+earnings" is an ALIAS, not a redirect: Next runs a redirect's
      // destination through the same parser, which will not take a "+"
      // either. Serving both spellings means a deck link pasted from
      // memory lands somewhere, and each keeps its own prefix so the nav
      // does not move the visitor to the other one mid-demo.
      ...condoRewrites(),
    ];
  },
};

export default nextConfig;
