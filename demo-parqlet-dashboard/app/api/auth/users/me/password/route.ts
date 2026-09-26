"use server";

import { NextRequest } from "next/server";
import { handleRequest } from "@/lib/handle-request";

/**
 * PUT /api/auth/users/me/password — change own password.
 *
 * Backend contract: parqlet-backend/src/routes/auth.ts
 * (`PUT /users/me/password`). It verifies the current password and
 * rejects a new one under 8 characters, so no validation is duplicated
 * here beyond what the form already does.
 *
 * Missing for the same reason as ../route.ts — see the note there.
 */
export async function PUT(request: NextRequest) {
  return handleRequest(request, "/api/auth/users/me/password", {
    method: "PUT",
    mockFactory: () => ({ success: true }),
  });
}
