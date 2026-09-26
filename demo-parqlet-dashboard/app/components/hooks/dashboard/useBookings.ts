/**
 * useBookings — fetches bookings for a building via React Query.
 *
 * Used by CurrentBookingsCard. Fetches current bookings and filters to
 * show Assigned + Completed status, plus a Cancelled booking specifically
 * flagged `cancelledDueToIssue` — an active dispute is exactly the kind of
 * thing an at-a-glance dashboard widget should surface. Assigned already
 * covers the still-open-dispute case (`hasOpenIssue`) too, since raising an
 * issue never changes `bookings.status` off Assigned — see
 * hasOpenSpotOccupiedIssueSql in api-backend/src/lib/booking-issue-cancellation.ts.
 */
"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiBooking } from "./types";
import { dashboardKeys, DASHBOARD_STALE_TIME, BACKEND_URL } from "./queryKeys";

async function fetchBookings(buildingId: string): Promise<ApiBooking[]> {
  // No `tab` filter — "current" is now a narrow "happening right now"
  // chronological window (see api-backend routes/bookings.ts), which
  // excludes the Completed bookings this card's own `select` below is
  // trying to surface. Fetch everything and let status filtering do the
  // actual narrowing.
  const url = `${BACKEND_URL}/api/bookings?buildingId=${buildingId}&pageSize=50`;
  const r = await fetch(url, { credentials: "include" });
  const d = await r.json();
  return d.data ?? [];
}

export function useBookings(buildingId: string | null) {
  return useQuery({
    queryKey: dashboardKeys.bookings(buildingId ?? ""),
    queryFn: () => fetchBookings(buildingId!),
    enabled: !!buildingId,
    staleTime: DASHBOARD_STALE_TIME,
    select: (bookings) =>
      bookings.filter(
        (b: ApiBooking) =>
          b.status === "Assigned" || b.status === "Completed" || b.cancelledDueToIssue
      ),
  });
}