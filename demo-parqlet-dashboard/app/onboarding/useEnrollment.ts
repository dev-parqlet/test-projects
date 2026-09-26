"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

const TOKEN_STORAGE_KEY = "parqlet_onboarding_token";
const ENROLLMENT_CACHE_KEY = "parqlet_enrollment";

export interface EnrollmentData {
  email: string;
  name: string;
  buildingName: string;
  buildingLogoUrl?: string;
  // Required: /api/enrollment/verify now guarantees a non-null buildingId on
  // every successful response (the route falls back to the first building for
  // non-Pending records and 422s for Pending+null). Making this required turns
  // future regressions into TypeScript errors.
  buildingId: string;
  /**
   * Whether this invitee is the first team member for their building.
   *  - true  -> run the full 4-step onboarding wizard
   *  - false -> show the simplified "set your password" form and redirect to
   *            /dashboard after completion
   * Optional to model wire compatibility: older backends may omit the field,
   * in which case `fetchEnrollment` defaults it to `true` (full flow).
   */
  isFirstTeamMember?: boolean;
}

/**
 * Cache entry shape — we persist the enrollment token alongside the verified
 * data so a second invite link opened in the same tab can't reuse the first
 * invite's email/building. The cache is rejected unless the token matches
 * the URL we're rendering for right now.
 */
interface CachedEnrollment {
  token: string;
  data: EnrollmentData;
}

export const enrollmentKeys = {
  detail: (token: string | null) => ["enrollment", token ?? ""] as const,
};

function readStoredToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function readCachedEnrollment(currentToken: string): EnrollmentData | null {
  try {
    const raw = sessionStorage.getItem(ENROLLMENT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedEnrollment>;
    if (!parsed || typeof parsed !== "object") return null;
    // Reject the cached entry if it was written for a different invite.
    if (parsed.token !== currentToken) return null;
    if (!parsed.data) return null;
    // Backward-compatibility: cache entries written before the
    // isFirstTeamMember contract was introduced have no field. Default to
    // `true` (full onboarding) so older sessions don't accidentally drop
    // invitees into the simplified form. This preserves the previous
    // behavior for anyone whose tab is still alive from before the rollout.
    return {
      ...parsed.data,
      isFirstTeamMember: parsed.data.isFirstTeamMember === false ? false : true,
    };
  } catch {
    return null;
  }
}

function writeCachedEnrollment(token: string, data: EnrollmentData) {
  try {
    const cached: CachedEnrollment = { token, data };
    sessionStorage.setItem(ENROLLMENT_CACHE_KEY, JSON.stringify(cached));
  } catch {
    // storage full or unavailable — ignore
  }
}

/**
 * Build a wizard URL that carries the enrollment token forward. Prefers the
 * token in the current URL and falls back to the one stored in sessionStorage
 * (set by /onboarding/setup-account) so the token survives a refresh. Shared by
 * every onboarding step's Next/Back links.
 */
export function withOnboardingToken(path: string): string {
  const params = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : "",
  );
  const token = params.get("token") ?? readStoredToken();
  return token ? `${path}?token=${encodeURIComponent(token)}` : path;
}

async function fetchEnrollment(token: string): Promise<EnrollmentData> {
  const res = await fetch(`/api/enrollment/verify?token=${encodeURIComponent(token)}`);
  if (!res.ok) throw new Error("Invalid or expired token");
  const json = (await res.json()) as Record<string, unknown>;
  // The route guarantees a non-null buildingId for any successful response.
  // If we somehow still see empty/undefined, fail loudly rather than persist
  // a payload that will blow up the subscription page.
  const buildingId = json.buildingId as string | undefined;
  if (!buildingId) {
    throw new Error("Enrollment verify response is missing buildingId");
  }
  // Normalize isFirstTeamMember: only a literal `false` triggers the
  // simplified flow. Missing, null, malformed, or any other value defaults
  // to `true` so older backends and stale responses keep the full flow.
  const isFirstTeamMember = json.isFirstTeamMember === false ? false : true;
  return {
    email: (json.email as string | undefined) ?? "",
    name: (json.name as string | undefined) ?? "",
    buildingName: (json.buildingName as string | undefined) ?? "Your Building",
    buildingLogoUrl: json.buildingLogoUrl as string | undefined,
    buildingId,
    isFirstTeamMember,
  };
}

/**
 * Wizard-scoped enrollment data. Backed by TanStack Query, so every step that
 * calls this hook shares the same cached entry by `["enrollment", token]`.
 *
 * sessionStorage (`parqlet_enrollment`) is kept only as `initialData`
 * hydration so a refresh on any wizard step rehydrates instantly without a
 * round-trip to the verify endpoint.
 */
export function useEnrollment() {
  const token =
    (typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("token")
      : null) ?? readStoredToken();

  const query = useQuery<EnrollmentData>({
    queryKey: enrollmentKeys.detail(token),
    queryFn: () => fetchEnrollment(token as string),
    enabled: !!token,
    // Verified enrollment is immutable for the lifetime of the wizard — never
    // refetch mid-flow (would re-hit the verify endpoint and could blow away
    // the user's data if the token has since been consumed).
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    // Hydrate from sessionStorage when the cached entry was written for the
    // same token — same guard as the old hand-rolled cache.
    initialData: () => (token ? readCachedEnrollment(token) ?? undefined : undefined),
  });

  // Mirror successful fetches into sessionStorage so a refresh on a later step
  // can rehydrate without a network round-trip.
  useEffect(() => {
    if (query.data && token) {
      writeCachedEnrollment(token, query.data);
    }
  }, [query.data, token]);

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    error: query.isError
      ? "This enrollment link is invalid or has expired."
      : null,
  };
}