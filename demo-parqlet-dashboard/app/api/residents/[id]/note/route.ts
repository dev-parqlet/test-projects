"use server";

/**
 * PATCH /api/residents/:id/note
 *
 * Updates the freeform note field on a resident (HOA staff annotation).
 *
 * Backend contract: parqlet-backend/src/routes/residents.ts. Any
 * authenticated staff user may write a note; non-super-admins must own
 * the resident's building (403 otherwise, 404 for an unknown resident).
 *
 * Goes through `handleRequest` like every other route under
 * /api/residents. It used to hand-roll its own `fetch`, which meant it
 * ignored mock mode entirely: with NEXT_PUBLIC_MOCK_ENABLED=true the
 * whole dashboard serves mock residents, and this one route PATCHed the
 * real backend with a mock resident id — so saving a note failed while
 * every other action on the same table worked.
 */

import { NextRequest } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { handleRequest } from "@/lib/handle-request";

const MOCK_DATA_DIR = path.join(process.cwd(), "app/lib/mock-data");

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  return handleRequest(request, `/api/residents/${id}/note`, {
    method: "PATCH",
    // Mock mode: write the note into residents.json so the value survives
    // a refresh and the Notes column shows the saved state, same as the
    // revoke route does for excludedAt.
    mockFactoryWithBody: (raw) => {
      const body = (raw ?? {}) as { note?: string };
      const note = typeof body.note === "string" ? body.note : "";

      const filePath = path.join(MOCK_DATA_DIR, "residents.json");
      if (!fs.existsSync(filePath)) {
        return { message: "Residents data not found", code: "not_found" };
      }

      const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as {
        data: Array<Record<string, unknown>>;
      };
      const resident = data.data.find((r) => r.id === id);
      if (!resident) {
        return { message: "Resident not found", code: "not_found" };
      }

      resident.note = note;
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return { id, note };
    },
    mockStatus: () => {
      const filePath = path.join(MOCK_DATA_DIR, "residents.json");
      if (!fs.existsSync(filePath)) return 404;
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as {
        data: Array<Record<string, unknown>>;
      };
      return data.data.some((r) => r.id === id) ? 200 : 404;
    },
  });
}
