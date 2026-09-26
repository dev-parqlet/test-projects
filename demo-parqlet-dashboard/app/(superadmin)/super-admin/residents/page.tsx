"use client";

/**
 * Super-admin residents page — `/super-admin/residents`.
 *
 * Mirrors the HOA-resident layout (`app/(hoa)/parking/page.tsx`) but
 * adapted for the super-admin shell. The super-admin view:
 *   - Sees residents across all buildings (or one when filtered).
 *   - Includes revoked residents via `includeExcluded: true` so the
 *     "Restore access" flow is available.
 *   - Wires both `useRevokeResident` and `useRestoreResident`.
 *
 * Reuses the existing `ResidentRow` + `ActionsMenu` from (hoa)/parking.
 * The three-dot menu is the same `ActionsMenu`; the parent page is
 * responsible for choosing which handler to invoke (revoke vs restore)
 * based on `resident.excludedAt`.
 *
 * This page is intentionally a copy of the HOA layout for now. Once the
 * layout-specific concerns (super-admin filter, excluded-aware badges,
 * restore flow) stabilize, the shared row + confirm-modal bits can be
 * extracted to `app/components/residents/`.
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../../components/auth/auth-provider";
import { useBuildingFilter } from "../../../components/context/building-filter-context";
import { AdjustCreditsModal } from "../../../components/residents/AdjustCreditsModal";
import { fetchBuildings } from "../../../components/ui/BuildingFilterDropdown";
import { buildingKeys } from "../../../lib/api/buildings";
import { Pagination } from "../../../components/ui/Pagination";
import { FilterDropdown } from "../../../components/ui/FilterDropdown";
import { TableScroll } from "../../../components/ui/TableScroll";
import { TableHeadLabel } from "../../../components/ui/TableHeadLabel";
import {
  listResidents,
  residentKeys,
  useRevokeResident,
  useRestoreResident,
  type Resident,
} from "../../../lib/api/residents";
import { ResidentRow, NAME_COLUMN_WIDTH, PARKING_COLUMN_WIDTH } from "../../../(hoa)/parking/components/resident-row";
import { ResidentNoteModal } from "../../../(hoa)/parking/components/resident-note-modal";
import { IcSearch, IcSort } from "../../../(hoa)/parking/components/icons";
import { compareNamesIgnoringLeadingSymbols } from "../../../lib/sort-utils";
import "../../../tokens.css";

// ─── Debounce hook ────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// Column header flex widths MUST mirror the cell widths rendered by
// ResidentRow (see app/(hoa)/parking/components/resident-row.tsx).
// Keep in sync with app/(hoa)/parking/page.tsx#COLUMNS.
const COLUMNS: { label: string; flex: number | string }[] = [
  { label: "Unit #",           flex: 5  },
  { label: "Resident Name",    flex: NAME_COLUMN_WIDTH },
  { label: "Parking #",        flex: PARKING_COLUMN_WIDTH },
  { label: "Resident Email",   flex: 16 },
  { label: "Type",             flex: 7  },
  { label: "Lease Expiration", flex: 10 },
  { label: "Access",           flex: 7  },
  { label: "App Status",       flex: 10 },
  { label: "Last Invited",     flex: 10 },
  { label: "Notes",            flex: 6  },
  { label: "Actions",          flex: 6  },
];

const RESIDENCY_OPTIONS = ["All", "Owner", "Renter"];
const STATUS_OPTIONS    = ["All", "Registered", "Not registered"];
const ACCESS_OPTIONS    = ["All", "Active", "Revoked"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SuperAdminResidentsPage() {
  const { user } = useAuth();
  const { selectedIds, isAll } = useBuildingFilter();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [residencyFilter, setResidencyFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [accessFilter, setAccessFilter] = useState("All");
  const [revokeTarget, setRevokeTarget] = useState<Resident | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<Resident | null>(null);
  const [noteTarget, setNoteTarget] = useState<Resident | null>(null);
  const [toast, setToast] = useState<string>("");
  const [adjustOpen, setAdjustOpen] = useState(false);

  // Building NAMES for the credit modal. Same query key the top-bar
  // filter uses, so this reads from cache rather than firing a second
  // request — the header has already loaded it on every super-admin
  // page. The resident rows carry only `buildingId`.
  const { data: allBuildings = [] } = useQuery({
    queryKey: buildingKeys.list({ forFilter: true }),
    queryFn: fetchBuildings,
    staleTime: 5 * 60_000,
  });
  const buildingNameById = new Map(allBuildings.map((b) => [b.id, b.name]));

  // Building filter: super-admin can scope to one building or "all".
  // When isAll is true (default for the super-admin "All buildings" filter),
  // omit `buildingId` entirely so the backend disables the building scope
  // and returns residents across every building the user can see.
  // When the filter is set to a specific building that cannot be resolved
  // (neither selectedIds nor the user's buildingIds has a candidate), treat
  // the scope as unresolved and DO NOT fire the query — otherwise we'd
  // silently widen to "every building" while the UI claims a scope.
  const specificBuildingId = selectedIds[0] ?? user?.buildingIds?.[0];
  const buildingId = isAll ? "" : (specificBuildingId ?? "");

  const debouncedQuery = useDebounce(query, 300);

  const { data, isLoading, refetch } = useQuery({
    queryKey: residentKeys.list({
      buildingId,
      page,
      pageSize,
      search: debouncedQuery,
      status: statusFilter === "Registered" ? "Registered" : statusFilter === "Not registered" ? "Hasn't Registered" : undefined,
      residencyType: residencyFilter !== "All" ? (residencyFilter as "Owner" | "Renter") : undefined,
      access: accessFilter !== "All" ? (accessFilter as "Active" | "Revoked") : undefined,
      sortBy: sortCol === "Resident Name" ? "name" : sortCol === "Unit #" ? "unit" : undefined,
      sortDir,
      includeExcluded: true,
    }),
    queryFn: () => listResidents({
      buildingId,
      page,
      pageSize,
      search: debouncedQuery,
      status: statusFilter === "Registered" ? "Registered" : statusFilter === "Not registered" ? "Hasn't Registered" : undefined,
      residencyType: residencyFilter !== "All" ? (residencyFilter as "Owner" | "Renter") : undefined,
      access: accessFilter !== "All" ? (accessFilter as "Active" | "Revoked") : undefined,
      sortBy: sortCol === "Resident Name" ? "name" : sortCol === "Unit #" ? "unit" : undefined,
      sortDir,
      includeExcluded: true,
    }),
    enabled: isAll || !!specificBuildingId,
  });

  const rawResidents: Resident[] = data?.data ?? [];
  const totalResidents = data?.total ?? 0;

  // Frontend-only fix: re-sort the current page so leading punctuation in a
  // name ("Shawn", *Art) doesn't sort before real letters. Only applies
  // when sorting by name (including the unsorted default, which the
  // backend itself sorts by name) — a "Unit #" sort is left as returned.
  // Note: since this list is server-paginated, this can't move a resident
  // onto a *different* page — see sort-utils.ts.
  const residents = (sortCol === null || sortCol === "Resident Name")
    ? [...rawResidents].sort((a, b) =>
        sortDir === "desc"
          ? compareNamesIgnoringLeadingSymbols(b.name, a.name)
          : compareNamesIgnoringLeadingSymbols(a.name, b.name)
      )
    : rawResidents;

  const revokeResident = useRevokeResident();
  const restoreResident = useRestoreResident();

  function handleSort(label: string) {
    if (sortCol === label) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(label);
      setSortDir("asc");
    }
  }

  async function handleRevoke(resident: Resident) {
    try {
      await revokeResident.mutateAsync(resident.id);
      setToast(`Access revoked for ${resident.name}.`);
      void refetch();
    } catch {
      setToast("Failed to revoke access. Please try again.");
    } finally {
      setRevokeTarget(null);
      setTimeout(() => setToast(""), 4000);
    }
  }

  async function handleRestore(resident: Resident) {
    try {
      await restoreResident.mutateAsync(resident.id);
      setToast(`Access restored for ${resident.name}.`);
      void refetch();
    } catch {
      setToast("Failed to restore access. Please try again.");
    } finally {
      setRestoreTarget(null);
      setTimeout(() => setToast(""), 4000);
    }
  }

  return (
    <>
      <div style={{
        fontFamily: "var(--font-family-body)",
        padding: "var(--spacing-24)",
        display: "flex", flexDirection: "column",
        gap: "var(--spacing-24)",
        height: "100%",
        overflow: "hidden",
        boxSizing: "border-box" as React.CSSProperties["boxSizing"],
      }}>
        {/* Title row */}
        <div>
          <h1 style={{
            margin: 0,
            fontSize: "var(--font-size-heading-1)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            lineHeight: "var(--line-height-heading-1)",
            color: "var(--color-text-strong)",
            fontFamily: "var(--font-family-heading)",
          }}>
            Residents
          </h1>
          <p style={{
            margin: "var(--spacing-8) 0 0",
            fontSize: "var(--font-size-body)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            color: "var(--color-text-weak)",
            lineHeight: "var(--line-height-body)",
          }}>
            Manage resident access to the Parqlet app across all buildings.
          </p>
        </div>

        {/* Search */}
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
              placeholder="Search by unit, name, or email"
              style={{
                border: "none", outline: "none", background: "transparent",
                fontSize: "var(--font-size-tiny)",
                color: "var(--color-text-weak)",
                fontFamily: "var(--font-family-body)",
                fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                lineHeight: "var(--line-height-tiny)",
                width: "100%",
              }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-8)", flexShrink: 0 }}>
            <FilterDropdown
              label="Residency Type"
              options={RESIDENCY_OPTIONS}
              value={residencyFilter}
              onChange={(v) => { setResidencyFilter(v); setPage(1); }}
            />
            <FilterDropdown
              label="Status"
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
            />
            <FilterDropdown
              label="Access"
              options={ACCESS_OPTIONS}
              value={accessFilter}
              onChange={(v) => { setAccessFilter(v); setPage(1); }}
            />

          </div>

          {/* `marginLeft: auto` so it sits at the far right of the row
              while the filters stay put beside the search. It shares
              the filters row rather than taking one of its own, which
              is what left a band of empty space above the table.

              Super Admin only, and given the expired/danger tone
              because it is the one control here that changes what a
              building owes — a +10 across a building at $6.00/credit is
              $25 of gift card liability per resident. Both colours are
              theme tokens, so it holds up in dark mode. */}
          <button
            type="button"
            onClick={() => setAdjustOpen(true)}
            style={{
              marginLeft: "auto",
              flexShrink: 0,
              padding: "8px 16px",
              borderRadius: "var(--radius-8)",
              border: "1px solid var(--color-tag-text-expired)",
              background: "var(--color-tag-expired)",
              cursor: "pointer",
              fontSize: "var(--font-size-tiny)",
              fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
              fontFamily: "var(--font-family-body)",
              color: "var(--color-tag-text-expired)",
            }}>
            Edit credit balance
          </button>
        </div>

        {/* Table */}
        <div style={{
          background: "var(--color-fill-white)",
          borderRadius: "var(--radius-12)",
          border: "1px solid var(--color-stroke-medium)",
          display: "flex", flexDirection: "column",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}>
          <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
            <TableScroll minWidth={1500}>
              {/* Header */}
              <div style={{
                display: "flex", alignItems: "center",
                paddingLeft: "var(--spacing-24)", paddingRight: "var(--spacing-24)",
                minHeight: 48,
                borderBottom: "1px solid var(--color-stroke-medium)",
                position: "sticky", top: 0,
                background: "var(--color-fill-white)",
                zIndex: 1,
              }}>
                {/* 32px spacer mirrors the checkbox column that ResidentRow renders. */}
                <div style={{ width: 32, flexShrink: 0 }} />
                {COLUMNS.map((col) => {
                  const sortable = col.label === "Resident Name" || col.label === "Unit #";
                  if (!sortable) {
                    return (
                      <div key={col.label}
                           style={{
                             flex: typeof col.flex === "number" ? `${col.flex} 1 0` : col.flex,
                             minWidth: 0,
                             maxWidth: "100%",
                             display: "flex", alignItems: "center",
                             justifyContent: col.label === "Actions" ? "flex-end" : "flex-start",
                             fontSize: "var(--font-size-extra-tiny)",
                             fontFamily: "var(--font-family-body)",
                             fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                             color: "var(--color-text-weak)",
                             lineHeight: "var(--line-height-extra-tiny)",
                             letterSpacing: "0.04em",
                             textTransform: "uppercase" as const,
                             userSelect: "none",
                           }}>
                        <TableHeadLabel>{col.label}</TableHeadLabel>
                      </div>
                    );
                  }
                  return (
                    <button
                      key={col.label}
                      type="button"
                      onClick={() => handleSort(col.label)}
                      style={{
                        flex: typeof col.flex === "number" ? `${col.flex} 1 0` : col.flex,
                        minWidth: 0,
                        maxWidth: "100%",
                        display: "flex", alignItems: "center", gap: 4,
                        fontSize: "var(--font-size-extra-tiny)",
                        fontFamily: "var(--font-family-body)",
                        fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                        color: "var(--color-text-weak)",
                        lineHeight: "var(--line-height-extra-tiny)",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase" as const,
                        cursor: "pointer",
                        userSelect: "none",
                        background: "none",
                        border: "none",
                        padding: 0,
                        textAlign: "left",
                      }}>
                      <TableHeadLabel>{col.label}</TableHeadLabel>
                      <IcSort
                        active={sortCol === col.label}
                        dir={sortCol === col.label ? sortDir : "asc"}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Rows */}
              {isLoading ? (
                <div style={{
                  padding: "var(--spacing-64) var(--spacing-24)",
                  textAlign: "left",
                  color: "var(--color-text-weaker)",
                  fontSize: "var(--font-size-tiny)",
                }}>Loading residents…</div>
              ) : residents.length === 0 ? (
                <div style={{
                  padding: "var(--spacing-64) var(--spacing-24)",
                  textAlign: "left",
                  color: "var(--color-text-weaker)",
                  fontSize: "var(--font-size-tiny)",
                }}>No residents found.</div>
              ) : (
                residents.map((resident, idx) => (
                  <ResidentRow
                    key={resident.id}
                    resident={resident}
                    isLast={idx === residents.length - 1}
                    bulkInvited={false}
                    bulkInvitedDate=""
                    checked={false}
                    onToggle={() => { /* not used on super-admin */ }}
                    onOpenNote={() => setNoteTarget(resident)}
                    onSendInvite={() => { /* not used on super-admin */ }}
                    onRevokeAccess={() => {
                      if (resident.excludedAt) {
                        setRestoreTarget(resident);
                      } else {
                        setRevokeTarget(resident);
                      }
                    }}
                    isRevoked={!!resident.excludedAt}
                  />
                ))
              )}
            </TableScroll>
          </div>

          <Pagination
            totalItems={totalResidents}
            pageSize={pageSize}
            currentPage={page}
            onPageChange={setPage}
            itemLabel="residents"
            pageSizeOptions={[10, 20, 50, 100]}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          />
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: "var(--spacing-32)",
          left: "50%",
          transform: "translateX(-50%)",
          background: "var(--color-fill-strong)",
          color: "var(--color-text-white)",
          fontFamily: "var(--font-family-body)",
          fontSize: "var(--font-size-tiny)",
          fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
          lineHeight: "var(--line-height-tiny)",
          padding: "var(--spacing-12) var(--spacing-24)",
          borderRadius: "var(--radius-12)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
          zIndex: 3000,
          whiteSpace: "nowrap",
        }}>{toast}</div>
      )}

      {/* Revoke access confirm modal */}
      {noteTarget && (
        <ResidentNoteModal
          resident={noteTarget}
          onClose={() => setNoteTarget(null)}
        />
      )}

      {adjustOpen && (
        <AdjustCreditsModal
          residents={residents.map((r) => ({
            id: r.id,
            name: r.name,
            email: r.email,
            unitNumber: r.unitNumber,
            creditBalance: r.creditBalance,
            buildingName: buildingNameById.get(r.buildingId),
          }))}
          // Building-wide is offered only when the top-bar filter is on a
          // single building; `buildingId` is "" for "all buildings".
          building={
            buildingId
              ? { id: buildingId, name: buildingNameById.get(buildingId) ?? "this building" }
              : null
          }
          onClose={() => setAdjustOpen(false)}
          onDone={(message) => {
            setToast(message);
            refetch();
          }}
        />
      )}

      {revokeTarget && (
        <ConfirmModal
          title={`Revoke access for ${revokeTarget.name}?`}
          body="They'll no longer be able to share their own parking spot, but can still log in, book a neighbor's spot, pay, and use their credits as normal. This action can be reversed later from this page."
          confirmLabel={revokeResident.isPending ? "Revoking…" : "Revoke access"}
          confirmDisabled={revokeResident.isPending}
          onConfirm={() => handleRevoke(revokeTarget)}
          onCancel={() => setRevokeTarget(null)}
        />
      )}

      {/* Restore access confirm modal */}
      {restoreTarget && (
        <ConfirmModal
          title={`Restore access for ${restoreTarget.name}?`}
          body="This will re-enable their access to the Parqlet app."
          confirmLabel={restoreResident.isPending ? "Restoring…" : "Restore access"}
          confirmDisabled={restoreResident.isPending}
          confirmTone="accent"
          onConfirm={() => handleRestore(restoreTarget)}
          onCancel={() => setRestoreTarget(null)}
        />
      )}
    </>
  );
}

