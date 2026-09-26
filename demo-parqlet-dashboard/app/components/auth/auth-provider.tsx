"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { currentIdentity } from "../../lib/demo/variants";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  buildingId?: string;
  buildingIds?: string[]; // super_admin has all buildings → buildingIds=[] means "all"
  buildings?: { id: string; name: string }[]; // resolved building objects for display
  createdAt?: string;     // ISO timestamp from /api/auth/me
  phone?: string;
  unit?: string;
}

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  refresh: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: false,
  refresh: () => {},
  signOut: async () => {},
});

  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL ?? "https://api.parqlet.com"
    : "https://api.parqlet.com";

export const authKeys = {
  me: ["auth", "me"] as const,
};

// Never call /api/auth/me on public paths — avoids infinite loops on sign-in
// and during the onboarding wizard (which has no cookie-based session yet).
function isProtectedPath(): boolean {
  if (typeof window === "undefined") return true;
  const path = window.location.pathname;
  if (path === "/sign-in" || path.startsWith("/onboarding")) return false;
  return true;
}


/**
 * DEMO SITE — demo.parqlet.com.
 *
 * There is no account, no session and no backend to ask. The visitor picks
 * HOA or Apartments from the header switcher and that choice IS the
 * identity, so this resolves synchronously and the demo can never fail to
 * open because something upstream is down.
 *
 * The real dashboard's version of this calls GET /api/auth/me and falls back
 * to the DevAuthSwitcher on localhost; both paths were removed here rather
 * than left unreachable, so nobody later wonders which one is live.
 */
async function fetchMe(): Promise<SessionUser | null> {
  return currentIdentity().user as unknown as SessionUser;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [ready, setReady] = useState(false);

  // Defer the query until we know we're on a protected path — otherwise the
  // very first render on /sign-in would issue /api/auth/me and redirect-loop.
  useEffect(() => {
    setReady(true);
  }, []);

  const protectedPath = isProtectedPath();
  const enabled = ready && protectedPath;

  const meQuery = useQuery<SessionUser | null>({
    queryKey: authKeys.me,
    queryFn: fetchMe,
    enabled,
    staleTime: 60_000,
    retry: false,
  });


  const signOutMutation = useMutation({
    mutationFn: async () => {
      // Relative URL → goes through the local Next.js /api/auth/sign-out proxy,
      // which forwards to BACKEND_API_URL on the server. Going cross-origin to
      // ${BACKEND_URL} directly would 404 against the dashboard host in
      // production (there's no /api/auth/sign-out handler there) and leave the
      // session cookie untouched, which used to cause a sign-in <-> dashboard
      // redirect loop because the sign-in page then found the still-valid
      // session and bounced the user straight back.
      await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
      });
    },
    onSettled: () => {
      queryClient.setQueryData(authKeys.me, null);
      if (typeof window !== "undefined") {
        // Stash a "just signed out" timestamp so /sign-in's readExistingSession
        // can refuse to auto-redirect during the race between the (cleared) cookie
        // state and any in-flight /api/auth/me response. Without this, a slow or
        // failed sign-out fetch let readExistingSession see a still-valid cookie
        // and bounce the user straight back to /dashboard — restarting the loop.
        try {
          sessionStorage.setItem("parqlet_signed_out_at", String(Date.now()));
        } catch {
          // sessionStorage may be unavailable (private mode, quota); safe to ignore.
        }
        window.location.href = "/sign-in";
      }
    },
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: authKeys.me });
  }, [queryClient]);

  const value: AuthContextValue = {
    user: meQuery.data ?? null,
    // React Query v5 defines isLoading as `isPending && isFetching`, so a query
    // that is still *disabled* reports isLoading=false with data=undefined. On
    // the first client render `ready` is false (the effect above hasn't run
    // yet), so guards would see {loading:false, user:null} and bounce an
    // already-authenticated user to /sign-in before the session was ever
    // fetched. Treat "not started yet" as loading.
    //
    // Public paths never fetch, so they must stay non-loading — otherwise
    // /sign-in would render a spinner forever.
    loading: protectedPath ? !ready || meQuery.isPending : false,
    refresh,
    signOut: async () => {
      await signOutMutation.mutateAsync();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
