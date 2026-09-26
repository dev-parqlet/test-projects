/**
 * User profile API — update own name and password.
 * Uses the shared apiClient (credentials: include, JSON body).
 */

import { apiClient } from "./client";

export interface ProfileUser {
  id: string;
  name: string;
  email: string;
  /** Returned by the backend's RETURNING clause; null when cleared. */
  phone: string | null;
}

export interface UpdateProfileRequest {
  name: string;
  phone?: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const usersApi = {
  /** PUT /api/auth/users/me */
  updateProfile(data: UpdateProfileRequest): Promise<ProfileUser> {
    return apiClient.put<ProfileUser>("/api/auth/users/me", data);
  },

  /** PUT /api/auth/users/me/password */
  updatePassword(data: UpdatePasswordRequest): Promise<{ success: boolean }> {
    return apiClient.put<{ success: boolean }>("/api/auth/users/me/password", data);
  },
};