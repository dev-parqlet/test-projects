"use client";

import { usePathname, useRouter } from "next/navigation";
import { useBookings } from "../hooks";
import { colors } from "../ui/chart-utils";
import { fmtDateTime } from "@/lib/dates";
import { bookingEarning } from "../../lib/demo/booking-earnings";
import { productPrefix } from "../../lib/demo/product-path";

interface CurrentBookingsCardProps {
  buildingId: string | null;
  /**
   * Show what the building earned on each booking, and how it was paid.
   *
   * Off for a Condo, where the answer is the same on every row - a credit
   * changed hands between two residents - and a column of near-identical
   * figures crowds the row without telling the operator anything. An
   * Apartment prices its own spots, so there the number is the point.
   */
  showEarnings?: boolean;
}

/** How many bookings fit beside the activity chart without overrunning it. */
const MAX_ROWS = 5;

export function CurrentBookingsCard({ buildingId, showEarnings = false }: CurrentBookingsCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  // Keep the visitor inside the product they were sent to: an unprefixed
  // /bookings from an Apartment would hand them the Condo's page.
  const prefix = productPrefix(pathname);
  const { data: bookings = [], isLoading } = useBookings(buildingId);

  // fmtDateTime renders booking strings in UTC (matching the backend's
  // UTC-wall-clock contract, and the Bookings table's untouched display of
  // the same string) instead of the viewer's local time zone.
  const formatTime = (start: string, end: string) => `${fmtDateTime(start)} to ${fmtDateTime(end)}`;

  return (
    <div
      style={{
        flex: 1,
        background: colors.white,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-family-body)",
          fontSize: "var(--font-size-uppercase)",
          lineHeight: "var(--line-height-uppercase)",
          fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
          color: "var(--color-text-weak)",
          textTransform: "uppercase" as const,
        }}
      >
        Recent Bookings
      </span>

      {isLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 0", color: "var(--color-text-weaker)", fontSize: 14 }}>
          Loading…
        </div>
      ) : bookings.length === 0 ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 0", color: "var(--color-text-weaker)", fontSize: 14 }}>
          No recent bookings
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Five, not seven. This column sits beside the activity chart,
              and at seven rows it ran past the bottom of the chart and left
              the row of cards uneven. "See all activity" below carries
              anyone who wants the rest. */}
          {bookings.slice(0, MAX_ROWS).map((booking, i) => {
            // Completed = green. Assigned = blue "Upcoming" everywhere else in
            // the app (see bookings/page.tsx's STATUS_BADGE) — but this widget
            // is specifically bookings happening now/soon, so an Assigned
            // booking whose window has actually started reads as "Active"
            // (green, same "currently good" family as Completed) rather than
            // "Upcoming" (which would wrongly imply it hasn't started yet).
            // A Cancelled booking only ever reaches this list at all when
            // `cancelledDueToIssue` is true (see useBookings' select filter)
            // — reads as "Issue Reported", same red/expired tone as the
            // Bookings page's own badge for the same case. A still-Assigned
            // booking with an open dispute (`hasOpenIssue`) reads the same
            // way, even while it's happening right now.
            const earning = bookingEarning(booking);
            const start = new Date(booking.bookingStartIso);
            const end = new Date(booking.bookingEndIso);
            const now = new Date();
            const isHappeningNow = booking.status === "Assigned" && !isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= now && now <= end;
            const isIssueReported =
              (booking.status === "Cancelled" && booking.cancelledDueToIssue) ||
              (booking.status === "Assigned" && booking.hasOpenIssue);
            const isGreen = !isIssueReported && (booking.status === "Completed" || isHappeningNow);
            const tagLabel = isIssueReported
              ? "Issue Reported"
              : booking.status === "Completed"
                ? "Completed"
                : isHappeningNow
                  ? "Active"
                  : booking.status === "Assigned"
                    ? "Upcoming"
                    : booking.status;
            return (
            <div key={booking.id}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {/* No clock glyph. Every row on this list is a booking and
                      every booking has a time, so the same icon seven times
                      distinguished nothing - the spot-type tag that replaced
                      it is the thing that actually differs row to row. */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {showEarnings && (
                      <span style={{ ...spotKindTag(earning.spotKind), alignSelf: "flex-start" }}>
                        {earning.spotKindLabel}
                      </span>
                    )}
                    <p style={{ fontSize: 14, lineHeight: "16px", color: colors.textStrong }}>
                      <strong style={{ fontWeight: 500 }}>{booking.unitNumber ?? "—"}</strong> booked spot{" "}
                      <strong style={{ fontWeight: 500 }}>
                        {booking.spotNumber ? `#${booking.spotNumber}` : "—"}
                      </strong>
                    </p>
                    <p style={{ fontSize: 12, lineHeight: "16px", color: colors.textWeak }}>
                      {formatTime(booking.bookingStart, booking.bookingEnd)}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      background: isIssueReported
                        ? "var(--color-tag-expired, #fdecea)"
                        : isGreen
                          ? "var(--color-tag-active, #e8f5e9)"
                          : "var(--color-tag-upcoming, #e3f2fd)",
                      borderRadius: 47,
                      padding: "4px 8px",
                      fontSize: 12,
                      color: isIssueReported
                        ? "var(--color-tag-text-expired, #c62828)"
                        : isGreen
                          ? "var(--color-tag-text-active, #2e7d32)"
                          : "var(--color-tag-text-upcoming, #1565c0)",
                      lineHeight: "16px",
                      flexShrink: 0,
                    }}
                  >
                    {tagLabel}
                  </span>
                  <button
                    onClick={() => router.push(`${prefix}/bookings?highlight=${booking.id}`)}
                    style={{
                      fontSize: 14,
                      lineHeight: "20px",
                      color: colors.textStrong,
                      textDecoration: "none",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      fontFamily: "var(--font-family-body)",
                      fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "underline"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "none"; }}
                  >
                    View details
                  </button>
                </div>
              </div>
              {i < Math.min(bookings.length, 7) - 1 && (
                <div style={{ borderTop: `1px solid ${colors.border}`, marginTop: 12 }} />
              )}
            </div>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => router.push(`${prefix}/bookings`)}
          style={{
            fontSize: "var(--font-size-tiny)",
            lineHeight: "var(--line-height-tiny)",
            color: colors.textStrong,
            textDecoration: "none",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-family-body)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            padding: 0,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "underline"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "none"; }}
        >
          See all activity
        </button>
      </div>
    </div>
  );
}


/** A community spot is the building's own; a resident spot is lent by a neighbour. */
function spotKindTag(kind: "building" | "neighbor"): React.CSSProperties {
  return {
    padding: "2px 8px",
    borderRadius: 47,
    fontSize: 12,
    lineHeight: "16px",
    whiteSpace: "nowrap",
    background: kind === "building" ? "var(--color-accent-150)" : "var(--color-fill-weak)",
    color: "var(--color-text-strong)",
  };
}
