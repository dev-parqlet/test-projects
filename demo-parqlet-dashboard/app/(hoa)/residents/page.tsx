"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../components/auth/auth-provider";
import { useAutoInvite } from "../../components/auto-invite-context";
import { useBuildingFilter } from "../../components/context/building-filter-context";
import { FilterDropdown } from "../../components/ui/FilterDropdown";
import { TextButton } from "../../components/text-button";
import { IcCheck } from "../../components/icons/IcCheck";
import { Pagination } from "../../components/ui/Pagination";
import { listResidents, residentKeys, useInviteResident, useInviteAllResidents, useRevokeResident, useRestoreResident } from "@/lib/api/residents";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import "../../tokens.css";

import { IcSort, IcSearch, Checkbox } from "./components/icons";
import { PhoneWithTooltip } from "./components/phone-tooltip";
import { ResidentRow, NAME_COLUMN_WIDTH, PARKING_COLUMN_WIDTH } from "./components/resident-row";
import { ConfirmModal } from "./components/confirm-modal";
import { ResidentNoteModal } from "./components/resident-note-modal";
import type { ResidencyType, ParqletStatus, InviteState, Resident } from "./components/types";
import { compareNamesIgnoringLeadingSymbols } from "@/lib/sort-utils";

// ─── Debounce hook ───────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// Re-exported from ./components/types for backward compatibility

// ─── Column defs ──────────────────────────────────────────────────────────────

// Column header flex widths MUST mirror the cell widths rendered by
// ResidentRow (see app/(hoa)/residents/components/resident-row.tsx).
// Keep in sync with app/(superadmin)/super-admin/residents/page.tsx#COLUMNS.
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

// ─── Filter options ────────────────────────────────────────────────────────────

const RESIDENCY_OPTIONS   = ["All", "Owner", "Renter"];
const STATUS_OPTIONS      = ["All", "Registered", "Not registered"];
const ACCESS_OPTIONS      = ["All", "Active", "Revoked"];

// ─── Send Invite tooltip (shown when auto-invite is on) ───────────────────────

