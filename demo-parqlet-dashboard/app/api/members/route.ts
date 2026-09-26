"use server";

import { NextRequest } from "next/server";
import { handleRequest } from "@/lib/handle-request";

export async function GET(request: NextRequest) {
  return handleRequest(request, "/api/members");
}

export async function POST(request: NextRequest) {
  return handleRequest(request, "/api/members", { method: "POST" });
}
