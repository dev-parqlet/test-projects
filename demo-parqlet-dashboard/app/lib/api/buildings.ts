import { apiClient } from "./client";

// ─── Types ───────────────────────────────────────────────────────────────────

export type VerificationMethod = "Signature" | "Verification";

export interface Building {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  units: number;
  onboardedDate: string;
  hoaContact: string;
  hoaEmail: string;
  subscriptionStatus:
    | "Active"
    | "Inactive"
    | "Overdue"
    | "Past Due"
    | "Expiring Soon"
    // drizzle/0038 — superadmin pause override. Rendered distinctly from
    // "Active" in the StatusPill (amber/yellow) so operators can spot a
    // paused building at a glance.
    | "Paused";
  mrr: number;
  // Real year-to-date revenue in dollars (sum of Paid invoices since Jan 1
  // of the building's local calendar year) — not an MRR×12 projection.
  arr: number;
  contractExpiry: string;
  lastPaymentDate: string;
  nextRenewalDate: string;
  syncPlatform: "BuildingLink" | "Yardi" | "RealPage" | null;
  syncStatus: "Success" | "Failed" | "Stale" | "Not Synced";
  lastSync: string;
  residentsInvited: number;
  residentsRegistered: number;
  totalBookings: number;
  bookingsThisMonth: number;
  bookingsLastMonth: number;
  completedBookings: number;
  expiredBookings: number;
  upcomingBookings: number;
  creditsInCirculation: number;
  creditsEarnedThisMonth: number;
  creditsSpentThisMonth: number;
  residentsAtThreshold: number;
  openTickets: number;
  ticketsThisWeek: number;
  verificationMethod?: VerificationMethod | null;
  // Resident data import preference chosen by the HOA admin during onboarding
  // (step 2). "bms" = connect a building management system, "upload" = manual file.
  residentImportType?: "bms" | "upload" | null;
  // IANA zone, e.g. "America/Chicago". Already returned by GET /api/buildings
  // (a bare `.select()` — every column comes back) — optional here only
  // because older mock fixtures don't set it.
  timeZone?: string | null;
}

export interface BuildingStats {
  totalMrr: number;
  totalArr: number;
  activeSubscriptions: number;
  overdueCount: number;
  expiringSoonCount: number;
}

// ─── Query Keys ──────────────────────────────────────────────────────────────

// IMPORTANT: Query-key/shape contract
// ------------------------------------
// buildingKeys.list() is the cache slot for the PaginatedResponse<Building>
// shape returned by listBuildings(). The TanStack Query cache assumes a
// single shape per key. Any consumer that needs a different shape (e.g.
// BuildingFilterDropdown's flat Building[] for the multi-select) MUST pass a
// distinct filter object, e.g. buildingKeys.list({ forFilter: true }). Sharing
// the same key with a different shape silently corrupts the superadmin
// overview's stat calculations on first render (see commit c1708c4).
export const buildingKeys = {
  all: ["buildings"] as const,
  list: (filters?: Record<string, string | number | boolean>) => ["buildings", "list", filters] as const,
  detail: (id: string) => ["buildings", id] as const,
  stats: (id: string) => ["buildings", id, "stats"] as const,
  settings: (id: string) => ["buildings", id, "settings"] as const,
};

// ─── API Functions ────────────────────────────────────────────────────────────

export interface ListBuildingsParams {
  search?: string;
  subscriptionStatus?: Building["subscriptionStatus"];
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listBuildings(params?: ListBuildingsParams) {
  return apiClient.get<PaginatedResponse<Building>>("/api/buildings", params);
}

export async function getBuilding(id: string) {
  return apiClient.get<Building>(`/api/buildings/${id}`);
}

export async function getBuildingStats(id: string) {
  return apiClient.get<BuildingStats>(`/api/buildings/${id}/stats`);
}

// ─── Building settings (SMS help message) ────────────────────────────────────

export interface BuildingSettings {
  smsHelpMessage: string | null;
  verificationMethod: VerificationMethod | null;
  /**
   * Per-building price per credit, in integer cents (e.g. 600 = $6.00).
   * Persisted on buildings.credits_price_cents (drizzle/0043). Editable
   * from the building detail page's "Price per Credit" row.
   */
  creditsPriceCents: number | null;
}

export async function getBuildingSettings(id: string) {
  return apiClient.get<BuildingSettings>(`/api/buildings/${id}/settings`);
}

export interface UpdateAdminContactParams {
  name?: string;
  email?: string;
  /** When true, regenerate the enrollment token and re-send the platform invite. */
  invite?: boolean;
}

/**
 * Update the HOA admin's contact name/email on a building and, optionally,
 * re-send the platform invite (Save & Invite). The backend requires a contact
 * name before it will send an invite.
 */
export async function updateBuildingAdminContact(
  id: string,
  data: UpdateAdminContactParams
): Promise<{ hoaContact: string; hoaEmail: string }> {
  return apiClient.post<{ hoaContact: string; hoaEmail: string }>(`/api/buildings/${id}/admin-contact`, data);
}

export async function updateBuildingSettings(
  id: string,
  data: Partial<BuildingSettings>
): Promise<BuildingSettings> {
  return apiClient.put<BuildingSettings>(`/api/buildings/${id}/settings`, data);
}