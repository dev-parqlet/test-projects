"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../components/auth/auth-provider";
import { DashboardShell } from "../components/layout/DashboardShell";
import { AuthGuard } from "../components/auth/auth-guard";
import { NavId } from "../components/layout/nav-data";
import { stripProductPrefix } from "../lib/demo/product-path";

function pathnameToNavId(raw: string): NavId {
  // The browser shows /condo/...; the routes underneath are unprefixed.
  const pathname = stripProductPrefix(raw);
  if (pathname === "/dashboard" || pathname === "/") return "dashboard";
  if (pathname === "/bookings") return "bookings";
  if (pathname === "/parking") return "parking";
  if (pathname === "/subscription") return "subscription";
  if (pathname === "/settings") return "settings";
  return "none";
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // The demo has no super-admin identity and no /super-admin routes - the
  // real dashboard bounces super admins to their aggregate overview here,
  // which would be a redirect to a 404.

  const active = pathnameToNavId(pathname);
  return (
    <AuthGuard allowedRoles={["admin", "lead_concierge", "concierge", "security"]} redirectTo="/sign-in">
      <DashboardShell active={active}>{children}</DashboardShell>
    </AuthGuard>
  );
}
