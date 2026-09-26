"use client";

import { useState } from "react";
import {
  IcDashboard,
  IcBookings,
  IcParking,
  IcSubscription,
  IcSettings,
  IcClose,
} from "../icons";
import { colors } from "../ui/chart-utils";

type NavId = "dashboard" | "bookings" | "parking" | "subscription" | "settings";

const navItems: { id: NavId; label: string; Icon: React.FC<{ color?: string }> }[] = [
  { id: "dashboard",    label: "Dashboard",    Icon: IcDashboard },
  { id: "bookings",    label: "Bookings",      Icon: IcBookings },
  { id: "parking",     label: "Parking lots",  Icon: IcParking },
  { id: "subscription",label: "Subscription", Icon: IcSubscription },
  { id: "settings",    label: "Settings",      Icon: IcSettings },
];

interface SidebarProps {
  active: NavId;
  onClose?: () => void;
  overlay?: boolean;
}

export function Sidebar({ active, onClose, overlay }: SidebarProps) {
  const [hoveredId, setHoveredId] = useState<NavId | null>(null);

  return (
    <>
      {/* Backdrop for overlay mode */}
      {overlay && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 40,
          }}
        />
      )}
      <aside
        style={{
          width: 256,
          minWidth: 256,
          background: colors.sidebarBg,
          borderRight: `1px solid ${colors.sidebarBorder}`,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          ...(overlay
            ? {
                position: "fixed",
                left: 0,
                top: 0,
                bottom: 0,
                zIndex: 50,
                height: "100vh",
              }
            : {}),
        }}
      >
        {/* Logo row */}
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            flexShrink: 0,
          }}
        >
          <svg width="132" height="33" viewBox="0 0 132 33" fill="none">
            <text
              x="0"
              y="26"
              fontFamily="Rubik, sans-serif"
              fontWeight="500"
              fontSize="22"
              fill="white"
              letterSpacing="-0.5"
            >
              Parqlet
            </text>
          </svg>
          {overlay && (
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
              }}
            >
              <IcClose color="var(--color-text-weaker)" />
            </button>
          )}
        </div>

        {/* Nav items */}
        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "0 16px",
            flex: 1,
          }}
        >
          {navItems.map(({ id, label, Icon }) => {
            const isActive = active === id;
            const isHovered = hoveredId === id && !isActive;
            const bgColor = isActive
              ? colors.sidebarItemActive
              : isHovered
              ? "rgba(255,255,255,0.07)"
              : "transparent";
            const textColor = isActive
              ? colors.sidebarTextActive
              : isHovered
              ? "var(--color-text-white)"
              : colors.sidebarText;
            return (
              <button
                key={id}
                onClick={onClose}
                onMouseEnter={() => setHoveredId(id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  height: 48,
                  padding: "12px 16px",
                  borderRadius: 8,
                  background: bgColor,
                  color: textColor,
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                <Icon color={textColor} />
                <span style={{ fontSize: 16, lineHeight: "20px", fontWeight: 400 }}>
                  {label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "0 16px 20px", textAlign: "center" }}>
          <span style={{ fontSize: 14, color: colors.sidebarText }}>© 2026 Parqlet</span>
        </div>
      </aside>
    </>
  );
}