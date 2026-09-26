/**
 * Parqlet Admin Dashboard — shell.tsx
 *
 * BACKWARD-COMPATIBILITY RE-EXPORT LAYER
 * ========================================
 * This file re-exports all symbols originally defined in this file so that
 * existing page imports like `import { DashboardShell } from "../components/shell"`
 * continue to work without modification.
 *
 * All components have been moved to modular files:
 *   components/icons/   — 16 individual SVG icon files
 *   components/layout/  — DashboardShell, Header, Sidebar
 *   components/ui/       — HelpDrawer, NotificationDropdown, UserMenuDropdown, PolicyModal, Avatar
 *   components/hooks/    — useWindowWidth
 *   components/colors.ts — shared color tokens
 *
 * Phase 1.1 of the refactoring plan.
 */

// ─── Re-exports (mirrors the original public API of this file) ─────────────────

// Shared design tokens
export { colors } from "./colors";

// Hooks
export { useWindowWidth } from "./hooks/useWindowSize";

// Icons (14 exported icons)
export { IcDashboard }        from "./icons/IcDashboard";
export { IcBookings }          from "./icons/IcBookings";
export { IcParking }           from "./icons/IcParking";
export { IcResidentDirectory } from "./icons/IcResidentDirectory";
export { IcSubscription }      from "./icons/IcSubscription";
export { IcPerson }            from "./icons/IcPerson";
export { IcShield }            from "./icons/IcShield";
export { IcSettings }          from "./icons/IcSettings";
export { IcNotification }      from "./icons/IcNotification";
export { IcChevronDown }       from "./icons/IcChevronDown";
export { IcUser }              from "./icons/IcUser";
export { IcSignOut }           from "./icons/IcSignOut";
export { IcHamburger }         from "./icons/IcHamburger";
export { IcClose }             from "./icons/IcClose";

// UI components
export { Avatar }               from "./ui/avatar";
export { HelpDrawer }           from "./ui/HelpDrawer";
export { NotificationDropdown } from "./ui/NotificationDropdown";
export { UserMenuDropdown }     from "./ui/UserMenuDropdown";
export { PolicyModal }          from "./ui/PolicyModal";

// Nav data
export { navItems } from "./layout/nav-data";
export type { NavId } from "./layout/nav-data";

// Layout components
export { DashboardShell } from "./layout/DashboardShell";
export { Header }          from "./layout/Header";
export { Sidebar }         from "./layout/Sidebar";