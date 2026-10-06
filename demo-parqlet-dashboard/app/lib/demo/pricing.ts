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
/**
 * The pricing spec, the design and the Parking Spots screen all agree at
 * $6: a rooftop spot at $8 and a lower level at $15 are this base plus a
 * $2 and a $9 extra, and every worked example in the spec - $1.83, $7.41,
 * $5.28, a $2.50 reserve, ten credits for a $25 card - is quoted at it.
 */
export const CREDIT_PRICE_CENTS = money(6);

/** Every spot, in both products, costs this many credits per day. */
export const BASE_PRICE_CREDITS = 1;

export function formatMoney(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * The same money, rounded to whole dollars: "$1,363", "$400".
 *
 * For CHART labels and for prose. A bar labelled "$175.68" asks the reader
 * to compare six four-significant-figure numbers when the point of the bar
 * is its height, and "your bill never drops below $100.00" is read aloud at
 * a board meeting as "a hundred dollars". Tables and tiles keep the cents,
 * because those are figures someone reconciles against an invoice.
 */
export function formatDollars(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString('en-US')}`;
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
 * What one credit a resident earns puts aside towards a gift card.
 *
 * TWO TIERS, mirroring api-backend's gift-card-pricing.ts.
 *
 *   standard   40% of the credit price, rounded to the nearest $0.25.
 *              Apartments, with or without Earnings, and Condo +
 *              Savings. $2.50 at $6.00.
 *   condo      a Condo with Savings OFF. Its residents own every spot,
 *              so the money the sharing makes is theirs and this tier
 *              hands them far more of it: $4.00 at $6.00, and a card
 *              costs 7 credits rather than 10.
 *
 * The condo line is `0.75 x price - $0.50` up to $14 and
 * `0.75 x price - $0.25` from $15, which reproduces the client's table
 * of 2026-10-06 exactly, $15's deliberate 25c step included.
 *
 * The standard rounding is why the credit price is whole dollars only:
 * a price carrying cents produces a reserve that does not divide evenly
 * into a $25 card and leaves a remainder nobody can spend.
 */
export function reservePerCreditCents(
  priceCents: number,
  tier: "standard" | "condo" = "standard",
): number {
  if (tier === "condo") {
    return Math.floor((priceCents * 75) / 100) - (priceCents <= 1400 ? 50 : 25);
  }
  return Math.round((priceCents * 0.4) / 25) * 25;
}

/** Credits a $25 card costs on that tier. Seven at $6.00 on the condo
 *  rate, ten on the standard one. */
export function creditsPerGiftCard(
  priceCents: number,
  tier: "standard" | "condo" = "standard",
): number {
  return Math.ceil(2500 / reservePerCreditCents(priceCents, tier));
}

// ─── Subscriptions ──────────────────────────────────────────────────

/**
 * Both products run the same $500 plan. The Condo's bill stops at its
 * floor, so $500 less the $100 floor is $400 of discount to earn - the
 * figure the pricing spec quotes as the max offset.
 */
export const CONDO_SUBSCRIPTION_CENTS = money(500);

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

/**
 * What a CONDO saved this month, and what rolls into the next.
 *
 * Mirrors api-backend's `applyCondoSavings` (src/lib/building-earnings.ts),
 * which is the real implementation - this exists so the demo shows the same
 * arithmetic without a backend.
 *
 *   savings     = min(earnings + carried in, subscription - floor)
 *   due         = subscription - savings
 *   carried out = (earnings + carried in) - savings
 *
 * The difference from `applyOffset` is the carryover: a Condo's surplus is
 * not lost at the floor, it spends itself next month. An Apartment's
 * surplus is a payout instead, so it keeps `applyOffset`.
 */
export type CondoSavings = {
  earningsCents: number;
  carriedInCents: number;
  availableCents: number;
  maxSavingsCents: number;
  savingsCents: number;
  dueCents: number;
  carriedOverCents: number;
  subscriptionCents: number;
  floorCents: number;
  atMax: boolean;
};

export function applyCondoSavings(params: {
  earningsCents: number;
  carriedInCents?: number;
  subscriptionCents: number;
  floorCents?: number;
}): CondoSavings {
  const earningsCents = Math.max(0, Math.round(params.earningsCents));
  const carriedInCents = Math.max(0, Math.round(params.carriedInCents ?? 0));
  const subscriptionCents = Math.max(0, Math.round(params.subscriptionCents));
  const floorCents = params.floorCents ?? CONDO_FLOOR_CENTS;

  // Never negative: a subscription already at the floor can save nothing,
  // and a negative cap would turn a saving into a charge.
  const maxSavingsCents = Math.max(0, subscriptionCents - floorCents);
  const availableCents = earningsCents + carriedInCents;
  const savingsCents = Math.min(availableCents, maxSavingsCents);

  return {
    earningsCents,
    carriedInCents,
    availableCents,
    maxSavingsCents,
    savingsCents,
    dueCents: subscriptionCents - savingsCents,
    carriedOverCents: availableCents - savingsCents,
    subscriptionCents,
    floorCents,
    atMax: maxSavingsCents > 0 && savingsCents >= maxSavingsCents,
  };
}

/** How full the savings bar is, 0..1 - against the MAXIMUM saving, so a
 *  building at its floor reads as full rather than as a fraction of a bill
 *  it can never clear. */
export function savingsBarFill(s: {
  savingsCents: number;
  maxSavingsCents: number;
}): number {
  if (s.maxSavingsCents <= 0) return 0;
  return Math.min(1, s.savingsCents / s.maxSavingsCents);
}

/** The line each product leads with. */
export const PITCH = {
  condo:
    "Your residents' activity lowers your bill, down to $100 a month.",
  apartments:
    'Your empty spots cover your subscription, and anything extra goes straight to you.',
} as const;
