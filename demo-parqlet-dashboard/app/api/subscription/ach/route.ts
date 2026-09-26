import { NextRequest } from "next/server";
import { handleRequest } from "@/lib/handle-request";

/**
 * POST /api/subscription/ach
 *
 * Registers a building's intent to pay by domestic ACH (Mercury receiving
 * account, see @/lib/ach-instructions). The backend is expected to:
 *   - Create / upsert the building's subscription row
 *   - Set `status = "Active"` and `ach_payment_status = "pending_review"`
 *   - Generate a per-building `ach_remittance_reference` and return it
 *
 * The dashboard does NOT block on payment confirmation — ACH verification
 * is async (we wait for the transfer to land in Mercury and finance matches
 * it). The user is sent straight to the dashboard with a "Pending manual
 * review" notice on the subscription page.
 *
 * Response shape (camelCase keys; consumed by `subscribeWithAch` in
 * `@/lib/api/subscriptions` and converted to camelCase):
 *   {
 *     subscriptionId: string,
 *     status: "Active",
 *     achPaymentStatus: "pending_review",
 *     achRemittanceReference: string,    // ACH-YYYYMMDD-XXXX
 *     mock?: boolean
 *   }
 *
 * Body: { buildingId: string }
 */
export async function POST(request: NextRequest) {
  return handleRequest(request, "/api/subscription/ach", {
    method: "POST",
    mockFile: "subscriptions-ach",
  });
}
