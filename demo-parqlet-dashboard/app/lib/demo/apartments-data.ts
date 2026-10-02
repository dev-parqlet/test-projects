/**
 * Sample figures for the Apartments demo.
 *
 * Generated relative to "now" rather than hard-coded, so the demo shows a
 * live-looking month whenever it is opened instead of decaying into a
 * building that apparently stopped trading in August.
 */

import {
  BASE_PRICE_CENTS,
  COMMISSION_PCT,
  apartmentSpotTotalCents,
  commission,
  formatMoney,
  money,
  netToBuilding,
} from './pricing';

// Re-exported so screens keep importing their figures from one place. The
// arithmetic itself lives in pricing.ts, shared with the Condo side.
export { COMMISSION_PCT, formatMoney, netToBuilding };

/**
 * What a spot is SOLD AS.
 *
 * STORED, not derived from the price. It used to be read back out of the
 * extra - $9 meant "Lower level", $2 meant "Rooftop" - which tied the name
 * to the rate and meant repricing a level silently renamed it. It is also
 * not how the real dashboard works: there a manager picks the tier with a
 * bulk rule and the price is a separate decision, so deriving one from the
 * other here would demo something the product does not do.
 *
 * `type` (Compact / Standard / Large SUV) is a DIFFERENT axis: what FITS in
 * the space, not what it is sold as. A Premium spot can be Compact.
 */
export const SPOT_TIERS = ['Basic', 'Standard', 'Premium', 'Open air'] as const;
export type SpotTier = (typeof SPOT_TIERS)[number];

/**
 * Where a spot stands TODAY, derived from its lease rather than stored.
 *
 *   rentable      Nobody's lease covers it, so the building rents it out
 *                 on Parqlet and prices it itself.
 *   move-in-soon  A unit's lease starts on a known date. It is still
 *                 rentable, but only up to the day before that date.
 *   assigned      It is on a unit's lease today. It costs the base and
 *                 the building cannot price it; the resident may share it
 *                 from their phone, exactly as in a Condo.
 *
 * DERIVED on purpose. A stored status is a second copy of the lease, and
 * the two drift the moment a lease is signed, ended or moved - which is
 * every week in a 180-space garage.
 */
export type SpotStatus = 'rentable' | 'move-in-soon' | 'assigned';

export type DemoSpot = {
  id: string;
  number: string;
  /** What FITS in the space. A different axis from `tier`. */
  type: 'Compact' | 'Standard' | 'Large SUV';
  tier: SpotTier;
  evCharger: boolean;
  /**
   * The unit whose lease this spot sits on, e.g. "804", or null while the
   * building holds it.
   *
   * THIS IS THE FIELD THE INTEGRATION OWNS. A building does not keep a
   * spreadsheet of which spaces are free this month - it keeps leases, in
   * AppFolio or Yardi or whatever it runs on, and the parking assignment
   * is a line on the lease. Pulling it is the only way the free spots stay
   * correct without somebody reconciling them by hand every month, which
   * nobody will do. Spots can still be added by hand (a visitor bay, a
   * garage the system does not know about) - those simply arrive with no
   * unit.
   */
  unit: string | null;
  /**
   * ISO date `unit`'s lease starts, when that is still in the FUTURE.
   *
   * Null on a lease already running. This is the other half of what the
   * integration buys: knowing a space is free is worthless if you cannot
   * also say how long for, and a booking that runs past the new
   * resident's move-in is a car in somebody's space on their first day.
   */
  moveInAt: string | null;
  /**
   * A building-held spot the operator has taken off Parqlet for now -
   * resurfacing, a contractor's van, a dispute.
   *
   * Deliberately NOT a fourth status: the spot is still rentable, and the
   * lease has not changed. Making it one would have put a row in "Paused"
   * that also belongs in "Rentable", and the counts would stop summing to
   * the total.
   */
  paused: boolean;
  /**
   * Dollars added on top of the base credit. Always zero on an assigned
   * spot. On the building's own spots it is whatever the building wants:
   * a space by the lift is worth more than one on the roof.
   *
   * Stored as the extra rather than the total, so raising the base
   * reprices the whole garage in one edit - which is what a building
   * actually wants when it changes rates.
   */
  extraCents: number;
};

