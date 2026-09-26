"use client";

/**
 * Super-admin bookings page — `/super-admin/bookings`.
 *
 * Cross-building guest-parking bookings table. Building scoping comes
 * entirely from the header's BuildingFilterDropdown (BuildingFilterContext)
 * rather than a second filter on this page — `listBookings` is called with
 * no `buildingId` (super_admin + no buildingId = every building, see
 * api-backend routes/bookings.ts), and the header's selection narrows the
 * already-fetched set client-side, same pattern as (superadmin)/sync.
 *
 * `tab: ""` (rather than "current"/"past"/"future") means "no chronological
 * filter" — see the comment on `listBookings` in lib/api/bookings.ts. This
 * page shows every booking regardless of when it happened; Cancelled/
 * Expired are included since the backend only hides those from non-super-
 * admin callers.
 */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useBuildingFilter } from "../../../components/context/building-filter-context";
import { listBuildings, type Building } from "../../../lib/api/buildings";
import { listBookings, type Booking } from "../../../lib/api/bookings";
import { TableScroll } from "../../../components/ui/TableScroll";
import { TableHeadLabel } from "../../../components/ui/TableHeadLabel";
import { CopyableCell } from "../../../components/ui/CopyableCell";
import { FilterDropdown } from "../../../components/ui/FilterDropdown";
import { Pagination } from "../../../components/ui/Pagination";
import { Badge, type BadgeVariant } from "../../../components/ui/Badge";
import { IcSearch } from "../../../(hoa)/parking/components/icons";

const ROWS_PER_PAGE = 20;

// Same label/variant convention as the HOA bookings table (app/(hoa)/bookings/page.tsx)
// — kept as a local copy rather than a shared import since the two pages'
// status vocab could reasonably diverge.
const STATUS_BADGE: Record<string, { label: string; variant: BadgeVariant }> = {
  Draft:           { label: "Awaiting confirmation", variant: "pending"  },
  PendingApproval: { label: "Awaiting confirmation", variant: "pending"  },
  Offered:         { label: "Awaiting confirmation", variant: "pending"  },
  Assigned:        { label: "Upcoming",              variant: "upcoming" },
  Completed:       { label: "Completed",             variant: "active"   },
  Cancelled:       { label: "Cancelled",              variant: "expired"  },
  Expired:         { label: "Expired",                variant: "expired"  },
};

/** `bookingStartIso`/`bookingEndIso` are real UTC instants, so comparing
 *  them against `Date.now()` is correct regardless of which building's
 *  wall-clock time you're thinking in — no timezone conversion needed
 *  to answer "is this happening right now". An `Assigned` booking is
 *  "Upcoming" until its start, "Active" while in its window, and one
 *  the auto-complete sweeper hasn't yet flipped to `Completed` in the
 *  brief window right after its end still reads "Upcoming" (a rare,
 *  pre-existing edge case — this only adds the missing Active state,
 *  not a full status/timing overhaul). */
function isCurrentlyActive(b: Booking): boolean {
  if (b.status !== "Assigned") return false;
  const now = Date.now();
  return new Date(b.bookingStartIso).getTime() <= now && now < new Date(b.bookingEndIso).getTime();
}

function displayStatus(b: Booking): { label: string; variant: BadgeVariant } {
  // Issue Reported wins over Active/Cancelled alike — a still-Assigned
  // booking with an open spot-occupied dispute (hasOpenIssue) is just as
  // "reported" as one the dispute sweeper already auto-cancelled
  // (cancelledDueToIssue), it just hasn't resolved into a cancellation yet.
  if ((b.status === "Cancelled" && b.cancelledDueToIssue) || (b.status === "Assigned" && b.hasOpenIssue)) {
    return { label: "Issue Reported", variant: "expired" };
  }
  if (isCurrentlyActive(b)) return { label: "Active", variant: "active" };
  return STATUS_BADGE[b.status] ?? { label: b.status, variant: "active" as BadgeVariant };
}

// "Active"/"Upcoming" split an Assigned booking by whether it's
// currently in its window — a sentinel value ("ActiveNow") since
// neither is a raw DB status by itself.
const STATUS_OPTIONS = [
  { label: "All",                   value: "All" },
  { label: "Active",                value: "ActiveNow" },
  { label: "Awaiting confirmation", value: "Draft,PendingApproval,Offered" },
  { label: "Upcoming",              value: "Assigned" },
  { label: "Completed",             value: "Completed" },
  { label: "Cancelled",             value: "Cancelled" },
  { label: "Expired",               value: "Expired" },
];

function SkeletonRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "0 var(--spacing-24)", height: 52, borderBottom: "1px solid var(--color-stroke-medium)" }}>
      {[18, 14, 16, 16, 12, 14, 14, 12].map((flex, i) => (
        <div key={i} style={{ flex: `${flex} 1 0`, minWidth: 0, paddingLeft: i === 0 ? 0 : 16 }}>
          <div style={{ height: 14, width: "70%", borderRadius: 4, background: "var(--color-stroke-light)", animation: "pulse 1.5s infinite" }} />
        </div>
      ))}
    </div>
  );
}

const COLUMNS: [string, number][] = [
  ["Building", 18],
  ["Unit", 14],
  ["Resident", 16],
  ["Spot", 12],
  ["Start", 14],
  ["End", 14],
  ["Status", 12],
];

export default function SuperAdminBookingsPage() {
  const { selectedIds, isAll } = useBuildingFilter();
  const [statusFilter, setStatusFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const { data: buildingsData } = useQuery({
    queryKey: ["buildings", "list"],
    queryFn: () => listBuildings({ pageSize: 100 }),
  });
  const buildingNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of (buildingsData?.data ?? []) as Building[]) map.set(b.id, b.name);
    return map;
  }, [buildingsData]);

  // pageSize=500: the endpoint's documented "fetch everything for client-side
  // work" cap (see listBookings comment) — this page paginates/filters
  // client-side the same way (superadmin)/sync does for sync logs.
  const { data: bookingsData, isLoading, error } = useQuery({
    queryKey: ["bookings", "super-admin", "all"],
    queryFn: () => listBookings({ tab: "", pageSize: 500 }),
    staleTime: 30_000,
  });

  const allBookings: Booking[] = bookingsData?.data ?? [];
  const buildingFiltered = isAll ? allBookings : allBookings.filter((b) => selectedIds.includes(b.buildingId));
  const statusFiltered =
    statusFilter === "All"
      ? buildingFiltered
      : statusFilter === "ActiveNow"
        ? buildingFiltered.filter(isCurrentlyActive)
        : statusFilter === "Assigned"
          // "Upcoming" — Assigned but not yet started; a currently-active
          // one shows under "Active" instead, not both.
          ? buildingFiltered.filter((b) => b.status === "Assigned" && !isCurrentlyActive(b))
          : buildingFiltered.filter((b) => statusFilter.split(",").includes(b.status));

  const trimmedQuery = query.trim().toLowerCase();
  const searched = trimmedQuery === "" ? statusFiltered : statusFiltered.filter((b) => {
    const haystack = [
      b.residentName,
      b.guestName,
      b.spotOwnerName,
      b.unitNumber,
      b.spotNumber,
      buildingNameById.get(b.buildingId),
    ];
    return haystack.some((v) => v?.toLowerCase().includes(trimmedQuery));
  });

  // Most recent first — bookingStartIso is a real instant, safe to sort on
  // directly (see this session's timestamptz-comparison notes elsewhere).
  const sorted = [...searched].sort(
    (a, z) => new Date(z.bookingStartIso).getTime() - new Date(a.bookingStartIso).getTime()
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * ROWS_PER_PAGE;
  const displayed = sorted.slice(pageStart, pageStart + ROWS_PER_PAGE);

  return (
    <div style={{ padding: "var(--spacing-24)", display: "flex", flexDirection: "column", gap: "var(--spacing-24)", fontFamily: "var(--font-family-body)", height: "100%", overflow: "hidden", boxSizing: "border-box" }}>

      <div>
        <h1 style={{ margin: 0, fontSize: "var(--font-size-heading-1)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-heading-1)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-heading)" }}>
          Bookings
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: "var(--font-size-body)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" }}>
          Guest parking bookings across all buildings — use the building filter in the header to narrow the list.
        </p>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "var(--color-tag-expired)", color: "var(--color-tag-text-expired)", borderRadius: "var(--radius-8)", fontSize: "var(--font-size-tiny)" }}>
          {error instanceof Error ? error.message : "Failed to load bookings"}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-12)", flexWrap: "wrap" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "var(--color-fill-white)",
          border: "1px solid var(--color-stroke-medium)",
          borderRadius: "var(--radius-8)", padding: "0 10px", height: 40,
          flex: "1 0 240px", maxWidth: 480,
        }}>
          <IcSearch />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search by resident, guest, spot owner, unit, or spot"
            style={{
              border: "none", outline: "none", background: "transparent",
              fontSize: "var(--font-size-tiny)",
              color: "var(--color-text-strong)",
              fontFamily: "var(--font-family-body)",
              fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
              width: "100%",
            }}
          />
        </div>
        <FilterDropdown
          label="Status"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1); }}
        />
      </div>

      <div style={{ background: "var(--color-fill-white)", border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-12)", overflow: "hidden", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          <TableScroll minWidth={900}>
            <div style={{ display: "flex", alignItems: "center", padding: "0 var(--spacing-24)", minHeight: 48, borderBottom: "1px solid var(--color-stroke-medium)", background: "var(--color-fill-white)", position: "sticky", top: 0, zIndex: 2 }}>
              {COLUMNS.map(([label, flex]) => (
                <div key={label} style={{ flex: `${flex} 1 0`, minWidth: 0 }}>
                  <span style={{ lineHeight: "var(--line-height-uppercase)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", textTransform: "uppercase" as const, minWidth: 0, maxWidth: "100%", display: "block" }}>
                    <TableHeadLabel>{label}</TableHeadLabel>
                  </span>
                </div>
              ))}
            </div>

            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
            ) : displayed.length === 0 ? (
              <div style={{ padding: "48px 20px", textAlign: "left", color: "var(--color-text-weak)", fontSize: "var(--font-size-tiny)" }}>
                No bookings match the current filters.
              </div>
            ) : displayed.map((b, i) => {
              const badge = displayStatus(b);
              return (
                <div key={b.id} style={{ display: "flex", alignItems: "center", padding: "0 var(--spacing-24)", height: 52, borderBottom: i < displayed.length - 1 ? "1px solid var(--color-stroke-medium)" : "none" }}>
                  <div style={{ flex: "18 1 0", minWidth: 0 }}>
                    <CopyableCell value={buildingNameById.get(b.buildingId) ?? "—"}>
                      <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                        {buildingNameById.get(b.buildingId) ?? "—"}
                      </span>
                    </CopyableCell>
                  </div>
                  <div style={{ flex: "14 1 0", minWidth: 0, paddingLeft: 16 }}>
                    <CopyableCell value={b.unitNumber}>
                      <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{b.unitNumber}</span>
                    </CopyableCell>
                  </div>
                  <div style={{ flex: "16 1 0", minWidth: 0, paddingLeft: 16 }}>
                    <CopyableCell value={b.residentName}>
                      <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{b.residentName}</span>
                    </CopyableCell>
                  </div>
                  <div style={{ flex: "12 1 0", minWidth: 0, paddingLeft: 16 }}>
                    <CopyableCell value={b.spotNumber}>
                      {/* A null spotNumber isn't missing data — the request never made it to
                          an owner (still Draft/PendingApproval) when it was cancelled/expired,
                          so assignedSpotId was never set. Say so instead of rendering blank,
                          which reads as a loading glitch rather than "nothing to show". */}
                      <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", fontStyle: b.spotNumber ? undefined : "italic", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{b.spotNumber ?? "Never assigned"}</span>
                    </CopyableCell>
                  </div>
                  <div style={{ flex: "14 1 0", minWidth: 0, paddingLeft: 16 }}>
                    <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{b.bookingStart}</span>
                  </div>
                  <div style={{ flex: "14 1 0", minWidth: 0, paddingLeft: 16 }}>
                    <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{b.bookingEnd}</span>
                  </div>
                  <div style={{ flex: "12 1 0", minWidth: 0, paddingLeft: 16 }}>
                    <Badge as="span" variant={badge.variant}>{badge.label}</Badge>
                  </div>
                </div>
              );
            })}
          </TableScroll>
        </div>

        <div style={{ borderTop: "1px solid var(--color-stroke-medium)", padding: "var(--spacing-12) var(--spacing-24)" }}>
          <Pagination
            totalItems={sorted.length}
            pageSize={ROWS_PER_PAGE}
            currentPage={currentPage}
            onPageChange={setPage}
            itemLabel="bookings"
          />
        </div>
      </div>
    </div>
  );
}
