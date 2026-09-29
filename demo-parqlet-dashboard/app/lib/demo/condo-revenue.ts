/**
 * What a Condo earns, for the demo.
 *
 * A Condo has no public users and no dollars changing hands between
 * residents: they book each other's spots with credits. The building
 * earns because those credits were BOUGHT - a resident who runs out tops
 * up with a card, and the building takes a share of that top-up, less our
 * commission and the card fees.
 *
 * That money does not arrive as a payout. It is applied to the monthly
 * subscription, which is why the Condo screen talks about a bill coming
 * down rather than a balance going up.
 *
 * Figures are derived from the date rather than hard-coded, so the demo
 * never decays into a building that apparently stopped trading in August.
 */

import {
  CONDO_FLOOR_CENTS,
  CONDO_SUBSCRIPTION_CENTS,
  applyOffset,
  money,
  netToBuilding,
} from './pricing';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export type CondoMonth = {
  id: string;
  period: string;
  /** Credit top-ups by residents this month, at the till. */
  grossCents: number;
  /** Our commission plus card fees. */
  feesCents: number;
  /** What the building earned, before it is applied to the invoice. */
  earningsCents: number;
  subscriptionCents: number;
  appliedCents: number;
  /** What the building actually pays. Never below the floor. */
  dueCents: number;
  /** Earnings the invoice could not absorb - additional revenue. */
  surplusCents: number;
  status: 'Paid' | 'Processing';
  invoicedOn: string | null;
  /**
   * When this month's invoice falls due, e.g. "Due Oct 1".
   *
   * The first of the FOLLOWING month: the bill is raised once the month it
   * covers has finished, which is also why a month in progress shows a
   * figure that can still move.
   */
  dueLabel: string;
};

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function monthFrom(grossCents: number, d: Date, id: string, status: CondoMonth['status']): CondoMonth {
  const earningsCents = netToBuilding(grossCents);
  const offset = applyOffset({
    subscriptionCents: CONDO_SUBSCRIPTION_CENTS,
    earningsCents,
    floorCents: CONDO_FLOOR_CENTS,
  });
  return {
    id,
    period: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
    grossCents,
    feesCents: grossCents - earningsCents,
    earningsCents,
    subscriptionCents: offset.subscriptionCents,
    appliedCents: offset.appliedCents,
    dueCents: offset.dueCents,
    surplusCents: offset.surplusCents,
    status,
    dueLabel: `Due ${MONTHS_SHORT[(d.getMonth() + 1) % 12]} 1`,
    invoicedOn:
      status === 'Processing'
        ? null
        : new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString(),
  };
}

/**
 * The month in progress. A busy building runs past the point where the
 * discount stops, so the demo shows both halves of the story: the bill at
 * its floor AND a surplus on top.
 *
 * About $21 a day in credit top-ups, which nets roughly $450 over a full
 * month. That is deliberately just past the $400 the discount is worth on
 * a $500 plan with a $100 floor: enough to put the bill on its floor and
 * leave a small surplus, without an overshoot that would make the
 * remainder look like the headline.
 */
export function currentCondoMonth(now = new Date()): CondoMonth {
  const d = new Date(now.getFullYear(), now.getMonth(), 1);
  return monthFrom(money(21 * now.getDate()), d, 'current', 'Processing');
}

/** The last `count` completed months, newest first. */
export function recentCondoMonths(count = 5, now = new Date()): CondoMonth[] {
  const out: CondoMonth[] = [];
  for (let i = 1; i <= count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    // Deterministic rather than random: a demo that shows different
    // numbers on every refresh looks broken when two people compare
    // screens. The spread crosses the floor in some months and not in
    // others, so the table shows a bill that actually moves.
    // 173 rather than 211: 211 doubles to 2 mod 420, so every other month
    // landed within a few dollars of the last and the table looked frozen.
    // The range brackets the open month, and straddles the $400 the
    // discount is worth, so the table shows both a bill on its floor and a
    // bill that did not quite get there.
    const gross = 520 + ((d.getMonth() * 173) % 200);
    out.push(monthFrom(money(gross), d, `c${i}`, 'Paid'));
  }
  return out;
}