// ─── Inline confirm modal (copy of the (hoa)/parking pattern) ─────────────────

function ConfirmModal({
  title,
  body,
  confirmLabel,
  confirmDisabled,
  confirmTone = "error",
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  confirmDisabled?: boolean;
  confirmTone?: "error" | "accent";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmBg = confirmTone === "error" ? "var(--color-fill-error)" : "var(--color-fill-accent)";
  const confirmHoverBg = confirmTone === "error" ? "var(--color-red-1000)" : "var(--color-accent-1200)";
  // "accent" branch sits on the fixed brand green — keep it dark; doesn't invert in dark mode.
  const confirmColor = confirmTone === "error" ? "var(--color-text-white)" : "#222222";

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "var(--spacing-24)",
      }}>
      <div style={{
        background: "var(--color-fill-white)",
        borderRadius: "var(--radius-12)",
        padding: "var(--spacing-32)",
        width: 400,
        boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
        display: "flex", flexDirection: "column", gap: "var(--spacing-24)",
        fontFamily: "var(--font-family-body)",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
          <p style={{
            margin: 0,
            fontSize: "var(--font-size-tiny)",
            fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
            lineHeight: "var(--line-height-tiny)",
            color: "var(--color-text-strong)",
          }}>{title}</p>
          <p style={{
            margin: 0,
            fontSize: "var(--font-size-extra-tiny)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            lineHeight: "var(--line-height-extra-tiny)",
            color: "var(--color-text-weak)",
          }}>{body}</p>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--spacing-8)" }}>
          <button
            onClick={onCancel}
            disabled={confirmDisabled}
            style={{
              height: 36, padding: "0 var(--spacing-20)",
              background: "var(--color-fill-white)",
              border: "1px solid var(--color-stroke-medium)",
              borderRadius: "var(--radius-8)", cursor: "pointer",
              fontFamily: "var(--font-family-body)",
              fontSize: "var(--font-size-tiny)",
              fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
              lineHeight: "var(--line-height-tiny)",
              color: "var(--color-text-strong)",
            }}
          >Cancel</button>
          <button
            onClick={onConfirm}
            disabled={confirmDisabled}
            style={{
              height: 36, padding: "0 var(--spacing-20)",
              background: confirmBg,
              border: "none",
              borderRadius: "var(--radius-8)",
              cursor: confirmDisabled ? "default" : "pointer",
              opacity: confirmDisabled ? 0.6 : 1,
              fontFamily: "var(--font-family-body)",
              fontSize: "var(--font-size-tiny)",
              fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
              lineHeight: "var(--line-height-tiny)",
              color: confirmColor,
            }}
            onMouseEnter={(e) => { if (!confirmDisabled) e.currentTarget.style.background = confirmHoverBg; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = confirmBg; }}
          >{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
