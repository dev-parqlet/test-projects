"use client";

import { useState } from "react";

export function InviteButton({ sent, sentDate, onSend }: { sent: boolean; sentDate: string; onSend: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={onSend}
        style={{
          background:         "none",
          border:             "none",
          padding:            0,
          cursor:             "pointer",
          fontFamily:         "var(--font-family-body)",
          fontSize:           "var(--font-size-tiny)",
          lineHeight:         "var(--line-height-tiny)",
          fontWeight:         "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
          color:              "var(--color-text-strong)",
          textDecoration:     hovered ? "underline" : "none",
          textUnderlineOffset: 2,
        }}
      >
        {sent ? "Resend invite" : "Send invite"}
      </button>
      {hovered && sent && sentDate && (
        <span style={{
          position:     "absolute",
          bottom:       "calc(100% + 6px)",
          left:         "50%",
          transform:    "translateX(-50%)",
          background:   "var(--color-fill-strong)",
          color:        "var(--color-text-white)",
          fontSize:     "var(--font-size-extra-tiny)",
          lineHeight:   "var(--line-height-extra-tiny)",
          fontFamily:   "var(--font-family-body)",
          fontWeight:   "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
          padding:      "var(--spacing-4) var(--spacing-8)",
          borderRadius: "var(--radius-8)",
          whiteSpace:   "nowrap",
          pointerEvents: "none",
          zIndex:       9999,
        }}>
          Last sent {sentDate}
        </span>
      )}
    </div>
  );
}