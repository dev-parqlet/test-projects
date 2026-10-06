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
  guestName: string;
  licensePlate: string;
  status: string;
  bookingStart: string;
  bookingEnd: string;
  [key: string]: unknown;
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
  const raw = bookingsData as unknown as { data: MockBooking[] };

  const buildingId = params.get("buildingId");
  const tab = params.get("tab");
  const status = params.get("status");
  const search = params.get("search")?.trim().toLowerCase() || "";
  const dateFrom = params.get("dateFrom");
  const dateTo = params.get("dateTo");
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = Math.max(1, Number(params.get("pageSize")) || 20);

  const now = new Date();

  let rows = raw.data.filter((b) => {
    if (buildingId && b.buildingId !== buildingId) return false;

    const start = parseBookingDate(b.bookingStart);
    const end = parseBookingDate(b.bookingEnd);

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
      const aStart = parseBookingDate(a.bookingStart)?.getTime() ?? 0;
      const bStart = parseBookingDate(b.bookingStart)?.getTime() ?? 0;
      return bStart - aStart;
    });
  } else {
    rows = [...rows].sort((a, b) => {
      const aStart = parseBookingDate(a.bookingStart)?.getTime() ?? 0;
      const bStart = parseBookingDate(b.bookingStart)?.getTime() ?? 0;
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
    bookingStartIso: parseBookingDate(b.bookingStart)?.toISOString() ?? null,
    bookingEndIso: parseBookingDate(b.bookingEnd)?.toISOString() ?? null,
  }));

  return { data, total, page, pageSize };
}
