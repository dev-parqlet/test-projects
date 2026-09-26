"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../components/auth/auth-provider";
import { useBuildingFilter } from "../components/context/building-filter-context";
import { listBuildings, buildingKeys } from "@/lib/api/buildings";
import { listTickets, superAdminKeys, type SupportTicket } from "@/lib/api/super-admin";
import { fmtDate } from "@/lib/dates";
import { IdDisplay } from "../components/ui/IdDisplay";
import { TableScroll } from "../components/ui/TableScroll";
import { TableHeadLabel } from "../components/ui/TableHeadLabel";
import { CopyableCell } from "../components/ui/CopyableCell";
import "../tokens.css";

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<SupportTicket["status"], { bg: string; color: string }> = {
  Open:          { bg: "var(--color-tag-expired)", color: "var(--color-tag-text-expired)" },
  "In Progress": { bg: "var(--color-tag-pending)", color: "var(--color-tag-text-pending)" },
  Resolved:      { bg: "var(--color-tag-active)",  color: "var(--color-tag-text-active)"  },
};

function StatusBadge({ status }: { status: SupportTicket["status"] }) {
  const s = STATUS_COLORS[status];
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

// ─── Page ───────────────────────────────────────────────────────────────────

export default function TicketsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  // Super admin: building filter context; HOA admin: scoped to own building
  const { selectedIds, isAll } = useBuildingFilter();

  const [statusFilter, setStatusFilter] = useState<"All" | SupportTicket["status"]>("All");
  const [buildingFilter, setBuildingFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  // Fetch buildings for dropdown
  const { data: buildingsData } = useQuery({
    queryKey: buildingKeys.list(),
    queryFn: () => listBuildings({ pageSize: 100 }),
  });
  const buildingsList = buildingsData?.data ?? [];

  // Fetch tickets
  const apiParams = useMemo(() => ({
    status: statusFilter !== "All" ? statusFilter as SupportTicket["status"] : undefined,
    page: 1,
  }), [statusFilter]);

  const { data: ticketsData, isLoading, isError } = useQuery({
    queryKey: superAdminKeys.tickets(apiParams),
    queryFn: () => listTickets(apiParams),
  });

  const allTickets = ticketsData?.data ?? [];

  // Filter tickets by building context
  const tickets = useMemo(() => {
    if (!isSuperAdmin && user?.buildingId) {
      // HOA admin: scoped to their building
      return allTickets.filter((t: any) => t.buildingId === user.buildingId);
    }
    // Super admin: use building filter context
    const buildings = isAll ? buildingsList : buildingsList.filter((b: any) => selectedIds.includes(b.id));
    const buildingIds = new Set(buildings.map((b: any) => b.id));
    return allTickets.filter((t: any) => buildingIds.has(t.buildingId));
  }, [allTickets, isSuperAdmin, user, buildingsList, selectedIds, isAll]);

  const filtered = useMemo(() => {
    return tickets.filter((t: any) => {
      if (statusFilter !== "All" && t.status !== statusFilter) return false;
      if (buildingFilter !== "All" && t.buildingId !== buildingFilter) return false;
      if (query.trim() && !t.subject.toLowerCase().includes(query.trim().toLowerCase())) return false;
      return true;
    });
  }, [tickets, statusFilter, buildingFilter, query]);

  useEffect(() => { setPage(0); }, [statusFilter, buildingFilter, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const pageStart  = page * ROWS_PER_PAGE;
  const displayed  = filtered.slice(pageStart, pageStart + ROWS_PER_PAGE);

  const openCount       = tickets.filter((t: any) => t.status === "Open").length;
  const inProgressCount = tickets.filter((t: any) => t.status === "In Progress").length;
  const resolvedCount   = tickets.filter((t: any) => t.status === "Resolved").length;

  // Per-building ticket counts (super admin view)
  const perBuilding = useMemo(() => {
    if (!isSuperAdmin) return [];
    return buildingsList
      .map((b: any) => ({
        building: b,
        open:       tickets.filter((t: any) => t.buildingId === b.id && t.status === "Open").length,
        inProgress: tickets.filter((t: any) => t.buildingId === b.id && t.status === "In Progress").length,
        total:      tickets.filter((t: any) => t.buildingId === b.id).length,
      }))
      .filter((x: any) => x.total > 0)
      .sort((a: any, b: any) => b.open - a.open);
  }, [isSuperAdmin, buildingsList, tickets]);

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

  return (
    <div style={{ padding: "var(--spacing-24)", display: "flex", flexDirection: "column", gap: "var(--spacing-24)", fontFamily: "var(--font-family-body)", height: "100%", overflow: "hidden", boxSizing: "border-box" as React.CSSProperties["boxSizing"] }}>
      {/* Title + Create button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: "var(--font-size-heading-1)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            lineHeight: "var(--line-height-heading-1)",
            color: "var(--color-text-strong)",
            fontFamily: "var(--font-family-heading)",
          }}>
            Support Tickets
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: "var(--font-size-body)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" }}>
            {isSuperAdmin
              ? `${tickets.length} ticket${tickets.length !== 1 ? "s" : ""} across the portfolio`
              : `${tickets.length} ticket${tickets.length !== 1 ? "s" : ""} for ${user?.buildings?.[0]?.name ?? "your building"}`
            }
          </p>
        </div>
        <Link
          href="/tickets/new"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "0 var(--spacing-16)",
            height: 42,
            background: "var(--color-button-primary)",
            // Fixed brand color, doesn't invert in dark mode — keep text dark.
            color: "#222222",
            borderRadius: "var(--radius-8)",
            textDecoration: "none",
            fontSize: "var(--font-size-body)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            fontFamily: "var(--font-family-body)",
            lineHeight: "var(--line-height-body)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-accent-1200)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-button-primary)"; }}
        >
          New Ticket
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </Link>
      </div>

      {/* Per-building summary (super admin only) */}
      {/* Status tabs */}
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
      <div style={{ display: "flex", alignItems: "flex-end", borderBottom: "1px solid var(--color-stroke-medium)", minWidth: "max-content" }}>
        {([
          ["All", tickets.length] as const,
          ["Open", openCount] as const,
          ["In Progress", inProgressCount] as const,
          ["Resolved", resolvedCount] as const,
        ]).map(([label, count]) => {
          const active = label === "All" ? statusFilter === "All" : statusFilter === label;
          return (
            <button
              key={label}
              onClick={() => setStatusFilter(label === "All" ? "All" : label as SupportTicket["status"])}
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
                {count}
              </span>
            </button>
          );
        })}
      </div>
      </div>

      {/* Search + Filters */}
      <div style={{ display: "flex", gap: "var(--spacing-8)", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 360 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="var(--color-icon-weak)" strokeWidth="1.5"/>
              <path d="M21 21l-4.35-4.35" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search subjects…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%", height: 36, padding: "0 12px 0 34px",
              border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-8)",
              background: "var(--color-fill-white)", fontFamily: "var(--font-family-body)",
              fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)",
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
        {isSuperAdmin && (
          <div style={{ position: "relative" }}>
            <select value={buildingFilter} onChange={(e) => setBuildingFilter(e.target.value)} style={selectStyle}>
              <option value="All">All Buildings</option>
              {buildingsList.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {chevron}
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ background: "var(--color-fill-white)", border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-12)", overflow: "hidden", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        <TableScroll minWidth={isSuperAdmin ? 780 : 760}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", padding: "0 var(--spacing-24)", minHeight: 48,
          borderBottom: "1px solid var(--color-stroke-medium)", background: "var(--color-fill-white)",
          position: "sticky", top: 0, zIndex: 2,
        }}>
          {[[isSuperAdmin ? "ID" : "ID", isSuperAdmin ? 8 : 8],
            isSuperAdmin ? ["Building", 16] : null,
            ["Subject", isSuperAdmin ? 30 : 40],
            isSuperAdmin ? ["Status", 16] : ["Category", 14],
            isSuperAdmin ? ["Opened", 16] : ["Priority", 12],
            isSuperAdmin ? null : ["Status", 14],
            isSuperAdmin ? null : ["Date", 12],
            [null, 14],
          ].filter(Boolean).map((col: any) => {
            const [label, flex] = col;
            if (!label) return <div key={label} style={{ flex: `${flex} 1 0`, minWidth: 0 }} />;
            return (
              <div key={label} style={{ flex: `${flex} 1 0`, minWidth: 0, maxWidth: "100%" }}>
                <TableHeadLabel style={{
                  fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                  color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)",
                  textTransform: "uppercase" as const,
                  lineHeight: "var(--line-height-uppercase)",
                }}>
                  {label}
                </TableHeadLabel>
              </div>
            );
          })}
        </div>

        {isLoading ? (
          <div>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", padding: "0 var(--spacing-24)", height: 57, borderBottom: i < 4 ? "1px solid var(--color-stroke-medium)" : "none" }}>
                {(isSuperAdmin ? [8, 16, 30, 16, 16, 14] : [8, 40, 14, 12, 14, 12, 14]).map((flex, j) => (
                  <div key={j} style={{ flex: `${flex} 1 0`, minWidth: 0 }}>
                    <div style={{ width: "75%", height: 12, borderRadius: 4, background: "var(--color-gray-30)" }} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : isError || filtered.length === 0 ? null : (
          displayed.map((t: any, i) => (
            <div
              key={t.id}
              style={{
                display: "flex", alignItems: "center", padding: "0 var(--spacing-24)", height: 57,
                borderBottom: i < displayed.length - 1 ? "1px solid var(--color-stroke-medium)" : "none",
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-gray-5)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ flex: "8 1 0", minWidth: 0 }}>
                <CopyableCell value={t.id}>
                  <IdDisplay value={t.id} style={{ fontSize: "var(--font-size-tiny)", fontFamily: "var(--font-family-body)" }} />
                </CopyableCell>
              </div>
              {isSuperAdmin && (
                <div style={{ flex: "16 1 0", minWidth: 0 }}>
                  <CopyableCell value={t.buildingName}>
                    <Link href={`/buildings/${t.buildingId}`} style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", textDecoration: "none", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                      {t.buildingName}
                    </Link>
                  </CopyableCell>
                </div>
              )}
              <div style={{ flex: isSuperAdmin ? "30 1 0" : "40 1 0", minWidth: 0 }}>
                {/* disabled — CopyableCell's onClickCapture stops propagation
                    on every click, which silently swallowed this button's
                    onClick and made the title un-clickable. Navigates to the
                    full ticket-detail page (live Gmail thread, reply
                    composer) rather than the old read-only modal. */}
                <CopyableCell value={t.subject} disabled>
                  <button
                    onClick={() => router.push(`/tickets/${t.id}`)}
                    style={{
                      background: "none", border: "none", padding: 0, cursor: "pointer",
                      fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)",
                      fontFamily: "var(--font-family-body)", textDecoration: "none",
                      fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block",
                      width: "100%", textAlign: "left",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
                  >
                    {t.subject}
                  </button>
                </CopyableCell>
              </div>
              {isSuperAdmin ? (
                <>
                  <div style={{ flex: "16 1 0", minWidth: 0 }}>
                    <CopyableCell value={t.status}><StatusBadge status={t.status} /></CopyableCell>
                  </div>
                  <div style={{ flex: "16 1 0", minWidth: 0 }}>
                    <CopyableCell value={fmtDate(t.openedDate)}>
                      <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                        {fmtDate(t.openedDate)}
                      </span>
                    </CopyableCell>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ flex: "14 1 0", minWidth: 0 }}>
                    <CopyableCell value={t.category ?? "General"}>
                      <span style={{ fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                        {t.category ?? "General"}
                      </span>
                    </CopyableCell>
                  </div>
                  <div style={{ flex: "12 1 0", minWidth: 0 }}>
                    <CopyableCell value={t.priority ?? "Medium"}>
                      <span style={{ fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                        {t.priority ?? "Medium"}
                      </span>
                    </CopyableCell>
                  </div>
                  <div style={{ flex: "14 1 0", minWidth: 0 }}>
                    <CopyableCell value={t.status}><StatusBadge status={t.status} /></CopyableCell>
                  </div>
                  <div style={{ flex: "12 1 0", minWidth: 0 }}>
                    <CopyableCell value={fmtDate(t.openedDate)}>
                      <span style={{ fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                        {fmtDate(t.openedDate)}
                      </span>
                    </CopyableCell>
                  </div>
                </>
              )}
              {/* Same "View details" link for both roles — the ticket
                  subject button above navigates to the same page. Safe for
                  HOA to use as-is: the full ticket-detail page already
                  renders a read-only status pill instead of the status
                  dropdown, and only lets super admins add internal notes. */}
              <div style={{ flex: "14 1 0", minWidth: 0, display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={() => router.push(`/tickets/${t.id}`)}
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", textDecoration: "none", whiteSpace: "nowrap" }}
                  onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
                >
                  View details
                </button>
              </div>
            </div>
          ))
        )}
        </TableScroll>

        {isError ? (
          <div style={{ padding: "48px 20px", textAlign: "left", color: "var(--color-tag-text-expired)", fontSize: "var(--font-size-tiny)" }}>
            Failed to load tickets. Please try again.
          </div>
        ) : !isLoading && filtered.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "left", color: "var(--color-text-weak)", fontSize: "var(--font-size-tiny)" }}>
            No tickets match the current filters.
          </div>
        ) : null}
        </div>

        {/* Pagination */}
        {filtered.length > ROWS_PER_PAGE && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 var(--spacing-24)", height: 57,
            borderTop: "1px solid var(--color-stroke-medium)",
            background: "var(--color-fill-white)",
          }}>
            <span style={{
              fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)",
              lineHeight: "var(--line-height-extra-tiny)", fontFamily: "var(--font-family-body)",
            }}>
              Showing {pageStart + 1} to {Math.min(pageStart + ROWS_PER_PAGE, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-4)" }}>
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-8)", cursor: page === 0 ? "default" : "pointer", opacity: page === 0 ? 0.4 : 1 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i).map((i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  style={{
                    width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                    background: i === page ? "var(--color-fill-strong)" : "none",
                    border: i === page ? "none" : "1px solid var(--color-stroke-medium)",
                    borderRadius: "var(--radius-8)", cursor: "pointer",
                    fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-extra-tiny)",
                    fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                    color: i === page ? "var(--color-text-white)" : "var(--color-text-strong)",
                    lineHeight: "var(--line-height-extra-tiny)",
                  }}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-8)", cursor: page === totalPages - 1 ? "default" : "pointer", opacity: page === totalPages - 1 ? 0.4 : 1 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}