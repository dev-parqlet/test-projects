/**
 * Subscription API — fetched by app/(hoa)/subscription/page.tsx
 *
 * Wraps the Next.js API routes (app/api/subscription/...) and the
 * singular backend endpoint (api.parqlet.com/api/subscription) and maps
 * raw snake_case JSON to the camelCase types the page expects.
 */

import { apiClient } from "./client";

// ─── Types ───────────────────────────────────────────────────────────────────

export type PaymentMethodType = "credit_card" | "ach";
export type AchPaymentStatus =
  | "pending_review"   // HOA submitted; we haven't seen funds hit Mercury yet
  | "approved"         // transfer verified, subscription fully active
  | "rejected";        // funds bounced, missing memo, etc.

export interface Subscription {
  id: string;
  buildingId: string;
  planName: string;
  // 'Incomplete' is the brief payment-in-flight state set by POST /api/stripe/subscribe
  // before the webhook moves the row to 'Active'. Render distinctly from 'Past Due'.
  // 'Paused' is the superadmin-only override set by POST /api/buildings/:id/subscription/pause
  // — billing continues but new guest-bookings are blocked.
  status: "Active" | "Cancelled" | "Past Due" | "Incomplete" | "Trialing" | "Paused";
  /** Monthly recurring revenue in dollars (already converted from cents). */
  mrr: number;
  nextRenewalDate: string;
  /** Which payment method the subscription is on. Defaults to "credit_card" for legacy rows. */
  paymentMethodType: PaymentMethodType;
  /**
   * Card payment method (Stripe). `null` when the subscription is on ACH
   * (we don't keep a card on file in that case).
   */
  paymentMethod: {
    last4: string;
    brand: string;
    expiry: string;
  } | null;
  /**
   * Status of the most recent ACH transfer. `null` for card subscriptions or
   * before the first transfer has been submitted.
   */
  achPaymentStatus: AchPaymentStatus | null;
  /**
   * Memo / reference the HOA should use on the ACH transfer. Parqlet
   * reconciliation keys on this string, so it's surfaced prominently on the
   * subscription page when ACH is the chosen method.
   */
  achRemittanceReference: string | null;
  /** ISO timestamp of the latest ACH approval. `null` until finance approves. */
  achApprovedAt: string | null;
  /** User id of the super admin who approved the ACH transfer. `null` until approved. */
  achApprovedByUserId: string | null;
  /** Billing-only fields — physical building address is read from the buildings
   *  record, so we don't store it here to avoid two sources of truth. */
  billingAddress: {
    company: string;
    email: string;
    taxId: string;
  };
  invoiceNotifications: {
    onRenewal: boolean;
    copyToBillingContact: boolean;
    renewalReminder7Days: boolean;
    failedPaymentAlert: boolean;
  };
  additionalInvoiceEmails: string[];
  cancelledAt: string | null;
  /**
   * Superadmin pause audit (drizzle/0038). `null` when the building is not
   * paused. `pausedBy` is the superadmin user id. Surfaced on the dashboard's
   * building details page so the operator can see who paused and when.
   */
  pausedAt: string | null;
  pausedBy: string | null;
}

export interface Invoice {
  id: string;
  buildingId: string;
  date: string;
  /** Amount in dollars (already converted from cents). */
  amount: number;
  status: "Paid" | "Pending" | "Failed";
  /**
   * Stripe-hosted invoice page (https://invoice.stripe.com/i/...). Primary
   * user-facing link — opens in a new tab via the "View" button.
   */
  hostedInvoiceUrl: string;
  /**
   * Stripe-hosted PDF download URL. Secondary "Download PDF" button. May
   * equal `hostedInvoiceUrl` when only one of the two is supplied.
   */
  pdfUrl: string;
}

export interface InvoiceNotificationTemplate {
  id: string;
  label: string;
  description: string;
  defaultEnabled: boolean;
}

