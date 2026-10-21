"use client";

/**
 * Storage bookings.
 *
 * The same screen as Parking bookings about a different kind of space,
 * so it is the same shell down to the row height: three tabs, a search,
 * Notes and Status filters, a sticky header, a pagination footer. An
 * admin switching between them should not have to re-learn anything.
 *
 * Three columns differ:
 *
 *   Booked Spot    → Booked Storage
 *   Spot Owner     → Storage Owner
 *   License Plate  → Storage Type   (a locker has no plate)
 *
 * Parking's Guest Name column has no counterpart: a storage rental is
 * between two residents, with nobody visiting. Location and Size are
 * added on top (client request): a parking bay is identified by its
 * number alone, where "which locker" is a number, a floor and a size -
 * two cages on different levels can carry the same number.
 *
 * Shown only where the building has Storage spots switched on; the nav
 * row is gated the same way. Reaching it directly without the setting
 * gives the empty state rather than an error, which is the right
 * failure for a page somebody bookmarked before the toggle moved.
 */

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../components/auth/auth-provider";
import { useBuildingFilter } from "../../components/context/building-filter-context";
import { TextButton } from "../../components/text-button";
import { Badge } from "../../components/ui/Badge";
import { CopyableCell } from "../../components/ui/CopyableCell";
import { FilterDropdown } from "../../components/ui/FilterDropdown";
import { IdDisplay } from "../../components/ui/IdDisplay";
import { Pagination } from "../../components/ui/Pagination";
import { useToast } from "../../components/ui/use-toast";
import { StorageApprovalTable } from "../../components/storage/StorageApprovalTable";
import {
  ApproveStorageDialog,
  RejectStorageDialog,
  approvedToast,
  rejectedToast,
} from "../../components/storage/StorageApprovalDialogs";
import {
  DEMO_STORAGE_APPROVALS,
  type DemoStorageApproval,
} from "../../lib/demo/storage-approvals";
import { TableHeadLabel } from "../../components/ui/TableHeadLabel";
import { PhoneWithTooltip } from "../residents/components/phone-tooltip";
import { NAME_COLUMN_WIDTH, NAME_TEXT_WIDTH } from "../../lib/name-cell";
import "../../tokens.css";

/** Local, matching the super-admin Residents page - there is no shared
 *  hook module in this app and adding one for a 6-line function would be
 *  a third pattern rather than a second. */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

type StorageTab = "current" | "future" | "past" | "approvals";

/**
 * "Storage approval" is always LAST. It is where a manager goes when
 * something is waiting, and the three tabs before it are the ones they
 * open every day.
 */
const TABS: { id: StorageTab; label: string }[] = [
  { id: "current", label: "Current bookings" },
  { id: "future", label: "Upcoming bookings" },
  { id: "past", label: "Past bookings" },
  { id: "approvals", label: "Storage approval" },
];

// Fixed where the header is the widest thing in the column, flexible
// where a value can be. Same reasoning as the Parking table, and the
// same numbers for the columns the two share.
const BOOKING_ID_WIDTH   = "10 1 100px";
const UNIT_WIDTH         = "7 1 70px";
const BOOKED_STORAGE     = "9 1 120px";
const STORAGE_TYPE_WIDTH = "11 1 140px";
const STORAGE_LOCATION   = "11 1 140px";
const STORAGE_SIZE_WIDTH = "8 1 90px";
const START_WIDTH        = "12 1 130px";
const END_WIDTH          = "11 1 115px";
const STATUS_WIDTH       = "0 0 120px";
const NOTES_WIDTH        = "10 1 70px";

const COLUMNS: { label: string; flex: string }[] = [
  { label: "Booking ID",     flex: BOOKING_ID_WIDTH },
  { label: "Unit #",         flex: UNIT_WIDTH },
  { label: "Resident Name",  flex: NAME_COLUMN_WIDTH },
  { label: "Booked Storage", flex: BOOKED_STORAGE },
  { label: "Storage Owner",  flex: NAME_COLUMN_WIDTH },
  { label: "Storage Type",   flex: STORAGE_TYPE_WIDTH },
  { label: "Location",       flex: STORAGE_LOCATION },
  { label: "Size",           flex: STORAGE_SIZE_WIDTH },
  { label: "Booking Start",  flex: START_WIDTH },
  { label: "Booking End",    flex: END_WIDTH },
  { label: "Status",         flex: STATUS_WIDTH },
  { label: "Notes",          flex: NOTES_WIDTH },
];

