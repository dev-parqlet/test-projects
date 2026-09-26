"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { getSubscription, getSubscriptionById } from "@/lib/api/subscriptions";

// Max retries for transient polling failures. Backoff is 500ms * (attempt+1).
// Terminal 4xx errors (other than 429) surface immediately without retrying.
const MAX_RETRIES = 3;

/**
 * Decide whether a thrown error is transient and worth retrying. We retry
 * on plain network failures and on 429 / 5xx because a momentary backend
 * hiccup should not put the user into the error view while the webhook is
 * still in flight.
 */
function isTransient(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const status = (err as { status?: number }).status;
  if (typeof status === "number") {
    if (status === 429) return true;
    if (status >= 500 && status < 600) return true;
    return false;
  }
  // Network / fetch failures have no HTTP status — apiClient surfaces these
  // as thrown Error objects with status=undefined.
  return true;
}

/**
 * Wrap a promise so it rejects if `deadlineMs` elapses before it settles.
 * `apiClient.get` does not accept an AbortSignal, so a hung request would
 * otherwise keep the spinner up past TIMEOUT_MS. We can't actually cancel
 * the in-flight fetch without backend signal support, but we CAN stop
 * waiting on it — the caller's `tick()` will then see the timeout, check
 * the elapsed time, and bail into the "Still processing…" view.
 */
