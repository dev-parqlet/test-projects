/**
 * Parqlet Admin Dashboard — super-admin-shell.tsx
 *
 * BACKWARD-COMPATIBILITY RE-EXPORT LAYER
 * ========================================
 * This file re-exports all symbols originally defined in this file so that
 * existing page imports continue to work without modification.
 *
 * Phase 1.2 of the refactoring plan.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useWindowWidth } from "./hooks/useWindowSize";
import { useBuildingFilter } from "./context/building-filter-context";

// ─── Re-export: Icons (10 super-admin-specific icons) ──────────────────────────
export {
  IcOverview, IcAlerts, IcBuildings, IcRevenue, IcCredits,
  IcSync, IcTickets, IcSettings, IcChevronDown, IcCheck,
} from "./super-admin-icons";

// ─── Re-export: Nav data ───────────────────────────────────────────────────────
export { SUPER_ADMIN_NAV_ITEMS } from "./super-admin-nav-data";
export type { SuperAdminNavId } from "./super-admin-nav-data";

// ─── Re-export: UI components ──────────────────────────────────────────────────
export { BuildingFilterDropdown } from "./ui/BuildingFilterDropdown";
export { AccountMenu }             from "./ui/AccountMenu";

// ─── SuperAdminShell (inline — kept here to avoid circular deps) ────────────────
// SuperAdminShell is too intertwined with NAV_ITEMS and inline sidebar to extract
// cleanly today. It will be addressed in Phase 1.5 (AdminShellBase extraction).
// Import extracted icons directly from their modules for use inside this component.
import {
  IcOverview, IcAlerts, IcBuildings, IcRevenue, IcCredits,
  IcSync, IcTickets, IcSettings, IcBookings, IcBroadcast,
} from "./super-admin-icons";
import { IcGiftCard } from "./icons/IcGiftCard";
import { IcPerson } from "./icons/IcPerson";
import { IcResidentDirectory } from "./icons/IcResidentDirectory";
import { BuildingFilterDropdown } from "./ui/BuildingFilterDropdown";
import { AccountMenu }             from "./ui/AccountMenu";
import { HeaderThemeToggle }       from "./ui/HeaderThemeToggle";

const SUPER_ADMIN_NAV_ITEMS = [
  { id: "overview" as const,  label: "Overview",          href: "/super-admin",              Icon: IcOverview  },
  { id: "alerts"   as const,  label: "Alerts",             href: "/alerts",                   Icon: IcAlerts    },
  { id: "buildings" as const, label: "Buildings",          href: "/buildings",                Icon: IcBuildings },
  { id: "revenue"   as const, label: "Revenue",            href: "/revenue",                  Icon: IcRevenue   },
  { id: "credits"   as const, label: "Credits",           href: "/credits",                  Icon: IcCredits   },
  { id: "sync"      as const, label: "Sync Monitor",       href: "/sync",                     Icon: IcSync      },
  { id: "tickets"   as const, label: "Support Tickets",   href: "/tickets",                  Icon: IcTickets   },
  { id: "settings"  as const, label: "Settings",          href: "/super-admin-settings",      Icon: IcSettings  },
  { id: "access-management" as const, label: "Access Management", href: "/access-management",   Icon: IcPerson },
  { id: "residents" as const, label: "Residents",         href: "/super-admin/residents",     Icon: IcResidentDirectory },
  { id: "bookings"  as const, label: "Bookings",          href: "/super-admin/bookings",       Icon: IcBookings },
  { id: "broadcasts" as const, label: "Broadcasts",       href: "/super-admin/broadcasts",     Icon: IcBroadcast },
  { id: "gift-cards" as const, label: "Gift Cards",       href: "/super-admin/gift-cards",     Icon: IcGiftCard },
];

export function SuperAdminShell({
  active,
  children,
  alertCount = 0,
}: {
  active?: "overview" | "alerts" | "buildings" | "revenue" | "credits" | "sync" | "tickets" | "settings" | "access-management" | "residents" | "bookings" | "broadcasts" | "gift-cards" | "profile";
  children: React.ReactNode;
  alertCount?: number;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const width = useWindowWidth();
  const isDesktop = width >= 1024;

  const sidebar = (
    <div style={{
      width: 256, minWidth: 256,
      background: "var(--color-primary-strong)",
      borderRight: "1px solid var(--color-gray-90)",
      display: "flex", flexDirection: "column",
      height: "100%",
    }}>
      {/* Logo */}
      <div style={{
        height: 64, padding: "0 24px",
        display: "flex", alignItems: "center", gap: 10,
        borderBottom: "1px solid var(--color-gray-90)",
      }}>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/parqlet-logo-light.svg" alt="Parqlet" style={{ height: 22, width: "auto", display: "block", marginBottom: 4 }} />
          <div style={{
            fontSize: 11, fontWeight: 500,
            color: "var(--color-text-accent)",
            lineHeight: "14px", letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}>Super Admin</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
        {SUPER_ADMIN_NAV_ITEMS.map(({ id, label, href, Icon }) => {
          const isActive = active === id;
          const isHovered = hoveredId === id && !isActive;
          const textColor = isActive ? "var(--color-text-accent)" : isHovered ? "var(--color-text-white)" : "var(--color-text-weaker)";
          const bg = isActive ? "var(--color-gray-90)" : isHovered ? "rgba(255,255,255,0.06)" : "transparent";
          return (
            <Link
              key={id}
              href={href}
              onMouseEnter={() => setHoveredId(id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => setMobileOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                height: 44, padding: "0 14px",
                borderRadius: "var(--radius-8)",
                background: bg, color: textColor,
                textDecoration: "none", cursor: "pointer",
                transition: "background 0.12s, color 0.12s",
                fontFamily: "var(--font-family-body)",
                fontSize: "var(--font-size-body)",
                fontWeight: "400" as React.CSSProperties["fontWeight"],
                lineHeight: "var(--line-height-body)",
              }}
            >
              <Icon color={textColor} />
              {label}
              {id === "alerts" && alertCount > 0 && (
                <span style={{
                  marginLeft: "auto",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 20,
                  height: 18,
                  borderRadius: 9,
                  background: "var(--color-fill-accent)",
                  // Fixed brand color, doesn't invert in dark mode — keep text dark.
                  color: "#222222",
                  fontSize: 10,
                  fontWeight: "600" as React.CSSProperties["fontWeight"],
                  fontFamily: "var(--font-family-body)",
                  padding: "0 5px",
                  lineHeight: "18px",
                }}>
                  {alertCount > 99 ? "99+" : alertCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Super Admin badge + copyright */}
      <div style={{ padding: "12px 16px 20px", borderTop: "1px solid var(--color-gray-90)" }}>
        <div style={{
          display: "inline-flex", alignItems: "center",
          background: "var(--color-fill-accent)",
          borderRadius: 99, padding: "3px 10px",
          fontSize: 11, fontWeight: 600,
          // Fixed brand color, doesn't invert in dark mode — keep text dark.
          color: "#222222",
          letterSpacing: "0.3px",
          marginBottom: 10,
        }}>
          ⚙ Internal Platform
        </div>
        <div style={{
          fontSize: 12, color: "var(--color-text-weaker)",
          fontFamily: "var(--font-family-body)",
        }}>
          © 2026 Parqlet
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", overflow: "hidden" }}>
      {/* Desktop sidebar */}
      {isDesktop && sidebar}

      {/* Mobile sidebar overlay */}
      {!isDesktop && mobileOpen && (
        <>
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 40 }}
            onClick={() => setMobileOpen(false)}
          />
          <div style={{ position: "fixed", top: 0, left: 0, height: "100%", zIndex: 50 }}>
            {sidebar}
          </div>
        </>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100%" }}>
        {/* Header */}
        <div style={{
          height: 64, flexShrink: 0,
          background: "var(--color-fill-white)",
          borderBottom: "1px solid var(--color-stroke-medium)",
          display: "flex", alignItems: "center",
          padding: "0 24px", gap: 16,
        }}>
          {!isDesktop && (
            <button
              onClick={() => setMobileOpen(true)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M3 12h18M3 18h18" stroke="var(--color-icon-strong)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}

          <span style={{ flex: 1 }} />

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flexShrink: 1 }}>
            <HeaderThemeToggle />
            <BuildingFilterDropdown />
            <AccountMenu />
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", background: "var(--color-fill-weak)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
