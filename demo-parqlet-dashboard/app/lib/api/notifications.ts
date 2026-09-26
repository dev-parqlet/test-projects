/**
 * Real, backend-persisted notifications — the admin-facing counterpart to
 * the resident push/SMS notifications table. `category` is one of the ids
 * from the HOA Settings > Notifications page (e.g. "book-new", "res-invite")
 * — see api-backend's admin-notifications.ts for the authoritative list.
 */
import { apiClient } from "./client";

export interface RealNotification {
  id: string;
  buildingId: string;
  residentId: string | null;
  bookingId: string | null;
  kind: string | null;
  source: string;
  category: string;
  message: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function listNotifications(params: { buildingId: string }): Promise<{ data: RealNotification[] }> {
  return apiClient.get<{ data: RealNotification[] }>("/api/notifications", { buildingId: params.buildingId });
}

export async function markNotificationRead(id: string): Promise<RealNotification> {
  return apiClient.put<RealNotification>(`/api/notifications/${id}/read`);
}

export async function markAllNotificationsRead(buildingId: string): Promise<{ success: boolean }> {
  return apiClient.put<{ success: boolean }>(`/api/notifications/read-all?buildingId=${buildingId}`);
}