/** Where a spot stands today. See `SpotStatus`. */
export function spotStatus(
  s: Pick<DemoSpot, 'unit' | 'moveInAt'>,
  now: Date = new Date(),
): SpotStatus {
  if (!s.unit) return 'rentable';
  // A move-in date that has come and gone is just a lease, so the spot is
  // assigned. Treating it as "soon" forever would leave a stale amber row
  // on the screen for the rest of the tenancy.
  if (s.moveInAt && new Date(s.moveInAt) > now) return 'move-in-soon';
  return 'assigned';
}

export const SPOT_STATUS_LABEL: Record<SpotStatus, string> = {
  rentable: 'Rentable',
  'move-in-soon': 'Move-in soon',
  assigned: 'Assigned',
};

/** The last day a move-in-soon spot can be booked: the day before the lease starts. */
export function bookableUntil(s: Pick<DemoSpot, 'unit' | 'moveInAt'>): Date | null {
  if (!s.moveInAt || spotStatus(s) !== 'move-in-soon') return null;
  const d = new Date(s.moveInAt);
  d.setDate(d.getDate() - 1);
  return d;
}

/** "Oct 15" — the one date format this screen uses. */
export function formatSpotDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** What a renter pays for this spot: the base credit, plus any extra. */
export function spotPriceCents(s: Pick<DemoSpot, 'extraCents'>): number {
  return apartmentSpotTotalCents(s.extraCents);
}

/**
 * True when the building may set an extra on this spot, delete it, or put
 * it on Parqlet - i.e. when no lease covers it today.
 *
 * A move-in-soon spot counts: it is the building's until the new resident
 * arrives, and the whole point of knowing the date is to sell the days
 * before it.
 */
export function canPrice(s: Pick<DemoSpot, 'unit' | 'moveInAt'>): boolean {
  return spotStatus(s) !== 'assigned';
}

/** True when the spot is actually offered on Parqlet right now. */
export function isBookable(s: Pick<DemoSpot, 'unit' | 'moveInAt' | 'paused'>): boolean {
  return canPrice(s) && !s.paused;
}

export function spotTierLabel(s: Pick<DemoSpot, 'unit' | 'moveInAt' | 'tier'>): string {
  // A resident does not price their spot, so there is nothing for a tier
  // to mean on it.
  return canPrice(s) ? s.tier : 'Resident spot';
}

/** The tier of a spot NUMBER, for rows that carry only the number. */
export function tierForSpotNumber(spotNumber: string): string {
  const spot = DEMO_SPOTS.find((s) => s.number === spotNumber);
  return spot ? spotTierLabel(spot) : '—';
}

/** What one day on this spot is listed at, for rows that carry only the number. */
export function priceForSpotNumber(spotNumber: string): number | null {
  const spot = DEMO_SPOTS.find((s) => s.number === spotNumber);
  return spot ? spotPriceCents(spot) : null;
}

/** How many spots sit in each status, for the filter chips. */
export function countByStatus(spots: DemoSpot[]): Record<SpotStatus, number> {
  const out: Record<SpotStatus, number> = { rentable: 0, 'move-in-soon': 0, assigned: 0 };
  for (const s of spots) out[spotStatus(s)]++;
  return out;
}

export type DemoPayout = {
  id: string;
  /** Month the earnings were taken in, e.g. "August 2026". */
  period: string;
  grossCents: number;
  commissionCents: number;
  netCents: number;
  status: 'Paid' | 'Processing';
  paidOn: string | null;
};


