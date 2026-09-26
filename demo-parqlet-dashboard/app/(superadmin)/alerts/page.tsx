"use client";

import { useState, useEffect, useCallback } from "react";
import { listAlerts, type Alert } from "@/lib/api/super-admin";
import { listBuildings, type Building } from "@/lib/api/buildings";
import { useBuildingFilter } from "../../components/context/building-filter-context";
import { fmtTimeFull as fmtTime } from "@/lib/dates";
import { TableScroll } from "../../components/ui/TableScroll";
import { TableHeadLabel } from "../../components/ui/TableHeadLabel";
import { CopyableCell } from "../../components/ui/CopyableCell";
import "../../tokens.css";

function SeverityBadge({ severity }: { severity: Alert["severity"] }) {
  const styles: Record<Alert["severity"], { bg: string; color: string }> = {
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
      padding: "3px 10px",
      fontSize: "var(--font-size-extra-tiny)",
      fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
      fontFamily: "var(--font-family-body)",
      whiteSpace: "nowrap",
    }}>
      {severity}
    </span>
  );
}

const ALL_TYPES = ["All", "Sync Failure", "Subscription Overdue", "Contract Expiring", "Low Adoption", "Zero Bookings", "High Support Volume", "Credit Stagnation"];

function SkeletonRow() {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      padding: "0 var(--spacing-24)", height: 57,
      borderBottom: "1px solid var(--color-stroke-medium)",
    }}>
      <div style={{ flex: "20 1 0", minWidth: 0 }}>
        <div style={{ height: 14, width: 100, borderRadius: 4, background: "var(--color-stroke-light)", animation: "pulse 1.5s infinite" }} />
      </div>
      <div style={{ flex: "20 1 0", minWidth: 0 }}>
        <div style={{ height: 16, width: 120, borderRadius: 4, background: "var(--color-stroke-light)", animation: "pulse 1.5s infinite" }} />
      </div>
      <div style={{ flex: "20 1 0", minWidth: 0 }}>
        <div style={{ height: 24, width: 70, borderRadius: 12, background: "var(--color-stroke-light)", animation: "pulse 1.5s infinite" }} />
      </div>
      <div style={{ flex: "20 1 0", minWidth: 0 }}>
        <div style={{ height: 16, width: 100, borderRadius: 4, background: "var(--color-stroke-light)", animation: "pulse 1.5s infinite" }} />
      </div>
      <div style={{ flex: "20 1 0", minWidth: 0 }}>
        <div style={{ height: 16, width: 160, borderRadius: 4, background: "var(--color-stroke-light)", animation: "pulse 1.5s infinite" }} />
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const { selectedIds, isAll } = useBuildingFilter();
  const [severityFilter, setSeverityFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [buildingFilter, setBuildingFilter] = useState("All");

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Fetch buildings for dropdown
  useEffect(() => {
    listBuildings({ pageSize: 100 })
      .then((res) => setBuildings(res.data))
      .catch(() => { /* non-critical, keep empty */ });
  }, []);

  // Fetch alerts — always without severity filter so tab counts stay accurate
  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Parameters<typeof listAlerts>[0] = { page: 1 };
      if (buildingFilter !== "All") params.buildingId = buildingFilter;
      const res = await listAlerts(params);
      let data = res.data;
      if (!isAll) data = data.filter((a) => selectedIds.includes(a.buildingId));
      setAlerts(data);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, [buildingFilter, isAll, selectedIds]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Counts always from the full (unfiltered by severity) dataset
  const counts = {
    Critical: alerts.filter((a) => a.severity === "Critical").length,
    Warning:  alerts.filter((a) => a.severity === "Warning").length,
    Info:     alerts.filter((a) => a.severity === "Info").length,
  };

  // Apply severity + type filters client-side so counts remain stable
  const filtered = alerts
    .filter((a) => severityFilter === "All" || a.severity === severityFilter)
    .filter((a) => typeFilter === "All" || a.type === typeFilter);

  const selectStyle: React.CSSProperties = {
    height: 36, padding: "0 32px 0 12px",
    border: "1px solid var(--color-stroke-medium)",
    borderRadius: "var(--radius-8)",
    background: "var(--color-fill-white)",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-strong)",
    cursor: "pointer", outline: "none",
    appearance: "none" as React.CSSProperties["appearance"],
    WebkitAppearance: "none",
  };


  return (<>
    <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    <div style={{ padding: "var(--spacing-24)", display: "flex", flexDirection: "column", gap: "var(--spacing-24)", fontFamily: "var(--font-family-body)", height: "100%", overflow: "hidden", boxSizing: "border-box" as React.CSSProperties["boxSizing"] }}>

      {/* Title */}
      <div>
        <h1 style={{ margin: 0, fontSize: "var(--font-size-heading-1)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-heading-1)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-heading)" }}>
          Alerts
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: "var(--font-size-body)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"] }}>
          {loading ? "Loading..." : `${total} active alert${total !== 1 ? "s" : ""} across the portfolio`}
        </p>
      </div>

      {/* Severity tabs */}
      <div style={{ display: "flex", alignItems: "flex-end", borderBottom: "1px solid var(--color-stroke-medium)" }}>
        {([["All", alerts.length], ["Critical", counts.Critical], ["Warning", counts.Warning], ["Info", counts.Info]] as [string, number][]).map(([label, count]) => {
          const active = label === "All" ? severityFilter === "All" : severityFilter === label;
          return (
            <button
              key={label}
              onClick={() => setSeverityFilter(label === "All" ? "All" : label)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "0 var(--spacing-4)", height: 40, marginRight: "var(--spacing-24)",
                background: "none", border: "none",
                borderBottom: active ? "2px solid var(--color-text-strong)" : "2px solid transparent",
                cursor: "pointer",
                fontFamily: "var(--font-family-body)",
                fontSize: "var(--font-size-tiny)",
                fontWeight: (active ? "var(--font-weight-medium)" : "var(--font-weight-regular)") as React.CSSProperties["fontWeight"],
                lineHeight: "var(--line-height-tiny)",
                color: active ? "var(--color-text-strong)" : "var(--color-text-weak)",
                transition: "color 0.15s, border-color 0.15s",
                marginBottom: -1, whiteSpace: "nowrap",
              }}
            >
              {label}
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                minWidth: 20, height: 18, borderRadius: "var(--radius-48)",
                background: active ? "var(--color-fill-strong)" : "var(--color-stroke-medium)",
                color: active ? "var(--color-text-white)" : "var(--color-text-weak)",
                fontSize: "var(--font-size-extra-tiny)",
                fontFamily: "var(--font-family-body)",
                padding: "0 5px",
              }}>
                {loading ? "—" : count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "var(--spacing-8)", flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <select value={buildingFilter} onChange={(e) => setBuildingFilter(e.target.value)} style={selectStyle}>
            <option value="All">All Buildings</option>
            {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
        </div>
        <div style={{ position: "relative" }}>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={selectStyle}>
            {ALL_TYPES.map((t) => <option key={t} value={t}>{t === "All" ? "All Types" : t}</option>)}
          </select>
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div style={{
          padding: "16px 20px",
          background: "var(--color-tag-expired)",
          borderRadius: "var(--radius-8)",
          color: "var(--color-tag-text-expired)",
          fontSize: "var(--font-size-tiny)",
        }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{ background: "var(--color-fill-white)", border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-12)", overflow: "hidden", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        <TableScroll minWidth={760}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", padding: "0 var(--spacing-24)", minHeight: 48, borderBottom: "1px solid var(--color-stroke-medium)", background: "var(--color-fill-white)", position: "sticky", top: 0, zIndex: 2 }}>
          {([["Timestamp", 20], ["Building", 20], ["Severity", 20], ["Type", 20], ["Description", 20]] as const).map(([label, flex]) => (
            <div key={label} style={{ flex: `${flex} 1 0`, minWidth: 0 }}>
              <span style={{ lineHeight: "var(--line-height-uppercase)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", textTransform: "uppercase" as const, display: "block", minWidth: 0, maxWidth: "100%" }}>
                <TableHeadLabel>{label}</TableHeadLabel>
              </span>
            </div>
          ))}
        </div>

        {loading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "left", color: "var(--color-text-weak)", fontSize: "var(--font-size-tiny)" }}>
            No alerts match the current filters.
          </div>
        ) : (
          filtered.map((alert, i) => (
            <div key={alert.id} style={{
              display: "flex", alignItems: "center",
              padding: "0 var(--spacing-24)", height: 57,
              borderBottom: i < filtered.length - 1 ? "1px solid var(--color-stroke-medium)" : "none",
            }}>
              <div style={{ flex: "20 1 0", minWidth: 0 }}>
                <CopyableCell value={fmtTime(alert.timestamp)}>
                  <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                    {fmtTime(alert.timestamp)}
                  </span>
                </CopyableCell>
              </div>
              <div style={{ flex: "20 1 0", minWidth: 0 }}>
                <CopyableCell value={alert.buildingName}>
                  <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                    {alert.buildingName}
                  </span>
                </CopyableCell>
              </div>
              <div style={{ flex: "20 1 0", minWidth: 0 }}>
                <CopyableCell value={alert.severity}>
                  <SeverityBadge severity={alert.severity} />
                </CopyableCell>
              </div>
              <div style={{ flex: "20 1 0", minWidth: 0 }}>
                <CopyableCell value={alert.type}>
                  <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                    {alert.type}
                  </span>
                </CopyableCell>
              </div>
              <div style={{ flex: "20 1 0", minWidth: 0 }}>
                <CopyableCell value={alert.description}>
                  <span title={alert.description} style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", cursor: "default" }}>
                    {alert.description}
                  </span>
                </CopyableCell>
              </div>
            </div>
          ))
        )}
        </TableScroll>
        </div>
      </div>
    </div>
  </>);
}