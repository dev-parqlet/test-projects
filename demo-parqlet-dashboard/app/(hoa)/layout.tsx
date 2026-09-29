"use client";

import { usePathname } from "next/navigation";
import { DashboardShell } from "../components/shell";
import { AuthGuard } from "../components/auth/auth-guard";
import { NavId } from "../components/layout/nav-data";
import { stripProductPrefix } from "../lib/demo/product-path";
import { navItemsForPath } from "../lib/demo/nav-for-path";
import { HOA_ROLE_TOKENS } from "./lib/hoa-roles";
import { useRealtimeAlerts } from "../components/hooks/useRealtimeAlerts";
import { AlertToast } from "../components/ui/AlertToast";

function pathnameToNavId(raw: string): NavId {
  // The browser shows /condo/...; the routes underneath are unprefixed.
  const pathname = stripProductPrefix(raw);
  if (pathname === "/")                                            return "dashboard";
  if (pathname === "/bookings")                                    return "bookings";
  if (pathname === "/residents")                                   return "residents";
  if (pathname === "/tickets" || pathname.startsWith("/tickets/")) return "tickets";
  if (pathname === "/subscription")                                return "subscription";
  if (pathname === "/access")                                      return "access";
  if (pathname === "/settings")                                    return "settings";
  if (pathname === "/profile")                                     return "profile";
  if (pathname === "/notifications")                               return "notifications";
  if (pathname === "/reward-redemption")                           return "reward-redemption";
  if (pathname === "/spots")                                       return "spots";
  if (pathname === "/availability")                                return "availability";
  if (pathname === "/revenue")                                     return "revenue";
  return "none";
}

export default function HOALayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathnameToNavId(pathname);
  const { alerts } = useRealtimeAlerts();

  return (
    <AuthGuard allowedRoles={HOA_ROLE_TOKENS} redirectTo="/sign-in">
      <DashboardShell active={active} navItems={navItemsForPath(pathname)}>
        {children}
        <AlertToast alerts={alerts} />
      </DashboardShell>
    </AuthGuard>
  );
}