// ─── Raw types (snake_case JSON) ─────────────────────────────────────────────

interface RawPaymentMethod {
  last4: string;
  brand: string;
  expiry: string;
}

interface RawBillingAddress {
  company: string;
  email: string;
  tax_id: string;
}

interface RawInvoiceNotifications {
  on_renewal: boolean;
  copy_to_billing_contact: boolean;
  renewal_reminder_7_days: boolean;
  failed_payment_alert: boolean;
}

interface RawSubscription {
  id: string;
  building_id: string;
  plan_name: string;
  status: string;
  /** Backend stores cents — we convert to dollars in `enrichSubscription`. */
  mrr: number;
  next_renewal_date: string | null;
  created_at: string;
  updated_at: string;
  /**
   * Cancellation timestamp. The backend uses the US spelling `canceled_at`
   * (single-l); the dashboard historically used the UK spelling `cancelled_at`
   * (double-l). We accept either since backend rows and mock JSON files use
   * different conventions. The mock JSON uses double-l, the backend uses
   * single-l; pick whichever is present.
   */
  cancelled_at?: string | null;
  canceled_at?: string | null;
  // drizzle/0038 — superadmin pause audit. Optional so legacy mock data
  // without these fields keeps working.
  paused_at?: string | null;
  paused_by?: string | null;
  /**
   * "credit_card" or "ach". Older rows may not include this — default to
   * "credit_card" so legacy subscriptions keep rendering their existing card.
   */
  payment_method_type?: "credit_card" | "ach";
  payment_method: RawPaymentMethod | null;
  ach_payment_status?: string | null;
  ach_remittance_reference?: string | null;
  ach_approved_at?: string | null;
  ach_approved_by_user_id?: string | null;
  /**
   * Backend may return `null` when the subscription has no billing address
   * row (e.g. a building whose HOA never saved one). The dashboard used to
   * dereference this unconditionally and crash. We accept `null` and surface
   * an empty placeholder so the page renders cleanly even when missing.
   */
  billing_address: RawBillingAddress | null;
  invoice_notifications: RawInvoiceNotifications;
  additional_invoice_emails: string[];
}

/**
 * The dashboard historically expected the snake_case shape used by
 * `app/lib/mock-data/invoices.json`. The actual backend `/api/subscription/invoices`
 * route returns raw drizzle rows in camelCase ({ id, subscriptionId,
 * amountInCents, status, dueDate, paidAt, createdAt, updatedAt }) and already
 * filters by building on the server. We union both shapes here so a single
 * enrichment path handles both, and drop the local `building_id === buildingId`
 * filter (backend returns only matching rows; mock data is already building-keyed).
 */
interface RawInvoice {
  id: string;
  // snake_case variant (mock JSON)
  building_id?: string;
  date?: string;
  amount?: number;
  /** Legacy alias for the PDF URL. Kept for backward compat with mock data. */
  pdf_url?: string | null;
  // camelCase variant (drizzle raw rows from backend)
  subscriptionId?: string;
  amountInCents?: number;
  dueDate?: string | null;
  paidAt?: string | null;
  createdAt?: string;
  // shared / status
  status: string;
  /** Stripe-hosted invoice page (https://invoice.stripe.com/i/...) — the
   *  primary user-facing link that opens an HTML receipt in a new tab. */
  hosted_invoice_url?: string | null;
  /** Stripe-hosted PDF download URL. May equal `hosted_invoice_url` when the
   *  backend only returns one of the two. */
  invoice_pdf?: string | null;
  /** Stripe's `in_...` identifier. Null on legacy / unbackfilled rows. */
  stripe_invoice_id?: string | null;
  /** Creation timestamp from whichever shape the backend returns. */
  created_at?: string;
}

interface RawSubscriptionsResponse {
  data: RawSubscription[];
}

interface RawInvoicesResponse {
  data: RawInvoice[];
}

