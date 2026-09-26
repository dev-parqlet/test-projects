/**
 * useShellResponsive — shared responsive state for admin shells.
 *
 * Encapsulates the width-tracking + sidebar-open/mobile-overlay logic
 * used identically in both DashboardShell and SuperAdminShell.
 *
 * Breakpoint: 1024px (sidebar shows on desktop, overlay on mobile).
 *
 * Usage:
 *   const { width, isDesktop, sidebarOpen, openSidebar, closeSidebar } = useShellResponsive();
 *
 * Phase 1.5 of the refactoring plan.
 */
"use client";

import { useState, useEffect } from "react";

export function useShellResponsive() {
  const [width, setWidth] = useState(1280);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    function onResize() { setWidth(window.innerWidth); }
    setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isDesktop = width >= 1024;

  function openSidebar()  { setSidebarOpen(true); }
  function closeSidebar(){ setSidebarOpen(false); }
  function toggleSidebar(){ setSidebarOpen((o) => !o); }

  return {
    width,
    isDesktop,
    sidebarOpen,
    openSidebar,
    closeSidebar,
    toggleSidebar,
  };
}
