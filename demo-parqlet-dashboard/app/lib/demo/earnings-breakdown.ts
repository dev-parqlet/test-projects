/**
 * Where a month's earnings came from.
 *
 * The dashboard card leads with one number, and one number invites the
 * wrong conclusion: an operator who sees "$667.80 earned" assumes it all
 * came from the spots they priced, and prices harder. Most of it did not.
 * So the card breaks the same total into the three ways a building earns:
 *
 *   Community Spots   Spots the BUILDING owns and lists itself. Apartments
 *                     only - in a Condo the residents own every spot, so
 *                     this is always zero and the chip is not shown.
 *   Neighbor shares   A resident shared their own spot and someone booked
 *                     it. Both products. The only source a Condo has.
 *   Reserves released A resident's gift-card reserve expired unclaimed and
 *                     came back to the building.
 *
 * A PARTITION, not three estimates: the parts always sum to the total the
 * Revenue page shows, so the two screens can never disagree. Reserves are
 * carved out first because they are a known quantity; the rest splits on
 * what the spots themselves are worth, so it moves when the building
 * reprices rather than sitting at a number somebody typed here.
 */

import { DEMO_SPOTS, spotPriceCents } from './apartments-data';


export type EarningsSource = {
  id: 'community' | 'neighbor';
  label: string;
  cents: number;
};

/**
 * What share of booking earnings comes from the building's own spots,
 * weighted by what those spots charge rather than by how many there are:
 * a building whose own spots carry a $9 extra earns more from ten of them
 * than from ten at the base.
 */
function communityShare(): number {
  const total = DEMO_SPOTS.reduce((sum, s) => sum + spotPriceCents(s), 0);
  if (total === 0) return 0;
  const owned = DEMO_SPOTS
    .filter((s) => s.owner === 'building')
    .reduce((sum, s) => sum + spotPriceCents(s), 0);
  return owned / total;
}

export function earningsBreakdown(
  product: 'condo' | 'apartment',
  earningsCents: number,
): EarningsSource[] {
  // Every chip is a share of what BOOKINGS earned, and together they add
  // up to the headline. Released reserves used to be a third chip, but a
  // reserve expiring unclaimed is not something the building did, and it
  // read as a third way to earn rather than as an accounting detail.
  const fromBookings = Math.max(0, earningsCents);

  // A Condo's residents own every spot, so nothing here is the building's.
  const community =
    product === 'apartment' ? Math.round(fromBookings * communityShare()) : 0;
  // A REMAINDER, so rounding never leaves a penny outside the total.
  const neighbor = fromBookings - community;

  const sources: EarningsSource[] = [
    { id: 'community', label: 'Community Spots', cents: community },
    { id: 'neighbor', label: 'Resident shares', cents: neighbor },
  ];

  // An empty chip says nothing and costs a row of space on a phone.
  return sources.filter((s) => s.cents > 0);
}
