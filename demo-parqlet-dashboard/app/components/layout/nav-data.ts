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
  | "income"
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
 * Gift Cards is built and live for Super Admins, who need it to watch
 * redemptions and Tremendous funding, but it is not being shown to HOA
 * staff until the feature is announced to their residents. The page
 * itself still works — this hides the way in, so flipping it back is
 * one word.
 *
 * The matching switch in the resident app is
 * mobile-app/features/gift-cards/featureFlag.ts.
 */
const HOA_GIFT_CARDS_VISIBLE = false;

export const navItems: readonly NavItem[] = [
  { id: "dashboard",     label: "Dashboard",          Icon: IcDashboard },
  { id: "bookings",      label: "Bookings",           Icon: IcBookings },
  { id: "parking",       label: "Resident Directory", Icon: IcResidentDirectory },
  { id: "tickets",       label: "Support Tickets",    Icon: IcQuestion,     href: "/tickets" },
  { id: "subscription",  label: "Subscription",       Icon: IcSubscription, requiredAction: Actions.ViewSubscription },
  { id: "access",        label: "Access Management",  Icon: IcPerson,       requiredAction: Actions.InviteTeamMember },
  { id: "settings",      label: "Settings",           Icon: IcSettings },
  { id: "profile",       label: "Profile",            Icon: IcPerson,       href: "/profile" },
  { id: "notifications", label: "Notifications",      Icon: IcNotification, href: "/notifications" },
  { id: "gift-cards",    label: "Gift Cards",         Icon: IcGiftCard,     href: "/gift-cards", enabled: HOA_GIFT_CARDS_VISIBLE },

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
  { id: "dashboard",     label: "Dashboard",        Icon: IcDashboard,    href: "/apartments" },
  { id: "bookings",      label: "Bookings",         Icon: IcBookings,     href: "/apartments/bookings" },
  { id: "spots",         label: "Parking Spots",    Icon: IcParking,      href: "/apartments/spots" },
  { id: "availability",  label: "Availability",     Icon: IcBookings,     href: "/apartments/availability" },
  { id: "income",        label: "Income",           Icon: IcCredit,       href: "/apartments/income" },
  { id: "tickets",       label: "Support Tickets",  Icon: IcQuestion,     href: "/tickets" },
  { id: "subscription",  label: "Subscription",     Icon: IcSubscription, href: "/subscription" },
  { id: "access",        label: "Access Management", Icon: IcPerson,      href: "/access" },
  { id: "settings",      label: "Settings",         Icon: IcSettings,     href: "/settings" },
  { id: "profile",       label: "Profile",          Icon: IcPerson,       href: "/profile" },
  { id: "notifications", label: "Notifications",    Icon: IcNotification, href: "/notifications" },
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
