/**
 * How each product prices a spot, and what the building keeps.
 *
 * BOTH products run on credits. A resident pays 1 credit per day,
 * whether they are in a Condo or an Apartment, and buys credits with a
 * card when they run short. That is the whole economy in a Condo.
 *
 * An Apartment adds one thing on top: the building owns some spots
 * itself, and those can carry a DOLLAR EXTRA over the base credit. A
 * covered space by the lift is worth more than one on the roof, and
 * only the building can price that difference, because only the
 * building owns those spots.
 *
 *   Condo      1 credit / day. One rate for the whole building, because
 *              residents own every spot and share them with each other.
 *   Apartment  1 credit / day base, the same as a Condo, plus an extra
 *              in dollars on spots the building lists itself.
 *
 * A resident-owned spot in an Apartment therefore costs exactly what a
 * Condo spot costs. Only the building's own spots differ.
 *
 * Demo figures. The real split lives in
 * api-backend/docs/condos-and-apartments.md.
 */

export const money = (dollars: number) => Math.round(dollars * 100);

/** Parqlet's cut, before Stripe. */
export const COMMISSION_PCT = 20;

/**
 * Stripe's standard US card rate.
 *
 * DEMO SIMPLIFICATION, and the one thing on this page that must not be
 * copied into the backend as-is. The 30c is charged per CHARGE, not per
 * booking: a resident who tops up 10 credits at once pays it once, not
 * ten times. Charging it per booking here overstates the fee on a small
 * booking, which is the safe direction for a demo but the wrong formula
 * for a ledger.
 *
 * api-backend/docs/condos-and-apartments.md has the real split, including
 * how the fixed fee is spread across a multi-credit purchase.
 */
const STRIPE_PCT = 2.9;
const STRIPE_FIXED_CENTS = 30;

/** What one credit costs the resident, set per building. */
export const CREDIT_PRICE_CENTS = money(15);

/** Every spot, in both products, costs this many credits per day. */
export const BASE_PRICE_CREDITS = 1;

export function formatMoney(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatCredits(n: number): string {
  return `${n} credit${n === 1 ? '' : 's'}`;
}

export function stripeFee(chargeCents: number): number {
  return Math.round(chargeCents * (STRIPE_PCT / 100)) + STRIPE_FIXED_CENTS;
}

export function commission(chargeCents: number): number {
  return Math.round((chargeCents * COMMISSION_PCT) / 100);
}

/**
 * What reaches the building from a charge: less our commission, less
 * Stripe. A REMAINDER, so the parts always sum to the whole and any
 * rounding drift lands here rather than leaving a penny unaccounted.
 */
export function netToBuilding(chargeCents: number): number {
  return chargeCents - commission(chargeCents) - stripeFee(chargeCents);
}

// ─── What a spot costs ──────────────────────────────────────────────

/** Dollar value of the base, for showing alongside the credit. */
export const BASE_PRICE_CENTS = BASE_PRICE_CREDITS * CREDIT_PRICE_CENTS;

/** Apartment building-owned spot: base credit plus a dollar extra. */
export function apartmentSpotTotalCents(extraCents: number): number {
  return BASE_PRICE_CENTS + Math.max(0, extraCents);
}

// ─── The gift-card reserve ──────────────────────────────────────────

/**
 * What one credit a resident earns puts aside towards a gift card: 40% of
 * the credit price, rounded to the nearest $0.25 - the backend's formula.
 *
 * The rounding is why the credit price is whole dollars only: a price
 * carrying cents produces a reserve that does not divide evenly into a
 * $25 card and leaves a remainder nobody can spend.
 */
export function reservePerCreditCents(priceCents: number): number {
  return Math.round((priceCents * 0.4) / 25) * 25;
}

// ─── Subscriptions ──────────────────────────────────────────────────

export const CONDO_SUBSCRIPTION_CENTS = money(750);

/** A Condo's bill never falls below this, however much it earns. */
export const CONDO_FLOOR_CENTS = money(100);

/**
 * An Apartment subscription CAN be zero - the commission on the
 * building's own spots is the business model there, so a building
 * carrying enough of them needs no platform fee, and `applyOffset`
 * handles zero without a special case.
 *
 * The demo building runs one anyway, because a bill of zero demonstrates
 * nothing: the whole pitch is that the spots cover the subscription and
 * the rest is yours, and that needs a subscription to cover. It matches
 * the figure on the Subscription screen - the two must never disagree.
 * Set this to `money(0)` to show the other case.
 */
export const APARTMENT_SUBSCRIPTION_CENTS = money(500);

/** No floor: an Apartment's bill can reach zero, unlike a Condo's. */
export const APARTMENT_FLOOR_CENTS = money(0);

export type OffsetResult = {
  subscriptionCents: number;
  /** Earnings applied to the invoice. */
  appliedCents: number;
  /** What the building actually pays this month. */
  dueCents: number;
  /** Earnings the invoice could not absorb. */
  surplusCents: number;
  floorCents: number;
};

/**
 * Apply a month's earnings to a subscription.
 *
 * A Condo's bill stops falling at its floor; an Apartment's can reach
 * zero. Either way the surplus is what is left over - additional
 * revenue for a Condo, withdrawable for an Apartment.
 */
export function applyOffset(params: {
  subscriptionCents: number;
  earningsCents: number;
  floorCents: number;
}): OffsetResult {
  const { subscriptionCents, earningsCents, floorCents } = params;
  const maxOffset = Math.max(0, subscriptionCents - floorCents);
  const appliedCents = Math.min(earningsCents, maxOffset);
  return {
    subscriptionCents,
    appliedCents,
    dueCents: subscriptionCents - appliedCents,
    surplusCents: earningsCents - appliedCents,
    floorCents,
  };
}

/** The line each product leads with. */
export const PITCH = {
  condo:
    "Your residents' activity lowers your bill, down to $100 a month.",
  apartments:
    'Your empty spots cover your subscription, and anything extra goes straight to you.',
} as const;
