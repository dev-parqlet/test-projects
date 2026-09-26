"use client";

/**
 * Single source of truth for the Verification Method select.
 *
 * Used by both `BuildingCreateModal` (create flow) and the super-admin
 * detail page edit modal. Wire format is PascalCase ("Signature" |
 * "Verification") to match the backend's pgEnum; the human label shown
 * in the dropdown is "By Signature" / "By Verification".
 */

export type VerificationMethodValue = "Signature" | "Verification";

export const VERIFICATION_METHOD_OPTIONS: { value: VerificationMethodValue; label: string }[] = [
  { value: "Signature",    label: "By Signature" },
  { value: "Verification", label: "By Verification" },
];

interface VerificationMethodSelectProps {
  value: VerificationMethodValue | "";
  onChange: (v: VerificationMethodValue) => void;
  error?: string;
  id?: string;
}

export function VerificationMethodSelect({ value, onChange, error, id }: VerificationMethodSelectProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <label
        htmlFor={id}
        style={{
          fontFamily: "var(--font-family-body)",
          fontSize: "var(--font-size-extra-tiny)",
          fontWeight: "var(--font-weight-medium)",
          lineHeight: "var(--line-height-extra-tiny)",
          color: "var(--color-text-strong)",
          marginBottom: "var(--spacing-4)",
          display: "block",
        }}
      >
        Verification Method *
      </label>
      <div style={{ position: "relative" }}>
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as VerificationMethodValue)}
          style={{
            width: "100%",
            height: 40,
            padding: "0 var(--spacing-32) 0 var(--spacing-12)",
            border: error ? "1px solid var(--color-fill-error)" : "1px solid var(--color-stroke-medium)",
            borderRadius: "var(--radius-8)",
            background: "var(--color-fill-white)",
            fontFamily: "var(--font-family-body)",
            fontSize: "var(--font-size-tiny)",
            lineHeight: "var(--line-height-tiny)",
            fontWeight: "var(--font-weight-medium)",
            color: "var(--color-text-strong)",
            cursor: "pointer",
            outline: "none",
            appearance: "none",
            WebkitAppearance: "none",
            boxSizing: "border-box",
          }}
        >
          <option value="" disabled>Select…</option>
          {VERIFICATION_METHOD_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
        >
          <path d="M6 9l6 6 6-6" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {error && (
        <span style={{
          fontFamily: "var(--font-family-body)",
          fontSize: "var(--font-size-extra-tiny)",
          color: "var(--color-fill-error)",
          marginTop: 4,
          display: "block",
        }}>
          {error}
        </span>
      )}
    </div>
  );
}