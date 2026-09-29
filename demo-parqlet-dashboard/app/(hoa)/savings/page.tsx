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
  SavingsBar,
  RevenueCard,
  RevenueHeader,
  st,
  type HistoryRow,
} from "../../components/revenue";
import {
  COMMISSION_PCT,
  CONDO_FLOOR_CENTS,
  PITCH,
  applyCondoSavings,
  formatMoney,
} from "../../lib/demo/pricing";
import { currentCondoMonth, recentCondoMonths } from "../../lib/demo/condo-revenue";
import { CreditPriceCard } from "../../components/pricing/CreditPriceCard";
import { CONDO_PRICE_FOOTNOTE, CONDO_PRICE_ROWS } from "../../lib/demo/price-rows";

export default function CondoRevenuePage() {
  const now = useMemo(() => new Date(), []);
  const month = useMemo(() => currentCondoMonth(now), [now]);
  const history = useMemo(() => recentCondoMonths(5, now), [now]);

  const savings = applyCondoSavings({
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
    trailing: m.surplusCents > 0 ? `${formatMoney(m.surplusCents)} carried` : "—",
  }));

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      <RevenueHeader />

      {/* ── This month ───────────────────────────────────────────────── */}
      <RevenueCard title={`${month.period} so far`} badge={<Badge variant="active">Open</Badge>}>
        {/* The bill first. A board opens this page to answer "what do we
            pay this month", and it used to have to read three figures and
            do the subtraction itself. */}
        <FigureRow>
          <Figure
            label="Your bill this month"
            value={formatMoney(savings.dueCents)}
            tone="strong"
            note={
              savings.atMax
                ? `At the ${formatMoney(savings.floorCents)} minimum, the lowest it can go`
                : `${formatMoney(savings.subscriptionCents)} subscription, less what your residents saved you`
            }
          />
          <Figure
            label="You saved"
            value={formatMoney(savings.savingsCents)}
            note="thanks to resident sharing"
          />
          <Figure
            label="Subscription"
            value={formatMoney(savings.subscriptionCents)}
            tone="muted"
            note="before savings"
          />
        </FigureRow>

        <SavingsBar savings={savings} />

        <FigureRow>
          <Figure
            label="From resident sharing"
            value={formatMoney(savings.availableCents)}
            note={
              savings.carriedInCents > 0
                ? `includes ${formatMoney(savings.carriedInCents)} carried in from last month`
                : "collected this month"
            }
          />
          {savings.carriedOverCents > 0 && (
            <Figure
              label="Carries over"
              value={formatMoney(savings.carriedOverCents)}
              note="applied to next month's bill"
            />
          )}
        </FigureRow>

        <span style={st.hint}>
          {savings.atMax
            ? `Your bill is at the ${formatMoney(savings.floorCents)} minimum, so anything more your residents book carries over to next month rather than being lost.`
            : `Every booking your residents pay for takes more off this bill, down to ${formatMoney(savings.floorCents)}.`}
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
      {/* Full width, and last: it explains the arithmetic above rather
          than introducing it, so it reads better after the figures. */}
      <CreditPriceCard
        rows={CONDO_PRICE_ROWS}
        footnote={CONDO_PRICE_FOOTNOTE}
        intro={
          <>
            <span>{PITCH.condo}</span>
            <span>
              Your residents pay each other in credits. You earn when they buy
              those credits, less our {COMMISSION_PCT}% commission and card
              fees, and what you earn comes off your subscription. The discount
              stops at {formatMoney(CONDO_FLOOR_CENTS)} a month; anything you
              earn beyond that is yours on top.
            </span>
          </>
        }
      />

    </div>
  );
}
