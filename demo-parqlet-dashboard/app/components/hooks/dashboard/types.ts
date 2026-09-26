/**
 * Shared API types for dashboard data hooks.
 * Canonical types from app/lib/api/bookings.ts — re-exported for convenience.
 */

import type { Booking } from "../../../lib/api/bookings";
export type ApiBooking = Booking;

export interface ApiAlert {
  id: string;
  severity: string;
  buildingId: string;
  type: string;
  description: string;
  acknowledged: boolean;
  timestamp: string;
  buildingName: string;
}

export interface ApiContributor {
  rank: number;
  name: string;
  unit: string;
  shares: number;
  credits: number;
}

export interface BookingStats {
  daily: number;
  weekly: number;
  monthly: number;
  ytd: number;
}