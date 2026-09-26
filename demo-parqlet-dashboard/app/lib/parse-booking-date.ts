/**
 * Parses the human-readable booking start/end strings returned by the backend
 * (e.g. "12pm, Apr 13" or "6:20am, Aug 21" when the minute isn't :00) into a Date.
 *
 * DEMO: the year is the CURRENT year, not a hardcoded 2026. The demo's data
 * is regenerated relative to the build date by scripts/seed-demo-data.mjs,
 * so pinning the year would silently push every row into the past the moment
 * the calendar turned over - which is the exact failure the seeding exists to
 * prevent. The dashboard still treats the data as living in a single year.
 *
 * The backend's `fmtDate` (api-backend/src/routes/bookings.ts) renders this
 * string in the booking's building's local time (not literal UTC — that was
 * the case before per-building timezones were wired in). Reconstructing it
 * with `Date.UTC` (not the local-timezone `new Date(y,m,d,h)` constructor)
 * is still required, though: the printed digits are the intended display
 * digits regardless of what they represent, so building a Date whose UTC
 * getters echo those same digits is what makes this safe to re-format
 * elsewhere (see lib/dates.ts) without a second, viewer-timezone conversion.
 * Using the local constructor here would re-interpret the digits through
 * the viewer's own offset instead.
 */
const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

export function parseBookingDate(dateStr: string): Date | null {
  const m = dateStr.match(/^(\d+)(?::(\d+))?(am|pm),\s+([A-Za-z]{3})\s+(\d+)$/);
  if (m) {
    const [, rawHour, rawMinute, ampm, mon, day] = m;
    const h = parseInt(rawHour, 10) + (ampm === "pm" && rawHour !== "12" ? 12 : 0);
    const minute = rawMinute ? parseInt(rawMinute, 10) : 0;
    return new Date(Date.UTC(new Date().getFullYear(), MONTHS[mon], parseInt(day, 10), h, minute, 0));
  }
  return null;
}
