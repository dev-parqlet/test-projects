"use client";

/**
 * Apartments dashboard shell.
 *
 * A separate product from HOA, not a variation of it: the building owns its
 * spots, prices them itself and is paid in dollars, where an HOA's
 * residents own the spots and guests pay in credits. So it gets its own
 * route group, its own nav and its own pages, exactly as the super-admin
 * console does - nothing here is shared with `(hoa)`, so a change to one
 * cannot silently alter the other.
 */

import { usePathname } from "next/navigation";

import { DashboardShell } from "../components/shell";
import { AuthGuard } from "../components/auth/auth-guard";
import { NavId, apartmentsNavItems } from "../components/layout/nav-data";
import { HOA_ROLE_TOKENS } from "../(hoa)/lib/hoa-roles";

function pathnameToNavId(pathname: string): NavId {
  if (pathname === "/apartments")                  return "dashboard";
  if (pathname.startsWith("/apartments/bookings")) return "bookings";
  if (pathname.startsWith("/apartments/spots"))    return "spots";
  if (pathname.startsWith("/apartments/availability")) return "availability";
  if (pathname.startsWith("/apartments/revenue"))  return "revenue";
  return "none";
}

export default function ApartmentsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AuthGuard allowedRoles={HOA_ROLE_TOKENS} redirectTo="/sign-in">
      <DashboardShell active={pathnameToNavId(pathname)} navItems={apartmentsNavItems}>
        {children}
      </DashboardShell>
    </AuthGuard>
  );
}
