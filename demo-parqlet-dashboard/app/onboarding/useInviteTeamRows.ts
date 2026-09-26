"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";

const ROWS_CACHE_KEY = "parqlet_invite_team_rows";

export type InviteRow = { id: number; email: string; role: string; emailError: boolean };

const SUPPORTED_ROLES = ["Admin", "Lead Concierge", "Concierge", "Security"] as const;
const DEFAULT_ROLE: InviteRow["role"] = "Admin";

const DEFAULT_ROW: InviteRow = { id: 1, email: "", role: "Admin", emailError: false };

interface CachedRows {
  token: string;
  rows: InviteRow[];
}

// Type guard for cached row payloads parsed from sessionStorage. `role` is
// intentionally not validated here — invalid/missing role values are
// normalized to DEFAULT_ROLE in readCachedRows().
const isCachedInviteRow = (value: unknown): value is InviteRow =>
  value !== null &&
  typeof value === "object" &&
  typeof (value as InviteRow).id === "number" &&
  typeof (value as InviteRow).email === "string" &&
  typeof (value as InviteRow).emailError === "boolean";

/**
 * Wizard-scoped invite-team rows. Backed by TanStack Query so every visit to
 * /onboarding/invite-team reads from the same cache entry (no need to re-fill
 * the list after navigating back from /onboarding/subscription).
 *
 * sessionStorage is used only as `initialData` hydration — survives a hard
 * refresh, then the live value lives in the QueryClient for the rest of the
 * session.
 */
export const inviteTeamKeys = {
  rows: (token: string | null) => ["inviteTeam", token ?? ""] as const,
};

function readStoredToken(): string | null {
  try {
    return sessionStorage.getItem("parqlet_onboarding_token");
  } catch {
    return null;
  }
}

function currentToken(): string | null {
  if (typeof window === "undefined") return null;
  const urlToken = new URLSearchParams(window.location.search).get("token");
  return urlToken ?? readStoredToken();
}

function readCachedRows(currentToken: string): InviteRow[] | null {
  try {
    const raw = sessionStorage.getItem(ROWS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedRows>;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.token !== currentToken) return null;
    if (!Array.isArray(parsed.rows)) return null;
    // Normalize cached roles: stale sessionStorage payloads from before the
    // role list was fixed may carry unsupported values like "HOA Admin".
    // Replace any such value with DEFAULT_ROLE so the invite flow never
    // submits an unsupported role string.
    return parsed.rows.filter(isCachedInviteRow).map((row) => ({
      ...row,
      role: (SUPPORTED_ROLES as readonly string[]).includes(row.role)
        ? row.role
        : DEFAULT_ROLE,
    }));
  } catch {
    return null;
  }
}

function writeCachedRows(token: string, rows: InviteRow[]) {
  try {
    const cached: CachedRows = { token, rows };
    sessionStorage.setItem(ROWS_CACHE_KEY, JSON.stringify(cached));
  } catch {
    // storage full or unavailable — the QueryClient cache is still authoritative
  }
}

export function useInviteTeamRows() {
  const token = currentToken();
  const queryClient = useQueryClient();

  const query = useQuery<InviteRow[]>({
    queryKey: inviteTeamKeys.rows(token),
    queryFn: () => [DEFAULT_ROW],
    enabled: !!token,
    staleTime: Infinity,
    gcTime: Infinity,
    // Hydrate from sessionStorage when the cache was written for this token.
    initialData: () => (token ? readCachedRows(token) ?? [DEFAULT_ROW] : [DEFAULT_ROW]),
  });

  // Mirror live rows into sessionStorage so a refresh rehydrates the list.
  useEffect(() => {
    if (token && query.data) {
      writeCachedRows(token, query.data);
    }
  }, [token, query.data]);

  const rows = query.data ?? [DEFAULT_ROW];

  const setRows = useCallback(
    (next: InviteRow[] | ((prev: InviteRow[]) => InviteRow[])) => {
      const resolved =
        typeof next === "function" ? (next as (p: InviteRow[]) => InviteRow[])(rows) : next;
      queryClient.setQueryData<InviteRow[]>(inviteTeamKeys.rows(token), resolved);
      if (token) writeCachedRows(token, resolved);
    },
    [queryClient, rows, token],
  );

  const updateRow = useCallback(
    (id: number, field: keyof InviteRow, value: string) => {
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, [field]: value, emailError: false } : r)),
      );
    },
    [setRows],
  );

  const removeRow = useCallback(
    (id: number) => {
      setRows((prev) => prev.filter((r) => r.id !== id));
    },
    [setRows],
  );

  // Use Date.now() so ids can't collide across remounts of the page.
  const addRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      { id: Date.now(), email: "", role: "Admin", emailError: false },
    ]);
  }, [setRows]);

  return { rows, setRows, updateRow, removeRow, addRow };
}