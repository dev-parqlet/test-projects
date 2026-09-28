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
};

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
 */
export function currentCondoMonth(now = new Date()): CondoMonth {
  const d = new Date(now.getFullYear(), now.getMonth(), 1);
  return monthFrom(money(38 * now.getDate()), d, 'current', 'Processing');
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
    const gross = 620 + ((d.getMonth() * 211) % 680);
    out.push(monthFrom(money(gross), d, `c${i}`, 'Paid'));
  }
  return out;
}
