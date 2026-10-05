"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listBookings, updateBookingNote, bookingKeys, Booking, BookingListParams } from "../../lib/api/bookings";
import { useBuildingFilter } from "../../components/context/building-filter-context";
import { useAuth } from "../../components/auth/auth-provider";

import { TextButton } from "../../components/text-button";
import { Button } from "../../components/ui/Button";
import { FilterDropdown } from "../../components/ui/FilterDropdown";
import { Badge } from "../../components/ui/Badge";
import { IdDisplay } from "../../components/ui/IdDisplay";
import { Pagination } from "../../components/ui/Pagination";
import { TableHeadLabel } from "../../components/ui/TableHeadLabel";
import { CopyableCell } from "../../components/ui/CopyableCell";
import { PhoneWithTooltip } from "../residents/components/phone-tooltip";
import { NAME_TEXT_WIDTH, NAME_COLUMN_WIDTH } from "../../lib/name-cell";
import { compareNamesIgnoringLeadingSymbols } from "../../lib/sort-utils";
import "../../tokens.css";

// ─── Types ────────────────────────────────────────────────────────────────────
// NOTE: Booking type is now imported from ../lib/api/bookings
// BookingTab is a local type for UI state (not from API)
type BookingTab = "current" | "future" | "past";

// ─── Debounce hook ───────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

const ROW_HEIGHT     = 57;
const HEADER_HEIGHT  = 48;
const FOOTER_HEIGHT  = 57;
const MIN_ROWS       = 4;

// ─── Column defs ──────────────────────────────────────────────────────────────

// Fixed width rather than a proportional flex share — "Awaiting
// confirmation" (the Draft/PendingApproval label) is far longer than the
// other status labels ("Cancelled", "Expired", etc.), so a flex-grow ratio
// sized for the short labels let it overflow into the Notes column.
const STATUS_COLUMN_WIDTH = "0 0 190px";

// Flex-basis floors (px) for the non-fixed columns — sized so each header
// label ("BOOKED SPOT", "LICENSE PLATE", etc.) fits on one line at the
// table's minWidth instead of wrapping to two rows; flex-grow ratios are
// unchanged so columns still grow proportionally on wider screens.
const BOOKING_ID_WIDTH    = "10 1 100px";
const UNIT_WIDTH          = "7 1 70px";
const BOOKED_SPOT_WIDTH   = "9 1 110px";
const LICENSE_PLATE_WIDTH = "11 1 130px";
const BOOKING_START_WIDTH = "12 1 130px";
const BOOKING_END_WIDTH   = "11 1 115px";
const NOTES_WIDTH         = "10 1 70px";

const COLUMNS: { label: string; flex: number | string }[] = [
  { label: "Booking ID",    flex: BOOKING_ID_WIDTH },
  { label: "Unit #",        flex: UNIT_WIDTH },
  { label: "Resident Name", flex: NAME_COLUMN_WIDTH },
  { label: "Booked Spot",   flex: BOOKED_SPOT_WIDTH },
  { label: "Spot Owner",    flex: NAME_COLUMN_WIDTH },
  { label: "Guest Name",    flex: NAME_COLUMN_WIDTH },
  { label: "License Plate", flex: LICENSE_PLATE_WIDTH },
  { label: "Booking Start", flex: BOOKING_START_WIDTH },
  { label: "Booking End",   flex: BOOKING_END_WIDTH },
  { label: "Status",        flex: STATUS_COLUMN_WIDTH },
  { label: "Notes",         flex: NOTES_WIDTH },
];

// ─── Icons ────────────────────────────────────────────────────────────────────

