"use server";

import { NextRequest, NextResponse } from "next/server";
import { handleRequest } from "@/lib/handle-request";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const isMock = process.env.NEXT_PUBLIC_MOCK_ENABLED === "true";

  if (isMock) {
    return NextResponse.json({
      id,
      acknowledged: true,
      acknowledgedAt: new Date().toISOString(),
    });
  }

  return handleRequest(request, `/api/alerts/${id}/acknowledge`, { method: "PUT" });
}
