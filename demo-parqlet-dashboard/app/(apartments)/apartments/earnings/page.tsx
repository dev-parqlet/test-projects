"use client";

/**
 * Earnings — Apartments.
 *
 * The mirror of the Condo Savings page, asking the same four questions in
 * the same order, because an operator who has seen one should be able to
 * read the other:
 *
 *   What did we earn        the tiles
 *   Is it getting better    the chart, against the subscription
 *   Why is it that number   how earnings work, and the month-by-month table
 *   Where did it come from  the bookings that produced it
 *
 * What differs is the ending, and it is the only thing that differs. A
 * Condo's bill stops at a floor and the excess carries forward; an
 * Apartment's bill reaches zero and the excess is CASH. So the third tile
 * is Payouts rather than Carryover, the history's last column is a payout
 * rather than a carryover, and the chart's dashed line is the whole
 * subscription rather than the most that can be discounted.
 *
 * The page it replaced led with "September so far" and "Past withdrawals":
 * an accounting statement, correct and unreadable. It answered what had
 * been transferred without ever answering whether the spots were paying
 * for the subscription, which is the only question this building bought
 * the product to have answered.
 */

import React, { useMemo, useState } from "react";

import { useAuth } from "../../../components/auth/auth-provider";
import { PeriodSelector } from "../../../components/hoa";
import {
  CardLink,
  RevenueCard,
  RevenueHeader,
  st,
} from "../../../components/revenue";
import { BookingEarnings } from "../../../components/revenue/BookingEarnings";
import { MonthlyEarningsChart } from "../../../components/revenue/MonthlyEarningsChart";
import { COMMISSION_PCT, formatDollars, formatMoney } from "../../../lib/demo/pricing";
import {
  apartmentEarningsHistory,
  earnedThisYearCents,
} from "../../../lib/demo/apartment-earnings";

/**
 * The chart's range, as a real control rather than a label.
 *
 * Twelve is genuinely twelve: both ramps in lib/demo were extended to
 * carry it, because `slice(-count)` would otherwise have returned six and
 * quietly shown the wrong thing under a label that said twelve.
 */
const RANGE_OPTIONS = ["Last 3 months", "Last 6 months", "Last 12 months"] as const;
type RangeOption = (typeof RANGE_OPTIONS)[number];
const RANGE_MONTHS: Record<RangeOption, number> = {
  "Last 3 months": 3,
  "Last 6 months": 6,
  "Last 12 months": 12,
};
/**
 * Shorter than the chart on purpose. The chart shows a trend, which needs a
 * run of months; the table is read row by row, and six rows of six figures
 * is a wall an operator skims past.
 */
const TABLE_MONTHS = 4;

function StatTile({
  label,
  value,
  was,
  tag,
  accent = false,
}: {
  label: string;
  value: string;
  /** The undiscounted price, struck through beside the value. */
  was?: string;
  tag?: string;
  accent?: boolean;
}) {
  return (
    <div style={st.tile}>
      <span style={st.tileLabel}>{label}</span>
      <span style={st.tileValueRow}>
        {was && <s style={st.tileWas}>{was}</s>}
        <span style={{ ...st.tileValue, color: accent ? "var(--color-text-success)" : undefined }}>
          {value}
        </span>
      </span>
      {tag && <span style={st.tileTag}>{tag}</span>}
    </div>
  );
}

