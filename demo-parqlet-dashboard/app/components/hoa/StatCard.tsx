"use client";

import { useState } from "react";
import { IcCalendar, IcArrowUp } from "../icons";
import { colors } from "../ui/chart-utils";

interface StatCardProps {
  label: string;
  value: number;
  tag: string;
}

export function StatCard({ label, value, tag }: StatCardProps) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        background: colors.white,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontFamily: "var(--font-family-body)",
            fontSize: "var(--font-size-uppercase)",
            lineHeight: "var(--line-height-uppercase)",
            fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
            color: "var(--color-text-weak)",
            textTransform: "uppercase" as const,
          }}
        >
          {label}
        </span>
        <IcCalendar />
      </div>
      <span style={{ fontSize: 24, fontWeight: 500, lineHeight: "28px", color: colors.textStrong }}>
        {value}
      </span>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: colors.tagBg,
            borderRadius: 47,
            padding: "4px 8px",
            fontSize: 12,
            color: colors.textStrong,
            lineHeight: "16px",
          }}
        >
          {tag}
          <IcArrowUp />
        </div>
      </div>
    </div>
  );
}