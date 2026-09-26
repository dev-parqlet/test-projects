"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useShellResponsive } from "../hooks/useShellResponsive";
import { colors } from "../colors";
import { NavId, type NavItem } from "./nav-data";

export function DashboardShell({
  active,
  children,
  navItems,
}: {
  active?: NavId;
  children: React.ReactNode;
  /** Optional nav override — see Sidebar. */
  navItems?: readonly NavItem[];
}) {
  const { isDesktop, sidebarOpen, openSidebar, closeSidebar } = useShellResponsive();

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", overflow: "hidden", background: colors.white }}>
      {isDesktop && <Sidebar active={active} navItems={navItems} />}
      {!isDesktop && sidebarOpen && (
        <Sidebar active={active} navItems={navItems} overlay onClose={closeSidebar} />
      )}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, overflow: "hidden" }}>
        <Header showMenu={!isDesktop} onMenuOpen={openSidebar} />
        <main style={{ flex: 1, overflowY: "auto", background: colors.mainBg }}>
          {children}
        </main>
      </div>
    </div>
  );
}