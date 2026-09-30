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

export type DemoSpot = {
  id: string;
  number: string;
  type: 'Compact' | 'Standard' | 'Large SUV';
  evCharger: boolean;
  /**
   * Who is sharing the spot, which decides whether it can carry an extra.
   *
   * A RESIDENT sharing their own space is on the same footing as a resident
   * in a Condo: they list it, someone books it for the base credit, and
   * that is the end of it. They do not set a price, here or in a Condo.
   * Pricing is the building's decision, exactly as it is on HOA today.
   *
   * The BUILDING is the only party that can charge above the base, and
   * only on the spots it owns outright.
   */
  owner: 'resident' | 'building';
  /**
   * What it is sold as: Basic / Standard / Premium / Open Air. Standard is
   * the default, the same as the real dashboard, where a spot with no tier
   * set is Standard rather than untyped.
   */
  tier: SpotTier;
  /**
   * Dollars added on top of the base credit. Always zero on a resident's
   * spot. On the building's own spots it is whatever the building wants:
   * a space by the lift is worth more than one on the roof.
   *
   * Stored as the extra rather than the total, so raising the base
   * reprices the whole garage in one edit - which is what a building
   * actually wants when it changes rates.
   */
  extraCents: number;
};

/** What a renter pays for this spot: the base credit, plus any extra. */
export function spotPriceCents(s: Pick<DemoSpot, 'extraCents'>): number {
  return apartmentSpotTotalCents(s.extraCents);
}

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
export const SPOT_TIERS = ['Basic', 'Standard', 'Premium', 'Open Air'] as const;
export type SpotTier = (typeof SPOT_TIERS)[number];

export function spotTierLabel(s: Pick<DemoSpot, 'owner' | 'tier'>): string {
  // A resident does not price their spot, so there is nothing for a tier
  // to mean on it.
  return s.owner === 'building' ? s.tier : 'Resident spot';
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

/** True when the building may set an extra on this spot. */
export function canPrice(s: Pick<DemoSpot, 'owner'>): boolean {
  return s.owner === 'building';
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
 * Spots are NUMBERED, not lettered, because the building prices its own in
 * ranges - "1 to 100 at this rate, 200 to 300 at that one". A scheme like
 * C1 / B7 / R3 cannot express that.
 *
 * Deliberate gaps between the blocks, so a range like 200-300 selects
 * exactly the second block and a demo of the bulk pricing tool has
 * something visible to do.
 *
 * The 400s are residents' own spots. They are in the list on purpose: the
 * building can see them, but the price column is fixed at the base, which
 * is the rule made visible.
 */
function buildSpots(): DemoSpot[] {
  const out: DemoSpot[] = [];
  const block = (
    from: number,
    count: number,
    owner: DemoSpot['owner'],
    extra: number,
    tier: SpotTier,
  ) => {
    for (let n = 0; n < count; n++) {
      const number = from + n;
      out.push({
        id: `s${number}`,
        number: String(number),
        type: n % 7 === 0 ? 'Large SUV' : n % 3 === 0 ? 'Compact' : 'Standard',
        evCharger: n % 6 === 0,
        owner,
        tier,
        extraCents: owner === 'building' ? money(extra) : 0,
      });
    }
  };
  // The building's own spots, one block per tier, so all four appear on
  // screen rather than three of them. On the $6 base these come to $15,
  // $10, $8 and $7 a day.
  //
  // Price and tier are set together here because that is how a garage is
  // actually laid out, but they are SEPARATE fields: the dashboard lets a
  // manager reprice a level without renaming it, and the demo has to be
  // able to show that.
  block(1, 40, 'building', 9, 'Premium');
  block(201, 30, 'building', 4, 'Standard');
  block(301, 10, 'building', 2, 'Open Air');
  block(311, 10, 'building', 1, 'Basic');
  // Residents sharing their own assigned spaces. Base credit, no extra,
  // and no tier of their own - `spotTierLabel` reports them as resident
  // spots rather than as Standard.
  block(401, 24, 'resident', 0, 'Standard');
  block(431, 11, 'resident', 0, 'Standard');
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
