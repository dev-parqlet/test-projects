"use client";

/**
 * What the building made on every booking this month — Apartments.
 *
 * The counterpart of <ContributingBookings> on the Condo side, and the
 * answer to the only question the tiles above leave open: the month made
 * $350, but from what? An operator who cannot see the rows cannot tell a
 * good month from a month with one expensive booking in it.
 *
 * The filter is four states rather than a search box, because the four are
 * the comparisons that get made. "Community Spots" against "Resident
 * spots" is the mix the building manages; "Canceled" on its own is the one
 * an operator goes looking for when a total came in lower than expected.
 *
 * Two rows earn nothing, and both carry their reason on the screen rather
 * than sending anyone to support:
 *
 *   A reused credit  The building was already paid when that credit was
 *                    first earned, so only the dollar extra on top earns
 *                    anything now.
 *   A cancellation   Nothing was kept, so nothing was earned.
 *
 * Attribution is the backend's (api-backend lib/savings-contributions.ts).
 * Nothing here recomputes a share.
 */

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { fmtDateTime } from "@/lib/dates";
import { bookingEarning } from "../../lib/demo/booking-earnings";
import { tierForSpotNumber, formatMoney } from "../../lib/demo/apartments-data";
import { dashboardKeys, DASHBOARD_STALE_TIME, BACKEND_URL } from "../hooks/dashboard/queryKeys";

type Filter = "all" | "community" | "resident" | "canceled";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "community", label: "Community Spots" },
  { id: "resident", label: "Resident spots" },
  { id: "canceled", label: "Canceled" },
];

/** The most rows shown before the page hands over to Bookings. */
const MAX_ROWS = 7;

type ApiRow = {
  id: string;
  unitNumber?: string | null;
  spotNumber?: string | null;
  spotOwnerName?: string | null;
  bookingStart: string;
  amountCents?: number | null;
  creditsSpent?: number | null;
  status: string;
};

