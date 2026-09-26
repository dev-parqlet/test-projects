"use server";

import { NextRequest } from "next/server";
import { handleRequest } from "@/lib/handle-request";

export async function GET(request: NextRequest) {
  // mockFile pinned: route is now /api/subscription/invoices but the mock
  // file is still invoices.json. Without the override inferMockFile would
  // look for subscription-invoices.json.
  return handleRequest(request, "/api/subscription/invoices", { mockFile: "invoices" });
}
