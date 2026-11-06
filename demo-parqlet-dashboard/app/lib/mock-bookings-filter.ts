import { parseBookingDate } from "./parse-booking-date";

/**
 * IMPORTED, not read off disk at request time.
 *
 * This used to be `fs.readFileSync(process.cwd() + "app/lib/mock-data/
 * bookings.json")`. That works locally and is a coin toss on Vercel:
 * whether a file reached by a path the compiler cannot see gets traced
 * into the deployment, and whether a cached build refreshes it, is not
 * something the code controls. On 2026-10-06 it lost the toss - the
 * deployment served a months-old bookings.json while serving the
 * CURRENT residents.json beside it, so the Bookings table showed one
 * resident owning five spots that the Residents table had already
 * reassigned.
 *
 * An import is resolved at build time and bundled, so the data cannot
 * be a different vintage from the code that reads it.
 *
 * Only safe because nothing writes this file. `buildings.json` IS
 * written by the mock settings route, so that one has to stay on fs.
 */
import bookingsData from "./mock-data/bookings.json";

interface MockBooking {
  id: string;
  buildingId: string;
  unitNumber: string;
  spotNumber: string;
  residentName: string;
  spotOwnerName: string | null;
  /** Null on a long-term row: nobody is visiting. */
  guestName: string | null;
  licensePlate: string;
  status: string;
  bookingStart: string;
  bookingEnd: string;
  /** A long-term arrangement, which gets its own tab. See the filter. */
  longTerm?: boolean;
  /** Real instants, as seeded. `liveBookings` slides them to now. */
  bookingStartIso?: string | null;
  bookingEndIso?: string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const HALF_HOUR = 30 * 60_000;
const DAY = 86_400_000;

/**
 * "6:20am, Aug 21" - the shape lib/parse-booking-date.ts reads back.
 * UTC getters, because that parser rebuilds the date with Date.UTC: the
 * digits must round-trip, whatever zone the viewer is in.
 */
function fmtTime(d: Date): string {
  let h = d.getUTCHours();
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  const min = d.getUTCMinutes();
  const time = min === 0 ? `${h}${ampm}` : `${h}:${String(min).padStart(2, "0")}${ampm}`;
  return `${time}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** "Nov 1, 2026" - a long-term row's day, as the seeder writes it. */
function fmtDay(d: Date): string {
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/**
 * Every booking, slid forward so the building is busy TODAY.
 *
 * The seeder lays bookings out around the moment it runs - some running
 * now, a week ahead, five weeks of history - but it runs at build time.
 * Served as written, the demo was busy on deploy day and then aged a day
 * per day: three weeks on, nothing was running, the last-7-days chart
 * was empty and every dashboard stat read zero (client, 2026-11-06).
 *
 * So each row moves forward by however long it has been since
 * `seededAt`, and its display text is rebuilt from the moved instant.
 * The distance from every booking to "now" is then exactly what the
 * seeder chose, on any day.
 *
 *   guest bookings   slid by whole half-hours, so times stay on :00 and
 *                    :30 rather than reading "2:47am"
 *   long-term        slid by whole days, so a rental still starts at
 *                    midnight
 *
 * Rows without instants (an older bookings.json) are returned as they
 * are, which is the previous behaviour.
 */
export function liveBookings(now: Date = new Date()): MockBooking[] {
  const raw = bookingsData as unknown as { seededAt?: string; data: MockBooking[] };
  const seededMs = raw.seededAt ? Date.parse(raw.seededAt) : NaN;
  if (Number.isNaN(seededMs)) return raw.data;

  const elapsed = Math.max(0, now.getTime() - seededMs);
  const guestShift = Math.round(elapsed / HALF_HOUR) * HALF_HOUR;
  const longTermShift = Math.round(elapsed / DAY) * DAY;

  const move = (iso: string | null | undefined, by: number) =>
    iso ? new Date(Date.parse(iso) + by) : null;

  return raw.data.map((b) => {
    const by = b.longTerm ? longTermShift : guestShift;
    const start = move(b.bookingStartIso, by);
    const end = move(b.bookingEndIso, by);
    if (!start || !end) return b;
    const fmt = b.longTerm ? fmtDay : fmtTime;
    return {
      ...b,
      bookingStart: fmt(start),
      bookingEnd: fmt(end),
      bookingStartIso: start.toISOString(),
      bookingEndIso: end.toISOString(),
      createdAt: move(b.createdAt, by)?.toISOString() ?? b.createdAt,
      updatedAt: move(b.updatedAt, by)?.toISOString() ?? b.updatedAt,
    };
  });
}

/** A booking's instants: the slid ones, or parsed from the display text. */
function startOf(b: MockBooking): Date | null {
  return b.bookingStartIso ? new Date(b.bookingStartIso) : parseBookingDate(b.bookingStart);
}
function endOf(b: MockBooking): Date | null {
  return b.bookingEndIso ? new Date(b.bookingEndIso) : parseBookingDate(b.bookingEnd);
}

/**
 * Mirrors api-backend's GET /api/bookings filtering (tab/status/search/date
 * range/relevance-sort/pagination) against the static mock JSON, since the
 * dashboard's default local setup (NEXT_PUBLIC_MOCK_ENABLED=true) never
 * reaches the real backend — without this, every query param the frontend
 * sends (tab, search, status, dateFrom/dateTo, page) was silently ignored
 * and the full static file came back unfiltered every time.
 */
export function buildMockBookingsResponse(params: URLSearchParams) {
  const now = new Date();
  const all = liveBookings(now);

  const buildingId = params.get("buildingId");
  const tab = params.get("tab");
  const status = params.get("status");
  const search = params.get("search")?.trim().toLowerCase() || "";
  const dateFrom = params.get("dateFrom");
  const dateTo = params.get("dateTo");
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = Math.max(1, Number(params.get("pageSize")) || 20);

  let rows = all.filter((b) => {
    if (buildingId && b.buildingId !== buildingId) return false;

    const start = startOf(b);
    const end = endOf(b);

    /**
     * Long-term rows are their own tab, and are excluded from the other
     * three rather than placed by date.
     *
     * A month-long window overlaps "current" and would swamp "past" the
     * moment it ended, so the date cannot decide this. In the real
     * backend they are not `bookings` rows at all - they live in
     * spot_details and the route reads a different table - and the flag
     * is this fixture's stand-in for that.
     */
    const isLongTerm = b.longTerm === true;
    if (tab === "long-term") return isLongTerm;
    if (isLongTerm) return false;

    // Tabs are a chronological, mutually-exclusive partition — mirrors the
    // real backend (see api-backend routes/bookings.ts): an "Upcoming"
    // booking moves itself into "Current" once its start time arrives.
    if (tab === "current" && !(start != null && end != null && start <= now && end >= now)) return false;
    if (tab === "past" && !(end != null && end < now)) return false;
    if (tab === "future" && !(start != null && start > now)) return false;

    // "Active" is the Apartments page's label for an Assigned booking
    // that is running right now; the backend has no such status, and
    // the fixture no longer carries one. Alias it so the dropdown still
    // filters instead of silently returning nothing.
    const wantedStatus = status === "Active" ? "Assigned" : status;
    if (wantedStatus && wantedStatus !== "All" && b.status !== wantedStatus) return false;

    if (dateFrom) {
      const from = new Date(dateFrom);
      if (start == null || start < from) return false;
    }
    if (dateTo) {
      const to = new Date(dateTo);
      if (start == null || start > to) return false;
    }

    if (search) {
      const haystack = [
        b.id,
        b.unitNumber,
        b.spotNumber,
        b.residentName,
        b.spotOwnerName,
        b.guestName,
        b.licensePlate,
      ]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase());
      if (!haystack.some((v) => v.includes(search))) return false;
    }

    return true;
  });

  if (search) {
    // Ranked relevance, per the client's priority order — unit #, spot #,
    // guest name, spot owner name outrank every other field, and an exact
    // match outranks a partial one. Mirrors api-backend's SQL CASE.
    const tier = (b: MockBooking): number => {
      const isExact = (v: string | null | undefined) => (v ?? "").toLowerCase() === search;
      const includes = (v: string | null | undefined) => (v ?? "").toLowerCase().includes(search);
      if (isExact(b.unitNumber) || isExact(b.spotNumber)) return 0;
      if (isExact(b.guestName) || isExact(b.spotOwnerName)) return 1;
      if (includes(b.unitNumber) || includes(b.spotNumber) || includes(b.guestName) || includes(b.spotOwnerName)) return 2;
      return 3;
    };
    rows = [...rows].sort((a, b) => {
      const t = tier(a) - tier(b);
      if (t !== 0) return t;
      const aStart = startOf(a)?.getTime() ?? 0;
      const bStart = startOf(b)?.getTime() ?? 0;
      return bStart - aStart;
    });
  } else {
    rows = [...rows].sort((a, b) => {
      const aStart = startOf(a)?.getTime() ?? 0;
      const bStart = startOf(b)?.getTime() ?? 0;
      return bStart - aStart;
    });
  }

  const total = rows.length;
  const offset = (page - 1) * pageSize;
  // Real API responses (api-backend routes/bookings.ts) include raw ISO
  // instants alongside the display string — components that need real
  // time-math (CurrentBookingsCard, RecentActivityCard, useDashboardStats,
  // synthetic-notifications) read bookingStart(Iso)/bookingEnd(Iso), not
  // the display string, so mock mode needs to provide them too.
  const data = rows.slice(offset, offset + pageSize).map((b) => ({
    ...b,
    bookingStartIso: startOf(b)?.toISOString() ?? null,
    bookingEndIso: endOf(b)?.toISOString() ?? null,
  }));

  return { data, total, page, pageSize };
}
