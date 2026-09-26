"use server";

import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";

const MOCK_DATA_DIR = path.join(process.cwd(), "app/lib/mock-data");

export async function POST(request: NextRequest) {
  const isMock = process.env.NEXT_PUBLIC_MOCK_ENABLED === "true";

  if (isMock) {
    try {
      const body = await request.json();
      const { email, name, role, buildingId } = body;

      if (!email) {
        return NextResponse.json({ error: { message: "Email is required" } }, { status: 400 });
      }

      // Generate enrollment token
      const token = randomUUID();

      // Read existing members
      const membersPath = path.join(MOCK_DATA_DIR, "members.json");
      const membersData = JSON.parse(fs.readFileSync(membersPath, "utf-8"));

      // Add new member with enrollment token. We honor the incoming buildingId
      // (was previously hard-coded to null) so the invited admin is correctly
      // associated with their building — required for downstream steps that
      // look up the building from the enrollment token.
      const newMember = {
        id: `member-${Date.now()}`,
        buildingId: buildingId ?? null,
        userId: null,
        name: name || email.split("@")[0],
        email,
        role: role || "HOA Admin",
        status: "Pending",
        invited: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        lastActive: null,
        avatarUrl: null,
        enrollmentToken: token,
      };

      membersData.data.push(newMember);
      membersData.total += 1;
      fs.writeFileSync(membersPath, JSON.stringify(membersData, null, 2));

      return NextResponse.json({
        ...newMember,
        enrollmentUrl: `/onboarding?token=${token}`,
      });
    } catch (err) {
      return NextResponse.json({ error: { message: "Invalid request" } }, { status: 400 });
    }
  }

  // Proxy mode: forward to backend. Previously this branch returned
  // `{success:true}` regardless of the backend response, which dropped the
  // backend's enrollmentUrl and broke the super-admin "copy link" UI for any
  // environment running against the real API. Forward the full response so
  // the UI can read the link the backend produced.
  const API_URL = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://api.parqlet.com";
  try {
    const rawBody = await request.text();
    const res = await fetch(`${API_URL}/api/members/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: request.headers.get("cookie") ?? "",
      },
      body: rawBody,
      credentials: "include",
    });
    const text = await res.text();
    const response = new NextResponse(text, { status: res.status });
    response.headers.set("Content-Type", res.headers.get("content-type") ?? "application/json");
    return response;
  } catch {
    return NextResponse.json({ error: { message: "Failed to reach API" } }, { status: 502 });
  }
}
