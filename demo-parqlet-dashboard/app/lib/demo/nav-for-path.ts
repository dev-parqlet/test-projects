/**
 * Which nav belongs to the URL you are on.
 *
 * Several pages are shared by both products - Settings, Profile, Access,
 * Subscription, Notifications, Support Tickets - and they live in the Condo
 * half of the route tree because that is where they were written. The
 * rewrites in next.config.ts serve them under BOTH prefixes, so
 * /apartment/settings renders a page whose layout would otherwise hand the
 * visitor the Condo nav: they would click Bookings and land in /condo.
 *
 * So the nav is chosen from the URL rather than from the folder the page
 * happens to sit in. A visitor sent the Apartment link stays in
 * /apartment/... whatever they click.
 */

import { apartmentsNavItems, condoNavItems, type NavItem } from '../../components/layout/nav-data';
import { condoShowsSavings, productFromPath, productPrefix } from './product-path';

/**
 * Takes the RAW pathname, prefix and all.
 *
 * It used to be handed the stripped path, which was enough while /condo
 * was the only Condo prefix. It no longer is: the prefix is what says
 * whether this visitor sees the savings story, and stripping it first
 * threw that away.
 */
export function navItemsForPath(pathname: string): readonly NavItem[] {
  if (productFromPath(pathname) === 'apartment') return apartmentsNavItems;
  return condoNavItems({
    prefix: productPrefix(pathname),
    withSavings: condoShowsSavings(pathname),
  });
}
