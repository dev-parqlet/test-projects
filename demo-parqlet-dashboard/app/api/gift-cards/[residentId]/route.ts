"use server";

/**
 * GET /api/gift-cards/:residentId — full detail for the row-click modal:
 * resident info, complete gift card redemption history, and complete
 * credit transaction ledger.
 *
 * Backend contract: parqlet-backend/src/routes/super-admin-gift-cards.ts.
 */
import { NextRequest } from "next/server";
import { handleRequest } from "@/lib/handle-request";
import { getMockGiftCardResidentDetail } from "@/lib/mock-data/gift-cards-mock-store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ residentId: string }> },
) {
  const { residentId } = await params;
  return handleRequest(request, `/api/super-admin/gift-cards/${residentId}`, {
    // `mockFactory` always resolves 200 (handle-request.ts's `mockStatus`
    // override only applies to the WithBody variant) — fine here, an
    // unknown mock residentId is an edge case not worth a fake 404.
    mockFactory: () => {
      const detail = getMockGiftCardResidentDetail(residentId);
      return detail ?? { error: { message: "Resident not found" } };
    },
  });
}
