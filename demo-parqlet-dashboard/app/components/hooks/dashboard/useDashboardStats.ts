/**
 * useDashboardStats — booking counts from the API via React Query.
 *
 * Fetches bookings + building metadata, then computes
 * daily / weekly / monthly / YTD totals on the client.
 */
"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiBooking, BookingStats } from "./types";
import { dashboardKeys, DASHBOARD_STALE_TIME, BACKEND_URL } from "./queryKeys";

async function fetchDashboardStats(buildingId: string): Promise<BookingStats> {
  // No `tab` filter — "current" is now a narrow "happening right now"
  // chronological window (see api-backend routes/bookings.ts), so it
  // excludes anything already finished today/this week/this month. Daily/
  // weekly/monthly/YTD counts need every booking for the building,
  // filtered client-side by bookingStart below.
  const bd = await fetch(
    `${BACKEND_URL}/api/bookings?buildingId=${buildingId}&pageSize=200`,
    { credentials: "include" }
  ).then((r) => r.json());

  const all: ApiBooking[] = bd.data ?? [];
  const now = new Date();

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const countSince = (from: Date) =>
    all.filter((b) => {
      const d = new Date(b.bookingStartIso);
      return !isNaN(d.getTime()) && d >= from;
    }).length;

  return {
    daily: countSince(startOfDay),
    weekly: countSince(startOfWeek),
    monthly: countSince(startOfMonth),
    // "Year to Date" = since Jan 1 of this year, not the building's all-time
    // total — that was a separate bug (this used to read
    // building.totalBookings, an all-time count from a whole extra
    // /api/buildings/:id fetch this hook no longer needs).
    ytd: countSince(startOfYear),
  };
}

export function useDashboardStats(buildingId: string | null) {
  return useQuery({
    // Deliberately its own key, not dashboardKeys.bookings — see the comment
    // on dashboardKeys.stats in queryKeys.ts.
    queryKey: dashboardKeys.stats(buildingId ?? ""),
    queryFn: () => fetchDashboardStats(buildingId!),
    enabled: !!buildingId,
    staleTime: DASHBOARD_STALE_TIME,
    placeholderData: { daily: 0, weekly: 0, monthly: 0, ytd: 0 },
  });
}