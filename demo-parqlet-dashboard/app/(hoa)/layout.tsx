"use client";

import { usePathname } from "next/navigation";
import { DashboardShell } from "../components/shell";
import { AuthGuard } from "../components/auth/auth-guard";
import { NavId } from "../components/layout/nav-data";
import { HOA_ROLE_TOKENS } from "./lib/hoa-roles";
import { useRealtimeAlerts } from "../components/hooks/useRealtimeAlerts";
import { AlertToast } from "../components/ui/AlertToast";

function pathnameToNavId(pathname: string): NavId {
  if (pathname === "/")                                            return "dashboard";
  if (pathname === "/bookings")                                    return "bookings";
  if (pathname === "/parking")                                     return "parking";
  if (pathname === "/tickets" || pathname.startsWith("/tickets/")) return "tickets";
  if (pathname === "/subscription")                                return "subscription";
  if (pathname === "/access")                                      return "access";
  if (pathname === "/settings")                                    return "settings";
  if (pathname === "/profile")                                     return "profile";
  if (pathname === "/notifications")                               return "notifications";
  if (pathname === "/gift-cards")                                  return "gift-cards";
  if (pathname === "/spots")                                       return "spots";
  if (pathname === "/availability")                                return "availability";
  if (pathname === "/income")                                      return "income";
  return "none";
}

export default function HOALayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathnameToNavId(pathname);
  const { alerts } = useRealtimeAlerts();

  return (
    <AuthGuard allowedRoles={HOA_ROLE_TOKENS} redirectTo="/sign-in">
      <DashboardShell active={active}>
        {children}
        <AlertToast alerts={alerts} />
      </DashboardShell>
    </AuthGuard>
  );
}
