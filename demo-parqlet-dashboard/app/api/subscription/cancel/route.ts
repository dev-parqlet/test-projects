"use server";

import { NextRequest } from "next/server";
import { handleRequest } from "@/lib/handle-request";
import { mutateById } from "@/lib/mock-subscription-store";

export async function POST(request: NextRequest) {
  return handleRequest(request, "/api/subscription/cancel", {
    mockFactoryWithBody: (body) => {
      const { subscriptionId } = body as { subscriptionId: string };
      const nowIso = new Date().toISOString();
      const updated = mutateById(subscriptionId, (sub) => ({
        ...sub,
        status: "Cancelled",
        cancelled_at: nowIso,
        updated_at: nowIso,
      }));
      return { data: updated };
    },
  });
}
