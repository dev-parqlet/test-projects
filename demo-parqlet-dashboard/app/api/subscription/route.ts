"use server";

import { NextRequest } from "next/server";
import { handleRequest } from "@/lib/handle-request";

export async function GET(request: NextRequest) {
  // mockFile is pinned because the route now lives at /api/subscription but
  // the mock JSON file on disk is still named "subscriptions.json". Without
  // the override, handleRequest's inferMockFile would look for
  // subscription.json (which doesn't exist).
  return handleRequest(request, "/api/subscription", { mockFile: "subscriptions" });
}
