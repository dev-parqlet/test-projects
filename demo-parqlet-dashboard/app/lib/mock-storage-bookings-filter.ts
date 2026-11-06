/**
 * The Storage bookings table, filtered against the static fixture.
 *
 * Mirrors api-backend's GET /api/storage-bookings: three chronological
 * tabs, a search over the fields the page says it searches, and the
 * Notes / Status filters. Without it every query param the page sends
 * would be ignored and the whole file would come back unfiltered on
 * every tab - which looks, from the front, exactly like a table that
 * does not work.
 *
 * IMPORTED, not read off disk at request time, for the same reason
 * mock-bookings-filter.ts is: a path the compiler cannot see is a coin
 * toss on whether the file gets traced into the deployment, and that
 * toss was lost once already.
 *
 * Status is DERIVED from the window rather than stored, matching the
 * real route. A stored status needs something keeping it true, and the
 * thing that falls behind shows a finished rental as Active.
 */

import storageData from "./mock-data/storage-bookings.json";
import { demoDayShift } from "./demo/epoch";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/** `YYYY-MM-DD` moved forward `days` whole days. */
function shiftDay(day: string, days: number): string {
  const [y, m, d] = day.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** "Sep 8, 2026", the fixture's own display shape. */
function displayDay(day: string): string {
  const [y, m, d] = day.slice(0, 10).split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/**
 * Every storage rental, slid forward to today.
 *
 * The fixture is authored against the demo epoch (2026-09-28) - at that
 * date it has 12 rentals running, 4 upcoming and 4 finished. But it is
 * served through a factory, and the epoch rebase in handle-request.ts
 * only applies to files served as they are, so these dates never moved:
 * a year on, nothing would be upcoming and most rentals would read as
 * finished. The demo is sent to prospects and has to look the same on
 * any day it is opened (client, 2026-11-06).
 *
 * Whole days, by the same `demoDayShift` every other mock file uses, so
 * storage cannot drift from the rest of the corpus. The display text is
 * rebuilt from the moved day.
 */
function liveStorage(now: Date): MockStorageBooking[] {
  const days = demoDayShift(now);
  const raw = storageData as unknown as { data: MockStorageBooking[] };
  if (days === 0) return raw.data;
  return raw.data.map((b) => {
    const startIso = shiftDay(b.startIso, days);
    const endIso = shiftDay(b.endIso, days);
    return {
      ...b,
      startIso,
      endIso,
      bookingStart: displayDay(startIso),
      bookingEnd: displayDay(endIso),
    };
  });
}

interface MockStorageBooking {
  id: string;
  rowId: string;
  buildingId: string;
  unitNumber: string;
  residentName: string;
  storageNumber: string;
  storageOwnerName: string | null;
  storageType: string;
  storageSize: string;
  location: string;
  startIso: string;
  endIso: string;
  hasNote: boolean;
  [key: string]: unknown;
}

function deriveStatus(startIso: string, endIso: string, now: Date): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (start > now) return "Upcoming";
  if (end <= now) return "Completed";
  return "Active";
}

export function buildMockStorageBookingsResponse(params: URLSearchParams) {
  const buildingId = params.get("buildingId");
  const tab = params.get("tab") ?? "current";
  const status = params.get("status");
  const notes = params.get("notes");
  const search = params.get("search")?.trim().toLowerCase() || "";

  const now = new Date();

  const rows = liveStorage(now)
    .map((b) => ({ ...b, status: deriveStatus(b.startIso, b.endIso, now) }))
    .filter((b) => {
      if (buildingId && b.buildingId !== buildingId) return false;

      const start = new Date(b.startIso);
      const end = new Date(b.endIso);
      if (tab === "current" && !(start <= now && end > now)) return false;
      if (tab === "future" && !(start > now)) return false;
      if (tab === "past" && !(end <= now)) return false;

      if (status && status !== "All" && b.status !== status) return false;
      if (notes === "Has note" && !b.hasNote) return false;
      if (notes === "No note" && b.hasNote) return false;

      if (search) {
        const haystack = [
          b.id,
          b.unitNumber,
          b.storageNumber,
          b.residentName,
          b.storageOwnerName,
          b.storageType,
          b.location,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      return true;
    });

  return { data: rows, total: rows.length };
}
