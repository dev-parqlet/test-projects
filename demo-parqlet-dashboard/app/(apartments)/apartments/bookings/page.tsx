"use client";

/**
 * Bookings — Apartments.
 *
 * Its own page, not the HOA table with a flag. An Apartments booking is
 * paid for in DOLLARS and the spot belongs to the building, so there is no
 * spot owner to name and no credits to show; the HOA table is the mirror
 * image and stays exactly as it is.
 */

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../../components/auth/auth-provider";
import { Badge } from "../../../components/ui/Badge";
import { FilterDropdown } from "../../../components/ui/FilterDropdown";
import { TableHeadLabel } from "../../../components/ui/TableHeadLabel";
import { TabBar } from "../../../components/ui/TabBar";
import { InfoTooltip } from "../../../components/ui/InfoTooltip";
import { formatMoney, COMMISSION_PCT } from "../../../lib/demo/apartments-data";
import { bookingEarning } from "../../../lib/demo/booking-earnings";

type Row = {
  id: string;
  idShort: string;
  spotNumber: string;
  guestName: string;
  licensePlate: string;
  bookingStart: string;
  bookingEnd: string;
  status: string;
  amountCents?: number | null;
  /** Credits the renter spent. Zero on a spot paid for outright. */
  creditsSpent?: number | null;
  /** Named when a RESIDENT lent the spot; null on the building's own. */
  spotOwnerName?: string | null;
};

type BookingTab = "current" | "future" | "past";

/** Same labels and same order as the Condo's bookings page. */
const TABS = [
  { id: "current", label: "Current bookings" },
  { id: "future", label: "Upcoming bookings" },
  { id: "past", label: "Past bookings" },
] as const satisfies readonly { id: BookingTab; label: string }[];

// "Paid" carries a sentence now ("1 reused credit + $9.00"), not just a
// figure, so it is given room the other columns do not need.
const COL = ["7 1 90px", "7 1 80px", "10 1 130px", "9 1 110px", "10 1 120px", "10 1 120px", "12 1 150px", "8 1 100px", "9 1 110px"];