function IcCalendar({ color = "currentColor" }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="5" width="16" height="16" rx="2" stroke={color} strokeWidth="1.5" />
      <line x1="8"  y1="3"  x2="8"  y2="7"  stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="3"  x2="16" y2="7"  stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="5"  y1="11" x2="19" y2="11" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function IcClock({ color = "currentColor" }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <path d="M12 7v5l3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcSearch() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7.25" stroke="var(--color-icon-weak)" strokeWidth="1.5" />
      <path d="M16.5 16.5L21 21" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IcChevronDown({ color = "var(--color-icon-weak)" }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M6 9l6 6 6-6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcSmallCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2.5 8L6.5 12L13.5 4" stroke="var(--color-icon-strong)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

function IcDocumentLg() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="3" width="14" height="18" rx="2" stroke="var(--color-icon-strong)" strokeWidth="1.5" />
      <line x1="9" y1="8"  x2="15" y2="8"  stroke="var(--color-icon-strong)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9" y1="12" x2="15" y2="12" stroke="var(--color-icon-strong)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9" y1="16" x2="13" y2="16" stroke="var(--color-icon-strong)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IcClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 3l10 10M13 3L3 13" stroke="var(--color-icon-strong)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Note Modal ───────────────────────────────────────────────────────────────

const NOTE_MAX = 5000;

function NoteModal({
  booking,
  onSave,
  onClose,
  isSubmitting,
}: {
  booking: Booking;
  onSave: (note: string) => void;
  onClose: () => void;
  isSubmitting: boolean;
}) {
  const [draft, setDraft] = useState(booking.note ?? "");

  function handleSave() {
    onSave(draft);
  }

  const label: React.CSSProperties = {
    fontSize: "var(--font-size-extra-tiny)",
    color: "var(--color-text-weak)",
    lineHeight: "var(--line-height-extra-tiny)",
    fontFamily: "var(--font-family-body)",
    fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
    display: "block",
    marginBottom: "var(--spacing-4)",
  };

  const divider: React.CSSProperties = {
    borderBottom: "1px solid var(--color-stroke-medium)",
    margin: "var(--spacing-16) 0",
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 2000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "var(--spacing-24)",
      }}
    >
      <div style={{
        background: "var(--color-fill-white)",
        borderRadius: "var(--radius-24)",
        width: 460,
        maxWidth: "100%",
        maxHeight: "85vh",
        overflowY: "auto",
        position: "relative",
        padding: "var(--spacing-32)",
        fontFamily: "var(--font-family-body)",
      }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--spacing-24)" }}>
          <h2 style={{
            margin: 0,
            fontSize: "var(--font-size-heading-3)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            lineHeight: "var(--line-height-heading-3)",
            color: "var(--color-text-strong)",
            fontFamily: "var(--font-family-heading)",
          }}>
            Booking note
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: "none", border: "none",
              cursor: isSubmitting ? "default" : "pointer",
              padding: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <IcClose />
          </button>
        </div>

        {/* Icon */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "var(--spacing-24)" }}>
          <div style={{
            width: 100, height: 100,
            borderRadius: "var(--radius-20)",
            border: "none",
            background: "var(--color-gray-5)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <IcDocumentLg />
          </div>
        </div>

        {/* Booking ID */}
        <div>
          <span style={label}>Booking ID</span>
          <div style={{
            display: "flex", alignItems: "baseline", justifyContent: "space-between",
            flexWrap: "wrap", gap: "var(--spacing-8)",
          }}>
            <IdDisplay
              value={booking.id}
              style={{
                fontSize: "var(--font-size-body)",
                fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                lineHeight: "var(--line-height-body)",
              }}
            />
            <span style={{ ...label, marginBottom: 0, whiteSpace: "nowrap" }}>
              {booking.bookingStart} → {booking.bookingEnd}
            </span>
          </div>
        </div>

        <div style={divider} />

        {/* Resident + Guest */}
        <div style={{ display: "flex", gap: "var(--spacing-24)", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 160px", minWidth: 0 }}>
            <span style={label}>Resident</span>
            <span style={{
              fontSize: "var(--font-size-tiny)",
              color: "var(--color-text-strong)",
              fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
              lineHeight: "var(--line-height-tiny)",
              display: "block",
            }}>
              {booking.residentName}
            </span>
            <span style={{ ...label, marginTop: "var(--spacing-4)" }}>Unit {booking.unitNumber} · Spot {booking.spotNumber}</span>
          </div>
          <div style={{ flex: "1 1 160px", minWidth: 0 }}>
            <span style={label}>Guest</span>
            <span style={{
              fontSize: "var(--font-size-tiny)",
              color: "var(--color-text-strong)",
              fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
              lineHeight: "var(--line-height-tiny)",
              display: "block",
            }}>
              {booking.guestName}
            </span>
            <span style={{ ...label, marginTop: "var(--spacing-4)" }}>{booking.licensePlate}</span>
          </div>
        </div>

        <div style={divider} />

        {/* Single editable note field */}
        <span style={label}>Note</span>
        <div style={{
          background: "var(--color-gray-5)",
          borderRadius: "var(--radius-12)",
          padding: "var(--spacing-12)",
          marginBottom: "var(--spacing-8)",
        }}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, NOTE_MAX))}
            placeholder="Add a note about this booking"
            rows={6}
            disabled={isSubmitting}
            style={{
              width: "100%", border: "none", outline: "none",
              background: "transparent", resize: "none",
              fontSize: "var(--font-size-tiny)",
              color: "var(--color-text-strong)",
              lineHeight: "var(--line-height-tiny)",
              fontFamily: "var(--font-family-body)",
              fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            }}
          />
        </div>
        <div style={{ textAlign: "right", marginBottom: "var(--spacing-24)" }}>
          <span style={{ ...label, display: "inline", marginBottom: 0 }}>
            {draft.length} / {NOTE_MAX}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--spacing-8)" }}>
          <Button
            variant="neutral"
            size="small"
            disabled={isSubmitting}
            onClick={onClose}
            style={{ width: "auto" }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="small"
            disabled={isSubmitting}
            onClick={handleSave}
            style={{ width: "auto" }}
          >
            {isSubmitting ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BookingRow({ booking, isLast, onOpenNote, highlighted, rowRef, isCurrentTab, isPastTab }: { booking: Booking; isLast: boolean; onOpenNote: () => void; highlighted?: boolean; rowRef?: React.RefObject<HTMLDivElement | null>; isCurrentTab: boolean; isPastTab: boolean }) {
  const cell = (flex: number | string, content: React.ReactNode, extraStyle?: React.CSSProperties) => (
    <div style={{ flex: typeof flex === "number" ? `${flex} 1 0` : flex, minWidth: 0, ...extraStyle }}>
      {content}
    </div>
  );

  const cellTxt: React.CSSProperties = {
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-weak)",
    lineHeight: "var(--line-height-tiny)",
    fontFamily: "var(--font-family-body)",
    fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
    display: "block",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    minWidth: 0,
  };

  // Fixed width shared by every "name + phone icon" cell (Resident Name,
  // Spot Owner, Guest Name) so a long name wraps onto a second line instead
  // of ellipsizing, and the phone icon always lands at the same offset —
  // keeping icons aligned down each column instead of drifting with name
  // length.
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

  const safeStatus: Booking["status"] = VALID_STATUSES.has(booking.status)
      ? booking.status
      : "Expired";
  // Assigned reads as "Active" (green) while actually in progress right
  // now, "Completed" (green) once its window has ended but the backend
  // hasn't formally flipped it yet (normally within 15 min via the auto-
  // complete sweep — see booking-expiry.ts), and "Upcoming" (blue)
  // otherwise — UNLESS it has an open spot-occupied dispute (hasOpenIssue),
  // in which case "Issue Reported" wins regardless of tab, same as a
  // Cancelled booking the dispute sweeper auto-cancelled (cancelledDueToIssue).
  // Trust the tab itself rather than re-deriving the time window client-side:
  // Current/Past are already defined server-side as exactly these conditions
  // (see api-backend routes/bookings.ts), so a booking rendered under either
  // tab satisfies them by construction — no client/server clock skew or
  // stale-field edge case can produce a mismatch if we don't recompute the
  // same check twice.
  const isHappeningNow = safeStatus === "Assigned" && isCurrentTab;
  const isEndedAwaitingComplete = safeStatus === "Assigned" && isPastTab;
  const statusBadge =
    (safeStatus === "Cancelled" && booking.cancelledDueToIssue) ||
    (safeStatus === "Assigned" && booking.hasOpenIssue)
      ? { label: "Issue Reported", variant: "expired" }
      : isHappeningNow
        ? { label: "Active", variant: "active" }
        : isEndedAwaitingComplete
          ? { label: "Completed", variant: "active" }
          : STATUS_BADGE[safeStatus] ?? { label: safeStatus, variant: "active" };
  return (
    <div
      ref={rowRef}
      style={{
        display: "flex", alignItems: "center", gap: "var(--spacing-8)",
        padding: "var(--spacing-8) var(--spacing-24)", minHeight: 57,
        borderBottom: isLast ? "none" : "1px solid var(--color-stroke-medium)",
        background: highlighted ? "var(--color-gray-5)" : "transparent",
        transition: "background 0.6s ease",
      }}
    >
      {cell(BOOKING_ID_WIDTH, <CopyableCell value={booking.id}><IdDisplay value={booking.id} style={cellTxt} /></CopyableCell>)}
      {cell(UNIT_WIDTH,  <CopyableCell value={booking.unitNumber}><span style={cellTxt}>{booking.unitNumber}</span></CopyableCell>)}
      {cell(NAME_COLUMN_WIDTH,
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-8)", minWidth: 0 }}>
          <CopyableCell value={booking.residentName} style={nameTextStyle}>
            <span style={nameTextStyle}>{booking.residentName}</span>
          </CopyableCell>
          <PhoneWithTooltip phone={booking.residentPhone} />
        </div>
      )}
      {cell(BOOKED_SPOT_WIDTH,  <CopyableCell value={booking.spotNumber}><span style={cellTxt}>{booking.spotNumber}</span></CopyableCell>)}
      {cell(NAME_COLUMN_WIDTH,
        booking.spotOwnerName ? (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-8)", minWidth: 0 }}>
            <CopyableCell value={booking.spotOwnerName} style={nameTextStyle}>
              <span style={nameTextStyle}>{booking.spotOwnerName}</span>
            </CopyableCell>
            <PhoneWithTooltip phone={booking.spotOwnerPhone ?? ""} />
          </div>
        ) : (
          <span style={cellTxt}>—</span>
        )
      )}
      {cell(NAME_COLUMN_WIDTH,
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-8)", minWidth: 0 }}>
          <CopyableCell value={booking.guestName} style={nameTextStyle}>
            <span style={nameTextStyle}>{booking.guestName}</span>
          </CopyableCell>
          <PhoneWithTooltip phone={booking.guestPhone} />
        </div>
      )}
      {cell(LICENSE_PLATE_WIDTH, <CopyableCell value={booking.licensePlate}><span style={cellTxt}>{booking.licensePlate}</span></CopyableCell>)}
      {cell(BOOKING_START_WIDTH, <CopyableCell value={booking.bookingStart}><span style={cellTxt}>{booking.bookingStart}</span></CopyableCell>)}
      {cell(BOOKING_END_WIDTH, <CopyableCell value={booking.bookingEnd}><span style={cellTxt}>{booking.bookingEnd}</span></CopyableCell>)}
      {cell(STATUS_COLUMN_WIDTH, <CopyableCell value={statusBadge.label}><Badge as="span" variant={statusBadge.variant}>{statusBadge.label}</Badge></CopyableCell>, { display: "flex", alignItems: "center", justifyContent: "flex-start" })}
      {cell(NOTES_WIDTH,
        (booking.hasNote) ? (
          <button onClick={onOpenNote} title="View notes" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center" }}>
            <IcDocument color="var(--color-icon-strong)" />
          </button>
        ) : (
          <TextButton onClick={onOpenNote}>Add note</TextButton>
        )
      )}
    </div>
  );
}

