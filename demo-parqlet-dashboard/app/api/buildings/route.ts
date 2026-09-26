"use server";

import { NextRequest } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { handleRequest } from "@/lib/handle-request";
import { randomUUID } from "crypto";

// Hoisted mock-data cache so we don't hit the disk on every request.
const BUILDINGS_FILE = path.join(process.cwd(), "app/lib/mock-data/buildings.json");
type BuildingRecord = { name: string; hoaEmail: string };
const BUILDINGS_CACHE: { data: BuildingRecord[] } = JSON.parse(
  fs.readFileSync(BUILDINGS_FILE, "utf-8"),
);

/**
 * Narrow an arbitrary parsed-JSON body into a plain record so we can read
 * fields safely without sprinkling `any` everywhere. Returns `{}` for
 * non-objects (null, arrays, primitives).
 */
type BuildingInput = Record<string, unknown>;
function asBuildingInput(body: unknown): BuildingInput {
  return body && typeof body === "object" && !Array.isArray(body)
    ? (body as BuildingInput)
    : {};
}

/**
 * Returns a `{ code, message }` conflict descriptor if the requested building
 * collides with an existing one (duplicate admin email or building name),
 * otherwise null. Used by both the mock factory and `mockStatus` so the two
 * stay in lockstep.
 */
function findConflict(body: unknown):
  | { code: "CONFLICT"; message: string }
  | null {
  const input = asBuildingInput(body);
  const adminEmail = String(input.adminEmail ?? "").trim().toLowerCase();
  const name = String(input.name ?? "").trim().toLowerCase();

  if (
    adminEmail &&
    BUILDINGS_CACHE.data.some((b) => b.hoaEmail.toLowerCase() === adminEmail)
  ) {
    return {
      code: "CONFLICT",
      message: "This email is already in use. Try a different address.",
    };
  }
  if (
    name &&
    BUILDINGS_CACHE.data.some((b) => b.name.toLowerCase() === name)
  ) {
    return {
      code: "CONFLICT",
      message: "A building with this name already exists",
    };
  }
  return null;
}

export async function GET(request: NextRequest) {
  return handleRequest(request, "/api/buildings");
}

export async function POST(request: NextRequest) {
  return handleRequest(request, "/api/buildings", {
    method: "POST",
    mockFactoryWithBody: (body) => {
      const conflict = findConflict(body);
      if (conflict) return conflict;
      const input = asBuildingInput(body);
      // Per-building price per credit, in integer cents (drizzle/0043). Read
      // straight from `body` so the round-trip works even if the input
      // parser ever strips the field. Default 600 ($6.00) matches the DB
      // column default the backend applies when the field is absent.
      const rawCents = (body as { creditsPriceCents?: unknown } | null)?.creditsPriceCents;
      const creditsPriceCents =
        typeof rawCents === "number" && Number.isFinite(rawCents) ? rawCents : 600;
      return {
        id: randomUUID(),
        name: input.name,
        address: input.address,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        adminName: input.adminName,
        adminEmail: input.adminEmail,
        verificationMethod: input.verificationMethod,
        creditsPriceCents,
      };
    },
    mockStatus: (body) => (findConflict(body) ? 409 : 200),
  });
}