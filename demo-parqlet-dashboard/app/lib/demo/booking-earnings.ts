/**
 * What the building earned on one booking, and why.
 *
 * The number on a booking row is not the price of the booking, and an
 * operator who assumes it is will think they have been short-paid. Three
 * things come off it, and each one is a product rule:
 *
 *   OUR COMMISSION AND THE CARD FEE. Taken from anything paid by card.
 *
 *   THE GIFT-CARD RESERVE, but only on a spot a RESIDENT shared. That
 *   resident earns a credit for lending their space, and the reserve
 *   behind that credit is money the building owes them, not money it
 *   keeps. On the building's own spots there is no one to pay, so
 *   nothing comes off.
 *
 *   THE WHOLE AMOUNT, when the booking was paid with a credit the
 *   resident had already EARNED. No card was charged, so no new money
 *   entered the system - the building was paid when that credit was
 *   first bought by somebody else. It earns $0.00, and the row says so
 *   rather than hiding, because a missing row looks like a bug and a
 *   blank amount looks like a failure to pay.
 *
 * Verified against the live figures: a $9.00 extra on a building's own
 * spot nets $6.64, and a $6.00 card on a resident's spot nets $1.83.
 *
 * DEMO. Whether a credit was bought or earned is not in the mock corpus,
 * so it is derived from the booking id below - deterministically, because
 * a demo that shows different money on every refresh looks broken when
 * two people compare screens.
 */

import {
  CREDIT_PRICE_CENTS,
  formatMoney,
  netToBuilding,
  reservePerCreditCents,
} from './pricing';

export type BookingEarning = {
  /** Whose spot it was. Drives the badge and the reserve deduction. */
  spotKind: 'community' | 'resident';
  spotKindLabel: string;
  /** How the renter paid. A reused credit earns the building nothing. */
  paidWith: 'card' | 'reused-credit';
  /** "$10.00 card", "1 reused credit + $9.00". */
  payLabel: string;
  earnedCents: number;
  /** Why this row earned nothing, for the tooltip. Null when it earned. */
  zeroReason: string | null;
  refunded: boolean;
};

export const REUSED_CREDIT_REASON =
  'The building was already paid when this credit was first earned.';

/** Stable per-id, so a row keeps its story across refreshes and screens. */
function idHash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export function bookingEarning(booking: {
  id: string;
  amountCents?: number | null;
  creditsSpent?: number | null;
  spotOwnerName?: string | null;
  status?: string;
}): BookingEarning {
  // A spot with an owner named on it is a resident's, shared with their
  // neighbours. Anything else is one the building listed itself.
  const spotKind: BookingEarning['spotKind'] = booking.spotOwnerName ? 'resident' : 'community';
  const spotKindLabel = spotKind === 'resident' ? 'Resident spot' : 'Community Spot';

  const credits = booking.creditsSpent ?? 0;
  const cashCents = booking.amountCents ?? 0;

  // Roughly a third of credit-paid bookings reuse a credit the resident
  // earned rather than one they bought.
  const reused = credits > 0 && idHash(booking.id) % 3 === 0;

  const refunded =
    booking.status === 'Cancelled' || booking.status === 'Refunded';

  // What the building is paid on, before what it owes back. A reused
  // credit puts no new money in, so only the cash on top counts.
  const chargedCents = reused ? cashCents : cashCents + credits * CREDIT_PRICE_CENTS;

  const reserveCents =
    spotKind === 'resident' && credits > 0 && !reused
      ? reservePerCreditCents(CREDIT_PRICE_CENTS) * credits
      : 0;

  const earnedCents = refunded
    ? 0
    : Math.max(0, netToBuilding(chargedCents) - reserveCents);

  const creditPart =
    credits > 0
      ? `${credits} ${reused ? 'reused ' : ''}credit${credits === 1 ? '' : 's'}`
      : '';
  const cashPart = cashCents > 0 ? `${formatMoney(cashCents)}${credits > 0 ? '' : ' card'}` : '';
  const payLabel = refunded
    ? `${[creditPart, cashPart].filter(Boolean).join(' + ')} returned`
    : [creditPart, cashPart].filter(Boolean).join(' + ') || '—';

  return {
    spotKind,
    spotKindLabel,
    paidWith: reused ? 'reused-credit' : 'card',
    payLabel,
    earnedCents,
    zeroReason: refunded
      ? null
      : earnedCents === 0 && reused
        ? REUSED_CREDIT_REASON
        : null,
    refunded,
  };
}
