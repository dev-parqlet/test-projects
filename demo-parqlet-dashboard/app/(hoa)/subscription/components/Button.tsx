/**
 * Single unified Button component for the HOA subscription page.
 *
 * Usage:
 *   <Button variant="primary">Save</Button>
 *   <Button variant="secondary" disabled>Cancel</Button>
 *   <Button variant="danger" onClick={handleDelete}>Delete</Button>
 */

"use client";

import React, { useState } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger";

type ButtonProps = {
  children: React.ReactNode;
  variant?: ButtonVariant;
  onClick?: () => void;
  disabled?: boolean;
  /** Extra inline styles */
  style?: React.CSSProperties;
};

const variantStyles: Record<ButtonVariant, { bg: string; border: string; color: string; hoverBg: string }> = {
  primary: {
    bg:        "var(--color-fill-accent)",
    border:    "none",
    // Fixed brand color, doesn't invert in dark mode — keep text dark.
    color:     "#222222",
    hoverBg:   "var(--color-accent-1200)",
  },
  secondary: {
    bg:        "var(--color-fill-white)",
    border:    "1px solid var(--color-stroke-medium)",
    color:     "var(--color-text-strong)",
    hoverBg:   "var(--color-fill-weak)",
  },
  danger: {
    bg:        "none",
    border:    "1px solid var(--color-red-1000)",
    color:     "var(--color-text-error)",
    hoverBg:   "var(--color-red-50)",
  },
};

export function Button({
  children,
  variant = "primary",
  onClick,
  disabled = false,
  style: extraStyle,
}: ButtonProps) {
  const [hovered, setHovered] = useState(false);
  const v = variantStyles[variant];

  const base: React.CSSProperties = {
    height:        36,
    padding:      "0 var(--spacing-16)",
    background:    disabled ? "var(--color-fill-weak)" : (hovered ? v.hoverBg : v.bg),
    border:        v.border,
    borderRadius:  "var(--radius-8)",
    cursor:        disabled ? "not-allowed" : "pointer",
    fontFamily:    "var(--font-family-body)",
    fontSize:      "var(--font-size-tiny)",
    fontWeight:    "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
    color:         disabled ? "var(--color-text-weaker)" : v.color,
    whiteSpace:    "nowrap",
    transition:    "background 0.12s, opacity 0.12s",
    opacity:       disabled ? 0.6 : 1,
    display:       "inline-flex",
    alignItems:    "center",
    ...extraStyle,
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      style={base}
    >
      {children}
    </button>
  );
}
