"use server";

import { NextRequest } from "next/server";
import { handleRequest } from "@/lib/handle-request";

export async function GET(request: NextRequest) {
  return handleRequest(request, "/api/support-tickets");
}
