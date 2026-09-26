"use server";

import { NextRequest } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { handleRequest } from "@/lib/handle-request";

const MOCK_DATA_DIR = path.join(process.cwd(), "app/lib/mock-data");

/**
 * POST /api/residents/:id/exclude
 *
 * Revoke a resident's Parqlet app access. Sets `excludedAt` + `excludedBy`
 * on the residents row and kills any active refresh tokens. Idempotent.
 *
 * Backend contract: parqlet-backend/src/routes/residents.ts (drizzle/0042).
 * Gated by Actions.RevokeResident (admin, lead_concierge, concierge, super_admin).
 * Non-super-admin callers must own the resident's building.
 *
 * Mock mode: flip `excludedAt` / `excludedBy` in app/lib/mock-data/residents.json
 * so designers can see the Revoked badge state and exercise the un-revoke flow.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  return handleRequest(request, `/api/residents/${id}/exclude`, {
    method: "POST",
    mockFactoryWithBody: (raw) => {
      const body = (raw ?? {}) as { excludedBy?: string };
      const excludedBy = typeof body.excludedBy === "string" ? body.excludedBy : "mock-super-admin";

      const filePath = path.join(MOCK_DATA_DIR, "residents.json");
      if (!fs.existsSync(filePath)) {
        return { message: "Residents data not found", code: "not_found" };
      }

      const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as {
        data: Array<Record<string, unknown>>;
      };

      const idx = data.data.findIndex((r) => r.id === id);
      if (idx === -1) {
        return { message: "Resident not found", code: "not_found" };
      }

      const now = new Date().toISOString();
      const row = data.data[idx];
      row.excludedAt = now;
      row.excludedBy = excludedBy;
      row.updatedAt = now;

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

      return { id: row.id as string, excludedAt: now, excludedBy };
    },
    mockStatus: (raw) => {
      // Re-implement the lookup so we can return 404 without re-reading the
      // file in two places (one inside the factory, one in mockStatus).
      // The factory still runs to keep the side-effects simple; mockStatus
      // only chooses the HTTP status.
      const body = (raw ?? {}) as Record<string, unknown>;
      const filePath = path.join(MOCK_DATA_DIR, "residents.json");
      if (!fs.existsSync(filePath)) return 404;
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as { data: Array<Record<string, unknown>> };
      const found = data.data.some((r) => r.id === id);
      if (!found) return 404;
      // Touch body so the unused-parameter linter is happy.
      void body;
      return undefined;
    },
  });
}

/**
 * DELETE /api/residents/:id/exclude
 *
 * Reverse a prior exclusion. Clears `excludedAt` / `excludedBy`; the row
 * reappears in the dashboard, login resumes, and the next BMS feed match
 * re-links via bms_resident_id / email dedup. Credits, bookings, and
 * identity are preserved (exclusion is non-destructive).
 *
 * Mock mode: clear the two fields in app/lib/mock-data/residents.json.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  return handleRequest(request, `/api/residents/${id}/exclude`, {
    method: "DELETE",
    mockFactory: () => {
      const filePath = path.join(MOCK_DATA_DIR, "residents.json");
      if (!fs.existsSync(filePath)) {
        return { message: "Residents data not found", code: "not_found" };
      }

      const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as {
        data: Array<Record<string, unknown>>;
      };

      const idx = data.data.findIndex((r) => r.id === id);
      if (idx === -1) {
        return { message: "Resident not found", code: "not_found" };
      }

      const row = data.data[idx];
      row.excludedAt = null;
      row.excludedBy = null;
      row.updatedAt = new Date().toISOString();

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

      return { id: row.id as string, excludedAt: null, excludedBy: null };
    },
    mockStatus: () => {
      const filePath = path.join(MOCK_DATA_DIR, "residents.json");
      if (!fs.existsSync(filePath)) return 404;
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as { data: Array<Record<string, unknown>> };
      const found = data.data.some((r) => r.id === id);
      return found ? undefined : 404;
    },
  });
}