function withDeadline<T>(p: Promise<T>, deadlineMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${deadlineMs}ms`));
    }, deadlineMs);
    p.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

/**
 * Step 4 success page. Polls the backend's subscription endpoint until the
 * row's status leaves `Incomplete` (webhook has fired) or 30s elapse.
 *
 * The browser lands here after Stripe Elements + confirmPayment redirects
 * (3DS completion, etc.). We MUST NOT trust URL params alone to claim
 * success — a user could paste any URL into the address bar and see the
 * success view.
 *
 * On verified success (status === Active/Trialing) we auto-redirect to the
 * HOA dashboard at `/dashboard`. Only HOA admins reach this page (the
 * super-admin and other backend roles never pay through the onboarding
 * wizard), so no role-aware branching is needed. The manual "Go to
 * dashboard" button is kept as a fallback for stale JS / rare redirect
 * races.
 *
 * Stripe-side failure signals (`redirect_status=failed`,
 * `redirect_status=requires_payment_method`, or an `error_description` in the
 * query string) short-circuit to the error view immediately — polling the
 * subscription row would never resolve since the webhook never fires.
 */
export default function SubscriptionSuccessPage() {
  return (
    <React.Suspense fallback={<CenteredShell><Spinner /></CenteredShell>}>
      <SubscriptionSuccessInner />
    </React.Suspense>
  );
}

function SubscriptionSuccessInner() {
  const searchParams = useSearchParams();
  const buildingId = searchParams.get("buildingId");
  const subscriptionId = searchParams.get("subscriptionId");

  // Derive initial error state from URL params at render time. Stripe Elements
  // appends `redirect_status=failed` (or `requires_payment_method`) to the
  // return URL when the payment itself fails — in that case polling the
  // subscription row will never go Active since the webhook never fires, so
  // we surface the error immediately instead of waiting for the 30s timeout.
  const initialError = (() => {
    const redirectStatus = searchParams.get("redirect_status");
    const stripeErrorMessage =
      searchParams.get("error_description") ?? searchParams.get("error");
    if (
      redirectStatus === "failed" ||
      redirectStatus === "requires_payment_method" ||
      (stripeErrorMessage && redirectStatus !== "succeeded")
    ) {
      return stripeErrorMessage ?? "Your payment was not completed. Please try again.";
    }
    if (!buildingId && !subscriptionId) {
      return "Missing subscription context";
    }
    return null;
  })();

  const [status, setStatus] = React.useState<"waiting" | "active" | "past-due" | "cancelled" | "timeout" | "error">(
    initialError ? "error" : "waiting",
  );
  const [error, setError] = React.useState<string | null>(initialError);
  // Once we have a hard URL-driven error, we never need to start polling.
  // Captured as a ref so the polling useEffect doesn't need it in deps.
  const skipPollingRef = React.useRef(initialError !== null);

  React.useEffect(() => {
    if (skipPollingRef.current) return;

    let cancelled = false;
    const POLL_MS = 2_000;
    const TIMEOUT_MS = 30_000;
    // Start the clock INSIDE the effect so the 30s window covers actual
    // polling, not component-render time. Captured as a closure-local so a
    // later polling session (e.g. remount) gets a fresh deadline.
    const startedAt = Date.now();

    // Bounded retry for transient network errors / 5xx / 429 so the user
    // doesn't see "Failed to verify subscription" just because the backend
    // hiccuped for a moment. Terminal failures (4xx other than 429) still
    // surface the error view.
    async function tick(attempt = 0) {
      if (cancelled) return;
      if (Date.now() - startedAt > TIMEOUT_MS) {
        setStatus("timeout");
        return;
      }
      // Per-request budget: never wait longer than the remaining timeout.
      // A single hung request would otherwise pin the spinner past TIMEOUT_MS
      // because the deadline is only re-checked at the start of the next tick.
      const remainingMs = TIMEOUT_MS - (Date.now() - startedAt);
      try {
        // Poll by exact subscription id when Stripe Elements supplied one.
        // This guards against buildings that have multiple subscription rows
        // (e.g. a prior cancelled sub + a fresh one) where polling by
        // buildingId could return the wrong one and falsely show success.
        // If the id resolves to nothing (stale URL after a DB reset), keep
        // polling until TIMEOUT_MS — the webhook may still be in flight.
        // We do NOT fall back to a by-buildingId lookup, since that could
        // match a different row on the same building and silently accept
        // payment for an unrelated subscription.
        const lookup = subscriptionId
          ? getSubscriptionById(subscriptionId, buildingId ?? undefined)
          : buildingId
          ? getSubscription(buildingId)
          : Promise.resolve(null);
        const sub = await withDeadline(lookup, remainingMs, "Subscription lookup");
        // Re-check both flags AFTER the await — the lookup may have hung
        // right up to the deadline, or the component may have unmounted.
        // If the deadline elapsed during the await, surface the timeout
        // view; otherwise withDeadline reached us with no result and the
        // next tick would never get scheduled.
        if (cancelled) return;
        if (Date.now() - startedAt > TIMEOUT_MS) {
          setStatus("timeout");
          return;
        }
        if (!sub) {
          // 404 / null is transient — webhook may still be in flight.
          scheduleNext();
          return;
        }
        if (sub.status === "Active" || sub.status === "Trialing") {
          setStatus("active");
          return;
        }
        if (sub.status === "Past Due") {
          setStatus("past-due");
          return;
        }
        if (sub.status === "Cancelled") {
          setStatus("cancelled");
          return;
        }
        // status === 'Incomplete' (still in flight) — keep polling.
        scheduleNext();
      } catch (err) {
        // Same rule as the happy path above: if we crossed the deadline
        // before the catch fired (e.g. withDeadline rejected), surface the
        // timeout view instead of silently dropping into the error view.
        if (cancelled) return;
        if (Date.now() - startedAt > TIMEOUT_MS) {
          setStatus("timeout");
          return;
        }
        if (isTransient(err) && attempt < MAX_RETRIES) {
          // Cap retry delay by remaining timeout so a slow recovery can't
          // slip past TIMEOUT_MS. Use at least 250ms so we don't busy-loop.
          const remainingMs = TIMEOUT_MS - (Date.now() - startedAt);
          const backoff = Math.min(500 * (attempt + 1), Math.max(remainingMs - 50, 250));
          setTimeout(() => { if (!cancelled) tick(attempt + 1); }, backoff);
          return;
        }
        // Real API failure — surface the error view so the user sees a clear
        // signal instead of a silent "Still processing…" timeout. The earlier
        // behavior (keep polling on every error) hid the error message and
        // left callers staring at the spinner until the 30s timeout fired.
        setStatus("error");
        setError(err instanceof Error ? err.message : "Failed to verify subscription");
      }
    }

    function scheduleNext() {
      if (cancelled) return;
      // Cap the poll interval by the remaining timeout — at the very end of
      // the window we still need to give the awaited request time to settle.
      const remainingMs = TIMEOUT_MS - (Date.now() - startedAt);
      const delay = Math.min(POLL_MS, Math.max(remainingMs - 50, 0));
      setTimeout(tick, delay);
    }

    tick();
    return () => {
      cancelled = true;
    };
  }, [buildingId, subscriptionId]);

  // Auto-redirect to the HOA dashboard once the payment is verified as
  // Active/Trialing. Only HOA admins (the existing allowedRoles list in
  // app/dashboard/layout.tsx) reach this page — no role-aware branching
  // is needed. On any other status (past-due, cancelled, timeout, error)
  // we stay on the page so the user can read the relevant message. The
  // existing "Go to dashboard" button stays as a fallback for stale JS
  // or rare redirect races.
  React.useEffect(() => {
    if (status !== "active") return;
    // Hard redirect — preserves the session cookie on the next page load
    // and replaces the history entry (Back from /dashboard must not loop
    // through the Stripe success page). router.replace() is a soft nav
    // and can miss the cookie on the first /api/auth/me request from
    // AuthProvider, bouncing an authenticated user to /sign-in with an
    // "authorization problem" flicker. The same pattern is used at
    // app/sign-in/page.tsx:369 and app/onboarding/setup-account/page.tsx:378.
    window.location.replace("/dashboard");
  }, [status]);

  if (status === "active") {
    return (
      <CenteredShell>
        <h1>All set!</h1>
        <p>Your subscription is active. Welcome to Parqlet.</p>
        <div style={{ display: "flex", gap: "var(--spacing-12)", justifyContent: "center" }}>
          <ActionButton onClick={() => { window.location.replace("/dashboard"); }}>Go to dashboard</ActionButton>
        </div>
      </CenteredShell>
    );
  }

  if (status === "past-due") {
    return (
      <CenteredShell>
        <h1>Payment failed</h1>
        <p>We couldn&apos;t process your card. Update your payment method from the subscription page.</p>
        <button onClick={() => { window.location.replace("/dashboard"); }}>Back to dashboard</button>
      </CenteredShell>
    );
  }

  if (status === "cancelled") {
    return (
      <CenteredShell>
        <h1>Subscription cancelled</h1>
        <p>This subscription was cancelled. Contact support if this was unexpected.</p>
        <div style={{ display: "flex", gap: "var(--spacing-12)", justifyContent: "center", flexWrap: "wrap" }}>
          <ActionButton onClick={() => { window.location.replace("/dashboard"); }}>Back to dashboard</ActionButton>
        </div>
      </CenteredShell>
    );
  }

  if (status === "timeout") {
    return (
      <CenteredShell>
        <h1>Still processing…</h1>
        <p>Stripe hasn&apos;t confirmed your payment yet. Refresh in a minute, or contact support if this persists.</p>
        <div style={{ display: "flex", gap: "var(--spacing-12)", justifyContent: "center", flexWrap: "wrap" }}>
          <ActionButton onClick={() => window.location.reload()}>Refresh</ActionButton>
          <ActionButton onClick={() => { window.location.replace("/dashboard"); }}>Back to dashboard</ActionButton>
        </div>
      </CenteredShell>
    );
  }

  if (status === "error") {
    return (
      <CenteredShell>
        <h1>We couldn&apos;t confirm your payment.</h1>
        <p>{error ?? "Unknown error"}</p>
        <div style={{ display: "flex", gap: "var(--spacing-12)", justifyContent: "center", flexWrap: "wrap" }}>
          <ActionButton onClick={() => { window.location.replace("/dashboard"); }}>Back to dashboard</ActionButton>
        </div>
      </CenteredShell>
    );
  }

  // waiting
  return (
    <CenteredShell>
      <Spinner />
      <h1>Verifying your payment…</h1>
      <p>Hang tight — this only takes a moment.</p>
    </CenteredShell>
  );
}

/**
 * Inline button — the success page intentionally has no shared button
 * component, but the default browser button styling renders as
 * unstyled gray text on a gray background. Wrap with explicit typography
 * + a subtle border so the actions are visible and clickable.
 */
function ActionButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: 48,
        padding: "0 var(--spacing-24)",
        background: "var(--color-fill-white)",
        color: "var(--color-text-strong)",
        border: "1px solid var(--color-stroke-medium)",
        borderRadius: "var(--radius-8)",
        cursor: "pointer",
        fontFamily: "var(--font-family-body)",
        fontSize: "var(--font-size-tiny)",
        fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
      }}
    >
      {children}
    </button>
  );
}

function CenteredShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-fill-weak)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 var(--spacing-24)",
      }}
    >
      <div style={{ maxWidth: 420, textAlign: "center", display: "flex", flexDirection: "column", gap: "var(--spacing-16)" }}>
        {children}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

function Spinner() {
  return (
    <div
      style={{
        width: 32,
        height: 32,
        margin: "0 auto",
        borderRadius: "50%",
        border: "3px solid var(--color-stroke-medium)",
        borderTopColor: "var(--color-text-strong)",
        animation: "spin 0.8s linear infinite",
      }}
    />
  );
}
