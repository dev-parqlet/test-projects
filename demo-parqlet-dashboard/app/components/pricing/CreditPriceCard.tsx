"use client";

/**
 * What a spot costs here, stated plainly.
 *
 * The first question either kind of operator asks is "what does this cost
 * my residents", and until now the answer was only inferable: the Condo
 * dashboard never named a credit price at all, and the Apartment side
 * showed per-spot totals without saying what the credit underneath them
 * was worth. A prospect should not have to divide two numbers on a screen
 * to find the base.
 *
 * Presentational only. Both products pass their own rows, because the
 * answer genuinely differs: a Condo has one price for the whole building,
 * an Apartment has that same base plus an extra on the spots it owns
 * itself. Shared styling, separate content - the same split the Revenue
 * screens use.
 */

import React from "react";

import { Card } from "../ui/Card";
import { BASE_PRICE_CREDITS, CREDIT_PRICE_CENTS, formatMoney } from "../../lib/demo/pricing";

export type PriceRow = {
  label: string;
  /** e.g. "1 credit" or "1 credit + $10.00" */
  price: string;
  /** What the renter actually pays, in dollars. */
  total: string;
  note?: string;
};

export function CreditPriceCard({
  rows,
  footnote,
}: {
  rows: readonly PriceRow[];
  footnote: string;
}) {
  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-16)" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "var(--spacing-12)", flexWrap: "wrap" }}>
        <span style={s.title}>What a spot costs</span>
        <span style={s.rate}>
          {BASE_PRICE_CREDITS} credit = <strong>{formatMoney(CREDIT_PRICE_CENTS)}</strong>
        </span>
      </div>

      <div style={s.rows}>
        {rows.map((r) => (
          <div key={r.label} style={s.row}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <span style={s.rowLabel}>{r.label}</span>
              {r.note && <span style={s.rowNote}>{r.note}</span>}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "var(--spacing-8)", flexShrink: 0 }}>
              <span style={s.rowPrice}>{r.price}</span>
              <span style={s.rowTotal}>{r.total}</span>
            </div>
          </div>
        ))}
      </div>

      <span style={s.footnote}>{footnote}</span>
    </Card>
  );
}

const s: Record<string, React.CSSProperties> = {
  title: { fontSize: "var(--font-size-body)", fontWeight: 600, color: "var(--color-text-strong)" },
  rate: { fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)" },
  rows: { display: "flex", flexDirection: "column" },
  row: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: "var(--spacing-16)", padding: "var(--spacing-12) 0",
    borderBottom: "1px solid var(--color-stroke-medium)",
  },
  rowLabel: { fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)" },
  rowNote: { fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)" },
  rowPrice: { fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", whiteSpace: "nowrap" },
  rowTotal: { fontSize: "var(--font-size-body)", fontWeight: 600, color: "var(--color-text-strong)", whiteSpace: "nowrap" },
  footnote: { fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", lineHeight: 1.6 },
};
