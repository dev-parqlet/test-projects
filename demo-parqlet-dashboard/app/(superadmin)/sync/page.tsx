"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { listBuildings, type Building } from "@/lib/api/buildings";
import { listSyncLogs, type SyncLog } from "@/lib/api/super-admin";
import { useBuildingFilter } from "../../components/context/building-filter-context";
import { TableScroll } from "../../components/ui/TableScroll";
import { TableHeadLabel } from "../../components/ui/TableHeadLabel";
import { CopyableCell } from "../../components/ui/CopyableCell";
import "../../tokens.css";
import { fmtTimeFull as fmtTime } from "@/lib/dates";

type SyncStatus = SyncLog["status"];

function SyncBadge({ status }: { status: SyncStatus }) {
  const map: Record<SyncStatus, { bg: string; color: string }> = {
    Success: { bg: "var(--color-tag-active)",  color: "var(--color-tag-text-active)"  },
    Failed:  { bg: "var(--color-tag-expired)", color: "var(--color-tag-text-expired)" },
    Stale:   { bg: "var(--color-tag-pending)", color: "var(--color-tag-text-pending)" },
  };
  const s = map[status];
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
      {status}
    </span>
  );
}

const ROWS_PER_PAGE = 10;

function SkeletonCard() {
  return (
    <div style={{
      background: "var(--color-fill-white)",
      border: "1px solid var(--color-stroke-medium)",
      borderRadius: "var(--radius-12)",
      padding: "16px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 8,
    }}>
      <div style={{ height: 16, width: 120, borderRadius: 4, background: "var(--color-stroke-light)", animation: "pulse 1.5s infinite" }} />
      <div style={{ height: 12, width: 80, borderRadius: 4, background: "var(--color-stroke-light)", animation: "pulse 1.5s infinite" }} />
      <div style={{ height: 12, width: 140, borderRadius: 4, background: "var(--color-stroke-light)", animation: "pulse 1.5s infinite" }} />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      padding: "0 var(--spacing-24)", height: 52,
      borderBottom: "1px solid var(--color-stroke-medium)",
    }}>
      <div style={{ flex: "20 1 0", minWidth: 0 }}>
        <div style={{ height: 14, width: 120, borderRadius: 4, background: "var(--color-stroke-light)", animation: "pulse 1.5s infinite" }} />
      </div>
      <div style={{ flex: "20 1 0", minWidth: 0, paddingLeft: 16 }}>
        <div style={{ height: 14, width: 100, borderRadius: 4, background: "var(--color-stroke-light)", animation: "pulse 1.5s infinite" }} />
      </div>
      <div style={{ flex: "14 1 0", minWidth: 0, paddingLeft: 16 }}>
        <div style={{ height: 14, width: 80, borderRadius: 4, background: "var(--color-stroke-light)", animation: "pulse 1.5s infinite" }} />
      </div>
      <div style={{ flex: "12 1 0", minWidth: 0, paddingLeft: 16 }}>
        <div style={{ height: 20, width: 60, borderRadius: 12, background: "var(--color-stroke-light)", animation: "pulse 1.5s infinite" }} />
      </div>
      <div style={{ flex: "12 1 0", minWidth: 0, paddingLeft: 16 }}>
        <div style={{ height: 14, width: 40, borderRadius: 4, background: "var(--color-stroke-light)", animation: "pulse 1.5s infinite" }} />
      </div>
      <div style={{ flex: "12 1 0", minWidth: 0, paddingLeft: 16 }}>
        <div style={{ height: 14, width: 70, borderRadius: 4, background: "var(--color-stroke-light)", animation: "pulse 1.5s infinite" }} />
      </div>
      <div style={{ flex: "18 1 0", minWidth: 0, paddingLeft: 16 }}>
        <div style={{ height: 14, width: 130, borderRadius: 4, background: "var(--color-stroke-light)", animation: "pulse 1.5s infinite" }} />
      </div>
    </div>
  );
}

