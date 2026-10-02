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

const nextConfig: NextConfig = {
  output: "standalone",
  // The browser may resolve localhost to 127.0.0.1 for the dev HMR socket.
  // Allow that loopback origin so webpack HMR can connect on port 3010.
  allowedDevOrigins: ["127.0.0.1"],
  async rewrites() {
    return [
      // Pages both products share, which are not under /apartments.
      { source: "/apartment/tickets", destination: "/tickets" },
      { source: "/apartment/tickets/:path*", destination: "/tickets/:path*" },
      ...APARTMENT_SHARED.map((p) => ({
        source: `/apartment/${p}`,
        destination: `/${p}`,
      })),

      // The Apartments product's own pages.
      { source: "/apartment", destination: "/apartments" },
      { source: "/apartment/:path*", destination: "/apartments/:path*" },

      // The Condo product, in its two cuts. Both serve the SAME pages; the
      // prefix is what tells the screens whether this building is being
      // shown the savings story. See lib/demo/product-path.ts.
      //
      // The savings cut comes first because it is the longer string, and a
      // rewrite list is matched in order.
      // The backslash escapes the "+" for path-to-regexp, which otherwise
      // reads it as a "one or more" modifier and refuses the route.
      //
      // "+earnings" is an ALIAS, not a redirect: Next runs a redirect's
      // destination through the same parser, which will not take a "+"
      // either. Serving both spellings means a deck link pasted from
      // memory lands somewhere, and each keeps its own prefix so the nav
      // does not move the visitor to the other one mid-demo.
      { source: "/condo\\+savings", destination: "/dashboard" },
      { source: "/condo\\+savings/:path*", destination: "/:path*" },
      { source: "/condo\\+earnings", destination: "/dashboard" },
      { source: "/condo\\+earnings/:path*", destination: "/:path*" },
      { source: "/condo", destination: "/dashboard" },
      { source: "/condo/:path*", destination: "/:path*" },
    ];
  },
};

export default nextConfig;
