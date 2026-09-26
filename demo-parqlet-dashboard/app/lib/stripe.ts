/**
 * Lazy Stripe loader for client-side Elements flows.
 *
 * The publishable key is `NEXT_PUBLIC_*` so it's safe to bundle in the
 * browser. We never call `loadStripe` on the server (no @stripe/react-stripe-js
 * there) and never call it in mock-mode paths (those skip Elements entirely).
 *
 * The Stripe Promise is memoized at module scope so multiple Elements
 * providers in the same render tree share one Stripe.js instance.
 */

import { loadStripe, type Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | undefined;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      throw new Error(
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set — required for Stripe Elements flows",
      );
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}
