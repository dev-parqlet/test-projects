"use client";

import React from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";

/**
 * Stripe Elements payment form for the onboarding wizard step 4.
 *
 * Wraps Stripe Elements + <PaymentElement> + a confirm button. The parent
 * passes the client_secret from /api/stripe/subscribe, plus an `onSuccess`
 * callback for post-confirm routing and a returnUrl that Elements navigates
 * to after a successful confirmation (3DS completion, etc.).
 *
 * Card data is collected entirely inside the PaymentElement iframe — it
 * never touches our servers. Only the resulting PaymentMethod id (handled
 * server-side by Stripe) flows to the backend, and the webhook updates the
 * subscriptions row to `Active`.
 */
export function StripeSubscribeForm({
  clientSecret,
  onSuccess,
  returnUrl,
}: {
  clientSecret: string;
  onSuccess: () => void;
  returnUrl: string;
}) {
  return (
    <Elements stripe={getStripe()} options={{ clientSecret, appearance: { theme: "stripe" } }}>
      <InnerForm onSuccess={onSuccess} returnUrl={returnUrl} />
    </Elements>
  );
}

function InnerForm({ onSuccess, returnUrl }: { onSuccess: () => void; returnUrl: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || submitting) return;
    setSubmitting(true);
    setError(null);

    const submitResult = await elements.submit();
    if (submitResult.error) {
      setError(submitResult.error.message ?? "Card details are invalid");
      setSubmitting(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed");
      setSubmitting(false);
      return;
    }

    // confirmPayment redirects on success (3DS path) — this only runs
    // when redirect: 'if_required' would resolve inline. With return_url
    // always set, this branch is rarely hit, but we cover it for safety.
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-20)" }}>
      <PaymentElement options={{ layout: "tabs" }} />
      {error && (
        <p
          role="alert"
          style={{
            margin: 0,
            fontSize: "var(--font-size-extra-tiny)",
            color: "var(--color-fill-error, #dc2626)",
          }}
        >
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={!stripe || submitting}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 48,
          padding: "0 var(--spacing-24)",
          backgroundColor: "var(--color-button-primary)",
          border: "none",
          borderRadius: "var(--radius-8)",
          cursor: submitting ? "not-allowed" : "pointer",
          opacity: submitting ? 0.6 : 1,
          fontFamily: "var(--font-family-body)",
          fontSize: "var(--font-size-heading-3)",
          // Fixed brand color, doesn't invert in dark mode — keep text dark.
          color: "#222222",
        }}
      >
        {submitting ? "Processing…" : "Subscribe — $500/mo"}
      </button>
    </form>
  );
}
