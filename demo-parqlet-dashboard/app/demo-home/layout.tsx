import type { Metadata } from "next";

/**
 * /demo-home is UNLISTED, not secret.
 *
 * Nothing links to it - not the nav, not the front door - so the only way
 * in is to type the address. `noindex` keeps it out of search results as
 * well, because a page nobody links to can still be found once the domain
 * is crawled, and a prospect who lands on an internal preview instead of
 * the demo has been handed the wrong impression entirely.
 */
export const metadata: Metadata = {
  title: "Demo home",
  robots: { index: false, follow: false },
};

export default function DemoHomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
