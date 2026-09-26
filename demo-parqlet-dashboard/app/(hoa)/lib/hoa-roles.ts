/**
 * HOA-scoped role definitions.
 * 
 * These are the four personnel roles that live exclusively under the (hoa) route group.
 * They are **different** from super_admin (which lives in the (superadmin) group).
 *
 * This file is the single source of truth for:
 * - The internal role tokens coming from backend (used in AuthProvider + can())
 * - The human-readable display labels shown in the UI
 * - The dropdown options for team member invites / role changes
 *
 * DO NOT put these strings anywhere else inside app/(hoa)/.
 */

export const HOA_ROLES = {
  ADMIN:          { token: "admin",           label: "Admin" },
  LEAD_CONCIERGE: { token: "lead_concierge",  label: "Lead Concierge" },
  CONCIERGE:      { token: "concierge",       label: "Concierge" },
  SECURITY:       { token: "security",        label: "Security" },
} as const;

export type HoaRoleToken = typeof HOA_ROLES[keyof typeof HOA_ROLES]["token"];
export type HoaRoleLabel = typeof HOA_ROLES[keyof typeof HOA_ROLES]["label"];

/** Array of role tokens (for backend permission checks, guards, etc.) */
export const HOA_ROLE_TOKENS: HoaRoleToken[] = [
  HOA_ROLES.ADMIN.token,
  HOA_ROLES.LEAD_CONCIERGE.token,
  HOA_ROLES.CONCIERGE.token,
  HOA_ROLES.SECURITY.token,
];

/** Array of display labels (for dropdowns, forms, profile pages) */
export const HOA_ROLE_LABELS: HoaRoleLabel[] = [
  HOA_ROLES.ADMIN.label,
  HOA_ROLES.LEAD_CONCIERGE.label,
  HOA_ROLES.CONCIERGE.label,
  HOA_ROLES.SECURITY.label,
];

/** Reverse lookup: display label → token (useful for invite/role forms) */
export const HOA_LABEL_TO_TOKEN: Record<HoaRoleLabel, HoaRoleToken> = {
  [HOA_ROLES.ADMIN.label]:          HOA_ROLES.ADMIN.token,
  [HOA_ROLES.LEAD_CONCIERGE.label]: HOA_ROLES.LEAD_CONCIERGE.token,
  [HOA_ROLES.CONCIERGE.label]:      HOA_ROLES.CONCIERGE.token,
  [HOA_ROLES.SECURITY.label]:       HOA_ROLES.SECURITY.token,
};

/** Reverse lookup: token → display label (for rendering) */
export const HOA_TOKEN_TO_LABEL: Record<HoaRoleToken, HoaRoleLabel> = {
  [HOA_ROLES.ADMIN.token]:          HOA_ROLES.ADMIN.label,
  [HOA_ROLES.LEAD_CONCIERGE.token]: HOA_ROLES.LEAD_CONCIERGE.label,
  [HOA_ROLES.CONCIERGE.token]:      HOA_ROLES.CONCIERGE.label,
  [HOA_ROLES.SECURITY.token]:       HOA_ROLES.SECURITY.label,
};
