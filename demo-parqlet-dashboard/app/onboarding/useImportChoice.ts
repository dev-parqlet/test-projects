"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";

const TOKEN_STORAGE_KEY = "parqlet_onboarding_token";
const CHOICE_CACHE_KEY = "parqlet_onboarding_import_choice";

export type ImportChoice = "bms" | "upload";

interface CachedChoice {
  token: string;
  choice: ImportChoice;
}

export const importChoiceKeys = {
  detail: (token: string | null) => ["importChoice", token ?? ""] as const,
};

/**
 * Human-readable label for the import-method choice, used by both the wizard
 * and the super-admin building detail page. Returns "—" when nothing is set.
 */
export function residentImportLabel(type?: ImportChoice | null): string {
  if (type === "bms") return "Building management system sync";
  if (type === "upload") return "Manual file upload";
  return "—";
}

function readStoredToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function currentToken(): string | null {
  if (typeof window === "undefined") return null;
  const urlToken = new URLSearchParams(window.location.search).get("token");
  return urlToken ?? readStoredToken();
}

function readCachedChoice(currentToken: string): ImportChoice | null {
  try {
    const raw = sessionStorage.getItem(CHOICE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedChoice>;
    if (!parsed || typeof parsed !== "object") return null;
    // Reject the cached entry if it was written for a different invite.
    if (parsed.token !== currentToken) return null;
    return parsed.choice ?? null;
  } catch {
    return null;
  }
}

function writeCachedChoice(token: string, choice: ImportChoice) {
  try {
    const cached: CachedChoice = { token, choice };
    sessionStorage.setItem(CHOICE_CACHE_KEY, JSON.stringify(cached));
  } catch {
    // storage full or unavailable — the QueryClient cache is still authoritative
  }
}

async function postImportPreference(
  choice: ImportChoice,
  token: string | null,
): Promise<void> {
  // Send to the backend's /api/resident-onboarding/import-preference via the
  // existing NEXT_PUBLIC_API_URL proxy pattern. The backend may not have
  // deployed this endpoint yet — errors are intentionally swallowed so the
  // wizard never traps a user on a step. The QueryClient is authoritative.
  // The BMS key is no longer collected here — it's now set when the building
  // is created via the Building Create modal (BuildingCreateModal.tsx).
  const BACKEND_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "https://api.parqlet.com";
  try {
    await fetch(`${BACKEND_URL}/api/resident-onboarding/import-preference`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        importType: choice,
        enrollmentToken: token ?? undefined,
      }),
    });
  } catch {
    // ignore — proceed regardless
  }
}

/**
 * Wizard-scoped import-method choice. Third instance of the
 * `useEnrollment` / `useInviteTeamRows` pattern: QueryClient-cached state,
 * keyed by the invite token, with sessionStorage hydration for hard-refresh
 * survival and a session-only TTL (no persistQueryClient — closing the tab
 * drops the cache).
 */
export function useImportChoice() {
  const token = currentToken();
  const queryClient = useQueryClient();

  const query = useQuery<ImportChoice | null>({
    queryKey: importChoiceKeys.detail(token),
    queryFn: () => null,
    enabled: !!token,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    // Hydrate from sessionStorage when the cached entry was written for the
    // same token — same guard as useEnrollment / useInviteTeamRows.
    initialData: () => (token ? readCachedChoice(token) : null),
  });

  // Mirror live choice into sessionStorage so a refresh rehydrates the value.
  useEffect(() => {
    if (token && query.data) {
      writeCachedChoice(token, query.data);
    }
  }, [token, query.data]);

  const mutation = useMutation({
    mutationFn: (vars: { choice: ImportChoice }) =>
      postImportPreference(vars.choice, token),
  });

  const setChoice = useCallback(
    (c: ImportChoice) => {
      queryClient.setQueryData<ImportChoice | null>(importChoiceKeys.detail(token), c);
      if (token) writeCachedChoice(token, c);
      mutation.mutate({ choice: c });
    },
    [queryClient, token, mutation],
  );

  return {
    choice: query.data ?? null,
    setChoice,
    residentImportLabel: residentImportLabel(query.data ?? null),
    isPending: mutation.isPending,
  };
}
