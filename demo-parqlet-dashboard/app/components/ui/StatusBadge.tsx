"use client";

import React from "react";

export type StatusBadgeVariant = "active" | "upcoming" | "pending" | "expired" | "parking-spot";

interface StatusBadgeProps {
  variant?: StatusBadgeVariant;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const variantStyles: Record<StatusBadgeVariant, React.CSSProperties> = {
  active: {
    backgroundColor: "var(--color-tag-active)",
    color: "var(--color-tag-text-active)",
  },
  upcoming: {
    backgroundColor: "var(--color-tag-upcoming)",
    color: "var(--color-tag-text-upcoming)",
  },
  pending: {
    backgroundColor: "var(--color-tag-pending)",
    color: "var(--color-tag-text-pending)",
  },
  expired: {
    backgroundColor: "var(--color-tag-expired)",
    color: "var(--color-tag-text-expired)",
  },
  "parking-spot": {
    backgroundColor: "var(--color-tag-parking-spot)",
    color: "var(--color-text-white)",
  },
};

const dotColors: Record<StatusBadgeVariant, string> = {
  active: "var(--color-tag-text-active)",
  upcoming: "var(--color-tag-text-upcoming)",
  pending: "var(--color-tag-text-pending)",
  expired: "var(--color-tag-text-expired)",
  "parking-spot": "var(--color-text-white)",
};

export function StatusBadge({
  variant = "active",
  children,
  className = "",
  style,
}: StatusBadgeProps) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: "var(--radius-pill)",
        fontFamily: "var(--font-family-body)",
        fontSize: "var(--font-size-extra-tiny)",
        lineHeight: "var(--line-height-extra-tiny)",
        fontWeight: "var(--font-weight-medium)",
        ...variantStyles[variant],
        ...style,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: dotColors[variant],
          flexShrink: 0,
        }}
      />
      {children}
    </span>
  );
}
