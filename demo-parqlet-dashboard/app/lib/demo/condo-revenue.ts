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
  BASE_PRICE_CENTS,
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
  /** Full month name, "September" - the "since April" tag spells it out. */
  monthName: string;
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
const SHARING_RAMP_CENTS = [9_595, 14_300, 17_568, 18_834, 31_218, 46_924];

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
      period: `${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`,
      short: MONTHS_SHORT[d.getMonth()],
      monthName: MONTHS[d.getMonth()],
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

/**
 * The bookings behind this month's savings.
 *
 * Deterministic, like the rest of the demo: two people comparing screens
 * must see the same rows. The pattern alternates card-funded and reused so
 * both halves of the rule are visible without scrolling - a demo where
 * every row earned the same thing teaches nothing, and the $0.00 row is
 * the one a prospect asks about.
 *
 * The share on a card booking is the real arithmetic: one credit at the
 * demo's price, less Stripe, our commission and the gift-card reserve
 * (lib/demo/pricing.ts), which is why it is not a round number.
 */
export type DemoContribution = {
  bookingId: string;
  at: string;
  unitNumber: string;
  spotNumber: string;
  cardCredits: number;
  reusedCredits: number;
  kind: 'card' | 'reused';
  chargedCents: number;
  savedCents: number;
};

const CONTRIB_UNITS = ['6F', '7A', '5E', '3C', '2B', '4D', '1A', '8C'];
const CONTRIB_SPOTS = ['330', '112', '108', '222', '251', '141', '309', '218'];

export function condoContributions(count = 8, now = new Date()): DemoContribution[] {
  const perCredit = netToBuilding(BASE_PRICE_CENTS);
  const out: DemoContribution[] = [];
  for (let i = 0; i < count; i++) {
    // Newest first, roughly every other day.
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - Math.floor(i / 2));
    const card = i % 2 === 0;
    out.push({
      bookingId: `demo-contrib-${i}`,
      at: d.toISOString(),
      unitNumber: CONTRIB_UNITS[i % CONTRIB_UNITS.length],
      spotNumber: CONTRIB_SPOTS[i % CONTRIB_SPOTS.length],
      cardCredits: card ? 1 : 0,
      reusedCredits: card ? 0 : 1,
      kind: card ? 'card' : 'reused',
      chargedCents: card ? BASE_PRICE_CENTS : 0,
      savedCents: card ? perCredit : 0,
    });
  }
  return out;
}
