/**
 * Dashboard data hooks barrel export.
 *
 * Also re-exports shared types so consumers only need one import.
 */

export { useDashboardStats } from "./dashboard/useDashboardStats";
export { useNotifications } from "./dashboard/useNotifications";
export { useBookings } from "./dashboard/useBookings";
export { useTopContributors } from "./dashboard/useTopContributors";
export { useTopBookers } from "./dashboard/useTopBookers";

export type {
  ApiAlert,
  ApiBooking,
  ApiContributor,
  BookingStats,
} from "./dashboard/types";