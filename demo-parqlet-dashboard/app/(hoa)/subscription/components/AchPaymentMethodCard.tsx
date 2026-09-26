import type { Subscription } from "../../../lib/api/subscriptions";
import { ACH_INSTRUCTIONS, maskAccountNumber } from "../../../lib/ach-instructions";

export function achStatusLabel(status: Subscription["achPaymentStatus"]): string {
  switch (status) {
    case "approved":
      return "Payment approved";
    case "rejected":
      return "Payment needs attention";
    case "pending_review":
    default:
      return "Pending manual review";
  }
}

export function AchPaymentMethodCard({ sub }: { sub: Subscription }) {
  // The receiving account is Parqlet's single Mercury account, so the bank
  // name + masked account come from the static constants in `ach-instructions`
  // rather than from a per-subscription payload. The per-subscription fields
  // are status, remittance reference, and (when approved) approval metadata.
  const maskedAccount = maskAccountNumber(ACH_INSTRUCTIONS.accountNumber, 4);
  return (
    <div
      style={{
        background: "var(--color-fill-white)",
        border: "1px solid var(--color-stroke-medium)",
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-12)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <p style={{ margin: 0, fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-medium)", color: "var(--color-text-strong)" }}>
            ACH bank transfer
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)" }}>
            {ACH_INSTRUCTIONS.bankName} · {maskedAccount}
          </p>
        </div>
        <span style={{ fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)" }}>
          {achStatusLabel(sub.achPaymentStatus)}
        </span>
      </div>
      {sub.achRemittanceReference && (
        <div style={{ paddingTop: "var(--spacing-8)", borderTop: "1px solid var(--color-divider-neutral)" }}>
          <span style={{ display: "block", fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)" }}>Payment reference</span>
          <strong style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)" }}>{sub.achRemittanceReference}</strong>
        </div>
      )}
      {sub.achApprovedAt && (
        <span style={{ fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)" }}>
          Approved {new Date(sub.achApprovedAt).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}