export default function ApartmentsBookingsPage() {
  const { user } = useAuth();
  const buildingId = user?.buildingId ?? "";
  const [tab, setTab] = useState<BookingTab>("current");
  const [status, setStatus] = useState("All");
  const [query, setQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["apartments", "bookings", buildingId, tab],
    enabled: !!buildingId,
    queryFn: async (): Promise<Row[]> => {
      const res = await fetch(
        `/api/bookings?buildingId=${buildingId}&tab=${tab}&pageSize=200`,
        { cache: "no-store" },
      );
      return ((await res.json()) as { data: Row[] }).data ?? [];
    },
  });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter((r) => {
      if (status !== "All" && r.status !== status) return false;
      if (q && !`${r.spotNumber} ${r.guestName} ${r.licensePlate}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, status, query]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => {
          // Cancelled bookings were never paid for, so including them would
          // overstate the period.
          if (r.status === "Cancelled") return acc;
          acc.gross += r.amountCents ?? 0;
          // Summed from the same helper the rows print, so the footer can
          // never disagree with the column above it.
          acc.net += bookingEarning(r).earnedCents;
          return acc;
        },
        { gross: 0, net: 0 },
      ),
    [rows],
  );

  return (
    <div style={{ padding: "var(--spacing-24)", display: "flex", flexDirection: "column", gap: "var(--spacing-16)" }}>
      <div>
        <h1 style={st.h1}>Bookings</h1>
        <p style={st.sub}>
          What people have paid to park at your building. Parqlet keeps{" "}
          {COMMISSION_PCT}%; the rest is yours.
        </p>
      </div>

      {/* The shared underlined tab row, the same control the Condo's
          bookings page and every other tabbed screen uses. These were
          pills, which read as filters rather than as views of one list. */}
      <TabBar active={tab} onChange={setTab} tabs={TABS} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--spacing-12)", flexWrap: "wrap" }}>
        <div style={st.search}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by spot, guest or plate"
            style={st.searchInput}
          />
        </div>
        <FilterDropdown
          label="Status"
          options={["All", "Active", "Assigned", "Completed", "Cancelled"]}
          value={status}
          onChange={setStatus}
        />
      </div>

      <div style={st.card}>
        <div style={{ ...st.row, ...st.headRow }}>
          {["Booking ID", "Spot", "Guest", "Plate", "From", "Until", "Paid", "You receive", "Status"].map((h, i) => (
            <div key={h} style={{ ...st.cell, flex: COL[i] }}>
              <TableHeadLabel>{h}</TableHeadLabel>
            </div>
          ))}
        </div>

        {isLoading && <div style={{ ...st.row, ...st.empty }}>Loading…</div>}

        {!isLoading && rows.map((r) => {
          const earn = bookingEarning(r);
          return (
          <div key={r.id} style={st.row}>
            <div style={{ ...st.cell, flex: COL[0] }}><span style={st.txt}>{r.idShort}</span></div>
            <div style={{ ...st.cell, flex: COL[1] }}><span style={{ ...st.txt, fontWeight: 600 }}>{r.spotNumber}</span></div>
            <div style={{ ...st.cell, flex: COL[2] }}><span style={st.txt}>{r.guestName}</span></div>
            <div style={{ ...st.cell, flex: COL[3] }}><span style={st.txt}>{r.licensePlate}</span></div>
            <div style={{ ...st.cell, flex: COL[4] }}><span style={st.txt}>{r.bookingStart}</span></div>
            <div style={{ ...st.cell, flex: COL[5] }}><span style={st.txt}>{r.bookingEnd}</span></div>
            <div style={{ ...st.cell, flex: COL[6] }}>
              <span style={{ ...st.txt, fontWeight: 600 }}>{earn.payLabel}</span>
            </div>
            <div style={{ ...st.cell, flex: COL[7] }}>
              {earn.zeroReason ? (
                // A row that paid the building nothing says why, on the row
                // itself. Support answered this question often enough that it
                // belongs next to the number.
                <InfoTooltip text={earn.zeroReason}>
                  <span style={{ ...st.txt, color: "var(--color-text-weak)", borderBottom: "1px dotted var(--color-stroke-strong)" }}>
                    {formatMoney(earn.earnedCents)}
                  </span>
                </InfoTooltip>
              ) : (
                <span style={{ ...st.txt, color: "var(--color-text-weak)" }}>
                  {earn.refunded ? "—" : formatMoney(earn.earnedCents)}
                </span>
              )}
            </div>
            <div style={{ ...st.cell, flex: COL[8] }}>
              <Badge as="span" variant={statusBadge(r.status, tab).variant}>
                {statusBadge(r.status, tab).label}
              </Badge>
            </div>
          </div>
          );
        })}

        {!isLoading && rows.length === 0 && (
          <div style={{ ...st.row, ...st.empty }}>No bookings here.</div>
        )}
      </div>

      <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)" }}>
        {rows.length} booking{rows.length === 1 ? "" : "s"} · collected{" "}
        {formatMoney(totals.gross)} · you receive <strong>{formatMoney(totals.net)}</strong>
      </span>
    </div>
  );
}

/**
 * Label and colour for a booking's status, by the SAME rule the HOA table
 * uses - see app/(hoa)/bookings/page.tsx.
 *
 * "Assigned" is a backend state, not a word an operator should ever read.
 * What it means depends entirely on which tab the row is under, and the
 * tab already answers it: a booking listed under Current is happening now,
 * so it is "Active"; the same booking under Past has finished and is
 * waiting on the auto-complete sweep, so it is "Completed". Only an
 * upcoming one is genuinely "Upcoming".
 *
 * Trusting the tab rather than re-deriving the time window is deliberate,
 * and copied from the HOA page for the same reason: the tab is defined by
 * exactly that condition, so a row under it satisfies it by construction.
 * Recomputing the comparison here is a second chance to disagree.
 */
function statusBadge(status: string, tab: BookingTab): { label: string; variant: string } {
  // "Active" and "Assigned" are the same thing by two names in the mock
  // corpus, and neither should be read literally: a booking whose window
  // has closed is finished no matter which word the row carries, which is
  // why "Active" was appearing under Past bookings.
  if (status === "Assigned" || status === "Active") {
    if (tab === "current") return { label: "Active", variant: "active" };
    if (tab === "past") return { label: "Completed", variant: "active" };
    return { label: "Upcoming", variant: "upcoming" };
  }
  if (status === "Cancelled") return { label: "Cancelled", variant: "expired" };
  if (status === "Completed") return { label: "Completed", variant: "active" };
  // Anything the mock corpus adds later still renders, rather than
  // throwing a row away over a word this function has not met.
  return { label: status, variant: "inactive" };
}

const st: Record<string, React.CSSProperties> = {
  h1: {
    margin: 0,
    fontSize: "var(--font-size-heading-1)",
    lineHeight: "var(--line-height-heading-1)",
    fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
    fontFamily: "var(--font-family-heading)",
    color: "var(--color-text-strong)",
  },
  sub: { margin: "var(--spacing-8) 0 0", fontSize: 16, lineHeight: "20px", color: "var(--color-text-weak)" },
  search: {
    display: "flex", alignItems: "center", gap: 10,
    background: "var(--color-fill-white)", border: "1px solid var(--color-stroke-medium)",
    borderRadius: "var(--radius-8)", padding: "0 10px", height: 40,
    flex: "1 0 240px", maxWidth: 420,
  },
  searchInput: {
    border: "none", outline: "none", background: "transparent",
    fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)",
    fontFamily: "var(--font-family-body)", width: "100%",
  },
  card: {
    border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-12)",
    background: "var(--color-fill-white)", overflow: "hidden",
  },
  // The canonical table header, as every other table on the dashboard
  // renders it. On the ROW because TableHeadLabel owns only the size and
  // the wrapping; with just a colour this read as a body row.
  headRow: {
    fontFamily: "var(--font-family-body)",
    fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
    lineHeight: "var(--line-height-uppercase)",
    color: "var(--color-text-weak)",
    textTransform: "uppercase" as const,
  },
  row: {
    display: "flex", alignItems: "center", gap: "var(--spacing-8)",
    padding: "0 var(--spacing-24)", minHeight: 48,
    borderBottom: "1px solid var(--color-stroke-medium)",
  },
  cell: { display: "flex", alignItems: "center", minWidth: 0 },
  txt: { fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  empty: { color: "var(--color-text-weak)", fontSize: "var(--font-size-tiny)" },
};