// ─── Filter helpers ───────────────────────────────────────────────────────────

// Frontend validation: sanitize status to known values
const VALID_STATUSES = new Set(["Draft", "PendingApproval", "Offered", "Assigned", "Completed", "Cancelled", "Expired"]);

const NOTES_OPTIONS   = ["All", "Has note", "No note"];
// "current" is now a chronological bucket (started, not yet ended) rather
// than a status filter, so any non-terminal status can appear there.
// Labels here must match STATUS_BADGE below exactly — the filter dropdown
// should read the same words as the badges in the table, not the raw
// backend enum values. Draft and PendingApproval render as the identical
// "Awaiting confirmation" badge, so they're collapsed into one dropdown
// entry whose value is all three statuses comma-joined; the backend's
// `status` filter accepts a comma-separated list (see bookings.ts).
const AWAITING_CONFIRMATION = "Draft,PendingApproval,Offered";
// Current tab is now status-aware (see bookings.ts) — it only ever contains
// Assigned bookings actually in progress right now, so "Awaiting
// confirmation" and "Cancelled" can never appear here and aren't offered
// as filter choices.
const STATUS_OPTIONS_CURRENT = [
  { label: "All",      value: "All" },
  { label: "Upcoming", value: "Assigned" },
];
const STATUS_OPTIONS_FUTURE = [
  { label: "All",                    value: "All" },
  { label: "Awaiting confirmation",  value: AWAITING_CONFIRMATION },
  { label: "Upcoming",               value: "Assigned" },
];
const STATUS_OPTIONS_PAST = [
  { label: "All",       value: "All" },
  { label: "Completed", value: "Completed" },
  { label: "Cancelled", value: "Cancelled" },
  { label: "Expired",   value: "Expired" },
];
const SORT_OPTIONS    = ["Default", "Name A→Z", "Name Z→A", "Unit A→Z", "Unit Z→A", "Guest A→Z", "Guest Z→A"];