type StorageBooking = {
  /** The display label ("S-A1B"). Not unique enough to key a write. */
  id: string;
  /** The spot_details row id - what the note PATCH addresses. */
  rowId: string;
  unitNumber: string | null;
  residentName: string | null;
  residentPhone: string | null;
  storageNumber: string | null;
  /** Null where the BUILDING listed it - the row shows a tag instead. */
  storageOwnerName: string | null;
  storageOwnerPhone: string | null;
  listedByBuilding: boolean;
  storageType: string | null;
  location: string | null;
  storageSize: string | null;
  bookingStart: string | null;
  bookingEnd: string | null;
  status: string;
  note: string | null;
  hasNote: boolean;
};

const STATUS_VARIANT: Record<string, string> = {
  Active: "active",
  Upcoming: "upcoming",
  Completed: "active",
  Cancelled: "expired",
  Expired: "expired",
  Pending: "pending",
};

const NOTES_OPTIONS = ["All", "Has note", "No note"];
const STATUS_OPTIONS_CURRENT = ["All", "Active"];
const STATUS_OPTIONS_FUTURE = ["All", "Upcoming"];
const STATUS_OPTIONS_PAST = ["All", "Completed", "Cancelled"];

function statusOptionsFor(tab: StorageTab): string[] {
  // Nothing to filter on the approvals tab: every row on it is waiting,
  // which is the definition of the tab.
  if (tab === "approvals") return ["All"];
  return tab === "current" ? STATUS_OPTIONS_CURRENT
    : tab === "future" ? STATUS_OPTIONS_FUTURE
    : STATUS_OPTIONS_PAST;
}

