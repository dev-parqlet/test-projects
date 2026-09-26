/**
 * Shared date helpers.
 *
 * Every formatter here accepts `string | null | undefined` and returns `"—"` for
 * null/undefined/invalid input. This consolidates the 9 inline `fmtDate`/`fmtTime`
 * copies that previously lived across the app and silently rendered `"1/1/1970"`
 * or `"Invalid Date"` when given `null`/empty strings.
 *
 * Two date formats appear in the codebase:
 *   - ISO timestamps: `"2026-05-18T08:20:13.113Z"` — handled by `new Date()`.
 *   - Booking strings: `"8am, May 22"` — handled by `parseBookingDate`
 *     (re-exported below).
 */
import { parseBookingDate } from "./parse-booking-date";

export { parseBookingDate };

const BOOKING_REGEX = /^(\d+)(?::(\d+))?(am|pm),\s+([A-Za-z]{3})\s+(\d+)$/;
const PLACEHOLDER = "—";

/**
 * Returns a `Date` for any recognized input shape, or `null` for null/undefined/
 * empty/invalid input. Used internally; prefer the named formatters below.
 */
export function toDate(input: string | null | undefined): Date | null {
  if (input == null || input === "") return null;
  const d = BOOKING_REGEX.test(input) ? parseBookingDate(input) : new Date(input);
  if (d == null) return null;
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Booking strings ("8am, May 22") are reconstructed as UTC-wall-clock Date
 * objects (see parse-booking-date.ts's "all-UTC contract") — the UTC digits
 * ARE the intended display digits, not a real instant to localize. Real ISO
 * timestamps (alerts, invites, etc.) are genuine instants and should still
 * render in the viewer's local time zone as normal. Rendering a booking
 * string's Date with `toLocaleString` (no `timeZone`) silently re-interprets
 * those UTC digits through the viewer's offset — e.g. a booking stored as
 * "2pm" reads as "9am" for a UTC-5 viewer, a bug that showed up as the
 * dashboard's Current Bookings time not matching the Bookings table (which
 * renders the backend's formatted string directly, untouched).
 */
function localeOptions(
  input: string | null | undefined,
  opts: Intl.DateTimeFormatOptions
): Intl.DateTimeFormatOptions {
  return BOOKING_REGEX.test(input ?? "") ? { ...opts, timeZone: "UTC" } : opts;
}

/** "Apr 18, 2026" — the most common short date. */
export function fmtDate(input: string | null | undefined): string {
  const d = toDate(input);
  if (d == null) return PLACEHOLDER;
  return d.toLocaleDateString("en-US", localeOptions(input, { month: "short", day: "numeric", year: "numeric" }));
}

/** "Apr 18, 10:30 AM" — date + time without year (compact). */
export function fmtTime(input: string | null | undefined): string {
  const d = toDate(input);
  if (d == null) return PLACEHOLDER;
  return d.toLocaleString("en-US", localeOptions(input, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }));
}

/** "Apr 18, 2026, 10:30 AM" — date + time with year (full timestamp). */
export function fmtTimeFull(input: string | null | undefined): string {
  const d = toDate(input);
  if (d == null) return PLACEHOLDER;
  return d.toLocaleString("en-US", localeOptions(input, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }));
}

/** "Apr 18, 2026, 10:30 AM" — date + time with year and 2-digit hour. */
export function fmtDateTime(input: string | null | undefined): string {
  const d = toDate(input);
  if (d == null) return PLACEHOLDER;
  return d.toLocaleDateString("en-US", localeOptions(input, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }));
}

/** Alias of `fmtDate` for code that prefers the longer name. */
export const fmtShortDate = fmtDate;

/** "April 18, 2026" — long month name. */
export function fmtFull(input: string | null | undefined): string {
  const d = toDate(input);
  if (d == null) return PLACEHOLDER;
  return d.toLocaleDateString("en-US", localeOptions(input, { month: "long", day: "numeric", year: "numeric" }));
}

/**
 * Whole-day countdown to a future ISO date. Returns `NaN` for null/invalid input
 * so the value propagates safely through downstream arithmetic.
 */
export function daysUntil(input: string | null | undefined): number {
  const d = toDate(input);
  if (d == null) return Number.NaN;
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}

/** "2h ago" / "3d ago" / "just now" — for notification-style feeds. Returns
 *  the placeholder for null/invalid input. */
export function relativeTime(input: string | null | undefined): string {
  const d = toDate(input);
  if (d == null) return PLACEHOLDER;
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
  return `${Math.floor(diffDay / 30)}mo ago`;
}