"use client";

/**
 * Income — Apartments only.
 *
 * An HOA never sees this: its residents earn credits, and no money moves
 * between Parqlet and the building. An Apartments building owns its spots,
 * is paid in dollars by public users, and withdraws the balance.
 *
 * The withdrawal rule is the product rule, not a UI nicety: once per
 * calendar month, paid within 3 working days. The button is therefore
 * disabled with the reason shown rather than hidden, so an operator can see
 * that the money is there and when they can take it.
 */

import React, { useMemo, useState } from "react";

import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import {
  COMMISSION_PCT,
  currentPeriod,
  formatMoney,
  recentPayouts,
} from "../../lib/demo/apartments-data";

export default function IncomePage() {
  const now = useMemo(() => new Date(), []);
  const period = useMemo(() => currentPeriod(now), [now]);
  const payouts = useMemo(() => recentPayouts(5, now), [now]);
  const [requested, setRequested] = useState(false);

  // Once per calendar month. The most recent row is this month's earnings
  // still accruing; a withdrawal already in flight blocks another.
  const pendingPayout = payouts.find((p) => p.status === "Processing");
  const canWithdraw = !pendingPayout && period.netCents > 0 && !requested;

  const withdrawBlockedReason = requested
    ? "Withdrawal requested. You will be paid within 3 working days."
    : pendingPayout
      ? `Your ${pendingPayout.period} withdrawal is still processing. One withdrawal per month.`
      : period.netCents === 0
        ? "Nothing to withdraw yet this month."
        : null;

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={s.h1}>Income</h1>
        <p style={s.sub}>
          What residents of the Parqlet app have paid for parking at your
          building, less our {COMMISSION_PCT}% commission.
        </p>
      </div>

      {/* ── This month ───────────────────────────────────────────────── */}
      <div style={s.card}>
        <div style={s.cardHead}>
          <span style={s.cardTitle}>{period.period} so far</span>
          <Badge variant="active">Open</Badge>
        </div>

        <div style={s.figures}>
          <Figure label="Collected from renters" value={formatMoney(period.grossCents)} />
          <Figure
            label={`Parqlet commission (${COMMISSION_PCT}%)`}
            value={`− ${formatMoney(period.commissionCents)}`}
            muted
          />
          <Figure label="Your balance" value={formatMoney(period.netCents)} strong />
        </div>

        <div style={s.withdrawRow}>
          <Button
            variant="primary"
            disabled={!canWithdraw}
            onClick={() => setRequested(true)}
          >
            Withdraw {formatMoney(period.netCents)}
          </Button>
          <span style={s.hint}>
            {withdrawBlockedReason ??
              "Paid to your card within 3 working days. One withdrawal per month."}
          </span>
        </div>
      </div>

      {/* ── History ──────────────────────────────────────────────────── */}
      <div style={s.card}>
        <span style={s.cardTitle}>Past withdrawals</span>
        <table style={s.table}>
          <thead>
            <tr>
              {["Period", "Collected", `Commission (${COMMISSION_PCT}%)`, "Paid to you", "Status", "Paid on"].map((h) => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payouts.map((p) => (
              <tr key={p.id}>
                <td style={s.td}>{p.period}</td>
                <td style={s.td}>{formatMoney(p.grossCents)}</td>
                <td style={{ ...s.td, color: "var(--color-text-weak)" }}>
                  − {formatMoney(p.commissionCents)}
                </td>
                <td style={{ ...s.td, fontWeight: 600 }}>{formatMoney(p.netCents)}</td>
                <td style={s.td}>
                  <Badge variant={p.status === "Paid" ? "active" : "pending"}>
                    {p.status}
                  </Badge>
                </td>
                <td style={{ ...s.td, color: "var(--color-text-weak)" }}>
                  {p.paidOn
                    ? new Date(p.paidOn).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Figure({
  label,
  value,
  strong,
  muted,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={s.figureLabel}>{label}</span>
      <span
        style={{
          fontSize: strong ? 28 : 20,
          fontWeight: strong ? 700 : 500,
          color: muted ? "var(--color-text-weak)" : "var(--color-text-strong)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  h1: { margin: 0, fontSize: 24, fontWeight: 600, color: "var(--color-text-strong)" },
  sub: { margin: "6px 0 0", fontSize: 14, color: "var(--color-text-weak)" },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    padding: 24,
    borderRadius: 16,
    border: "1px solid var(--color-stroke-medium)",
    background: "var(--color-fill-white)",
  },
  cardHead: { display: "flex", alignItems: "center", gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: 600, color: "var(--color-text-strong)" },
  figures: { display: "flex", gap: 48, flexWrap: "wrap" },
  figureLabel: { fontSize: 12, color: "var(--color-text-weak)" },
  withdrawRow: { display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" },
  hint: { fontSize: 12, color: "var(--color-text-weak)" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    fontSize: 12,
    fontWeight: 500,
    color: "var(--color-text-weak)",
    padding: "8px 12px 8px 0",
    borderBottom: "1px solid var(--color-stroke-medium)",
    whiteSpace: "nowrap",
  },
  td: {
    fontSize: 14,
    color: "var(--color-text-strong)",
    padding: "12px 12px 12px 0",
    borderBottom: "1px solid var(--color-stroke-medium)",
    whiteSpace: "nowrap",
  },
};
