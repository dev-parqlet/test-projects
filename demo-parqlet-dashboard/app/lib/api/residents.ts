import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Types ────────────────────────────────────────────────────────────────────
// Page uses camelCase field names: parking, inviteSentDate, registeredDate

export type ResidencyType = "Owner" | "Renter";
export type ParqletStatus = "Registered" | "Hasn't Registered";
export type InviteState = "sent" | "reset";

export interface Resident {
  id: string;
  name: string;
  phone: string;
  unitNumber: string | null;
  parkingSpotNumbers: string | null;
  email: string;
  buildingId: string;
  residencyType: ResidencyType;
  leaseExpiration: string;
  status: ParqletStatus;
  inviteState: InviteState;
  inviteSentDate?: string;
  registeredDate?: string;
  note?: string | null;
  /** `residents.credit_balance`. The backend list spreads the whole row,
   *  so this has always been on the wire — it just was not mapped. */
  creditBalance?: number;
  notes?: { text: string; timestamp: string }[];
  // Revoke-access state (drizzle/0042 on the backend). When `excludedAt` is
  // set, the resident is hidden from the dashboard list and cannot log in.
  // See parqlet-backend/src/routes/residents.ts:420 (POST /exclude).
  excludedAt?: string | null;
  excludedBy?: string | null;
}

interface ListResidentsParams {
  buildingId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  status?: "Registered" | "Hasn't Registered";
  residencyType?: "Owner" | "Renter";
  sortBy?: "name" | "unit";
  sortDir?: "asc" | "desc";
  // When true, the super-admin residents page also surfaces revoked residents
  // (the backend's GET /api/residents filters `excludedAt IS NULL` by default).
  includeExcluded?: boolean;
  // Narrows to exactly Active (excludedAt IS NULL) or Revoked (IS NOT NULL) —
  // the "Access" filter dropdown. Distinct from includeExcluded, which only
  // controls whether revoked rows are present at all.
  access?: "Active" | "Revoked";
}

interface ApiResponse<T> {
  data: T[];
  total: number;
}

interface InviteByEmailResponse {
  success: boolean;
  sent: boolean;
  reason?: string;
}

/**
 * Response shape for POST /api/residents/invite. Exported so the UI layer
 * can inspect the per-row delivery status — the backend can return
 * HTTP 200 with `{ success: true, sent: false, reason: "auto_invite_disabled" }`
 * (or `{ sent: false }` for email-delivery failures) and the page must
 * distinguish that from a real success.
 */
export type InviteResponse = InviteByEmailResponse;

interface InviteAllResponse {
  success: boolean;
  sent: number;
  failed: number;
  reason?: string;
}

// ─── Query key factory ─────────────────────────────────────────────────────────

export const residentKeys = {
  all: ["residents"] as const,
  lists: () => [...residentKeys.all, "list"] as const,
  list: (params: ListResidentsParams) => [...residentKeys.lists(), params] as const,
};

// ─── Transform snake_case mock data to camelCase ────────────────────────────────

interface RawResident {
  id: string;
  building_id?: string;
  buildingId?: string;
  name: string;
  phone: string;
  email: string;
  unit?: string;
  unitNumber?: string;
  parking_spot?: string;
  parkingSpotNumbers?: string;
  residency_type?: string;
  residencyType?: string;
  /** Freeform staff note — same key in both the backend response and the
   *  mock JSON, so no snake_case variant is needed. */
  note?: string | null;
  creditBalance?: number;
  credit_balance?: number;
  lease_expiration?: string | null;
  leaseExpiration?: string | null;
  status: string;
  invite_state?: string;
  inviteState?: string;
  invite_sent_date?: string | null;
  inviteSentDate?: string | null;
  registered_date?: string | null;
  registeredDate?: string | null;
  excluded_at?: string | null;
  excludedAt?: string | null;
  excluded_by?: string | null;
  excludedBy?: string | null;
}

function transform(r: RawResident): Resident {
  const residencyType = r.residency_type ?? r.residencyType ?? "";
  const inviteState = r.invite_state ?? r.inviteState ?? "reset";
  return {
    id: r.id,
    buildingId: r.building_id ?? r.buildingId ?? "",
    name: r.name,
    phone: r.phone,
    email: r.email,
    unitNumber: r.unitNumber ?? r.unit ?? null,
    parkingSpotNumbers: r.parkingSpotNumbers ?? null,
    residencyType: residencyType === "Owner" ? "Owner" : "Renter",
    leaseExpiration: r.lease_expiration ?? r.leaseExpiration ?? "N/A",
    status: r.status === "Registered" ? "Registered" : "Hasn't Registered",
    inviteState: (inviteState === "sent" ? "sent" : "reset") as InviteState,
    inviteSentDate: r.invite_sent_date ?? r.inviteSentDate ?? undefined,
    registeredDate: r.registered_date ?? r.registeredDate ?? undefined,
    // The freeform staff note. Declared on `Resident` and read by the
    // Notes column and the note modal, but it was never mapped here — so
    // every row arrived with `note: undefined`. Saving worked (the PATCH
    // returned 200 and the DB was updated); the list just never carried
    // the value back, so the column stayed on "Add note" and reopening
    // the modal showed an empty textarea.
    note: r.note ?? null,
    creditBalance: r.creditBalance ?? r.credit_balance,
    notes: (r as any).notes ?? [],
    excludedAt: r.excluded_at ?? r.excludedAt ?? null,
    excludedBy: r.excluded_by ?? r.excludedBy ?? null,
  };
}

