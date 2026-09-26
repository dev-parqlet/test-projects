"use server";

/**
 * PATCH /api/admin-broadcasts/:id — replace a campaign's message/dates/times
 * DELETE /api/admin-broadcasts/:id — cancel a campaign
 *
 * See app/api/admin-broadcasts/route.ts for the backend contract.
 */
import { NextRequest } from "next/server";
import { handleRequest } from "@/lib/handle-request";
import { listMockBroadcasts, updateMockBroadcast, deleteMockBroadcast } from "@/lib/mock-data/admin-broadcasts-mock-store";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handleRequest(request, `/api/admin-broadcasts/${id}`, {
    method: "PATCH",
    mockFactoryWithBody: (raw) => {
      const updated = updateMockBroadcast(id, raw as Parameters<typeof updateMockBroadcast>[1]);
      return updated ? { data: updated } : { message: "Broadcast campaign not found", code: "not_found" };
    },
    mockStatus: () => (listMockBroadcasts().some((c) => c.id === id) ? undefined : 404),
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handleRequest(request, `/api/admin-broadcasts/${id}`, {
    method: "DELETE",
    mockFactory: () => {
      const ok = deleteMockBroadcast(id);
      return ok ? { data: { ok: true } } : { message: "Broadcast campaign not found", code: "not_found" };
    },
  });
}
