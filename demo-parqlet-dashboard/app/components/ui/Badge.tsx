"use client";
import { ReactNode } from "react";

export type BadgeVariant =
  | "active"          // Active, Registered, Low
  | "upcoming"        // Upcoming, Expiring Soon
  | "expired"         // Expired, Overdue, High
  | "pending"         // Pending
  | "inactive"        // Inactive — no subscription
  | "registered"      // Registered (same green as active)
  | "not-registered"; // Hasn't Registered

export interface BadgeProps {
  variant?: BadgeVariant | string;
  children: ReactNode;
  as?: "div" | "span";
}

const VARIANT_MAP: Record<BadgeVariant, { bg: string; color: string }> = {
  active:          { bg: "var(--color-tag-active)",   color: "var(--color-tag-text-active)"   },
  upcoming:        { bg: "var(--color-tag-upcoming)",  color: "var(--color-tag-text-upcoming)"  },
  expired:         { bg: "var(--color-tag-expired)",  color: "var(--color-tag-text-expired)"  },
  pending:         { bg: "var(--color-tag-pending)",  color: "var(--color-tag-text-pending)"  },
  inactive:        { bg: "var(--color-tag-stats)",    color: "var(--color-text-strong)"       },
  registered:      { bg: "var(--color-tag-active)",   color: "var(--color-tag-text-active)"   },
  "not-registered": { bg: "var(--color-tag-stats)",  color: "var(--color-text-strong)"       },
};

const BASE_STYLE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "var(--radius-48)",
  padding: "var(--spacing-4) var(--spacing-8)",
  whiteSpace: "nowrap",
};

const TEXT_STYLE: React.CSSProperties = {
  fontSize: "var(--font-size-extra-tiny)",
  lineHeight: "var(--line-height-extra-tiny)",
  fontFamily: "var(--font-family-body)",
  fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
};

export function Badge({ variant = "active", children, as: Tag = "div" }: BadgeProps) {
  const { bg, color } = VARIANT_MAP[variant as BadgeVariant] ?? VARIANT_MAP.active;
  return (
    <Tag style={{ ...BASE_STYLE, background: bg }}>
      <span style={{ ...TEXT_STYLE, color }}>
        {children}
      </span>
    </Tag>
  );
}