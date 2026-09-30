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
  bandForSpotNumber,
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
        gap: 12,
        minHeight: 260,
        // Shares a row with Top Contributors on desktop; without these it
        // would size to its table and leave the pair lopsided.
        flex: 1,
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
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
          <p style={{ margin: "4px 0 0", fontSize: 12, color: colors.weak }}>
            Community Spots that earn the most.
          </p>
        </div>
        <span
          style={{
            padding: "6px 12px",
            borderRadius: "var(--radius-8)",
            border: `1px solid ${colors.border}`,
            fontFamily: "var(--font-family-body)",
            fontSize: "var(--font-size-tiny)",
            color: colors.strong,
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
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Spot", "Type", "Price", "Bookings", "Earned"].map((h, i) => (
                <th
                  key={h}
                  style={{
                    textAlign: i >= 2 ? "right" : "left",
                    fontSize: 11,
                    fontWeight: 500,
                    color: colors.weak,
                    textTransform: "uppercase",
                    letterSpacing: 0.3,
                    padding: "6px 8px",
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
            {rows.map((r) => {
              const price = priceForSpotNumber(r.spotNumber);
              return (
                <tr key={r.spotNumber}>
                  <td style={{ ...td, fontWeight: 600 }}>#{r.spotNumber}</td>
                  <td style={td}>{bandForSpotNumber(r.spotNumber)}</td>
                  <td style={{ ...td, textAlign: "right", color: colors.weak }}>
                    {price == null ? "—" : `${formatMoney(price)}/day`}
                  </td>
                  <td style={{ ...td, textAlign: "right" }}>{r.bookings}</td>
                  <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>
                    {formatMoney(r.netCents)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Pinned to the bottom so the link sits on the card's edge whatever
          the table's height, the way Top Contributors' "View all" does. */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "auto", paddingTop: 12 }}>
        <Link
          href="/apartment/availability?tab=spots"
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

const td: React.CSSProperties = {
  fontSize: 13,
  color: colors.strong,
  padding: "8px",
  borderBottom: `1px solid ${colors.border}`,
  whiteSpace: "nowrap",
};
