"use server";

import { NextRequest } from "next/server";
import { handleRequest } from "@/lib/handle-request";

/**
 * Backs `getTicketThread()` (app/lib/api/super-admin.ts) → real backend
 * `GET /api/tickets/ticket/:id/thread` — the live, uncached Gmail read
 * that's the ticket detail page's actual source of truth for the
 * public conversation (see gmail-client.ts / tickets.ts for why this
 * is never mirrored into Postgres).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  return handleRequest(request, `/api/tickets/ticket/${id}/thread`, {
    // Mock mode has no Gmail to read from — an empty, "not configured"
    // thread is the honest mock, not a fabricated conversation.
    mockFactory: () => ({ data: [], configured: false }),
  });
}
