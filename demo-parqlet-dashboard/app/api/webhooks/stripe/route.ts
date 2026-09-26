import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

/**
 * POST /api/webhooks/stripe
 *
 * Receives Stripe events for subscription lifecycle:
 *   - checkout.session.completed        → activate the subscription
 *   - customer.subscription.created     → activate
 *   - customer.subscription.updated     → sync status / period end
 *   - customer.subscription.deleted     → mark cancelled
 *
 * In live mode the Stripe signature is verified using STRIPE_WEBHOOK_SECRET
 * and the matching subscription row in the database is updated. In proxy mode
 * the raw event is forwarded to the backend's webhook endpoint so the backend
 * owns the source of truth. In mock mode no signature is required and we
 * persist into app/lib/mock-data/subscriptions.json so designers can drive
 * the flow end-to-end without Stripe credentials.
 *
 * Required env (live mode only):
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET
 */
export async function POST(request: NextRequest) {
  const isMock = process.env.NEXT_PUBLIC_MOCK_ENABLED === "true";

  // Read raw body once — Stripe signature verification needs the exact bytes.
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";

  if (isMock) {
    // Mock mode: accept any payload, persist to mock JSON.
    let event: MockStripeEvent;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: { message: "Invalid JSON" } }, { status: 400 });
    }

    const result = applyMockEvent(event);
    return NextResponse.json({ received: true, mock: true, ...result });
  }

  // ─── Proxy / live mode ────────────────────────────────────────────────────
  const API_URL = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://api.parqlet.com";

  // If the backend exposes its own webhook handler, forward the raw body +
  // signature so the backend can verify and persist.
  try {
    // Bound the proxy call so a slow/unresponsive backend can't hang this
    // handler past Stripe's webhook delivery timeout (which would trigger
    // duplicate retries).
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const res = await fetch(`${API_URL}/api/webhooks/stripe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Stripe-Signature": signature,
        },
        body: rawBody,
        signal: controller.signal,
      });
      const text = await res.text();
      return new NextResponse(text, { status: res.status });
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return NextResponse.json({ error: { message: "Failed to forward webhook" } }, { status: 502 });
  }
}

// ─── Mock helpers ────────────────────────────────────────────────────────────

const SUBSCRIPTIONS_PATH = path.join(process.cwd(), "app/lib/mock-data/subscriptions.json");
const REVENUE_SUMMARY_PATH = path.join(process.cwd(), "app/lib/mock-data/revenue-summary.json");

interface MockStripeEvent {
  type?: string;
  data?: {
    object?: {
      id?: string;
      customer?: string;
      subscription?: string;
      status?: string;
      current_period_end?: number;
      metadata?: Record<string, string>;
    };
  };
}

interface StoredSubscription {
  id: string;
  building_id: string;
  plan_name: string;
  status: string;
  mrr: number;
  next_renewal_date: string | null;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
  payment_method: { last4: string; brand: string; expiry: string } | null;
  billing_address: { company: string; email: string; tax_id: string };
  invoice_notifications: {
    on_renewal: boolean;
    copy_to_billing_contact: boolean;
    renewal_reminder_7_days: boolean;
    failed_payment_alert: boolean;
  };
  additional_invoice_emails: string[];
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

function applyMockEvent(event: MockStripeEvent): { status?: string; subscriptionId?: string } {
  const obj = event?.data?.object ?? {};
  const buildingId = obj.metadata?.buildingId;
  if (!buildingId) return {};

  const raw = fs.readFileSync(SUBSCRIPTIONS_PATH, "utf-8");
  const file = JSON.parse(raw) as { data: StoredSubscription[]; total: number; page: number; pageSize: number };
  const idx = file.data.findIndex((s) => s.building_id === buildingId);

  const nowIso = new Date().toISOString();

  // Find or create the subscription row for this building. Designers can
  // iterate on the wizard without a pre-existing row — we create a minimal
  // one so the UI reflects the new state immediately.
  if (idx < 0) {
    const planName = obj.metadata?.planName ?? "Growth";
    file.data.push({
      id: `sub_${Date.now()}`,
      building_id: buildingId,
      plan_name: planName,
      status: "Active",
      mrr: defaultMrr(planName),
      next_renewal_date: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      created_at: nowIso,
      updated_at: nowIso,
      cancelled_at: null,
      payment_method: null,
      billing_address: { company: "", email: obj.metadata?.customerEmail ?? "", tax_id: "" },
      invoice_notifications: {
        on_renewal: true,
        copy_to_billing_contact: false,
        renewal_reminder_7_days: false,
        failed_payment_alert: true,
      },
      additional_invoice_emails: [],
      stripe_customer_id: obj.customer,
      stripe_subscription_id: obj.subscription ?? obj.id,
    });
  } else {
    const sub = file.data[idx];
    // Preserve the actual Stripe lifecycle state on update events — every
    // non-deletion event was being written as "Active" before, which silently
    // turned past_due / unpaid subscriptions into revenue and inflated the
    // dashboard's MRR/ARR.
    sub.status = resolveStoredStatus(event.type, obj.status);
    sub.stripe_customer_id = obj.customer ?? sub.stripe_customer_id;
    sub.stripe_subscription_id = obj.subscription ?? obj.id ?? sub.stripe_subscription_id;
    if (obj.current_period_end) {
      sub.next_renewal_date = new Date(obj.current_period_end * 1000).toISOString();
    }
    sub.updated_at = nowIso;
    if (sub.status === "Cancelled") {
      sub.cancelled_at = sub.cancelled_at ?? nowIso;
    }
    file.data[idx] = sub;
  }

  file.total = file.data.length;
  fs.writeFileSync(SUBSCRIPTIONS_PATH, JSON.stringify(file, null, 2) + "\n");

  // Keep the revenue dashboard's summary consistent with the mock
  // subscriptions we just wrote, otherwise its totals go stale after onboarding.
  syncRevenueSummary(file.data);

  return { status: event.type, subscriptionId: file.data.find((s) => s.building_id === buildingId)?.id };
}

/**
 * Recompute totalMrr / totalArr / activeSubscriptions from the current mock
 * subscription rows and rewrite revenue-summary.json. Read-modify-write so the
 * hand-authored overdueCount / expiringSoonCount fields are preserved.
 */
function syncRevenueSummary(subs: StoredSubscription[]): void {
  const active = subs.filter((s) => s.status === "Active");
  const totalMrr = active.reduce((sum, s) => sum + (s.mrr ?? 0), 0);

  let summary: Record<string, number> = {};
  try {
    summary = JSON.parse(fs.readFileSync(REVENUE_SUMMARY_PATH, "utf-8"));
  } catch {
    // Missing/corrupt summary — start fresh; the fields below get set anyway.
  }

  summary.totalMrr = totalMrr;
  summary.totalArr = totalMrr * 12;
  summary.activeSubscriptions = active.length;

  fs.writeFileSync(REVENUE_SUMMARY_PATH, JSON.stringify(summary) + "\n");
}

function defaultMrr(planName: string): number {
  switch (planName.toLowerCase()) {
    case "starter":    return 49900;
    case "growth":     return 99900;
    case "enterprise": return 199900;
    default:           return 99900;
  }
}

/**
 * Map Stripe subscription lifecycle statuses to the dashboard's stored
 * status values (the union is `Active | Cancelled | Past Due` per
 * `Subscription["status"]` in app/lib/api/subscriptions.ts).
 *
 * - `checkout.session.completed` is the activation path → Active.
 * - `customer.subscription.deleted` and Stripe `canceled` → Cancelled.
 * - Stripe `past_due` / `unpaid` / `incomplete*` → Past Due (the dashboard
 *   doesn't yet distinguish these, but they must NOT count as Active or
 *   they'll inflate the revenue summary).
 * - Anything else (active / trialing / paused) → Active.
 */
function resolveStoredStatus(
  eventType: string | undefined,
  stripeStatus: string | undefined,
): "Active" | "Cancelled" | "Past Due" {
  if (eventType === "customer.subscription.deleted") return "Cancelled";
  if (eventType === "checkout.session.completed") return "Active";

  switch (stripeStatus) {
    case "active":
    case "trialing":
    case "paused":
      return "Active";
    case "past_due":
    case "unpaid":
    case "incomplete":
    case "incomplete_expired":
      return "Past Due";
    case "canceled":
      return "Cancelled";
    default:
      // Unknown event / status — default to Active so newly-created rows
      // (where the lifecycle is being seeded by checkout.session.completed)
      // still surface as Active. Updates with an unrecognized Stripe
      // status fall back to Active too, matching the pre-fix behaviour
      // rather than silently dropping revenue.
      return "Active";
  }
}