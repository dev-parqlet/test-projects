"use client";

/**
 * Revenue — Condos (HOA).
 *
 * A Condo never receives a payout. Its residents book each other's spots
 * with credits, and the building earns its share when a resident buys
 * more credits with a card. That money is applied to the monthly
 * subscription, so what the operator wants to see is not a balance going
 * up but a BILL COMING DOWN.
 *
 * The discount stops at the floor. A building that earns more than the
 * discount is worth does not get a negative invoice: it pays the floor,
 * and the rest is additional revenue shown separately. Both halves are on
 * the page at once, because an operator who only sees the bill will
 * assume the extra activity was wasted.
 */

import React, { useMemo } from "react";

import { Badge } from "../../components/ui/Badge";
import {
  Figure,
  FigureRow,
  HistoryTable,
  OffsetBar,
  RevenueCard,
  RevenueHeader,
  st,
  type HistoryRow,
} from "../../components/revenue";
import {
  COMMISSION_PCT,
  CONDO_FLOOR_CENTS,
  PITCH,
  applyOffset,
  formatMoney,
} from "../../lib/demo/pricing";
import { currentCondoMonth, recentCondoMonths } from "../../lib/demo/condo-revenue";
import { CreditPriceCard } from "../../components/pricing/CreditPriceCard";
import { CONDO_PRICE_FOOTNOTE, CONDO_PRICE_ROWS } from "../../lib/demo/price-rows";

export default function CondoRevenuePage() {
  const now = useMemo(() => new Date(), []);
  const month = useMemo(() => currentCondoMonth(now), [now]);
  const history = useMemo(() => recentCondoMonths(5, now), [now]);

  const offset = applyOffset({
    subscriptionCents: month.subscriptionCents,
    earningsCents: month.earningsCents,
    floorCents: CONDO_FLOOR_CENTS,
  });

  const rows: HistoryRow[] = history.map((m) => ({
    id: m.id,
    period: m.period,
    grossCents: m.grossCents,
    feesCents: m.feesCents,
    netCents: m.dueCents,
    status: m.status,
    trailing: m.surplusCents > 0 ? `+ ${formatMoney(m.surplusCents)}` : "—",
  }));

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      <RevenueHeader
        pitch={PITCH.condo}
        aside={<CreditPriceCard rows={CONDO_PRICE_ROWS} footnote={CONDO_PRICE_FOOTNOTE} />}
      >
        Your residents pay each other in credits. You earn when they buy
        those credits, less our {COMMISSION_PCT}% commission and card fees,
        and what you earn comes off your subscription. The discount stops
        at {formatMoney(CONDO_FLOOR_CENTS)} a month; anything you earn
        beyond that is yours on top.
      </RevenueHeader>

      {/* ── This month ───────────────────────────────────────────────── */}
      <RevenueCard title={`${month.period} so far`} badge={<Badge variant="active">Open</Badge>}>
        <FigureRow>
          <Figure label="Residents bought" value={formatMoney(month.grossCents)} note="in credits this month" />
          <Figure
            label={`Commission + card fees`}
            value={`− ${formatMoney(month.feesCents)}`}
            tone="muted"
          />
          <Figure label="You earned" value={formatMoney(month.earningsCents)} />
        </FigureRow>

        <OffsetBar offset={offset} />

        <FigureRow>
          <Figure label="Subscription" value={formatMoney(offset.subscriptionCents)} note="per month" />
          <Figure
            label="Your bill this month"
            value={formatMoney(offset.dueCents)}
            tone="strong"
            note={
              offset.dueCents <= CONDO_FLOOR_CENTS
                ? `At the ${formatMoney(CONDO_FLOOR_CENTS)} minimum`
                : `${formatMoney(offset.appliedCents)} taken off by your residents' activity`
            }
          />
          {offset.surplusCents > 0 && (
            <Figure
              label="Additional revenue"
              value={formatMoney(offset.surplusCents)}
              note="earned beyond the discount"
            />
          )}
        </FigureRow>

        <span style={st.hint}>
          {offset.surplusCents > 0
            ? `Your bill is already at the ${formatMoney(CONDO_FLOOR_CENTS)} minimum, so everything your residents book from here is additional revenue.`
            : `Every booking your residents pay for takes more off this bill, down to ${formatMoney(CONDO_FLOOR_CENTS)}.`}
        </span>
      </RevenueCard>

      {/* ── History ──────────────────────────────────────────────────── */}
      <RevenueCard title="Past months">
        <HistoryTable
          columns={[
            "Period",
            "Residents bought",
            `Commission + fees`,
            "You paid",
            "Status",
            "Additional revenue",
          ]}
          rows={rows}
        />
      </RevenueCard>
    </div>
  );
}
