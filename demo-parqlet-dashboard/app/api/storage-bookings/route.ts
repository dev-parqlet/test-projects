"use server";

import { NextRequest } from "next/server";
import { handleRequest } from "@/lib/handle-request";
import { buildMockStorageBookingsResponse } from "@/lib/mock-storage-bookings-filter";

export async function GET(request: NextRequest) {
  return handleRequest(request, "/api/storage-bookings", {
    mockFactory: () => buildMockStorageBookingsResponse(request.nextUrl.searchParams),
  });
}
