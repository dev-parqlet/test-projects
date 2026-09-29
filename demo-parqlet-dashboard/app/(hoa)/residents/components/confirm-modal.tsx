'use client';

import React from 'react';

export function ConfirmModal({ count, onConfirm, onCancel }: { count: number; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{
      position:       "fixed",
      inset:          0,
      background:     "rgba(0,0,0,0.35)",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      zIndex:         1000,
    }}>
      <div style={{
        background:   "var(--color-fill-white)",
        borderRadius: "var(--radius-12)",
        padding:      "var(--spacing-32)",
        maxWidth:     400,
        width:        "90%",
        boxSizing:    "border-box" as React.CSSProperties["boxSizing"],
        boxShadow:    "0 8px 32px rgba(0,0,0,0.16)",
        display:      "flex",
        flexDirection: "column",
        gap:          "var(--spacing-24)",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
          <p style={{
            margin:     0,
            fontSize:   "var(--font-size-tiny)",
            fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
            lineHeight: "var(--line-height-tiny)",
            color:      "var(--color-text-strong)",
            fontFamily: "var(--font-family-body)",
          }}>
            Are you sure you want to invite {count} residents?
          </p>
          <p style={{
            margin:     0,
            fontSize:   "var(--font-size-extra-tiny)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            lineHeight: "var(--line-height-extra-tiny)",
            color:      "var(--color-text-weak)",
            fontFamily: "var(--font-family-body)",
          }}>
            A Parqlet invitation email will be sent to all residents who haven&apos;t registered yet.
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--spacing-8)", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              height:       36,
              padding:      "0 var(--spacing-20)",
              background:   "var(--color-fill-white)",
              border:       "1px solid var(--color-stroke-medium)",
              borderRadius: "var(--radius-8)",
              cursor:       "pointer",
              fontFamily:   "var(--font-family-body)",
              fontSize:     "var(--font-size-tiny)",
              fontWeight:   "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
              lineHeight:   "var(--line-height-tiny)",
              color:        "var(--color-text-strong)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-fill-weak)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-fill-white)"; }}
          >
            No
          </button>
          <button
            onClick={onConfirm}
            style={{
              height:       36,
              padding:      "0 var(--spacing-20)",
              background:   "var(--color-fill-accent)",
              border:       "none",
              borderRadius: "var(--radius-8)",
              cursor:       "pointer",
              fontFamily:   "var(--font-family-body)",
              fontSize:     "var(--font-size-tiny)",
              fontWeight:   "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
              lineHeight:   "var(--line-height-tiny)",
              // Fixed brand color, doesn't invert in dark mode — keep text dark.
              color:        "#222222",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-accent-1200)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-fill-accent)"; }}
          >
            Yes, send invites
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;