"use client";

import { IcCalendar, IcArrowUp } from "../icons";
import { colors } from "../ui/chart-utils";

interface StatCardProps {
  label: string;
  /** Pre-formatted when it is money or a pair; a plain count otherwise. */
  value: number | string;
  tag: string;
  /**
   * Turns the card into a split bar: two shares of one total, drawn in the
   * same two tones the Recent Activity chart uses for the same two things.
   * Only a building that OWNS spots has a split to show - a Condo's
   * residents own every spot, so it never passes this.
   */
  split?: { primary: number; secondary: number };
}

/**
 * ONE card, both products. There used to be an `apartment` variant that
 * dropped the glyphs and used its own size, weight and letter-spacing;
 * the result was that the two dashboards' statistics did not look like
 * each other, which was never the intent. The only real difference is
 * the split bar, and `split` already says when to draw one.
 */
export function StatCard({ label, value, tag, split }: StatCardProps) {
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
            color: "var(--color-text-weak)",
            textTransform: "uppercase" as const,
          }}
        >
          {label}
        </span>
        <IcCalendar />
      </div>

      <span
        style={{
          fontSize: 24,
          // 400, not 500. The figure is already carried by its size; at
          // medium weight a value that is a phrase rather than a numeral
          // ("22 Comm / 6 Res") read heavier than the rest of the row.
          fontWeight: 400,
          lineHeight: "28px",
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
