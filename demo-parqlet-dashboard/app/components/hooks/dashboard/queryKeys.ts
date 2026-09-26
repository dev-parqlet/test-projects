/**
 * Shared React Query keys for dashboard hooks.
 * All dashboard hooks that fetch bookings use the same key space,
 * so React Query deduplicates identical requests automatically.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.parqlet.com";

export const dashboardKeys = {
  bookings: (buildingId: string) =>
    ["dashboard", "bookings", buildingId] as const,
  // Deliberately NOT dashboardKeys.bookings — useDashboardStats computes a
  // {daily, weekly, monthly, ytd} object inside its own queryFn rather than
  // via a `select` over the shared raw booking array (like RecentActivityCard/
  // useBookings/useTopBookers do), so sharing that key meant whichever hook's
  // fetch won the race silently overwrote this one's cache slot with an
  // incompatible shape — the stat cards read `array.daily` (undefined)
  // instead of a real number, rendering blank.
  stats: (buildingId: string) =>
    ["dashboard", "stats", buildingId] as const,
  building: (buildingId: string) =>
    ["dashboard", "building", buildingId] as const,
  topContributors: (buildingId: string) =>
    ["dashboard", "topContributors", buildingId] as const,
} as const;

/** 2-minute stale time for dashboard data */
export const DASHBOARD_STALE_TIME = 2 * 60 * 1000;

export { BACKEND_URL };