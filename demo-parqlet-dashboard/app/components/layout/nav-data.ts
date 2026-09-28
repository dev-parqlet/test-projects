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
  | "parking"
  | "tickets"
  | "subscription"
  | "access"
  | "settings"
  | "profile"
  | "notifications"
  | "gift-cards"
  | "spots"
  | "availability"
  | "revenue"
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

export const navItems: readonly NavItem[] = [
  { id: "dashboard",     label: "Dashboard",          Icon: IcDashboard,    href: "/condo" },
  { id: "bookings",      label: "Bookings",           Icon: IcBookings,     href: "/condo/bookings" },
  { id: "parking",       label: "Resident Directory", Icon: IcResidentDirectory, href: "/condo/parking" },
  { id: "tickets",       label: "Support Tickets",    Icon: IcQuestion,     href: "/condo/tickets" },
  { id: "revenue",       label: "Revenue",            Icon: IcCredit,       href: "/condo/revenue" },
  { id: "subscription",  label: "Subscription",       Icon: IcSubscription, href: "/condo/subscription", requiredAction: Actions.ViewSubscription },
  { id: "access",        label: "Access Management",  Icon: IcPerson,       href: "/condo/access", requiredAction: Actions.InviteTeamMember },
  { id: "settings",      label: "Settings",           Icon: IcSettings,     href: "/condo/settings" },
  { id: "profile",       label: "Profile",            Icon: IcPerson,       href: "/condo/profile" },
  { id: "notifications", label: "Notifications",      Icon: IcNotification, href: "/condo/notifications" },
  { id: "gift-cards",    label: "Gift Cards",         Icon: IcGiftCard,     href: "/condo/gift-cards", enabled: HOA_GIFT_CARDS_VISIBLE },
] as const;

/**
 * Apartments is a SEPARATE product, not an HOA with extra rows: the building
 * owns its spots, prices them itself and is paid in dollars, so it gets its
 * own nav and its own routes under /apartments - the same way the
 * super-admin console lives under /super-admin.
 *
 * Deliberately shares nothing with `navItems`. A change to the HOA nav must
 * not silently alter what an Apartments operator sees.
 */
export const apartmentsNavItems: readonly NavItem[] = [
  { id: "dashboard",     label: "Dashboard",        Icon: IcDashboard,    href: "/apartment" },
  { id: "bookings",      label: "Bookings",         Icon: IcBookings,     href: "/apartment/bookings" },
  { id: "spots",         label: "Parking Spots",    Icon: IcParking,      href: "/apartment/spots" },
  { id: "availability",  label: "Availability",     Icon: IcBookings,     href: "/apartment/availability" },
  { id: "revenue",       label: "Revenue",          Icon: IcCredit,       href: "/apartment/revenue" },
  { id: "tickets",       label: "Support Tickets",  Icon: IcQuestion,     href: "/apartment/tickets" },
  { id: "subscription",  label: "Subscription",     Icon: IcSubscription, href: "/apartment/subscription" },
  { id: "access",        label: "Access Management", Icon: IcPerson,      href: "/apartment/access" },
  { id: "settings",      label: "Settings",         Icon: IcSettings,     href: "/apartment/settings" },
  { id: "profile",       label: "Profile",          Icon: IcPerson,       href: "/apartment/profile" },
  { id: "notifications", label: "Notifications",    Icon: IcNotification, href: "/apartment/notifications" },
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
