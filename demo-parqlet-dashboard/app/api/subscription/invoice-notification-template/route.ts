"use server";

import { NextRequest } from "next/server";
import { handleRequest } from "@/lib/handle-request";

export async function GET(request: NextRequest) {
  // The mock data is mirrored in `app/lib/mock-data/invoice-notification-templates.json`.
  // mockFile is pinned because the route now lives at /api/subscription/invoice-notification-template
  // but the mock JSON file on disk is still named "invoice-notification-templates.json".
  // Without the override, handleRequest's inferMockFile would look for
  // subscription-invoice-notification-template.json (which doesn't exist).
  return handleRequest(request, "/api/subscription/invoice-notification-template", {
    mockFile: "invoice-notification-templates",
  });
}
