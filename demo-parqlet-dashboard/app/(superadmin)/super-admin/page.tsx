"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { useBuildingFilter } from "../../components/context/building-filter-context";
import { listBuildings, buildingKeys } from "../../lib/api/buildings";
import { listAlerts } from "../../lib/api/super-admin";
import { fmtTime, fmtDate } from "../../lib/dates";
import { TableScroll } from "../../components/ui/TableScroll";
import { TableHeadLabel } from "../../components/ui/TableHeadLabel";
import { CopyableCell } from "../../components/ui/CopyableCell";
import "../../tokens.css";

// ─── Types (mirroring API response shape) ──────────────────────────────────────

type SubscriptionStatus = "Active" | "Inactive" | "Overdue" | "Past Due" | "Expiring Soon" | "Paused";
type SyncStatus = "Success" | "Failed" | "Stale" | "Not Synced";
type AlertSeverity = "Critical" | "Warning" | "Info";

interface Building {
  id: string;
  name: string;
  address: string;
  city: string;
  units: number;
  onboardedDate: string;
  hoaContact: string;
  hoaEmail: string;
  subscriptionStatus: SubscriptionStatus;
  mrr: number;
  arr: number;
  lastSync: string;
  syncStatus: SyncStatus;
  syncPlatform: string | null;
  residentsRegistered: number;
  totalBookings: number;
  bookingsThisMonth: number;
  creditsInCirculation: number;
  creditsEarnedThisMonth: number;
  creditsSpentThisMonth: number;
  residentsAtThreshold: number;
  openTickets: number;
  ticketsThisWeek: number;
  contractExpiry: string;
  lastPaymentDate: string;
  nextRenewalDate: string;
}

interface Alert {
  id: string;
  severity: AlertSeverity;
  buildingId: string;
  buildingName: string;
  type: string;
  description: string;
  timestamp: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const cellTxt: React.CSSProperties = {
  fontSize: "var(--font-size-tiny)",
  color: "var(--color-text-weak)",
  lineHeight: "var(--line-height-tiny)",
  fontFamily: "var(--font-family-body)",
  fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const styles: Record<AlertSeverity, { bg: string; color: string }> = {
    Critical: { bg: "var(--color-tag-expired)",  color: "var(--color-tag-text-expired)"  },
    Warning:  { bg: "var(--color-tag-pending)",  color: "var(--color-tag-text-pending)"  },
    Info:     { bg: "var(--color-tag-upcoming)", color: "var(--color-tag-text-upcoming)" },
  };
  const s = styles[severity];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      background: s.bg, color: s.color,
      borderRadius: "var(--radius-48)",
      padding: "3px 8px",
      fontSize: "var(--font-size-extra-tiny)",
      fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
      fontFamily: "var(--font-family-body)",
      lineHeight: "var(--line-height-extra-tiny)",
      whiteSpace: "nowrap",
    }}>
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    "Active":        { bg: "var(--color-tag-active)",   color: "var(--color-tag-text-active)"   },
    "Overdue":       { bg: "var(--color-tag-expired)",  color: "var(--color-tag-text-expired)"  },
    "Past Due":      { bg: "var(--color-tag-expired)",  color: "var(--color-tag-text-expired)"  },
    "Expiring Soon": { bg: "var(--color-tag-pending)",  color: "var(--color-tag-text-pending)"  },
    "Paused":        { bg: "var(--color-tag-pending)",  color: "var(--color-tag-text-pending)"  },
    "Low":           { bg: "var(--color-tag-active)",   color: "var(--color-tag-text-active)"   },
    "Medium":        { bg: "var(--color-tag-pending)",  color: "var(--color-tag-text-pending)"  },
    "High":          { bg: "var(--color-tag-expired)",  color: "var(--color-tag-text-expired)"  },
  };
  const s = map[status] ?? { bg: "var(--color-tag-stats)", color: "var(--color-text-strong)" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      background: s.bg,
      borderRadius: "var(--radius-48)",
      padding: "3px 8px",
      fontSize: "var(--font-size-extra-tiny)",
      fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
      fontFamily: "var(--font-family-body)",
      color: s.color,
      lineHeight: "var(--line-height-extra-tiny)",
      whiteSpace: "nowrap",
    }}>
      {status}
    </span>
  );
}