function SendInviteTooltip() {
  const [visible, setVisible] = useState(false);
  return (
    <div
      style={{ position: "absolute", inset: 0, cursor: "default" }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {visible && (
        <div style={{
          position:     "absolute",
          bottom:       "calc(100% + 6px)",
          left:         "50%",
          transform:    "translateX(-50%)",
          whiteSpace:   "nowrap",
          background:   "var(--color-fill-strong)",
          color:        "var(--color-text-white)",
          fontSize:     "var(--font-size-extra-tiny)",
          fontWeight:   "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
          lineHeight:   "var(--line-height-extra-tiny)",
          fontFamily:   "var(--font-family-body)",
          padding:      "6px 10px",
          borderRadius: "var(--radius-8)",
          pointerEvents: "none",
          zIndex:       100,
        }}>
          Auto-invite is on. Manage this in Resident Management settings.
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ParkingLotsPage() {
  const { autoInviteOn } = useAutoInvite();
  const { user } = useAuth();
  const { selectedIds, isAll } = useBuildingFilter();
  const [query,           setQuery]           = useState("");
  const [page,            setPage]            = useState(1);
  const [minRows,         setMinRows]         = useState(10);
  const [residencyFilter, setResidencyFilter] = useState("All");
  const [statusFilter,    setStatusFilter]    = useState("All");
  const [accessFilter,    setAccessFilter]    = useState("All");
  const [showToast,       setShowToast]       = useState(false);
  const [bulkInvited,     setBulkInvited]     = useState(false);
  const [bulkInvitedDate, setBulkInvitedDate] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [checkedIds,      setCheckedIds]       = useState<Set<string>>(new Set());
  const [showInviteModal, setShowInviteModal]  = useState(false);
  const [inviteToast,     setInviteToast]      = useState("");
  const [activeNoteId,    setActiveNoteId]     = useState<string | null>(null);
  const [revokeTarget,    setRevokeTarget]     = useState<Resident | null>(null);
  const [restoreTarget,   setRestoreTarget]    = useState<Resident | null>(null);
  const [autoInviteDate,  setAutoInviteDate]  = useState("");

  useEffect(() => {
    if (autoInviteOn) {
      setAutoInviteDate(new Date().toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" }));
    }
  }, [autoInviteOn]);
  const [sortCol,         setSortCol]         = useState<string | null>(null);
  const [sortDir,         setSortDir]         = useState<"asc" | "desc">("asc");
  const tableCardRef = useRef<HTMLDivElement>(null);

  // Building ID: use first selected filter, or the user's own buildingId as fallback.
  // "default" is a last-resort that never matches real buildings — signals a misconfiguration.
  const buildingId = selectedIds[0] ?? user?.buildingIds?.[0] ?? "default";

  // Debounce search query to avoid excessive API calls
  const debouncedQuery = useDebounce(query, 300);

  // Fetch residents via TanStack Query
  const { data: apiData, isLoading, error, refetch } = useQuery({
    queryKey: residentKeys.list({
      buildingId,
      page,
      pageSize: minRows,
      search: debouncedQuery,
      status: statusFilter === "Registered" ? "Registered" : statusFilter === "Not registered" ? "Hasn't Registered" : undefined,
      residencyType: residencyFilter !== "All" ? (residencyFilter as "Owner" | "Renter") : undefined,
      access: accessFilter !== "All" ? (accessFilter as "Active" | "Revoked") : undefined,
      sortBy: sortCol === "Resident Name" ? "name" : sortCol === "Unit #" ? "unit" : undefined,
      sortDir,
      // Match the super-admin page contract: surface revoked residents so
      // the red "Revoked" badge + Restore action work on HOA too.
      // (The uninvited-count sub-query below intentionally does NOT pass
      // this — revoked residents shouldn't count toward "not yet invited".)
      includeExcluded: true,
    }),
    queryFn: () => listResidents({
      buildingId,
      page,
      pageSize: minRows,
      search: debouncedQuery,
      status: statusFilter === "Registered" ? "Registered" : statusFilter === "Not registered" ? "Hasn't Registered" : undefined,
      residencyType: residencyFilter !== "All" ? (residencyFilter as "Owner" | "Renter") : undefined,
      access: accessFilter !== "All" ? (accessFilter as "Active" | "Revoked") : undefined,
      sortBy: sortCol === "Resident Name" ? "name" : sortCol === "Unit #" ? "unit" : undefined,
      sortDir,
      includeExcluded: true,
    }),
  });

  // Building-wide count of unregistered residents — used for the "Invite
  // all" badge and gate. Driven by a dedicated lightweight query so the
  // number reflects the whole building, not just the current page.
  const { data: unregisteredCountData } = useQuery({
    queryKey: residentKeys.list({
      buildingId,
      status: "Hasn't Registered",
      pageSize: 1,
      page: 1,
    }),
    queryFn: () => listResidents({
      buildingId,
      status: "Hasn't Registered",
      pageSize: 1,
      page: 1,
    }),
    enabled: !!buildingId,
  });
  const uninvitedCount = unregisteredCountData?.total ?? 0;

  // Invite mutations — bulk ("invite all not yet registered") and single
  // (per-row, or per-row loop for the selected-rows case).
  const inviteResident = useInviteResident();
  const inviteAllResidents = useInviteAllResidents();
  const revokeResident = useRevokeResident();
  const restoreResident = useRestoreResident();

  // Residents — already transformed to camelCase + correct types by useResidents()
  const rawResidents: Resident[] = apiData?.data ?? [];
  const totalResidents = apiData?.total ?? 0;

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

  // Selection is scoped to a single page — when page / status / residency /
  // search changes, any IDs that were checked on the previous page would
  // otherwise be silently dropped from the invite loop (since `residents`
  // is now only the current server page). Clear the set explicitly so the
  // user sees the checkbox state reset, rather than an invite that omits
  // rows they thought they had selected.
  useEffect(() => {
    setCheckedIds(new Set());
  }, [page, statusFilter, residencyFilter, accessFilter, debouncedQuery]);

  function handleSort(label: string) {
    if (sortCol === label) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(label);
      setSortDir("asc");
    }
  }

  // Revoke access — fires the POST /api/residents/:id/exclude mutation.
  // Modeled on app/(hoa)/access/page.tsx:184-194 (team-member revoke).
  // On success the row stays in the list with the red "Revoked"
  // badge (includeExcluded=true on the main query).
  async function handleRevoke(resident: Resident) {
    try {
      await revokeResident.mutateAsync(resident.id);
      setInviteToast(`Access revoked for ${resident.name}.`);
      void refetch();
    } catch {
      setInviteToast("Failed to revoke access. Please try again.");
    } finally {
      setRevokeTarget(null);
      setTimeout(() => setInviteToast(""), 4000);
    }
  }

  // Restore access — fires the DELETE /api/residents/:id/exclude mutation.
  // Mirrors handleRevoke; clears `excludedAt` so the row drops the badge
  // and the menu flips back to "Revoke access".
  async function handleRestore(resident: Resident) {
    try {
      await restoreResident.mutateAsync(resident.id);
      setInviteToast(`Access restored for ${resident.name}.`);
      void refetch();
    } catch {
      setInviteToast("Failed to restore access. Please try again.");
    } finally {
      setRestoreTarget(null);
      setTimeout(() => setInviteToast(""), 4000);
    }
  }

  const rowsPerPage = minRows;

  const displayed = residents;

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

        {/* ── Title row ──────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "var(--spacing-16)" }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: "var(--font-size-heading-1)",
              fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
              lineHeight: "var(--line-height-heading-1)",
              color: "var(--color-text-strong)",
              fontFamily: "var(--font-family-heading)",
            }}>
              Resident Directory
            </h1>
            <p style={{
              margin: "var(--spacing-8) 0 0",
              fontSize: "var(--font-size-body)",
              fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
              color: "var(--color-text-weak)",
              lineHeight: "var(--line-height-body)",
            }}>
              View your resident directory and manage their invites to the Parqlet mobile app
            </p>
          </div>
          {autoInviteOn ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "var(--spacing-4)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-8)" }}>
                <span style={{
                  fontSize:   "var(--font-size-body)",
                  color:      "var(--color-text-strong)",
                  fontFamily: "var(--font-family-body)",
                  fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                  lineHeight: "var(--line-height-body)",
                  whiteSpace: "nowrap",
                }}>
                  Auto-invite is on
                </span>
                <IcCheck size={20} color="var(--color-icon-weak)" />
              </div>
              <span style={{
                fontSize:   "var(--font-size-extra-tiny)",
                color:      "var(--color-text-weaker)",
                fontFamily: "var(--font-family-body)",
                fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                lineHeight: "var(--line-height-extra-tiny)",
                whiteSpace: "nowrap",
              }}>
                Last invite was sent on {autoInviteDate}
              </span>
            </div>
          ) : (
            <div style={{ position: "relative", flexShrink: 0 }}>
              <button
                disabled={bulkInvited}
                onClick={() => { if (!bulkInvited) setShowConfirmModal(true); }}
                style={{
                  height:       40,
                  padding:      "0 var(--spacing-20)",
                  background:   bulkInvited ? "var(--color-fill-weak)" : "var(--color-fill-accent)",
                  border:       "none",
                  borderRadius: "var(--radius-8)",
                  cursor:       bulkInvited ? "default" : "pointer",
                  fontFamily:   "var(--font-family-body)",
                  fontSize:     "var(--font-size-tiny)",
                  fontWeight:   "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                  lineHeight:   "var(--line-height-tiny)",
                  // Non-disabled branch sits on the fixed brand green — keep it dark; doesn't invert in dark mode.
                  color:        bulkInvited ? "var(--color-text-disabled)" : "#222222",
                  whiteSpace:   "nowrap",
                  display:      "flex",
                  alignItems:   "center",
                  gap:          "var(--spacing-8)",
                  transition:   "background 0.12s",
                }}
                onMouseEnter={(e) => {
                  if (!bulkInvited) e.currentTarget.style.background = "var(--color-accent-1200)";
                }}
                onMouseLeave={(e) => {
                  if (!bulkInvited) e.currentTarget.style.background = "var(--color-fill-accent)";
                }}
              >
                Invite all not yet registered
                {!bulkInvited && (
                  <span style={{
                    display:        "inline-flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    minWidth:       20,
                    height:         20,
                    borderRadius:   "var(--radius-pill)",
                    background:     "var(--color-accent-1200)",
                    fontSize:       "var(--font-size-extra-tiny)",
                    fontWeight:     "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                    lineHeight:     1,
                    // Fixed brand color, doesn't invert in dark mode — keep text dark.
                    color:          "#222222",
                    padding:        "0 5px",
                  }}>
                    {uninvitedCount}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── Search + Filters ───────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--spacing-12)", flexWrap: "wrap" }}>
          {/* Search */}
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
              placeholder="Search by resident's unit #, parking spot or name"
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

          {/* Filters */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-8)", flexShrink: 0 }}>
            {checkedIds.size > 0 && (
              <TextButton onClick={() => setShowInviteModal(true)}>
                Invite to Parqlet
              </TextButton>
            )}
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
        </div>

        {/* ── Table ──────────────────────────────────────────────────────────── */}
        <div ref={tableCardRef} style={{
          background: "var(--color-fill-white)",
          borderRadius: "var(--radius-12)",
          border: "1px solid var(--color-stroke-medium)",
          display: "flex", flexDirection: "column",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}>
          {/* Scrollable header + rows */}
          <div style={{ flex: 1, overflowX: "auto", overflowY: "auto", minHeight: 0 }}>
            <div style={{ minWidth: 1500, width: "100%" }}>

              {/* Table header — sticky */}
              <div style={{
                display: "flex", alignItems: "center",
                paddingLeft: "var(--spacing-24)", paddingRight: "var(--spacing-24)",
                minHeight: 48,
                borderBottom: "1px solid var(--color-stroke-medium)",
                background: "var(--color-fill-white)",
                position: "sticky", top: 0, zIndex: 2,
              }}>
                {/* Select-all checkbox */}
                <div style={{ width: 32, flexShrink: 0, display: "flex", alignItems: "center" }}>
                  <Checkbox
                    checked={displayed.length > 0 && displayed.every(r => checkedIds.has(r.id))}
                    indeterminate={displayed.some(r => checkedIds.has(r.id)) && !displayed.every(r => checkedIds.has(r.id))}
                    onChange={() => {
                      const allChecked = displayed.every(r => checkedIds.has(r.id));
                      setCheckedIds(prev => {
                        const next = new Set(prev);
                        if (allChecked) displayed.forEach(r => next.delete(r.id));
                        else displayed.forEach(r => next.add(r.id));
                        return next;
                      });
                    }}
                  />
                </div>
                {COLUMNS.map((col) => (
                  <div key={col.label} style={{ flex: typeof col.flex === "number" ? `${col.flex} 1 0` : col.flex, minWidth: 0, display: "flex", justifyContent: col.label === "Actions" ? "flex-end" : "flex-start" }}>
                    <button
                      onClick={() => handleSort(col.label)}
                      style={{
                        display:       "inline-flex",
                        alignItems:    "center",
                        gap:           "var(--spacing-4)",
                        background:    "none",
                        border:        "none",
                        padding:       0,
                        cursor:        "pointer",
                        fontSize:      "var(--font-size-uppercase)",
                        lineHeight:    "var(--line-height-uppercase)",
                        fontWeight:    "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                        color:         "var(--color-text-weak)",
                        fontFamily:    "var(--font-family-body)",
                        textTransform: "uppercase" as const,
                      }}
                    >
                      {col.label}
                      <IcSort active={sortCol === col.label} dir={sortDir} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Table rows */}
              {isLoading ? (
                // Loading skeleton — 5 placeholder rows
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center",
                    paddingLeft: "var(--spacing-24)", paddingRight: "var(--spacing-24)",
                    height: 57,
                    borderBottom: i === 4 ? "none" : "1px solid var(--color-stroke-medium)",
                  }}>
                    {[14, 7, 8, 20, 12, 13, 14, 10].map((flex, j) => (
                      <div key={j} style={{ flex: `${flex} 1 0`, minWidth: 0 }}>
                        <div style={{
                          height: 12,
                          borderRadius: "var(--radius-4)",
                          background: "var(--color-fill-weak)",
                          width: `${60 + (j * 17 + i * 7) % 35}%`,
                        }} />
                      </div>
                    ))}
                  </div>
                ))
              ) : error ? (
                // Error state
                <div style={{
                  padding: "var(--spacing-64) var(--spacing-24)",
                  textAlign: "left",
                  color: "var(--color-text-weaker)",
                  fontSize: "var(--font-size-tiny)",
                  fontFamily: "var(--font-family-body)",
                }}>
                  <div style={{ marginBottom: "var(--spacing-8)", color: "var(--color-text-weak)" }}>
                    Failed to load residents. Please try again.
                  </div>
                  <button
                    onClick={() => refetch()}
                    style={{
                      background: "none",
                      border: "1px solid var(--color-stroke-medium)",
                      borderRadius: "var(--radius-8)",
                      padding: "var(--spacing-4) var(--spacing-16)",
                      cursor: "pointer",
                      fontSize: "var(--font-size-tiny)",
                      color: "var(--color-text-weak)",
                      fontFamily: "var(--font-family-body)",
                    }}
                  >
                    Retry
                  </button>
                </div>
              ) : displayed.length > 0 ? (
                displayed.map((resident, i) => (
                  <ResidentRow
                    key={resident.id}
                    resident={resident}
                    isLast={i === displayed.length - 1}
                    bulkInvited={bulkInvited}
                    bulkInvitedDate={bulkInvitedDate}
                    checked={checkedIds.has(resident.id)}
                    onToggle={() => setCheckedIds(prev => {
                      const next = new Set(prev);
                      next.has(resident.id) ? next.delete(resident.id) : next.add(resident.id);
                      return next;
                    })}
                    onOpenNote={() => setActiveNoteId(resident.id)}
                    onSendInvite={() => {
                      inviteResident.mutate(
                        { buildingId, email: resident.email },
                        {
                          onSuccess: (result) => {
                            // The backend can return HTTP 200 with
                            // `{ success: true, sent: false }` for auto-invite
                            // being disabled or an email-delivery failure. Treat
                            // sent:false as a warning, not a clean success.
                            if (result?.reason === "auto_invite_disabled") {
                              setInviteToast("Auto-invite is disabled for this building.");
                            } else if (result?.sent === false) {
                              setInviteToast(
                                `Invite queued for ${resident.name}, but email delivery failed.`
                              );
                            } else {
                              setInviteToast(`Invite sent to ${resident.name}.`);
                            }
                            setTimeout(() => setInviteToast(""), 4000);
                          },
                          onError: () => {
                            setInviteToast("Failed to send invite. Please try again.");
                            setTimeout(() => setInviteToast(""), 4000);
                          },
                        }
                      );
                    }}
                    onRevokeAccess={() => resident.excludedAt ? setRestoreTarget(resident) : setRevokeTarget(resident)}
                    isRevoked={!!resident.excludedAt}
                  />
                ))
              ) : (
                <div style={{
                  padding: "var(--spacing-64) var(--spacing-24)",
                  textAlign: "left",
                  color: "var(--color-text-weaker)",
                  fontSize: "var(--font-size-tiny)",
                }}>
                  No residents found.
                </div>
              )}

            </div>
          </div>

          <Pagination
            totalItems={totalResidents}
            pageSize={rowsPerPage}
            currentPage={page}
            onPageChange={setPage}
            itemLabel="residents"
            pageSizeOptions={[10, 20, 50, 100]}
            onPageSizeChange={(size) => { setMinRows(size); setPage(1); }}
          />
        </div>

      </div>

      {/* Toast */}
      {showToast && (
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
        }}>
          {bulkInvited ? `Invites sent to ${uninvitedCount} residents.` : "Invites were sent to selected residents."}
        </div>
      )}

      {/* Confirm invite-all modal */}
      {showConfirmModal && (
        <ConfirmModal
          count={uninvitedCount}
          onConfirm={() => {
            const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            setShowConfirmModal(false);
            if (uninvitedCount === 0) {
              setShowToast(true);
              setTimeout(() => setShowToast(false), 4000);
              return;
            }
            // Bulk — backend applies renter-first targeting per unit and
            // returns { success, sent, failed, reason? }. We just toast
            // the aggregate result.
            inviteAllResidents.mutate(
              { buildingId },
              {
                onSuccess: (result) => {
                  setBulkInvited(true);
                  setBulkInvitedDate(today);
                  const sent = result?.sent ?? 0;
                  const failed = result?.failed ?? 0;
                  if (result?.reason === "auto_invite_disabled") {
                    setInviteToast("Auto-invite is disabled for this building.");
                  } else if (failed > 0) {
                    setInviteToast(`Invites sent to ${sent} residents (${failed} failed).`);
                  } else {
                    setInviteToast(`Invites sent to ${sent} residents.`);
                  }
                  setTimeout(() => setInviteToast(""), 4000);
                },
                onError: () => {
                  setInviteToast("Failed to send invites. Please try again.");
                  setTimeout(() => setInviteToast(""), 4000);
                },
              }
            );
          }}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}

      {/* Invite selected residents modal */}
      {showInviteModal && (() => {
        const selectedResidents = residents.filter(r => checkedIds.has(r.id));
        const count = selectedResidents.length;
        const label = count === 1
          ? `"${selectedResidents[0].name}"`
          : `${count} residents`;
        return (
          <div
            onClick={(e) => { if (e.target === e.currentTarget) setShowInviteModal(false); }}
            style={{
              position: "fixed", inset: 0, zIndex: 1000,
              background: "rgba(0,0,0,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "var(--spacing-24)",
            }}
          >
            <div style={{
              background: "var(--color-fill-white)",
              borderRadius: "var(--radius-12)",
              padding: "var(--spacing-32)",
              maxWidth: 400, width: "90%",
              boxSizing: "border-box" as React.CSSProperties["boxSizing"],
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
                }}>
                  Are you sure you want to invite {label} to Parqlet app?
                </p>
                <p style={{
                  margin: 0,
                  fontSize: "var(--font-size-extra-tiny)",
                  fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                  lineHeight: "var(--line-height-extra-tiny)",
                  color: "var(--color-text-weak)",
                }}>
                  A Parqlet invitation email will be sent to the selected {count === 1 ? "resident" : "residents"}.
                </p>
              </div>
              <div style={{ display: "flex", gap: "var(--spacing-8)", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowInviteModal(false)}
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
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-fill-weak)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-fill-white)"; }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setCheckedIds(new Set());
                    // Per-row loop — POST /api/residents/invite with
                    // {buildingId, email} for each selected resident. Small N
                    // (typically <20), so the N+1 cost is acceptable.
                    Promise.allSettled(
                      selectedResidents.map((r) =>
                        inviteResident.mutateAsync({ buildingId, email: r.email })
                      )
                    ).then((results) => {
                      // A fulfilled but sent:false response is a delivery
                      // failure even though the HTTP request succeeded — count
                      // it as failed so the toast doesn't claim success.
                      let sent = 0;
                      let failed = 0;
                      let autoInviteDisabled = false;
                      for (const r of results) {
                        if (r.status === "rejected") {
                          failed += 1;
                          continue;
                        }
                        const value = r.value as { sent?: boolean; reason?: string } | undefined;
                        if (value?.reason === "auto_invite_disabled") {
                          autoInviteDisabled = true;
                          failed += 1;
                        } else if (value?.sent === true) {
                          sent += 1;
                        } else {
                          failed += 1;
                        }
                      }
                      if (autoInviteDisabled) {
                        setInviteToast("Auto-invite is disabled for this building.");
                      } else if (failed > 0 && sent === 0) {
                        // Every attempt failed — surface it instead of claiming success.
                        setInviteToast(
                          count === 1
                            ? `Failed to send invite to ${selectedResidents[0].name}.`
                            : "Failed to send invites. Please try again."
                        );
                      } else if (count === 1) {
                        setInviteToast(`Invite sent to ${selectedResidents[0].name}.`);
                      } else if (failed > 0) {
                        setInviteToast(`Invites sent to ${sent} of ${count} residents.`);
                      } else {
                        setInviteToast(`Invites sent to ${count} residents.`);
                      }
                      setTimeout(() => setInviteToast(""), 4000);
                    });
                  }}
                  style={{
                    height: 36, padding: "0 var(--spacing-20)",
                    background: "var(--color-fill-accent)",
                    border: "none",
                    borderRadius: "var(--radius-8)", cursor: "pointer",
                    fontFamily: "var(--font-family-body)",
                    fontSize: "var(--font-size-tiny)",
                    fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                    lineHeight: "var(--line-height-tiny)",
                    // Fixed brand color, doesn't invert in dark mode — keep text dark.
                    color: "#222222",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-accent-1200)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-fill-accent)"; }}
                >
                  Yes, send invite
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Revoke access confirmation modal.
          Uses the Base UI dialog primitives for a11y: role="dialog", aria-modal,
          focus trap, initial focus, return focus, Escape to close,
          body scroll lock, and portal rendering. */}
      {revokeTarget && (
        <DialogPrimitive.Root
          open={!!revokeTarget}
          onOpenChange={(open) => { if (!open) setRevokeTarget(null); }}
        >
          <DialogPrimitive.Portal>
            <DialogPrimitive.Backdrop
              onClick={() => setRevokeTarget(null)}
              style={{
                position: "fixed", inset: 0, zIndex: 1000,
                background: "rgba(0,0,0,0.35)",
              }}
            />
            <DialogPrimitive.Popup
              style={{
                position: "fixed", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 1001,
                background: "var(--color-fill-white)",
                borderRadius: "var(--radius-12)",
                padding: "var(--spacing-32)",
                maxWidth: 400,
                width: "90%",
                boxSizing: "border-box" as React.CSSProperties["boxSizing"],
                boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
                display: "flex", flexDirection: "column", gap: "var(--spacing-24)",
                fontFamily: "var(--font-family-body)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
                <DialogPrimitive.Title style={{
                  margin: 0,
                  fontSize: "var(--font-size-tiny)",
                  fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                  lineHeight: "var(--line-height-tiny)",
                  color: "var(--color-text-strong)",
                }}>
                  Revoke access for {revokeTarget.name}?
                </DialogPrimitive.Title>
                <DialogPrimitive.Description style={{
                  margin: 0,
                  fontSize: "var(--font-size-extra-tiny)",
                  fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                  lineHeight: "var(--line-height-extra-tiny)",
                  color: "var(--color-text-weak)",
                }}>
                  They&rsquo;ll no longer be able to share their own parking spot, but can still log in, book a neighbor&rsquo;s spot, pay, and use their credits as normal. You can restore hosting access later from this page.
                </DialogPrimitive.Description>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--spacing-8)" }}>
                <button
                  onClick={() => setRevokeTarget(null)}
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
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-fill-weak)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-fill-white)"; }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRevoke(revokeTarget)}
                  disabled={revokeResident.isPending}
                  style={{
                    height: 36, padding: "0 var(--spacing-20)",
                    background: "var(--color-fill-error)",
                    border: "none",
                    borderRadius: "var(--radius-8)",
                    cursor: revokeResident.isPending ? "default" : "pointer",
                    opacity: revokeResident.isPending ? 0.6 : 1,
                    fontFamily: "var(--font-family-body)",
                    fontSize: "var(--font-size-tiny)",
                    fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                    lineHeight: "var(--line-height-tiny)",
                    color: "var(--color-text-white)",
                  }}
                  onMouseEnter={(e) => { if (!revokeResident.isPending) e.currentTarget.style.background = "var(--color-red-1000)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-fill-error)"; }}
                >
                  {revokeResident.isPending ? "Revoking…" : "Revoke access"}
                </button>
              </div>
            </DialogPrimitive.Popup>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      )}

      {/* Restore access confirmation modal — mirrors the revoke modal
          above but uses the accent palette to signal a positive action.
          Uses @base-ui/react/dialog for the same a11y treatment as the
          revoke modal (role, focus trap, Escape, return focus, scroll
          lock). */}
      {restoreTarget && (
        <DialogPrimitive.Root
          open={!!restoreTarget}
          onOpenChange={(open) => { if (!open) setRestoreTarget(null); }}
        >
          <DialogPrimitive.Portal>
            <DialogPrimitive.Backdrop
              onClick={() => setRestoreTarget(null)}
              style={{
                position: "fixed", inset: 0, zIndex: 1000,
                background: "rgba(0,0,0,0.35)",
              }}
            />
            <DialogPrimitive.Popup
              style={{
                position: "fixed", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 1001,
                background: "var(--color-fill-white)",
                borderRadius: "var(--radius-12)",
                padding: "var(--spacing-32)",
                maxWidth: 400,
                width: "90%",
                boxSizing: "border-box" as React.CSSProperties["boxSizing"],
                boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
                display: "flex", flexDirection: "column", gap: "var(--spacing-24)",
                fontFamily: "var(--font-family-body)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
                <DialogPrimitive.Title style={{
                  margin: 0,
                  fontSize: "var(--font-size-tiny)",
                  fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                  lineHeight: "var(--line-height-tiny)",
                  color: "var(--color-text-strong)",
                }}>
                  Restore access for {restoreTarget.name}?
                </DialogPrimitive.Title>
                <DialogPrimitive.Description style={{
                  margin: 0,
                  fontSize: "var(--font-size-extra-tiny)",
                  fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                  lineHeight: "var(--line-height-extra-tiny)",
                  color: "var(--color-text-weak)",
                }}>
                  This will re-enable their access to the Parqlet app.
                </DialogPrimitive.Description>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--spacing-8)" }}>
                <button
                  onClick={() => setRestoreTarget(null)}
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
                  onClick={() => handleRestore(restoreTarget)}
                  disabled={restoreResident.isPending}
                  style={{
                    height: 36, padding: "0 var(--spacing-20)",
                    background: "var(--color-fill-accent)",
                    border: "none",
                    borderRadius: "var(--radius-8)",
                    cursor: restoreResident.isPending ? "default" : "pointer",
                    opacity: restoreResident.isPending ? 0.6 : 1,
                    fontFamily: "var(--font-family-body)",
                    fontSize: "var(--font-size-tiny)",
                    fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                    lineHeight: "var(--line-height-tiny)",
                    // Fixed brand color, doesn't invert in dark mode — keep text dark.
                    color: "#222222",
                  }}
                  onMouseEnter={(e) => { if (!restoreResident.isPending) e.currentTarget.style.background = "var(--color-accent-1200)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-fill-accent)"; }}
                >
                  {restoreResident.isPending ? "Restoring…" : "Restore access"}
                </button>
              </div>
            </DialogPrimitive.Popup>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      )}

      {/* Resident note modal */}
      {activeNoteId && (() => {
        const resident = residents.find(r => r.id === activeNoteId);
        if (!resident) return null;
        return (
          <ResidentNoteModal
            resident={resident}
            onClose={() => setActiveNoteId(null)}
          />
        );
      })()}

      {/* Invite selected toast */}
      {inviteToast && (
        <div style={{
          position: "fixed", bottom: "var(--spacing-32)", left: "50%",
          transform: "translateX(-50%)",
          background: "var(--color-fill-strong)", color: "var(--color-text-white)",
          fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)",
          fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
          lineHeight: "var(--line-height-tiny)",
          padding: "var(--spacing-12) var(--spacing-24)",
          borderRadius: "var(--radius-12)", boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
          zIndex: 3000, whiteSpace: "nowrap",
        }}>
          {inviteToast}
        </div>
      )}
    </>
  );
}