interface RawTemplatesResponse {
  data: Array<{
    id: string;
    label: string;
    description: string;
    default_enabled: boolean;
  }>;
}

// ─── Transform helpers ───────────────────────────────────────────────────────

function brandLabel(brand: string): string {
  switch (brand.toLowerCase()) {
    case "visa":       return "VISA";
    case "mastercard": return "MC";
    case "amex":
    case "american_express":
    case "americanexpress": return "AMEX";
    case "discover":   return "DISC";
    default:           return brand.toUpperCase();
  }
}

function enrichSubscription(sub: RawSubscription): Subscription {
  return {
    id: sub.id,
    buildingId: sub.building_id,
    planName: sub.plan_name,
    status: sub.status as Subscription["status"],
    mrr: sub.mrr / 100, // cents → dollars
    nextRenewalDate: sub.next_renewal_date ?? new Date(Date.now() + 30 * 86_400_000).toISOString().split("T")[0],
    // Legacy rows without an explicit type had only a card, so default to credit_card.
    paymentMethodType: (sub.payment_method_type ?? "credit_card") as Subscription["paymentMethodType"],
    paymentMethod: sub.payment_method
      ? {
          last4: sub.payment_method.last4,
          brand: brandLabel(sub.payment_method.brand),
          expiry: sub.payment_method.expiry,
        }
      : null,
    achPaymentStatus: (sub.ach_payment_status ?? null) as Subscription["achPaymentStatus"],
    achRemittanceReference: sub.ach_remittance_reference ?? null,
    achApprovedAt: sub.ach_approved_at ?? null,
    achApprovedByUserId: sub.ach_approved_by_user_id ?? null,
    billingAddress: sub.billing_address
      ? {
          company: sub.billing_address.company ?? "",
          email:    sub.billing_address.email ?? "",
          taxId:    sub.billing_address.tax_id ?? "",
        }
      : { company: "", email: "", taxId: "" },
    invoiceNotifications: {
      onRenewal: sub.invoice_notifications.on_renewal,
      copyToBillingContact: sub.invoice_notifications.copy_to_billing_contact,
      renewalReminder7Days: sub.invoice_notifications.renewal_reminder_7_days,
      failedPaymentAlert: sub.invoice_notifications.failed_payment_alert,
    },
    additionalInvoiceEmails: sub.additional_invoice_emails,
    // Accept either spelling — backend uses `canceled_at` (1-l), mock JSON
    // uses `cancelled_at` (2-l).
    cancelledAt: sub.cancelled_at ?? sub.canceled_at ?? null,
    pausedAt: sub.paused_at ?? null,
    pausedBy: sub.paused_by ?? null,
  };
}

/**
 * Generate a tiny browser-renderable PDF as a data URL when none is supplied.
 * Keeps mock JSON clean of inline base64 while letting the page open a real PDF
 * in a new tab. Includes a proper xref table + trailer so PDF viewers accept it.
 *
 * DEV-ONLY fallback. The backend's /api/subscription/invoices endpoint now
 * proxies stripe.invoices.list on demand and should always return real
 * `hosted_invoice_url` + `invoice_pdf` URLs for production subscriptions.
 * This helper only fires when (a) we're in mock mode, (b) a future backend
 * bug returns null, or (c) tests exercise edge cases without Stripe.
 */
