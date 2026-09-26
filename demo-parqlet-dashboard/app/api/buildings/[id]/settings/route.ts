"use server";

/**
 * GET /api/buildings/:id/settings   — read building settings
 * PUT /api/buildings/:id/settings   — update building settings
 *
 * Dispatches via the shared handleRequest (coding guideline: all API routes
 * must use it). In mock mode, reads/writes the matching building in
 * `app/lib/mock-data/buildings.json`. In production, proxies to
 * `${BACKEND_API_URL ?? NEXT_PUBLIC_API_URL}/api/buildings/:id/settings`
 * with the request body and cookies preserved.
 */

import { handleRequest } from "@/lib/handle-request";
import * as fs from "fs";
import * as path from "path";
import type { NextRequest } from "next/server";
import type { VerificationMethod } from "@/lib/api/buildings";

const MOCK_DATA_DIR = path.join(process.cwd(), "app/lib/mock-data");

/** Extract the `:id` segment from `/api/buildings/:id/settings`. */
function buildingIdFromRequest(request: NextRequest): string | null {
  const seg = request.nextUrl.pathname.split("/");
  // ["", "api", "buildings", "<id>", "settings"]
  return seg[3] ?? null;
}

function readBuilding(id: string): Record<string, unknown> | null {
  const filePath = path.join(MOCK_DATA_DIR, "buildings.json");
  if (!fs.existsSync(filePath)) return null;
  const all: { data: Record<string, unknown>[] } = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return all.data.find((b) => b.id === id) ?? null;
}

function writeBuilding(id: string, next: Record<string, unknown>): boolean {
  const filePath = path.join(MOCK_DATA_DIR, "buildings.json");
  if (!fs.existsSync(filePath)) return false;
  const all: { data: Record<string, unknown>[] } = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const idx = all.data.findIndex((b) => b.id === id);
  if (idx === -1) return false;
  all.data[idx] = { ...all.data[idx], ...next };
  fs.writeFileSync(filePath, JSON.stringify(all, null, 2));
  return true;
}

/** Per-building price per credit (integer cents). Mirrors the backend's
 *  `buildingSettingsUpdateSchema` constraint (src/types/dto.ts, drizzle/0043)
 *  so the mock 400s the same shapes a malicious client could otherwise
 *  slip past the create/edit UI validation. The detail page reads
 *  `creditsPriceCents / 100` then `${price.toFixed(2)}`; a non-integer or
 *  non-finite value would render as "NaN" / "$NaN". */
const MIN_PRICE_CENTS = 1;
const MAX_PRICE_CENTS = 100_000_000;

/** Allowed setting keys. `creditsPriceCents` was added in drizzle/0043 to
 *  back the per-building price-per-credit override from the dashboard's
 *  PricePerCreditRow component. */
const ALLOWED_SETTINGS_FIELDS = new Set([
  "smsHelpMessage",
  "verificationMethod",
  "creditsPriceCents",
]);

/** Validate the body shape. Throws on any failure so handleRequest's
 *  try/catch returns 400 with `{ error: { message } }`. */
function validateSettingsUpdate(body: unknown): Record<string, unknown> {
  const updates = (body ?? {}) as Record<string, unknown>;
  for (const key of Object.keys(updates)) {
    if (!ALLOWED_SETTINGS_FIELDS.has(key)) {
      throw new Error(`Unknown setting field: ${key}`);
    }
  }
  if ("creditsPriceCents" in updates) {
    const cents = updates.creditsPriceCents;
    if (
      typeof cents !== "number" ||
      !Number.isInteger(cents) ||
      cents < MIN_PRICE_CENTS ||
      cents > MAX_PRICE_CENTS
    ) {
      throw new Error(
        `creditsPriceCents must be an integer between ${MIN_PRICE_CENTS} and ${MAX_PRICE_CENTS} (cents); got ${String(cents)}`
      );
    }
  }
  return updates;
}

/** Build the canonical settings response from a building row. */
function settingsFromBuilding(building: Record<string, unknown>) {
  return {
    smsHelpMessage: building.smsHelpMessage ?? null,
    verificationMethod: (building.verificationMethod as VerificationMethod | null) ?? null,
    // Per-building price per credit (integer cents, drizzle/0043). Default
    // 600 ($6.00) matches the DB column default the backend applies when
    // the field is absent.
    creditsPriceCents: (building.creditsPriceCents as number | null) ?? 600,
  };
}

export async function GET(request: NextRequest) {
  return handleRequest(request, extractBackendPath(request), {
    mockFactory: () => {
      const id = buildingIdFromRequest(request);
      if (!id) throw new Error("Building id missing");
      const building = readBuilding(id);
      if (!building) throw new Error("Building not found");
      return settingsFromBuilding(building);
    },
  });
}

export async function PUT(request: NextRequest) {
  return handleRequest(request, extractBackendPath(request), {
    method: "PUT",
    // All work (validate + write + return new state) happens in the
    // factory. handleRequest's try/catch turns thrown Errors into 400
    // responses with `{ error: { message } }`. Doing the write here
    // rather than in mockStatus also avoids the factory/status ordering
    // bug: handleRequest calls the factory FIRST, so a read in the
    // factory would see the pre-update state and a write in the status
    // would never be reflected in the success response.
    mockFactoryWithBody: (body) => {
      const updates = validateSettingsUpdate(body);
      const id = buildingIdFromRequest(request);
      if (!id) throw new Error("Building id missing");
      const existing = readBuilding(id);
      if (!existing) throw new Error("Building not found");
      // In-memory apply for the response (writeBuilding also persists,
      // but the in-memory merge is what the response is built from).
      const next = { ...existing, ...updates };
      writeBuilding(id, updates);
      return settingsFromBuilding(next);
    },
  });
}

function extractBackendPath(request: NextRequest): string {
  // /api/buildings/:id/settings → /api/buildings/:id/settings
  return request.nextUrl.pathname;
}
