import { Actions, can, type Action } from "../../lib/permissions";
import { IcDashboard } from "../icons/IcDashboard";
import { IcBookings } from "../icons/IcBookings";
import { IcResidentDirectory } from "../icons/IcResidentDirectory";
import { IcQuestion } from "../icons/IcQuestion";
import { IcSubscription } from "../icons/IcSubscription";
import { IcSettings } from "../icons/IcSettings";
import { IcPerson } from "../icons/IcPerson";
import { IcNotification } from "../icons/IcNotification";
import { IcGiftCard } from "../icons/IcGiftCard";
import { IcCredit } from "../icons/IcCredit";
import { IcParking } from "../icons/IcParking";

export type NavId =
  | "dashboard"
  | "bookings"
  | "residents"
  | "tickets"
  | "subscription"
  | "access"
  | "settings"
  | "profile"
  | "notifications"
  | "reward-redemption"
  | "spots"
  | "availability"
  | "earnings"
  | "savings"
  | "none";

export interface NavItem {
  id: NavId;
  label: string;
  Icon: React.FC<{ color?: string }>;
  /** Override the path. Defaults to `/${id}` (except id="dashboard" → "/"). */
  href?: string;
  /** If set, item is hidden unless can(role, requiredAction) === true. */
  requiredAction?: Action;
  /** If false, the item is omitted for every role. For a page that
   *  exists and works but is not being shown to customers yet — a
   *  permission would be the wrong tool, since this is not about who
   *  the user is. */
  enabled?: boolean;
}

/**
 * Gift Cards is live for HOA staff as of the September release, so the
 * demo shows it. It stays a switch rather than a deletion because the
 * order in which a feature reaches the app, the dashboard and the demo is
 * not always the same.
 *
 * The matching switch in the resident app is
 * mobile-app/features/gift-cards/featureFlag.ts.
 */
const HOA_GIFT_CARDS_VISIBLE = true;

/**
 * Every link in either nav is prefixed with its product, because the URL
 * is how a demo link says which product it opens. See next.config.ts.
 */
export const CONDO_PREFIX = "/condo";
export const APARTMENT_PREFIX = "/apartment";

/**
 * The Condo sidebar, built for the prefix the visitor arrived on.
 *
 * A function rather than a constant because there are now two Condo cuts -
 * /condo and /condo+savings - and every href has to carry the one the
 * visitor is in, or their first click drops them into the other. See
 * lib/demo/product-path.ts for why the two exist.
 *
 * `withSavings` is the only difference in CONTENT: a Condo's residents own
 * the spots, so the building earning off them is a story HOA boards told us
 * reads wrong, and /condo leaves it out.
 */
export function condoNavItems({
  prefix = CONDO_PREFIX,
  withSavings = true,
}: { prefix?: string; withSavings?: boolean } = {}): readonly NavItem[] {
  return [
    { id: "dashboard",     label: "Dashboard",          Icon: IcDashboard,    href: prefix },
    { id: "residents",     label: "Resident Directory", Icon: IcResidentDirectory, href: `${prefix}/residents` },
    { id: "bookings",      label: "Bookings",           Icon: IcBookings,     href: `${prefix}/bookings` },
    ...(withSavings
      ? [{ id: "savings" as const, label: "Savings", Icon: IcCredit, href: `${prefix}/savings` }]
      : []),
    { id: "reward-redemption", label: "Reward Redemption", Icon: IcGiftCard, href: `${prefix}/reward-redemption`, enabled: HOA_GIFT_CARDS_VISIBLE },
    { id: "tickets",       label: "Support Tickets",    Icon: IcQuestion,     href: `${prefix}/tickets` },
    { id: "subscription",  label: "Subscription",       Icon: IcSubscription, href: `${prefix}/subscription`, requiredAction: Actions.ViewSubscription },
    { id: "settings",      label: "Settings",           Icon: IcSettings,     href: `${prefix}/settings` },
    // Profile and Access Management are NOT here. Both live in the avatar
    // menu in the header, and carrying them in the sidebar as well made the
    // nav longer without making anything reachable that was not already.
    { id: "notifications", label: "Notifications",      Icon: IcNotification, href: `${prefix}/notifications` },
  ];
}

/** The plain-/condo nav, for callers with no path in hand. */
export const navItems: readonly NavItem[] = condoNavItems();

/**
 * Apartments is a SEPARATE product, not an HOA with extra rows: the building
 * owns its spots, prices them itself and is paid in dollars, so it gets its
 * own nav and its own routes under /apartments - the same way the
 * super-admin console lives under /super-admin.
 *
 * Deliberately shares nothing with `navItems`. A change to the HOA nav must
 * not silently alter what an Apartments operator sees.
 *
 * Parking Spots has no row of its own. Spots and the windows they are free
 * in are two views of the same question - which of my spots can be booked,
 * and when - so they sit as two tabs on Availability rather than as two
 * sidebar entries an operator has to bounce between while pricing a level.
 * The old /apartment/spots and /apartment/availability URLs both still
 * work and open the tab they name.
 */
export const apartmentsNavItems: readonly NavItem[] = [
  { id: "dashboard",     label: "Dashboard",          Icon: IcDashboard,    href: "/apartment" },
  { id: "residents",     label: "Resident Directory", Icon: IcResidentDirectory, href: "/apartment/residents" },
  { id: "bookings",      label: "Bookings",           Icon: IcBookings,     href: "/apartment/bookings" },
  { id: "availability",  label: "Parking Spots",     Icon: IcParking,      href: "/apartment/parking-spots" },
  { id: "earnings",      label: "Earnings",           Icon: IcCredit,       href: "/apartment/earnings" },
  { id: "reward-redemption", label: "Reward Redemption", Icon: IcGiftCard, href: "/apartment/reward-redemption" },
  { id: "tickets",       label: "Support Tickets",    Icon: IcQuestion,     href: "/apartment/tickets" },
  { id: "subscription",  label: "Subscription",       Icon: IcSubscription, href: "/apartment/subscription" },
  { id: "settings",      label: "Settings",           Icon: IcSettings,     href: "/apartment/settings" },
  // Profile and Access Management are NOT here. Both live in the avatar
  // menu in the header, and carrying them in the sidebar as well made the
  // nav longer without making anything reachable that was not already.
  { id: "notifications", label: "Notifications",      Icon: IcNotification, href: "/apartment/notifications" },
];

/**
 * Filter the static nav by role. Items without `requiredAction` are always shown.
 *
 * `can()` already short-circuits super_admin → true and returns false for
 * null/undefined roles, so no special-casing is needed here.
 */
export function getNavItems(role: string | undefined | null): NavItem[] {
  return navItems.filter(
    (item) =>
      item.enabled !== false &&
      (!item.requiredAction || can(role, item.requiredAction)),
  );
}
