"use client";

/**
 * Savings — Condos.
 *
 * A Condo never receives a payout. Its residents book each other's spots
 * with credits, and the building earns its share when a resident buys more
 * with a card. That money is applied to the subscription, so what an
 * operator wants is not a balance going up but a BILL COMING DOWN - which
 * is why every figure on this page is framed as the bill or as what came
 * off it.
 *
 * Four questions, in the order a board asks them:
 *
 *   What did we save        the tiles
 *   Is it getting better    the chart, against the most that is possible
 *   Why is it that number   how savings work, and the month-by-month table
 *   Where did it come from  the bookings that contributed
 *
 * The discount stops at the floor, and what the bill cannot absorb is
 * CARRIED, not lost. Both halves are on the page at once: an operator who
 * only sees the bill will assume the extra activity was wasted.
 */

import React, { useMemo, useState } from "react";

import { PeriodSelector } from "../../components/hoa";
import {
  CardLink,
  RevenueCard,
  RevenueHeader,
  st,
} from "../../components/revenue";
import {
  CONDO_FLOOR_CENTS,
  CONDO_SUBSCRIPTION_CENTS,
  formatDollars,
  formatMoney,
} from "../../lib/demo/pricing";
import {
  condoContributions,
  condoSavingsHistory,
  savedThisYearCents,
} from "../../lib/demo/condo-revenue";
import { ContributingBookings } from "../../components/revenue/ContributingBookings";
import { MonthlySavingsChart } from "../../components/revenue/MonthlySavingsChart";

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
 * The table is SHORTER than the chart on purpose. The chart is there to
 * show a trend, which needs a run of months; the table is there to be read
 * row by row, and six rows of six figures is a wall a board skims past. The
 * recent four are the ones anyone checks.
 */
const TABLE_MONTHS = 4;

/**
 * One headline figure. A tile rather than a chart because the number IS
 * the answer - there is nothing to compare it against on its own.
 */
function StatTile({
  label,
  value,
  /**
   * The undiscounted price, struck through beside the value. A saving only
   * means something against the figure that would otherwise have been paid,
   * and a caption saying so is read after the number rather than with it.
   */
  was,
  tag,
  accent = false,
}: {
  label: string;
  value: string;
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

export default function CondoSavingsPage() {
  const now = useMemo(() => new Date(), []);
  const [range, setRange] = useState<RangeOption>("Last 6 months");
  const savingsMonths = useMemo(
    () => condoSavingsHistory(RANGE_MONTHS[range], now),
    [range, now],
  );
  const contributions = useMemo(() => condoContributions(8, now), [now]);
  const thisMonth = savingsMonths[0];
  const oldest = savingsMonths[savingsMonths.length - 1];
  const savedThisYear = useMemo(() => savedThisYearCents(savingsMonths), [savingsMonths]);

  const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  // The bill is raised once the month it covers has finished.
  const dueLabel = `Due ${MONTHS_SHORT[(now.getMonth() + 1) % 12]} 1`;

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      <RevenueHeader title="Savings" subtitle="How resident sharing lowers your monthly bill" />

      {/* ── The four figures a board asks for, in that order ──────────── */}
      <div style={st.tiles}>
        <StatTile
          label="Saved this month"
          value={formatMoney(thisMonth.savedCents)}
          tag={thisMonth.atMax ? "Max reached" : "still building"}
          accent
        />
        <StatTile
          label="Next invoice"
          was={formatMoney(CONDO_SUBSCRIPTION_CENTS)}
          value={formatMoney(thisMonth.invoiceCents)}
          tag={dueLabel}
        />
        <StatTile
          label="Carryover"
          value={formatMoney(thisMonth.carriedOverCents)}
          tag={thisMonth.carriedOverCents > 0 ? "Applies to next month" : "nothing held back"}
        />
        <StatTile
          label="Saved this year"
          value={formatMoney(savedThisYear)}
          // The full month name, not the axis label. "since Apr" reads as an
          // abbreviation the reader has to expand; the tile has the room.
          tag={`since ${oldest.monthName}`}
        />
      </div>

      {/* ── Is it getting better, and how savings work ────────────────── */}
      <div style={st.twoUp}>
        <RevenueCard
          title="Monthly savings"
          badge={<PeriodSelector value={range} onChange={setRange} options={RANGE_OPTIONS} />}
        >
          <MonthlySavingsChart months={savingsMonths} />
        </RevenueCard>

        <RevenueCard title="How savings work">
          <ol style={st.steps}>
            <li style={st.step}>
              <span style={st.stepNum}>1</span>
              <span>
                <strong style={st.stepTitle}>Card bookings lower your bill</strong>
                <span style={st.stepBody}>
                  Every guest booking paid by card adds to your savings. A booking
                  paid from credits a resident already held does not, because no
                  new money came in.
                </span>
              </span>
            </li>
            <li style={st.step}>
              <span style={st.stepNum}>2</span>
              <span>
                <strong style={st.stepTitle}>
                  Minimum subscription is {formatDollars(CONDO_FLOOR_CENTS)}
                </strong>
                <span style={st.stepBody}>
                  You can save up to {formatDollars(thisMonth.maxSavingsCents)} a month
                  on a {formatDollars(CONDO_SUBSCRIPTION_CENTS)} plan.
                </span>
              </span>
            </li>
            <li style={st.step}>
              <span style={st.stepNum}>3</span>
              <span>
                <strong style={st.stepTitle}>Extra carries over</strong>
                <span style={st.stepBody}>
                  Anything above the max rolls into next month rather than being
                  lost, and is added to that month&rsquo;s sharing before the cap
                  is applied again.
                </span>
              </span>
            </li>
          </ol>
          <CardLink href="/condo/subscription">View subscription and invoices</CardLink>
        </RevenueCard>
      </div>

      {/* ── Why it is that number ─────────────────────────────────────── */}
      <RevenueCard title="Monthly history">
        <div style={st.tableWrap}>
          <table style={st.savingsTable}>
            <thead>
              <tr>
                {["Month", "From sharing", "Carried in", "Saved", "Invoice", "Carried over"].map(
                  (h, i) => (
                    <th key={h} style={{ ...st.savingsTh, textAlign: i === 0 ? "left" : "right" }}>
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {savingsMonths.slice(0, TABLE_MONTHS).map((m) => (
                <tr key={m.id}>
                  <td style={{ ...st.savingsTd, fontWeight: 600 }}>{m.period}</td>
                  <td style={st.savingsTdNum}>{formatMoney(m.fromSharingCents)}</td>
                  <td style={st.savingsTdNum}>{formatMoney(m.carriedInCents)}</td>
                  {/* Plain, like every other figure in the row. Every month
                      in this column saved something, so colouring them all
                      green made the colour mean nothing while shouting. */}
                  <td style={st.savingsTdNum}>
                    {formatMoney(m.savedCents)}
                  </td>
                  <td style={st.savingsTdNum}>{formatMoney(m.invoiceCents)}</td>
                  <td style={st.savingsTdNum}>{formatMoney(m.carriedOverCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </RevenueCard>

      {/* ── Where it came from ────────────────────────────────────────── */}
      <ContributingBookings rows={contributions} />

      {/* Nothing below the history on purpose.

          The "this month so far" card, the past-months table and the
          credit-price card all used to live here. The first two now say
          what the tiles and the monthly history say, and a page that
          states the same six months three times teaches an operator to
          scroll past the part that is actually new. The credit-price card
          answers what a spot COSTS, which is a pricing question - "how
          savings work" beside the chart covers the part that belongs on a
          savings page. */}
    </div>
  );
}