// Display label + Badge color for each booking status. "Assigned" reads as
// "Upcoming" per client request — the booking is confirmed but hasn't
// happened yet. "Draft"/"PendingApproval"/"Offered" (nothing's confirmed/
// finalized yet — including a spot offered but not yet accepted/paid) all
// read as "Awaiting confirmation" — while the underlying status
// value/filter still says "Assigned"/"Draft"/"PendingApproval"/"Offered"
// everywhere else (API params, VALID_STATUSES, etc.).
const STATUS_BADGE: Record<string, { label: string; variant: string }> = {
  Draft:            { label: "Awaiting confirmation", variant: "pending"  },
  PendingApproval:  { label: "Awaiting confirmation", variant: "pending"  },
  Offered:          { label: "Awaiting confirmation", variant: "pending"  },
  Assigned:         { label: "Upcoming",              variant: "upcoming" },
  Completed:        { label: "Completed",             variant: "active"   },
  Cancelled:        { label: "Cancelled",              variant: "expired"  },
  Expired:          { label: "Expired",                variant: "expired"  },
};

// Cancelled and Expired bookings are super-admin-only visibility (client
// request) — the backend hard-excludes them for every non-super-admin
// request regardless of filter (see bookings.ts), so offering them as filter
// options here for HOA roles would just be a dead end that always returns
// zero rows.
function statusOptionsFor(tab: BookingTab, isSuperAdmin: boolean): { label: string; value: string }[] {
  const base = tab === "current" ? STATUS_OPTIONS_CURRENT : tab === "future" ? STATUS_OPTIONS_FUTURE : STATUS_OPTIONS_PAST;
  return isSuperAdmin ? base : base.filter((o) => o.value !== "Cancelled" && o.value !== "Expired");
}

