"use server";

import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const isMock = process.env.NEXT_PUBLIC_MOCK_ENABLED === "true";

  if (isMock) {
    // Return building-specific credits
    return NextResponse.json([
      {
        buildingId: id,
        creditsInCirculation: id === "e6565d1b-1f25-4c51-bfa6-7db4932702cd" ? 12500 :
                              id === "60808600-ad82-4202-a2ca-3b24ae87ee5e" ? 8700 : 15200,
        creditsEarnedThisMonth: id === "e6565d1b-1f25-4c51-bfa6-7db4932702cd" ? 3200 :
                                id === "60808600-ad82-4202-a2ca-3b24ae87ee5e" ? 2100 : 4100,
        creditsSpentThisMonth: id === "e6565d1b-1f25-4c51-bfa6-7db4932702cd" ? 1800 :
                               id === "60808600-ad82-4202-a2ca-3b24ae87ee5e" ? 950 : 2200,
        residentsAtThreshold: id === "e6565d1b-1f25-4c51-bfa6-7db4932702cd" ? 12 :
                              id === "60808600-ad82-4202-a2ca-3b24ae87ee5e" ? 8 : 15,
      },
    ]);
  }

  const { handleRequest } = await import("@/lib/handle-request");
  return handleRequest(request, `/api/buildings/${id}/credits`);
}
