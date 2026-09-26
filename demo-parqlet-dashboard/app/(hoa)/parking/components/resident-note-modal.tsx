"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { updateResidentNote } from "@/lib/api/residents";
import type { Resident } from "./types";

const NOTE_MAX = 5000;

function IcClose() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6l12 12" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IcDocumentLg() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <rect x="8" y="5" width="24" height="30" rx="3" stroke="var(--color-icon-weak)" strokeWidth="1.5" />
      <path d="M14 14h12M14 20h12M14 26h8" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ResidentNoteModal({
  resident,
  onClose,
  onSaved,
}: {
  resident: Resident;
  onClose: () => void;
  onSaved?: (note: string) => void;
}) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState(resident.note ?? "");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (note: string) => updateResidentNote(resident.id, note),
    onSuccess: (data) => {
      setError(null);
      onSaved?.(data.note);
      qc.invalidateQueries({ queryKey: ["residents"] });
      onClose();
    },
    onError: (err: Error) => {
      setError(err.message ?? "Failed to save note");
    },
  });

  function handleSave() {
    mutation.mutate(draft.trim());
  }

  const label: React.CSSProperties = {
    fontSize: "var(--font-size-extra-tiny)",
    color: "var(--color-text-weak)",
    lineHeight: "var(--line-height-extra-tiny)",
    fontFamily: "var(--font-family-body)",
    fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
    display: "block",
    marginBottom: "var(--spacing-4)",
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget && !mutation.isPending) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(0,0,0,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "var(--spacing-24)",
      }}
    >
      <div style={{
        background: "var(--color-fill-white)",
        borderRadius: "var(--radius-24)",
        width: "90%", maxWidth: 460, maxHeight: "85vh", overflowY: "auto",
        boxSizing: "border-box" as React.CSSProperties["boxSizing"],
        position: "relative", padding: "var(--spacing-32)",
        fontFamily: "var(--font-family-body)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--spacing-24)" }}>
          <h2 style={{
            margin: 0,
            fontSize: "var(--font-size-heading-3)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            lineHeight: "var(--line-height-heading-3)",
            color: "var(--color-text-strong)",
            fontFamily: "var(--font-family-heading)",
          }}>
            Resident note
          </h2>
          <button
            onClick={onClose}
            disabled={mutation.isPending}
            style={{ background: "none", border: "none", cursor: mutation.isPending ? "default" : "pointer", padding: 0, display: "flex" }}
          >
            <IcClose />
          </button>
        </div>

        {/* Icon */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "var(--spacing-24)" }}>
          <div style={{
            width: 100, height: 100, borderRadius: "var(--radius-20)",
            background: "var(--color-gray-5)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <IcDocumentLg />
          </div>
        </div>

        {/* Resident info */}
        <div>
          <span style={label}>Resident</span>
          <span style={{
            fontSize: "var(--font-size-body)",
            fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
            color: "var(--color-text-strong)",
            lineHeight: "var(--line-height-body)",
            display: "block",
          }}>
            {resident.name}
          </span>
          <span style={{ ...label, marginTop: "var(--spacing-4)" }}>
            Unit {resident.unitNumber ?? "—"}{resident.parkingSpotNumbers ? ` · Spot ${resident.parkingSpotNumbers}` : ""}
          </span>
        </div>

        <div style={{ borderBottom: "1px solid var(--color-stroke-medium)", margin: "var(--spacing-16) 0" }} />

        {/* Note textarea */}
        <span style={label}>Note</span>
        <div style={{
          background: "var(--color-gray-5)",
          borderRadius: "var(--radius-12)",
          padding: "var(--spacing-12)",
          marginBottom: "var(--spacing-8)",
        }}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, NOTE_MAX))}
            placeholder="Add a note about this resident (visible to HOA staff)"
            rows={6}
            disabled={mutation.isPending}
            style={{
              width: "100%", border: "none", outline: "none",
              background: "transparent", resize: "none",
              fontSize: "var(--font-size-tiny)",
              color: "var(--color-text-strong)",
              lineHeight: "var(--line-height-tiny)",
              fontFamily: "var(--font-family-body)",
              fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-24)" }}>
          <span style={{ ...label, marginBottom: 0, color: error ? "var(--color-fill-error)" : undefined }}>
            {error ?? ""}
          </span>
          <span style={{ ...label, display: "inline", marginBottom: 0 }}>
            {draft.length} / {NOTE_MAX}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--spacing-8)" }}>
          <Button
            variant="neutral"
            size="small"
            disabled={mutation.isPending}
            onClick={onClose}
            style={{ width: "auto" }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="small"
            disabled={mutation.isPending}
            onClick={handleSave}
            style={{ width: "auto" }}
          >
            {mutation.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}