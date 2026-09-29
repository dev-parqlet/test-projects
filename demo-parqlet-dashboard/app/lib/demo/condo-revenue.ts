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
  applyCondoSavings,
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

/**
 * A Condo's savings month by month, with the carryover folded forward.
 *
 * Carryover only means anything in sequence: what one month could not
 * spend is what the next one starts with. So this walks OLDEST FIRST,
 * feeding each month's remainder into the one after it - the same order
 * api-backend's earnings route replays the ledger in.
 *
 * Returned newest-first, which is how both the table and the chart read.
 */
export type SavingsMonth = {
  id: string;
  /** "Sep 2026". */
  period: string;
  /** Short axis label, "Sep". */
  short: string;
  fromSharingCents: number;
  carriedInCents: number;
  savedCents: number;
  invoiceCents: number;
  carriedOverCents: number;
  maxSavingsCents: number;
  atMax: boolean;
};

/**
 * What resident sharing brought in, month by month.
 *
 * A DELIBERATE RAMP rather than the spread `recentCondoMonths` uses. That
 * one is tuned so the invoice table shows a bill that moves; fed through
 * the savings arithmetic it puts EVERY month on the floor, which draws six
 * identical bars and a carryover climbing past $400 - true, and useless as
 * a picture. A building that grows into its savings is the story worth
 * showing, and it is the common one: sharing builds as residents join.
 *
 * The last entry is the month in progress, and is the only one that
 * exceeds the cap - so the chart shows exactly one carried-over cap, which
 * is what makes that part of the legend mean anything.
 */
const SHARING_RAMP_CENTS = [9_600, 14_300, 17_600, 18_800, 31_200, 46_924];

export function condoSavingsHistory(count = 6, now = new Date()): SavingsMonth[] {
  const ramp = SHARING_RAMP_CENTS.slice(-count);
  const out: SavingsMonth[] = [];
  let carriedInCents = 0;

  // Oldest first: what one month cannot spend is what the next one starts
  // with, so the fold only means anything in order. Reversed at the end,
  // because both the chart and the table read newest-first.
  ramp.forEach((fromSharingCents, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (ramp.length - 1 - i), 1);
    const s = applyCondoSavings({
      earningsCents: fromSharingCents,
      carriedInCents,
      subscriptionCents: CONDO_SUBSCRIPTION_CENTS,
      floorCents: CONDO_FLOOR_CENTS,
    });
    out.push({
      id: `s${i}`,
      period: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      short: MONTHS[d.getMonth()].slice(0, 3),
      fromSharingCents,
      carriedInCents,
      savedCents: s.savingsCents,
      invoiceCents: s.dueCents,
      carriedOverCents: s.carriedOverCents,
      maxSavingsCents: s.maxSavingsCents,
      atMax: s.atMax,
    });
    carriedInCents = s.carriedOverCents;
  });

  return out.reverse();
}

/** Everything saved across the months shown, for the year-to-date tile. */
export function savedThisYearCents(history: SavingsMonth[]): number {
  return history.reduce((sum, m) => sum + m.savedCents, 0);
}