function generateMockPdfDataUrl(invoiceId: string): string {
  if (typeof btoa === "undefined") return "";
  // Build the content stream with safe ASCII for the invoice id.
  const safeId = invoiceId.replace(/[^\x20-\x7e]/g, "?");
  const content =
    `BT\n/F1 16 Tf\n20 700 Td\n(Parqlet Invoice ${safeId}) Tj\n` +
    `0 -30 Td\n/F1 11 Tf\n(This is a mock invoice generated for designer dev.) Tj\nET`;

  // Each object string (without trailing newline) and its byte offset in the file.
  type ObjEntry = { num: number; body: string };
  const objs: ObjEntry[] = [
    { num: 1, body: `1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj` },
    { num: 2, body: `2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj` },
    {
      num: 3,
      body: `3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<</Font<</F1<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>>>>>/Contents 4 0 R>>endobj`,
    },
    {
      num: 4,
      body: `4 0 obj<</Length ${content.length}>>stream\n${content}\nendstream\nendobj`,
    },
  ];

  // Byte offsets are measured from byte 0; objects are separated by '\n'.
  let cursor = `%PDF-1.4\n`.length;
  const offsets: number[] = [];
  for (const o of objs) {
    offsets.push(cursor);
    cursor += o.body.length + 1; // +1 for the trailing '\n'
  }
  const xrefOffset = cursor;

  const xrefLines = [
    `xref`,
    `0 ${objs.length + 1}`,
    `0000000000 65535 f `,
    ...offsets.map((off) => `${String(off).padStart(10, "0")} 00000 n `),
  ].join("\n");

  const trailer =
    `trailer\n<</Size ${objs.length + 1}/Root 1 0 R>>\n` +
    `startxref\n${xrefOffset}\n%%EOF\n`;

  const pdf = `%PDF-1.4\n${objs.map((o) => o.body).join("\n")}\n${xrefLines}\n${trailer}`;
  // btoa expects latin1; the generated string is pure ASCII.
  return `data:application/pdf;base64,${btoa(pdf)}`;
}

/**
 * Normalize a backend or mock invoice row into the dashboard's `Invoice`
 * shape. Accepts BOTH snake_case (mock JSON) and camelCase (drizzle raw
 * rows from /api/subscription/invoices) — see the union on `RawInvoice`.
 *
 * `buildingId` is passed in by the caller as the last-resort fallback for
 * drizzle rows that don't carry the building column (the backend filters
 * server-side, so the column is sometimes elided). `amount` and `date` come
 * from whichever shape the backend returned; we fall back across both
 * before giving up so a missing column never produces NaN amounts or an
 * "Invalid Date" sort key.
 *
 * URL fields are kept strictly separate: `hostedInvoiceUrl` is only ever
 * sourced from hosted-page fields (never a PDF), and `pdfUrl` only from
 * PDF fields (never the HTML page). Mixing them produced the wrong link
 * type in the wrong button — clicking View opened a raw PDF, clicking
 * PDF opened the HTML receipt. The generated mock PDF fallback is only
 * used when `isMock` is true; production rows with no real URLs render
 * empty links so the UI can disable the buttons rather than fabricate a
 * fake invoice.
 */
function enrichInvoice(inv: RawInvoice, buildingId: string, isMock: boolean): Invoice {
  // Generated PDF fallback is dev-only — only ever return it for confirmed
  // mock responses so a missing production link is honest instead of fake.
  const mockPdfFallback = isMock ? generateMockPdfDataUrl(inv.id) : "";

  // Hosted page: ONLY from hosted-page fields. Mock mode falls back to the
  // generated PDF only if the response carries neither URL.
  const hostedInvoiceUrl = inv.hosted_invoice_url ?? (isMock ? mockPdfFallback : "");
  // PDF download: dedicated field first, legacy alias second. Same
  // mock-only fallback rule.
  const pdfUrl = inv.invoice_pdf ?? inv.pdf_url ?? (isMock ? mockPdfFallback : "");

  // Amount: drizzle returns `amountInCents`; mock JSON returns `amount`
  // already in cents. Either way, divide by 100.
  const cents = inv.amountInCents ?? inv.amount;
  const amount = (typeof cents === "number" ? cents : 0) / 100;

  // Date: prefer an explicit paid date, then the due date, then the
  // creation timestamp from either shape, then `now` as the absolute
  // last resort (kept so the row never has an invalid sort key).
  const date =
    inv.paidAt ??
    inv.dueDate ??
    inv.date ??
    inv.createdAt ??
    inv.created_at ??
    new Date().toISOString();

  return {
    id: inv.id,
    // snake_case rows carry building_id directly; drizzle rows don't, so we
    // fall back to the caller's buildingId (which the backend already
    // filtered on server-side).
    buildingId: inv.building_id ?? buildingId,
    date,
    amount,
    status: (["Paid", "Pending", "Failed"].includes(inv.status)
      ? inv.status
      : "Pending") as Invoice["status"],
    hostedInvoiceUrl,
    pdfUrl,
  };
}

