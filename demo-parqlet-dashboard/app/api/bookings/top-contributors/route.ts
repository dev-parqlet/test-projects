"use server";

import { NextRequest } from "next/server";
import { handleRequest } from "@/lib/handle-request";
import { buildMockTopContributors } from "@/lib/mock-top-contributors";

export async function GET(request: NextRequest) {
  return handleRequest(request, "/api/bookings/top-contributors", {
    mockFactory: () => {
      const data = buildMockTopContributors(request.nextUrl.searchParams.get("buildingId"));
      return { data, total: data.length, page: 1, pageSize: 20 };
    },
  });
}
