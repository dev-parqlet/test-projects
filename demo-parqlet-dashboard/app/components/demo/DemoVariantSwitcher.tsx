"use client";

/**
 * Header control for flipping between the HOA and Apartments demos.
 *
 * A direct toggle, not a dropdown. There are exactly two variants, so a menu
 * bought nothing and cost something: the header clips overflowing children,
 * so the menu rendered half behind the content area and its click-away layer
 * swallowed the very clicks it was meant to enable. One button cannot be
 * clipped, cannot be covered, and needs no z-index.
 *
 * Deliberately labelled "Demo" rather than dressed up as a product feature:
 * a prospect who spots it should understand it is a showcase control, not
 * something they would get. Hiding it would be worse - they would wonder why
 * the building name is one they do not recognise.
 */

import React from "react";

import { CopyLinkButton } from "./ShareLinks";
import {
  DEMO_IDENTITIES,
  otherVariant,
  readVariant,
  setVariant,
} from "../../lib/demo/variants";

export function DemoVariantSwitcher() {
  const active = readVariant();
  const next = otherVariant(active);

  return (
    <div style={styles.wrap}>
      <button
        type="button"
        onClick={() => setVariant(next)}
        title={`Switch to ${DEMO_IDENTITIES[next].label}`}
        style={styles.trigger}
      >
        <span style={styles.badge}>Demo</span>
        <span style={styles.label}>{DEMO_IDENTITIES[active].label}</span>
        <span aria-hidden style={styles.swap}>
          ⇄
        </span>
      </button>
      {/* Copies a link to what is on screen right now, so the address bar
          never has to be read or edited mid-call. */}
      <CopyLinkButton variant={active} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { display: "flex", alignItems: "center", gap: 6, flexShrink: 0 },
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
    flexShrink: 0,
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
  label: {
    fontSize: 13,
    color: "var(--color-text-strong)",
    whiteSpace: "nowrap",
  },
  swap: {
    fontSize: 13,
    color: "var(--color-text-weak)",
    flexShrink: 0,
  },
};
