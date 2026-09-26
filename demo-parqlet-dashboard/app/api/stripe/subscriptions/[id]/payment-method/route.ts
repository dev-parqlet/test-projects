"use server";

import { NextRequest } from "next/server";
import { handleRequest } from "@/lib/handle-request";

/**
 * POST /api/stripe/subscriptions/[id]/payment-method
 *
 * Attaches a PaymentMethod (from Elements confirmSetup) to the subscription's
 * default_payment_method. Stripe auto-retries any unpaid invoice. The webhook
 * fires invoice.payment_succeeded (or .payment_failed again) which the
 * handler picks up.
 *
 * Body (forwarded verbatim from the dashboard):
 *   { buildingId, paymentMethodId }
 *
 * Next.js 16 dynamic params: must await `params` to get `{ id }`.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handleRequest(request, `/api/stripe/subscriptions/${encodeURIComponent(id)}/payment-method`, {
    method: "POST",
    mockFile: "stripe-payment-method",
  });
}
