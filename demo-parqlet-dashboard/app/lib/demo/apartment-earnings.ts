/**
 * What an APARTMENT earns, month by month, for the demo.
 *
 * The mirror of `condo-revenue.ts`, and deliberately a separate module: the
 * two products end the same sentence differently, and the difference is the
 * whole point of having two pages.
 *
 *   Condo      Earnings discount the bill down to a $100 floor. What the
 *              bill cannot absorb CARRIES INTO NEXT MONTH.
 *   Apartment  Earnings discount the bill all the way to zero. What the
 *              bill cannot absorb is PAID OUT in cash.
 *
 * From the ops note of 2026-09-30, which is the behaviour these figures
 * have to show:
 *
 *   Earnings accrue in the ledger as bookings complete. Two days before
 *   renewal a job posts a credit to the building's Stripe balance, up to
 *   the full subscription; Stripe applies it to the invoice, so the
 *   building pays the subscription MINUS its earnings. Anything above the
 *   subscription is sent as a cash payout over Stripe Connect at around
 *   the end of the month.
 *
 * So below the subscription nothing is transferred - it is a discount on a
 * bill. Above it, the bill is cleared AND a transfer goes out. There is no
 * carryover anywhere in this product: an Apartment is never left holding
 * earnings it could not spend, because the surplus is paid to it.
 *
 * Every figure is authored here rather than derived from a rate, because
 * the split between the building's own spots and its residents' is the
 * thing the page is FOR. Deriving it from one blended percentage would
 * draw six bars in the same proportion and teach an operator nothing about
 * a mix that really does move as they list more of their own spots.
 */

import { APARTMENT_SUBSCRIPTION_CENTS, money } from './pricing';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export type ApartmentMonth = {
  id: string;
  /** "Sep 2026". */
  period: string;
  /** Short axis label, "Sep". */
  short: string;
  /** Full month name, "April" - the "since April" tag spells it out. */
  monthName: string;
  /** Earned on spots the BUILDING owns and prices itself. */
  communityCents: number;
  /** The building's share when residents pay by card for each other's spots. */
  residentCents: number;
  /** community + resident. The bar and the tiles lead with this. */
  totalCents: number;
  subscriptionCents: number;
  /** Earnings actually applied to the invoice - never more than the bill. */
  appliedCents: number;
  /** What the building pays after the credit is posted. Can reach zero. */
  invoiceCents: number;
  /** Cash sent over Stripe Connect. Only ever above the subscription. */
  payoutCents: number;
  /** When the invoice falls due, e.g. "Due Oct 1". */
  dueLabel: string;
};

/**
 * Six months of growth, newest last.
 *
 * A RAMP rather than a spread. The story an Apartment operator is being
 * sold is "list more of your own spots and the subscription pays for
 * itself", and a flat six months does not show it happening. The mix
 * shifts too - residents' spots are a roughly steady sixth of the total
 * while the building's own climb - which is what makes the stacked bars
 * worth stacking.
 *
 * The last entry is the month in progress. It sits BELOW the subscription
 * on purpose, so the demo's Earnings page and its dashboard tell the same
 * story: a bill discounted to $150 with no payout yet. To demo the payout
 * instead, raise it past APARTMENT_SUBSCRIPTION_CENTS and every payout
 * state - the figure, the tile tag, the blue bar segment and the bank
 * banner - follows from the arithmetic below without another edit.
 */
const EARNINGS_RAMP: readonly (readonly [community: number, resident: number])[] = [
  [money(101), money(19)],  // 120
  [money(138), money(27)],  // 165
  [money(175), money(35)],  // 210
  [money(196), money(42)],  // 238
  [money(232), money(48)],  // 280
  [money(287), money(63)],  // 350 - the month in progress
];

function monthAt(
  d: Date,
  id: string,
  communityCents: number,
  residentCents: number,
): ApartmentMonth {
  const totalCents = communityCents + residentCents;
  const subscriptionCents = APARTMENT_SUBSCRIPTION_CENTS;
  // No floor, unlike a Condo: an Apartment's bill really can reach zero,
  // which is why `Math.min` here is against the whole subscription rather
  // than against a capped discount.
  const appliedCents = Math.min(totalCents, subscriptionCents);
  return {
    id,
    period: `${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`,
    short: MONTHS_SHORT[d.getMonth()],
    monthName: MONTHS[d.getMonth()],
    communityCents,
    residentCents,
    totalCents,
    subscriptionCents,
    appliedCents,
    invoiceCents: subscriptionCents - appliedCents,
    payoutCents: totalCents - appliedCents,
    dueLabel: `Due ${MONTHS_SHORT[(d.getMonth() + 1) % 12]} 1`,
  };
}

/** The last `count` months, newest first - the order the chart and the table read. */
export function apartmentEarningsHistory(count = 6, now = new Date()): ApartmentMonth[] {
  const ramp = EARNINGS_RAMP.slice(-count);
  return ramp
    .map(([community, resident], i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (ramp.length - 1 - i), 1);
      return monthAt(d, `a${i}`, community, resident);
    })
    .reverse();
}

/** The month in progress. */
export function currentApartmentMonth(now = new Date()): ApartmentMonth {
  return apartmentEarningsHistory(6, now)[0];
}

/** Everything earned across the months shown, for the year-to-date tile. */
export function earnedThisYearCents(history: readonly ApartmentMonth[]): number {
  return history.reduce((sum, m) => sum + m.totalCents, 0);
}
