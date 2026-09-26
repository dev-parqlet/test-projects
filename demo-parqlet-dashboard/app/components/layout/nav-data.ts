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
import { readVariant } from "../../lib/demo/variants";

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
  /** Which demo product this item belongs to. Omitted means both.
   *  An Apartments building owns its spots and is paid in dollars; an
   *  HOA does neither, so the two nav sets genuinely differ. */
  variants?: readonly ("hoa" | "apartments")[];
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

  // ── Apartments only ────────────────────────────────────────────────────
  // The building owns the spots, sets a price on each one, and is paid in
  // dollars. None of that exists for an HOA, where residents own the spots
  // and guests are paid for in credits.
  { id: "spots",         label: "Parking Spots",      Icon: IcParking,      href: "/spots",        variants: ["apartments"] },
  { id: "availability",  label: "Availability",       Icon: IcBookings,     href: "/availability", variants: ["apartments"] },
  { id: "income",        label: "Income",             Icon: IcCredit,      href: "/income",       variants: ["apartments"] },
] as const;

/**
 * Filter the static nav by role. Items without `requiredAction` are always shown.
 *
 * `can()` already short-circuits super_admin → true and returns false for
 * null/undefined roles, so no special-casing is needed here.
 */
export function getNavItems(role: string | undefined | null): NavItem[] {
  // DEMO: the visitor's chosen product decides which nav they see. In the
  // real dashboard this would come from the building's type rather than
  // from a browser choice.
  const variant = readVariant();
  return navItems.filter(
    (item) =>
      item.enabled !== false &&
      (!item.variants || item.variants.includes(variant)) &&
      (!item.requiredAction || can(role, item.requiredAction)),
  );
}
