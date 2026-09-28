"use client";

import { IcCalendar, IcArrowUp } from "../icons";
import { colors } from "../ui/chart-utils";

export type StatCardVariant = "hoa" | "apartment";

interface StatCardProps {
  label: string;
  /** Pre-formatted when it is money or a pair; a plain count otherwise. */
  value: number | string;
  tag: string;
  /**
   * `hoa` is the card the production dashboard already ships - calendar
   * glyph, arrow in the pill - and the Condo keeps it unchanged.
   *
   * `apartment` is the redesign: no glyphs, a heavier figure, and room
   * for a split bar. Kept as a variant rather than replacing the other,
   * because changing the Condo's statistics was never the ask.
   */
  variant?: StatCardVariant;
  /**
   * Turns the card into a split bar: two shares of one total, drawn in the
   * same two tones the Recent Activity chart uses for the same two things.
   * Only a building that OWNS spots has a split to show - a Condo's
   * residents own every spot, so it never passes this.
   */
  split?: { primary: number; secondary: number };
}

export function StatCard({ label, value, tag, variant = "hoa", split }: StatCardProps) {
  const isApartment = variant === "apartment";
  const total = split ? split.primary + split.secondary : 0;
  const pct = total > 0 ? (split!.primary / total) * 100 : 0;

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
            color: isApartment ? "var(--color-text-strong)" : "var(--color-text-weak)",
            textTransform: "uppercase" as const,
            letterSpacing: isApartment ? "0.04em" : undefined,
          }}
        >
          {label}
        </span>
        {!isApartment && <IcCalendar />}
      </div>

      <span
        style={{
          fontSize: isApartment ? 26 : 24,
          fontWeight: isApartment ? 600 : 500,
          lineHeight: isApartment ? "30px" : "28px",
          color: colors.textStrong,
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>

      {split && (
        <div style={{ height: 8, borderRadius: 999, background: "var(--color-fill-weak)", overflow: "hidden", display: "flex" }}>
          <div style={{ width: `${pct}%`, background: "var(--color-spot-community)" }} />
          <div style={{ flex: 1, background: "var(--color-spot-neighbor)" }} />
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: colors.tagBg,
            borderRadius: 47,
            padding: isApartment ? "4px 10px" : "4px 8px",
            fontSize: 12,
            color: colors.textStrong,
            lineHeight: "16px",
          }}
        >
          {tag}
          {!isApartment && <IcArrowUp />}
        </div>
      </div>
    </div>
  );
}
