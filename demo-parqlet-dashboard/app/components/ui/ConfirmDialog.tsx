"use client";

/**
 * "Are you sure?" over a shared `Modal`.
 *
 * For a change that is one click, takes effect for everybody in the
 * building at once, and has no undo button next to it - turning a
 * feature off being the case this was written for. A toggle that
 * silently removes a page from every manager's sidebar and a screen
 * from every resident's app should cost one more click than a toggle
 * that does not.
 *
 * Not for destructive deletes, which say what is being deleted and
 * usually need their own copy. This one takes the whole question.
 */

import { Button } from "./Button";
import { Modal } from "./Modal";

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Yes, change it",
  cancelLabel = "Cancel",
  destructive = false,
  isPending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  /** The consequence, in the words the person needs. Keep it short. */
  body: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="small">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-24)" }}>
        <div style={{
          margin: 0,
          fontSize: "var(--font-size-tiny)",
          lineHeight: "var(--line-height-body)",
          color: "var(--color-text-weak)",
          fontFamily: "var(--font-family-body)",
        }}>
          {body}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--spacing-8)" }}>
          <Button variant="secondary" onClick={onCancel} disabled={isPending}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "danger" : "primary"}
            onClick={onConfirm}
            loading={isPending}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