function SyncDot({ status }: { status: string }) {
  const color = status === "Success" ? "var(--color-green-1000)"
    : status === "Failed" ? "var(--color-tag-text-expired)"
    : status === "Not Synced" ? "var(--color-stroke-strong)"
    : "var(--color-mustard-600)";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />
      <span style={{ ...cellTxt }}>{status}</span>
    </span>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      background: "var(--color-fill-white)",
      border: "1px solid var(--color-stroke-medium)",
      borderRadius: "var(--radius-12)",
      padding: "20px 20px 18px",
      flex: "1 1 160px", minWidth: 0,
    }}>
      <div style={{
        fontSize: "var(--font-size-uppercase)",
        color: "var(--color-text-weak)",
        fontFamily: "var(--font-family-body)",
        fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
        lineHeight: "var(--line-height-uppercase)",
        textTransform: "uppercase" as const,
        marginBottom: 8,
      }}>{label}</div>
      <div style={{
        fontSize: "var(--font-size-heading-2)",
        fontFamily: "var(--font-family-heading)",
        fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
        color: "var(--color-text-strong)",
        lineHeight: "var(--line-height-heading-2)",
        overflowWrap: "anywhere",
      }}>{value}</div>
      {sub && (
        <div style={{
          fontSize: "var(--font-size-extra-tiny)",
          color: "var(--color-text-weak)",
          fontFamily: "var(--font-family-body)",
          marginTop: 4,
        }}>{sub}</div>
      )}
    </div>
  );
}

// ─── Sort icon ─────────────────────────────────────────────────────────────────

