"use server";

import { NextRequest } from "next/server";
import { handleRequest } from "@/lib/handle-request";

/**
 * POST /api/super-admin/credits/adjust
 *
 * Proxies to the backend, which enforces Super Admin. Like every other
 * route here it goes through `handleRequest` — NEXT_PUBLIC_API_URL is
 * the dashboard's own origin in every environment, so a hand-rolled
 * fetch would land back on Next.js rather than the API.
 */
export async function POST(request: NextRequest) {
  return handleRequest(request, "/api/super-admin/credits/adjust", {
    method: "POST",
    // Mock mode has no ledger to move; echo a plausible success so the
    // modal's happy path can be exercised locally.
    mockFactoryWithBody: (raw) => {
      const body = (raw ?? {}) as { delta?: number };
      return { ok: true, delta: body.delta ?? 0, applied: 1, skipped: 0, results: [], skippedResidents: [] };
    },
  });
}