export function BookingEarnings({ buildingId }: { buildingId: string | null }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [explain, setExplain] = useState<string | null>(null);

  // The SAME query the dashboard's activity chart runs, so react-query
  // serves both from one fetch rather than asking for 200 bookings twice.
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: dashboardKeys.bookings(buildingId ?? ""),
    queryFn: async (): Promise<ApiRow[]> => {
      const r = await fetch(
        `${BACKEND_URL}/api/bookings?buildingId=${buildingId}&pageSize=200`,
        { credentials: "include" },
      );
      const d = await r.json();
      return d.data ?? [];
    },
    enabled: !!buildingId,
    staleTime: DASHBOARD_STALE_TIME,
  });

  const rows = useMemo(() => {
    return bookings
      .map((b) => ({ booking: b, earning: bookingEarning(b) }))
      .filter(({ earning }) => {
        if (filter === "all") return true;
        if (filter === "canceled") return earning.refunded;
        // A cancelled booking is shown under Canceled only. Leaving it in
        // its spot-type list as well would make two filters disagree about
        // how many bookings the month had.
        if (earning.refunded) return false;
        return filter === "community"
          ? earning.spotKind === "building"
          : earning.spotKind === "neighbor";
      })
      .slice(0, MAX_ROWS);
  }, [bookings, filter]);

  return (
    <div style={st.card}>
      <div style={st.head}>
        <div>
          <span style={st.title}>BOOKING EARNINGS</span>
          <p style={st.sub}>What your building made on every booking this month.</p>
        </div>
        <div style={st.filters} role="group" aria-label="Filter bookings">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              style={{ ...st.filter, ...(filter === f.id ? st.filterOn : null) }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <span style={st.muted}>Loading…</span>}

      {!isLoading && rows.length === 0 && (
        <span style={st.muted}>No bookings of that kind this month.</span>
      )}

      {rows.length > 0 && (
        <div style={st.tableWrap}>
          <table style={st.table}>
            <thead>
              <tr>
                {["Date", "Unit", "Spot", "Type", "Payment", "Earned", "Status"].map((h) => (
                  <th
                    key={h}
                    style={{
                      ...st.th,
                      textAlign: h === "Earned" || h === "Status" ? "right" : "left",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ booking, earning }) => {
                const tier =
                  earning.spotKind === "building" && booking.spotNumber
                    ? tierForSpotNumber(booking.spotNumber)
                    : null;
                // The reason a cancelled row earned nothing, said in the
                // column where the money would have been.
                const cancelNote = earning.refunded ? "Couldn't park · " : "";
                return (
                  <tr key={booking.id}>
                    <td style={st.td}>{fmtDateTime(booking.bookingStart)}</td>
                    <td style={{ ...st.td, fontWeight: 600 }}>{booking.unitNumber ?? "—"}</td>
                    <td style={st.td}>{booking.spotNumber ? `#${booking.spotNumber}` : "—"}</td>
                    <td style={st.td}>
                      <span style={spotKindTag(earning.spotKind)}>{earning.spotKindLabel}</span>
                    </td>
                    <td style={st.td}>
                      {tier ? `${tier} · ` : ""}
                      {cancelNote}
                      {earning.reusedCredit ? (
                        <>
                          {/* The one figure operators question. The
                              explanation sits on the word it is about. */}
                          {earning.payLabel.split("reused")[0]}
                          <button
                            type="button"
                            style={st.reused}
                            onMouseEnter={() => setExplain(booking.id)}
                            onMouseLeave={() => setExplain(null)}
                            onFocus={() => setExplain(booking.id)}
                            onBlur={() => setExplain(null)}
                          >
                            reused
                          </button>
                          {earning.payLabel.split("reused")[1]}
                          {explain === booking.id && (
                            <span role="tooltip" style={st.tip}>
                              The building was already paid for this credit when it was
                              first earned. It earns only on the dollar extra, after
                              Parqlet 20% and Stripe fees.
                            </span>
                          )}
                        </>
                      ) : (
                        earning.payLabel
                      )}
                    </td>
                    <td
                      style={{
                        ...st.td,
                        textAlign: "right",
                        color: earning.earnedCents > 0 ? "var(--color-text-success)" : undefined,
                        fontWeight: earning.earnedCents > 0 ? 600 : undefined,
                      }}
                    >
                      {earning.earnedCents > 0
                        ? `+${formatMoney(earning.earnedCents)}`
                        : formatMoney(0)}
                    </td>
                    <td style={{ ...st.td, textAlign: "right" }}>
                      <span style={statusTag(booking.status, earning.refunded)}>
                        {earning.refunded
                          ? "Canceled"
                          : booking.status === "Completed"
                            ? "Completed"
                            : "Upcoming"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Link href="/apartment/bookings" style={st.viewAll}>
        View all bookings
      </Link>
    </div>
  );
}

function spotKindTag(kind: "building" | "neighbor"): React.CSSProperties {
  return {
    display: "inline-block",
    padding: "2px var(--spacing-8)",
    borderRadius: "var(--radius-48)",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-extra-tiny)",
    whiteSpace: "nowrap",
    background: kind === "building" ? "var(--color-fill-accent)" : "var(--color-fill-weak)",
    color: "var(--color-text-strong)",
  };
}

function statusTag(status: string, refunded: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-block",
    padding: "2px var(--spacing-8)",
    borderRadius: "var(--radius-48)",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-extra-tiny)",
    whiteSpace: "nowrap",
  };
  if (refunded) {
    return { ...base, background: "var(--color-tag-expired)", color: "var(--color-tag-text-expired)" };
  }
  if (status === "Completed") {
    return { ...base, background: "var(--color-tag-active)", color: "var(--color-tag-text-active)" };
  }
  return { ...base, background: "var(--color-tag-upcoming)", color: "var(--color-tag-text-upcoming)" };
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
    borderRadius: 999,
    background: "var(--color-fill-weak)",
    flexWrap: "wrap",
  },
  filter: {
    padding: "6px var(--spacing-12)",
    borderRadius: 999,
    border: "none",
    background: "transparent",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-weak)",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  filterOn: { background: "var(--color-fill-strong)", color: "var(--color-fill-white)" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 760 },
  th: {
    padding: "var(--spacing-8) var(--spacing-12)",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-extra-tiny)",
    fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--color-text-weak)",
    borderBottom: "1px solid var(--color-stroke-medium)",
    whiteSpace: "nowrap",
  },
  td: {
    position: "relative",
    padding: "var(--spacing-12)",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-strong)",
    borderBottom: "1px solid var(--color-stroke-weak)",
    whiteSpace: "nowrap",
  },
  reused: {
    padding: 0,
    border: "none",
    background: "none",
    font: "inherit",
    color: "inherit",
    cursor: "help",
    borderBottom: "1px dotted var(--color-stroke-strong)",
  },
  tip: {
    position: "absolute",
    left: "var(--spacing-12)",
    bottom: "100%",
    zIndex: 10,
    width: 280,
    whiteSpace: "normal",
    padding: "var(--spacing-8) var(--spacing-12)",
    borderRadius: "var(--radius-8)",
    background: "var(--color-fill-strong)",
    color: "var(--color-fill-white)",
    fontSize: "var(--font-size-extra-tiny)",
    lineHeight: 1.5,
  },
  muted: {
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-weak)",
  },
  viewAll: {
    alignSelf: "flex-end",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-strong)",
    textDecoration: "none",
  },
};
