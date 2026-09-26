"use server";

/**
 * POST /api/gift-cards/:residentId/remind — Super Admin only (backend
 * re-checks the role). Sends a push + in-app notification nudging an
 * eligible resident to redeem their credits.
 *
 * See app/api/gift-cards/route.ts for the backend contract.
 */
import { NextRequest } from "next/server";
import { handleRequest } from "@/lib/handle-request";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ residentId: string }> },
) {
  const { residentId } = await params;
  return handleRequest(request, `/api/super-admin/gift-cards/${residentId}/remind`, {
    method: "POST",
    mockFactory: () => ({ ok: true }),
  });
}