export default function ApartmentEarningsPage() {
  const { user } = useAuth();
  const buildingId = user?.buildingIds?.[0] ?? null;

  const now = useMemo(() => new Date(), []);
  const [range, setRange] = useState<RangeOption>("Last 6 months");
  const months = useMemo(
    () => apartmentEarningsHistory(RANGE_MONTHS[range], now),
    [range, now],
  );
  const thisMonth = months[0];
  const oldest = months[months.length - 1];
  const earnedThisYear = useMemo(() => earnedThisYearCents(months), [months]);

  const pctOfSubscription = Math.round(
    (thisMonth.appliedCents / thisMonth.subscriptionCents) * 100,
  );

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      <RevenueHeader
        title="Earnings"
        subtitle="What your building earns from Community Spots and resident sharing"
      />

      {/* ── The four figures, in the order they are asked for ─────────── */}
      <div style={st.tiles}>
        <StatTile
          label="Earned this month"
          value={formatMoney(thisMonth.totalCents)}
          tag={`${pctOfSubscription}% of subscription`}
        />
        <StatTile
          label="Next invoice"
          was={formatMoney(thisMonth.subscriptionCents)}
          value={formatMoney(thisMonth.invoiceCents)}
          tag={thisMonth.dueLabel}
        />
        <StatTile
          label="Payouts"
          value={formatMoney(thisMonth.payoutCents)}
          // Says WHERE the threshold is, not just that nothing is due. A
          // bare $0.00 reads as a feature that is not working.
          tag={
            thisMonth.payoutCents > 0
              ? "Sent at month end"
              : `Starts above ${formatDollars(thisMonth.subscriptionCents)}`
          }
        />
        <StatTile
          label="Earned this year"
          value={formatMoney(earnedThisYear)}
          tag={`since ${oldest.monthName}`}
        />
      </div>

      {/* ── Is it getting better, and how earnings work ───────────────── */}
      <div style={st.twoUp}>
        <RevenueCard
          title="Monthly earnings"
          badge={<PeriodSelector value={range} onChange={setRange} options={RANGE_OPTIONS} />}
        >
          <MonthlyEarningsChart months={months} />
        </RevenueCard>

        <RevenueCard title="How earnings work">
          <ol style={st.steps}>
            <li style={st.step}>
              <span style={st.stepNum}>1</span>
              <span>
                <strong style={st.stepTitle}>Community Spots</strong>
                <span style={st.stepBody}>
                  You earn the spot price minus Parqlet {COMMISSION_PCT}% and Stripe
                  fees.
                </span>
              </span>
            </li>
            <li style={st.step}>
              <span style={st.stepNum}>2</span>
              <span>
                <strong style={st.stepTitle}>Resident spots</strong>
                <span style={st.stepBody}>
                  You earn a share when residents pay by card to book each
                  other&rsquo;s spots.
                </span>
              </span>
            </li>
            <li style={st.step}>
              <span style={st.stepNum}>3</span>
              <span>
                <strong style={st.stepTitle}>Reused credits</strong>
                <span style={st.stepBody}>
                  Credits were already paid for once, so only the card-paid extra
                  counts.
                </span>
              </span>
            </li>
            <li style={st.step}>
              <span style={st.stepNum}>4</span>
              <span>
                <strong style={st.stepTitle}>Lower bill, then payouts</strong>
                <span style={st.stepBody}>
                  Earnings reduce your subscription to $0. Anything above
                  is paid out.
                </span>
              </span>
            </li>
          </ol>
          <CardLink href="/apartment/subscription">View subscription and invoices</CardLink>
        </RevenueCard>
      </div>

      {/* ── Where it came from ────────────────────────────────────────── */}
      <BookingEarnings buildingId={buildingId} />

      {/* ── Why it is that number ─────────────────────────────────────── */}
      <RevenueCard title="Monthly history">
        <div style={st.tableWrap}>
          <table style={st.savingsTable}>
            <thead>
              <tr>
                {["Month", "Community Spots", "Resident spots", "Total earned", "Invoice", "Payout", ""].map(
                  (h, i) => (
                    <th
                      key={h || "actions"}
                      style={{ ...st.savingsTh, textAlign: i === 0 ? "left" : "right" }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {months.slice(0, TABLE_MONTHS).map((m) => (
                <tr key={m.id}>
                  <td style={{ ...st.savingsTd, fontWeight: 600 }}>{m.period}</td>
                  <td style={st.savingsTdNum}>{formatMoney(m.communityCents)}</td>
                  <td style={st.savingsTdNum}>{formatMoney(m.residentCents)}</td>
                  {/* Plain, like every other figure in the row. Every month
                      in this column earned something, so colouring them all
                      green made the colour mean nothing while shouting. The
                      Condo's Saved column reads the same way. */}
                  <td style={st.savingsTdNum}>
                    {formatMoney(m.totalCents)}
                  </td>
                  <td style={st.savingsTdNum}>{formatMoney(m.invoiceCents)}</td>
                  <td style={st.savingsTdNum}>{formatMoney(m.payoutCents)}</td>
                  <td style={st.savingsTdNum}>
                    <CardLink href="/apartment/subscription">View invoice</CardLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </RevenueCard>
    </div>
  );
}
