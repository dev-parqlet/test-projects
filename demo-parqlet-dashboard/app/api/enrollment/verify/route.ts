"use server";

import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const MOCK_DATA_DIR = path.join(process.cwd(), "app/lib/mock-data");

export async function GET(request: NextRequest) {
  const isMock = process.env.NEXT_PUBLIC_MOCK_ENABLED === "true";

  if (isMock) {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: { message: "Token required" } }, { status: 400 });
    }

    const membersPath = path.join(MOCK_DATA_DIR, "members.json");
    if (!fs.existsSync(membersPath)) {
      return NextResponse.json({ error: { message: "No members data" } }, { status: 404 });
    }

    const membersData = JSON.parse(fs.readFileSync(membersPath, "utf-8"));
    const member = (membersData.data ?? []).find(
      (m: Record<string, unknown>) => m.enrollmentToken === token
    );

    if (!member) {
      return NextResponse.json({ error: { message: "Invalid or expired enrollment token" } }, { status: 404 });
    }

    // Guard: a Pending invite must always carry a buildingId. If a fixture ever
    // lands here without one, fail loudly instead of returning a payload that
    // will blow up the subscription page with "Missing building context…".
    if (member.status === "Pending" && !member.buildingId) {
      return NextResponse.json(
        { error: { message: "Enrollment token has no associated building. Restart onboarding from the invite link." } },
        { status: 422 },
      );
    }

    // Look up building name from member's buildingId or direct field
    const buildingsPath = path.join(MOCK_DATA_DIR, "buildings.json");
    const buildingsData = fs.existsSync(buildingsPath)
      ? JSON.parse(fs.readFileSync(buildingsPath, "utf-8"))
      : { data: [] };
    const firstBuildingId = (buildingsData.data ?? [])[0]?.id as string | undefined;

    let buildingName: string = (member.buildingName as string) || "Your Building";
    let buildingLogoUrl: string | undefined;
    if (!member.buildingName && fs.existsSync(buildingsPath)) {
      const building = (buildingsData.data ?? []).find(
        (b: Record<string, unknown>) => b.id === member.buildingId
      );
      if (building) {
        buildingName = building.name as string;
        buildingLogoUrl = building.logoUrl as string | undefined;
      }
    }

    // For non-Pending records (e.g. super-admins) a null buildingId is valid in
    // the schema; fall back to the first known building so downstream code that
    // expects a non-null buildingId keeps working during onboarding.
    const responseBuildingId = (member.buildingId as string | null) ?? firstBuildingId ?? null;

    // Determine whether this invitee is the first team member for their
    // building. The dashboard's setup-account page branches its UI on this:
    // true  -> full 4-step onboarding (no other Registered admin in this
    //          building yet, so the invitee must configure residents, team,
    //          and subscription themselves)
    // false -> simplified password-only form and redirect straight to
    //          /dashboard (the building is already configured by an existing
    //          Registered admin).
    //
    // Rule: count other Registered members in the same building. A
    // Registered enrollment subject itself returns false (they are already
    // past first-member onboarding). A non-pending member whose buildingId
    // was a null-building fallback also returns false — the fallback is a
    // super-admin compatibility hack, not an ownership signal.
    const isRegisteredSubject = member.status === "Registered";
    const usedFallbackBuilding =
      !member.buildingId && responseBuildingId === firstBuildingId;
    const registeredPeers = (membersData.data ?? []).filter(
      (m: Record<string, unknown>) =>
        m.id !== member.id &&
        m.buildingId === responseBuildingId &&
        m.status === "Registered",
    ).length;
    const isFirstTeamMember =
      !isRegisteredSubject && !usedFallbackBuilding && registeredPeers === 0;

    return NextResponse.json({
      email: member.email,
      name: member.name,
      role: member.role,
      buildingName,
      buildingLogoUrl,
      buildingId: responseBuildingId,
      isFirstTeamMember,
    });
  }

  // Proxy to backend
  // The backend is expected to return `isFirstTeamMember` in the verify
  // response (parqlet-backend's GET /api/resident-onboarding/verify). We
  // forward whatever the backend sends unchanged; older backends may omit
  // the field, in which case the dashboard's `useEnrollment` hook defaults
  // it to `true` (full onboarding) to preserve previous behavior.
  const API_URL = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://api.parqlet.com";
  const token = request.nextUrl.searchParams.get("token");
  try {
    const res = await fetch(`${API_URL}/api/resident-onboarding/verify?token=${encodeURIComponent(token ?? "")}`);
    const data = await res.json();
    // Defensive: if the upstream verify succeeded but didn't return a
    // buildingId, return a clean 502 instead of forwarding a payload that the
    // subscription page will reject with "Missing building context…".
    if (
      res.ok &&
      (data == null ||
        typeof data !== "object" ||
        !("buildingId" in data) ||
        !(data as { buildingId?: unknown }).buildingId)
    ) {
      console.error("[enrollment/verify] upstream missing buildingId:", {
        token,
        sample: data,
      });
      return NextResponse.json(
        { error: { message: "Upstream enrollment verify returned no building context" } },
        { status: 502 },
      );
    }
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: { message: "Failed to verify token" } }, { status: 502 });
  }
}
