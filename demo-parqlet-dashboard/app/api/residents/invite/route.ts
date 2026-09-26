"use server";

import { NextRequest } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { handleRequest } from "@/lib/handle-request";

const MOCK_DATA_DIR = path.join(process.cwd(), "app/lib/mock-data");

/**
 * POST /api/residents/invite
 *
 * Sends a Parqlet app invite to a single resident by (buildingId, email).
 * Body: { buildingId: string; email: string } — matches the backend contract
 * in parqlet-backend/src/routes/residents.ts.
 *
 * Mock mode: look up the resident by (buildingId, email) in residents.json,
 * flip inviteState to "sent", record inviteSentDate, and persist the JSON
 * file. If no row matches, the backend still emails a bare address but
 * there is nothing to update locally — skip the file write.
 *
 * Proxy mode is delegated to the shared handler, which forwards the raw
 * body to the backend and preserves the upstream status + content-type.
 */
export async function POST(request: NextRequest) {
  return handleRequest(request, "/api/residents/invite", {
    mockFactoryWithBody: (raw) => {
      const body = (raw ?? {}) as { buildingId?: unknown; email?: unknown };
      const buildingId = typeof body.buildingId === "string" ? body.buildingId : "";
      const email = typeof body.email === "string" ? body.email : "";
      if (!buildingId || !email) {
        return { message: "buildingId and email are required" };
      }

      const filePath = path.join(MOCK_DATA_DIR, "residents.json");
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as {
        data: Array<Record<string, unknown>>;
      };

      const now = new Date().toISOString();
      let matched = false;
      for (const r of data.data) {
        if (r.buildingId === buildingId && r.email === email) {
          r.inviteState = "sent";
          r.inviteSentDate = now;
          r.updatedAt = now;
          matched = true;
          break;
        }
      }

      // Only persist when a row actually changed; if no row matched, the
      // backend still emails the bare address but there's nothing to update
      // locally.
      if (matched) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      }

      return { success: true, sent: true };
    },
    mockStatus: (raw) => {
      const body = (raw ?? {}) as { buildingId?: unknown; email?: unknown };
      const hasBoth =
        typeof body.buildingId === "string" &&
        body.buildingId.length > 0 &&
        typeof body.email === "string" &&
        body.email.length > 0;
      return hasBoth ? undefined : 400;
    },
  });
}