function IcSearch() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7.25" stroke="var(--color-icon-weak)" strokeWidth="1.5" />
      <path d="M16.5 16.5L21 21" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IcDocument({ color = "var(--color-icon-weak)" }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="3" width="14" height="18" rx="2" stroke={color} strokeWidth="1.5" />
      <line x1="9" y1="8"  x2="15" y2="8"  stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9" y1="12" x2="15" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9" y1="16" x2="13" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * The note editor.
 *
 * Deliberately smaller than Parking's: that one doubles as a booking
 * summary because a guest booking has a payment, a plate and a guest to
 * identify. A storage rental is two residents and a date range, all of
 * which are already on the row the admin clicked.
 */
function NoteModal({
  booking,
  onSave,
  onClose,
  isSubmitting,
}: {
  booking: StorageBooking;
  onSave: (note: string) => void;
  onClose: () => void;
  isSubmitting: boolean;
}) {
  const [draft, setDraft] = useState(booking.note ?? "");

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 2000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "var(--spacing-24)",
      }}
    >
      <div style={{
        background: "var(--color-fill-white)", borderRadius: "var(--radius-24)",
        width: 460, maxWidth: "100%", padding: "var(--spacing-32)",
        fontFamily: "var(--font-family-body)",
      }}>
        <h2 style={{
          margin: 0,
          fontSize: "var(--font-size-heading-3)",
          fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
          lineHeight: "var(--line-height-heading-3)",
          color: "var(--color-text-strong)",
          fontFamily: "var(--font-family-heading)",
        }}>
          Storage booking note
        </h2>
        <p style={{
          margin: "var(--spacing-8) 0 var(--spacing-24)",
          fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)",
        }}>
          {booking.storageNumber ?? "Storage"} · {booking.bookingStart ?? "—"} to {booking.bookingEnd ?? "Ongoing"}
        </p>

        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={5}
          placeholder="Add a note for your team"
          style={{
            width: "100%", boxSizing: "border-box" as React.CSSProperties["boxSizing"],
            borderRadius: "var(--radius-8)", border: "1px solid var(--color-stroke-medium)",
            padding: "var(--spacing-12)", resize: "vertical",
            fontSize: "var(--font-size-tiny)", fontFamily: "var(--font-family-body)",
            color: "var(--color-text-strong)",
          }}
        />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--spacing-8)", marginTop: "var(--spacing-24)" }}>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: "none", border: "1px solid var(--color-stroke-medium)",
              borderRadius: "var(--radius-48)", padding: "var(--spacing-8) var(--spacing-24)",
              fontSize: "var(--font-size-tiny)", cursor: isSubmitting ? "default" : "pointer",
              fontFamily: "var(--font-family-body)", color: "var(--color-text-strong)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(draft)}
            disabled={isSubmitting}
            style={{
              background: "var(--color-fill-strong)", color: "var(--color-text-white)",
              border: "none", borderRadius: "var(--radius-48)",
              padding: "var(--spacing-8) var(--spacing-24)",
              fontSize: "var(--font-size-tiny)",
              fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
              cursor: isSubmitting ? "default" : "pointer",
              fontFamily: "var(--font-family-body)",
            }}
          >
            {isSubmitting ? "Saving…" : "Save note"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StorageBookingsPage() {
  const { user } = useAuth();
  const { selectedIds } = useBuildingFilter();
  const [tab, setTab] = useState<StorageTab>("current");

  /**
   * The approval queue. Answering a claim removes it from the list -
   * demo-local, because there is no backend here to hold the decision,
   * and a row that stayed after being approved would suggest the
   * approval had not taken.
   */
  const [answered, setAnswered] = useState<Set<string>>(new Set());
  const approvalRows = DEMO_STORAGE_APPROVALS.filter((r) => !answered.has(r.id));
  const [approving, setApproving] = useState<DemoStorageApproval | null>(null);
  const [rejecting, setRejecting] = useState<DemoStorageApproval | null>(null);
  const toast = useToast();

  const settle = (row: DemoStorageApproval, approved: boolean) => {
    setAnswered((prev) => new Set(prev).add(row.id));
    const claim = {
      storageNumber: row.storageNumber,
      residentName: row.residentName,
      unitNumber: row.unitNumber,
    };
    toast.show(approved ? approvedToast(claim) : rejectedToast(claim));
    setApproving(null);
    setRejecting(null);
  };
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("All");
  const [notesFilter, setNotesFilter] = useState("All");
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  const buildingId = selectedIds[0] ?? user?.buildingIds?.[0] ?? "";
  const debounced = useDebounce(query, 300);
  const queryClient = useQueryClient();

  const { data, isLoading: fetching, error, refetch } = useQuery({
    queryKey: ["storage-bookings", { buildingId, tab, search: debounced, statusFilter, notesFilter }],
    queryFn: async (): Promise<{ data: StorageBooking[]; total: number }> => {
      const sp = new URLSearchParams();
      if (buildingId) sp.set("buildingId", buildingId);
      sp.set("tab", tab);
      if (debounced) sp.set("search", debounced);
      if (statusFilter !== "All") sp.set("status", statusFilter);
      if (notesFilter !== "All") sp.set("notes", notesFilter);
      const res = await fetch(`/api/storage-bookings?${sp}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch storage bookings");
      return res.json();
    },
    enabled: !!buildingId,
  });

  /**
   * "No storage bookings found" was showing for a moment on the FIRST
   * visit, before the data arrived, and correcting itself on reload.
   *
   * A DISABLED query is not a loading one. React Query reports
   * `isLoading: false` while `enabled` is false, so during the tick
   * before the session resolves - when `buildingId` is still "" - the
   * table fell straight through to its empty state. On a reload the
   * identity is already in hand, the query is enabled from the first
   * render, and the empty state never appears; which is exactly the
   * "reload and the data is there" that was reported.
   *
   * So "waiting" is the absence of an answer, not the presence of a
   * request.
   */
  const isLoading = fetching || !buildingId;

  /**
   * The demo has no backend, so a note is written straight into the
   * query cache.
   *
   * It is NOT persisted, and that is the honest behaviour here rather
   * than a shortcut: the fixture is a file in the bundle, so a note
   * that appeared to save and then vanished on refresh would be worse
   * than one that plainly lasts for the session. The interaction is
   * live because an admin demoing this will click it.
   */
  const saveNote = (rowId: string, note: string) => {
    queryClient.setQueriesData<{ data: StorageBooking[]; total: number }>(
      { queryKey: ["storage-bookings"] },
      (prev) =>
        prev
          ? {
              ...prev,
              data: prev.data.map((b) =>
                b.rowId === rowId
                  ? { ...b, note: note || null, hasNote: note.trim().length > 0 }
                  : b,
              ),
            }
          : prev,
    );
    setActiveNoteId(null);
  };

  const allRows = data?.data ?? [];
  const total = data?.total ?? 0;
  // The API returns the whole (capped) set rather than a page, so the
  // slice happens here. Same footer either way.
  const rows = allRows.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const cellTxt: React.CSSProperties = {
    fontSize: "var(--font-size-tiny)",
    lineHeight: "var(--line-height-tiny)",
    color: "var(--color-text-strong)",
    fontFamily: "var(--font-family-body)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  const nameTextStyle: React.CSSProperties = {
    ...cellTxt,
    display: "block",
    minWidth: NAME_TEXT_WIDTH,
    maxWidth: NAME_TEXT_WIDTH,
    whiteSpace: "normal",
    wordBreak: "break-word",
    overflow: "visible",
    textOverflow: "clip",
  };

  const cell = (flex: string, node: React.ReactNode) => (
    <div style={{ flex, minWidth: 0, maxWidth: "100%" }}>{node}</div>
  );

  return (
    <>
      <div style={{
        fontFamily: "var(--font-family-body)",
        padding: "var(--spacing-24)",
        display: "flex", flexDirection: "column", gap: "var(--spacing-24)",
        height: "100%", overflow: "hidden",
        boxSizing: "border-box" as React.CSSProperties["boxSizing"],
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: "var(--font-size-heading-1)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            lineHeight: "var(--line-height-heading-1)",
            color: "var(--color-text-strong)",
            fontFamily: "var(--font-family-heading)",
          }}>
            Storage bookings
          </h1>
          <p style={{
            margin: "var(--spacing-8) 0 0",
            fontSize: "var(--font-size-body)",
            lineHeight: "var(--line-height-body)",
            color: "var(--color-text-weak)",
          }}>
            View current, upcoming and past storage bookings
          </p>

          <div style={{
            display: "flex", alignItems: "flex-end", gap: "var(--spacing-24)",
            marginTop: "var(--spacing-24)",
            borderBottom: "1px solid var(--color-stroke-medium)",
          }}>
            {TABS.map((t) => {
              const isActive = tab === t.id;
              return (
                <button
                  key={t.id}
                  // Page and status reset HERE rather than in an effect
                  // keyed on `tab`: an effect that calls setState in its
                  // body triggers a cascading render, and the tab button
                  // is the only thing that can change the tab anyway.
                  onClick={() => { setTab(t.id); setStatusFilter("All"); setPage(1); }}
                  style={{
                    background: "none", border: "none", padding: "0 0 var(--spacing-12)",
                    cursor: "pointer",
                    fontSize: "var(--font-size-tiny)",
                    lineHeight: "var(--line-height-tiny)",
                    fontWeight: (isActive ? "var(--font-weight-medium)" : "var(--font-weight-regular)") as React.CSSProperties["fontWeight"],
                    color: isActive ? "var(--color-text-strong)" : "var(--color-text-weak)",
                    fontFamily: "var(--font-family-body)",
                    whiteSpace: "nowrap",
                    borderBottom: isActive ? "2px solid var(--color-text-strong)" : "2px solid transparent",
                    marginBottom: -1,
                    transition: "color 0.15s, border-color 0.15s",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {tab === "approvals" ? (
          <StorageApprovalTable
            rows={approvalRows}
            onApprove={(r) => setApproving(r)}
            onReject={(r) => setRejecting(r)}
          />
        ) : (
         <>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--spacing-12)", flexWrap: "wrap" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "var(--color-fill-white)",
            border: "1px solid var(--color-stroke-medium)",
            borderRadius: "var(--radius-8)", padding: "0 10px", height: 40,
            flex: "1 0 240px", maxWidth: 480,
            boxSizing: "border-box" as React.CSSProperties["boxSizing"],
          }}>
            <IcSearch />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search by storage #, resident, owner, type, or location"
              style={{
                border: "none", outline: "none", background: "transparent", width: "100%",
                fontSize: "var(--font-size-tiny)",
                lineHeight: "var(--line-height-tiny)",
                color: "var(--color-text-weak)",
                fontFamily: "var(--font-family-body)",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: "var(--spacing-8)", flexShrink: 0 }}>
            <FilterDropdown label="Notes" options={NOTES_OPTIONS} value={notesFilter} onChange={(v) => { setNotesFilter(v); setPage(1); }} />
            <FilterDropdown label="Status" options={statusOptionsFor(tab)} value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} />
          </div>
        </div>

        <div style={{
          flex: 1, minHeight: 0, display: "flex", flexDirection: "column",
          background: "var(--color-fill-white)",
          border: "1px solid var(--color-stroke-medium)",
          borderRadius: "var(--radius-12)", overflow: "hidden",
        }}>
          <div style={{ flex: 1, minHeight: 0, overflowX: "auto", overflowY: "auto" }}>
            <div style={{ minWidth: 1700, width: "100%" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "var(--spacing-8)",
                padding: "0 var(--spacing-24)", minHeight: 48,
                borderBottom: "1px solid var(--color-stroke-medium)",
                background: "var(--color-fill-white)",
                position: "sticky", top: 0, zIndex: 2,
              }}>
                {COLUMNS.map((col) => (
                  <div key={col.label} style={{ flex: col.flex, minWidth: 0, maxWidth: "100%" }}>
                    <TableHeadLabel style={{
                      lineHeight: "var(--line-height-uppercase)",
                      fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                      color: "var(--color-text-weak)",
                      fontFamily: "var(--font-family-body)",
                      textTransform: "uppercase" as const,
                    }}>
                      {col.label}
                    </TableHeadLabel>
                  </div>
                ))}
              </div>

              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: "var(--spacing-8)",
                    padding: "0 var(--spacing-24)", height: 57,
                    borderBottom: i === 4 ? "none" : "1px solid var(--color-stroke-medium)",
                  }}>
                    {COLUMNS.map((col) => (
                      <div key={col.label} style={{ flex: col.flex, minWidth: 0 }}>
                        <div style={{ height: 14, borderRadius: 4, background: "var(--color-gray-5)", width: "70%" }} />
                      </div>
                    ))}
                  </div>
                ))
              ) : error ? (
                <div style={{ padding: "var(--spacing-64) var(--spacing-24)" }}>
                  <div style={{ color: "var(--color-text-weaker)", fontSize: "var(--font-size-tiny)", marginBottom: "var(--spacing-16)" }}>
                    Failed to load storage bookings. Please try again.
                  </div>
                  <button
                    onClick={() => refetch()}
                    style={{
                      background: "var(--color-fill-strong)", color: "var(--color-text-white)",
                      border: "none", borderRadius: "var(--radius-48)",
                      padding: "var(--spacing-8) var(--spacing-24)",
                      fontSize: "var(--font-size-tiny)",
                      fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                      cursor: "pointer",
                    }}
                  >
                    Retry
                  </button>
                </div>
              ) : rows.length === 0 ? (
                <div style={{ padding: "var(--spacing-64) var(--spacing-24)", color: "var(--color-text-weaker)", fontSize: "var(--font-size-tiny)" }}>
                  No storage bookings found.
                </div>
              ) : (
                rows.map((b, i) => (
                  <div key={b.rowId} style={{
                    display: "flex", alignItems: "center", gap: "var(--spacing-8)",
                    padding: "var(--spacing-8) var(--spacing-24)", minHeight: 57,
                    borderBottom: i === rows.length - 1 ? "none" : "1px solid var(--color-stroke-medium)",
                  }}>
                    {cell(BOOKING_ID_WIDTH, <CopyableCell value={b.id}><IdDisplay value={b.id} style={cellTxt} /></CopyableCell>)}
                    {cell(UNIT_WIDTH, <CopyableCell value={b.unitNumber ?? "—"}><span style={cellTxt}>{b.unitNumber ?? "—"}</span></CopyableCell>)}
                    {cell(NAME_COLUMN_WIDTH,
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-8)", minWidth: 0 }}>
                        <PhoneWithTooltip phone={b.residentPhone ?? ""} />
                        <CopyableCell value={b.residentName ?? "—"} style={nameTextStyle}>
                          <span style={nameTextStyle}>{b.residentName ?? "—"}</span>
                        </CopyableCell>
                      </div>
                    )}
                    {cell(BOOKED_STORAGE, <CopyableCell value={b.storageNumber ?? "—"}><span style={cellTxt}>{b.storageNumber ?? "—"}</span></CopyableCell>)}
                    {cell(NAME_COLUMN_WIDTH,
                      // A tag, not the word "Building" as text: the
                      // management office listing a unit is a different
                      // kind of row and should read as one at a glance.
                      b.listedByBuilding ? (
                        <Badge as="span" variant="inactive">Building</Badge>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-8)", minWidth: 0 }}>
                          <PhoneWithTooltip phone={b.storageOwnerPhone ?? ""} />
                          <CopyableCell value={b.storageOwnerName ?? "—"} style={nameTextStyle}>
                            <span style={nameTextStyle}>{b.storageOwnerName ?? "—"}</span>
                          </CopyableCell>
                        </div>
                      )
                    )}
                    {cell(STORAGE_TYPE_WIDTH, <span style={cellTxt}>{b.storageType ?? "—"}</span>)}
                    {cell(STORAGE_LOCATION, <span style={cellTxt}>{b.location ?? "—"}</span>)}
                    {cell(STORAGE_SIZE_WIDTH, <span style={cellTxt}>{b.storageSize ?? "—"}</span>)}
                    {cell(START_WIDTH, <span style={cellTxt}>{b.bookingStart ?? "—"}</span>)}
                    {/* "Ongoing" rather than a blank for month-to-month:
                        an empty cell reads as missing data. */}
                    {cell(END_WIDTH, <span style={cellTxt}>{b.bookingEnd ?? "Ongoing"}</span>)}
                    {cell(STATUS_WIDTH, <Badge as="span" variant={STATUS_VARIANT[b.status] ?? "active"}>{b.status}</Badge>)}
                    {cell(NOTES_WIDTH,
                      b.hasNote ? (
                        <button
                          onClick={() => setActiveNoteId(b.rowId)}
                          title="View notes"
                          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center" }}
                        >
                          <IcDocument color="var(--color-icon-strong)" />
                        </button>
                      ) : (
                        <TextButton onClick={() => setActiveNoteId(b.rowId)}>Add note</TextButton>
                      )
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <Pagination
            totalItems={total}
            pageSize={rowsPerPage}
            currentPage={page}
            onPageChange={setPage}
            itemLabel="bookings"
            pageSizeOptions={[10, 20, 50, 100]}
            onPageSizeChange={(size) => { setRowsPerPage(size); setPage(1); }}
          />
        </div>
         </>
        )}
      </div>

      <ApproveStorageDialog
        claim={approving && {
          storageNumber: approving.storageNumber,
          residentName: approving.residentName,
          unitNumber: approving.unitNumber,
        }}
        onCancel={() => setApproving(null)}
        onConfirm={() => approving && settle(approving, true)}
      />
      <RejectStorageDialog
        claim={rejecting && {
          storageNumber: rejecting.storageNumber,
          residentName: rejecting.residentName,
          unitNumber: rejecting.unitNumber,
        }}
        onCancel={() => setRejecting(null)}
        onConfirm={() => rejecting && settle(rejecting, false)}
      />
      {toast.node}

      {activeNoteId && (() => {
        const booking = allRows.find((b) => b.rowId === activeNoteId);
        if (!booking) return null;
        return (
          <NoteModal
            booking={booking}
            onSave={(note) => saveNote(activeNoteId, note)}
            onClose={() => setActiveNoteId(null)}
            isSubmitting={false}
          />
        );
      })()}
    </>
  );
}
