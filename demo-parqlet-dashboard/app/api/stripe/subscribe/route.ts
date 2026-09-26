"use server";

import { NextRequest } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { handleRequest } from "@/lib/handle-request";

const MOCK_DATA_DIR = path.join(process.cwd(), "app/lib/mock-data");

/**
 * POST /api/stripe/subscribe
 *
 * Proxies to api.parqlet.com/api/stripe/subscribe so the dashboard can
 * drive Stripe Elements onboarding (step 4 of the wizard) without holding
 * the Stripe secret. The backend pre-INSERTs the subscriptions row in
 * 'Incomplete' status, creates the Stripe Customer + Subscription in
 * `incomplete` state with payment_behavior: 'default_incomplete', and
 * returns the latest_invoice.payment_intent.client_secret.
 *
 * Body (forwarded verbatim):
 *   { buildingId, customerEmail, enrollmentToken? }
 *
 * Live mode: proxies to backend. Mock mode: returns a synthesized response
 * (base loaded from `stripe-subscribe.json`, dynamic `subscriptionId`
 * appended) so designers can drive the wizard without Stripe credentials.
 */
export async function POST(request: NextRequest) {
  return handleRequest(request, "/api/stripe/subscribe", {
    method: "POST",
    mockFactory: () => {
      const base = JSON.parse(
        fs.readFileSync(path.join(MOCK_DATA_DIR, "stripe-subscribe.json"), "utf-8"),
      );
      return { ...base, subscriptionId: `sub_mock_${Date.now()}` };
    },
  });
}
