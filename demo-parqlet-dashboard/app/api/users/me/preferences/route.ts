import { NextRequest, NextResponse } from "next/server";
import { handleRequest } from "../../../../lib/handle-request";
import * as fs from "fs";
import * as path from "path";

const MOCK_DATA_DIR = path.join(process.cwd(), "app/lib/mock-data");

export async function GET(request: NextRequest) {
  return handleRequest(request, "/api/users/me/preferences");
}

export async function PUT(request: NextRequest) {
  const isMock = process.env.NEXT_PUBLIC_MOCK_ENABLED === "true";

  if (isMock) {
    return handleRequest(request, "/api/users/me/preferences", {
      mockFactoryWithBody: (body: unknown) => {
        const fileName = "users-me-preferences.json";
        const filePath = path.join(MOCK_DATA_DIR, fileName);
        let existing: Record<string, unknown> = {};
        if (fs.existsSync(filePath)) {
          existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        }
        const merged = { ...existing, ...(body as Record<string, unknown>) };
        fs.writeFileSync(filePath, JSON.stringify(merged, null, 2));
        return merged;
      },
    });
  }

  return handleRequest(request, "/api/users/me/preferences");
}