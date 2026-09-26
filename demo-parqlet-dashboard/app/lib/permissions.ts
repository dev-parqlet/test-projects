/**
 * Central source of truth for HOA personnel permissions.
 *
 * Each action is a unique capability. Each role maps to the actions it may perform.
 *
 * Backend equivalent lives in parqlet-backend/src/lib/permissions.ts
 * Frontend mirror (this file) + `can()` helper for UI/conditional rendering.
 *
 * super_admin always has all permissions (bypassed in both requireRole + can()).
 */

export const Actions = {
  // Team management
  InviteTeamMember:      "invite_team_member",
  ViewMembers:           "view_members",

  // Resident management
  InviteResident:        "invite_resident",
  UploadResidentData:    "upload_resident_data",
  // Revoke a resident's Parqlet app access (sets excludedAt + excludedBy,
  // kills refresh tokens). Granted to admin, lead_concierge, concierge.
  // Security is intentionally excluded — they keep only booking actions.
  RevokeResident:        "revoke_resident",

  // Subscription
  ManageSubscription:    "manage_subscription",
  CancelSubscription:   "cancel_subscription",
  ViewSubscription:     "view_subscription",

  // Bookings (core workflow)
  TrackBookings:         "track_bookings",
  ReviewState:          "review_state",
  AddBookingNotes:      "add_booking_notes",
} as const;

export type Action = (typeof Actions)[keyof typeof Actions];

/**
 * Maps DB role labels → sets of allowed actions.
 * Exact mirror of backend RolePermissions.
 */
export const RolePermissions: Record<string, Action[]> = {
  admin: [
    Actions.InviteTeamMember,
    Actions.InviteResident,
    Actions.UploadResidentData,
    Actions.RevokeResident,
    Actions.ManageSubscription,
    Actions.CancelSubscription,
    Actions.ViewMembers,
    Actions.ViewSubscription,
    Actions.TrackBookings,
    Actions.ReviewState,
    Actions.AddBookingNotes,
  ],
  lead_concierge: [
    Actions.InviteTeamMember,
    Actions.InviteResident,
    Actions.UploadResidentData,
    Actions.RevokeResident,
    Actions.ManageSubscription,
    // ⚠️ cancel_subscription intentionally absent
    Actions.ViewMembers,
    Actions.ViewSubscription,
    Actions.TrackBookings,
    Actions.ReviewState,
    Actions.AddBookingNotes,
  ],
  concierge: [
    Actions.TrackBookings,
    Actions.ReviewState,
    Actions.AddBookingNotes,
    Actions.RevokeResident,
  ],
  security: [
    Actions.TrackBookings,
    Actions.ReviewState,
    Actions.AddBookingNotes,
  ],
} as const;

/**
 * Frontend permission helper — mirrors backend requireRole logic for use in components.
 *
 * Usage:
 *   if (can(user?.role, Actions.TrackBookings)) { ... }
 *   const mayCancel = can(user?.role, Actions.CancelSubscription);
 *
 * super_admin always returns true regardless of role mapping.
 */
export function can(role: string | undefined | null, action: Action): boolean {
  if (!role) return false;
  if (role === "super_admin") return true;

  const allowed = RolePermissions[role] ?? [];
  return allowed.includes(action);
}
