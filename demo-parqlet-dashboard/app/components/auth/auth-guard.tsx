"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { signInUrlForCurrentLocation } from "../../lib/callback-url";
import { useAuth } from "./auth-provider";

interface AuthGuardProps {
  children: React.ReactNode;
  /** Redirect to this path if the user's role is not in the allowed list. Defaults to "/" */
  redirectTo?: string;
  /** If set, the user must have one of these roles. super_admin bypasses most restrictions. */
  allowedRoles?: string[];
}

/**
 * AuthGuard — authentication + optional role check.
 *
 * - Shows a loading spinner while the session is being fetched.
 * - Redirects to sign-in if the user is not authenticated.
 * - Redirects to `redirectTo` if the user's role is not in `allowedRoles`.
 *
 * Usage:
 *   <AuthGuard allowedRoles={["super_admin"]}>
 *     {children}
 *   </AuthGuard>
 */
export function AuthGuard({ children, redirectTo = "/", allowedRoles }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (user === null) {
      // `replace`, not `push` — otherwise the guarded URL stays in history
      // behind /sign-in and the back button re-triggers this same bounce.
      router.replace(signInUrlForCurrentLocation());
      return;
    }

    if (allowedRoles && allowedRoles.length > 0) {
      // super_admin bypasses most role restrictions
      const isAllowed = user.role === "super_admin" || allowedRoles.includes(user.role);
      if (!isAllowed) {
        router.push(redirectTo);
      }
    }
  }, [user, loading, router, allowedRoles, redirectTo]);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-family-body, sans-serif)",
        color: "var(--color-text-weak, #666)",
      }}>
        Loading...
      </div>
    );
  }

  if (user === null) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
