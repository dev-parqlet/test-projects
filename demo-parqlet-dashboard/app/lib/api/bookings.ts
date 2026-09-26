"use client";

import { useState, useEffect } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.parqlet.com";

export interface Booking {
  id: string;
  /** @deprecated Render via `<IdDisplay>` instead. */
  idShort: string;
  buildingId: string;
  unitNumber: string;
  residentName: string;
  residentPhone: string;
  guestName: string;
  guestPhone: string;
  licensePlate: string;
  spotNumber: string;
  spotOwnerName: string | null;
  spotOwnerPhone: string | null;
  /** Display string, e.g. "2pm, Aug 18" — rendered in the booking's building's local time. */
  bookingStart: string;
  bookingEnd: string;
  /** Raw UTC instant (ISO) — use this, not `bookingStart`/`bookingEnd`, for any real-time comparison (sorting, "is this happening now", bucketing by day). */
  bookingStartIso: string;
  bookingEndIso: string;
  status: string;
  /** True when a "Cancelled" status was set by the dispute-resolution
   *  sweeper (spot-occupied / vehicle-overstayed), not a normal user/owner
   *  cancellation — display hint only, see api-backend's
   *  cancelledDueToIssueSql. */
  cancelledDueToIssue: boolean;
  /** True when this still-`Assigned` booking has an unresolved
   *  spot-occupied dispute against it — display hint only, see
   *  api-backend's hasOpenSpotOccupiedIssueSql. */
  hasOpenIssue: boolean;
  note: string;
  hasNote: boolean;
}

export interface ApiBooking extends Booking {}

export interface BookingListParams {
  buildingId?: string;
  tab: string;
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export const bookingKeys = {
  all: ["bookings"] as const,
  list: (params: BookingListParams) =>
    [...bookingKeys.all, params] as const,
};

export function useBookings(buildingId: string | null, status?: string) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!buildingId) return;

    setLoading(true);
    const url = `${BACKEND_URL}/api/bookings?buildingId=${buildingId}&tab=current&pageSize=50${status ? `&status=${status}` : ""}`;
    fetch(url, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const raw: Booking[] = d.data ?? [];
        setBookings(raw.map((b) => ({
          ...b,
          // @deprecated Use `<IdDisplay value={booking.id} />` instead of `booking.idShort`.
          idShort: b.id.length > 8 ? b.id.slice(-6).toUpperCase() : b.id,
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [buildingId, status]);

  return { bookings, loading };
}

export interface ParkingSpot {
  id: string;
  buildingId: string;
  label: string;
  maxSize: string;
  isResidentSpot: boolean;
  hasEvCharge: boolean;
}

export interface GuestBookingRequest {
  buildingId: string;
  unit: string;
  residentName: string;
  residentPhone: string;
  vehicleType: string;
  evCharge: boolean;
  bookingStart: string;
  bookingEnd: string;
  licensePlate: string;
  vehicleMake: string;
  vehicleColor: string;
  guestName: string;
  guestPhone: string;
  guestLiabilityAck: boolean;
}

export interface GuestBookingResponse {
  id: string;
  spot: string;
}

export async function getAvailableParkingSpots(params: {
  buildingId: string;
  vehicleType: string;
  evCharge: boolean;
  startDate: string;
  endDate: string;
}): Promise<{ data: ParkingSpot[]; total: number }> {
  const sp = new URLSearchParams();
  sp.set("buildingId", params.buildingId);
  sp.set("vehicleType", params.vehicleType);
  sp.set("evCharge", String(params.evCharge));
  sp.set("startDate", params.startDate);
  sp.set("endDate", params.endDate);
  const url = `${BACKEND_URL}/api/parking-spots/available?${sp.toString()}`;
  const r = await fetch(url, { credentials: "include" });
  const d = await r.json();
  return { data: d.data ?? [], total: d.total ?? 0 };
}

export async function createGuestBooking(data: GuestBookingRequest): Promise<GuestBookingResponse> {
  const url = `${BACKEND_URL}/api/bookings/guest`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error?.message ?? "Failed to create booking");
  }
  return r.json();
}

export async function listBookings(params: BookingListParams): Promise<{ data: Booking[]; total: number }> {
  const sp = new URLSearchParams();
  if (params.buildingId) sp.set("buildingId", params.buildingId);
  // tab: "" means "no chronological filter, fetch every booking" (used by
  // the building-detail status breakdown and the notification feed) — the
  // backend's tab param is a strict enum (current/past/future) that 400s on
  // an empty string, so it must be omitted entirely rather than sent as "".
  if (params.tab) sp.set("tab", params.tab);
  if (params.search) sp.set("search", params.search);
  if (params.status) sp.set("status", params.status);
  if (params.dateFrom) sp.set("dateFrom", params.dateFrom);
  if (params.dateTo) sp.set("dateTo", params.dateTo);
  if (params.page) sp.set("page", String(params.page));
  if (params.pageSize) sp.set("pageSize", String(params.pageSize));
  const url = `${BACKEND_URL}/api/bookings?${sp.toString()}`;
  const r = await fetch(url, { credentials: "include" });
  const d = await r.json();
  return {
    data: (d.data ?? []).map((b: Booking & { id: string }) => ({
      ...b,
      // Last 6 chars uppercased, matching the shared `IdDisplay` truncation.
      // @deprecated Render IDs via the `<IdDisplay>` component instead of using this field.
      idShort: b.id.length > 8 ? b.id.slice(-6).toUpperCase() : b.id,
    })),
    total: d.total ?? 0,
  };
}

export interface BookingIssue {
  id: string;
  bookingId: string;
  buildingId: string;
  type: "SpotOccupiedByOther" | "VehicleOverstayed";
  status: "Open" | "AwaitingResolution" | "Rebooking" | "Resolved" | "Rebooked" | "Cancelled";
  createdAt: string;
  spotNumber: string | null;
  unitNumber: string | null;
}

/** Backs the "Issue reported" item in the notification feed (synthetic-notifications.ts) — no dedicated notifications table exists for it, so this reads straight off booking_issues via a thin endpoint. */
export async function listBookingIssues(params: { buildingId?: string } = {}): Promise<{ data: BookingIssue[] }> {
  const sp = new URLSearchParams();
  if (params.buildingId) sp.set("buildingId", params.buildingId);
  const url = `${BACKEND_URL}/api/bookings/issues?${sp.toString()}`;
  const r = await fetch(url, { credentials: "include" });
  const d = await r.json();
  return { data: d.data ?? [] };
}

export async function updateBookingNote(bookingId: string, note: string): Promise<{ id: string; note: string }> {
  const url = `${BACKEND_URL}/api/bookings/${bookingId}/note`;
  const r = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ note }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error?.message ?? "Failed to update note");
  }
  return r.json();
}
