"use server";

import { NextRequest, NextResponse } from "next/server";
import { handleRequest } from "@/lib/handle-request";

/**
 * Admin notifications for the demo.
 *
 * Generated from the clock rather than read from a JSON file, for the same
 * reason the bookings and revenue figures are: a demo that shows "4 months
 * ago" against every row looks abandoned, and a static file guarantees
 * that the day it is written is the last day it looks right.
 *
 * Only the categories whose `web` toggle is on in
 * mock-data/users-me-preferences.json reach the feed - useNotificationFeed
 * filters on exactly that. Adding a category here without the matching
 * toggle there produces a row nobody ever sees.
 */

const MERIDIAN = "e6565d1b-1f25-4c51-bfa6-7db4932702cd";
const OAKLINE = "80f9ac2e-b884-4634-ac02-0682a9a12662";

type Seed = { hoursAgo: number; category: string; message: string; read: boolean };

const COMMON: Seed[] = [
  { hoursAgo: 2, category: "book-new", message: "Alicia Moreno booked spot 14 for a guest tomorrow", read: false },
  { hoursAgo: 6, category: "book-new", message: "Tomas Vieira booked spot 8 for this evening", read: false },
  { hoursAgo: 20, category: "book-cancel", message: "Renee Okafor cancelled a booking for Friday", read: true },
  { hoursAgo: 27, category: "res-invite", message: "6 residents accepted their invitation", read: true },
  { hoursAgo: 49, category: "ticket-reply", message: "Support replied to your ticket about the gate sensor", read: true },
  { hoursAgo: 73, category: "book-issue", message: "A guest overstayed in spot 22 by 35 minutes", read: true },
  { hoursAgo: 96, category: "sync-error", message: "Resident sync skipped 2 rows with missing unit numbers", read: true },
];

const EXTRA: Record<string, Seed[]> = {
  [MERIDIAN]: [
    { hoursAgo: 11, category: "res-invite", message: "Unit 12A completed registration", read: false },
  ],
  [OAKLINE]: [
    { hoursAgo: 4, category: "book-new", message: "Spot 204 booked for 3 nights at $20 a day", read: false },
    { hoursAgo: 31, category: "book-new", message: "Level 1 sold out for Saturday", read: true },
  ],
};

function buildFor(buildingId: string) {
  const now = Date.now();
  const seeds = [...COMMON, ...(EXTRA[buildingId] ?? [])].sort((a, b) => a.hoursAgo - b.hoursAgo);
  return seeds.map((s, i) => {
    const at = new Date(now - s.hoursAgo * 3_600_000).toISOString();
    return {
      // Stable across a refresh: the feed tracks read state by id, and an
      // id derived from Date.now() would reset it on every poll.
      id: `demo-note-${buildingId.slice(0, 8)}-${i}`,
      buildingId,
      residentId: null,
      bookingId: null,
      kind: null,
      source: "demo",
      category: s.category,
      message: s.message,
      data: null,
      isRead: s.read,
      createdAt: at,
      updatedAt: at,
    };
  });
}

export async function GET(request: NextRequest) {
  const isMock = process.env.NEXT_PUBLIC_MOCK_ENABLED === "true";

  if (isMock) {
    // Scoped, because the real endpoint is. An unscoped list would put one
    // demo building's activity in the other one's feed.
    const buildingId = request.nextUrl.searchParams.get("buildingId");
    const data = buildingId ? buildFor(buildingId) : [];
    return NextResponse.json({ data, total: data.length, page: 1, pageSize: 20 });
  }

  return handleRequest(request, "/api/notifications");
}
