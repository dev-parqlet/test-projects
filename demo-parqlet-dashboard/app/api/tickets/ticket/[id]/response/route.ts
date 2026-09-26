"use server";

import { NextRequest } from "next/server";
import { handleRequest } from "@/lib/handle-request";

/**
 * Backs `addTicketMessage()` (app/lib/api/super-admin.ts) → real backend
 * `POST /api/tickets/ticket/:id/response`. This route file didn't exist
 * before (only the unrelated `/api/tickets/[id]/messages` path did, which
 * nothing in the app actually calls) — the dashboard's reply composer on
 * `/tickets/[id]` has always 404'd on send, in both mock and proxy mode.
 *
 * Two real outcomes on the live backend, both need to reach the client
 * as-is (status + body), not reshaped:
 *   - isInternal: true  → 201 with the inserted response row
 *   - isInternal: false → 201 `{ ok: true, sentViaGmail: true, to }` on
 *     success, or a 400/502/503 `{ error: string }` (no submitter email
 *     on file / Gmail send failed / Gmail not configured on this server)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  return handleRequest(request, `/api/tickets/ticket/${id}/response`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    mockFactoryWithBody: (body) => {
      const { body: text, isInternal } = body as { body: string; isInternal?: boolean };
      if (isInternal) {
        return {
          id: `msg-${Date.now().toString(36)}`,
          ticketId: id,
          authorId: "mock-admin",
          content: text,
          createdAt: new Date().toISOString(),
          isInternal: true,
        };
      }
      // Mock mode has no real Gmail to send through — mirror the shape
      // of a successful send so the UI's happy path is exercisable
      // without live credentials.
      return { ok: true, sentViaGmail: true, to: "mock-submitter@example.com" };
    },
  });
}