function enrichTemplate(t: RawTemplatesResponse["data"][number]): InvoiceNotificationTemplate {
  return {
    id: t.id,
    label: t.label,
    description: t.description,
    defaultEnabled: t.default_enabled,
  };
}

// ─── Query key factory ────────────────────────────────────────────────────────

export const subscriptionKeys = {
  all: ["subscription"] as const,
  detail: (buildingId: string) => ["subscription", buildingId] as const,
  invoices: (buildingId: string) => ["subscription", buildingId, "invoices"] as const,
  templates: ["subscription", "notification-templates"] as const,
};

// ─── API Functions ───────────────────────────────────────────────────────────

/**
 * The backend's GET /api/subscription returns a single RawSubscription object
 * (one row, since subscriptions.building_id has a UNIQUE index). The mock
 * layer instead serves { data: RawSubscription[] } from subscriptions.json.
 * This helper accepts either shape so callers don't have to branch.
 *
 * `matches` is the per-call predicate (building_id for getSubscription,
 * subscription id for getSubscriptionById). Without it, mock responses that
 * contain multiple subscriptions would always return the first one — a user
 * bound to a non-first building would see "no subscription" in localhost
 * mock mode even though the row exists.
 */
function unwrapSubscription(
  res: RawSubscriptionsResponse | RawSubscription,
  matches: (subscription: RawSubscription) => boolean,
): RawSubscription | null {
  if (Array.isArray((res as RawSubscriptionsResponse).data)) {
    return ((res as RawSubscriptionsResponse).data ?? []).find(matches) ?? null;
  }
  const subscription = res as RawSubscription;
  return subscription.id && matches(subscription) ? subscription : null;
}

/**
 * Fetch the subscription for a building. Returns `null` when the API responds
 * with no record so the page can hide sections (e.g. Cancel block) that
 * shouldn't render for subscriptions in the "missing" state.
 */
export async function getSubscription(buildingId: string): Promise<Subscription | null> {
  const res = await apiClient.get<RawSubscriptionsResponse | RawSubscription>(
    "/api/subscription",
    { buildingId },
  );
  const raw = unwrapSubscription(res, (s) => s.building_id === buildingId);
  if (!raw) return null;
  return enrichSubscription(raw);
}

/**
 * Fetch a single subscription by its id. Use this when you need to verify a
 * specific subscription (e.g. the one just created by Stripe Elements) rather
 * than the first subscription belonging to a building. Falls back to
 * `getSubscription(buildingId)` if no id is supplied.
 */
export async function getSubscriptionById(
  id: string,
  buildingId?: string,
): Promise<Subscription | null> {
  const res = await apiClient.get<RawSubscriptionsResponse | RawSubscription>(
    "/api/subscription",
    buildingId ? { buildingId } : undefined,
  );
  const raw = unwrapSubscription(res, (s) => s.id === id);
  if (!raw) return null;
  return enrichSubscription(raw);
}

