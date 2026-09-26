import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/billing/checkout-session/[sessionId]
 *
 * Verifies a Stripe Checkout session by asking the backend (which holds the
 * Stripe secret key) to look it up. Returns a normalised shape so the
 * frontend can render the success view safely:
 *
 *   {
 *     paid:     boolean,   // session.status === "complete" AND payment_status === "paid"
 *     status:   string,    // raw Stripe status ("complete", "open", "expired", ...)
 *     email?:   string,    // customer_email from the session
 *   }
 *
 * Why this exists: the frontend used to render the success view based purely
 * on `?session_id=…` being present in the URL. Anyone could pass any value
 * and see "your subscription is active". Now the session ID is round-tripped
 * to the backend, which validates that the caller is authorised to see it
 * and that payment actually settled, before the dashboard trusts it.
 *
 * Proxies to api.parqlet.com/api/billing/checkout-session/{sessionId} in
 * live mode. Mock mode returns `{ paid: true }` so designers can walk the
 * post-payment UI without hitting Stripe.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;

  // Defensive: don't let a 30k-character garbage ID reach the backend.
  if (!sessionId || sessionId.length > 200) {
    return NextResponse.json(
      { error: { message: "Invalid sessionId" } },
      { status: 400 },
    );
  }

  const isMock = process.env.NEXT_PUBLIC_MOCK_ENABLED === "true";
  if (isMock) {
    return NextResponse.json({ paid: true, status: "complete" });
  }

  const API_URL = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://api.parqlet.com";
  const BACKEND_TIMEOUT_MS = 10_000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

  try {
    const res = await fetch(
      `${API_URL}/api/billing/checkout-session/${encodeURIComponent(sessionId)}`,
      {
        method: "GET",
        headers: {
          Cookie: _request.headers.get("cookie") ?? "",
        },
        credentials: "include",
        signal: controller.signal,
      },
    );

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
    // any other failure) so a slow body read can still trigger the 504 —
    // if we cleared the timer before res.text(), a backend that sends
    // headers quickly but stalls the body would hang this route past the
    // intended 10s limit.
    clearTimeout(timeoutId);
  }
}