// ─── API helpers ───────────────────────────────────────────────────────────────

async function listResidentsApi(params: ListResidentsParams): Promise<ApiResponse<Resident>> {
  const sp = new URLSearchParams();
  // Omit `buildingId` when empty so the backend treats the request as
  // "no per-building scope" (returns residents across every building the
  // caller can see). Matches the super-admin "All buildings" contract
  // documented at app/(superadmin)/super-admin/residents/page.tsx:84-86.
  if (params.buildingId) sp.set("buildingId", params.buildingId);
  if (params.page) sp.set("page", String(params.page));
  if (params.pageSize) sp.set("pageSize", String(params.pageSize));
  if (params.search) sp.set("search", params.search);
  if (params.status) sp.set("status", params.status);
  if (params.residencyType) sp.set("residencyType", params.residencyType);
  if (params.sortBy) sp.set("sortBy", params.sortBy);
  if (params.sortDir) sp.set("sortDir", params.sortDir);
  if (params.includeExcluded) sp.set("includeExcluded", "true");
  if (params.access) sp.set("access", params.access);

  const res = await fetch(`/api/residents?${sp.toString()}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch residents");
  const raw = await res.json();

  const data = (raw.data as RawResident[] | undefined ?? []).map(transform);
  return { data, total: raw.total ?? data.length };
}

// Single-recipient invite — POST /api/residents/invite with {buildingId, email}.
// Matches the backend contract in parqlet-backend/src/routes/residents.ts:
// the backend looks up the resident by (buildingId, email) and sends one email.
async function inviteResidentByEmailApi(
  buildingId: string,
  email: string
): Promise<InviteByEmailResponse> {
  const res = await fetch(`/api/residents/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ buildingId, email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? "Failed to send invite");
  }
  return res.json();
}

// Bulk "invite all not yet registered" — POST /api/residents/invite-all with
// {buildingId}. The backend decides who to invite and applies renter-first
// targeting per unit.
async function inviteAllResidentsApi(buildingId: string): Promise<InviteAllResponse> {
  const res = await fetch(`/api/residents/invite-all`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ buildingId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? "Failed to send invites");
  }
  return res.json();
}

async function updateResidentNoteApi(residentId: string, note: string): Promise<{ id: string; note: string }> {
  const res = await fetch(`/api/residents/${residentId}/note`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ note }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? "Failed to update note");
  }
  return res.json();
}

// ─── Revoke access (API seam) ─────────────────────────────────────────────────
// POST /api/residents/:id/exclude — sets `excludedAt` + `excludedBy`, kills
// refresh tokens. Granted to admin, lead_concierge, concierge, super_admin
// (Actions.RevokeResident). The dashboard hides the row once excludedAt is set.
interface ExcludeResponse {
  id: string;
  excludedAt: string | null;
  excludedBy: string | null;
}

async function revokeResidentApi(residentId: string): Promise<ExcludeResponse> {
  const res = await fetch(`/api/residents/${residentId}/exclude`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? "Failed to revoke access");
  }
  return res.json();
}

async function restoreResidentApi(residentId: string): Promise<ExcludeResponse> {
  const res = await fetch(`/api/residents/${residentId}/exclude`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? "Failed to restore access");
  }
  return res.json();
}

// ─── React Query hooks ─────────────────────────────────────────────────────────

export function useResidents(params: ListResidentsParams) {
  return useQuery({
    queryKey: residentKeys.list(params),
    queryFn: () => listResidentsApi(params),
    enabled: true,
  });
}

export function useInviteResident() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ buildingId, email }: { buildingId: string; email: string }) =>
      inviteResidentByEmailApi(buildingId, email),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: residentKeys.all });
    },
  });
}

export function useInviteAllResidents() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ buildingId }: { buildingId: string }) =>
      inviteAllResidentsApi(buildingId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: residentKeys.all });
    },
  });
}

// ─── Revoke / restore access (mutations) ─────────────────────────────────────

export function useRevokeResident() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (residentId: string) => revokeResidentApi(residentId),
    onSuccess: () => {
      // The backend's GET /api/residents filters excluded rows, so the
      // revoked row will drop out of the list on the next fetch.
      client.invalidateQueries({ queryKey: residentKeys.all });
    },
  });
}

export function useRestoreResident() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (residentId: string) => restoreResidentApi(residentId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: residentKeys.all });
    },
  });
}

// Aliases for backward compatibility with existing call sites

/** Outcome of a super-admin credit adjustment. */
export interface CreditAdjustResult {
  ok: true;
  delta: number;
  applied: number;
  skipped: number;
}

/**
 * Move credits for ONE resident, or for every active resident in a
 * building. Exactly one of `residentId` / `buildingId`.
 *
 * The backend refuses to take any balance below zero and skips whoever
 * cannot take the full deduction, so `applied` and `skipped` will not
 * always add up to the number of residents you expected.
 */
async function adjustCreditsApi(params: {
  residentId?: string;
  buildingId?: string;
  delta: number;
}): Promise<CreditAdjustResult> {
  const res = await fetch(`/api/super-admin/credits/adjust`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? "Failed to adjust credits");
  }
  return res.json();
}

export const listResidents = listResidentsApi;
export const updateResidentNote = updateResidentNoteApi;
export const adjustCredits = adjustCreditsApi;
