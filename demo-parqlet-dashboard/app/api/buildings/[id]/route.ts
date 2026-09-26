"use server";

import { NextRequest } from "next/server";
import { handleRequest } from "@/lib/handle-request";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handleRequest(request, `/api/buildings/${id}`);
}
