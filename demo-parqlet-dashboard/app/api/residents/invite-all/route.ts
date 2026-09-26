"use server";

import { NextRequest } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { handleRequest } from "@/lib/handle-request";

const MOCK_DATA_DIR = path.join(process.cwd(), "app/lib/mock-data");

/**
 * POST /api/residents/invite-all
 *
 * Sends Parqlet app invites to every not-yet-registered resident in a
 * single building. Body: { buildingId: string } — matches the backend
 * contract in parqlet-backend/src/routes/residents.ts (which applies
 * renter-first targeting per unit before sending).
 *
 * Mock mode: scan residents.json for everyone with status
 * "Hasn't Registered" in the requested building, flip inviteState to
 * "sent", record inviteSentDate, and persist the JSON file. Returns
 * { success: true, sent: number, failed: 0 } mirroring the backend.
 *
 * Proxy mode is delegated to the shared handler, which forwards the raw
 * body to the backend and preserves the upstream status + content-type.
 */
export async function POST(request: NextRequest) {
  return handleRequest(request, "/api/residents/invite-all", {
    mockFactoryWithBody: (raw) => {
      const body = (raw ?? {}) as { buildingId?: unknown };
      const buildingId = typeof body.buildingId === "string" ? body.buildingId : "";
      if (!buildingId) {
        return { message: "buildingId is required" };
      }

      const filePath = path.join(MOCK_DATA_DIR, "residents.json");
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as {
        data: Array<Record<string, unknown>>;
      };

      const now = new Date().toISOString();
      let sent = 0;
      for (const r of data.data) {
        if (r.buildingId !== buildingId) continue;
        if (r.status !== "Hasn't Registered") continue;
        r.inviteState = "sent";
        r.inviteSentDate = now;
        r.updatedAt = now;
        sent++;
      }

      if (sent > 0) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      }

      return { success: true, sent, failed: 0 };
    },
    mockStatus: (raw) => {
      const body = (raw ?? {}) as { buildingId?: unknown };
      const hasBuildingId =
        typeof body.buildingId === "string" && body.buildingId.length > 0;
      return hasBuildingId ? undefined : 400;
    },
  });
}
