import { apiClient } from "./client";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RevenueSummary {
  totalMrr: number;
  totalArr: number;
  activeSubscriptions: number;
  overdueCount: number;
  expiringSoonCount: number;
}

export interface RevenueBuildingRow {
  buildingId: string;
  buildingName: string;
  mrr: number;
  status: string;
  lastPayment: string;
  nextRenewal: string;
  contractExpiry: string;
}

export interface Alert {
  id: string;
  severity: "Critical" | "Warning" | "Info";
  buildingId: string;
  buildingName: string;
  type: string;
  description: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface SupportTicket {
  id: string;
  buildingId: string;
  buildingName: string;
  subject: string;
  status: "Open" | "In Progress" | "Resolved";
  openedDate: string;
  /** Only ever populated by mock data today — the real `support_tickets`
   *  table has no `assignee` column, so this is always absent/null
   *  against the real backend. */
  assignee?: string | null;
  /** Real, editable fields (PUT /tickets/:id) despite having no backing
   *  column — embedded in `text` the same no-schema-change way the
   *  submitter/snapshot context is (see api-backend tickets.ts). Always
   *  present against the real backend (default "General"/"Medium");
   *  optional here only so mock fixtures that predate this don't need
   *  updating. */
  category?: "General" | "Booking" | "Availability" | "Credits" | "Account" | "Other";
  priority?: "Low" | "Medium" | "High" | "Critical";
  updatedAt?: string;
  submitterName?: string;
  submitterEmail?: string;
  submitterRole?: string;
}

export interface TicketAttachment {
  id: string;
  name: string;
  url: string;
  size: string;
  uploadedAt: string;
}

export interface TicketMessage {
  id: string;
  author: string;
  authorRole: string;
  body: string;
  timestamp: string;
  isInternal: boolean;
}

/** Resident/building/activity context captured at submission time —
 *  only present on tickets filed via the resident app's "Contact
 *  support" flow (`POST /api/resident/support`); `null` for tickets
 *  created directly in the dashboard, which have no resident to
 *  attach. Mirrors the same snapshot the support-inbox email shows. */
export interface TicketSnapshot {
  resident: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    unit: string | null;
    creditBalance: number;
    residencyType: string | null;
    leaseExpiration: string | null;
    status: string | null;
    registeredDate: string | null;
    note: string;
    createdAt: string | null;
  };
  building: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    hoaContact: string;
    hoaEmail: string;
  };
  counts: {
    activeBookings: number;
    openIssues: number;
    parkingSpots: number;
    lifetimeBookings: number;
  };
}

export interface TicketDetail extends SupportTicket {
  description: string;
  resolvedAt: string | null;
  attachments: TicketAttachment[];
  messages: TicketMessage[];
  snapshot?: TicketSnapshot | null;
}

/**
 * One message in a ticket's live Gmail thread — the public/external
 * side of the conversation, read fresh on every call (see
 * `getTicketThread` below). Distinct from `TicketMessage`, which is
 * the dashboard's own internal-notes-only history.
 */
export interface TicketThreadMessage {
  gmailMessageId: string;
  fromEmail: string;
  fromName: string | null;
  direction: "outbound" | "inbound";
  date: string;
  bodyText: string;
  hasAttachment: boolean;
}

export interface SyncLog {
  id: string;
  buildingId: string;
  buildingName: string;
  timestamp: string;
  status: "Success" | "Failed" | "Stale";
  platform: string;
  recordsSynced: number | null;
  errorMessage: string | null;
  type: "Manual" | "API Sync";
}

export interface CreditStats {
  buildingId: string;
  creditsInCirculation: number;
  creditsEarnedThisMonth: number;
  creditsSpentThisMonth: number;
  residentsAtThreshold: number;
}

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const superAdminKeys = {
  revenueSummary: ["super-admin", "revenue", "summary"] as const,
  revenueBuildings: (page: number) => ["super-admin", "revenue", "buildings", page] as const,
  alerts: (filters: Record<string, string | number>) => ["super-admin", "alerts", filters] as const,
  tickets: (filters: Record<string, string | number | undefined>) => ["super-admin", "tickets", filters] as const,
  ticketDetail: (id: string) => ["super-admin", "tickets", id] as const,
  ticketThread: (id: string) => ["super-admin", "tickets", id, "thread"] as const,
  syncLogs: (filters: Record<string, string | number>) => ["super-admin", "sync-logs", filters] as const,
  credits: (buildingId?: string) => ["super-admin", "credits", buildingId ?? "all"] as const,
};

