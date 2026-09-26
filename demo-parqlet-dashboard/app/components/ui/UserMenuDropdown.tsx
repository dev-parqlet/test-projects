"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../auth/auth-provider";
import { IcPerson } from "../icons/IcPerson";
import { IcShield } from "../icons/IcShield";
import { IcSignOut } from "../icons/IcSignOut";
import { FloatingMenu } from "./FloatingMenu";

// Only these roles manage building access/permissions — Concierge and
// Security are operational roles with no reason to see this link.
const ACCESS_MANAGEMENT_ROLES = new Set(["admin", "lead_concierge"]);

export function UserMenuDropdown({
  onClose,
  anchorRef,
}: {
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}) {
  const { signOut, user } = useAuth();
  const canSeeAccessManagement = !!user?.role && ACCESS_MANAGEMENT_ROLES.has(user.role);

  const [hoveredItem, setHoveredItem] = useState<null | string>(null);

  const menuItem = (
    key: string,
    icon: React.ReactNode,
    label: string,
    danger = false,
    onClick?: () => void,
  ) => (
    <button
      key={key}
      onClick={onClick}
      onMouseEnter={() => setHoveredItem(key)}
      onMouseLeave={() => setHoveredItem(null)}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        width: "100%", padding: "12px 16px",
        background: hoveredItem === key ? "var(--color-gray-5)" : "none",
        border: "none", cursor: "pointer", textAlign: "left",
        fontFamily: "var(--font-family-body)",
        fontSize: "var(--font-size-tiny)",
        fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
        lineHeight: "var(--line-height-tiny)",
        color: danger ? "var(--color-fill-error)" : "var(--color-text-strong)",
        transition: "background 0.12s",
      }}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <FloatingMenu anchorRef={anchorRef} onClose={onClose} align="end">
    <div
      style={{
        width: 220,
        background: "var(--color-fill-white)",
        borderRadius: "var(--radius-12)",
        border: "1px solid var(--color-stroke-medium)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
        overflow: "hidden",
      }}
    >
      <Link href="/profile" style={{ textDecoration: "none", display: "block" }} onClick={onClose}>
        <div
          onMouseEnter={() => setHoveredItem("profile")}
          onMouseLeave={() => setHoveredItem(null)}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 16px",
            background: hoveredItem === "profile" ? "var(--color-gray-5)" : "none",
            cursor: "pointer",
            fontFamily: "var(--font-family-body)",
            fontSize: "var(--font-size-tiny)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            lineHeight: "var(--line-height-tiny)",
            color: "var(--color-text-strong)",
            transition: "background 0.12s",
          }}
        >
          <IcPerson color="var(--color-icon-weak)" />
          Your profile
        </div>
      </Link>
      {canSeeAccessManagement && (
        <Link
          href="/access"
          style={{ textDecoration: "none", display: "block" }}
          onClick={onClose}
        >
          <div
            onMouseEnter={() => setHoveredItem("access")}
            onMouseLeave={() => setHoveredItem(null)}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px",
              background: hoveredItem === "access" ? "var(--color-gray-5)" : "none",
              cursor: "pointer",
              fontFamily: "var(--font-family-body)",
              fontSize: "var(--font-size-tiny)",
              fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
              lineHeight: "var(--line-height-tiny)",
              color: "var(--color-text-strong)",
              transition: "background 0.12s",
            }}
          >
            <IcShield color="var(--color-icon-weak)" />
            Access management
          </div>
        </Link>
      )}
      <div style={{ borderTop: "1px solid var(--color-stroke-medium)", margin: "4px 0" }} />
      {menuItem("signout",    <IcSignOut />,                                 "Sign out", true, () => signOut())}
    </div>
    </FloatingMenu>
  );
}
