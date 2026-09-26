"use client";

import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { VerificationMethodSelect } from "./VerificationMethodSelect";
import { extractErrorMessage } from "@/lib/api";

interface BuildingFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  bmsKey: string;
  creditsPrice: string;
  adminName: string;
  adminEmail: string;
  verificationMethod: "" | "Signature" | "Verification";
}

interface FieldErrors {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  bmsKey?: string;
  creditsPrice?: string;
  adminName?: string;
  adminEmail?: string;
  verificationMethod?: string;
}

interface BuildingCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  /**
   * Admin emails already attached to an existing building. Used for a
   * client-side pre-flight check so the user sees a friendly inline error
   * before submitting. The backend's 409 remains authoritative; this is
   * purely UX.
   */
  existingAdminEmails?: string[];
}

/**
 * Price per credit is whole dollars, $6 to $25 — the range the gift
 * card reserve reference table covers (api-backend's
 * gift-card-pricing.ts). Outside it the reserve formula still returns a
 * number, so nothing would visibly break; the building would just be
 * running on a rate nobody priced. The backend rejects the same values,
 * this is the friendly version.
 */
const CREDIT_PRICE_MIN_DOLLARS = 6;
const CREDIT_PRICE_MAX_DOLLARS = 25;

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

export function BuildingCreateModal({ open, onClose, onCreated, existingAdminEmails }: BuildingCreateModalProps) {
  const [form, setForm] = useState<BuildingFormData>({
    name: "", address: "", city: "", state: "", zipCode: "",
    bmsKey: "",
    // Per-building price per credit, in whole dollars (display unit).
    // Sent as `creditsPriceCents = dollars * 100`. Default $6 matches
    // the DB column default (drizzle/0043) and the pilot rate.
    creditsPrice: "6",
    adminName: "", adminEmail: "",
    verificationMethod: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function set(field: keyof BuildingFormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): FieldErrors {
    const e: FieldErrors = {};
    if (!form.name.trim()) e.name = "Building name is required.";
    else if (form.name.trim().length < 3) e.name = "Building name must be at least 3 characters.";
    if (!form.address.trim()) e.address = "Address is required.";
    if (!form.city.trim()) e.city = "City is required.";
    if (!form.state) e.state = "State is required.";
    if (!form.zipCode.trim()) e.zipCode = "ZIP code is required.";
    else if (!/^\d{5}(-\d{4})?$/.test(form.zipCode.trim())) e.zipCode = "Enter a valid ZIP code (e.g. 78701).";
    if (form.bmsKey.trim().length > 255) e.bmsKey = "BMS key must be 255 characters or fewer.";
    const parsedPrice = Number.parseFloat(form.creditsPrice);
    if (!Number.isFinite(parsedPrice)) {
      e.creditsPrice = "Enter a valid price.";
    } else if (!Number.isInteger(parsedPrice)) {
      e.creditsPrice = "Price must be a whole dollar amount, with no cents.";
    } else if (
      parsedPrice < CREDIT_PRICE_MIN_DOLLARS ||
      parsedPrice > CREDIT_PRICE_MAX_DOLLARS
    ) {
      e.creditsPrice = `Price must be between $${CREDIT_PRICE_MIN_DOLLARS} and $${CREDIT_PRICE_MAX_DOLLARS}.`;
    }
    if (!form.adminName.trim()) e.adminName = "Admin name is required.";
    if (!form.adminEmail.trim()) e.adminEmail = "Admin email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail.trim())) e.adminEmail = "Enter a valid email address.";
    else if (
      existingAdminEmails?.some(
        (em) => em.toLowerCase() === form.adminEmail.trim().toLowerCase(),
      )
    ) {
      e.adminEmail = "An admin with this email already manages another building.";
    }
    if (!form.verificationMethod) e.verificationMethod = "Verification method is required.";
    return e;
  }

  async function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/buildings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          state: form.state,
          zipCode: form.zipCode.trim(),
          // Optional BMS key — exact Property Name the building's data export uses.
          // Persisted to buildings.bms_property_name so the daily import can
          // correlate this building. Blank → backend defaults to the building name.
          bmsKey: form.bmsKey.trim() ? form.bmsKey.trim() : undefined,
          // Per-building price per credit, in integer cents. Send dollars
          // → cents at the API boundary so the input stays user-friendly.
          creditsPriceCents: Math.round(parseFloat(form.creditsPrice) * 100),
          adminName: form.adminName.trim(),
          adminEmail: form.adminEmail.trim(),
          verificationMethod: form.verificationMethod,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: unknown; id?: string };
      if (!res.ok) {
        setSubmitError(extractErrorMessage(data, "Failed to create building. Please try again."));
        return;
      }
      onCreated?.();
      onClose();
      setForm({ name: "", address: "", city: "", state: "", zipCode: "", bmsKey: "", creditsPrice: "6.00", adminName: "", adminEmail: "", verificationMethod: "" });
      setErrors({});
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }



  const sectionStyle: React.CSSProperties = {
    marginBottom: "var(--spacing-20)",
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: "var(--font-size-tiny)",
    fontFamily: "var(--font-family-body)",
    fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
    color: "var(--color-text-weak)",
    marginBottom: "var(--spacing-12)",
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
  };

  const grid2: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "var(--spacing-12)",
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Building" size="large">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-16)" }}>

        {/* ── Building Information ── */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>Building Information</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-12)" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Input label="Building Name *" error={errors.name} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Sunset Ridge Condominiums" />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Input label="Street Address *" error={errors.address} value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="123 Main Street" />
            </div>
            <div style={grid2}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <Input label="City *" error={errors.city} value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Austin" />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <Input label="State *" error={errors.state} value={form.state} onChange={(e) => set("state", e.target.value)} placeholder="Select…" />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
                <Input label="ZIP Code *" error={errors.zipCode} value={form.zipCode} onChange={(e) => set("zipCode", e.target.value)} placeholder="78701" />
              </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Input
                label="BMS key (optional)"
                error={errors.bmsKey}
                value={form.bmsKey}
                onChange={(e) => set("bmsKey", e.target.value)}
                placeholder="Leave blank to use your building name"
                maxLength={255}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Input
                label="Price per Credit (USD) *"
                error={errors.creditsPrice}
                value={form.creditsPrice}
                onChange={(e) => set("creditsPrice", e.target.value)}
                placeholder="6"
                type="number"
                min={String(CREDIT_PRICE_MIN_DOLLARS)}
                max={String(CREDIT_PRICE_MAX_DOLLARS)}
                step="1"
              />
            </div>
            <VerificationMethodSelect
              id="building-verification-method"
              value={form.verificationMethod}
              onChange={(v) => set("verificationMethod", v)}
              error={errors.verificationMethod}
            />
          </div>
        </div>

        {/* ── Admin Account ── */}
        <div style={{ ...sectionStyle, borderTop: "1px solid var(--color-stroke-medium)", paddingTop: "var(--spacing-20)" }}>
          <div style={sectionTitle}>Building Admin Account</div>
          <p style={{ fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", margin: "0 0 var(--spacing-12)", fontFamily: "var(--font-family-body)" }}>
            An invitation email will be sent to the admin to set up their account.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-12)" }}>
            <div style={grid2}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <Input label="Admin Name *" error={errors.adminName} value={form.adminName} onChange={(e) => set("adminName", e.target.value)} placeholder="Jane Smith" />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <Input label="Admin Email *" error={errors.adminEmail} value={form.adminEmail} onChange={(e) => set("adminEmail", e.target.value)} placeholder="admin@example.com" type="email" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Submit error ── */}
        {submitError && (
          <div style={{
            padding: "var(--spacing-12) var(--spacing-16)",
            background: "var(--color-red-50)",
            border: "1px solid var(--color-red-600)",
            borderRadius: "var(--radius-8)",
            fontSize: "var(--font-size-tiny)",
            color: "var(--color-red-1000)",
            fontFamily: "var(--font-family-body)",
          }}>
            {submitError}
          </div>
        )}

        {/* ── Actions ── */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--spacing-12)", paddingTop: "var(--spacing-4)" }}>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: "10px 20px",
              border: "1px solid var(--color-stroke-medium)",
              borderRadius: "var(--radius-8)",
              background: "var(--color-fill-white)",
              fontFamily: "var(--font-family-body)",
              fontSize: "var(--font-size-tiny)",
              color: "var(--color-text-strong)",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: "var(--radius-8)",
              background: "var(--color-fill-accent)",
              fontFamily: "var(--font-family-body)",
              fontSize: "var(--font-size-tiny)",
              // Fixed brand color, doesn't invert in dark mode — keep text dark.
              color: "#222222",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? "Creating…" : "Create Building"}
          </button>
        </div>
      </div>
    </Modal>
  );
}