/**
 * The demo garage: 180 spaces, of which the building can only sell the
 * ones no lease covers.
 *
 * The SHAPE is the pitch. 159 of the 180 are on somebody's lease and the
 * building earns nothing on them directly; 18 are empty and 3 come free
 * in the next month. A demo weighted the other way - a garage of vacant
 * spaces - would show a building with a far bigger problem than parking,
 * and would hide the thing the screen exists to make obvious: finding
 * those 21 by hand, every month, is work nobody does, which is why the
 * lease system has to be plugged in.
 *
 * Numbered rather than lettered, because the building prices its own in
 * ranges - "1 to 40 at this rate, 301 to 330 at that one" - and a scheme
 * like C1 / B7 / R3 cannot express that. The blocks have deliberate gaps,
 * so a range in the bulk editor selects exactly one level.
 */

/** Dollars over the base, per tier. On the $6 base: $15, $10, $8, $7. */
const TIER_EXTRA: Record<SpotTier, number> = {
  Premium: 9,
  Standard: 4,
  'Open air': 2,
  Basic: 1,
};

/**
 * The first ten spaces, written out rather than generated.
 *
 * This is page one sorted by status - the first thing anyone sees - so it
 * is composed instead of left to a modulus: all three statuses, all three
 * sizes, all three of the tiers that carry an extra, an EV space on each
 * side of the lease line, and two move-ins a week apart so the "bookable
 * until" dates differ. Everything from 11 up is generated.
 */
const FRONT_ROW: {
  number: number;
  type: DemoSpot['type'];
  tier: SpotTier;
  ev: boolean;
  /** Unit on the lease, or null when the building holds it. */
  unit: string | null;
  /** Days from today until that lease starts. Only on a future one. */
  moveInDays?: number;
}[] = [
  { number: 1,  type: 'Large SUV', tier: 'Premium',  ev: true,  unit: null },
  { number: 2,  type: 'Standard',  tier: 'Premium',  ev: false, unit: null },
  { number: 3,  type: 'Standard',  tier: 'Premium',  ev: false, unit: '1102', moveInDays: 13 },
  { number: 4,  type: 'Compact',   tier: 'Standard', ev: false, unit: '804' },
  { number: 5,  type: 'Standard',  tier: 'Standard', ev: false, unit: '1204' },
  { number: 6,  type: 'Standard',  tier: 'Standard', ev: false, unit: null },
  { number: 7,  type: 'Compact',   tier: 'Open air', ev: true,  unit: '302' },
  { number: 8,  type: 'Large SUV', tier: 'Premium',  ev: false, unit: '905', moveInDays: 20 },
  { number: 9,  type: 'Standard',  tier: 'Open air', ev: false, unit: null },
  { number: 10, type: 'Standard',  tier: 'Premium',  ev: false, unit: '1507' },
];

/** The levels, after the hand-written first ten. One tier each. */
const BLOCKS: { from: number; to: number; tier: SpotTier }[] = [
  { from: 11,  to: 40,  tier: 'Premium' },
  { from: 101, to: 120, tier: 'Standard' },
  { from: 201, to: 250, tier: 'Standard' },
  { from: 301, to: 330, tier: 'Open air' },
  { from: 401, to: 440, tier: 'Basic' },
];

/**
 * The spaces above 10 that no lease covers, and the one that frees up
 * next month.
 *
 * Listed rather than computed from a modulus, so the vacancies fall where
 * a garage's vacancies fall - a handful on each level, not every nth bay -
 * and so the count stays at 18 rentable and 3 move-in-soon however the
 * blocks are later resized.
 */
const VACANT = [14, 27, 33, 105, 112, 118, 207, 219, 236, 244, 308, 317, 326, 412];
const MOVING_IN: { number: number; unit: string; days: number }[] = [
  { number: 212, unit: '611', days: 27 },
];