// ─── Revenue ─────────────────────────────────────────────────────────────────

export async function getRevenueSummary() {
  return apiClient.get<RevenueSummary>("/api/revenue/summary");
}

export async function getRevenueBuildings(page = 1) {
  return apiClient.get<{ data: RevenueBuildingRow[]; total: number; page: number; pageSize: number }>(
    "/api/revenue/buildings",
    { page }
  );
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export interface ListAlertsParams {
  severity?: Alert["severity"];
  buildingId?: string;
  page?: number;
}

export async function listAlerts(params: ListAlertsParams) {
  return apiClient.get<{ data: Alert[]; total: number; page: number; pageSize: number }>(
    "/api/alerts",
    params
  );
}

export async function acknowledgeAlert(id: string) {
  return apiClient.put<Alert>(`/api/alerts/${id}/acknowledge`, {});
}

// ─── Support Tickets ───────────────────────────────────────────────────────────

export interface ListTicketsParams {
  buildingId?: string;
  status?: SupportTicket["status"];
  page?: number;
}

export async function listTickets(params: ListTicketsParams) {
  return apiClient.get<{ data: SupportTicket[]; total: number; page: number; pageSize: number }>(
    "/api/tickets",
    params
  );
}

export async function updateTicket(
  id: string,
  updates: { status?: SupportTicket["status"]; priority?: SupportTicket["priority"]; category?: SupportTicket["category"] },
) {
  return apiClient.put<SupportTicket>(`/api/tickets/${id}`, updates);
}

export async function getTicketDetail(id: string) {
  return apiClient.get<TicketDetail>(`/api/tickets/ticket/${id}`);
}

export interface SubmitTicketPayload {
  buildingId: string;
  subject: string;
  description: string;
  category: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  submitterName: string;
  submitterEmail: string;
}

export async function submitTicket(payload: SubmitTicketPayload) {
  return apiClient.post<SupportTicket>("/api/tickets/create", payload);
}

export interface AddMessagePayload {
  body: string;
  isInternal: boolean;
}

/** Two shapes depending on `isInternal` — see tickets.ts's
 *  POST /ticket/:id/response for why: an internal note is a real
 *  ticket_responses row; a public reply is sent via Gmail only and
 *  never stored, so there's no row to hand back, just a send receipt.
 *  On failure (no submitter email on file / Gmail not configured /
 *  send failed), `apiClient` throws `ApiError` with the message in
 *  `err.body.error` — see the reply composer's `onError`. */
export type AddMessageResult =
  | (TicketMessage & { isInternal: true })
  | { ok: true; sentViaGmail: true; to: string };

export async function addTicketMessage(ticketId: string, payload: AddMessagePayload) {
  return apiClient.post<AddMessageResult>(`/api/tickets/ticket/${ticketId}/response`, payload);
}

export async function getTicketThread(ticketId: string) {
  return apiClient.get<{ data: TicketThreadMessage[]; configured: boolean }>(
    `/api/tickets/ticket/${ticketId}/thread`,
  );
}

// ─── Sync Logs ─────────────────────────────────────────────────────────────────

export interface ListSyncLogsParams {
  buildingId?: string;
  status?: SyncLog["status"];
  page?: number;
}

export async function listSyncLogs(params: ListSyncLogsParams) {
  return apiClient.get<{ data: SyncLog[]; total: number; page: number; pageSize: number }>(
    "/api/sync-logs",
    params
  );
}

// ─── Credits ───────────────────────────────────────────────────────────────────

export async function getCredits(buildingId?: string) {
  const path = buildingId ? `/api/buildings/${buildingId}/credits` : "/api/credits";
  return apiClient.get<CreditStats[]>(path);
}

// ─── Admin Broadcasts ───────────────────────────────────────────────────────────
// SAdmin-authored scheduled push campaigns. No DB table backs these on the
// backend — each campaign is a set of pg-boss schedules, reassembled into
// one row per campaign at read time. See parqlet-backend/src/routes/admin-broadcasts.ts.

export interface AdminBroadcastCampaign {
  id: string;
  /** Push notification title. Undefined only for campaigns created before this field existed — the backend falls back to "Announcement" for those. */
  title?: string;
  message: string;
  /** null = every building. */
  buildingIds: string[] | null;
  /** Inclusive, "YYYY-MM-DD". */
  startDate: string;
  endDate: string;
  /** Exact times of day, "HH:mm" (24h), in `timeZone`. */
  times: string[];
  /** IANA zone the times above are interpreted in. */
  timeZone: string;
}

export type AdminBroadcastPayload = Omit<AdminBroadcastCampaign, "id">;

export async function listAdminBroadcasts() {
  return apiClient.get<{ data: AdminBroadcastCampaign[] }>("/api/admin-broadcasts");
}

export async function createAdminBroadcast(payload: AdminBroadcastPayload) {
  return apiClient.post<{ data: AdminBroadcastCampaign }>("/api/admin-broadcasts", payload);
}

export async function updateAdminBroadcast(id: string, payload: AdminBroadcastPayload) {
  return apiClient.patch<{ data: AdminBroadcastCampaign }>(`/api/admin-broadcasts/${id}`, payload);
}

export async function deleteAdminBroadcast(id: string) {
  return apiClient.delete<{ data: { ok: boolean } }>(`/api/admin-broadcasts/${id}`);
}

// ─── Gift Cards (HOA + Super Admin report; the reminder action is
// Super Admin only — see parqlet-backend/src/routes/super-admin-gift-cards.ts) ─

/** One row of the resident-centric report table. */
export interface GiftCardResidentSummary {
  residentId: string;
  residentName: string | null;
  residentEmail: string | null;
  residentPhone: string | null;
  unit: string | null;
  buildingId: string;
  buildingName: string;
  creditBalance: number;
  giftCardCount: number;
}

/** Credit price and gift card reserve for one building. Returned for
 *  HOA callers (their own buildings) and Super Admins (all of them). */
export interface BuildingGiftCardTerms {
  buildingId: string;
  buildingName: string;
  creditPriceCents: number;
  reservePerCreditCents: number;
}

/**
 * Per-building gift card funding forecast (Super Admin only; empty for
 * HOA callers). Returned per building rather than as one platform total
 * so the top-bar building filter can sum just what is in view — card
 * counts are floored PER RESIDENT server-side before being summed, so
 * building subtotals add up correctly while raw reserve dollars would
 * not. See api-backend's gift-card-reserve.ts.
 */
export interface BuildingGiftCardForecast {
  buildingId: string;
  buildingName: string;
  creditPriceCents: number;
  reservePerCreditCents: number;
  /** Cards the accumulated reserve could pay for today. */
  cardsNow: number;
  /** Cards likely by the end of next month, at each resident's own
   *  recent earning rate. */
  cardsByEndOfNextMonth: number;
  dollarsNowCents: number;
  dollarsByEndOfNextMonthCents: number;
}

export interface GiftCardReport {
  residents: GiftCardResidentSummary[];
  /** Absent on older backend builds; empty for HOA callers. */
  forecast?: BuildingGiftCardForecast[];
  /** Absent on older backend builds. */
  buildingTerms?: BuildingGiftCardTerms[];
}

/** One gift card a resident has redeemed (detail view). */
export interface GiftCardRedemption {
  id: string;
  brand: string;
  valueCents: number;
  creditsSpent: number;
  redeemedAt: string;
}

/** One row of a resident's full credit ledger (detail view) — mirrors
 *  the mobile app's /api/resident/credit-history row shape. */
export interface CreditHistoryEntry {
  id: string;
  type: "Purchase" | "Earned" | "Spent" | "Refund";
  credits: number;
  amountInCents: number | null;
  paymentMethod: string | null;
  createdAt: string;
}

export interface GiftCardResidentDetail {
  resident: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    unit: string | null;
    buildingId: string;
    buildingName: string;
    creditBalance: number;
  };
  giftCards: GiftCardRedemption[];
  creditHistory: CreditHistoryEntry[];
}

export async function listGiftCardReport() {
  return apiClient.get<GiftCardReport>("/api/gift-cards");
}

export async function getGiftCardResidentDetail(residentId: string) {
  return apiClient.get<GiftCardResidentDetail>(`/api/gift-cards/${residentId}`);
}

/** Super Admin only — the backend re-checks the role regardless. */
export async function sendGiftCardReminder(residentId: string) {
  return apiClient.post<{ ok: true }>(`/api/gift-cards/${residentId}/remind`, {});
}