"use client";

import Link from "next/link";
import { useState } from "react";
import { colors } from "../colors";
import { useAuth } from "../auth/auth-provider";
import { getNavItems, NavId, type NavItem } from "./nav-data";
import { IcClose } from "../icons/IcClose";

export function Sidebar({ active, onClose, overlay, navItems }: { active?: NavId; onClose?: () => void; overlay?: boolean; navItems?: readonly NavItem[] }) {
  const [hoveredId, setHoveredId] = useState<NavId | null>(null);
  const { user } = useAuth();
  // `navItems` lets a route group supply its own nav - Apartments is a
  // separate product with its own pages, not an HOA with extra rows.
  // Omitted, the HOA/SA nav is resolved from the role exactly as before.
  const items = navItems ?? getNavItems(user?.role);
  // The logo goes to the dashboard of the product you are already in. It
  // used to point at "/", which forwards by stored preference - so an
  // Apartment visitor clicking the logo could land in the Condo demo, and
  // the whole point of the split URLs is that this cannot happen. The
  // first nav item IS that product's dashboard.
  const home = items[0]?.href ?? "/";

  return (
    <>
      {overlay && (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }} />
      )}
      <aside
        style={{
          width: 256, minWidth: 256,
          background: colors.sidebarBg,
          borderRight: `1px solid ${colors.sidebarBorder}`,
          display: "flex", flexDirection: "column", height: "100%",
          ...(overlay ? { position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 50, height: "100vh" } : {}),
        }}
      >
        {/* Logo */}
        <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0 }}>
          <Link href={home} style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- a fixed-size inline SVG; next/image adds a loader for no benefit */}
            <img src="/parqlet-logo-light.svg" alt="Parqlet" style={{ height: 22, width: "auto", display: "block" }} />
          </Link>
          {overlay && (
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
              <IcClose color="var(--color-text-weaker)" />
            </button>
          )}
        </div>


        {/* Nav */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 16px", flex: 1 }}>
          {items.map(({ id, label, Icon, href }) => {
            const isActive  = active === id;
            const isHovered = hoveredId === id && !isActive;
            const bgColor   = isActive ? colors.sidebarItemActive : isHovered ? "rgba(255,255,255,0.07)" : "transparent";
            const textColor = isActive ? colors.sidebarTextActive : isHovered ? "var(--color-text-white)" : colors.sidebarText;
            const resolvedHref = href ?? (id === "dashboard" ? "/" : `/${id}`);
            return (
              <Link
                key={id}
                href={resolvedHref}
                onMouseEnter={() => setHoveredId(id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={onClose}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  height: 48, padding: "12px 16px", borderRadius: 8,
                  background: bgColor, color: textColor,
                  textDecoration: "none", cursor: "pointer", width: "100%",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {/* Fixed-width slot. The icon set mixes 24px and 20px
                    artwork, so without it every 20px icon pulled its label
                    4px left of the others and the nav read as ragged. */}
                <span style={{ width: 24, display: "flex", justifyContent: "center", flexShrink: 0 }}>
                  <Icon color={textColor} />
                </span>
                <span style={{ fontSize: 16, lineHeight: "20px", fontWeight: 400 }}>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "0 16px 20px", textAlign: "center", display: "flex", flexDirection: "column", gap: 6 }}>
          <a href="https://parqlet-terms-and-privacy.notion.site/Terms-of-Service-35d38574a76480228d7bc194bc23c6de" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: colors.sidebarText, textDecoration: "none" }}>Terms of Service</a>
          <a href="https://parqlet-terms-and-privacy.notion.site/Privacy-Policy-35d38574a76480a0be27c1cac5735ebe" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: colors.sidebarText, textDecoration: "none" }}>Privacy Policy</a>
          <span style={{ fontSize: 14, color: colors.sidebarText }}>© 2026 Parqlet</span>
        </div>
      </aside>
    </>
  );
}