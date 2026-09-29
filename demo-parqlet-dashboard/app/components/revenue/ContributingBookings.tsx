"use client";

/**
 * The bookings behind a month's savings.
 *
 * The page states the rule twice above this - card bookings lower the bill,
 * reused credits do not - and this is where an operator can see it happen.
 * A row showing $0.00 against a real booking is the part that gets queried,
 * so the "reused" word carries the explanation rather than a footnote
 * somewhere else on the page.
 *
 * The filter is three states rather than a checkbox because "show me only
 * the ones that earned nothing" is a real question: it is how an operator
 * works out whether their residents are topping up or just recycling
 * credits between themselves, which is the difference between a bill that
 * falls and one that does not.
 *
 * Attribution is the backend's (api-backend lib/savings-contributions.ts).
 * Nothing here recomputes a share - CLAUDE.md is explicit that the backend
 * owns these splits.
 */

import React, { useState } from "react";

import { formatMoney as money } from "../../lib/demo/pricing";
import type { DemoContribution as SavingsContribution } from "../../lib/demo/condo-revenue";

type Filter = "all" | "card" | "reused";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "card", label: "Card" },
  { id: "reused", label: "Reused credit" },
];

/** "2026-09-27T…" → "Sep 27, 2026". */
function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function matches(row: SavingsContribution, filter: Filter): boolean {
  if (filter === "all") return true;
  // A mixed booking drew on both, so it belongs in both lists rather than
  // disappearing from each.
  if (filter === "card") return row.cardCredits > 0;
  return row.reusedCredits > 0;
}

export function ContributingBookings({ rows: all }: { rows: SavingsContribution[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [explain, setExplain] = useState<string | null>(null);

  const isLoading = false;
  const data = { total: all.length };
  const rows = all.filter((r) => matches(r, filter));

  return (
    <div style={st.card}>
      <div style={st.head}>
        <div>
          <span style={st.title}>CONTRIBUTING BOOKINGS</span>
          <p style={st.sub}>
            Bookings paid by card lower your bill. Reused credits don&rsquo;t add
            savings.
          </p>
        </div>
        <div style={st.filters} role="group" aria-label="Filter bookings by payment">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              style={{ ...st.filter, ...(filter === f.id ? st.filterOn : null) }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <span style={st.muted}>Loading…</span>}

      {!isLoading && rows.length === 0 && (
        <span style={st.muted}>
          {data && data.total > 0
            ? "No bookings of that kind this month."
            : "No bookings this month yet."}
        </span>
      )}

      {rows.length > 0 && (
        <div style={st.tableWrap}>
          <table style={st.table}>
            <thead>
              <tr>
                {["Date", "Unit", "Spot", "Payment", "Saved"].map((h, i) => (
                  <th key={h} style={{ ...st.th, textAlign: i === 4 ? "right" : "left" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.bookingId}>
                  <td style={st.td}>{dayLabel(r.at)}</td>
                  <td style={st.td}>{r.unitNumber ?? "—"}</td>
                  <td style={st.td}>{r.spotNumber ? `#${r.spotNumber}` : "—"}</td>
                  <td style={st.td}>
                    {r.cardCredits > 0 && (
                      <span>
                        {money(r.chargedCents)} card
                        {r.reusedCredits > 0 ? " + " : ""}
                      </span>
                    )}
                    {r.reusedCredits > 0 && (
                      <span>
                        {r.reusedCredits}{" "}
                        {/* The one figure operators question. The explanation
                            sits on the word it is about. */}
                        <button
                          type="button"
                          style={st.reused}
                          onMouseEnter={() => setExplain(r.bookingId)}
                          onMouseLeave={() => setExplain(null)}
                          onFocus={() => setExplain(r.bookingId)}
                          onBlur={() => setExplain(null)}>
                          reused
                        </button>{" "}
                        credit{r.reusedCredits === 1 ? "" : "s"}
                        {explain === r.bookingId && (
                          <span role="tooltip" style={st.tip}>
                            The building was already paid when this credit was first
                            earned.
                          </span>
                        )}
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      ...st.td,
                      textAlign: "right",
                      color: r.savedCents > 0 ? "var(--color-text-success)" : undefined,
                      fontWeight: r.savedCents > 0 ? 600 : undefined,
                    }}>
                    {r.savedCents > 0 ? `+${money(r.savedCents)}` : money(0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.total > rows.length && filter === "all" && (
        <span style={st.muted}>
          Showing {rows.length} of {data.total} bookings this month.
        </span>
      )}
    </div>
  );
}

const st: Record<string, React.CSSProperties> = {
  card: {
    background: "var(--color-fill-white)",
    border: "1px solid var(--color-stroke-medium)",
    borderRadius: "var(--radius-12)",
    padding: "var(--spacing-20)",
    display: "flex",
    flexDirection: "column",
    gap: "var(--spacing-12)",
  },
  head: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "var(--spacing-16)",
    flexWrap: "wrap",
  },
  title: {
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-extra-tiny)",
    fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
    letterSpacing: "0.06em",
    color: "var(--color-text-weak)",
  },
  sub: {
    margin: "var(--spacing-4) 0 0",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-weak)",
  },
  filters: {
    display: "inline-flex",
    padding: 3,
    borderRadius: "var(--radius-48)",
    border: "1px solid var(--color-stroke-medium)",
    gap: 2,
  },
  filter: {
    padding: "var(--spacing-4) var(--spacing-12)",
    borderRadius: "var(--radius-48)",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-weak)",
  },
  filterOn: { background: "var(--color-fill-strong)", color: "var(--color-text-white)" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 560 },
  th: {
    padding: "var(--spacing-8) var(--spacing-12)",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-extra-tiny)",
    fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
    letterSpacing: "0.06em",
    color: "var(--color-text-weak)",
    borderBottom: "1px solid var(--color-stroke-medium)",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "var(--spacing-12)",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-strong)",
    borderBottom: "1px solid var(--color-stroke-weak)",
    whiteSpace: "nowrap",
    position: "relative",
  },
  reused: {
    padding: 0,
    border: "none",
    background: "none",
    cursor: "help",
    font: "inherit",
    color: "inherit",
    textDecoration: "underline dotted",
    textUnderlineOffset: 3,
  },
  tip: {
    position: "absolute",
    left: "var(--spacing-12)",
    top: "100%",
    zIndex: 10,
    maxWidth: 260,
    whiteSpace: "normal",
    padding: "var(--spacing-8) var(--spacing-12)",
    borderRadius: "var(--radius-8)",
    background: "var(--color-fill-strong)",
    color: "var(--color-text-white)",
    fontSize: "var(--font-size-extra-tiny)",
    lineHeight: "var(--line-height-extra-tiny)",
  },
  muted: {
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-weak)",
  },
};
