"use server";

import { NextRequest, NextResponse } from "next/server";
import { handleRequest } from "@/lib/handle-request";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const isMock = process.env.NEXT_PUBLIC_MOCK_ENABLED === "true";

  if (isMock) {
    const body = await request.json();
    const now = new Date().toISOString();
    return NextResponse.json({
      id: `msg-${Date.now().toString(36)}`,
      author: "HOA Admin",
      authorRole: "HOA Admin",
      body: body.body,
      timestamp: now,
      isInternal: body.isInternal ?? false,
    });
  }

  return handleRequest(request, `/api/tickets/${id}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}
