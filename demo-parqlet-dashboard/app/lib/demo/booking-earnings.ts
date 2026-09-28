/**
 * What the building earned on one booking, and why.
 *
 * Four cases, and the difference between them is a product rule rather
 * than a rounding. Whose spot it was decides whether anyone is owed a
 * gift-card reserve; how it was paid decides whether new money entered
 * the system at all.
 *
 *   NEIGHBOR SPOT, CARD      price − Stripe − commission − reserve
 *     The card payment IS the credit being bought, inline. The building
 *     keeps its share, less the reserve, which is owed to the resident
 *     who lent the space.
 *
 *   NEIGHBOR SPOT, CREDIT    nothing
 *     No card was charged, so nothing new came in - the credit simply
 *     moves to the spot's owner. The building was paid when that credit
 *     was first bought.
 *
 *   BUILDING SPOT, CARD      price − Stripe − commission
 *     The building owns the spot, so there is no one to owe a reserve to
 *     and none comes off.
 *
 *   BUILDING SPOT, CREDIT + EXTRA    reserve + (extra − Stripe − commission)
 *     The reserve behind that credit goes to the BUILDING rather than
 *     staying for gift cards: it is the one case where it does. The extra
 *     is dollars, so it is charged and split like any card payment.
 *
 * Checked against the pricing spec at a $6 base: $1.83, $0.00, $7.41 on a
 * $10 spot, and $5.28 on a $10 spot paid with a credit plus $4.
 *
 * The base is always one credit a day in both products. Only a building's
 * own spot can carry an extra, and only in an Apartment - see pricing.ts.
 */

import {
  CREDIT_PRICE_CENTS,
  formatMoney,
  netToBuilding,
  reservePerCreditCents,
} from './pricing';

export type BookingEarning = {
  /** Whose spot it was. Drives the badge and the reserve. */
  spotKind: 'building' | 'neighbor';
  spotKindLabel: string;
  /** How the renter paid for the base. The extra is always dollars. */
  paidWith: 'card' | 'credit';
  /** "$10.00 card", "1 credit + $4.00". */
  payLabel: string;
  earnedCents: number;
  /** Why this row earned nothing, for the tooltip. Null when it earned. */
  zeroReason: string | null;
  refunded: boolean;
};

export const CREDIT_TO_OWNER_REASON =
  'The building was already paid when this credit was first earned.';

export function bookingEarning(booking: {
  id?: string;
  amountCents?: number | null;
  creditsSpent?: number | null;
  spotOwnerName?: string | null;
  status?: string;
}): BookingEarning {
  // A spot with an owner named on it was lent by a resident. Anything else
  // is one the building listed itself.
  const spotKind: BookingEarning['spotKind'] = booking.spotOwnerName ? 'neighbor' : 'building';
  const spotKindLabel = spotKind === 'neighbor' ? 'Resident spot' : 'Community Spot';

  const credits = booking.creditsSpent ?? 0;
  const cashCents = booking.amountCents ?? 0;
  const paidWith: BookingEarning['paidWith'] = credits > 0 ? 'credit' : 'card';

  const refunded = booking.status === 'Cancelled' || booking.status === 'Refunded';
  const reserveEach = reservePerCreditCents(CREDIT_PRICE_CENTS);

  // A card-paid booking carries no credit count, so the nights are read
  // back out of what was charged: one credit's worth of base per day.
  const cardDays = Math.max(1, Math.round(cashCents / CREDIT_PRICE_CENTS) || 1);

  let earnedCents: number;
  if (refunded) {
    earnedCents = 0;
  } else if (spotKind === 'neighbor') {
    earnedCents =
      paidWith === 'credit'
        ? 0
        : Math.max(0, netToBuilding(cashCents) - reserveEach * cardDays);
  } else {
    earnedCents =
      paidWith === 'credit'
        ? reserveEach * credits + netToBuilding(cashCents)
        : netToBuilding(cashCents);
  }

  const creditPart = credits > 0 ? `${credits} credit${credits === 1 ? '' : 's'}` : '';
  const cashPart =
    cashCents > 0 ? `${formatMoney(cashCents)}${credits > 0 ? '' : ' card'}` : '';
  const paid = [creditPart, cashPart].filter(Boolean).join(' + ');
  const payLabel = refunded ? `${paid || '—'} returned` : paid || '—';

  return {
    spotKind,
    spotKindLabel,
    paidWith,
    payLabel,
    earnedCents,
    zeroReason: !refunded && earnedCents === 0 && paidWith === 'credit' ? CREDIT_TO_OWNER_REASON : null,
    refunded,
  };
}
