/**
 * useTopBookers — residents who book guest parking most frequently.
 *
 * Aggregates bookings by residentName client-side, then sorts by frequency.
 * Uses the same bookings query key so it deduplicates with useDashboardStats
 * and RecentActivityCard.
 */
"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiBooking, ApiContributor } from "./types";
import { dashboardKeys, DASHBOARD_STALE_TIME, BACKEND_URL } from "./queryKeys";

async function fetchBookings(buildingId: string): Promise<ApiBooking[]> {
  // No `tab` filter — "current" is now a narrow "happening right now"
  // chronological window (see api-backend routes/bookings.ts), which would
  // exclude almost all historical bookings and starve this frequency
  // aggregation of data. Needs every booking for the building.
  const r = await fetch(
    `${BACKEND_URL}/api/bookings?buildingId=${buildingId}&pageSize=200`,
    { credentials: "include" }
  );
  const d = await r.json();
  return d.data ?? [];
}

function aggregateBookers(bookings: ApiBooking[]): ApiContributor[] {
  const counts: Record<string, { name: string; unit: string; bookings: number }> = {};

  bookings.forEach((b) => {
    const key = b.residentName ?? "Unknown";
    if (!counts[key]) {
      counts[key] = { name: b.residentName ?? "Unknown", unit: b.unitNumber ?? "—", bookings: 0 };
    }
    counts[key].bookings++;
  });

  return Object.values(counts)
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 15)
    .map((item, i) => ({
      rank: i + 1,
      name: item.name,
      unit: item.unit,
      shares: item.bookings,
      credits: item.bookings * 20,
    }));
}

export function useTopBookers(buildingId: string | null) {
  return useQuery({
    queryKey: dashboardKeys.bookings(buildingId ?? ""),
    queryFn: () => fetchBookings(buildingId!),
    enabled: !!buildingId,
    staleTime: DASHBOARD_STALE_TIME,
    select: aggregateBookers,
  });
}