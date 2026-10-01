import React from "react";

/**
 * The "Community Spot" / "Resident spot" pill, wherever one is drawn.
 *
 * ONE definition. There were two - one in CurrentBookingsCard, one in
 * BookingEarnings - and they had drifted: the dashboard's community tag
 * was `accent-150`, the earnings page's was `fill-accent`, so the same
 * label was two different greens on two screens of the same product.
 *
 * `fill-accent` was also the accessibility bug. It is `#c7e51f` in BOTH
 * themes while the text on it is `text-strong`, which in dark mode is
 * near-white - white on bright lime. `accent-150` is theme-aware, so the
 * pair stays legible either way round.
 *
 * The resident tag gets its own token for the same reason: `fill-weak` in
 * dark mode is `#17171a`, all but the page background, which left the pill
 * invisible. It now takes the same light grey the pagination uses for a
 * selected page.
 */
export function spotKindTag(kind: "building" | "neighbor"): React.CSSProperties {
  return {
    display: "inline-block",
    padding: "2px var(--spacing-8)",
    borderRadius: 47,
    fontFamily: "var(--font-family-body)",
    fontSize: 12,
    lineHeight: "16px",
    whiteSpace: "nowrap",
    background:
      kind === "building" ? "var(--color-accent-150)" : "var(--color-tag-spot-resident)",
    color: "var(--color-text-strong)",
  };
}
