/**
 * useTopContributors — top spot sharers from the backend.
 *
 * Fetches from GET /api/bookings/top-contributors which aggregates
 * bookings by offererResidentId with COUNT and SUM.
 */
"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiContributor } from "./types";
import { dashboardKeys, DASHBOARD_STALE_TIME, BACKEND_URL } from "./queryKeys";

async function fetchTopContributors(buildingId: string): Promise<ApiContributor[]> {
  const r = await fetch(
    `${BACKEND_URL}/api/bookings/top-contributors?buildingId=${buildingId}`,
    { credentials: "include" }
  );
  const d = await r.json();
  return d.data ?? [];
}

export function useTopContributors(buildingId: string | null) {
  return useQuery({
    queryKey: dashboardKeys.topContributors(buildingId ?? ""),
    queryFn: () => fetchTopContributors(buildingId!),
    enabled: !!buildingId,
    staleTime: DASHBOARD_STALE_TIME,
    placeholderData: [],
  });
}