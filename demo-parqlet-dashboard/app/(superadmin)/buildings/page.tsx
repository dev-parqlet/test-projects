"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useBuildingFilter } from "../../components/context/building-filter-context";
import { listBuildings, buildingKeys, type Building, type ListBuildingsParams } from "@/lib/api/buildings";
import { Badge } from "../../components/ui/Badge";
import { TableScroll } from "../../components/ui/TableScroll";
import { TableHeadLabel } from "../../components/ui/TableHeadLabel";
import { CopyableCell } from "../../components/ui/CopyableCell";
import { BuildingCreateModal } from "../../components/buildings/BuildingCreateModal";
import "../../tokens.css";

function ViewLink({ href }: { href: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", textDecoration: hovered ? "underline" : "none", textUnderlineOffset: 2, fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"] }}
    >
      View details
    </Link>
  );
}

function SyncDot({ status }: { status: Building["syncStatus"] }) {
  const color = status === "Success" ? "var(--color-green-600)"
    : status === "Failed" ? "var(--color-red-600)"
    : status === "Not Synced" ? "var(--color-stroke-strong)"
    : "var(--color-mustard-600)";
  return <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />;
}

type SortDir = "asc" | "desc";
type SortCol = "name" | "units" | "subscription" | "mrr" | "sync" | "tickets";

const SKELETON_ROWS = 6;

function SkeletonRow() {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      padding: "0 20px", height: 57,
      borderBottom: "1px solid var(--color-stroke-medium)",
    }}>
      <div style={{ flex: "22 1 0", minWidth: 0 }}>
        <div style={{ height: 14, borderRadius: 4, background: "var(--color-stroke-medium)", width: "60%", animation: "pulse 1.5s infinite" }} />
        <div style={{ height: 10, borderRadius: 4, background: "var(--color-stroke-medium)", width: "35%", marginTop: 6, animation: "pulse 1.5s infinite" }} />
      </div>
      <div style={{ flex: "8 1 0", minWidth: 0 }}><div style={{ height: 12, borderRadius: 4, background: "var(--color-stroke-medium)", width: "50%", animation: "pulse 1.5s infinite" }} /></div>
      <div style={{ flex: "14 1 0", minWidth: 0 }}><div style={{ height: 20, borderRadius: 12, background: "var(--color-stroke-medium)", width: "70%", animation: "pulse 1.5s infinite" }} /></div>
      <div style={{ flex: "10 1 0", minWidth: 0 }}><div style={{ height: 12, borderRadius: 4, background: "var(--color-stroke-medium)", width: "50%", animation: "pulse 1.5s infinite" }} /></div>
      <div style={{ flex: "10 1 0", minWidth: 0 }}><div style={{ height: 12, borderRadius: 4, background: "var(--color-stroke-medium)", width: "50%", animation: "pulse 1.5s infinite" }} /></div>
      <div style={{ flex: "12 1 0", minWidth: 0 }}><div style={{ height: 12, borderRadius: 4, background: "var(--color-stroke-medium)", width: "30%", animation: "pulse 1.5s infinite" }} /></div>
      <div style={{ flex: "8 1 0", minWidth: 0, display: "flex", justifyContent: "flex-end" }}><div style={{ height: 12, borderRadius: 4, background: "var(--color-stroke-medium)", width: 36, animation: "pulse 1.5s infinite" }} /></div>
    </div>
  );
}

