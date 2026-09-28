"use client";

/**
 * Revenue — Apartments only.
 *
 * The mirror of the Condo page, and deliberately a different story. A
 * Condo's earnings only ever pull its bill down towards a floor. An
 * Apartment's clear the bill outright and the rest is money it takes out.
 *
 * The withdrawal rule is a product rule, not a UI nicety: once per
 * calendar month, paid within 3 working days. The button is therefore
 * disabled with the reason shown rather than hidden, so an operator can
 * see that the money is there and when they can have it.
 */

import React, { useMemo, useState } from "react";

import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import {
  Figure,
  FigureRow,
  HistoryTable,
  OffsetBar,
  RevenueCard,
  RevenueHeader,
  st,
  type HistoryRow,
} from "../../../components/revenue";
import {
  APARTMENT_FLOOR_CENTS,
  APARTMENT_SUBSCRIPTION_CENTS,
  BASE_PRICE_CENTS,
  BASE_PRICE_CREDITS,
  COMMISSION_PCT,
  PITCH,
  applyOffset,
  formatMoney,
  netToBuilding,
} from "../../../lib/demo/pricing";
import { currentPeriod, recentPayouts } from "../../../lib/demo/apartments-data";

export default function ApartmentsRevenuePage() {
  const now = useMemo(() => new Date(), []);
  const period = useMemo(() => currentPeriod(now), [now]);
  const payouts = useMemo(() => recentPayouts(5, now), [now]);
  const [requested, setRequested] = useState(false);

  const offset = applyOffset({
    subscriptionCents: APARTMENT_SUBSCRIPTION_CENTS,
    earningsCents: period.netCents,
    floorCents: APARTMENT_FLOOR_CENTS,
  });

  // Only what the subscription could not absorb is yours to take out.
  const withdrawableCents = offset.surplusCents;

  // Once per calendar month, and the month that matters is THIS one. The
  // history below is completed months only, so nothing there can block a
  // withdrawal or lend its name to the notice.
  const canWithdraw = withdrawableCents > 0 && !requested;

  const blockedReason = requested
    ? `Your ${period.period} withdrawal is being processed. You will be paid within 3 working days, and you can withdraw again next month.`
    : withdrawableCents === 0
      ? "This month's earnings have gone to your subscription. Anything past it is yours to withdraw."
      : null;

  const completed: HistoryRow[] = payouts.map((p) => ({
    id: p.id,
    period: p.period,
    grossCents: p.grossCents,
    feesCents: p.commissionCents,
    netCents: p.netCents,
    status: p.status,
    trailing: p.paidOn
      ? new Date(p.paidOn).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "—",
  }));

  // A withdrawal taken just now appears at the top of its own month,
  // rather than the page claiming it is done while the table disagrees.
  const rows: HistoryRow[] = requested
    ? [
        {
          id: "pending",
          period: period.period,
          grossCents: period.grossCents,
          feesCents: period.commissionCents,
          netCents: withdrawableCents,
          status: "Processing",
          trailing: "—",
        },
        ...completed,
      ]
    : completed;

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      <RevenueHeader pitch={PITCH.apartments}>
        Every spot rents for a base of {BASE_PRICE_CREDITS} credit
        ({formatMoney(BASE_PRICE_CENTS)} a day), plus whatever extra you
        set on the spots you own. On a {formatMoney(BASE_PRICE_CENTS)}{" "}
        booking you receive{" "}
        <strong>{formatMoney(netToBuilding(BASE_PRICE_CENTS))}</strong> and
        we keep {formatMoney(BASE_PRICE_CENTS - netToBuilding(BASE_PRICE_CENTS))}{" "}
        as our {COMMISSION_PCT}% commission and card fees.
      </RevenueHeader>

      {/* ── This month ───────────────────────────────────────────────── */}
      <RevenueCard title={`${period.period} so far`} badge={<Badge variant="active">Open</Badge>}>
        <FigureRow>
          <Figure label="Collected from renters" value={formatMoney(period.grossCents)} />
          <Figure
            label="Commission + card fees"
            value={`− ${formatMoney(period.commissionCents)}`}
            tone="muted"
          />
          <Figure label="You earned" value={formatMoney(period.netCents)} />
        </FigureRow>

        <OffsetBar offset={offset} floorLabel="Your bill can reach zero" />

        <FigureRow>
          <Figure
            label="Subscription"
            value={formatMoney(offset.subscriptionCents)}
            note={offset.subscriptionCents === 0 ? "you have none" : "per month"}
          />
          <Figure
            label="Your bill this month"
            value={formatMoney(offset.dueCents)}
            note={
              offset.dueCents === 0
                ? "covered in full by your spots"
                : `${formatMoney(offset.appliedCents)} covered so far`
            }
          />
          <Figure label="Yours to withdraw" value={formatMoney(withdrawableCents)} tone="strong" />
        </FigureRow>

        <div style={st.actionRow}>
          <Button
            variant="primary"
            size="small"
            style={{ width: "auto", whiteSpace: "nowrap" }}
            disabled={!canWithdraw}
            onClick={() => setRequested(true)}
          >
            Withdraw {formatMoney(withdrawableCents)}
          </Button>
          <span style={st.hint}>
            {blockedReason ??
              `Paid to your account within 3 working days. One withdrawal per month, so this covers ${period.period}.`}
          </span>
        </div>
      </RevenueCard>

      {/* ── History ──────────────────────────────────────────────────── */}
      <RevenueCard title="Past withdrawals">
        <HistoryTable
          columns={[
            "Period",
            "Collected",
            "Commission + fees",
            "Paid to you",
            "Status",
            "Paid on",
          ]}
          rows={rows}
        />
      </RevenueCard>
    </div>
  );
}
