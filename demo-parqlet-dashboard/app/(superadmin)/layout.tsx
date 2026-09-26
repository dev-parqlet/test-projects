"use client";

import { usePathname } from "next/navigation";
import { BuildingFilterProvider } from "../components/context/building-filter-context";
import { SuperAdminShell } from "../components/super-admin-shell";
import { AuthGuard } from "../components/auth/auth-guard";
import { useRealtimeAlerts } from "../components/hooks/useRealtimeAlerts";
import { AlertToast } from "../components/ui/AlertToast";

type SuperAdminNavId = "overview" | "alerts" | "buildings" | "revenue" | "credits" | "sync" | "tickets" | "settings" | "access-management" | "residents" | "bookings" | "broadcasts" | "gift-cards";

function pathnameToSuperAdminNavId(pathname: string): SuperAdminNavId | undefined {
  if (pathname === "/super-admin") return "overview";
  if (pathname === "/alerts") return "alerts";
  if (pathname === "/buildings" || pathname.startsWith("/buildings/")) return "buildings";
  if (pathname === "/revenue") return "revenue";
  if (pathname === "/credits") return "credits";
  if (pathname === "/sync") return "sync";
  if (pathname === "/tickets") return "tickets";
  if (pathname === "/super-admin-settings") return "settings";
  if (pathname === "/access-management") return "access-management";
  if (pathname === "/super-admin/residents" || pathname.startsWith("/super-admin/residents/")) return "residents";
  if (pathname === "/super-admin/bookings") return "bookings";
  if (pathname === "/super-admin/broadcasts") return "broadcasts";
  if (pathname === "/super-admin/gift-cards") return "gift-cards";
  return undefined;
}

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathnameToSuperAdminNavId(pathname);
  const { alerts } = useRealtimeAlerts();

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
