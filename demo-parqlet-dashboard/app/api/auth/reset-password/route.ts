"use server";

import { NextRequest } from "next/server";
import { handleRequest } from "@/lib/handle-request";

export async function POST(request: NextRequest) {
  return handleRequest(request, "/api/auth/reset-password", { method: "POST" });
}
