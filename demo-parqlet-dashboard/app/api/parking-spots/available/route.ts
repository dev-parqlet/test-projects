"use server";

import { NextRequest, NextResponse } from "next/server";
import { handleRequest } from "@/lib/handle-request";
import * as fs from "fs";
import * as path from "path";

const MOCK_DATA_DIR = path.join(process.cwd(), "app/lib/mock-data");

export async function GET(request: NextRequest) {
  const isMock = process.env.NEXT_PUBLIC_MOCK_ENABLED === "true";
  if (!isMock) {
    return handleRequest(request, "/api/parking-spots/available");
  }

  const { searchParams } = request.nextUrl;
  const buildingId = searchParams.get("buildingId");
  const vehicleType = searchParams.get("vehicleType");
  const evCharge = searchParams.get("evCharge") === "true";
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!buildingId) {
    return NextResponse.json(
      { error: { message: "buildingId is required" } },
      { status: 400 }
    );
  }

  // Read parking spots
  const spotsPath = path.join(MOCK_DATA_DIR, "parking-spots.json");
  if (!fs.existsSync(spotsPath)) {
    return NextResponse.json({ data: [], total: 0 }, { status: 200 });
  }
  const allSpots: any[] = JSON.parse(fs.readFileSync(spotsPath, "utf-8"));

  // Read existing bookings to check for conflicts
  const bookingsPath = path.join(MOCK_DATA_DIR, "bookings.json");
  const existingBookings: { data: any[] } = fs.existsSync(bookingsPath)
    ? JSON.parse(fs.readFileSync(bookingsPath, "utf-8"))
    : { data: [] };

  // Vehicle size hierarchy (smallest → largest)
  const VEHICLE_SIZES: Record<string, number> = {
    motorcycle: 0,
    compact: 1,
    standard: 2,
    "large suv": 3,
  };

  const reqSize = VEHICLE_SIZES[vehicleType?.toLowerCase() ?? "standard"];
  if (reqSize === undefined) {
    return NextResponse.json(
      { error: { message: `Invalid vehicleType: ${vehicleType}` } },
      { status: 400 }
    );
  }

  // Helper: compare two date ranges for overlap
  function rangesOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
    // Dates are in format "8am, May 22" — parse to comparable
    function parseToMinutes(ds: string): number {
      const m = ds.match(/^(\d+)(am|pm),\s+([A-Za-z]{3})\s+(\d+)$/);
      if (!m) return 0;
      const hour = parseInt(m[1], 10) + (m[2] === "pm" && m[1] !== "12" ? 12 : 0);
      const day = parseInt(m[4], 10);
      const MONTHS: Record<string, number> = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
      };
      const month = MONTHS[m[3]] ?? 0;
      // Convert to total minutes from reference (May 1)
      return (month * 30 + day) * 1440 + hour * 60;
    }

    const s1m = parseToMinutes(s1);
    const e1m = parseToMinutes(e1);
    const s2m = parseToMinutes(s2);
    const e2m = parseToMinutes(e2);
    return s1m < e2m && s2m < e1m;
  }

  // Filter spots
  const available = allSpots.filter((spot) => {
    // Must be in the requested building
    if (spot.buildingId !== buildingId) return false;

    // Must not be a resident-assigned spot
    if (spot.isResidentSpot) return false;

    // Max size must accommodate the vehicle
    const spotMax = VEHICLE_SIZES[spot.maxSize];
    if (spotMax === undefined || reqSize > spotMax) return false;

    // EV charge filter
    if (evCharge && !spot.hasEvCharge) return false;

    // Check date range conflict with existing bookings
    if (startDate && endDate) {
      const conflicting = existingBookings.data.some(
        (b: any) =>
          b.spot === spot.label &&
          b.buildingId === buildingId &&
          rangesOverlap(startDate, endDate, b.bookingStart, b.bookingEnd)
      );
      if (conflicting) return false;
    }

    return true;
  });

  return NextResponse.json({ data: available, total: available.length }, { status: 200 });
}