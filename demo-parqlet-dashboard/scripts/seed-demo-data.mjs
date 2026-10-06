/**
 * Re-anchor the demo's bookings to the day it is built.
 *
 * The mock data shipped with the dashboard is a frozen snapshot: its dates
 * sit in May–August, so by the time anyone opens the demo the "Current
 * bookings" tab — the first thing on the busiest screen — is empty, and the
 * building looks like it stopped trading months ago.
 *
 * This runs on `prebuild`, so every deploy produces a building that is busy
 * *today*: some bookings running right now, a full week ahead, and a
 * believable history behind.
 *
 * Deterministic on purpose. Two people comparing screens during a demo must
 * see the same numbers, so everything is derived from the row index rather
 * than Math.random().
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const FILE = path.join(ROOT, "app/lib/mock-data/bookings.json");
const RESIDENTS_FILE = path.join(ROOT, "app/lib/mock-data/residents.json");

/**
 * WHO OWNS WHICH SPOT, read straight out of residents.json.
 *
 * `parkingSpotNumbers` on a resident row is the only statement anywhere
 * in the demo about who owns a spot, and the Resident Directory renders
 * it directly. So a booking has to read the owner off THE SPOT, not pick
 * a plausible name.
 *
 * It used to pick: `pool[SHARER_PATTERN[i % 16] % 6]`, keyed on the
 * booking index while the spot was keyed on the same index through a
 * different cycle. The two drifted, so one spot showed different owners
 * on different bookings, and the first three Current bookings - indices
 * 0, 1, 2, which the pattern maps to 0, 0, 0 - all showed the SAME
 * owner on three DIFFERENT spots. That is the "Liam Baker owns
 * everything" the demo kept showing (reported 2026-10-06, three times,
 * because fixing the generated file by hand could not survive the next
 * `prebuild`).
 *
 * Keyed on the spot, the Bookings table and the Resident Directory
 * cannot disagree: there is one fact and one place it comes from.
 */
function spotOwnersByBuilding() {
  try {
    const raw = JSON.parse(fs.readFileSync(RESIDENTS_FILE, "utf-8"));
    const rows = (Array.isArray(raw) ? raw : raw.data) ?? [];
    const out = new Map();
    for (const r of rows) {
      if (!r?.name || !r?.buildingId || !r?.parkingSpotNumbers) continue;
      if (!out.has(r.buildingId)) out.set(r.buildingId, new Map());
      // The field is a comma-separated string - a resident may own more
      // than one spot, and each maps back to the same person.
      for (const spot of String(r.parkingSpotNumbers).split(",")) {
        const key = spot.trim();
        if (key) out.get(r.buildingId).set(key, { name: r.name, phone: r.phone });
      }
    }
    return out;
  } catch {
    return new Map();
  }
}
const SPOT_OWNERS = spotOwnersByBuilding();

/** The resident who owns this spot, or null if the building owns it. */
function spotOwner(buildingId, spotNumber) {
  return SPOT_OWNERS.get(buildingId)?.get(String(spotNumber)) ?? null;
}

