"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "../components/auth/auth-provider";
import { DashboardShell } from "../components/shell";
import { SuperAdminShell } from "../components/super-admin-shell";
import { AuthGuard } from "../components/auth/auth-guard";
import { BuildingFilterProvider } from "../components/context/building-filter-context";
import { useRealtimeAlerts } from "../components/hooks/useRealtimeAlerts";
import { AlertToast } from "../components/ui/AlertToast";
import type { NavId } from "../components/layout/nav-data";

type SuperAdminNavId = "overview" | "alerts" | "buildings" | "revenue" | "credits" | "sync" | "tickets" | "settings";

function pathnameToNavId(pathname: string): NavId {
  if (pathname === "/tickets") return "tickets";
  if (pathname.startsWith("/tickets/")) return "tickets";
  return "none";
}

function pathnameToSuperAdminNavId(pathname: string): SuperAdminNavId | undefined {
  if (pathname === "/tickets" || pathname.startsWith("/tickets/")) return "tickets";
  return undefined;
}

export default function TicketsLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const { alerts } = useRealtimeAlerts();

  if (!user) return null;

  if (user.role === "super_admin") {
    const active = pathnameToSuperAdminNavId(pathname);
    return (
      <AuthGuard allowedRoles={["super_admin"]} redirectTo="/bookings">
        <BuildingFilterProvider>
          <SuperAdminShell active={active} alertCount={alerts.length}>
            {children}
            <AlertToast alerts={alerts} />
          </SuperAdminShell>
        </BuildingFilterProvider>
      </AuthGuard>
    );
  }

  const active = pathnameToNavId(pathname);
  return (
    <AuthGuard allowedRoles={["admin", "lead_concierge", "concierge", "security"]} redirectTo="/sign-in">
      <DashboardShell active={active}>
        {children}
        <AlertToast alerts={alerts} />
      </DashboardShell>
    </AuthGuard>
  );
}