"use client";

import React from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getStripe } from "@/lib/stripe";
import {
  attachSubscriptionPaymentMethod,
  createSubscriptionPaymentMethodSetupIntent,
  subscriptionKeys,
  type Subscription,
} from "@/lib/api/subscriptions";

/**
 * Stripe Elements "Update Card" modal for the HOA subscription page.
 *
 * Replaces the old raw-card UpdatePaymentModal. Card data is collected by
 * <PaymentElement>; only the resulting `pm_…` id (returned by Stripe
 * Elements after confirmSetup) is sent to the backend, which calls
 * `subscriptions.update({ default_payment_method })` so Stripe auto-retries
 * any unpaid invoice.
 *
 * Two-step flow:
 *   1. On mount, fetch a SetupIntent client_secret from
 *      /api/stripe/subscriptions/:id/payment-method/setup-intent.
 *   2. On confirm, stripe.confirmSetup({ redirect: 'if_required' }) returns
 *      a PaymentMethod id inline (no redirect) — POST that id to
 *      /api/stripe/subscriptions/:id/payment-method.
 */
export function UpdateCardModal({
  buildingId,
  subscriptionId,
  onClose,
  onSuccess,
}: {
  buildingId: string;
  subscriptionId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    createSubscriptionPaymentMethodSetupIntent(subscriptionId, { buildingId })
      .then((res) => {
        if (cancelled) return;
        if (res.mock) {
          // Mock mode — surface as a clear state. Dashboard mock flow usually
          // uses an in-app form, but if the proxy returned mock here we just
          // bail to the onSuccess callback so the UI can keep moving.
          onSuccess();
          return;
        }
        setClientSecret(res.clientSecret);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Failed to start card update");
      });
    return () => {
      cancelled = true;
    };
  }, [subscriptionId, buildingId, onSuccess]);

  if (loadError) {
    return (
      <ModalShell onClose={onClose} title="Update payment method">
        <p style={{ color: "var(--color-fill-error, #dc2626)" }}>{loadError}</p>
        <button onClick={onClose}>Close</button>
      </ModalShell>
    );
  }
  if (!clientSecret) {
    return (
      <ModalShell onClose={onClose} title="Update payment method">
        <p>Preparing secure card form…</p>
      </ModalShell>
    );
  }

  return (
    <Elements stripe={getStripe()} options={{ clientSecret, appearance: { theme: "stripe" } }}>
      <InnerUpdateCardForm
        buildingId={buildingId}
        subscriptionId={subscriptionId}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </Elements>
  );
}

function InnerUpdateCardForm({
  buildingId,
  subscriptionId,
  onClose,
  onSuccess,
}: {
  buildingId: string;
  subscriptionId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const attachMutation = useMutation({
    mutationFn: (paymentMethodId: string) =>
      attachSubscriptionPaymentMethod(subscriptionId, { buildingId, paymentMethodId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.detail(buildingId) });
      onSuccess();
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to save payment method");
      setSubmitting(false);
    },
  });

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

    // redirect: 'if_required' returns inline when no 3DS challenge is
    // needed, so we get a setupIntent.payment_method back without ever
    // leaving the page.
    const { setupIntent, error: confirmError } = await stripe.confirmSetup({
      elements,
      redirect: "if_required",
      confirmParams: { return_url: `${window.location.origin}/dashboard` },
    });

    if (confirmError) {
      setError(confirmError.message ?? "Card update failed");
      setSubmitting(false);
      return;
    }

    const paymentMethodId =
      typeof setupIntent?.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent?.payment_method?.id ?? null;

    if (!paymentMethodId) {
      setError("Stripe did not return a PaymentMethod id");
      setSubmitting(false);
      return;
    }

    attachMutation.mutate(paymentMethodId);
  }

  const busy = submitting || attachMutation.isPending;

  return (
    <ModalShell onClose={onClose} title="Update payment method" busy={busy}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-20)" }}>
        <p style={{ margin: 0, fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)" }}>
          Your new payment method becomes the default. Any past-due balance may be retried immediately.
        </p>
        <PaymentElement options={{ layout: "tabs" }} />
        {error && (
          <p role="alert" style={{ margin: 0, color: "var(--color-fill-error, #dc2626)" }}>
            {error}
          </p>
        )}
        <div style={{ display: "flex", gap: "var(--spacing-12)", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting || attachMutation.isPending}
            style={btnSecondary}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!stripe || submitting || attachMutation.isPending}
            style={{
              ...btnPrimary,
              opacity: submitting || attachMutation.isPending ? 0.6 : 1,
              cursor: submitting || attachMutation.isPending ? "not-allowed" : "pointer",
            }}
          >
            {submitting || attachMutation.isPending ? "Saving…" : "Save card"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ModalShell({
  children,
  onClose,
  title,
  busy = false,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  busy?: boolean;
}) {
  const titleId = React.useId();

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  return (
    <div
      onClick={busy ? undefined : onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 500,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--spacing-24)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          background: "var(--color-fill-white)",
          borderRadius: "var(--radius-16)",
          width: "100%",
          maxWidth: 480,
          boxShadow: "0 16px 48px rgba(0,0,0,0.16)",
          padding: "var(--spacing-24)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--spacing-20)",
        }}
      >
        <h2
          id={titleId}
          style={{ margin: 0, fontSize: "var(--font-size-heading-3)", fontFamily: "var(--font-family-heading)" }}
        >
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  height: 40,
  padding: "0 var(--spacing-16)",
  background: "var(--color-button-primary)",
  border: "none",
  borderRadius: "var(--radius-8)",
  fontFamily: "var(--font-family-body)",
  fontSize: "var(--font-size-tiny)",
  // Fixed brand color, doesn't invert in dark mode — keep text dark.
  color: "#222222",
};

const btnSecondary: React.CSSProperties = {
  height: 40,
  padding: "0 var(--spacing-16)",
  background: "var(--color-fill-white)",
  border: "1px solid var(--color-stroke-medium)",
  borderRadius: "var(--radius-8)",
  fontFamily: "var(--font-family-body)",
  fontSize: "var(--font-size-tiny)",
  color: "var(--color-text-strong)",
};

// Type-only re-export so the parent can import the modal type alongside the Subscription type.
export type { Subscription };
