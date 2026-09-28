"use client";

/**
 * EditBillingModal — collects billing-only fields (company, billing email, tax ID).
 *
 * Physical street/city/state/ZIP are read from the buildings table and shown
 * read-only at the top — we don't collect them on the subscription page because
 * they're already stored against the building record.
 */

import { useState } from "react";
import { Button } from "./Button";

interface BuildingAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface Props {
  onClose: () => void;
  onSave: (input: { company: string; email: string; taxId: string }) => void;
  saving: boolean;
  error: string;
  initial: { company: string; email: string; taxId: string };
  buildingAddress: BuildingAddress;
}

export function EditBillingModal({
  onClose,
  onSave,
  saving,
  error,
  initial,
  buildingAddress,
}: Props) {
  const [company, setCompany] = useState(initial.company);
  const [email,   setEmail]   = useState(initial.email);
  const [taxId,   setTaxId]   = useState(initial.taxId);
  const [localError, setLocalError] = useState("");

  const hasChanged =
    company !== initial.company ||
    email   !== initial.email   ||
    taxId   !== initial.taxId;

  function handleSave() {
    if (!company.trim()) {
      setLocalError("Company name is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setLocalError("Enter a valid billing email address.");
      return;
    }
    setLocalError("");
    onSave({ company: company.trim(), email: email.trim(), taxId: taxId.trim() });
  }

  const fullAddress = `${buildingAddress.street}, ${buildingAddress.city}, ${buildingAddress.state} ${buildingAddress.zip}`;

  const fieldLabel: React.CSSProperties = {
    display:       "block",
    fontFamily:    "var(--font-family-body)",
    fontSize:      "var(--font-size-extra-tiny)",
    fontWeight:    "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
    color:         "var(--color-text-weak)",
    marginBottom:  6,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };
  const inputStyle: React.CSSProperties = {
    width:        "100%",
    height:       40,
    padding:      "0 12px",
    fontFamily:   "var(--font-family-body)",
    fontSize:     "var(--font-size-tiny)",
    color:        "var(--color-text-strong)",
    background:   "var(--color-fill-white)",
    border:       "1px solid var(--color-stroke-medium)",
    borderRadius: "var(--radius-8)",
    outline:      "none",
    boxSizing:    "border-box",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position:       "fixed",
        inset:          0,
        zIndex:         500,
        background:     "rgba(0,0,0,0.45)",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        padding:        "var(--spacing-24)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background:    "var(--color-fill-white)",
          borderRadius:  "var(--radius-16)",
          width:         "100%",
          maxWidth:      520,
          boxShadow:     "0 16px 48px rgba(0,0,0,0.16)",
          padding:       "var(--spacing-24)",
          display:       "flex",
          flexDirection: "column",
          gap:           "var(--spacing-20)",
        }}
      >
        <div>
          <h2 style={{
            margin:     "0 0 4px",
            fontSize:   "var(--font-size-heading-3)",
            fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
            color:      "var(--color-text-strong)",
            fontFamily: "var(--font-family-heading)",
            lineHeight: "var(--line-height-heading-3)",
          }}>
            Edit Billing Information
          </h2>
          <p style={{
            margin:     0,
            fontSize:   "var(--font-size-tiny)",
            color:      "var(--color-text-weak)",
            fontFamily: "var(--font-family-body)",
            lineHeight: "var(--line-height-tiny)",
          }}>
            Used on every invoice and tax form.
          </p>
        </div>

        {/* Read-only building address */}
        <div style={{
          background:   "var(--color-fill-weak)",
          border:       "1px solid var(--color-stroke-medium)",
          borderRadius: "var(--radius-8)",
          padding:      "12px 14px",
        }}>
          <p style={{
            margin:       "0 0 4px",
            fontFamily:   "var(--font-family-body)",
            fontSize:     "var(--font-size-extra-tiny)",
            fontWeight:   500,
            color:        "var(--color-text-weak)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}>
            Mailing address (from building record)
          </p>
          <p style={{
            margin:     0,
            fontFamily: "var(--font-family-body)",
            fontSize:   "var(--font-size-tiny)",
            color:      "var(--color-text-strong)",
            lineHeight: "var(--line-height-tiny)",
          }}>
            {fullAddress}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label htmlFor="billing-company" style={fieldLabel}>Company name</label>
            <input
              id="billing-company"
              style={inputStyle}
              type="text"
              placeholder="The Meridian Homeowners Association, Inc."
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              autoComplete="organization"
            />
          </div>
          <div>
            <label htmlFor="billing-email" style={fieldLabel}>Billing email</label>
            <input
              id="billing-email"
              style={inputStyle}
              type="email"
              placeholder="billing@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="billing-tax-id" style={fieldLabel}>Tax ID (optional)</label>
            <input
              id="billing-tax-id"
              style={inputStyle}
              type="text"
              placeholder="47-3829104"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
            />
          </div>
        </div>

        {(localError || error) && (
          <p style={{ margin: 0, color: "var(--color-text-error)", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)" }}>
            {localError || error}
          </p>
        )}

        <div style={{ display: "flex", gap: "var(--spacing-12)", justifyContent: "flex-end" }}>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !hasChanged}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
