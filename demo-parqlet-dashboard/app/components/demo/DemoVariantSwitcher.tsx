"use client";

/**
 * Header control for flipping between the HOA and Apartments demos.
 *
 * Deliberately labelled "Demo" rather than dressed up as a product feature:
 * a prospect who spots it should understand it is a showcase control, not
 * something they would get. Hiding it would be worse - they would wonder
 * why the building name is one they do not recognise.
 */

import React, { useState } from "react";

import {
  DEMO_IDENTITIES,
  readVariant,
  setVariant,
  type DemoVariant,
} from "../../lib/demo/variants";

export function DemoVariantSwitcher() {
  const [open, setOpen] = useState(false);
  const active = readVariant();

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span style={styles.badge}>Demo</span>
        <span style={styles.triggerLabel}>{DEMO_IDENTITIES[active].label}</span>
        <span aria-hidden style={{ fontSize: 10 }}>▾</span>
      </button>

      {open && (
        <>
          {/* Click-away layer. A plain overlay rather than a document
              listener so it cannot outlive the menu. */}
          <div style={styles.backdrop} onClick={() => setOpen(false)} />
          <div role="menu" style={styles.menu}>
            {(Object.keys(DEMO_IDENTITIES) as DemoVariant[]).map((key) => {
              const it = DEMO_IDENTITIES[key];
              const isActive = key === active;
              return (
                <button
                  key={key}
                  type="button"
                  role="menuitem"
                  onClick={() => (isActive ? setOpen(false) : setVariant(key))}
                  style={{
                    ...styles.item,
                    background: isActive ? "var(--color-fill-weak)" : "transparent",
                  }}
                >
                  <span style={styles.itemLabel}>{it.label}</span>
                  <span style={styles.itemBlurb}>{it.blurb}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  trigger: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid var(--color-stroke-medium)",
    background: "var(--color-fill-white)",
    cursor: "pointer",
    fontFamily: "inherit",
    maxWidth: 280,
  },
  badge: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    padding: "2px 6px",
    borderRadius: 4,
    background: "var(--color-fill-weak)",
    color: "var(--color-text-weak)",
    flexShrink: 0,
  },
  triggerLabel: {
    fontSize: 13,
    color: "var(--color-text-strong)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  backdrop: { position: "fixed", inset: 0, zIndex: 40 },
  menu: {
    position: "absolute",
    top: "calc(100% + 6px)",
    right: 0,
    zIndex: 41,
    width: 320,
    padding: 6,
    borderRadius: 12,
    border: "1px solid var(--color-stroke-medium)",
    background: "var(--color-fill-white)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
  },
  item: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
    width: "100%",
    textAlign: "left",
    padding: "10px 12px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--color-text-strong)",
  },
  itemBlurb: {
    fontSize: 12,
    lineHeight: "16px",
    color: "var(--color-text-weak)",
  },
};
