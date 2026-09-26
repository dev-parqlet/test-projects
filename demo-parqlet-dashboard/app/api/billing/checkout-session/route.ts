import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

/**
 * POST /api/billing/checkout-session
 *
 * Asks the backend to create a Stripe Checkout session for the given
 * building, then returns the hosted-checkout URL so the client can redirect
 * the browser. We intentionally do NOT call Stripe from this Next.js route —
 * the secret key lives on api.parqlet.com and the backend already exposes
 * `/api/billing/checkout-session` for this exact purpose. Holding the
 * Stripe secret on the frontend would create a second source of truth and
 * another place to rotate keys.
 *
 * Body (forwarded verbatim to the backend):
 *   {
 *     buildingId:     string,
 *     customerEmail:  string,
 *     enrollmentToken?: string,
 *   }
 *
 * The backend picks the price and the success/cancel URLs (it knows its
 * own public domain) and returns `{ url, sessionId }`.
 *
 * In mock mode (NEXT_PUBLIC_MOCK_ENABLED=true) the backend isn't contacted.
 * The response is `{ mock: true, sessionId }` so the client can fall back
 * to the in-app CheckoutForm mock and complete the flow locally without
 * needing Stripe credentials or a backend roundtrip.
 */
export async function POST(request: NextRequest) {
  const isMock = process.env.NEXT_PUBLIC_MOCK_ENABLED === "true";

  // Parse + validate the body shape before we try to destructure it. A JSON
  // body of `null`, `[]`, `"foo"`, or `42` is valid JSON but would throw
  // (or read garbage fields) if we destructured it directly — and a 500
  // there would mask the real error from the caller.
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: { message: "Invalid JSON" } }, { status: 400 });
  }
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return NextResponse.json(
      { error: { message: "Request body must be a JSON object" } },
      { status: 400 },
    );
  }

  const body = raw as { buildingId?: string; customerEmail?: string; enrollmentToken?: string };
  const { buildingId, customerEmail } = body;
  if (!buildingId || !customerEmail) {
    return NextResponse.json(
      { error: { message: "buildingId and customerEmail are required" } },
      { status: 400 },
    );
  }

  // ─── Mock branch ─────────────────────────────────────────────────────────
  if (isMock) {
    return NextResponse.json({
      mock: true,
      sessionId: `mock_${randomUUID()}`,
      ...body,
    });
  }

  // ─── Proxy branch ────────────────────────────────────────────────────────
  // Forward the request to api.parqlet.com/api/billing/checkout-session so
  // the backend (which holds the Stripe secret) creates the session and
  // returns the hosted-checkout URL. We pass the auth cookie through so the
  // backend can identify the caller.
  //
  // We bound the proxy fetch with AbortController so a stalled backend can't
  // keep this route open indefinitely and tie up request capacity — return
  // 504 Gateway Timeout instead of letting the platform kill the request.
  const API_URL = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://api.parqlet.com";
  const BACKEND_TIMEOUT_MS = 10_000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}/api/billing/checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: request.headers.get("cookie") ?? "",
      },
      body: JSON.stringify(body),
      credentials: "include",
      signal: controller.signal,
    });

    const text = await res.text();
    const response = new NextResponse(text, { status: res.status });
    const contentType = res.headers.get("content-type");
    if (contentType) response.headers.set("Content-Type", contentType);
    return response;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json(
        { error: { message: "Billing service timed out" } },
        { status: 504 },
      );
    }
    return NextResponse.json(
      { error: { message: "Failed to reach billing service" } },
      { status: 502 },
    );
  } finally {
    // Cancel the abort timer on every exit path (success, AbortError, or
    // any other failure) so a slow body read can still trigger the 504.
    // Clearing before res.text() would let a backend that sends headers
    // quickly but stalls the body hang this route past the intended limit.
    clearTimeout(timeoutId);
  }
}