export async function listInvoices(buildingId: string): Promise<Invoice[]> {
  const res = await apiClient.get<RawInvoicesResponse>("/api/subscription/invoices", { buildingId });
  // Backend now filters by building on the server and returns raw drizzle
  // rows lacking `building_id`. The old `i.building_id === buildingId` guard
  // therefore dropped every backend invoice. We keep the guard for snake_case
  // mock rows that still carry `building_id`, but trust the backend's
  // server-side filter otherwise.
  const rawInvoices: RawInvoice[] = (res.data ?? []).filter(
    (i) => i.building_id === undefined || i.building_id === buildingId,
  );
  // Only return the generated mock-PDF fallback for confirmed mock-mode
  // responses; production rows with missing URLs render empty links instead
  // of fabricating fake invoices.
  const isMock = process.env.NEXT_PUBLIC_MOCK_ENABLED !== "false";
  // Newest first.
  return rawInvoices
    .map((inv) => enrichInvoice(inv, buildingId, isMock))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function listInvoiceNotificationTemplates(): Promise<InvoiceNotificationTemplate[]> {
  const res = await apiClient.get<RawTemplatesResponse>("/api/subscription/invoice-notification-template");
  return (res.data ?? []).map(enrichTemplate);
}

// ─── Mutation bodies ─────────────────────────────────────────────────────────

export interface UpdateBillingInfoBody {
  subscriptionId: string;
  billingAddress: { company: string; email: string; taxId: string };
}

export interface UpdateInvoiceNotificationsBody {
  subscriptionId: string;
  invoiceNotifications: Subscription["invoiceNotifications"];
  additionalInvoiceEmails: string[];
}

export interface CancelSubscriptionBody {
  subscriptionId: string;
}

// ─── Mutations (return updated subscription) ──────────────────────────────────

// The two PUTs return the updated subscription as a FLAT object (matches
// POST /api/subscription/cancel on the backend). We pass it straight to
// enrichSubscription rather than res.data.
export async function updateBillingInfo(
  buildingId: string,
  body: UpdateBillingInfoBody,
): Promise<Subscription> {
  const res = await apiClient.put<RawSubscription>(
    "/api/subscription/billing-info",
    { buildingId, ...body },
  );
  return enrichSubscription(res);
}

export async function updateInvoiceNotifications(
  buildingId: string,
  body: UpdateInvoiceNotificationsBody,
): Promise<Subscription> {
  const res = await apiClient.put<RawSubscription>(
    "/api/subscription/invoice-notifications",
    { buildingId, ...body },
  );
  return enrichSubscription(res);
}

export async function cancelSubscription(
  buildingId: string,
  body: CancelSubscriptionBody,
): Promise<Subscription> {
  const res = await apiClient.post<{ data: RawSubscription }>(
    "/api/subscription/cancel",
    { buildingId, ...body },
  );
  return enrichSubscription(res.data);
}

// ─── Pause / Resume (superadmin-only override) ───────────────────────────────
//
// drizzle/0038 in the backend added a "Paused" subscription_status enum value
// and POST /api/buildings/:id/subscription/{pause,resume} routes that flip
// between Active and Paused without touching Stripe billing. The pausedAt /
// pausedBy audit columns live on the subscriptions row and are surfaced in
// GET /api/subscription (raw) → enrichSubscription (camelCase).
//
// Both calls below proxy through app/api/subscription/{pause,resume}/route.ts,
// which forwards to the backend in production and to the mock store in
// localhost. The response shape is the full enriched Subscription so the
// caller can update its TanStack Query cache with the new state.

export async function pauseSubscription(buildingId: string): Promise<Subscription> {
  const res = await apiClient.post<{ data: RawSubscription }>(
    "/api/subscription/pause",
    { buildingId },
  );
  return enrichSubscription(res.data);
}

export async function resumeSubscription(buildingId: string): Promise<Subscription> {
  const res = await apiClient.post<{ data: RawSubscription }>(
    "/api/subscription/resume",
    { buildingId },
  );
  return enrichSubscription(res.data);
}

// ─── Stripe Elements (subscription onboarding + retry-payment) ─────────────
//
// Three helpers drive the new Elements flow. They call the dashboard's
// same-origin proxy routes (app/api/stripe/...), which forward to the
// backend and handle mock-mode responses. Card data is collected by
// <PaymentElement> on the dashboard and never reaches the backend — only
// the resulting `pm_…` id is forwarded by `attachSubscriptionPaymentMethod`.

export interface SubscribeToStripeBody {
  buildingId: string;
  customerEmail: string;
  enrollmentToken?: string;
}

export interface SubscribeToStripeResult {
  subscriptionId: string;
  clientSecret?: string;
  status: string;
  /** True when running in mock mode — caller skips Elements */
  mock?: boolean;
}

/**
 * Ask the backend to create a Stripe Subscription (in `incomplete` state)
 * for the given building. Returns the PaymentIntent client_secret that
 * the dashboard's Stripe Elements will confirm.
 */
export async function subscribeToStripe(
  body: SubscribeToStripeBody,
): Promise<SubscribeToStripeResult> {
  return apiClient.post<SubscribeToStripeResult>("/api/stripe/subscribe", body);
}

export interface CreateSetupIntentResult {
  clientSecret: string;
  mock?: boolean;
}

/**
 * Fetch a SetupIntent client_secret for the retry-payment flow. The
 * dashboard renders Elements + PaymentElement, calls stripe.confirmSetup
 * to save the resulting PaymentMethod to the Customer, then POSTs the
 * `pm_…` id to `attachSubscriptionPaymentMethod`.
 */
export async function createSubscriptionPaymentMethodSetupIntent(
  subscriptionId: string,
  body: { buildingId: string },
): Promise<CreateSetupIntentResult> {
  return apiClient.post<CreateSetupIntentResult>(
    `/api/stripe/subscriptions/${encodeURIComponent(subscriptionId)}/payment-method/setup-intent`,
    body,
  );
}

export interface AttachPaymentMethodResult {
  ok: boolean;
  status: string;
  mock?: boolean;
}

/**
 * Attach a Stripe PaymentMethod (from Elements confirmSetup) to the
 * subscription's default_payment_method. Stripe auto-retries any unpaid
 * invoice; the webhook handler picks up invoice.payment_succeeded.
 *
 * The dashboard is responsible for confirming the SetupIntent FIRST and
 * only calling this once the resulting PaymentMethod id is known.
 */
export async function attachSubscriptionPaymentMethod(
  subscriptionId: string,
  body: { buildingId: string; paymentMethodId: string },
): Promise<AttachPaymentMethodResult> {
  return apiClient.post<AttachPaymentMethodResult>(
    `/api/stripe/subscriptions/${encodeURIComponent(subscriptionId)}/payment-method`,
    body,
  );
}

// ─── ACH bank transfer onboarding ───────────────────────────────────────────
//
// HOAs can choose to pay by domestic ACH instead of card. The dashboard
// shows them Parqlet's Mercury receiving account (see @/lib/ach-instructions)
// and asks them to send a transfer with a per-building remittance reference.
// The subscription is created in a `Pending manual review` state until our
// finance team matches the funds in Mercury and flips it to `Active`.

export interface SubscribeWithAchBody {
  buildingId: string;
}

export interface SubscribeWithAchResult {
  subscriptionId: string;
  status: "Active";
  achPaymentStatus: "pending_review";
  /** Per-building remittance reference (backend format: `ACH-YYYYMMDD-XXXX`). */
  achRemittanceReference: string;
  mock?: boolean;
}

/**
 * Register the building's intent to pay by ACH. The backend activates the
 * subscription immediately, records `pending_review`, and returns the
 * the per-building remittance reference. The dashboard then renders the
 * bank instructions and lets the user continue to the dashboard — no
 * Stripe Elements involved.
 */
export async function subscribeWithAch(
  body: SubscribeWithAchBody,
): Promise<SubscribeWithAchResult> {
  return apiClient.post<SubscribeWithAchResult>("/api/subscription/ach", body);
}
