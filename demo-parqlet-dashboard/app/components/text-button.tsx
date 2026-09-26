"use client";

import { useState } from "react";

/**
 * TextButton
 *
 * Matches Parqlet Library → Button → Type=Text (Size=Medium by default)
 *
 * State tokens (from Parqlet Library / Button component set):
 *   Default  — Text/Strong      → --color-text-strong   (#222)   no underline
 *   Hover    — Gray/Gray 90     → --color-gray-90        (#3d3d3d) underline
 *   Pressed  — Text/Strong      → --color-text-strong   (#222)   underline
 *   Disabled — Text/Disabled    → --color-text-disabled  (#959595) no underline
 *
 * Typography (Size=Medium): Font/Body, 14px, Regular, line-height Tiny (16px)
 */
export function TextButton({
  children,
  disabled = false,
  onClick,
  size = "medium",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  /** "large" = 18px medium | "medium" = 14px regular (default) | "small" = 12px regular */
  size?: "large" | "medium" | "small";
}) {
  const [hovered, setHovered] = useState(false);

  const fontSize =
    size === "large"
      ? "var(--font-size-heading-3)"
      : size === "small"
      ? "var(--font-size-extra-tiny)"
      : "var(--font-size-tiny)";
  const lineHeight =
    size === "large"
      ? "var(--line-height-heading-3)"
      : size === "small"
      ? "var(--line-height-extra-tiny)"
      : "var(--line-height-tiny)";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        cursor: disabled ? "default" : "pointer",
        fontFamily: "var(--font-family-body)",
        fontSize,
        fontWeight: (size === "large"
          ? "var(--font-weight-medium)"
          : "var(--font-weight-regular)") as React.CSSProperties["fontWeight"],
        lineHeight,
        color: disabled
          ? "var(--color-text-disabled)"
          : hovered
          ? "var(--color-gray-90)"
          : "var(--color-text-strong)",
        textDecoration: !disabled && hovered ? "underline" : "none",
        whiteSpace: "nowrap",
        transition: "color 0.1s",
      }}
    >
      {children}
    </button>
  );
}
