/**
 * Sample figures for the Apartments demo.
 *
 * Generated relative to "now" rather than hard-coded, so the demo shows a
 * live-looking month whenever it is opened instead of decaying into a
 * building that apparently stopped trading in August.
 */

/**
 * Parqlet's cut of every booking.
 *
 * Worked example the product is specified against: a renter pays $15, the
 * building receives $12, we keep $3. One constant so a pricing change is a
 * single edit and no two screens can disagree about the split.
 */
export const COMMISSION_PCT = 20;

/** What the building actually receives for a spot priced at `cents`. */
export function netToBuilding(cents: number): number {
  return cents - commissionOn(cents);
}

export function commissionOn(cents: number): number {
  return Math.round((cents * COMMISSION_PCT) / 100);
}

export type DemoSpot = {
  id: string;
  number: string;
  level: string;
  type: 'Compact' | 'Standard' | 'Large SUV';
  covered: boolean;
  evCharger: boolean;
  /** Dollars per day, set per spot — a covered spot on level 1 is worth
   *  more than an uncovered one on the roof. */
  priceCents: number;
  status: 'Listed' | 'Unlisted';
};

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

const money = (dollars: number) => Math.round(dollars * 100);

/**
 * Spots are NUMBERED, not lettered, because the building prices them in
 * ranges - "1 to 100 at this rate, 200 to 300 at that one". A scheme like
 * C1 / B7 / R3 cannot express that.
 *
 * Three blocks with deliberate gaps between them, so a range like 200-300
 * selects exactly the second block and a demo of the bulk pricing tool has
 * something visible to do.
 */
function buildSpots(): DemoSpot[] {
  const out: DemoSpot[] = [];
  const block = (
    from: number,
    count: number,
    level: string,
    covered: boolean,
    price: number,
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
        priceCents: money(price),
        status: n % 11 === 0 ? 'Unlisted' : 'Listed',
      });
    }
  };
  // Level 1 - covered and closest to the lifts, so the most valuable.
  block(1, 40, 'P1', true, 15);
  // Level 2 - covered, further down.
  block(201, 30, 'P2', true, 12);
  // Roof - uncovered.
  block(301, 20, 'Roof', false, 9);
  return out;
}

export const DEMO_SPOTS: DemoSpot[] = buildSpots();

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
    const gross = 2400 + ((d.getMonth() * 137) % 900);
    const grossCents = money(gross);
    const commissionCents = Math.round((grossCents * COMMISSION_PCT) / 100);
    out.push({
      id: `p${i}`,
      period: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      grossCents,
      commissionCents,
      netCents: grossCents - commissionCents,
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
  const dayOfMonth = now.getDate();
  const grossCents = money(96 * dayOfMonth);
  const commissionCents = Math.round((grossCents * COMMISSION_PCT) / 100);
  return {
    period: `${MONTHS[now.getMonth()]} ${now.getFullYear()}`,
    grossCents,
    commissionCents,
    netCents: grossCents - commissionCents,
  };
}

export function formatMoney(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
