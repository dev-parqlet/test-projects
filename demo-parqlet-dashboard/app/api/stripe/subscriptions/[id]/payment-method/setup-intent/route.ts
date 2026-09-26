"use server";

import { NextRequest } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { handleRequest } from "@/lib/handle-request";

const MOCK_DATA_DIR = path.join(process.cwd(), "app/lib/mock-data");

/**
 * POST /api/stripe/subscriptions/[id]/payment-method/setup-intent
 *
 * Returns a SetupIntent client_secret so the dashboard can render Stripe
 * Elements + PaymentElement for a fresh card (the retry-payment flow).
 * The companion endpoint /subscriptions/[id]/payment-method then attaches
 * the resulting PaymentMethod to the subscription as default_payment_method.
 *
 * Next.js 16 dynamic params: must await `params` to get `{ id }`.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handleRequest(request, `/api/stripe/subscriptions/${encodeURIComponent(id)}/payment-method/setup-intent`, {
    method: "POST",
    mockFactory: () => {
      const base = JSON.parse(
        fs.readFileSync(path.join(MOCK_DATA_DIR, "stripe-setup-intent.json"), "utf-8"),
      );
      return { ...base, clientSecret: `seti_mock_${Date.now()}_secret_${Date.now()}` };
    },
  });
}
