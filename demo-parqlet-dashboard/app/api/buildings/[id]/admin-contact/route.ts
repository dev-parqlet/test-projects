"use server";

import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";
import { handleRequest } from "@/lib/handle-request";

const MOCK_DATA_DIR = path.join(process.cwd(), "app/lib/mock-data");

// Mock fixtures are UUID-named. Reject anything else before using `id` in a
// filesystem path so a request like /api/buildings/..%2Fetc%2Fpasswd/admin-contact
// can't be used to read or write arbitrary files inside MOCK_DATA_DIR.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/**
 * POST /api/buildings/:id/admin-contact
 *
 * Update the HOA admin contact's name/email on a building and, optionally,
 * re-send the platform invite (Save & Invite in the Building Detail UI).
 * The backend endpoint is registered at
 * parqlet-backend/src/routes/buildings.ts:392 and requires super-admin.
 *
 * Body: { name?: string; email?: string; invite?: boolean }
 * Returns: { hoaContact: string; hoaEmail: string }
 *
 * Mock mode: locate the per-building fixture at `buildings-{id}.json` (the
 * same files the buildings-list endpoint serves), mutate `hoaContact`,
 * `hoaEmail`, and (if invite=true) regenerate `enrollmentToken`. Persist
 * the file so subsequent GETs reflect the new contact.
 *
 * Proxy mode delegates to the shared handler, which forwards the raw body
 * to the backend and preserves the upstream status + content-type.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isUuid(id)) {
    // Bad id: bail before any file touching. Same `{ error: { message } }`
    // envelope as the rest of the mock layer's 4xx responses.
    return new Response(
      JSON.stringify({ error: { message: `Invalid building id: ${id}` } }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  return handleRequest(request, `/api/buildings/${id}/admin-contact`, {
    mockFactoryWithBody: (raw) => {
      const body = (raw ?? {}) as { name?: unknown; email?: unknown; invite?: unknown };
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const email = typeof body.email === "string" ? body.email.trim() : "";
      const invite = body.invite === true;

      // The backend requires a contact name when invite=true. Mirror the
      // page-side validation so mock + proxy return the same 400 envelope.
      if (invite && !name) {
        return { message: "Contact name is required to send an invite" };
      }
      if (!email) {
        return { message: "Email is required" };
      }

      const filePath = path.join(MOCK_DATA_DIR, `buildings-${id}.json`);
      if (!fs.existsSync(filePath)) {
        // Mock fixture absent — treat as 404 so the response matches the
        // backend's not-found contract. Tag with a code so mockStatus can
        // route to the right status without coupling to the message text.
        return { message: `Building ${id} not found`, __notFound: true };
      }

      const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Record<string, unknown>;
      if (name) data.hoaContact = name;
      if (email) data.hoaEmail = email;
      if (invite) {
        // Regenerate the enrollment token so the freshly-invited contact can
        // use the new link. The real backend stores this against the
        // building's admin-contact enrollment row.
        data.enrollmentToken = randomUUID();
      }
      data.updatedAt = new Date().toISOString();

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

      return {
        hoaContact: data.hoaContact as string,
        hoaEmail: data.hoaEmail as string,
      };
    },
    mockStatus: (raw) => {
      const body = (raw ?? {}) as { name?: unknown; email?: unknown; invite?: unknown };
      const invite = body.invite === true;
      const hasName = typeof body.name === "string" && body.name.trim().length > 0;
      const hasEmail = typeof body.email === "string" && body.email.trim().length > 0;
      // The factory signals a not-found fixture with `__notFound: true` on
      // the body it returns. mockStatus can't see the factory's return
      // value directly, so we re-check whether the mock fixture exists on
      // disk for this id.
      const fixturePath = path.join(MOCK_DATA_DIR, `buildings-${id}.json`);
      if (!fs.existsSync(fixturePath)) return 404;
      // Validation failures → 400.
      if (!hasEmail) return 400;
      if (invite && !hasName) return 400;
      return undefined;
    },
  });
}
