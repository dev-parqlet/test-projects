"use server";

import { NextRequest } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { handleRequest } from "@/lib/handle-request";
import { compareNamesIgnoringLeadingSymbols } from "@/lib/sort-utils";

const MOCK_DATA_DIR = path.join(process.cwd(), "app/lib/mock-data");

interface MockResidentRow {
  id: string;
  buildingId: string;
  name: string;
  email: string;
  unit?: string;
  unitNumber?: string;
  residencyType?: string;
  status?: string;
  inviteState?: string;
  inviteSentDate?: string;
  [key: string]: unknown;
}

interface ListParams {
  buildingId: string;
  search: string;
  status: string | undefined;
  residencyType: string | undefined;
  sortBy: "name" | "unit" | undefined;
  sortDir: "asc" | "desc" | undefined;
  page: number;
  pageSize: number;
  // When true, revoked residents (excludedAt IS NOT NULL) are included in
  // the result set. Default false — the backend's exclusion filter is
  // opt-out only for super-admin callers. The super-admin residents page
  // uses this to surface previously-revoked rows so they can be restored.
  includeExcluded: boolean;
  // Narrows to exactly Active or Revoked — the "Access" filter dropdown.
  // Takes precedence over includeExcluded when set.
  access: "Active" | "Revoked" | undefined;
}

function parseListParams(request: NextRequest): ListParams {
  const sp = request.nextUrl.searchParams;
  const rawSortBy = sp.get("sortBy");
  const sortBy: "name" | "unit" | undefined =
    rawSortBy === "name" || rawSortBy === "unit" ? rawSortBy : undefined;
  const rawSortDir = sp.get("sortDir");
  const sortDir: "asc" | "desc" | undefined =
    rawSortDir === "asc" || rawSortDir === "desc" ? rawSortDir : undefined;

  const page = Math.max(1, Number(sp.get("page") ?? "1") || 1);
  const rawPageSize = Number(sp.get("pageSize") ?? "20") || 20;
  const pageSize = Math.max(1, Math.min(100, rawPageSize));

  return {
    buildingId: sp.get("buildingId") ?? "",
    search: sp.get("search") ?? "",
    status: sp.get("status") ?? undefined,
    residencyType: sp.get("residencyType") ?? undefined,
    sortBy,
    sortDir,
    page,
    pageSize,
    includeExcluded: sp.get("includeExcluded") === "true",
    access: sp.get("access") === "Active" || sp.get("access") === "Revoked" ? (sp.get("access") as "Active" | "Revoked") : undefined,
  };
}

// Mock-mode filter + paginate. Mirrors the backend contract in
// parqlet-backend/src/routes/residents.ts so the dashboard behaves identically
// in both modes. Search is case-insensitive substring across name / email /
// unit (mock data uses `unit`, not `unitNumber`).
function mockListResidents(params: ListParams): {
  data: MockResidentRow[];
  total: number;
  page: number;
  pageSize: number;
} {
  const filePath = path.join(MOCK_DATA_DIR, "residents.json");
  const fallback = { data: [] as MockResidentRow[], total: 0, page: params.page, pageSize: params.pageSize };
  if (!fs.existsSync(filePath)) return fallback;

  const file = JSON.parse(fs.readFileSync(filePath, "utf-8")) as { data: MockResidentRow[] };
  const allRows = file.data ?? [];

  const needle = params.search.trim().toLowerCase();
  let rows = allRows.filter((r) => {
    if (params.buildingId && r.buildingId !== params.buildingId) return false;
    if (params.status && r.status !== params.status) return false;
    if (params.residencyType && r.residencyType !== params.residencyType) return false;
    if (params.access === "Active" && r.excludedAt) return false;
    if (params.access === "Revoked" && !r.excludedAt) return false;
    // Mirror the backend's `isNull(residents.excludedAt)` filter unless
    // the caller explicitly opts in via includeExcluded=true (only when
    // `access` wasn't already used to decide this explicitly).
    if (!params.access && !params.includeExcluded && r.excludedAt) return false;
    if (needle) {
      const haystack = [r.name, r.email, r.unit ?? r.unitNumber ?? ""]
        .map((v) => String(v ?? "").toLowerCase());
      if (!haystack.some((s) => s.includes(needle))) return false;
    }
    return true;
  });

  if (params.sortBy) {
    const dir = params.sortDir === "desc" ? -1 : 1;
    const key = params.sortBy === "unit" ? "unit" : "name";
    rows = [...rows].sort((a, b) =>
      dir * compareNamesIgnoringLeadingSymbols(String(a[key] ?? ""), String(b[key] ?? ""))
    );
  }

  const total = rows.length;
  const start = (params.page - 1) * params.pageSize;
  const data = rows.slice(start, start + params.pageSize);

  return { data, total, page: params.page, pageSize: params.pageSize };
}

export async function GET(request: NextRequest) {
  const params = parseListParams(request);
  // `includeExcluded` is forwarded automatically by handleRequest's proxy
  // path (it copies request.nextUrl.searchParams into the upstream URL).
  // Mock mode reads the parsed value directly to skip the exclusion filter.
  return handleRequest(request, "/api/residents", {
    mockFactory: () => mockListResidents(params),
  });
}