export default function BuildingsPage() {
  const { selectedIds, isAll } = useBuildingFilter();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [query, setQuery] = useState("");
  const [subFilter, setSubFilter] = useState<"All" | Building["subscriptionStatus"]>("All");
  const [sortCol, setSortCol] = useState<SortCol>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const apiParams = useMemo<ListBuildingsParams>(() => ({
    search: query.trim() || undefined,
    subscriptionStatus: subFilter !== "All" ? subFilter : undefined,
    pageSize: 100,
  }), [query, subFilter]);

  const { data, isLoading, isError } = useQuery({
    queryKey: buildingKeys.list(apiParams as Record<string, string | number | boolean>),
    queryFn: () => listBuildings(apiParams),
  });

  const allBuildings = data?.data ?? [];

  const filtered = useMemo(() => {
    let list = isAll ? allBuildings : allBuildings.filter((b) => selectedIds.includes(b.id));
    if (subFilter !== "All") list = list.filter((b) => b.subscriptionStatus === subFilter);
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortCol === "name")         cmp = a.name.localeCompare(b.name);
      else if (sortCol === "units")   cmp = a.units - b.units;
      else if (sortCol === "subscription") cmp = a.subscriptionStatus.localeCompare(b.subscriptionStatus);
      else if (sortCol === "mrr")     cmp = a.mrr - b.mrr;
      else if (sortCol === "sync")    cmp = a.syncStatus.localeCompare(b.syncStatus);
      else if (sortCol === "tickets") cmp = a.openTickets - b.openTickets;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [allBuildings, selectedIds, isAll, subFilter, sortCol, sortDir]);

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  }

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

  const COLS: { label: string; col: SortCol; flex: number }[] = [
    { label: "Building",      col: "name",         flex: 22 },
    { label: "Units",         col: "units",        flex: 8  },
    { label: "Subscription",  col: "subscription", flex: 14 },
    { label: "MRR",           col: "mrr",          flex: 10 },
    { label: "Sync",          col: "sync",         flex: 10 },
    { label: "Open Tickets",  col: "tickets",      flex: 12 },
  ];

  function SortIcon({ col }: { col: SortCol }) {
    const active = sortCol === col;
    const upColor   = active && sortDir === "asc"  ? "var(--color-text-strong)" : "var(--color-stroke-strong)";
    const downColor = active && sortDir === "desc" ? "var(--color-text-strong)" : "var(--color-stroke-strong)";
    return (
      <svg width="9" height="11" viewBox="0 0 12 14" fill="none" style={{ flexShrink: 0 }}>
        <path d="M2 5l4-4 4 4" stroke={upColor}   strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 9l4 4 4-4" stroke={downColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }

  return (
    <div style={{ padding: "var(--spacing-24)", display: "flex", flexDirection: "column", gap: "var(--spacing-24)", fontFamily: "var(--font-family-body)", height: "100%", overflow: "hidden", boxSizing: "border-box" as React.CSSProperties["boxSizing"] }}>

      {/* Title + Action */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "var(--font-size-heading-1)", fontWeight: "var(--font-weight-regular)", lineHeight: "var(--line-height-heading-1)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-heading)" }}>
            Buildings
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: "var(--font-size-body)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", fontWeight: "var(--font-weight-regular)" }}>
            {isLoading ? "…" : `${filtered.length} building${filtered.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            display: "flex", alignItems: "center",
            // Fixed brand color, doesn't invert in dark mode — keep text dark.
            background: "var(--color-fill-accent)", color: "#222222",
            border: "none", borderRadius: "var(--radius-8)",
            padding: "11px var(--spacing-16)", cursor: "pointer", flexShrink: 0,
            fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            lineHeight: "var(--line-height-tiny)", transition: "background 0.15s", whiteSpace: "nowrap",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Add Building
        </button>
      </div>

      {/* Search + Filters */}
      <div style={{ display: "flex", gap: "var(--spacing-8)", flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 360 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="var(--color-icon-weak)" strokeWidth="1.5"/><path d="M21 21l-4.35-4.35" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </span>
          <input
            type="text"
            placeholder="Search buildings…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%", height: 36,
              padding: "0 12px 0 34px",
              border: "1px solid var(--color-stroke-medium)",
              borderRadius: "var(--radius-8)",
              background: "var(--color-fill-white)",
              fontFamily: "var(--font-family-body)",
              fontSize: "var(--font-size-tiny)",
              color: "var(--color-text-strong)",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ position: "relative" }}>
          <select value={subFilter} onChange={(e) => setSubFilter(e.target.value as typeof subFilter)} style={selectStyle}>
            <option value="All">All Subscriptions</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Overdue">Overdue</option>
            <option value="Expiring Soon">Expiring Soon</option>
          </select>
          {chevron}
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div style={{ padding: "24px", background: "var(--color-fill-white)", border: "1px solid var(--color-red-600)", borderRadius: "var(--radius-12)", textAlign: "center", color: "var(--color-red-1000)", fontSize: "var(--font-size-tiny)" }}>
          Failed to load buildings. Please try again.
        </div>
      )}

      {/* Table */}
      <div style={{ background: "var(--color-fill-white)", border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-12)", overflow: "hidden", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        <TableScroll minWidth={900}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", padding: "0 var(--spacing-24)", minHeight: 48, borderBottom: "1px solid var(--color-stroke-medium)", background: "var(--color-fill-white)", position: "sticky", top: 0, zIndex: 2 }}>
          {COLS.map(({ label, col, flex }) => (
            <div key={col} style={{ flex: `${flex} 1 0`, minWidth: 0 }}>
              <button onClick={() => handleSort(col)} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", padding: 0, cursor: "pointer", lineHeight: "var(--line-height-uppercase)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", textTransform: "uppercase" as const, minWidth: 0, maxWidth: "100%" }}>
                <TableHeadLabel>{label}</TableHeadLabel>
                <SortIcon col={col} />
              </button>
            </div>
          ))}
          {/* Actions column */}
          <div style={{ flex: "8 1 0", minWidth: 0 }} />
        </div>

        {isLoading ? (
          <>
            {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "left", color: "var(--color-text-weak)", fontSize: "var(--font-size-tiny)" }}>
            No buildings match the current filters.
          </div>
        ) : filtered.map((b, i) => (
          <div key={b.id} style={{
            display: "flex", alignItems: "center",
            padding: "0 20px", height: 57,
            borderBottom: i < filtered.length - 1 ? "1px solid var(--color-stroke-medium)" : "none",
          }}>
            <div style={{ flex: "22 1 0", minWidth: 0 }}>
              <CopyableCell value={b.name}>
                <div style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontWeight: "500" as React.CSSProperties["fontWeight"], fontFamily: "var(--font-family-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {b.name}
                </div>
              </CopyableCell>
              <CopyableCell value={b.city}>
                <div style={{ fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {b.city}
                </div>
              </CopyableCell>
            </div>
            <div style={{ flex: "8 1 0", minWidth: 0 }}>
              <CopyableCell value={String(b.units)}>
                <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", whiteSpace: "nowrap" }}>{b.units}</span>
              </CopyableCell>
            </div>
            <div style={{ flex: "14 1 0", minWidth: 0 }}>
              <CopyableCell value={b.subscriptionStatus}>
                <Badge as="span" variant={b.subscriptionStatus === "Active" ? "active" : b.subscriptionStatus === "Inactive" ? "inactive" : (b.subscriptionStatus === "Overdue" || b.subscriptionStatus === "Past Due") ? "expired" : "upcoming"}>{b.subscriptionStatus}</Badge>
              </CopyableCell>
            </div>
            <div style={{ flex: "10 1 0", minWidth: 0 }}>
              <CopyableCell value={`$${b.mrr.toLocaleString()}/mo`}>
                <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", whiteSpace: "nowrap" }}>
                  ${b.mrr.toLocaleString()}/mo
                </span>
              </CopyableCell>
            </div>
            <div style={{ flex: "10 1 0", minWidth: 0, display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
              <SyncDot status={b.syncStatus} />
              <CopyableCell value={b.syncStatus}>
                <span style={{ fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.syncStatus}</span>
              </CopyableCell>
            </div>
            <div style={{ flex: "12 1 0", minWidth: 0 }}>
              <CopyableCell value={String(b.openTickets)}>
                <span style={{ fontSize: "var(--font-size-tiny)", color: b.openTickets > 4 ? "var(--color-red-1000)" : "var(--color-text-strong)", fontFamily: "var(--font-family-body)", fontWeight: b.openTickets > 4 ? ("600" as React.CSSProperties["fontWeight"]) : ("400" as React.CSSProperties["fontWeight"]), whiteSpace: "nowrap" }}>
                  {b.openTickets}
                </span>
              </CopyableCell>
            </div>
            <div style={{ flex: "8 1 0", minWidth: 0, display: "flex", justifyContent: "flex-end" }}>
              <ViewLink href={`/buildings/${b.id}`} />
            </div>
          </div>
        ))}
        </TableScroll>
        </div>
      </div>

      <BuildingCreateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => queryClient.invalidateQueries({ queryKey: buildingKeys.all })}
        existingAdminEmails={allBuildings.map((b) => b.hoaEmail)}
      />
    </div>
  );
}
