"use server";

/**
 * PATCH /api/bookings/:id/note
 *
 * Replaces the booking note field with a single string.
 * Proxies to the backend.
 *
 * Body: { note: string }
 */

import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const API_URL = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://api.parqlet.com";
  const body = await request.text();

  const res = await fetch(`${API_URL}/api/bookings/${id}/note`, {
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