"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../components/auth/auth-provider";
import { DashboardShell } from "../components/layout/DashboardShell";
import { AuthGuard } from "../components/auth/auth-guard";
import { NavId } from "../components/layout/nav-data";

function pathnameToNavId(pathname: string): NavId {
  if (pathname === "/dashboard") return "dashboard";
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

  // /dashboard is the HOA-admin building dashboard. Super admins have their own
  // aggregate overview at /super-admin — bounce them there instead of rendering
  // building-scoped HOA content inside the super-admin shell.
  useEffect(() => {
    if (user?.role === "super_admin") {
      router.replace("/super-admin");
    }
  }, [user?.role, router]);

  if (user?.role === "super_admin") return null;

  const active = pathnameToNavId(pathname);
  return (
    <AuthGuard allowedRoles={["admin", "lead_concierge", "concierge", "security"]} redirectTo="/sign-in">
      <DashboardShell active={active}>{children}</DashboardShell>
    </AuthGuard>
  );
}
