"use server";

import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

/**
 * Backs `getTicketDetail()` (app/lib/api/super-admin.ts), which calls
 * `/api/tickets/ticket/{id}` — matching the real backend's own path
 * (`GET /api/tickets/ticket/:id`, api-backend/src/routes/tickets.ts).
 * This route file didn't exist at all before, so every ticket-detail
 * fetch 404'd at this layer, in both mock and proxy mode, before ever
 * reaching the backend.
 *
 * The real backend returns `{ ticket, responses }` (nested) — reshaped
 * here into the flat `TicketDetail` shape the frontend already expects
 * (`super-admin.ts`), so the client stays simple either way.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const isMock = process.env.NEXT_PUBLIC_MOCK_ENABLED === "true";

  if (isMock) {
    const mockFile = path.join(process.cwd(), "app/lib/mock-data", `tickets-${id}.json`);
    if (fs.existsSync(mockFile)) {
      const data = JSON.parse(fs.readFileSync(mockFile, "utf-8"));
      return NextResponse.json(data, { status: 200 });
    }
    const ticketsFile = path.join(process.cwd(), "app/lib/mock-data", "support-tickets.json");
    if (fs.existsSync(ticketsFile)) {
      const all = JSON.parse(fs.readFileSync(ticketsFile, "utf-8"));
      const ticket = all.data?.find((t: { id: string }) => t.id === id);
      if (ticket) {
        return NextResponse.json(
          {
            ...ticket,
            description: ticket.description ?? "No detailed description provided.",
            resolvedAt: null,
            attachments: [],
            messages: [],
          },
          { status: 200 },
        );
      }
    }
    return NextResponse.json({ error: { message: "Ticket not found" } }, { status: 404 });
  }

  const API_URL =
    process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://api.parqlet.com";
  const url = new URL(`/api/tickets/ticket/${id}`, API_URL);

  try {
    const res = await fetch(url.toString(), {
      headers: { Cookie: request.headers.get("cookie") ?? "" },
      credentials: "include",
    });
    const text = await res.text();
    if (!res.ok) {
      return new NextResponse(text, { status: res.status });
    }

    const parsed = JSON.parse(text) as {
      ticket: Record<string, unknown>;
      responses: Array<{
        id: string;
        content: string;
        createdAt: string;
        authorName?: string | null;
        isInternal: boolean;
      }>;
    };

    return NextResponse.json({
      ...parsed.ticket,
      resolvedAt: null,
      attachments: [],
      // Every row here is a dashboard-side note (see tickets.ts —
      // public replies are sent via Gmail and never inserted into
      // ticket_responses), so authorRole is always the internal staff
      // label; the public/external side of the conversation comes
      // entirely from the separate live GET .../thread call instead.
      messages: parsed.responses.map((r) => ({
        id: r.id,
        author: r.authorName ?? "Team member",
        authorRole: "Support team",
        body: r.content,
        timestamp: r.createdAt,
        isInternal: r.isInternal,
      })),
    });
  } catch {
    return NextResponse.json({ error: { message: "Failed to reach API" } }, { status: 502 });
  }
}