function IcSort({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  const up   = active && dir === "asc"  ? "var(--color-text-strong)" : "var(--color-stroke-strong)";
  const down = active && dir === "desc" ? "var(--color-text-strong)" : "var(--color-stroke-strong)";
  return (
    <svg width="9" height="11" viewBox="0 0 12 14" fill="none" style={{ flexShrink: 0 }}>
      <path d="M2 5l4-4 4 4" stroke={up}   strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 9l4 4 4-4" stroke={down} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

const TABLE_COLS = [
  { label: "Building",      flex: 16 },
  { label: "Subscription",  flex: 11 },
  { label: "Last Sync",     flex: 11 },
  { label: "Bookings",      flex: 8  },
  { label: "Credits",       flex: 8  },
  { label: "Tickets",       flex: 7  },
];

// Loading skeleton rows
function SkeletonRow() {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      padding: "0 20px", height: 57,
      borderBottom: "1px solid var(--color-stroke-medium)",
    }}>
      {[16, 11, 11, 8, 8, 8, 10, 7].map((flex, i) => (
        <div key={i} style={{ flex: `${flex} 1 0`, minWidth: 0 }}>
          <div style={{
            height: 12, borderRadius: 4,
            background: "var(--color-gray-100)",
            width: "70%",
          }} />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div style={{
      padding: "48px 20px",
      textAlign: "center",
      color: "var(--color-tag-text-expired)",
      fontSize: "var(--font-size-tiny)",
      fontFamily: "var(--font-family-body)",
    }}>
      Failed to load data: {message}
    </div>
  );
}

export default function OverviewPage() {
  const { selectedIds, isAll } = useBuildingFilter();
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Fetch buildings
  const { data: buildingsData, isLoading: buildingsLoading, isError: buildingsError } = useQuery({
    queryKey: buildingKeys.list(),
    queryFn: () => listBuildings(),
  });

  // Fetch alerts
  const { data: alertsData, isLoading: alertsLoading, isError: alertsError } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => listAlerts({}),
  });

  const allBuildings: Building[] = buildingsData?.data ?? [];
  const allAlerts: Alert[] = alertsData?.data ?? [];

  // Filter buildings and alerts based on building filter context
  const buildings = isAll ? allBuildings : allBuildings.filter((b) => selectedIds.includes(b.id));
  const alerts    = isAll ? allAlerts    : allAlerts.filter((a) => selectedIds.includes(a.buildingId));

  // Stat computations
  const activeBuildings = buildings.filter((b) => b.subscriptionStatus !== "Overdue").length;
  const mrr             = buildings.reduce((s, b) => s + b.mrr, 0);
  // Real year-to-date revenue summed per building (GET /api/buildings
  // now computes each building's own arr from actual Paid invoices
  // since Jan 1 of its calendar year) — NOT mrr * 12. Summing the
  // already-filtered buildings here (rather than reading a portfolio-
  // wide backend total) is what makes this respect the building-filter
  // dropdown the same way `mrr` above already does.
  // `?? 0` guards mock-mode fixtures, which predate this field.
  const arr              = buildings.reduce((s, b) => s + (b.arr ?? 0), 0);
  // "Since <date>" reference under the ARR figure. When every filtered
  // building onboarded this calendar year, the earliest onboarding date
  // IS the true start of their revenue history — show that month rather
  // than implying a full Jan-1 year of revenue that didn't exist yet. A
  // portfolio that includes any building from a prior year (or has no
  // parseable onboarding dates) falls back to the plain YTD boundary.
  const currentYear = new Date().getFullYear();
  const earliestOnboarded = buildings
    .map((b) => new Date(b.onboardedDate))
    .filter((d) => !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime())[0];
  const arrSince =
    earliestOnboarded && earliestOnboarded.getFullYear() === currentYear
      ? earliestOnboarded.toLocaleDateString("en-US", { month: "short", year: "numeric" })
      : `Jan 1, ${currentYear}`;
  const activeSubsCount  = buildings.filter((b) => b.subscriptionStatus === "Active").length;
  // Earliest upcoming renewal across all buildings — was hardcoded to a
  // fixed placeholder date before; now derived from real subscription data.
  const nextRenewalDate = buildings
    .map((b) => b.nextRenewalDate)
    .filter((d): d is string => !!d)
    .map((d) => new Date(d))
    .filter((d) => !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime())[0];
  const totalCredits    = buildings.reduce((s, b) => s + b.creditsInCirculation, 0);
  const openTickets     = buildings.reduce((s, b) => s + b.openTickets, 0);
  const syncHealthy     = buildings.filter((b) => b.syncStatus === "Success").length;

  // Top 2 alerts (Critical first, then Warning, then Info)
  const severityOrder: Record<string, number> = { Critical: 0, Warning: 1, Info: 2 };
  const topAlerts = [...alerts]
    .sort((a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3))
    .slice(0, 2);

  // Sort buildings table
  function handleSort(label: string) {
    if (sortCol === label) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortCol(label); setSortDir("asc"); }
  }

  let sorted = [...buildings];
  if (sortCol) {
    const dir = sortDir === "asc" ? 1 : -1;
    sorted.sort((a, b) => {
      const vals: Record<string, [string | number, string | number]> = {
        "Building":      [a.name,               b.name],
        "Subscription":  [a.subscriptionStatus, b.subscriptionStatus],
        "Last Sync":     [a.lastSync,            b.lastSync],
        "Bookings":      [a.totalBookings,       b.totalBookings],
        "Credits":       [a.creditsInCirculation,b.creditsInCirculation],
        "Tickets":       [a.openTickets,          b.openTickets],
      };
      const [av, bv] = vals[sortCol] ?? ["", ""];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }

return (<>
    <div style={{
        padding: "var(--spacing-24)",
        display: "flex", flexDirection: "column",
        gap: "var(--spacing-24)",
        fontFamily: "var(--font-family-body)",
      }}>

        {/* ── Alerts Strip ─────────────────────────────────────────────────── */}
        {topAlerts.length > 0 && (
          <div style={{
            background: "var(--color-fill-white)",
            border: "1px solid var(--color-stroke-medium)",
            borderRadius: "var(--radius-12)",
            overflow: "hidden",
          }}>
            {topAlerts.map((alert, i) => {
              const borderColor = alert.severity === "Critical" ? "var(--color-tag-text-expired)"
                : alert.severity === "Warning" ? "var(--color-tag-text-pending)"
                : "var(--color-tag-text-upcoming)";
              return (
                <div key={alert.id} style={{
                  display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px 12px",
                  padding: "12px 20px",
                  borderLeft: `3px solid ${borderColor}`,
                  borderBottom: i < topAlerts.length - 1 ? "1px solid var(--color-stroke-medium)" : "none",
                }}>
                  <SeverityBadge severity={alert.severity} />
                  <span style={{ ...cellTxt, fontWeight: "500" as React.CSSProperties["fontWeight"], color: "var(--color-text-strong)", flexShrink: 0, maxWidth: "60%" }}>
                    {alert.buildingName}
                  </span>
                  <span style={{ ...cellTxt, flexShrink: 0 }}>—</span>
                  <span style={{ ...cellTxt, flex: "1 1 160px", minWidth: 0 }}>{alert.type}: {alert.description}</span>
                  <span style={{ ...cellTxt, flexShrink: 0, color: "var(--color-text-weak)" }}>{fmtTime(alert.timestamp)}</span>
                  {i === 0 && (
                    <Link href="/alerts" style={{
                      flexShrink: 0,
                      fontSize: "var(--font-size-tiny)",
                      color: "var(--color-text-strong)",
                      fontFamily: "var(--font-family-body)",
                      fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "underline"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "none"; }}>
                      View all alerts →
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Page title ───────────────────────────────────────────────────── */}
        <div>
          <h1 style={{
            margin: 0,
            fontSize: "var(--font-size-heading-1)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            lineHeight: "var(--line-height-heading-1)",
            color: "var(--color-text-strong)",
            fontFamily: "var(--font-family-heading)",
          }}>Overview</h1>
          <p style={{
            margin: "6px 0 0",
            fontSize: "var(--font-size-body)",
            color: "var(--color-text-weak)",
            fontFamily: "var(--font-family-body)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
          }}>
            Platform health across {buildings.length} building{buildings.length !== 1 ? "s" : ""}
            {(buildingsLoading || alertsLoading) && " (loading…)"}
          </p>
        </div>

        {/* ── Stat cards ───────────────────────────────────────────────────── */}
        {buildingsLoading ? (
          <div style={{ display: "flex", gap: "var(--spacing-16)", flexWrap: "wrap" }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={{
                background: "var(--color-fill-white)",
                border: "1px solid var(--color-stroke-medium)",
                borderRadius: "var(--radius-12)",
                padding: "20px 20px 18px",
                flex: "1 1 0",
                minWidth: 0,
                minHeight: 90,
              }}>
                <div style={{
                  height: 10, borderRadius: 4,
                  background: "var(--color-gray-100)",
                  width: "60%",
                  marginBottom: 12,
                }} />
                <div style={{
                  height: 22, borderRadius: 4,
                  background: "var(--color-gray-100)",
                  width: "40%",
                  marginBottom: 8,
                }} />
                <div style={{
                  height: 10, borderRadius: 4,
                  background: "var(--color-gray-100)",
                  width: "50%",
                }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", gap: "var(--spacing-16)", flexWrap: "wrap" }}>
            <StatCard label="Active Buildings"      value={String(activeBuildings)}                     sub={`${buildings.length} total`} />
            <StatCard label="MRR" value={`$${mrr.toLocaleString()}/mo`}           sub={`${activeSubsCount} active subscription${activeSubsCount === 1 ? "" : "s"}`} />
            <StatCard label="ARR" value={`$${arr.toLocaleString()}/yr`}           sub={`since ${arrSince}`} />
            <StatCard label="Credits in Circulation" value={totalCredits.toLocaleString()}              sub="across all buildings" />
            <StatCard label="Open Support Tickets"  value={String(openTickets)}                         sub="across all buildings" />
            <StatCard label="Sync Health (24h)"     value={`${syncHealthy}/${buildings.length}`}        sub={`${Math.round((syncHealthy / Math.max(buildings.length, 1)) * 100)}% healthy`} />
          </div>
        )}

        {/* ── Buildings Health Table ────────────────────────────────────────── */}
        <div style={{
          background: "var(--color-fill-white)",
          border: "1px solid var(--color-stroke-medium)",
          borderRadius: "var(--radius-12)",
          overflow: "hidden",
        }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-stroke-medium)" }}>
            <h2 style={{
              margin: 0,
              fontSize: "var(--font-size-tiny)",
              fontWeight: "500" as React.CSSProperties["fontWeight"],
              color: "var(--color-text-strong)",
              fontFamily: "var(--font-family-body)",
            }}>Buildings Health</h2>
          </div>

          <TableScroll minWidth={800}>
              {/* Header */}
              <div style={{
                display: "flex", alignItems: "center",
                padding: "0 var(--spacing-24)", minHeight: 48,
                borderBottom: "1px solid var(--color-stroke-medium)",
                background: "var(--color-fill-white)",
              }}>
                {TABLE_COLS.map((col) => (
                  <div key={col.label} style={{ flex: `${col.flex} 1 0`, minWidth: 0 }}>
                    <button
                      onClick={() => handleSort(col.label)}
                      style={{
                        display:       "inline-flex",
                        alignItems:    "center",
                        gap:           4,
                        background:    "none",
                        border:        "none",
                        padding:       0,
                        cursor:        "pointer",
                        lineHeight:    "var(--line-height-uppercase)",
                        fontWeight:    "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                        color:         "var(--color-text-weak)",
                        fontFamily:    "var(--font-family-body)",
                        textTransform: "uppercase" as const,
                        minWidth: 0, maxWidth: "100%",
                      }}
                    >
                      <TableHeadLabel>{col.label}</TableHeadLabel>
                      <IcSort active={sortCol === col.label} dir={sortDir} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Rows */}
              {buildingsLoading ? (
                <>
                  {[1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)}
                </>
              ) : buildingsError ? (
                <ErrorState message="Failed to load buildings" />
              ) : sorted.length === 0 ? (
                <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--color-text-weak)", fontSize: "var(--font-size-tiny)" }}>
                  No buildings match the current filter.
                </div>
              ) : (
                sorted.map((b, i) => (
                  <Link
                    key={b.id}
                    href={`/buildings/${b.id}`}
                    style={{
                      display: "flex", alignItems: "center",
                      padding: "0 20px", height: 57,
                      borderBottom: i < sorted.length - 1 ? "1px solid var(--color-stroke-medium)" : "none",
                      textDecoration: "none",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gray-5)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <div style={{ flex: "16 1 0", minWidth: 0 }}>
                      <CopyableCell value={b.name}>
                        <span style={{ ...cellTxt, fontWeight: "500" as React.CSSProperties["fontWeight"], color: "var(--color-text-strong)" }}>
                          {b.name}
                        </span>
                      </CopyableCell>
                    </div>
                    <div style={{ flex: "11 1 0", minWidth: 0 }}>
                      <CopyableCell value={b.subscriptionStatus}><StatusBadge status={b.subscriptionStatus} /></CopyableCell>
                    </div>
                    <div style={{ flex: "11 1 0", minWidth: 0 }}>
                      <CopyableCell value={b.syncStatus}><SyncDot status={b.syncStatus} /></CopyableCell>
                    </div>
                    <div style={{ flex: "8 1 0",  minWidth: 0 }}>
                      <CopyableCell value={String(b.totalBookings)}><span style={cellTxt}>{b.totalBookings}</span></CopyableCell>
                    </div>
                    <div style={{ flex: "8 1 0",  minWidth: 0 }}>
                      <CopyableCell value={String(b.creditsInCirculation)}><span style={cellTxt}>{b.creditsInCirculation}</span></CopyableCell>
                    </div>
                    <div style={{ flex: "7 1 0",  minWidth: 0 }}>
                      <CopyableCell value={String(b.openTickets)}>
                        <span style={{ ...cellTxt, color: b.openTickets >= 5 ? "var(--color-tag-text-expired)" : "var(--color-text-weak)" }}>
                          {b.openTickets}
                        </span>
                      </CopyableCell>
                    </div>
                  </Link>
                ))
              )}
          </TableScroll>
        </div>

        {/* ── Bottom row ───────────────────────────────────────────────────── */}
        {buildingsLoading ? (
          <div style={{ display: "flex", gap: "var(--spacing-16)" }}>
            {[1, 2].map((i) => (
              <div key={i} style={{
                flex: 1,
                background: "var(--color-fill-white)",
                border: "1px solid var(--color-stroke-medium)",
                borderRadius: "var(--radius-12)",
                padding: "20px",
              }}>
                <div style={{
                  height: 12, borderRadius: 4,
                  background: "var(--color-gray-100)",
                  width: "40%",
                  marginBottom: 16,
                }} />
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} style={{
                    display: "flex", justifyContent: "space-between",
                    marginBottom: 12,
                  }}>
                    <div style={{ height: 10, borderRadius: 4, background: "var(--color-gray-100)", width: "45%" }} />
                    <div style={{ height: 10, borderRadius: 4, background: "var(--color-gray-100)", width: "20%" }} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : buildingsError ? (
          <ErrorState message="Failed to load buildings" />
        ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--spacing-16)" }}>
          {/* Revenue Snapshot */}
          <div style={{
            flex: "1 1 280px",
            background: "var(--color-fill-white)",
            border: "1px solid var(--color-stroke-medium)",
            borderRadius: "var(--radius-12)",
            padding: "20px",
          }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "var(--font-size-tiny)", fontWeight: "500" as React.CSSProperties["fontWeight"], color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)" }}>
              Revenue Snapshot
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                ["Total MRR",              `$${mrr.toLocaleString()}/mo`],
                ["Total ARR",              `$${arr.toLocaleString()}/yr`],
                ["Active Subscriptions",   `${buildings.filter((b) => b.subscriptionStatus === "Active").length}`],
                ["Overdue",                `${buildings.filter((b) => b.subscriptionStatus === "Overdue").length}`],
                ["Expiring within 30 days",`${buildings.filter((b) => b.subscriptionStatus === "Expiring Soon").length}`],
                ["Next Renewal",            nextRenewalDate ? fmtDate(nextRenewalDate.toISOString()) : "—"],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "2px 12px" }}>
                  <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", flex: "1 1 auto", minWidth: 0 }}>{label}</span>
                  <span style={{ fontSize: "var(--font-size-tiny)", fontWeight: "500" as React.CSSProperties["fontWeight"], color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", flexShrink: 0, textAlign: "right" }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, borderTop: "1px solid var(--color-stroke-medium)", paddingTop: 14 }}>
              <Link href="/revenue" style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], textDecoration: "none" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "underline"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "none"; }}>
                View Revenue →
              </Link>
            </div>
          </div>

          {/* Credit Activity */}
          <div style={{
            flex: "1 1 280px",
            background: "var(--color-fill-white)",
            border: "1px solid var(--color-stroke-medium)",
            borderRadius: "var(--radius-12)",
            padding: "20px",
          }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "var(--font-size-tiny)", fontWeight: "500" as React.CSSProperties["fontWeight"], color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)" }}>
              Credit Activity
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                ["Credits in Circulation",       totalCredits.toLocaleString()],
                ["Earned This Month",            buildings.reduce((s, b) => s + b.creditsEarnedThisMonth, 0).toString()],
                ["Spent This Month",             buildings.reduce((s, b) => s + b.creditsSpentThisMonth, 0).toString()],
                ["Residents at Threshold (5+)",  buildings.reduce((s, b) => s + b.residentsAtThreshold, 0).toString()],
                ["Redemption Threshold",         "5 credits = $25 gift card"],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "2px 12px" }}>
                  <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", flex: "1 1 auto", minWidth: 0 }}>{label}</span>
                  <span style={{ fontSize: "var(--font-size-tiny)", fontWeight: "500" as React.CSSProperties["fontWeight"], color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", flexShrink: 0, textAlign: "right" }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, borderTop: "1px solid var(--color-stroke-medium)", paddingTop: 14 }}>
              <Link
                href="/credits"
                style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], textDecoration: "none" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "underline"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "none"; }}
              >
                View Credits →
              </Link>
            </div>
          </div>
        </div>
        )}

      </div>
    </>
  );
}
