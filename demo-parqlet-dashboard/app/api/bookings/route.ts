"use server";

import { NextRequest } from "next/server";
import { handleRequest } from "@/lib/handle-request";
import { buildMockBookingsResponse } from "@/lib/mock-bookings-filter";

export async function GET(request: NextRequest) {
  return handleRequest(request, "/api/bookings", {
    mockFactory: () => buildMockBookingsResponse(request.nextUrl.searchParams),
  });
}
