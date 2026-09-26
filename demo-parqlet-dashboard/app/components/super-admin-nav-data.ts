import { IcOverview } from "./super-admin-icons/IcOverview";
import { IcAlerts } from "./super-admin-icons/IcAlerts";
import { IcBuildings } from "./super-admin-icons/IcBuildings";
import { IcRevenue } from "./super-admin-icons/IcRevenue";
import { IcCredits } from "./super-admin-icons/IcCredits";
import { IcSync } from "./super-admin-icons/IcSync";
import { IcTickets } from "./super-admin-icons/IcTickets";
import { IcSettings } from "./super-admin-icons/IcSettings";
import { IcPerson } from "./icons/IcPerson";
import { IcResidentDirectory } from "./icons/IcResidentDirectory";

export type SuperAdminNavId =
  | "overview"
  | "alerts"
  | "buildings"
  | "revenue"
  | "credits"
  | "sync"
  | "tickets"
  | "settings"
  | "access-management"
  | "residents"
  | "profile";

export const SUPER_ADMIN_NAV_ITEMS: { id: SuperAdminNavId; label: string; href: string; Icon: React.FC<{ color?: string }> }[] = [
  { id: "overview", label: "Overview", href: "/super-admin", Icon: IcOverview },
  { id: "alerts", label: "Alerts", href: "/alerts", Icon: IcAlerts },
  { id: "buildings", label: "Buildings", href: "/buildings", Icon: IcBuildings },
  { id: "revenue", label: "Revenue", href: "/revenue", Icon: IcRevenue },
  { id: "credits", label: "Credits", href: "/credits", Icon: IcCredits },
  { id: "sync", label: "Sync Monitor", href: "/sync", Icon: IcSync },
  { id: "tickets", label: "Support Tickets", href: "/tickets", Icon: IcTickets },
  { id: "settings", label: "Settings", href: "/super-admin-settings", Icon: IcSettings },
  { id: "access-management", label: "Access Management", href: "/access-management", Icon: IcPerson },
  { id: "residents", label: "Residents", href: "/super-admin/residents", Icon: IcResidentDirectory },
  { id: "profile", label: "Profile", href: "/super-admin-profile", Icon: IcSettings },
];