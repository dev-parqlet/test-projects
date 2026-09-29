/**
 * The rows behind "What a spot costs", for both products.
 *
 * They were defined inside the two dashboards, which was fine while the
 * card lived there. It now sits in the Earnings header instead - what a
 * spot costs is the arithmetic behind the earnings figure, so it belongs
 * beside it rather than a screen away - and two callers meant the
 * definitions had to stop being local to one.
 */

import type { PriceRow } from '../../components/pricing/CreditPriceCard';
import { DEMO_SPOTS } from './apartments-data';
import {
  BASE_PRICE_CENTS,
  BASE_PRICE_CREDITS,
  COMMISSION_PCT,
  CREDIT_PRICE_CENTS,
  formatMoney,
  netToBuilding,
} from './pricing';

/**
 * A Condo has ONE price for the whole building. Residents own every spot
 * and share them with each other, so there is nothing for the building to
 * price differently and nothing for a resident to set - the building
 * decides, once, and it applies everywhere.
 */
export const CONDO_PRICE_ROWS: readonly PriceRow[] = [
  {
    label: 'Any spot in the building',
    note: 'One price everywhere - residents never set their own',
    price: `${BASE_PRICE_CREDITS} credit`,
    total: formatMoney(BASE_PRICE_CENTS),
  },
  {
    label: 'You receive',
    note: `After our ${COMMISSION_PCT}% commission and card fees`,
    price: 'per credit bought',
    total: formatMoney(netToBuilding(CREDIT_PRICE_CENTS)),
  },
];

export const CONDO_PRICE_FOOTNOTE =
  'Your residents pay each other in credits and buy more with a card when they run out. What you earn does not arrive as a payout - it comes off your subscription.';

export const APARTMENT_PRICE_FOOTNOTE =
  'Everyone pays in credits, the same as a Condo. The difference is that you own some of the spots, and only those can carry an extra on top of the base.';

/**
 * An Apartment prices its OWN spots and nothing else, so the range shown
 * is read from the spots it actually owns rather than stated as a
 * constant. A building that has set no extras yet says so, instead of
 * printing a $0.00-$0.00 range that reads like a bug.
 */
export function apartmentPriceRows(): PriceRow[] {
  const owned = DEMO_SPOTS.filter((sp) => sp.owner === 'building');
  const extras = owned.map((sp) => sp.extraCents);
  const lo = Math.min(...extras, 0);
  const hi = Math.max(...extras, 0);
  const hasExtra = hi > 0;

  return [
    {
      label: "A resident's own spot",
      note: 'They share it, you never price it',
      price: `${BASE_PRICE_CREDITS} credit`,
      total: formatMoney(BASE_PRICE_CENTS),
    },
    {
      label: 'A spot your building owns',
      note: hasExtra
        ? `The base, plus whatever you set - yours run ${formatMoney(lo)} to ${formatMoney(hi)}`
        : 'The base, plus whatever you set - yours are all at the base today',
      price: hasExtra
        ? `${BASE_PRICE_CREDITS} credit + ${formatMoney(lo)}-${formatMoney(hi)}`
        : `${BASE_PRICE_CREDITS} credit`,
      total: hasExtra
        ? `${formatMoney(BASE_PRICE_CENTS + lo)}-${formatMoney(BASE_PRICE_CENTS + hi)}`
        : formatMoney(BASE_PRICE_CENTS),
    },
    {
      label: 'You receive',
      note: `After our ${COMMISSION_PCT}% commission and card fees`,
      price: 'on the base',
      total: formatMoney(netToBuilding(BASE_PRICE_CENTS)),
    },
  ];
}
