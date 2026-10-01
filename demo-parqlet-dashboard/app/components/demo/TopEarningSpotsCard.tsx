"use client";

/**
 * Top earning spots — the Apartments replacement for "Top Contributors".
 *
 * That card ranks residents by credits earned from sharing their own spots,
 * which cannot happen in an Apartments building: the building owns every
 * spot, so there are no contributors to rank. The equivalent question an
 * operator actually asks is which spots earn their keep — and that decides
 * whether a block is priced right.
 *
 * Figures come from the same seeded bookings the Bookings page shows, so
 * the two can never disagree.
 */

import Link from "next/link";
import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  tierForSpotNumber,
  formatMoney,
  netToBuilding,
  priceForSpotNumber,
} from "../../lib/demo/apartments-data";

type Row = {
  spotNumber: string;
  bookings: number;
  grossCents: number;
  netCents: number;
};

const colors = {
  white: "var(--color-fill-white)",
  border: "var(--color-stroke-medium)",
  strong: "var(--color-text-strong)",
  weak: "var(--color-text-weak)",
};

export function TopEarningSpotsCard({ buildingId }: { buildingId: string | null }) {
  const { data, isLoading } = useQuery({
    queryKey: ["demo", "top-spots", buildingId],
    enabled: !!buildingId,
    queryFn: async (): Promise<Row[]> => {
      // Every booking, not one page: the ranking is meaningless if it only
      // sees the first twenty rows.
      const res = await fetch(
        `/api/bookings?buildingId=${buildingId}&pageSize=500`,
        { cache: "no-store" },
      );
      const json = (await res.json()) as {
        data: { spotNumber: string; amountCents?: number | null; status: string }[];
      };

      const by = new Map<string, Row>();
      for (const b of json.data ?? []) {
        // Cancelled bookings were never paid for, so counting them would
        // overstate what a spot earns.
        if (b.status === "Cancelled" || b.amountCents == null) continue;
        const row = by.get(b.spotNumber) ?? {
          spotNumber: b.spotNumber,
          bookings: 0,
          grossCents: 0,
          netCents: 0,
        };
        row.bookings += 1;
        row.grossCents += b.amountCents;
        row.netCents += netToBuilding(b.amountCents);
        by.set(b.spotNumber, row);
      }
      return [...by.values()].sort((a, b) => b.netCents - a.netCents).slice(0, 5);
    },
  });

  const rows = useMemo(() => data ?? [], [data]);

  return (
    <div
      style={{
        background: colors.white,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        // 16, as Top Contributors beside it: the pair shares a row, and a
        // 4px difference under the header showed as misaligned titles.
        gap: 16,
        minHeight: 260,
        // Shares a row with Top Contributors on desktop; without these it
        // would size to its table and leave the pair lopsided.
        flex: 1,
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        {/* Same shape as Top Contributors' header: a flex column with a
            2px gap, not a block with a margin on the paragraph. The two
            cards sit side by side and the margin put this title a few
            pixels lower than its twin. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span
            style={{
              fontFamily: "var(--font-family-body)",
              fontSize: "var(--font-size-uppercase)",
              lineHeight: "var(--line-height-uppercase)",
              fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
              color: colors.weak,
              textTransform: "uppercase" as const,
            }}
          >
            Top earning spots
          </span>
          <span style={{ fontFamily: "var(--font-family-body)", fontSize: 12, color: colors.weak, lineHeight: "16px" }}>
            Community Spots that earn the most.
          </span>
        </div>
        {/* Padding copied from PeriodSelector, which is what sits here on
            Top Contributors. At 6px against its 8px this pill was 4px
            shorter, and since it sets the header row's height, every row
            of the table below started 4px higher than its twin's. */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "var(--spacing-8) 10px",
            borderRadius: "var(--radius-8)",
            border: `1px solid ${colors.border}`,
            fontFamily: "var(--font-family-body)",
            fontSize: "var(--font-size-tiny)",
            lineHeight: "var(--line-height-tiny)",
            color: colors.weak,
            whiteSpace: "nowrap",
          }}
        >
          All time
        </span>
      </div>

      {isLoading ? (
        <span style={{ fontSize: 13, color: colors.weak }}>Loading…</span>
      ) : rows.length === 0 ? (
        <span style={{ fontSize: 13, color: colors.weak }}>
          No paid bookings yet.
        </span>
      ) : (
        <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 360 }}>
          <thead>
            <tr>
              {["Spot", "Price", "Bookings", "Earned"].map((h, i) => (
                <th
                  key={h}
                  style={{
                    textAlign: i >= 1 ? "right" : "left",
                    // Token sizes, matching Top Contributors' header row
                    // exactly. 11px with 0.3 letter-spacing was a second
                    // opinion about what a table header looks like.
                    fontFamily: "var(--font-family-body)",
                    fontSize: "var(--font-size-uppercase)",
                    lineHeight: "var(--line-height-uppercase)",
                    fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                    color: "var(--color-text-weak)",
                    textTransform: "uppercase",
                    // No TOP padding: the other card's header sits flush
                    // under the card gap with 6px below it before the rule.
                    padding: "0 8px 6px",
                    borderBottom: `1px solid ${colors.border}`,
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const price = priceForSpotNumber(r.spotNumber);
              return (
                <tr key={r.spotNumber}>
                  {/* Tier UNDER the number, the way a unit sits under a
                      resident's name elsewhere: it qualifies the spot
                      rather than standing beside it as a fact of its own,
                      and as its own column it cost a quarter of a narrow
                      table to repeat one of four words. */}
                  <td style={{ ...td, ...(i === rows.length - 1 ? lastTd : null) }}>
                    <span style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 14, lineHeight: "18px", fontWeight: 500 }}>#{r.spotNumber}</span>
                      <span style={{ fontSize: 12, lineHeight: "16px", color: colors.weak }}>
                        {tierForSpotNumber(r.spotNumber)}
                      </span>
                    </span>
                  </td>
                  <td style={{ ...td, ...(i === rows.length - 1 ? lastTd : null), textAlign: "right", color: colors.weak }}>
                    {price == null ? "—" : `${formatMoney(price)}/day`}
                  </td>
                  <td style={{ ...td, ...(i === rows.length - 1 ? lastTd : null), textAlign: "right" }}>{r.bookings}</td>
                  {/* 500, matching the spot number in Recent bookings. At
                      600 these two columns read as the only thing on the
                      card worth looking at. */}
                  <td style={{ ...td, ...(i === rows.length - 1 ? lastTd : null), textAlign: "right", fontWeight: 500 }}>
                    {formatMoney(r.netCents)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}

      {/* Pinned to the bottom so the link sits on the card's edge whatever
          the table's height, the way Top Contributors' "View all" does. */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "auto", paddingTop: 12 }}>
        <Link
          href="/apartment/parking-spots?tab=spots"
          style={{
            fontSize: "var(--font-size-tiny)",
            color: colors.strong,
            textDecoration: "none",
            fontFamily: "var(--font-family-body)",
          }}
        >
          Manage availability
        </Link>
      </div>
    </div>
  );
}

/** The last row closes the table, so it carries no rule - as the card
 *  beside it does. */
const lastTd: React.CSSProperties = { borderBottom: "none" };

const td: React.CSSProperties = {
  fontSize: 13,
  // 18px, the line box Top Contributors' figures use. Left to `normal` a
  // 13px cell resolves to roughly 15.6px, which is enough on its own to
  // make one card's rows a different height from the other's.
  lineHeight: "18px",
  color: colors.strong,
  // 10px vertical and a fixed 56 tall, matching Top Contributors' rows
  // exactly, so the two cards' five rows line up straight across.
  padding: "10px 8px",
  height: 56,
  boxSizing: "border-box",
  borderBottom: `1px solid ${colors.border}`,
  whiteSpace: "nowrap",
};
