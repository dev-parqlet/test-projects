"use server";

import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const MOCK_DATA_DIR = path.join(process.cwd(), "app/lib/mock-data");

/**
 * The day every mock JSON file is written to be correct on.
 *
 * The demo is shown for months from a fixed corpus, and a fixed corpus has
 * a shelf life: this one was a production dump taken in May and by late
 * September every ticket, invoice and sync log on screen was four months
 * old. Nobody notices while editing the data; every prospect notices when
 * the newest support ticket predates the meeting by a season.
 *
 * So dates are not served as written. Everything is shifted forward by the
 * whole number of days between this epoch and today, which keeps the
 * corpus exactly as internally consistent as it was authored - an invoice
 * still lands a month before the next renewal - while the whole thing
 * stays anchored to now.
 *
 * EVERY mock file must be authored against this one date. Two anchors
 * cannot both survive a single shift.
 */
const DEMO_EPOCH = Date.UTC(2026, 8, 28); // 2026-09-28

/** Whole days from the epoch to today. Never negative. */
function demoDayShift(now = new Date()): number {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(0, Math.round((today - DEMO_EPOCH) / 86_400_000));
}

// A full ISO-8601 instant, or a bare calendar date. Anchored at both ends
// so it cannot match the digits inside a UUID, a phone number or an id.
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})(T[\d:.]+(?:Z|[+-]\d{2}:?\d{2})?)?$/;

function shiftIsoString(value: string, days: number): string {
  const m = ISO_DATE.exec(value);
  if (!m) return value;
  const [, y, mo, d, time] = m;
  const shifted = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d) + days));
  const yyyy = String(shifted.getUTCFullYear()).padStart(4, "0");
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(shifted.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}${time ?? ""}`;
}

/**
 * Walks a parsed mock payload and moves every date-looking string forward.
 * Whole strings only, so "2026-09-28" is rebased and
 * "Invoice #INV-0034 from 2026-09-28" is left alone - partial rewriting of
 * prose is how you end up with a sentence nobody can read.
 */
function rebaseDates<T>(value: T, days: number): T {
  if (days === 0) return value;
  if (typeof value === "string") return shiftIsoString(value, days) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => rebaseDates(v, days)) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = rebaseDates(v, days);
    }
    return out as unknown as T;
  }
  return value;
}

interface MockOptions {
  mockFactory?: () => unknown;
  mockFactoryWithBody?: (body: unknown) => unknown;
  mockFile?: string;
  method?: string;
  headers?: Record<string, string>;
/**
   * Request body to forward. Defaults to JSON-serialized request.text().
   * Pass `FormData`, `ArrayBuffer`, `Blob`, etc. for non-JSON upstreams
   * (e.g. multipart file uploads); also supply the matching Content-Type
   * via `headers` so it isn't overridden.
   */
  body?: BodyInit | null;
  /**
   * When set in mock mode, the helper invokes this with the parsed request
   * body. If it returns a non-200 status, the response is wrapped as
   * `{ error: <factoryResult> }` with that status instead of the default 200.
   * Lets route handlers simulate real backend error responses (e.g. 409).
   */
  mockStatus?: (body: unknown) => number | undefined;
}

export async function handleRequest(
  request: NextRequest,
  backendPath: string,
  options?: MockOptions,
): Promise<NextResponse> {
  const isMock = process.env.NEXT_PUBLIC_MOCK_ENABLED === "true";

  if (isMock) {
    return handleMock(request, options);
  }

  return handleProxy(request, backendPath, options);
}

async function handleMock(request: NextRequest, options?: MockOptions): Promise<NextResponse> {
  if (!options?.mockFactory && !options?.mockFactoryWithBody) {
    const fileName = options?.mockFile ?? inferMockFile(request.url);
    const filePath = path.join(MOCK_DATA_DIR, `${fileName}.json`);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      return NextResponse.json(rebaseDates(data, demoDayShift()), { status: 200 });
    }
  }

  if (options?.mockFactory) {
    const data = options.mockFactory();
    return NextResponse.json(data, { status: 200 });
  }

  if (options?.mockFactoryWithBody) {
    try {
      const body = await request.clone().json();
      const data = options.mockFactoryWithBody(body);
      const status = options.mockStatus?.(body);
      // Conflict-style factories return `{ code, message }`; wrap them in the
      // canonical `{ error: { ... } }` envelope so the frontend's
      // `extractErrorMessage` finds the message under `body.error.message`.
      if (status && status >= 400) {
        return NextResponse.json({ error: data }, { status });
      }
      return NextResponse.json(data, { status: 200 });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid request body";
      return NextResponse.json({ error: { message } }, { status: 400 });
    }
  }

  return NextResponse.json({ data: [], total: 0, page: 1, pageSize: 20 }, { status: 200 });
}

async function handleProxy(request: NextRequest, backendPath: string, options?: MockOptions): Promise<NextResponse> {
  // Upstream backend. Separate from NEXT_PUBLIC_API_URL (which is the origin the
  // browser calls, i.e. this Next.js server) so auth cookies stay same-origin:
  // browser ↔ localhost:3005, this route proxies server-to-server to the backend.
  const API_URL =
    process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://api.parqlet.com";
  const url = new URL(backendPath, API_URL);

  const srcParams = request.nextUrl.searchParams;
  srcParams.forEach((v, k) => url.searchParams.set(k, v));

  const method = options?.method ?? request.method;

  try {
    // Caller supplied a non-JSON body (e.g. multipart): forward it verbatim
    // along with whatever Content-Type they set. Otherwise fall back to the
    // JSON path so existing routes don't need to change.
    const callerSuppliedBody = options?.body != null;
    const headers: Record<string, string> = callerSuppliedBody
      ? { Cookie: request.headers.get("cookie") ?? "", ...(options?.headers ?? {}) }
      : {
          "Content-Type": "application/json",
          Cookie: request.headers.get("cookie") ?? "",
          ...(options?.headers ?? {}),
        };

    const res = await fetch(url.toString(), {
      method,
      headers,
      credentials: "include",
      body: options?.body ?? ((method !== "GET" && method !== "HEAD") ? await request.text() : undefined),
    });

    const body = await res.text();
    const response = new NextResponse(body, { status: res.status });
    // Forward every Set-Cookie individually — res.headers.get("set-cookie")
    // collapses multiple cookies into one comma-joined string that breaks them.
    const setCookies = res.headers.getSetCookie?.() ?? [];
    for (const cookie of setCookies) {
      response.headers.append("set-cookie", cookie);
    }
    // Preserve upstream Content-Type — many clients (React Query, etc.) parse
    // the body as JSON based on this header, and the default text/plain breaks
    // them silently.
    const contentType = res.headers.get("content-type");
    if (contentType) {
      response.headers.set("content-type", contentType);
    }
    return response;
  } catch {
    return NextResponse.json({ error: { message: "Failed to reach API" } }, { status: 502 });
  }
}

function inferMockFile(urlString: string): string {
  const u = new URL(urlString);
  const seg = u.pathname.replace(/^\/api\//, "").split("/");
  return seg.join("-");
}
