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
import {
  condoSavingsHistory,
  currentCondoMonth,
  recentCondoMonths,
  savedThisYearCents,
} from "../../lib/demo/condo-revenue";
import { MonthlySavingsChart } from "../../components/revenue/MonthlySavingsChart";
import { CreditPriceCard } from "../../components/pricing/CreditPriceCard";
import { CONDO_PRICE_FOOTNOTE, CONDO_PRICE_ROWS } from "../../lib/demo/price-rows";

/**
 * One headline figure. A tile rather than a chart because the number IS
 * the answer - there is nothing to compare it against on its own.
 */
function StatTile({
  label,
  value,
  tag,
  accent = false,
}: {
  label: string;
  value: string;
  tag?: string;
  accent?: boolean;
}) {
  return (
    <div style={st.tile}>
      <span style={st.tileLabel}>{label}</span>
      <span style={{ ...st.tileValue, color: accent ? "var(--color-text-success)" : undefined }}>
        {value}
      </span>
      {tag && <span style={st.tileTag}>{tag}</span>}
    </div>
  );
}

export default function CondoRevenuePage() {
  const now = useMemo(() => new Date(), []);
  const month = useMemo(() => currentCondoMonth(now), [now]);
  const history = useMemo(() => recentCondoMonths(5, now), [now]);
  const savingsMonths = useMemo(() => condoSavingsHistory(6, now), [now]);
  const thisMonth = savingsMonths[0];
  const savedThisYear = useMemo(() => savedThisYearCents(savingsMonths), [savingsMonths]);

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
          value={formatMoney(thisMonth.invoiceCents)}
          tag={month.dueLabel.replace("Due ", "Due ")}
        />
        <StatTile
          label="Carryover"
          value={formatMoney(thisMonth.carriedOverCents)}
          tag={thisMonth.carriedOverCents > 0 ? "Applies to next month" : "nothing held back"}
        />
        <StatTile
          label="Saved this year"
          value={formatMoney(savedThisYear)}
          tag={`since ${savingsMonths[savingsMonths.length - 1].short}`}
        />
      </div>

      {/* ── Is it getting better, and how savings work ────────────────── */}
      <div style={st.twoUp}>
        <RevenueCard title="Monthly savings">
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
                  Your bill never drops below {formatMoney(CONDO_FLOOR_CENTS)}
                </strong>
                <span style={st.stepBody}>
                  You can save up to {formatMoney(thisMonth.maxSavingsCents)} a month
                  on a {formatMoney(month.subscriptionCents)} plan.
                </span>
              </span>
            </li>
            <li style={st.step}>
              <span style={st.stepNum}>3</span>
              <span>
                <strong style={st.stepTitle}>Extra carries over</strong>
                <span style={st.stepBody}>
                  Anything above the max rolls into next month rather than being
                  lost.
                </span>
              </span>
            </li>
          </ol>
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
              {savingsMonths.map((m) => (
                <tr key={m.id}>
                  <td style={{ ...st.savingsTd, fontWeight: 600 }}>{m.period}</td>
                  <td style={st.savingsTdNum}>{formatMoney(m.fromSharingCents)}</td>
                  <td style={st.savingsTdNum}>{formatMoney(m.carriedInCents)}</td>
                  <td style={{ ...st.savingsTdNum, color: "var(--color-text-success)", fontWeight: 600 }}>
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
