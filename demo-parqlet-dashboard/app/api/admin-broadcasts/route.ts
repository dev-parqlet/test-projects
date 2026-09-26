"use server";

/**
 * GET /api/admin-broadcasts — list SAdmin broadcast campaigns
 * POST /api/admin-broadcasts — create one
 *
 * Backend contract: parqlet-backend/src/routes/admin-broadcasts.ts. No DB
 * table backs this — the real backend stores each campaign as pg-boss
 * schedules and reassembles them into rows at read time.
 */
import { NextRequest } from "next/server";
import { handleRequest } from "@/lib/handle-request";
import { listMockBroadcasts, createMockBroadcast } from "@/lib/mock-data/admin-broadcasts-mock-store";

export async function GET(request: NextRequest) {
  return handleRequest(request, "/api/admin-broadcasts", {
    mockFactory: () => ({ data: listMockBroadcasts() }),
  });
}

export async function POST(request: NextRequest) {
  return handleRequest(request, "/api/admin-broadcasts", {
    method: "POST",
    mockFactoryWithBody: (raw) => ({
      data: createMockBroadcast(raw as Parameters<typeof createMockBroadcast>[0]),
    }),
  });
}
