"use server";

/**
 * GET /api/gift-cards — resident-centric gift card report (HOA +
 * Super Admin, backend scopes by building for HOA callers).
 *
 * Backend contract: parqlet-backend/src/routes/super-admin-gift-cards.ts.
 */
import { NextRequest } from "next/server";
import { handleRequest } from "@/lib/handle-request";
import { listMockGiftCardReport } from "@/lib/mock-data/gift-cards-mock-store";

export async function GET(request: NextRequest) {
  return handleRequest(request, "/api/super-admin/gift-cards", {
    mockFactory: () => listMockGiftCardReport(),
  });
}
