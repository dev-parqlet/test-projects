"use client";

import * as React from "react";

interface IdDisplayProps {
  value: string | null | undefined;
  /** Optional override for the native tooltip (defaults to the full value). */
  tooltip?: string;
  className?: string;
  style?: React.CSSProperties;
}

const PLACEHOLDER = "—";
const TRUNCATE_THRESHOLD = 8;

/**
 * Renders an opaque ID in a narrow column-safe way:
 *  - null/undefined/"" → "—" placeholder
 *  - length ≤ 8 → full value verbatim (e.g. "tkt-001", "INV-0034")
 *  - otherwise → last 6 chars uppercased (e.g. UUID "2619dcf2-…-0a53ed7" → "A53ED7")
 *
 * The full value is always exposed via the native `title` attribute for hover.
 */
export function IdDisplay({ value, tooltip, className, style }: IdDisplayProps) {
  if (value == null || value === "") {
    return (
      <span
        className={className}
        title={tooltip ?? ""}
        style={{
          fontFamily: "var(--font-family-mono, ui-monospace, SFMono-Regular, monospace)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          display: "inline-block",
          maxWidth: "100%",
          verticalAlign: "middle",
          color: "var(--color-text-weak)",
          ...style,
        }}
      >
        {PLACEHOLDER}
      </span>
    );
  }

  const display = value.length > TRUNCATE_THRESHOLD ? value.slice(-6).toUpperCase() : value;

  return (
    <span
      className={className}
      title={tooltip ?? value}
      style={{
        fontFamily: "var(--font-family-mono, ui-monospace, SFMono-Regular, monospace)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        display: "inline-block",
        maxWidth: "100%",
        verticalAlign: "middle",
        color: "var(--color-text-strong)",
        ...style,
      }}
    >
      {display}
    </span>
  );
}