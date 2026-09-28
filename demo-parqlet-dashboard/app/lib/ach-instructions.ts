/**
 * Domestic ACH bank transfer instructions shown to HOAs during subscription
 * onboarding and the subscription page's "Payment Method" card.
 *
 * The receiving account is Parqlet LLC's operating account at Mercury (via
 * Column N.A., ABA 121145433). All values are sourced from the bank's
 * remittance instruction sheet and centralized here so the onboarding flow
 * and the subscription detail page can never drift.
 *
 * ACH only — no international SWIFT / intermediary fields are exposed. If a
 * customer ever needs wires, the support team should add a separate
 * `wireInstructions` object rather than bolting it onto this one.
 */

export interface AchBankInstructions {
  /** Beneficiary name (the entity receiving the funds). */
  beneficiaryName: string;
  /** Beneficiary's registered address (mailing). */
  beneficiaryAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  /** Receiving bank name. */
  bankName: string;
  /** Receiving bank address (where wires originate from). */
  bankAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  /** ABA routing number (9 digits). */
  routingNumber: string;
  /** Bank account number. */
  accountNumber: string;
  /** Last 4 digits of the account number (for masked display). */
  accountNumberLast4: string;
  /** Account type — "checking" or "savings". */
  accountType: "checking" | "savings";
  /** Friendly note shown under the wire details. */
  note: string;
}

/**
 * Parqlet LLC's Mercury account via Column N.A. The 9425 mask is the
 * canonical last4 shown to HOAs on the subscription page.
 */
export const ACH_INSTRUCTIONS: AchBankInstructions = {
  beneficiaryName: "Parqlet LLC",
  beneficiaryAddress: {
    line1: "The Meridian",
    line2: "1708",
    city: "Austin",
    state: "TX",
    postalCode: "78701",
    country: "US",
  },
  bankName: "Column N.A.",
  bankAddress: {
    line1: "1 Letterman Drive, Building A, Suite A4-700",
    city: "San Francisco",
    state: "CA",
    postalCode: "94129",
    country: "US",
  },
  routingNumber: "121145433",
  accountNumber: "117418469259425",
  accountNumberLast4: "9425",
  accountType: "checking",
  note:
    "Parqlet verifies each incoming ACH transfer manually. " +
    "Use your building ID as the memo/reference so we can match the payment.",
};

/** Pretty-format the routing number as `XXX XXXX XX` for display. */
export function formatRoutingNumber(routing: string): string {
  const d = routing.replace(/\D/g, "");
  if (d.length !== 9) return routing;
  return `${d.slice(0, 3)} ${d.slice(3, 7)} ${d.slice(7)}`;
}

/** Mask all but the last N digits of an account number. */
export function maskAccountNumber(account: string, visibleLast4: number = 4): string {
  const d = account.replace(/\D/g, "");
  if (d.length <= visibleLast4) return d;
  return `•••• ${d.slice(-visibleLast4)}`;
}

/** Format the beneficiary address as a 2- or 3-line string (US style). */
export function formatAddress(addr: AchBankInstructions["beneficiaryAddress"]): string[] {
  const lines: string[] = [];
  lines.push(addr.line1);
  if (addr.line2) lines.push(addr.line2);
  lines.push(`${addr.city}, ${addr.state} ${addr.postalCode}`);
  lines.push(addr.country);
  return lines;
}

/**
 * A stable, deterministic remittance reference for a building.
 *
 * UI-side fallback only. The server is the source of truth and returns
 * a reference in the `ACH-YYYYMMDD-XXXX` format from
 * `POST /api/subscription/ach`. This helper exists so the inline ACH
 * preview pane is non-empty before the POST returns — the server's
 * value always wins once it arrives.
 */
export function buildRemittanceReference(buildingId: string): string {
  // The first 8 hex chars of the id (sans dashes) make a short, stable
  // reference that's easy to type into a bank memo field and easy to scan
  // when reconciling in Mercury. No PII, no timing leakage.
  const cleaned = buildingId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const tail = cleaned.slice(-8).padStart(8, "X");
  return `PARQ-${tail}`;
}
