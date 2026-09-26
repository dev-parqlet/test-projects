/**
 * Mock-mode mutation helpers for subscriptions.
 *
 * The subscription mock JSON is a static file, so write operations in mock
 * mode (PUT /api/subscriptions/payment-method, etc.) read the file, mutate the
 * matching record, and write it back. This persists across page refreshes
 * during a dev session and resets on `npm run dev` restart — exactly what a
 * designer needs when iterating on subscription UX.
 *
 * Only used in mock mode; the proxy branch in handle-request.ts delegates to
 * the real backend as usual.
 */

import * as fs from "fs";
import * as path from "path";

export interface RawStoredSubscription {
  id: string;
  building_id: string;
  plan_name: string;
  status: string;
  mrr: number;
  next_renewal_date: string | null;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
  // drizzle/0038 — superadmin pause audit. Optional so existing mock rows
  // (and the seed JSON) keep loading without a backfill migration.
  paused_at?: string | null;
  paused_by?: string | null;
  payment_method: {
    last4: string;
    brand: string;
    expiry: string;
  } | null;
  billing_address: {
    company: string;
    email: string;
    tax_id: string;
  };
  invoice_notifications: {
    on_renewal: boolean;
    copy_to_billing_contact: boolean;
    renewal_reminder_7_days: boolean;
    failed_payment_alert: boolean;
  };
  additional_invoice_emails: string[];
}

const SUBSCRIPTIONS_PATH = path.join(process.cwd(), "app/lib/mock-data/subscriptions.json");

export function readSubscriptions(): RawStoredSubscription[] {
  const raw = fs.readFileSync(SUBSCRIPTIONS_PATH, "utf-8");
  return (JSON.parse(raw).data ?? []) as RawStoredSubscription[];
}

export function writeSubscriptions(subs: RawStoredSubscription[]): void {
  fs.writeFileSync(
    SUBSCRIPTIONS_PATH,
    JSON.stringify({ data: subs, total: subs.length, page: 1, pageSize: subs.length }, null, 2) + "\n",
  );
}

export function findById(id: string): RawStoredSubscription | undefined {
  return readSubscriptions().find((s) => s.id === id);
}

export function mutateById(id: string, mutator: (sub: RawStoredSubscription) => RawStoredSubscription): RawStoredSubscription {
  const subs = readSubscriptions();
  const idx = subs.findIndex((s) => s.id === id);
  if (idx < 0) throw new Error(`Subscription ${id} not found`);
  subs[idx] = mutator(subs[idx]);
  writeSubscriptions(subs);
  return subs[idx];
}

export function brandToWire(brand: string): string {
  switch (brand.toUpperCase()) {
    case "VISA":       return "visa";
    case "MC":
    case "MASTERCARD": return "mastercard";
    case "AMEX":
    case "AMERICAN EXPRESS":
    case "AMERICAN_EXPRESS":
    case "AMERICANEXPRESS": return "amex";
    case "DISC":
    case "DISCOVER":   return "discover";
    default:           return brand.toLowerCase();
  }
}

// ─── Pause / Resume (superadmin override) ────────────────────────────────────
//
// Mirrors the backend's POST /api/buildings/:id/subscription/{pause,resume}
// (drizzle/0038). Idempotent: pause on a paused row refreshes paused_at;
// resume on an active row is a no-op. Billing continues — this is a
// guest-booking guardrail, not a Stripe.pause_collection call.
export function pauseMockSubscription(
  id: string,
  byUserId: string,
): RawStoredSubscription {
  return mutateById(id, (s) => ({
    ...s,
    status: "Paused",
    paused_at: new Date().toISOString(),
    paused_by: byUserId,
    updated_at: new Date().toISOString(),
  }));
}

export function resumeMockSubscription(id: string): RawStoredSubscription {
  return mutateById(id, (s) => ({
    ...s,
    status: "Active",
    paused_at: null,
    paused_by: null,
    updated_at: new Date().toISOString(),
  }));
}

/** Resolve the subscription row for a building (1:1 in current model). */
export function findByBuildingId(buildingId: string): RawStoredSubscription | undefined {
  return readSubscriptions().find((s) => s.building_id === buildingId);
}

/** Detect card brand from the 4-digit BIN range for mock convenience. */
export function inferBrandFromNumber(num: string): string {
  const digits = num.replace(/\D/g, "");
  if (digits.startsWith("4")) return "visa";
  if (/^5[1-5]/.test(digits) || /^2(2[2-9]|[3-6]|7[01]|720)/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  if (/^6(011|5)/.test(digits)) return "discover";
  return "visa";
}
