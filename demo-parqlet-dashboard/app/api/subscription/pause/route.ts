"use server";

import { NextRequest, NextResponse } from "next/server";
import { handleRequest } from "@/lib/handle-request";
import {
  findByBuildingId,
  pauseMockSubscription,
} from "@/lib/mock-subscription-store";

/**
 * POST /api/subscription/pause — superadmin-only override.
 *
 * Mirrors the backend's POST /api/buildings/:buildingId/subscription/pause
 * (drizzle/0038). The dashboard's apiClient routes here, and handleRequest
 * forwards to the real backend in production (substituting buildingId
 * into the path). In mock mode, the subscription row is resolved by
 * building_id (1:1 in current model) and mutated in-place via
 * pauseMockSubscription. The mock user id is fixed to "mock-super-admin"
 * — mock mode is designer-only and doesn't need a real session; the prod
 * path picks up the real superadmin id from the cookie.
 */
export async function POST(request: NextRequest) {
  // The backend path is parameterized; resolve buildingId from the body so
  // we can forward to the correct upstream URL.
  const body = (await request.clone().json().catch(() => ({}))) as { buildingId?: string };
  const rawBuildingId = body.buildingId ?? "";
  // The path is interpolated as a single segment; reject anything that
  // isn't a UUID so a malicious or malformed id cannot reshape the
  // forwarded URL (e.g. "a/b", "../x", "x?y=1", "#frag").
  if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(rawBuildingId)) {
    return NextResponse.json(
      { error: { message: "buildingId is required and must be a UUID" } },
      { status: 400 },
    );
  }
  return handleRequest(
    request,
    `/api/buildings/${rawBuildingId}/subscription/pause`,
    {
      mockFactoryWithBody: (b) => {
        const { buildingId: bid } = b as { buildingId: string };
        const sub = findByBuildingId(bid);
        if (!sub) {
          return { code: "NOT_FOUND", message: `No subscription for building ${bid}` };
        }
        const updated = pauseMockSubscription(sub.id, "mock-super-admin");
        return { data: updated };
      },
      mockStatus: (b) => {
        const { buildingId: bid } = b as { buildingId: string };
        return findByBuildingId(bid) ? undefined : 404;
      },
    },
  );
}