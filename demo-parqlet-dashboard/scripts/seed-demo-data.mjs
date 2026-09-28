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

  const push = (startOffsetHours, durationHours, status) => {
    // A quarter of an Apartment's bookings are on a spot a resident lent.
    // An HOA's are all on residents' spots - nobody else owns any.
    const shared = !owned || (sharedSpots.length > 0 && i % 4 === 3);
    const buildingOwned = !shared;
    const spotList = shared && owned ? sharedSpots : spots;
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
    const paidWithCredit = shared ? i % 8 !== 3 : i % 5 === 1;
    const extraCents = spotPriceCents(pick(spotList, i)) - BASE_CENTS;
    const start = new Date(now.getTime() + startOffsetHours * 3600_000);
    start.setMinutes(i % 2 === 0 ? 0 : 30, 0, 0);
    const end = new Date(start.getTime() + durationHours * 3600_000);
    const unitLetter = "ABCDEF"[i % 6];
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
        ? (paidWithCredit ? extraCents : spotPriceCents(pick(spotList, i))) * days
        : paidWithCredit
          ? null
          : BASE_CENTS * days,
      commissionPct: buildingOwned || !paidWithCredit ? COMMISSION_PCT : null,
      createdAt: new Date(start.getTime() - 86_400_000).toISOString(),
      updatedAt: new Date(start.getTime() - 86_400_000).toISOString(),
      idShort: uuid(i).slice(-6),
      notes: [],
      unitNumber: `${1 + (i % 9)}${unitLetter}`,
      spotNumber: pick(spotList, i),
      spotOwnerName: shared ? name(i * 5 + 2) : null,
      spotOwnerPhone: shared ? `(555) 10${i % 10}-${1000 + ((i * 17) % 9000)}` : null,
      i,
    });
    i++;
  };

  // Running right now — started a few hours ago, ends later today.
  for (let n = 0; n < counts.current; n++) push(-(2 + (n % 6)), 8 + (n % 10), "Active");
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

/** Oakline Park spots that RESIDENTS share - the 401+ blocks. */
const APARTMENT_SHARED_SPOTS = ["403", "409", "418", "424", "433", "438"];

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
