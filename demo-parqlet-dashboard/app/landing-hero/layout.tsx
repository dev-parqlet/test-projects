import type { Metadata } from "next";

/**
 * /landing-hero is UNLISTED, like /demo-home.
 *
 * Nothing links to it. It is a staging ground for a hero section destined
 * for the marketing site, so it must not be the thing a prospect finds in
 * search when they look for Parqlet - parqlet.com is. `noindex` keeps this
 * copy out of the results the real page needs to win.
 */
export const metadata: Metadata = {
  title: "Landing hero",
  robots: { index: false, follow: false },
};

export default function LandingHeroLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
