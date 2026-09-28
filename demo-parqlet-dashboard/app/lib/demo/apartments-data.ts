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
  level: string;
  type: 'Compact' | 'Standard' | 'Large SUV';
  covered: boolean;
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
   * Dollars added on top of the base credit. Always zero on a resident's
   * spot. On the building's own spots it is whatever the building wants:
   * a covered space by the lift is worth more than one on the roof.
   *
   * Stored as the extra rather than the total, so raising the base
   * reprices the whole garage in one edit - which is what a building
   * actually wants when it changes rates.
   */
  extraCents: number;
  status: 'Listed' | 'Unlisted';
};

/** What a renter pays for this spot: the base credit, plus any extra. */
export function spotPriceCents(s: Pick<DemoSpot, 'extraCents'>): number {
  return apartmentSpotTotalCents(s.extraCents);
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
 * building can see them and can unlist one, but the price column is fixed
 * at the base, which is the rule made visible.
 */
function buildSpots(): DemoSpot[] {
  const out: DemoSpot[] = [];
  const block = (
    from: number,
    count: number,
    level: string,
    covered: boolean,
    owner: DemoSpot['owner'],
    extra: number,
  ) => {
    for (let n = 0; n < count; n++) {
      const number = from + n;
      out.push({
        id: `s${number}`,
        number: String(number),
        level,
        type: n % 7 === 0 ? 'Large SUV' : n % 3 === 0 ? 'Compact' : 'Standard',
        covered,
        evCharger: n % 6 === 0,
        owner,
        extraCents: owner === 'building' ? money(extra) : 0,
        status: n % 11 === 0 ? 'Unlisted' : 'Listed',
      });
    }
  };
  // The building's own spots. Level 1 is covered and closest to the lifts,
  // so it carries the largest extra; the roof carries none.
  block(1, 40, 'P1', true, 'building', 10);
  block(201, 30, 'P2', true, 'building', 5);
  block(301, 20, 'Roof', false, 'building', 0);
  // Residents sharing their own assigned spaces. Base credit, no extra.
  block(401, 24, 'P1', true, 'resident', 0);
  block(431, 11, 'P2', true, 'resident', 0);
  return out;
}

export const DEMO_SPOTS: DemoSpot[] = buildSpots();

/** Headline used wherever the base needs explaining next to an extra. */
export const BASE_LABEL = `1 credit (${formatMoney(BASE_PRICE_CENTS)})`;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** The last `count` completed months, newest first. */
export function recentPayouts(count = 5, now = new Date()): DemoPayout[] {
  const out: DemoPayout[] = [];
  for (let i = 1; i <= count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    // Deterministic rather than random: a demo that shows different numbers
    // on every refresh looks broken when two people compare screens.
    const grossCents = money(2400 + ((d.getMonth() * 137) % 900));
    const netCents = netToBuilding(grossCents);
    out.push({
      id: `p${i}`,
      period: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      grossCents,
      commissionCents: grossCents - netCents,
      netCents,
      status: i === 1 ? 'Processing' : 'Paid',
      paidOn:
        i === 1
          ? null
          : new Date(d.getFullYear(), d.getMonth() + 1, 3).toISOString(),
    });
  }
  return out;
}

/** Earnings so far in the current, still-open month. */
export function currentPeriod(now = new Date()) {
  const grossCents = money(96 * now.getDate());
  const netCents = netToBuilding(grossCents);
  return {
    period: `${MONTHS[now.getMonth()]} ${now.getFullYear()}`,
    grossCents,
    commissionCents: grossCents - netCents,
    netCents,
  };
}

export { commission };
