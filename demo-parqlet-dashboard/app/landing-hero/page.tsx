/**
 * /landing-hero — preview host for the marketing hero.
 *
 * Deliberately thin. Everything that matters lives in ONE component so it
 * can be lifted into the `landing` repo as a single file; this page only
 * renders it at a real URL while it is being reviewed.
 *
 * Standalone, like /demo-home: no sidebar, no building, no identity, and
 * outside both product route groups, because what it previews is a page
 * the dashboard never renders.
 *
 * THE SECTION BELOW THE HERO IS SCAFFOLDING, not part of the component.
 * It is here so the seam can be judged - how the dark hero meets the warm
 * white the marketing site uses, and how the frames read as they run into
 * it. The real page has its own next section, so shipping this inside
 * LandingHero would mean deleting it on arrival.
 */

import LandingHero from "../components/landing-hero/LandingHero";

export default function LandingHeroPage() {
  return (
    // #F8F6F2, not the hero's dark: the hero paints its own background,
    // and anything left over below the last section should read as the
    // marketing site continuing, not as the hero bleeding through.
    <main style={{ minHeight: "100vh", background: "#F8F6F2" }}>
      <LandingHero />

      {/* ── Preview only: the next section ── */}
      <section
        style={{
          background: "#F8F6F2",
          padding: "96px 24px 120px",
          fontFamily: 'Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <div style={{ maxWidth: 1160, margin: "0 auto", textAlign: "center" }}>
          <span
            style={{
              display: "inline-block",
              padding: "7px 18px",
              borderRadius: 999,
              background: "rgba(34,34,34,.06)",
              color: "#504F4D",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: ".12em",
              textTransform: "uppercase",
            }}
          >
            How it works
          </span>
          <h2
            style={{
              margin: "20px 0 0",
              fontSize: 42,
              lineHeight: 1.1,
              fontWeight: 400,
              letterSpacing: "-.01em",
              color: "#222222",
            }}
          >
            Guest parking that runs itself
          </h2>
          <p
            style={{
              margin: "16px auto 0",
              maxWidth: 560,
              fontSize: 17,
              lineHeight: 1.55,
              color: "#504F4D",
            }}
          >
            Residents list the spot they are not using. A neighbour books it for their
            guest. Management sees every vehicle in the building, in real time.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
              gap: 20,
              marginTop: 56,
              textAlign: "left",
            }}
          >
            {[
              ["Private to your building", "No public listings. Only residents and the guests they invite."],
              ["Paid in credits", "A spot costs one credit. Sharing yours earns them back."],
              ["Plates on file", "Every vehicle is matched to a booking before it arrives."],
            ].map(([title, body]) => (
              <div
                key={title}
                style={{
                  padding: 24,
                  borderRadius: 16,
                  background: "#FFFFFF",
                  border: "1px solid #E7E4E0",
                }}
              >
                <b style={{ display: "block", fontSize: 17, fontWeight: 600, color: "#222222" }}>
                  {title}
                </b>
                <span
                  style={{
                    display: "block",
                    marginTop: 8,
                    fontSize: 14,
                    lineHeight: 1.5,
                    color: "#504F4D",
                  }}
                >
                  {body}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
