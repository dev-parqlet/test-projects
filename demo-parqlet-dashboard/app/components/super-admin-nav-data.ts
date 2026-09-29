/**
 * The super-admin sidebar, in one place.
 *
 * There used to be two of these - this list, and a second copy inside
 * super-admin-shell.tsx that shadowed the re-export of this one. The copy
 * was what actually rendered, so this file's version had silently drifted:
 * it was missing Bookings, Broadcasts and Gift Cards, and carried a
 * Profile entry the real nav never showed. Anyone editing the "shared"
 * list would have changed nothing on screen.
 *
 * Profile and Access Management are deliberately NOT here. Both live in
 * the account menu in the header, and carrying them in the sidebar as well
 * made the nav longer without making anything reachable that was not.
 */

import { IcOverview } from "./super-admin-icons/IcOverview";
import { IcAlerts } from "./super-admin-icons/IcAlerts";
import { IcBuildings } from "./super-admin-icons/IcBuildings";
import { IcRevenue } from "./super-admin-icons/IcRevenue";
import { IcCredits } from "./super-admin-icons/IcCredits";
import { IcSync } from "./super-admin-icons/IcSync";
import { IcTickets } from "./super-admin-icons/IcTickets";
import { IcSettings } from "./super-admin-icons/IcSettings";
import { IcResidentDirectory } from "./icons/IcResidentDirectory";
import { IcBookings } from "./super-admin-icons/IcBookings";
import { IcBroadcast } from "./super-admin-icons/IcBroadcast";
import { IcGiftCard } from "./icons/IcGiftCard";

/**
 * Every screen a super-admin page can mark as active.
 *
 * Wider than the nav itself: `access-management` and `profile` are real
 * pages that no longer have a sidebar entry, and they still need to say
 * which shell they belong to.
 */
export type SuperAdminNavId =
  | "overview"
  | "alerts"
  | "buildings"
  | "revenue"
  | "credits"
  | "sync"
  | "tickets"
  | "settings"
  | "residents"
  | "bookings"
  | "broadcasts"
  | "gift-cards"
  | "access-management"
  | "profile";

export const SUPER_ADMIN_NAV_ITEMS: {
  id: SuperAdminNavId;
  label: string;
  href: string;
  Icon: React.FC<{ color?: string }>;
}[] = [
  { id: "overview",   label: "Overview",          href: "/super-admin",              Icon: IcOverview },
  { id: "alerts",     label: "Alerts",            href: "/alerts",                   Icon: IcAlerts },
  { id: "buildings",  label: "Buildings",         href: "/buildings",                Icon: IcBuildings },
  { id: "revenue",    label: "Revenue",           href: "/revenue",                  Icon: IcRevenue },
  { id: "credits",    label: "Credits",           href: "/credits",                  Icon: IcCredits },
  { id: "sync",       label: "Sync Monitor",      href: "/sync",                     Icon: IcSync },
  { id: "tickets",    label: "Support Tickets",   href: "/tickets",                  Icon: IcTickets },
  { id: "settings",   label: "Settings",          href: "/super-admin-settings",     Icon: IcSettings },
  { id: "residents",  label: "Residents",         href: "/super-admin/residents",    Icon: IcResidentDirectory },
  { id: "bookings",   label: "Bookings",          href: "/super-admin/bookings",     Icon: IcBookings },
  { id: "broadcasts", label: "Broadcasts",        href: "/super-admin/broadcasts",   Icon: IcBroadcast },
  // Named for what it is to a resident, matching the building dashboards.
  { id: "gift-cards", label: "Reward Redemption", href: "/super-admin/gift-cards",   Icon: IcGiftCard },
];