const DATE_OPTIONS_PAST_CURRENT = ["All", "Last day", "Last week", "Last month", "Last 3 months", "Last 6 months", "Last year"];
const DATE_OPTIONS_FUTURE        = ["All", "Next week", "Next month", "Next 3 months", "Next 6 months", "Next year"];

function dateOptionsFor(tab: BookingTab): string[] {
  return tab === "future" ? DATE_OPTIONS_FUTURE : DATE_OPTIONS_PAST_CURRENT;
}

const MS_DAY = 86_400_000;
const PRESET_DAYS: Record<string, number> = {
  "Last day": 1, "Last week": 7, "Last month": 30, "Last 3 months": 90, "Last 6 months": 182, "Last year": 365,
  "Next week": 7, "Next month": 30, "Next 3 months": 90, "Next 6 months": 182, "Next year": 365,
};

// Presets resolve against the actual wall-clock time the query runs at —
// "Last week" always means the 7 days up to right now.
function resolveDatePreset(preset: string): { dateFrom?: string; dateTo?: string } {
  const days = PRESET_DAYS[preset];
  if (!days) return {};
  const now = new Date();
  return preset.startsWith("Next")
    ? { dateFrom: now.toISOString(), dateTo: new Date(now.getTime() + days * MS_DAY).toISOString() }
    : { dateFrom: new Date(now.getTime() - days * MS_DAY).toISOString(), dateTo: now.toISOString() };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function BookingsContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const { selectedIds } = useBuildingFilter();
  const [tab,             setTab]             = useState<BookingTab>("current");
  const [query,           setQuery]           = useState("");
  const [page,            setPage]            = useState(1);
  const [rowsPerPage,     setRowsPerPage]     = useState(10);
  const [notesFilter,     setNotesFilter]     = useState("All");
  const [statusFilter,    setStatusFilter]    = useState("All");
  const [sortFilter,      setSortFilter]      = useState("Default");
  const [datePreset,      setDatePreset]      = useState("All");
  const [activeNoteId,    setActiveNoteId]    = useState<string | null>(null);
  const [highlightId,     setHighlightId]     = useState<string | null>(null);
  // "Current" is the default tab, but an HOA with nothing happening right
  // now shouldn't land on a seemingly-broken empty table — fall through to
  // the next tab that actually has bookings. Only runs once per page visit
  // (stops as soon as a tab with data is found, all three come up empty, or
  // the user manually picks a tab) so it never fights a deliberate filter
  // that happens to return zero results.
  const [autoTabResolved, setAutoTabResolved] = useState(false);
  const highlightRef = useRef<HTMLDivElement>(null);
  const tableCardRef = useRef<HTMLDivElement>(null);

  // Debounce search query to avoid excessive API calls
  const debouncedQuery = useDebounce(query, 300);

  // Building ID: the one picked in the filter, else the building this
  // admin belongs to.
  //
  // It used to fall through to `undefined`, which the mock reads as
  // "every building" — so The Meridian's admin was served Oakline
  // Park's bookings alongside her own. Oakline is the APARTMENT demo,
  // where a spot with no owner is the building's own Community Spot,
  // and those rows rendered here as a column of "—" under a header
  // that said The Meridian. The names were never missing; the rows
  // belonged to somebody else.
  //
  // A super admin keeps the unscoped view — seeing every building is
  // the point of that role, and its own shell has the filter to narrow
  // with.
  const buildingId =
    selectedIds.length > 0
      ? selectedIds[0]
      : isSuperAdmin
        ? undefined
        : user?.buildingId;

  // Fetch bookings via TanStack Query — search, status, and date range are
  // all resolved server-side (all fields, relevance-ranked), and the page
  // itself is server-paginated rather than sliced from a truncated fetch.
  //
  // resolveDatePreset stamps "now" with millisecond precision, so it must
  // be memoized on `datePreset` alone — calling it unmemoized in the render
  // body produces a new dateFrom/dateTo (and therefore a new React Query
  // key) on every render, which refetches, which re-renders, forever. The
  // memo captures "now" once per preset selection instead of once per
  // render, which is also the semantically correct behavior anyway ("Next
  // week" means 7 days from when you picked it, not from whenever React
  // last happened to re-render).
  const { dateFrom, dateTo } = useMemo(() => resolveDatePreset(datePreset), [datePreset]);
  const queryParams: BookingListParams = {
    tab,
    search: debouncedQuery || undefined,
    status: statusFilter !== "All" ? statusFilter : undefined,
    dateFrom,
    dateTo,
    page,
    pageSize: rowsPerPage,
    ...(buildingId ? { buildingId } : {}),
  };
  const queryClient = useQueryClient();
  const { data: apiData, isLoading, error, refetch } = useQuery({
    queryKey: bookingKeys.list(queryParams),
    queryFn: () => listBookings(queryParams),
  });

  // Update booking note
  const updateNoteMutation = useMutation({
    mutationFn: ({ bookingId, note }: { bookingId: string; note: string }) =>
      updateBookingNote(bookingId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });

  // bookings from API response (fallback to empty array)
  const bookings: Booking[] = apiData?.data ?? [];

  // Handle deep-link highlight from dashboard "View details"
  useEffect(() => {
    const h = searchParams.get("highlight");
    if (!h || bookings.length === 0) return;
    const found = bookings.find((b) => b.id === h);
    if (!found) return;
    const targetTab: BookingTab = tab;
    const idx = bookings.findIndex((b) => b.id === h);
    const targetPage = Math.floor(idx / rowsPerPage) + 1;
    if (tab !== targetTab) setTab(targetTab);
    setPage(targetPage);
    setHighlightId(h);
    const timer = setTimeout(() => setHighlightId(null), 5000);
    return () => clearTimeout(timer);
  }, [bookings, searchParams, tab, rowsPerPage]);

  // Scroll highlighted row into view
  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId]);

  // Reset page when tab changes
  useEffect(() => {
    setPage(1);
  }, [tab]);

  // Search, status, and date range are all applied server-side (see
  // queryParams above) — the API already returns exactly this page's rows,
  // ranked by relevance. Only "Has note" and "Sort" have no server support
  // yet, so they're applied client-side on top of the fetched page.
  let pipeline = [...bookings];

  if (notesFilter === "Has note") pipeline = pipeline.filter((b) => b.hasNote);
  if (notesFilter === "No note")  pipeline = pipeline.filter((b) => !b.hasNote);

  if (sortFilter === "Name A→Z")  pipeline = [...pipeline].sort((a, b) => compareNamesIgnoringLeadingSymbols(a.residentName, b.residentName));
  if (sortFilter === "Name Z→A")  pipeline = [...pipeline].sort((a, b) => compareNamesIgnoringLeadingSymbols(b.residentName, a.residentName));
  if (sortFilter === "Unit A→Z")  pipeline = [...pipeline].sort((a, b) => compareNamesIgnoringLeadingSymbols(a.unitNumber ?? "", b.unitNumber ?? ""));
  if (sortFilter === "Unit Z→A")  pipeline = [...pipeline].sort((a, b) => compareNamesIgnoringLeadingSymbols(b.unitNumber ?? "", a.unitNumber ?? ""));
  if (sortFilter === "Guest A→Z") pipeline = [...pipeline].sort((a, b) => compareNamesIgnoringLeadingSymbols(a.guestName, b.guestName));
  if (sortFilter === "Guest Z→A") pipeline = [...pipeline].sort((a, b) => compareNamesIgnoringLeadingSymbols(b.guestName, a.guestName));

  const displayed = pipeline;
  const total = apiData?.total ?? 0;

  const TAB_FALLTHROUGH_ORDER: BookingTab[] = ["current", "future", "past"];
  useEffect(() => {
    if (autoTabResolved || isLoading || error) return;
    if (total > 0) { setAutoTabResolved(true); return; }
    const next = TAB_FALLTHROUGH_ORDER[TAB_FALLTHROUGH_ORDER.indexOf(tab) + 1];
    if (next) { setTab(next); } else { setAutoTabResolved(true); }
  }, [autoTabResolved, isLoading, error, total, tab]);

  function switchTab(t: BookingTab) {
    setAutoTabResolved(true);
    setTab(t);
    setPage(1);
    setStatusFilter("All");
    setDatePreset("All");
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

        {/* ── Title row ─────────────────────────────────────────────────────── */}
        <div>
          <h1 style={{
            margin: 0,
            fontSize: "var(--font-size-heading-1)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            lineHeight: "var(--line-height-heading-1)",
            color: "var(--color-text-strong)",
            fontFamily: "var(--font-family-heading)",
          }}>
            Bookings
          </h1>
          <p style={{
            margin: "var(--spacing-8) 0 0",
            fontSize: "var(--font-size-body)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            color: "var(--color-text-weak)",
            lineHeight: "var(--line-height-body)",
          }}>
            View current bookings and complete booking history
          </p>

          {/* Tab bar */}
          <div style={{
            display: "flex", alignItems: "flex-end",
            gap: "var(--spacing-24)",
            marginTop: "var(--spacing-24)",
            borderBottom: "1px solid var(--color-stroke-medium)",
          }}>
            {(["current", "future", "past"] as BookingTab[]).map((t) => {
              const isActive = tab === t;
              const label    = t === "current" ? "Current bookings" : t === "future" ? "Upcoming bookings" : "Past bookings";
              return (
                <button
                  key={t}
                  onClick={() => switchTab(t)}
                  style={{
                    background: "none", border: "none", padding: "0 0 var(--spacing-12)",
                    cursor: "pointer",
                    fontSize: "var(--font-size-tiny)",
                    fontWeight: (isActive ? "var(--font-weight-medium)" : "var(--font-weight-regular)") as React.CSSProperties["fontWeight"],
                    lineHeight: "var(--line-height-tiny)",
                    color: isActive ? "var(--color-text-strong)" : "var(--color-text-weak)",
                    fontFamily: "var(--font-family-body)",
                    whiteSpace: "nowrap",
                    borderBottom: isActive ? "2px solid var(--color-text-strong)" : "2px solid transparent",
                    marginBottom: -1,
                    transition: "color 0.15s, border-color 0.15s",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Search + Filters ──────────────────────────────────────────────── */}
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
              placeholder="Search by unit, spot, resident, spot owner, guest, or plate"
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
          <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-8)", flexWrap: "wrap", flexShrink: 0 }}>
            <FilterDropdown
              label="Notes"
              options={NOTES_OPTIONS}
              value={notesFilter}
              onChange={(v) => { setNotesFilter(v); setPage(1); }}
            />
            <FilterDropdown
              label="Status"
              options={statusOptionsFor(tab, isSuperAdmin)}
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
            />
            <FilterDropdown
              label="Sort"
              options={SORT_OPTIONS}
              value={sortFilter}
              onChange={(v) => { setSortFilter(v); setPage(1); }}
            />
            <FilterDropdown
              label="Date range"
              options={dateOptionsFor(tab)}
              value={datePreset}
              onChange={(v) => { setDatePreset(v); setPage(1); }}
            />
          </div>
        </div>

        {/* ── Table ─────────────────────────────────────────────────────────── */}
        {/* flex:1 + minHeight:0 here (matching the page root's height:"100%"
            above, and the same pattern Parking/Super Admin Residents already
            use) makes the card stretch to fill whatever vertical space is
            left after the title/filters above it, instead of only ever
            being as tall as its own rows need — which left blank space
            below a short page of rows even when the viewport had plenty of
            room, and, combined with the inner wrapper's old overflow:hidden,
            actually collapsed/clipped rows on a full page (a flex item with
            overflow other than "visible" gets an automatic minimum size of
            0 per spec, so `flex:1` had nothing bounded to grow into without
            this ancestor chain). */}
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
            <div style={{ minWidth: 1650, width: "100%" }}>

              {/* Table header — sticky, matching Parking/Super Admin
                  Residents: now that the rows scroll internally rather than
                  the whole page, an unstuck header would scroll away with
                  them instead of staying visible. */}
              <div style={{
                display: "flex", alignItems: "center", gap: "var(--spacing-8)",
                padding: "0 var(--spacing-24)", minHeight: 48,
                borderBottom: "1px solid var(--color-stroke-medium)",
                background: "var(--color-fill-white)",
                position: "sticky", top: 0, zIndex: 2,
              }}>
                {COLUMNS.map((col) => (
                  <div key={col.label} style={{ flex: typeof col.flex === "number" ? `${col.flex} 1 0` : col.flex, minWidth: 0, maxWidth: "100%" }}>
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

              {/* Table rows */}
              {isLoading ? (
                // Loading skeleton — 5 placeholder rows
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: "var(--spacing-8)",
                    padding: "0 var(--spacing-24)", height: 57,
                    borderBottom: i === 4 ? "none" : "1px solid var(--color-stroke-medium)",
                  }}>
                    {COLUMNS.map((col) => (
                      <div key={col.label} style={{ flex: typeof col.flex === "number" ? `${col.flex} 1 0` : col.flex, minWidth: 0 }}>
                        <div style={{
                          height: 14, borderRadius: 4,
                          background: "var(--color-gray-5)",
                          width: "70%",
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
                }}>
                  <div style={{
                    color: "var(--color-text-weaker)",
                    fontSize: "var(--font-size-tiny)",
                    marginBottom: "var(--spacing-16)",
                  }}>
                    Failed to load bookings. Please try again.
                  </div>
                  <button
                    onClick={() => refetch()}
                    style={{
                      background: "var(--color-fill-strong)",
                      color: "var(--color-text-white)",
                      border: "none",
                      borderRadius: "var(--radius-48)",
                      padding: "var(--spacing-8) var(--spacing-24)",
                      fontSize: "var(--font-size-tiny)",
                      fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                      cursor: "pointer",
                    }}
                  >
                    Retry
                  </button>
                </div>
              ) : displayed.length > 0 ? (
                displayed.map((booking, i) => (
                  <BookingRow
                    key={booking.id}
                    booking={booking}
                    isLast={i === displayed.length - 1}
                    onOpenNote={() => setActiveNoteId(booking.id)}
                    highlighted={booking.id === highlightId}
                    rowRef={booking.id === highlightId ? highlightRef : undefined}
                    isCurrentTab={tab === "current"}
                    isPastTab={tab === "past"}
                  />
                ))
              ) : (
                <div style={{
                  padding: "var(--spacing-64) var(--spacing-24)",
                  textAlign: "left",
                  color: "var(--color-text-weaker)",
                  fontSize: "var(--font-size-tiny)",
                }}>
                  No bookings found.
                </div>
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


      </div>

      {/* Note modal */}
      {activeNoteId && (() => {
        const booking = bookings.find(b => b.id === activeNoteId);
        if (!booking) return null;
        return (
          <NoteModal
            booking={booking}
            onSave={(note) => {
              updateNoteMutation.mutate({ bookingId: activeNoteId, note });
            }}
            onClose={() => setActiveNoteId(null)}
            isSubmitting={updateNoteMutation.isPending}
          />
        );
      })()}
    </>
  );
}

export default function BookingsPage() {
return (<>
    <Suspense>
      <BookingsContent />
    </Suspense>
    </>
  );
}
