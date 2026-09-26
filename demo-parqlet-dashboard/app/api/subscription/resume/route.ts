"use server";

import { NextRequest } from "next/server";
import { handleRequest } from "@/lib/handle-request";
import {
  findByBuildingId,
  resumeMockSubscription,
} from "@/lib/mock-subscription-store";

/**
 * POST /api/subscription/resume — superadmin-only override.
 *
 * Mirror of app/api/subscription/pause/route.ts. Clears the pause audit
 * (paused_at, paused_by) and flips status back to "Active". Idempotent —
 * a resume on an already-Active subscription is a no-op write.
 */
export async function POST(request: NextRequest) {
  const body = (await request.clone().json().catch(() => ({}))) as { buildingId?: string };
  const buildingId = body.buildingId ?? "";
  return handleRequest(
    request,
    `/api/buildings/${buildingId}/subscription/resume`,
    {
      mockFactoryWithBody: (b) => {
        const { buildingId: bid } = b as { buildingId: string };
        const sub = findByBuildingId(bid);
        if (!sub) {
          return { code: "NOT_FOUND", message: `No subscription for building ${bid}` };
        }
        const updated = resumeMockSubscription(sub.id);
        return { data: updated };
      },
      mockStatus: (b) => {
        const { buildingId: bid } = b as { buildingId: string };
        return findByBuildingId(bid) ? undefined : 404;
      },
    },
  );
}