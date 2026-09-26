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
    const body = await request.json();
    return NextResponse.json({
      id,
      status: body.status ?? "In Progress",
      assignee: body.assignee ?? null,
      updatedAt: new Date().toISOString(),
    });
  }

  return handleRequest(request, `/api/tickets/${id}`, { method: "PUT" });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const isMock = process.env.NEXT_PUBLIC_MOCK_ENABLED === "true";

  if (isMock) {
    const fs = require("fs");
    const path = require("path");
    const mockFile = path.join(process.cwd(), "app/lib/mock-data", `tickets-${id}.json`);
    if (fs.existsSync(mockFile)) {
      const data = JSON.parse(fs.readFileSync(mockFile, "utf-8"));
      return NextResponse.json(data, { status: 200 });
    }
    // Fallback: return a generic detail from support-tickets.json
    const ticketsFile = path.join(process.cwd(), "app/lib/mock-data", "support-tickets.json");
    if (fs.existsSync(ticketsFile)) {
      const all = JSON.parse(fs.readFileSync(ticketsFile, "utf-8"));
      const ticket = all.data?.find((t: any) => t.id === id);
      if (ticket) {
        return NextResponse.json({
          ...ticket,
          description: "No detailed description provided.",
          resolvedAt: null,
          attachments: [],
          messages: [],
        }, { status: 200 });
      }
    }
  }

  return handleRequest(request, `/api/tickets/${id}`);
}