export default function SyncPage() {
  const { selectedIds, isAll } = useBuildingFilter();
  const [statusFilter, setStatusFilter] = useState<"All" | SyncStatus>("All");
  const [buildingFilter, setBuildingFilter] = useState("All");
  const [page, setPage] = useState(0);

  // Fetch buildings
  const { data: buildingsData, isLoading: buildingsLoading } = useQuery({
    queryKey: ["buildings", "list"],
    queryFn: () => listBuildings({ pageSize: 100 }),
  });

  // Fetch sync logs
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Always fetch all logs (no status filter) so tab counts are always accurate
      const params: Parameters<typeof listSyncLogs>[0] = { page: 1 };
      if (buildingFilter !== "All") params.buildingId = buildingFilter;
      const res = await listSyncLogs(params);
      let data = res.data;
      if (!isAll) data = data.filter((s) => selectedIds.includes(s.buildingId));
      setSyncLogs(data);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sync logs");
    } finally {
      setLoading(false);
    }
  }, [buildingFilter, isAll, selectedIds]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => { setPage(0); }, [statusFilter, buildingFilter]);

  const allBuildings: Building[] = buildingsData?.data ?? [];
  const buildings = isAll ? allBuildings : allBuildings.filter((b) => selectedIds.includes(b.id));

  // Counts always from the full (unfiltered by status) dataset
  const successCount = syncLogs.filter((s) => s.status === "Success").length;
  const failedCount  = syncLogs.filter((s) => s.status === "Failed").length;
  const staleCount   = syncLogs.filter((s) => s.status === "Stale").length;

  // Apply status filter client-side so counts stay accurate across tab switches
  const filteredLogs = statusFilter === "All" ? syncLogs : syncLogs.filter((s) => s.status === statusFilter);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ROWS_PER_PAGE));
  const pageStart  = page * ROWS_PER_PAGE;
  const displayed  = filteredLogs.slice(pageStart, pageStart + ROWS_PER_PAGE);

  // Latest sync per building
  const latestByBuilding = buildings.map((b) => {
    const bLogs = syncLogs.filter((s) => s.buildingId === b.id).sort((a, z) => new Date(z.timestamp).getTime() - new Date(a.timestamp).getTime());
    return { building: b, latest: bLogs[0] ?? null };
  });

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

  const chevron = (
    <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </span>
  );

  return (<>
    <div style={{ padding: "var(--spacing-24)", display: "flex", flexDirection: "column", gap: "var(--spacing-24)", fontFamily: "var(--font-family-body)", height: "100%", overflow: "hidden", boxSizing: "border-box" as React.CSSProperties["boxSizing"] }}>

        {/* Title */}
        <div>
          <h1 style={{ margin: 0, fontSize: "var(--font-size-heading-1)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-heading-1)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-heading)" }}>
            Sync Monitor
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: "var(--font-size-body)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" }}>
            Data sync history and health across all buildings
          </p>
        </div>

        {/* Status tabs */}
        <div style={{ display: "flex", alignItems: "flex-end", borderBottom: "1px solid var(--color-stroke-medium)" }}>
          {([["All", syncLogs.length], ["Success", successCount], ["Failed", failedCount], ["Stale", staleCount]] as [string, number][]).map(([label, count]) => {
            const active = label === "All" ? statusFilter === "All" : statusFilter === label;
            return (
              <button
                key={label}
                onClick={() => setStatusFilter(label === "All" ? "All" : label as SyncStatus)}
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

        {/* Error banner */}
        {error && (
          <div style={{ padding: "12px 16px", background: "var(--color-tag-expired)", color: "var(--color-tag-text-expired)", borderRadius: "var(--radius-8)", fontSize: "var(--font-size-tiny)" }}>
            {error}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "flex", gap: "var(--spacing-8)" }}>
          <div style={{ position: "relative" }}>
            <select value={buildingFilter} onChange={(e) => setBuildingFilter(e.target.value)} style={selectStyle}>
              <option value="All">All Buildings</option>
              {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {chevron}
          </div>
        </div>

        {/* Logs table */}
        <div style={{ background: "var(--color-fill-white)", border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-12)", overflow: "hidden", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          <TableScroll minWidth={900}>
          <div style={{ display: "flex", alignItems: "center", padding: "0 var(--spacing-24)", minHeight: 48, borderBottom: "1px solid var(--color-stroke-medium)", background: "var(--color-fill-white)", position: "sticky", top: 0, zIndex: 2 }}>
            {([["Timestamp", 20], ["Building", 20], ["Platform", 14], ["Status", 12], ["Records Synced", 12], ["Type", 12], ["Error", 18]].map(([label, flex]) => (
              <div key={label as string} style={{ flex: `${flex} 1 0`, minWidth: 0 }}>
                <span style={{ lineHeight: "var(--line-height-uppercase)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", textTransform: "uppercase" as const, minWidth: 0, maxWidth: "100%", display: "block" }}><TableHeadLabel>{label as string}</TableHeadLabel></span>
              </div>
            )))}
          </div>

          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
          ) : displayed.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "left", color: "var(--color-text-weak)", fontSize: "var(--font-size-tiny)" }}>
              No sync logs match the current filters.
            </div>
          ) : displayed.map((s, i) => (
            <div key={s.id} style={{
              display: "flex", alignItems: "center", padding: "0 var(--spacing-24)", height: 52,
              borderBottom: i < displayed.length - 1 ? "1px solid var(--color-stroke-medium)" : "none",
            }}>
              <div style={{ flex: "20 1 0", minWidth: 0 }}>
                <CopyableCell value={fmtTime(s.timestamp)}>
                  <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{fmtTime(s.timestamp)}</span>
                </CopyableCell>
              </div>
              <div style={{ flex: "20 1 0", minWidth: 0 }}>
                <Link href={`/buildings/${s.buildingId}`} style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", textDecoration: "none", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                  {s.buildingName}
                </Link>
              </div>
              <div style={{ flex: "14 1 0", minWidth: 0 }}>
                <CopyableCell value={s.platform}>
                  <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{s.platform}</span>
                </CopyableCell>
              </div>
              <div style={{ flex: "12 1 0", minWidth: 0 }}>
                <CopyableCell value={s.status}>
                  <SyncBadge status={s.status} />
                </CopyableCell>
              </div>
              <div style={{ flex: "12 1 0", minWidth: 0 }}>
                <CopyableCell value={s.recordsSynced !== null ? String(s.recordsSynced) : undefined}>
                  <span style={{ fontSize: "var(--font-size-tiny)", color: s.recordsSynced !== null ? "var(--color-text-strong)" : "var(--color-text-weak)", fontFamily: "var(--font-family-body)", whiteSpace: "nowrap" }}>
                    {s.recordsSynced !== null ? s.recordsSynced : "—"}
                  </span>
                </CopyableCell>
              </div>
              <div style={{ flex: "12 1 0", minWidth: 0 }}>
                <CopyableCell value={s.type}>
                  <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{s.type}</span>
                </CopyableCell>
              </div>
              <div style={{ flex: "18 1 0", minWidth: 0 }}>
                <CopyableCell value={s.errorMessage ?? undefined}>
                  <span style={{ fontSize: "var(--font-size-extra-tiny)", color: "var(--color-tag-text-expired)", fontFamily: "var(--font-family-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                    {s.errorMessage ?? ""}
                  </span>
                </CopyableCell>
              </div>
            </div>
          ))}
          </TableScroll>
          </div>

          {/* Pagination footer */}
          {!loading && displayed.length > 0 && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0 var(--spacing-24)", height: 57,
              borderTop: "1px solid var(--color-stroke-medium)",
              background: "var(--color-fill-white)",
            }}>
              <span style={{ fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", lineHeight: "var(--line-height-extra-tiny)", fontFamily: "var(--font-family-body)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"] }}>
                Showing {pageStart + 1} to {Math.min(pageStart + ROWS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length} entries
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-4)" }}>
                {/* Prev */}
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  style={{
                    width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                    background: "none", border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-8)",
                    cursor: page === 0 ? "default" : "pointer", opacity: page === 0 ? 0.4 : 1,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>

                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i).map((i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    style={{
                      width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                      background: i === page ? "var(--color-fill-strong)" : "none",
                      border: i === page ? "none" : "1px solid var(--color-stroke-medium)",
                      borderRadius: "var(--radius-8)", cursor: "pointer",
                      fontFamily: "var(--font-family-body)",
                      fontSize: "var(--font-size-extra-tiny)",
                      fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                      color: i === page ? "var(--color-text-white)" : "var(--color-text-strong)",
                      lineHeight: "var(--line-height-extra-tiny)",
                    }}
                  >
                    {i + 1}
                  </button>
                ))}

                {/* Next */}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  style={{
                    width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                    background: "none", border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-8)",
                    cursor: page === totalPages - 1 ? "default" : "pointer", opacity: page === totalPages - 1 ? 0.4 : 1,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}