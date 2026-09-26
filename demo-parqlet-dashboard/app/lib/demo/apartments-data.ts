/**
 * Sample figures for the Apartments demo.
 *
 * Generated relative to "now" rather than hard-coded, so the demo shows a
 * live-looking month whenever it is opened instead of decaying into a
 * building that apparently stopped trading in August.
 */

/** Parqlet's cut of every booking. One constant so a pricing change is one
 *  edit, and so the Income page and the bookings list can never disagree. */
export const COMMISSION_PCT = 15;

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

export const DEMO_SPOTS: DemoSpot[] = [
  { id: 's1', number: 'C1',  level: 'P1', type: 'Standard',  covered: true,  evCharger: true,  priceCents: money(24), status: 'Listed' },
  { id: 's2', number: 'C2',  level: 'P1', type: 'Standard',  covered: true,  evCharger: false, priceCents: money(22), status: 'Listed' },
  { id: 's3', number: 'C4',  level: 'P1', type: 'Large SUV', covered: true,  evCharger: false, priceCents: money(28), status: 'Listed' },
  { id: 's4', number: 'B7',  level: 'P2', type: 'Standard',  covered: true,  evCharger: false, priceCents: money(18), status: 'Listed' },
  { id: 's5', number: 'B11', level: 'P2', type: 'Compact',   covered: true,  evCharger: false, priceCents: money(14), status: 'Listed' },
  { id: 's6', number: 'R3',  level: 'Roof', type: 'Standard', covered: false, evCharger: false, priceCents: money(12), status: 'Unlisted' },
];

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
