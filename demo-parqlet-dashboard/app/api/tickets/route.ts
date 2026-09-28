"use server";

import { NextRequest, NextResponse } from "next/server";
import { handleRequest } from "@/lib/handle-request";

export async function GET(request: NextRequest) {
  // The mock file is named for the page, not the endpoint, so the default
  // "infer the filename from the URL" rule looked for tickets.json, found
  // nothing, and fell through to the empty-list fallback - leaving Support
  // Tickets blank in the demo while support-tickets.json sat unread.
  return handleRequest(request, "/api/tickets", { mockFile: "support-tickets" });
}

export async function POST(request: NextRequest) {
  const isMock = process.env.NEXT_PUBLIC_MOCK_ENABLED === "true";

  if (isMock) {
    const body = await request.json();
    const now = new Date().toISOString();
    const shortId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    return NextResponse.json({
      id: `tkt-${shortId}`,
      buildingId: body.buildingId,
      buildingName: body.buildingName ?? "",
      subject: body.subject,
      description: body.description,
      status: "Open",
      priority: body.priority ?? "Medium",
      category: body.category ?? "General",
      openedDate: now,
      updatedAt: now,
      assignee: null,
      submitterName: body.submitterName,
      submitterEmail: body.submitterEmail,
      submitterRole: "HOA Admin",
      attachments: [],
      messages: [],
    });
  }

  return handleRequest(request, "/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}
