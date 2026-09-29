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
import { stripProductPrefix } from "../lib/demo/product-path";
import { HOA_ROLE_TOKENS } from "../(hoa)/lib/hoa-roles";

function pathnameToNavId(raw: string): NavId {
  // The browser shows /apartment/...; the routes underneath are /apartments/...
  const pathname = stripProductPrefix(raw);
  if (pathname === "/" || pathname === "/apartments")   return "dashboard";
  if (pathname.startsWith("/bookings"))                 return "bookings";
  if (pathname.startsWith("/residents"))                return "residents";
  if (pathname.startsWith("/reward-redemption"))        return "reward-redemption";
  // Spots is a tab of Availability now, so the old URL lights the same row
  // while its redirect runs.
  if (pathname.startsWith("/spots"))                    return "availability";
  if (pathname.startsWith("/availability"))             return "availability";
  if (pathname.startsWith("/revenue"))                  return "revenue";
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
