"use server";

import { NextRequest } from "next/server";
import { handleRequest } from "@/lib/handle-request";

/**
 * PUT /api/auth/users/me — update own name and phone.
 *
 * Backend contract: parqlet-backend/src/routes/auth.ts (`PUT /users/me`
 * under the /api/auth mount). Session-cookie authenticated, so it must
 * go through `handleRequest` like every other proxied route.
 *
 * This file did not exist until 2026-09-20, which is why saving the
 * profile returned "API error 404" on both dashboards: the client calls
 * NEXT_PUBLIC_API_URL + /api/auth/users/me, and that variable is the
 * dashboard's OWN origin in every environment (deploy-dev.yml,
 * deploy-prod.yml) — so the request hit Next.js, not the backend, and
 * Next had no handler at this path. The backend route was there all
 * along.
 */
export async function PUT(request: NextRequest) {
  return handleRequest(request, "/api/auth/users/me", {
    method: "PUT",
    // Mock mode has no user store to write to — echo the submitted name
    // back so the form's success path can still be exercised locally.
    mockFactoryWithBody: (raw) => {
      const body = (raw ?? {}) as { name?: string; phone?: string | null };
      return {
        id: "mock-user",
        name: body.name ?? "",
        email: "mock@parqlet.com",
        phone: body.phone ?? null,
      };
    },
  });
}
