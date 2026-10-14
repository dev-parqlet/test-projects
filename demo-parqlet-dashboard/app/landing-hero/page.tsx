/**
 * /landing-hero — preview host for the marketing hero.
 *
 * Deliberately almost empty. Everything lives in ONE component so it can
 * be lifted into the `landing` repo as a single file: this page exists
 * only to render it at a real URL while it is being reviewed.
 *
 * Standalone, like /demo-home: no sidebar, no building, no identity, and
 * outside both product route groups. It must not pick up the dashboard
 * shell, because what it is previewing is a page the dashboard never
 * renders.
 *
 * The component is a client component and is imported directly rather
 * than through next/dynamic - unlike ParqletDemo, it renders meaningful
 * markup on the server (the headline and both frames), and the film is
 * the part that starts on mount. Server-rendering it means the hero text
 * is in the HTML, which is the point of a hero.
 */

import LandingHero from "../components/landing-hero/LandingHero";

export default function LandingHeroPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#1A1A1A" }}>
      <LandingHero />
    </main>
  );
}
