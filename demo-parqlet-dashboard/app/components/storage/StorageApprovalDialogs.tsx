"use client";

/**
 * The two confirmations in front of approving or rejecting a storage
 * claim, and the one place their copy lives.
 *
 * ─── WHY A CONFIRMATION AT ALL ──────────────────────────────────────
 *
 * Approving is the office vouching that a locker belongs to a unit,
 * from records the app cannot see. The dialog's job is not "are you
 * sure" - it is to say WHERE to look before saying yes, which is the
 * one thing a manager cannot do from this screen.
 *
 * Shared by the Storage approval tab and the Resident directory,
 * because the same decision is offered in both and the two must not
 * drift into telling a manager different things about it.
 *
 * A rejection REASON is coming later (client, 2026-10-21: "we can add
 * it later"). The copy already promises the resident will be asked to
 * check the number, which is true without one.
 */

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export type StorageClaim = {
  storageNumber: string;
  residentName: string;
  unitNumber: string;
};

/** "John" from "John Smith" - the copy addresses people by first name. */
function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] || full;
}

/** "#1" from "#1" or "1" - the number is written with its hash. */
export function hashed(n: string): string {
  return n.startsWith("#") ? n : `#${n}`;
}

export function approvedToast(claim: StorageClaim): string {
  return `Storage ${hashed(claim.storageNumber)} approved for Unit ${claim.unitNumber}.`;
}

export function rejectedToast(claim: StorageClaim): string {
  return `Storage ${hashed(claim.storageNumber)} rejected. We'll let ${firstName(claim.residentName)} know.`;
}

/**
 * Buttons, to the house rule for a destructive pair: the affirmative is
 * the filled lime, the destructive is red TEXT in a red border with no
 * fill. A solid red button competes with the primary for attention and
 * reads as the expected action, which rejecting somebody's claim is
 * not.
 */
const dangerOutline: React.CSSProperties = {
  background: "transparent",
  border: "1px solid var(--color-text-error, #C73A3A)",
  color: "var(--color-text-error, #C73A3A)",
};

export function ApproveStorageDialog({
  claim,
  busy = false,
  onCancel,
  onConfirm,
}: {
  claim: StorageClaim | null;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!claim) return null;
  const n = hashed(claim.storageNumber);
  return (
    <Modal open onClose={onCancel} size="small" title={`Approve storage ${n} for ${claim.residentName}?`}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-24)" }}>
        <p style={{
          margin: 0,
          fontSize: "var(--font-size-tiny)",
          lineHeight: 1.6,
          color: "var(--color-text-weak)",
          fontFamily: "var(--font-family-body)",
        }}>
          Before approving, check your property management system to confirm
          storage {n} is assigned to Unit {claim.unitNumber}. Once approved,{" "}
          {firstName(claim.residentName)} can list it for rent.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--spacing-12)" }}>
          <Button variant="secondary" onClick={onCancel} disabled={busy}>Cancel</Button>
          <Button variant="primary" onClick={onConfirm} disabled={busy}>Approve</Button>
        </div>
      </div>
    </Modal>
  );
}

export function RejectStorageDialog({
  claim,
  busy = false,
  onCancel,
  onConfirm,
}: {
  claim: StorageClaim | null;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!claim) return null;
  const n = hashed(claim.storageNumber);
  return (
    <Modal open onClose={onCancel} size="small" title={`Reject storage ${n} for ${claim.residentName}?`}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-24)" }}>
        <p style={{
          margin: 0,
          fontSize: "var(--font-size-tiny)",
          lineHeight: 1.6,
          color: "var(--color-text-weak)",
          fontFamily: "var(--font-family-body)",
        }}>
          {firstName(claim.residentName)} will be asked to check the number and
          add the correct one.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--spacing-12)" }}>
          <Button variant="secondary" onClick={onCancel} disabled={busy}>Cancel</Button>
          <Button variant="secondary" style={dangerOutline} onClick={onConfirm} disabled={busy}>
            Reject
          </Button>
        </div>
      </div>
    </Modal>
  );
}
