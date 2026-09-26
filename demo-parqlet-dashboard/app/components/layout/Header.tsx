"use client";

import { useRef, useState } from "react";
import { colors } from "../colors";
import { Avatar } from "../ui/avatar";
import { NotificationDropdown } from "../ui/NotificationDropdown";
import { UserMenuDropdown } from "../ui/UserMenuDropdown";
import { HelpDrawer } from "../ui/HelpDrawer";
import { HeaderThemeToggle } from "../ui/HeaderThemeToggle";
import { useAuth } from "../auth/auth-provider";
import { IcHamburger } from "../icons/IcHamburger";
import { IcNotification } from "../icons/IcNotification";
import { IcChevronDown } from "../icons/IcChevronDown";
import { IcQuestion } from "../icons/IcQuestion";
import { BuildingFilterDropdown } from "../ui/BuildingFilterDropdown";
import { DemoVariantSwitcher } from "../demo/DemoVariantSwitcher";

const iconBtnStyle = (hovered: boolean): React.CSSProperties => ({
  background: hovered ? "var(--color-fill-weak)" : "none",
  border: "none", cursor: "pointer",
  width: 36, height: 36,
  display: "flex", alignItems: "center", justifyContent: "center",
  borderRadius: 8, flexShrink: 0,
  transition: "background 0.15s",
});

export function Header({ onMenuOpen, showMenu }: { onMenuOpen?: () => void; showMenu?: boolean }) {
  const { user } = useAuth();
  const userMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [bellHovered,  setBellHovered]  = useState(false);
  const [menuHovered,  setMenuHovered]  = useState(false);
  const [userHovered,  setUserHovered]  = useState(false);
  const [helpHovered,  setHelpHovered]  = useState(false);
  const [helpOpen,     setHelpOpen]     = useState(false);

  const displayName = user?.name ?? "—";
  const displayRole = user?.role
    ? user.role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "—";
  const buildingName = user?.buildings?.[0]?.name ?? null;

  return (
    <header
      style={{
        height: 64, background: colors.white,
        borderBottom: `1px solid ${colors.headerBorder}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", flexShrink: 0, gap: 12, position: "relative", zIndex: 100,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "1 1 auto", minWidth: 0, overflow: "hidden" }}>
        {showMenu && (
          <button
            onClick={onMenuOpen}
            onMouseEnter={() => setMenuHovered(true)}
            onMouseLeave={() => setMenuHovered(false)}
            style={iconBtnStyle(menuHovered)}
          >
            <IcHamburger />
          </button>
        )}
        {user?.role === "super_admin" ? (
          <BuildingFilterDropdown />
        ) : (
          <span style={{ fontSize: 16, fontWeight: 500, color: colors.textStrong, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>
            {buildingName ?? user?.name ?? "—"}
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
        {/* DEMO ONLY — flips the whole site between the HOA and Apartments
            products. Does not exist in the real dashboard. */}
        <DemoVariantSwitcher />
        <HeaderThemeToggle />
        <div style={{ position: "relative", flexShrink: 0 }} data-notification-dropdown>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            onMouseEnter={() => setBellHovered(true)}
            onMouseLeave={() => setBellHovered(false)}
            style={iconBtnStyle(bellHovered || notifOpen)}
          >
            <IcNotification color={notifOpen ? "var(--color-text-strong)" : undefined} />
          </button>
          {notifOpen && <NotificationDropdown onClose={() => setNotifOpen(false)} />}
        </div>
        <div style={{ position: "relative", minWidth: 0 }}>
          <button
            ref={userMenuTriggerRef}
            onClick={() => { setUserMenuOpen((o) => !o); setNotifOpen(false); }}
            onMouseEnter={() => setUserHovered(true)}
            onMouseLeave={() => setUserHovered(false)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              background: userHovered || userMenuOpen ? "var(--color-fill-weak)" : "none",
              border: "none", cursor: "pointer", borderRadius: 8,
              padding: "4px 8px", transition: "background 0.15s",
              minWidth: 0, maxWidth: "100%", boxSizing: "border-box",
            }}
          >
            <Avatar size={28} name={user?.name} />
            <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start", minWidth: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 500, lineHeight: "16px", color: colors.textStrong, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{displayName}</span>
              <span style={{ fontSize: 12, lineHeight: "16px", color: colors.textWeak, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{displayRole}</span>
            </div>
            <IcChevronDown />
          </button>
          {userMenuOpen && <UserMenuDropdown onClose={() => setUserMenuOpen(false)} anchorRef={userMenuTriggerRef} />}
        </div>
        <button
          onClick={() => setHelpOpen(true)}
          onMouseEnter={() => setHelpHovered(true)}
          onMouseLeave={() => setHelpHovered(false)}
          style={iconBtnStyle(helpHovered || helpOpen)}
          title="Help & Support"
        >
          <IcQuestion color={helpOpen ? "var(--color-text-strong)" : undefined} />
        </button>
      </div>
      {helpOpen && <HelpDrawer onClose={() => setHelpOpen(false)} />}
    </header>
  );
}