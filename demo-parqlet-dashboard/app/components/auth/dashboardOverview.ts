import type { SessionUser } from "./auth-provider";

/**
 * Where to land a freshly authenticated user on the role-appropriate
 * dashboard overview. Super admins get the cross-building aggregate
 * overview; everyone else lands on the per-building dashboard.
 *
 * Used by onboarding completion paths and anywhere else a fresh-session
 * user needs to be routed away from public pages.
 *
 * Never returns "/sign-in" — callers that previously had a `/sign-in`
 * fallback should call this helper and rely on `AuthGuard` to handle
 * any session-not-actually-set edge case.
 */
export function dashboardOverviewUrl(
  user: Pick<SessionUser, "role"> | null | undefined,
): string {
  return user?.role === "super_admin" ? "/super-admin" : "/dashboard";
}
