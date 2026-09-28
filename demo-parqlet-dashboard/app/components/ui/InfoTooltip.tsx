"use client";

import React from "react";

/**
 * A dark hint on hover or focus, for a figure that needs a sentence of
 * explanation rather than a whole help panel - "$0.00" on a booking row
 * being the case it was written for.
 *
 * Inline styles and tokens, like the rest of this design system, rather
 * than the Base UI tooltip in ./tooltip.tsx: that one is styled with
 * Tailwind utilities nothing else here uses, so it renders as an unstyled
 * box in this app.
 *
 * Focusable, so the explanation is reachable without a mouse - on a touch
 * screen a tap focuses the trigger and shows it.
 */
export function InfoTooltip({
  text,
  children,
  side = "top",
}: {
  text: string;
  children: React.ReactNode;
  side?: "top" | "bottom";
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <span
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
      role="note"
      aria-label={text}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            right: 0,
            [side === "top" ? "bottom" : "top"]: "calc(100% + 8px)",
            zIndex: 50,
            width: "max-content",
            maxWidth: 260,
            padding: "var(--spacing-8) var(--spacing-12)",
            borderRadius: "var(--radius-8)",
            background: "var(--color-fill-strong)",
            color: "var(--color-text-white)",
            fontSize: "var(--font-size-extra-tiny)",
            lineHeight: 1.45,
            fontFamily: "var(--font-family-body)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
            pointerEvents: "none",
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}
