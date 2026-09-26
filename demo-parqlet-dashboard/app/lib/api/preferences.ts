/**
 * User preferences API — get/update user preferences (timezone, notifications, etc.)
 * Uses the shared apiClient (credentials: include, JSON body).
 */

import { apiClient } from "./client";

export interface NotificationPreference {
  email: boolean;
  web: boolean;
}

export interface AlertSeverityPreference {
  email: boolean;
  web: boolean;
}

export interface UserPreferences {
  timezone: string;
  timeFormat: string;
  twoFactorEnabled: boolean;
  autoInviteEnabled: boolean;
  adminNotificationEmail: string;
  notificationPreferences: Record<string, NotificationPreference>;
  alertSeverityPreferences: Record<string, AlertSeverityPreference>;
}

export const preferencesApi = {
  /** GET /api/users/me/preferences */
  get(): Promise<UserPreferences> {
    return apiClient.get<UserPreferences>("/api/users/me/preferences");
  },

  /** PUT /api/users/me/preferences */
  update(data: Partial<UserPreferences>): Promise<UserPreferences> {
    return apiClient.put<UserPreferences>("/api/users/me/preferences", data);
  },
};