const HOA = "e6565d1b-1f25-4c51-bfa6-7db4932702cd";        // The Meridian
const APARTMENTS = "80f9ac2e-b884-4634-ac02-0682a9a12662"; // Oakline Park

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/** The exact shape lib/parse-booking-date.ts expects: "6:20am, Aug 21". */
function fmt(d) {
  let h = d.getHours();
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  const min = d.getMinutes();
  const time = min === 0 ? `${h}${ampm}` : `${h}:${String(min).padStart(2, "0")}${ampm}`;
  return `${time}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

const FIRST = ["Emma","Liam","Olivia","Noah","Ava","Ethan","Sophia","Mason","Isabella","Lucas",
               "Mia","Logan","Charlotte","James","Amelia","Benjamin","Harper","Elijah","Evelyn","Henry"];
const LAST  = ["Anderson","Baker","Clark","Davis","Evans","Foster","Garcia","Hughes","Irwin","Jenkins",
               "Kelly","Lopez","Murphy","Nelson","Owens","Parker","Quinn","Reed","Simmons","Turner"];
const VEHICLES = ["Compact","Standard","Large SUV"];

const pick = (arr, i) => arr[i % arr.length];
const name = (i) => `${pick(FIRST, i)} ${pick(LAST, i * 7 + 3)}`;
const plate = (i) => `${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + ((i * 3) % 26))}${String.fromCharCode(65 + ((i * 5) % 26))}-${1000 + ((i * 137) % 9000)}`;
const phone = (prefix, i) => `+1555${prefix}${String(1000 + ((i * 31) % 9000)).slice(0, 4)}`;

function uuid(seed) {
  // Stable pseudo-uuid so ids do not churn between builds.
  const hex = (n) => (n >>> 0).toString(16).padStart(8, "0");
  const a = hex(seed * 2654435761);
  const b = hex(seed * 40503 + 12345);
  return `${a}-${b.slice(0, 4)}-4${b.slice(4, 7)}-8${a.slice(1, 4)}-${b}${a.slice(0, 4)}`;
}

/**
 * @param buildingId which building the rows belong to
 * @param counts     how many of each kind
 * @param spots      spot numbers to cycle through
 * @param owned      true for Apartments: most spots are the BUILDING's, so
 *                   there is no resident spot-owner to name. Not every one,
 *                   though - see `sharedSpots`.
 * @param sharedSpots  Apartments only: spot numbers RESIDENTS share, from
 *                   the 401+ blocks in app/lib/demo/apartments-data.ts.
 *                   Every fourth booking lands on one, paid with a credit
 *                   rather than a card, because an Apartment really does
 *                   carry both kinds and a corpus of nothing but the
 *                   building's own spots makes the dashboard look like it
 *                   has one. Pass nothing for an HOA, where every spot is
 *                   a resident's.
 */
function makeBookings(buildingId, counts, spots, owned, startIndex, sharedSpots = []) {
  const now = new Date();
  const rows = [];
  let i = startIndex;

  /**
   * When each spot is already taken, so two cars are never parked in one
   * space at the same time.
   *
   * Round-robin on the row index is not enough: the four groups below
   * (current / upcoming / pending / past) each walk the spot list on the
   * same counter but lay down overlapping time windows, so an "upcoming"
   * booking and a "pending" one would land on the same spot on the same
   * afternoon. The demo showed exactly that - three double-booked spots,
   * reported by the client 2026-10-02.
   */
  const busy = new Map();
  const free = (spot, startMs, endMs) =>
    !(busy.get(spot) ?? []).some(([s0, e0]) => startMs < e0 && endMs > s0);

  const push = (startOffsetHours, durationHours, status) => {
    // A quarter of an Apartment's bookings are on a spot a resident lent.
    // An HOA's are all on residents' spots - nobody else owns any.
    const wantShared = !owned || (sharedSpots.length > 0 && i % 4 === 3);
    const spotList = wantShared && owned ? sharedSpots : spots;
    const days = Math.max(1, Math.ceil(durationHours / 24));

    /**
     * Paid with a credit, or by card?
     *
     * Both happen in both products, and the four combinations of this and
     * whose spot it was are the four rows of the pricing spec's split
     * table. A corpus that only ever shows two of them cannot demonstrate
     * the rule, so the mix is deliberate rather than incidental: most
     * bookings on a resident's spot spend a credit, most on the building's
     * own are paid outright.
     */
    const start = new Date(now.getTime() + startOffsetHours * 3600_000);
    start.setMinutes(i % 2 === 0 ? 0 : 30, 0, 0);
    const end = new Date(start.getTime() + durationHours * 3600_000);
    const unitLetter = "ABCDEF"[i % 6];

    // Start where the round robin would have put it, then walk the list
    // until a spot is actually free for this window. Still deterministic
    // - same input, same walk, same answer on every build.
    const offset = spotList.indexOf(pick(spotList, i));
    let spotNumber = pick(spotList, i);
    for (let k = 0; k < spotList.length; k++) {
      const candidate = spotList[(offset + k) % spotList.length];
      if (free(candidate, start.getTime(), end.getTime())) {
        spotNumber = candidate;
        break;
      }
    }
    busy.set(spotNumber, [...(busy.get(spotNumber) ?? []), [start.getTime(), end.getTime()]]);

    const owner = spotOwner(buildingId, spotNumber);
    const shared = owner !== null;
    const buildingOwned = !shared;
    const paidWithCredit = shared ? i % 8 !== 3 : i % 5 === 1;
    const extraCents = spotPriceCents(spotNumber) - BASE_CENTS;
    rows.push({
      id: uuid(i),
      buildingId,
      residentId: null,
      residentName: name(i),
      residentPhone: phone("2", i),
      residentEmail: `${pick(FIRST, i).toLowerCase()}.${pick(LAST, i * 7 + 3).toLowerCase()}@email.com`,
      guestName: name(i * 3 + 11),
      guestPhone: phone("3", i),
      licensePlate: plate(i),
      vehicleType: pick(VEHICLES, i),
      bookingStart: fmt(start),
      bookingEnd: fmt(end),
      status,
      hasNote: i % 9 === 0,
      creditsSpent: paidWithCredit ? days : 0,
      /**
       * The dollars actually charged to a card, which is NOT the price of
       * the booking whenever a credit covered the base.
       *
       *   resident's spot, credit   nothing - the credit is the whole fare
       *   resident's spot, card     the base, which buys the credit inline
       *   building's spot, card     base + extra, the whole price
       *   building's spot, credit   the extra only; the base was a credit
       *
       * The dashboard derives our commission from this rather than storing
       * a second, divergent number.
       */
      amountCents: buildingOwned
        ? (paidWithCredit ? extraCents : spotPriceCents(spotNumber)) * days
        : paidWithCredit
          ? null
          : BASE_CENTS * days,
      commissionPct: buildingOwned || !paidWithCredit ? COMMISSION_PCT : null,
      createdAt: new Date(start.getTime() - 86_400_000).toISOString(),
      updatedAt: new Date(start.getTime() - 86_400_000).toISOString(),
      idShort: uuid(i).slice(-6),
      notes: [],
      unitNumber: `${1 + (i % 9)}${unitLetter}`,
      spotNumber,
      spotOwnerName: owner?.name ?? null,
      spotOwnerPhone: owner?.phone ?? null,
      i,
    });
    i++;
  };

  /**
   * Running right now — started a few hours ago, ends later today.
   *
   * "Assigned", NOT "Active". The backend has no Active status: a
   * booking in progress is an Assigned one whose window contains now,
   * and the dashboard derives the green "Active" badge from the tab it
   * is rendered under. The condo Bookings table checks the status
   * against a whitelist of real backend statuses and falls back to
   * "Expired" for anything else, so seeding "Active" made every
   * in-progress booking render as EXPIRED (reported 2026-10-06).
   */
  for (let n = 0; n < counts.current; n++) push(-(2 + (n % 6)), 8 + (n % 10), "Assigned");
  // The week ahead.
  for (let n = 0; n < counts.upcoming; n++) push(6 + n * 9, 6 + (n % 12), "Assigned");
  // Waiting on a spot owner. Only meaningful for an HOA.
  for (let n = 0; n < counts.pending; n++) push(20 + n * 14, 10, "PendingApproval");
  // History.
  for (let n = 0; n < counts.past; n++) push(-(30 + n * 19), 5 + (n % 9), n % 7 === 0 ? "Cancelled" : "Completed");

  return rows.map(({ i: _i, ...r }) => r);
}

// Must line up with the numbered blocks in app/lib/demo/apartments-data.ts,
// or a booking cites a spot the Parking Spots page does not list.
const APARTMENT_SPOTS = ["4", "11", "23", "38", "204", "217", "228", "305", "312"];

/**
 * Oakline Park spots that RESIDENTS share - the 401+ block.
 *
 * Derived from residents.json rather than written out, because a
 * hardcoded list drifts: it used to name 403, 418 and 433, which NO
 * resident owns, so every fourth Apartment booking claimed to be on a
 * neighbour's spot and then showed an empty Spot Owner column.
 */
const APARTMENT_SHARED_SPOTS = [...(SPOT_OWNERS.get(APARTMENTS)?.keys() ?? [])]
  .filter((n) => Number(n) >= 401 && Number(n) <= 440)
  .sort((a, b) => Number(a) - Number(b));

/**
 * Daily price for a numbered spot, mirroring the blocks in
 * app/lib/demo/apartments-data.ts. Kept in step by hand because the seeder
 * is plain node and the data module is TypeScript; if the blocks there
 * change, change them here too or a booking will quote a price the Parking
 * Spots page disagrees with.
 */
function spotPriceCents(number) {
  const n = Number(number);
  // base + the block's extra. These WERE flat figures that owed nothing to
  // the blocks above, so a booking on spot #11 charged $15 while the
  // Parking Spots page priced the same spot at $25.
  if (n >= 1 && n <= 40) return BASE_CENTS + 900;
  if (n >= 201 && n <= 230) return BASE_CENTS + 400;
  return BASE_CENTS + 200;
}

const COMMISSION_PCT = 20;
/** Keep in step with CREDIT_PRICE_CENTS in app/lib/demo/pricing.ts. */
const BASE_CENTS = 600;
const HOA_SPOTS = ["419", "251", "222", "519", "108", "330"];

const data = [
  // Oakline Park is the one being pitched, so it is the busy building.
  ...makeBookings(APARTMENTS, { current: 6, upcoming: 14, pending: 0, past: 22 }, APARTMENT_SPOTS, true, 1, APARTMENT_SHARED_SPOTS),
  ...makeBookings(HOA, { current: 3, upcoming: 8, pending: 3, past: 14 }, HOA_SPOTS, false, 500),
];

fs.writeFileSync(
  FILE,
  JSON.stringify({ data, total: data.length, page: 1, pageSize: 20 }, null, 2),
);

const byBuilding = data.reduce((acc, r) => {
  acc[r.buildingId === APARTMENTS ? "Oakline Park" : "The Meridian"] ??= 0;
  acc[r.buildingId === APARTMENTS ? "Oakline Park" : "The Meridian"]++;
  return acc;
}, {});
console.log(`[seed-demo-data] ${data.length} bookings anchored to ${new Date().toDateString()}`, byBuilding);