function buildSpots(now: Date = new Date()): DemoSpot[] {
  const dateIn = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  };

  const make = (
    number: number,
    type: DemoSpot['type'],
    tier: SpotTier,
    ev: boolean,
    unit: string | null,
    moveInAt: string | null,
  ): DemoSpot => ({
    id: `s${number}`,
    number: String(number),
    type,
    tier,
    evCharger: ev,
    unit,
    moveInAt,
    paused: false,
    // A spot on a lease costs the base and nothing else, whatever tier it
    // is filed under - the rule made data rather than documented.
    extraCents: unit && !moveInAt ? 0 : money(TIER_EXTRA[tier]),
  });

  const out: DemoSpot[] = FRONT_ROW.map((s) =>
    make(s.number, s.type, s.tier, s.ev, s.unit, s.moveInDays ? dateIn(s.moveInDays) : null),
  );

  const vacant = new Set(VACANT);
  const movingIn = new Map(MOVING_IN.map((m) => [m.number, m]));
  // Deterministic rather than random: two people comparing demo screens
  // have to be looking at the same garage.
  let seat = 0;
  for (const block of BLOCKS) {
    for (let n = block.from; n <= block.to; n++) {
      seat++;
      const type: DemoSpot['type'] =
        seat % 7 === 0 ? 'Large SUV' : seat % 3 === 0 ? 'Compact' : 'Standard';
      const ev = seat % 6 === 0;
      const soon = movingIn.get(n);
      if (soon) {
        out.push(make(n, type, block.tier, ev, soon.unit, dateIn(soon.days)));
      } else if (vacant.has(n)) {
        out.push(make(n, type, block.tier, ev, null, null));
      } else {
        // Units run 2 to 15, eight to a floor, so the numbers read like a
        // building rather than like a counter.
        const floor = 2 + (seat % 14);
        const door = 1 + (seat % 8);
        out.push(make(n, type, block.tier, ev, `${floor}${String(door).padStart(2, '0')}`, null));
      }
    }
  }
  return out;
}

export const DEMO_SPOTS: DemoSpot[] = buildSpots();


/** Headline used wherever the base needs explaining next to an extra. */
export const BASE_LABEL = `1 credit (${formatMoney(BASE_PRICE_CENTS)})`;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * The last `count` COMPLETED months, newest first. All paid.
 *
 * The month in progress is deliberately absent: it has not been withdrawn
 * yet, and listing it as "processing" put last month's name on the "your
 * withdrawal is still processing" notice while the card above it talked
 * about this month. A withdrawal in flight belongs to the month you are
 * standing in, so the page composes that row itself.
 */
export function recentPayouts(count = 5, now = new Date()): DemoPayout[] {
  const out: DemoPayout[] = [];
  for (let i = 1; i <= count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    // Deterministic rather than random: a demo that shows different numbers
    // on every refresh looks broken when two people compare screens.
    // Sized to bracket the month in progress, so the history reads as the
    // same building rather than one that has just collapsed or trebled.
    const grossCents = money(730 + ((d.getMonth() * 137) % 340));
    const netCents = netToBuilding(grossCents);
    out.push({
      id: `p${i}`,
      period: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      grossCents,
      commissionCents: grossCents - netCents,
      netCents,
      status: 'Paid',
      paidOn: new Date(d.getFullYear(), d.getMonth() + 1, 3).toISOString(),
    });
  }
  return out;
}

/** The month name a withdrawal requested right now would belong to. */
export function currentPeriodLabel(now = new Date()): string {
  return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}

/**
 * Earnings so far in the current, still-open month.
 *
 * About $20 a day taken at the till, which lands the month near $430 after
 * our commission and the card fees - deliberately SHORT of the $500
 * subscription. A month that clears its bill exactly draws a full bar and
 * a $0.00 invoice, which shows the mechanic at its least legible: the
 * whole point of the card is that earnings eat the bill, and a bar you can
 * see the end of says that where a full one does not.
 *
 * The cost of that choice: with nothing over the subscription there is no
 * surplus, so the Apartment demo shows no payout and no "connect a bank
 * account" banner. Raise this above ~$23/day to get them back.
 */
export function currentPeriod(now = new Date()) {
  const grossCents = money(20 * now.getDate());
  const netCents = netToBuilding(grossCents);
  return {
    period: `${MONTHS[now.getMonth()]} ${now.getFullYear()}`,
    grossCents,
    commissionCents: grossCents - netCents,
    netCents,
  };
}

export { commission };
