"use client";

import { useState } from "react";
import { IcCredit } from "../icons";
import { colors } from "../ui/chart-utils";
import { useTopContributors } from "../hooks";
import { PeriodSelector, RANK_STYLE } from "./PeriodSelector";

type ContributorPeriod = "This month" | "Last month" | "All time";

interface TopContributorsCardProps {
  buildingId: string | null;
}

export function TopContributorsCard({ buildingId }: TopContributorsCardProps) {
  const [period, setPeriod] = useState<ContributorPeriod>("All time");
  const [showModal, setShowModal] = useState(false);
  const { data: contributors = [], isLoading } = useTopContributors(buildingId);
  const hasData = contributors.length > 0;

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
            Top Contributors
          </span>
          <span style={{ fontFamily: "var(--font-family-body)", fontSize: 12, color: colors.textWeak, lineHeight: "16px" }}>
            Residents helping the community by sharing their parking spots.
          </span>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Column headers */}
      {(hasData || isLoading) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "32px 1fr 110px 120px",
            gap: "0 12px",
            alignItems: "center",
            paddingBottom: 6,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          {["#", "Resident", "Times shared", "Credits earned"].map((h) => (
            <span
              key={h}
              style={{
                fontFamily: "var(--font-family-body)",
                fontSize: "var(--font-size-uppercase)",
                lineHeight: "var(--line-height-uppercase)",
                fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                color: "var(--color-text-weak)",
                textTransform: "uppercase" as const,
                textAlign: h === "#" ? "center" : h === "Times shared" || h === "Credits earned" ? "right" : "left" as React.CSSProperties["textAlign"],
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
          {contributors.slice(0, 5).map((c, i) => (
            <div
              key={c.rank}
              style={{
                display: "grid",
                gridTemplateColumns: "32px 1fr 110px 120px",
                gap: "0 12px",
                alignItems: "center",
                padding: "10px 0",
                borderBottom: i < 4 ? `1px solid ${colors.border}` : "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div style={RANK_STYLE}>{c.rank}</div>
              </div>
              {/* Name over unit, matching Top Guest Parking Bookers, the
                  leaderboard modal and the resident tables. This card used
                  to run them together as "Liam Baker · 5E" while the card
                  beside it stacked them, so two lists of the same residents
                  sitting side by side named them two different ways. */}
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
                  {c.name}
                </span>
                {c.unit ? (
                  <span
                    style={{
                      fontFamily: "var(--font-family-body)",
                      fontSize: 12,
                      color: colors.textWeak,
                      lineHeight: "16px",
                    }}
                  >
                    {c.unit}
                  </span>
                ) : null}
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontFamily: "var(--font-family-body)", fontSize: 13, color: colors.textStrong, lineHeight: "18px" }}>
                  {c.shares}
                </span>
              </div>
              <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                <IcCredit />
                <span style={{ fontFamily: "var(--font-family-body)", fontSize: 13, color: colors.textStrong, lineHeight: "18px" }}>
                  {c.credits}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: "32px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center" }}>
          <span style={{ fontFamily: "var(--font-family-body)", fontSize: 14, fontWeight: 500, color: colors.textStrong }}>
            No contributors yet
          </span>
          <span style={{ fontFamily: "var(--font-family-body)", fontSize: 13, color: colors.textWeak, lineHeight: "18px", maxWidth: 280 }}>
            Residents will appear here once they start sharing their parking spots.
          </span>
        </div>
      )}

      {/* View all — marginTop:"auto" pins this to the bottom of the card
          instead of sitting right after the last row. The two Top
          Contributors / Top Guest Parking Bookers cards sit side by side
          and stretch to match each other's height (see dashboard/page.tsx's
          alignItems:"stretch"), so a card with fewer rows than its sibling
          would otherwise leave "View all" floating above a gap of blank
          space instead of flush with the card's bottom edge. */}
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
          type="contributors"
          period={period}
          contributors={contributors}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// --- Leaderboard Modal -------------------------------------------------------

import { IcClose } from "../icons";

interface LeaderboardModalProps {
  type: "contributors" | "bookers";
  period: string;
  contributors?: { rank: number; name: string; unit: string; shares: number; credits: number }[];
  bookers?: { rank: number; name: string; unit: string; shares: number; credits: number }[];
  onClose: () => void;
}

export function LeaderboardModal({ type, period, contributors = [], bookers = [], onClose }: LeaderboardModalProps) {
  const isContributors = type === "contributors";
  const title = isContributors ? "Top Contributors" : "Top Guest Parking Bookers";
  const subtitle = isContributors
    ? "Residents helping the community by sharing their parking spots."
    : "Residents who book guest parking the most.";
  const colTemplate = isContributors ? "32px 1fr 80px 120px" : "32px 1fr 80px";
  const headers = isContributors ? ["#", "Resident", "Times shared", "Credits earned"] : ["#", "Resident", "Bookings"];
  const rows = isContributors ? contributors : bookers;

  const cellTxt: React.CSSProperties = {
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-extra-tiny)",
    lineHeight: "var(--line-height-extra-tiny)",
    color: "var(--color-text-weak)",
    textTransform: "uppercase" as const,
    fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--spacing-24)",
      }}
    >
      <div
        style={{
          background: "var(--color-fill-white)",
          borderRadius: "var(--radius-24)",
          width: 580,
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: "24px 24px 20px",
            borderBottom: "1px solid var(--color-stroke-medium)",
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-family-body)",
                fontSize: "var(--font-size-uppercase)",
                lineHeight: "var(--line-height-uppercase)",
                fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                color: "var(--color-text-weak)",
                textTransform: "uppercase" as const,
                marginBottom: 4,
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontFamily: "var(--font-family-body)",
                fontSize: "var(--font-size-tiny)",
                color: "var(--color-text-weak)",
                lineHeight: "var(--line-height-tiny)",
              }}
            >
              {subtitle} · <span style={{ color: "var(--color-text-strong)" }}>{period}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginLeft: 16,
            }}
          >
            <IcClose />
          </button>
        </div>

        {/* Column headers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: colTemplate,
            gap: "0 12px",
            alignItems: "center",
            padding: "10px 24px",
            borderBottom: "1px solid var(--color-stroke-medium)",
            flexShrink: 0,
          }}
        >
          {headers.map((h) => (
            <span
              key={h}
              style={{
                ...cellTxt,
                textAlign: h === "#" ? "center" : (h === "Times shared" || h === "Credits earned" || h === "Bookings") ? "right" : "left" as React.CSSProperties["textAlign"],
              }}
            >
              {h}
            </span>
          ))}
        </div>

        {/* Scrollable rows */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {rows.map((item, i) => (
            <div
              key={item.rank}
              style={{
                display: "grid",
                gridTemplateColumns: colTemplate,
                gap: "0 12px",
                alignItems: "center",
                padding: "10px 24px",
                borderBottom: i < rows.length - 1 ? "1px solid var(--color-stroke-medium)" : "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center" }}>
                <span
                  style={{
                    fontFamily: "var(--font-family-body)",
                    fontSize: "var(--font-size-tiny)",
                    fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                    color: colors.textWeak,
                    lineHeight: "var(--line-height-tiny)",
                  }}
                >
                  {item.rank}
                </span>
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
                  {item.name}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-family-body)",
                    fontSize: 12,
                    color: colors.textWeak,
                    lineHeight: "16px",
                  }}
                >
                  {item.unit}
                </span>
              </div>

              <div style={{ textAlign: "right" }}>
                <span
                  style={{
                    fontFamily: "var(--font-family-body)",
                    fontSize: 13,
                    color: colors.textStrong,
                    lineHeight: "18px",
                  }}
                >
                  {item.shares}
                </span>
              </div>

              {isContributors && (
                <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                  <IcCredit />
                  <span
                    style={{
                      fontFamily: "var(--font-family-body)",
                      fontSize: 13,
                      color: colors.textStrong,
                      lineHeight: "18px",
                    }}
                  >
                    {item.credits}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}