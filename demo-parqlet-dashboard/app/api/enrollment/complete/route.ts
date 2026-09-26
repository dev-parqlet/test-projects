"use server";

import { NextRequest } from "next/server";
import { handleRequest } from "@/lib/handle-request";

/**
 * POST /api/enrollment/complete
 *
 * Proxies to backend `POST /api/resident-onboarding/complete-account`. We use
 * `handleRequest` (instead of an inline fetch) so the upstream Set-Cookie
 * header reaches the browser. The backend now sets `parqlet_session` on the
 * success response — without forwarding it, the dashboard has no session
 * cookie and the very next request (e.g. /api/stripe/subscribe) gets a 401
 * or a stale-token 404.
 */
export async function POST(request: NextRequest) {
  return handleRequest(request, "/api/resident-onboarding/complete-account", {
    method: "POST",
  });
}