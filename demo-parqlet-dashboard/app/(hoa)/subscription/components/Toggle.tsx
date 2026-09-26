"use client";

import { useState } from "react";

export function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onChange}
      style={{
        position:        "relative",
        display:         "inline-flex",
        alignItems:      "center",
        width:           40,
        height:          22,
        borderRadius:    99,
        border:          "none",
        cursor:          "pointer",
        padding:         0,
        flexShrink:      0,
        backgroundColor: on ? "var(--color-fill-accent)" : "#d0cfce",
        transition:      "background-color 0.18s ease",
      }}
    >
      <span style={{
        position:        "absolute",
        left:            on ? 21 : 3,
        width:           16,
        height:          16,
        borderRadius:    "50%",
        backgroundColor: "#ffffff",
        boxShadow:       "0 1px 3px rgba(0,0,0,0.22)",
        transition:      "left 0.18s ease",
      }} />
    </button>
  );
}
