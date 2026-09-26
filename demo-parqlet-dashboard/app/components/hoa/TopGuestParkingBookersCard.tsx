"use client";

import { useState } from "react";
import { colors } from "../ui/chart-utils";
import { useTopBookers } from "../hooks";
import { PeriodSelector, RANK_STYLE } from "./PeriodSelector";
import { LeaderboardModal } from "./TopContributorsCard";

type ContributorPeriod = "This month" | "Last month" | "All time";

interface TopGuestParkingBookersCardProps {
  buildingId: string | null;
}

export function TopGuestParkingBookersCard({ buildingId }: TopGuestParkingBookersCardProps) {
  const [period, setPeriod] = useState<ContributorPeriod>("All time");
  const [showModal, setShowModal] = useState(false);
  const { data: bookers = [], isLoading } = useTopBookers(buildingId);
  const hasData = bookers.length > 0;

  return (
    <div
      style={{
        background: colors.white,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span
            style={{
              fontFamily: "var(--font-family-body)",
              fontSize: "var(--font-size-uppercase)",
              lineHeight: "var(--line-height-uppercase)",
              fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
              color: "var(--color-text-weak)",
              textTransform: "uppercase" as const,
            }}
          >
            Top Guest Parking Bookers
          </span>
          <span style={{ fontFamily: "var(--font-family-body)", fontSize: 12, color: colors.textWeak, lineHeight: "16px" }}>
            Residents who book guest parking spots the most.
          </span>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Column headers */}
      {(hasData || isLoading) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "32px 1fr 80px",
            gap: "0 12px",
            alignItems: "center",
            paddingBottom: 6,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          {["#", "Resident", "Bookings"].map((h) => (
            <span
              key={h}
              style={{
                fontFamily: "var(--font-family-body)",
                fontSize: "var(--font-size-uppercase)",
                lineHeight: "var(--line-height-uppercase)",
                fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                color: "var(--color-text-weak)",
                textTransform: "uppercase" as const,
                textAlign: h === "#" ? "center" : h === "Bookings" ? "right" : "left" as React.CSSProperties["textAlign"],
              }}
            >
              {h}
            </span>
          ))}
        </div>
      )}

      {/* Rows */}
      {isLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 0", color: "var(--color-text-weaker)", fontSize: 14 }}>
          Loading…
        </div>
      ) : hasData ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {bookers.slice(0, 5).map((b, i) => (
            <div
              key={b.rank}
              style={{
                display: "grid",
                gridTemplateColumns: "32px 1fr 80px",
                gap: "0 12px",
                alignItems: "center",
                padding: "10px 0",
                borderBottom: i < 4 ? `1px solid ${colors.border}` : "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div style={RANK_STYLE}>{b.rank}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontFamily: "var(--font-family-body)",
                    fontSize: 14,
                    fontWeight: 400,
                    color: colors.textStrong,
                    lineHeight: "18px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap" as const,
                  }}
                >
                  {b.name}
                </span>
                <span style={{ fontFamily: "var(--font-family-body)", fontSize: 12, color: colors.textWeak, lineHeight: "16px" }}>
                  {b.unit}
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontFamily: "var(--font-family-body)", fontSize: 13, color: colors.textStrong, lineHeight: "18px" }}>
                  {b.shares}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: "32px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center" }}>
          <span style={{ fontFamily: "var(--font-family-body)", fontSize: 14, fontWeight: 500, color: colors.textStrong }}>
            No bookings yet
          </span>
          <span style={{ fontFamily: "var(--font-family-body)", fontSize: 13, color: colors.textWeak, lineHeight: "18px", maxWidth: 280 }}>
            Residents will appear here once they start booking guest parking spots.
          </span>
        </div>
      )}

      {/* View all — pinned to the card's bottom edge, matching TopContributorsCard */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "auto" }}>
        <button
          onClick={() => setShowModal(true)}
          style={{
            fontSize: "var(--font-size-tiny)",
            lineHeight: "var(--line-height-tiny)",
            color: colors.textStrong,
            textDecoration: "none",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-family-body)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            padding: 0,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "underline"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "none"; }}
        >
          View all
        </button>
      </div>

      {showModal && (
        <LeaderboardModal
          type="bookers"
          period={period}
          bookers={bookers}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}