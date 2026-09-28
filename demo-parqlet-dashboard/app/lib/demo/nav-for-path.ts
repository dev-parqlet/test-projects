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

import { apartmentsNavItems, navItems, type NavItem } from '../../components/layout/nav-data';
import { productFromPath } from './product-path';

export function navItemsForPath(pathname: string): readonly NavItem[] {
  return productFromPath(pathname) === 'apartment' ? apartmentsNavItems : navItems;
}
