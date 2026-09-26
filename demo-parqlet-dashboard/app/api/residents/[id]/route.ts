"use server";

/**
 * PATCH /api/residents/:id
 *
 * Partial update of a resident record.
 * Currently used by the STOP keyword handler to set smsReceivalPermission = false.
 *
 * Body: { smsReceivalPermission?: boolean, ...anyOtherFields }
 */

import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const MOCK_DATA_DIR = path.join(process.cwd(), "app/lib/mock-data");

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const isMock = process.env.NEXT_PUBLIC_MOCK_ENABLED === "true";

  if (isMock) {
    const filePath = path.join(MOCK_DATA_DIR, "residents.json");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: { message: "Residents data not found" } }, { status: 404 });
    }

    let existing: { data: unknown[] } = { data: [] };
    try {
      existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch {
      return NextResponse.json({ error: { message: "Failed to parse residents data" } }, { status: 500 });
    }

    const idx = existing.data.findIndex(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (r: any) => (r as any).id === id
    );

    if (idx === -1) {
      return NextResponse.json({ error: { message: "Resident not found" } }, { status: 404 });
    }

    const updates = await request.json() as Record<string, unknown>;
    const updated = { ...(existing.data[idx] as Record<string, unknown>), ...updates };
    existing.data[idx] = updated;

    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));

    return NextResponse.json(updated, { status: 200 });
  }

  // Production: proxy to backend
  const API_URL = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://api.parqlet.com";
  const body = await request.text();

  const res = await fetch(`${API_URL}/api/residents/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: request.headers.get("cookie") ?? "",
    },
    credentials: "include",
    body,
  });

  const responseBody = await res.text();
  return new NextResponse(responseBody, { status: res.status });
}