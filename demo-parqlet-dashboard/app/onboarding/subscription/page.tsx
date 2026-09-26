"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEnrollment, withOnboardingToken as prevOnboardingUrl } from "../useEnrollment";
import { subscribeToStripe, subscribeWithAch } from "@/lib/api/subscriptions";
import { buildRemittanceReference } from "@/lib/ach-instructions";
import { StripeSubscribeForm } from "./components/StripeSubscribeForm";
import { PaymentMethodSelector, type PaymentMethodChoice } from "./components/PaymentMethodSelector";
import { AchInstructionsDisplay } from "./components/AchInstructionsDisplay";
import { AchPendingReview } from "./components/AchPendingReview";

// Single source of truth for the plan amount shown across the onboarding
// wizard. Until the plan picker lands, every dollar figure on this page
// reads from here so changing the price is a one-line edit.
const PLAN_AMOUNT_LABEL = "$500";
const PLAN_AMOUNT_PERIOD = "/mo";

// ─── SVGs ──────────────────────────────────────────────────────────────────────

function IcArrowLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M19 12H5M5 12L11 6M5 12L11 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcOrganized() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L4 6L12 10L20 6L12 2Z" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 10L12 14L20 10" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 18L12 22L20 18" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 14L12 18L20 14" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcEye() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M10 12C10 12.5304 10.2107 13.0391 10.5858 13.4142C10.9609 13.7893 11.4696 14 12 14C12.5304 14 13.0391 13.7893 13.4142 13.4142C13.7893 13.0391 14 12.5304 14 12C14 11.4696 13.7893 10.9609 13.4142 10.5858C13.0391 10.2107 12.5304 10 12 10C11.4696 10 10.9609 10.2107 10.5858 10.5858C10.2107 10.9609 10 11.4696 10 12Z" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12C18.6 16 15.6 18 12 18C8.4 18 5.4 16 3 12C5.4 8 8.4 6 12 6C15.6 6 18.6 8 21 12Z" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcPrivate() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M11.5 21H7C6.46957 21 5.96086 20.7893 5.58579 20.4142C5.21071 20.0391 5 19.5304 5 19V13C5 12.4696 5.21071 11.9609 5.58579 11.5858C5.96086 11.2107 6.46957 11 7 11H17C17.5304 11 18.0391 11.2107 18.4142 11.5858C18.7893 11.9609 19 12.4696 19 13V13.5" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 16C11 16.2652 11.1054 16.5196 11.2929 16.7071C11.4804 16.8946 11.7348 17 12 17C12.2652 17 12.5196 16.8946 12.7071 16.7071C12.8946 16.5196 13 16.2652 13 16C13 15.7348 12.8946 15.4804 12.7071 15.2929C12.5196 15.1054 12.2652 15 12 15C11.7348 15 11.4804 15.1054 11.2929 15.2929C11.1054 15.4804 11 15.7348 11 16Z" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 11V7C8 5.93913 8.42143 4.92172 9.17157 4.17157C9.92172 3.42143 10.9391 3 12 3C13.0609 3 14.0783 3.42143 14.8284 4.17157C15.5786 4.92172 16 5.93913 16 7V11" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 19L17 21L21 17" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcCheckFeature() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="9" cy="9" r="9" fill="var(--color-fill-accent)" />
      <path d="M5.5 9L7.5 11L12.5 6.5" stroke="var(--color-icon-strong)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcCheckCircle() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="24" fill="var(--color-green-150)" />
      <path d="M15 24L21 30L33 18" stroke="var(--color-fill-success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcCreditCard() {
  return (
    <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
      <rect x="0.5" y="0.5" width="19" height="15" rx="2.5" stroke="var(--color-text-weak)" />
      <path d="M0.5 5H19.5" stroke="var(--color-text-weak)" />
      <circle cx="5" cy="10" r="1.5" fill="var(--color-text-weak)" />
      <circle cx="9" cy="10" r="1.5" fill="var(--color-text-weak)" />
      <rect x="12" y="8.5" width="6" height="3" rx="1.5" fill="var(--color-text-weak)" opacity="0.3" />
    </svg>
  );
}

function FeatureItem({ icon, label, sublabel }: { icon: React.ReactNode; label: string; sublabel: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--spacing-8)", width: 110 }}>
      <div style={{ width: 24, height: 24, flexShrink: 0 }}>{icon}</div>
      <p style={{ margin: 0, fontFamily: "var(--font-family-body)", textAlign: "center", color: "var(--color-text-white)" }}>
        <span style={{ display: "block", fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-medium)", lineHeight: "var(--line-height-tiny)" }}>{label}</span>
        <span style={{ display: "block", fontSize: "var(--font-size-extra-tiny)", fontWeight: "var(--font-weight-regular)", lineHeight: "var(--line-height-extra-tiny)" }}>{sublabel}</span>
      </p>
    </div>
  );
}

// ─── Mock Stripe Checkout ──────────────────────────────────────────────────────

function CheckoutForm({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void | Promise<void> }) {
  const [name, setName] = React.useState("");
  const [cardNumber, setCardNumber] = React.useState("");
  const [expiry, setExpiry] = React.useState("");
  const [cvc, setCvc] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  function formatCardNumber(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  }

  function formatExpiry(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
    return digits;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return; // in-flight guard — block duplicate submissions
    if (!name || cardNumber.replace(/\s/g, "").length < 13 || expiry.replace(/\s/g, "").length < 3 || cvc.length < 3) return;
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    try {
      // Keep the button disabled until onSuccess settles — it may persist the
      // mock subscription server-side, and re-enabling early would let the user
      // submit again during that async window.
      await onSuccess();
    } finally {
      setLoading(false);
    }
  }

  const isValid = !!(name && cardNumber.replace(/\s/g, "").length >= 13 && expiry.replace(/\s/g, "").length >= 3 && cvc.length >= 3);

  const inputStyle: React.CSSProperties = {
    height: 44, padding: "0 var(--spacing-12)",
    border: "1px solid var(--color-divider-neutral)",
    borderRadius: "var(--radius-8)",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    background: "var(--color-fill-white)",
    outline: "none",
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-20)" }}>
      {/* Stripe badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
        <IcCreditCard />
        <span style={{ fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", fontWeight: "var(--font-weight-medium)" }}>
          Secure checkout powered by{" "}
          <span style={{ color: "var(--color-text-strong)", textTransform: "uppercase", letterSpacing: "0.02em" }}>Stripe</span>
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          <svg width="24" height="16" viewBox="0 0 24 16" fill="none"><rect x="0.5" y="0.5" width="23" height="15" rx="2" fill="#fff" stroke="#ddd"/><text x="12" y="11" textAnchor="middle" fontSize="7" fill="#635bff" fontFamily="Arial" fontWeight="bold">VISA</text></svg>
          <svg width="24" height="16" viewBox="0 0 24 16" fill="none"><rect x="0.5" y="0.5" width="23" height="15" rx="2" fill="#fff" stroke="#ddd"/><text x="12" y="11" textAnchor="middle" fontSize="5" fill="#eb001b" fontFamily="Arial" fontWeight="bold">MC</text></svg>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", fontWeight: "var(--font-weight-medium)" }}>Cardholder name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" style={inputStyle} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", fontWeight: "var(--font-weight-medium)" }}>Card number</label>
        <input value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))} placeholder="4242 4242 4242 4242" style={{ ...inputStyle, letterSpacing: "0.04em" }} />
      </div>
      <div style={{ display: "flex", gap: "var(--spacing-12)" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", fontWeight: "var(--font-weight-medium)" }}>Expiry date</label>
          <input value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} placeholder="MM / YY" style={inputStyle} />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", fontWeight: "var(--font-weight-medium)" }}>CVC</label>
          <input value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" style={inputStyle} />
        </div>
      </div>
      <div style={{ display: "flex", gap: "var(--spacing-12)", paddingTop: 8 }}>
        <button type="button" onClick={onBack} style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          height: 48, padding: "0 var(--spacing-20)",
          background: "none", border: "1px solid var(--color-divider-neutral)",
          borderRadius: "var(--radius-8)", cursor: "pointer",
          fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)",
          color: "var(--color-text-strong)", flexShrink: 0,
        }}>Back</button>
        <button type="submit" disabled={!isValid || loading} style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          height: 48, padding: "0 var(--spacing-20)",
          background: "var(--color-button-primary)", border: "none",
          borderRadius: "var(--radius-8)",
          cursor: isValid && !loading ? "pointer" : "not-allowed",
          fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)",
          fontWeight: "var(--font-weight-medium)",
          // Fixed brand color, doesn't invert in dark mode — keep text dark.
          color: "#222222",
          opacity: isValid && !loading ? 1 : 0.5, flex: 1,
          transition: "opacity 0.12s",
        }}>{loading ? "Processing…" : `Pay ${PLAN_AMOUNT_LABEL}${PLAN_AMOUNT_PERIOD}`}</button>
      </div>
    </form>
  );
}

// ─── Success ───────────────────────────────────────────────────────────────────

function Success({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-fill-weak)", fontFamily: "var(--font-family-body)", display: "flex", justifyContent: "center" }}>
      <style>{`
        @media (max-width: 768px) {
          .subscription-success-right-panel { display: none !important; }
          .subscription-success-left-col { padding: var(--spacing-24) var(--spacing-16) !important; }
        }
      `}</style>
      <div style={{ width: "100%", maxWidth: 1440, display: "flex", alignItems: "stretch" }}>
        <div className="subscription-success-left-col" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "var(--spacing-48) var(--spacing-56)", minWidth: 0 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 420 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-24)", alignItems: "center", textAlign: "center" as React.CSSProperties["textAlign"] }}>
              <IcCheckCircle />
              <div>
                <h1 style={{ margin: 0, fontSize: "var(--font-size-heading-1)", lineHeight: "var(--line-height-heading-1)", fontWeight: "var(--font-weight-medium)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-heading)" }}>All set!</h1>
                <p style={{ margin: "var(--spacing-8) 0 0", fontSize: "var(--font-size-body)", lineHeight: "var(--line-height-body)", color: "var(--color-text-weak)" }}>Your subscription is active. Welcome to Parqlet.</p>
              </div>
              <button onClick={() => router.push("/dashboard")} style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                height: 56, padding: "0 var(--spacing-32)",
                background: "var(--color-button-primary)", border: "none",
                borderRadius: "var(--radius-8)", cursor: "pointer",
                fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-heading-3)",
                // Fixed brand color, doesn't invert in dark mode — keep text dark.
                color: "#222222",
              }}>Go to dashboard</button>
            </div>
          </div>
        </div>
        <div className="subscription-success-right-panel" style={{ width: 664, flexShrink: 0, padding: "var(--spacing-48)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: "var(--radius-20)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-fill-strong)" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`, backgroundSize: "32px 32px", WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)", maskImage: "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)" }} />
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 90% 70% at 0% 100%, #B8C231 0%, transparent 65%), radial-gradient(ellipse 90% 70% at 100% 0%, #EA7D0B 0%, transparent 65%)", mixBlendMode: "screen", opacity: 0.9 }} />
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(20,20,20,1) 30%, rgba(20,20,20,0.68) 100%)" }} />
            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--spacing-96)" }}>
              <FeatureItem icon={<IcOrganized />} label="Organized" sublabel="guest parking" />
              <FeatureItem icon={<IcEye />} label="Real-time" sublabel="visibility" />
              <FeatureItem icon={<IcPrivate />} label="Private building" sublabel="environment" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SubscriptionPage() {
  // useSearchParams() forces the route to opt out of static prerendering, so
  // it has to live inside a Suspense boundary per Next.js 16 requirements.
  return (
    <React.Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "var(--color-fill-weak)" }} />}>
      <SubscriptionPageInner />
    </React.Suspense>
  );
}

function SubscriptionPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: enrollment } = useEnrollment();
  const [showCheckout, setShowCheckout] = React.useState(false);
  const [paid, setPaid] = React.useState(false);
  const [checkoutLoading, setCheckoutLoading] = React.useState(false);
  const [checkoutError, setCheckoutError] = React.useState<string | null>(null);
  const [subscribeResult, setSubscribeResult] = React.useState<{
    subscriptionId: string;
    clientSecret?: string;
    status: string;
    buildingId: string;
  } | null>(null);
  // True while we round-trip ?session_id=... to the backend to confirm the
  // session actually settled. Without this gate, anyone could paste any
  // session ID into the URL and reach the success view.
  const [verifyingSession, setVerifyingSession] = React.useState(false);
  const [verifyError, setVerifyError] = React.useState<string | null>(null);

  // ── ACH state ──
  // Default to card so the existing Stripe flow keeps working for HOAs
  // who never opt into ACH. The selector sits between the plan card and
  // the CTA so the choice is explicit but not in the way.
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethodChoice>("card");
  // Set when the user submits ACH. We show a dedicated pending-review
  // view (separate from the existing Stripe success view) with a
  // single "Go to dashboard" CTA — no access-pending gate, the dashboard
  // works immediately and the subscription page surfaces the review state.
  const [achResult, setAchResult] = React.useState<{
    remittanceReference: string;
  } | null>(null);

  const isMock = process.env.NEXT_PUBLIC_MOCK_ENABLED === "true";

  // Defer the building-name suffix until the client has hydrated so the
  // server-rendered HTML (which runs with `enrollment === null`) matches the
  // client's first render. Otherwise React logs a hydration mismatch on the
  // surrounding `<p>`. The suffix is non-essential copy; showing the
  // generic text for one paint is the cheapest way to avoid the warning.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Clicking "Continue to payment":
  //   - Card (default):
  //     - Mock mode: reveal the local CheckoutForm (the in-app mock stand-in).
  //     - Live mode: ask the backend to create a Stripe Subscription in
  //       'incomplete' state via subscribeToStripe(). On success, the
  //       backend returns a clientSecret that we pass to <StripeSubscribeForm>
  //       (which renders Stripe Elements + <PaymentElement> + a confirm button).
  //       On confirm, Stripe Elements redirects to /onboarding/subscription/success
  //       which polls the backend's subscription endpoint until status === Active.
  //   - ACH:
  //     - POST /api/subscriptions/ach to register the building's intent to pay
  //       by bank transfer. The backend creates the subscription row in
  //       `Incomplete` + `pending_review` and returns a per-building
  //       remittance reference. We then surface a dedicated
  //       "Pending manual review" screen with the full bank instructions
  //       and a single "Go to dashboard" CTA.
  async function handleContinueToPayment() {
    setCheckoutError(null);

    if (paymentMethod === "ach") {
      await handleContinueWithAch();
      return;
    }

    if (isMock) {
      setShowCheckout(true);
      return;
    }

    setCheckoutLoading(true);
    try {
      const buildingId =
        enrollment?.buildingId ?? searchParams.get("buildingId");
      if (!buildingId) {
        throw new Error("Missing building context — please restart onboarding from the invite link.");
      }

      const customerEmail = enrollment?.email ?? "";
      if (!customerEmail) {
        throw new Error("Missing customer email — please restart onboarding from the invite link.");
      }

      // The dashboard has a live `parqlet_session` cookie by this point:
      //   - setup-account sets it via /api/enrollment/complete (which now
      //     forwards the backend's Set-Cookie).
      //   - authMiddleware on the backend reads the cookie and authenticates
      //     the call to /api/stripe/subscribe — no enrollment token needed.
      // The legacy `enrollmentToken` field is left off intentionally. It
      // would only matter for callers who have NO session cookie (the
      // resolveSubscribeActor enrollment path), and by step 4 we've already
      // consumed the token via complete-account, so a token-typed request
      // would 404 anyway.
      const result = await subscribeToStripe({
        buildingId,
        customerEmail,
      });

      if (result.mock) {
        setCheckoutLoading(false);
        setShowCheckout(true);
        return;
      }

      if (result.clientSecret) {
        // Persist for the success page's polling context + save for next-page
        // handoff. The form below reads it via a module-level ref.
        setSubscribeResult({ ...result, buildingId });
        setShowCheckout(true);
      } else {
        throw new Error("Stripe did not return a client_secret.");
      }
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : "Failed to start checkout");
      setCheckoutLoading(false);
    }
  }

  /**
   * ACH branch of `handleContinueToPayment`. Registers the building's
   * intent to pay by ACH and shows the pending-review view with the
   * remittance reference. We compute the reference client-side as a
   * stable fallback — the server response always wins, but this keeps
   * the page renderable even if the proxy returns an unexpected body.
   */
  async function handleContinueWithAch() {
    setCheckoutError(null);
    const buildingId =
      enrollment?.buildingId ?? searchParams.get("buildingId");
    if (!buildingId) {
      setCheckoutError("Missing building context — please restart onboarding from the invite link.");
      return;
    }

    setCheckoutLoading(true);
    try {
      const result = await subscribeWithAch({ buildingId });
      const ref = result.achRemittanceReference ?? buildRemittanceReference(buildingId);
      setAchResult({ remittanceReference: ref });
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : "Failed to start ACH onboarding");
    } finally {
      setCheckoutLoading(false);
    }
  }

  // Called when the in-app mock CheckoutForm reports success. Persist the
  // subscription server-side by POSTing a synthesized Stripe event to
  // /api/webhooks/stripe (the checkout-session route's docstring promises this),
  // so the mock subscription survives a refresh and revenue totals stay in sync.
  // If building context is missing the webhook safely no-ops, so we always flip
  // to the Success view for the visual flow.
  async function handleCheckoutSuccess() {
    const buildingId =
      enrollment?.buildingId ?? searchParams.get("buildingId");

    if (buildingId) {
      try {
        await fetch("/api/webhooks/stripe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "checkout.session.completed",
            data: {
              object: {
                metadata: {
                  buildingId,
                  planName: "Growth", // default until a plan picker lands
                  customerEmail: enrollment?.email ?? "",
                },
              },
            },
          }),
        });
      } catch {
        // Mock persistence is best-effort — never block the success view on it.
      }
    }

    setPaid(true);
  }

  if (paid) return <Success router={router} />;

  // ACH branch — once we have a remittance reference, leave the wizard
  // entirely. The pending-review view replaces both the checkout panel
  // AND the ambient right-rail so the user has a single, focused screen
  // with the bank details and a "Go to dashboard" CTA.
  if (achResult) {
    return (
      <AchPendingReview
        remittanceReference={achResult.remittanceReference}
        amount={PLAN_AMOUNT_LABEL}
        onGoToDashboard={() => { window.location.href = "/dashboard"; }}
      />
    );
  }

  // While we round-trip ?session_id=… to the backend, show a "verifying"
  // placeholder instead of letting the user re-trigger checkout (which would
  // either fail or start a second session).
  if (verifyingSession) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--color-fill-weak)", fontFamily: "var(--font-family-body)", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--spacing-16)", maxWidth: 360, textAlign: "center" as React.CSSProperties["textAlign"], padding: "0 var(--spacing-24)" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid var(--color-stroke-medium)", borderTopColor: "var(--color-text-strong)", animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <p style={{ margin: 0, fontSize: "var(--font-size-heading-3)", color: "var(--color-text-strong)", fontWeight: "var(--font-weight-medium)" }}>
            Verifying your payment…
          </p>
          <p style={{ margin: 0, fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)" }}>
            Hang tight — this only takes a moment.
          </p>
        </div>
      </div>
    );
  }

  // If we got a session_id back from Stripe but the backend says it isn't
  // paid (or the lookup failed), don't dump the user on the checkout form
  // again — that would either start a second session or silently succeed.
  // Surface the error and let them back out or contact support.
  if (verifyError) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--color-fill-weak)", fontFamily: "var(--font-family-body)", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--spacing-16)", maxWidth: 420, textAlign: "center" as React.CSSProperties["textAlign"], padding: "0 var(--spacing-24)" }}>
          <p style={{ margin: 0, fontSize: "var(--font-size-heading-3)", color: "var(--color-text-strong)", fontWeight: "var(--font-weight-medium)" }}>
            We couldn&apos;t confirm your payment.
          </p>
          <p style={{ margin: 0, fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)" }}>
            {verifyError}
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              marginTop: "var(--spacing-8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              height: 48, padding: "0 var(--spacing-24)",
              backgroundColor: "var(--color-button-primary)", border: "none",
              borderRadius: "var(--radius-8)", cursor: "pointer",
              fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)",
              // Fixed brand color, doesn't invert in dark mode — keep text dark.
              color: "#222222",
            }}
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-fill-weak)", fontFamily: "var(--font-family-body)", display: "flex", justifyContent: "center" }}>
      <style>{`
        @keyframes ambientA { from { opacity: 1; transform: translate(0px, 0px); } to { opacity: 0.04; transform: translate(-18px, -14px); } }
        @keyframes ambientB { from { opacity: 0.04; transform: translate(0px, 0px); } to { opacity: 1; transform: translate(18px, 14px); } }
        @media (max-width: 768px) {
          .subscription-right-panel { display: none !important; }
          .subscription-left-col { padding: var(--spacing-24) var(--spacing-16) !important; }
        }
      `}</style>
      <div style={{ width: "100%", maxWidth: 1440, display: "flex", alignItems: "stretch" }}>

        {/* ── Left ─────────────────────────────────────────────────────────── */}
        <div className="subscription-left-col" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "var(--spacing-48) var(--spacing-56)", minWidth: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-24)" }}>
            <img src="/onboarding/logo-dark.svg" alt="Parqlet" style={{ display: "block", height: 26, width: "auto", alignSelf: "flex-start", filter: "var(--logo-dark-filter)" }} />
          </div>

          {showCheckout ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 420 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-24)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
                  <span style={{ fontSize: "var(--font-size-tiny)", lineHeight: "var(--line-height-tiny)", fontWeight: "var(--font-weight-regular)", color: "var(--color-text-weak)" }}>Step 4 of 4 — Payment</span>
                  <h1 style={{ margin: 0, fontSize: "var(--font-size-heading-1)", lineHeight: "var(--line-height-heading-1)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--color-text-strong)", fontFamily: "var(--font-family-heading)" }}>Complete payment</h1>
                  <p style={{ margin: 0, fontSize: "var(--font-size-body)", lineHeight: "var(--line-height-body)", color: "var(--color-text-weak)" }}>Parqlet HOA plan — {PLAN_AMOUNT_LABEL}{PLAN_AMOUNT_PERIOD}</p>
                </div>
                {/* Mock mode keeps the plain-HTML CheckoutForm for designer visual fidelity.
                    Live mode renders Stripe Elements via the imported StripeSubscribeForm
                    (which wraps <Elements> + <PaymentElement> + confirmPayment). */}
                {isMock || !subscribeResult?.clientSecret ? (
                  <CheckoutForm onBack={() => setShowCheckout(false)} onSuccess={handleCheckoutSuccess} />
                ) : (
                  <StripeSubscribeForm
                    clientSecret={subscribeResult.clientSecret}
                    onSuccess={handleCheckoutSuccess}
                    returnUrl={`${window.location.origin}/onboarding/subscription/success?buildingId=${encodeURIComponent(subscribeResult.buildingId)}&subscriptionId=${encodeURIComponent(subscribeResult.subscriptionId)}`}
                  />
                )}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 420 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-32)" }}>
                {/* Back — text link with arrow */}
                <button
                  onClick={() => router.push(prevOnboardingUrl("/onboarding/invite-team"))}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--spacing-8)",
                    alignSelf: "flex-start",
                    background: "none",
                    border: "none",
                    padding: 0,
                    margin: 0,
                    cursor: "pointer",
                    fontFamily: "var(--font-family-body)",
                    fontSize: "var(--font-size-body)",
                    lineHeight: "var(--line-height-body)",
                    fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                    color: "var(--color-text-weak)",
                    transition: "color 0.12s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-text-strong)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-weak)"; }}
                >
                  <IcArrowLeft />
                  Back
                </button>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
                  <span style={{ fontSize: "var(--font-size-tiny)", lineHeight: "var(--line-height-tiny)", fontWeight: "var(--font-weight-regular)", color: "var(--color-text-weak)" }}>Step 4 of 4</span>
                  <h1 style={{ margin: 0, fontSize: "var(--font-size-heading-1)", lineHeight: "var(--line-height-heading-1)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--color-text-strong)", fontFamily: "var(--font-family-heading)" }}>Activate your subscription</h1>
                  <p style={{ margin: 0, fontSize: "var(--font-size-body)", lineHeight: "var(--line-height-body)", color: "var(--color-text-weak)" }}>Your Parqlet plan{mounted && enrollment?.buildingName ? ` for ${enrollment.buildingName}` : ""} is ready. Complete payment to access your dashboard.</p>
                </div>

                {/* Single plan display */}
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-24)", paddingTop: "var(--spacing-24)", borderTop: "1px solid var(--color-divider-neutral)" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
                    <span style={{ fontSize: "var(--font-size-tiny)", lineHeight: "var(--line-height-tiny)", fontWeight: "var(--font-weight-medium)", color: "var(--color-text-weak)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Parqlet HOA Subscription</span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "var(--spacing-4)" }}>
                      <span style={{ fontSize: 48, lineHeight: 1, fontWeight: "var(--font-weight-medium)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-heading)", letterSpacing: "-0.02em" }}>$500</span>
                      <span style={{ fontSize: "var(--font-size-body)", lineHeight: "var(--line-height-body)", fontWeight: "var(--font-weight-regular)", color: "var(--color-text-weak)" }}>/ month</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-12)" }}>
                    {["Parking visibility for building security", "Resident activity", "Priority support"].map((f) => (
                      <div key={f} style={{ display: "flex", alignItems: "center", gap: "var(--spacing-12)" }}>
                        <IcCheckFeature />
                        <span style={{ fontSize: "var(--font-size-tiny)", lineHeight: "var(--line-height-tiny)", fontWeight: "var(--font-weight-regular)", color: "var(--color-text-strong)" }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment method selector — defaults to card. */}
                <PaymentMethodSelector
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                />

                {/* Inline ACH preview. Shown only when the user picked ACH so
                    the wizard's pre-checkout view is a single coherent card;
                    the actual transfer happens on the next screen. */}
                {paymentMethod === "ach" && (
                  <AchInstructionsDisplay
                    remittanceReference={
                      // Use the building id if we have it, otherwise let the
                      // helper produce a stable placeholder until the real
                      // reference arrives on the next screen.
                      buildRemittanceReference(
                        enrollment?.buildingId ?? searchParams.get("buildingId") ?? "PREVIEW"
                      )
                    }
                    amount={PLAN_AMOUNT_LABEL}
                  />
                )}

                {/* CTA */}
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-16)", alignItems: "center" }}>
                  <button
                    onClick={handleContinueToPayment}
                    disabled={checkoutLoading}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: "100%",
                      height: 56, padding: "0 var(--spacing-16)",
                      backgroundColor: "var(--color-button-primary)", border: "none",
                      borderRadius: "var(--radius-8)",
                      cursor: checkoutLoading ? "not-allowed" : "pointer",
                      opacity: checkoutLoading ? 0.6 : 1,
                      fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-heading-3)",
                      // Fixed brand color, doesn't invert in dark mode — keep text dark.
                      color: "#222222", transition: "background-color 0.12s",
                    }}>
                    {checkoutLoading
                      ? "Working…"
                      : paymentMethod === "ach"
                        ? "Continue with ACH"
                        : "Continue to payment"}
                  </button>
                  {checkoutError && (
                    <p style={{ margin: 0, fontSize: "var(--font-size-extra-tiny)", color: "var(--color-fill-error, #dc2626)", textAlign: "center" as React.CSSProperties["textAlign"], maxWidth: 340 }}>
                      {checkoutError}
                    </p>
                  )}
                  <p style={{ margin: 0, fontSize: "var(--font-size-extra-tiny)", lineHeight: "var(--line-height-extra-tiny)", color: "var(--color-text-weak)", textAlign: "center" as React.CSSProperties["textAlign"], maxWidth: 340 }}>
                    {paymentMethod === "ach"
                      ? "We'll show Parqlet's receiving account and a reference to put in the memo. Your dashboard is ready immediately after."
                      : <>You&apos;ll be {isMock ? "shown a secure checkout form right here" : "redirected to our secure payment provider"}. Your dashboard will be ready immediately after.</>}
                  </p>

                {/* Skip link */}
                <button
                  onClick={() => router.push("/dashboard")}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    fontFamily: "var(--font-family-body)",
                    fontSize: "var(--font-size-tiny)",
                    lineHeight: "var(--line-height-tiny)",
                    fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                    color: "var(--color-text-strong)",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = "underline";
                    e.currentTarget.style.color = "var(--color-gray-90)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = "none";
                    e.currentTarget.style.color = "var(--color-text-strong)";
                  }}
                >
                  I&apos;ll do this later
                </button>
                </div>
              </div>
            </div>
          )}

          {/* Legal */}
          <p style={{ margin: 0, fontSize: "var(--font-size-tiny)", lineHeight: "var(--line-height-tiny)", fontWeight: "var(--font-weight-regular)", color: "var(--color-text-weak)", maxWidth: 420 }}>
            By continuing, you agree to our{" "}
            <a href="https://parqlet-terms-and-privacy.notion.site/Terms-of-Service-35d38574a76480228d7bc194bc23c6de" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-text-link)", fontWeight: "var(--font-weight-medium)", textDecoration: "underline", textUnderlineOffset: 2 }}>Terms of Service</a>
            {" "}and{" "}
            <a href="https://parqlet-terms-and-privacy.notion.site/Privacy-Policy-35d38574a76480a0be27c1cac5735ebe" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-text-link)", fontWeight: "var(--font-weight-medium)", textDecoration: "underline", textUnderlineOffset: 2 }}>Privacy Policy</a>
          </p>
        </div>

        {/* ── Right ────────────────────────────────────────────────────────── */}
        <div className="subscription-right-panel" style={{ width: 664, flexShrink: 0, padding: "var(--spacing-48)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: "var(--radius-20)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-fill-strong)" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`, backgroundSize: "32px 32px", WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)", maskImage: "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)" }} />
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 90% 70% at 0% 100%, #B8C231 0%, transparent 65%), radial-gradient(ellipse 90% 70% at 100% 0%, #EA7D0B 0%, transparent 65%)", mixBlendMode: "screen", opacity: 0.9 }} />
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(20,20,20,1) 30%, rgba(20,20,20,0.68) 100%)" }} />
            <div style={{ position: "absolute", inset: 0, filter: "blur(40px)", background: "radial-gradient(ellipse 130% 110% at 112% -8%, rgba(20,20,20,0.95) 0%, transparent 58%), radial-gradient(ellipse 130% 110% at -12% 108%, rgba(20,20,20,0.95) 0%, transparent 58%)", animation: "ambientA 2.2s ease-in-out infinite alternate" }} />
            <div style={{ position: "absolute", inset: 0, filter: "blur(40px)", background: "radial-gradient(ellipse 130% 110% at -12% -8%, rgba(20,20,20,0.95) 0%, transparent 58%), radial-gradient(ellipse 130% 110% at 112% 108%, rgba(20,20,20,0.95) 0%, transparent 58%)", animation: "ambientB 2.2s ease-in-out infinite alternate" }} />
            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--spacing-96)" }}>
              <FeatureItem icon={<IcOrganized />} label="Organized" sublabel="guest parking" />
              <FeatureItem icon={<IcEye />} label="Real-time" sublabel="visibility" />
              <FeatureItem icon={<IcPrivate />} label="Private building" sublabel="environment" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}