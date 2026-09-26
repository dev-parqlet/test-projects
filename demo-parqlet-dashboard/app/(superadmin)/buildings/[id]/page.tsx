"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  buildingKeys,
  getBuilding,
  updateBuildingSettings,
  updateBuildingAdminContact,
  type VerificationMethod,
} from "@/lib/api/buildings";
import { listAlerts, listSyncLogs, listTickets } from "@/lib/api/super-admin";
import { fmtDate, fmtTime } from "@/lib/dates";
import { IdDisplay } from "../../../components/ui/IdDisplay";
import { TableScroll } from "../../../components/ui/TableScroll";
import { TableHeadLabel } from "../../../components/ui/TableHeadLabel";
import { CopyableCell } from "../../../components/ui/CopyableCell";
import { Modal } from "@/components/ui/Modal";
import { VerificationMethodSelect } from "@/components/buildings/VerificationMethodSelect";
import { pauseSubscription, resumeSubscription } from "@/lib/api/subscriptions";
import { listBookings } from "@/lib/api/bookings";
import { extractErrorMessage } from "@/lib/api/errors";
import { useWindowWidth } from "../../../components/hooks/useWindowSize";
import "../../../tokens.css";

// Contract expiry = 1 year after the building's first payment. There's no
// dedicated "first payment date" field, but onboardedDate is the closest
// available proxy (subscription start ~= onboarding) and doesn't need a
// backend change — the backend's own `contractExpiry` field currently just
// aliases nextRenewalDate, which is a different date entirely.
function contractExpiryFromOnboarding(onboardedDate: string | null | undefined): string | null {
  if (!onboardedDate) return null;
  const d = new Date(onboardedDate);
  if (isNaN(d.getTime())) return null;
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--color-fill-white)", border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-12)", overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-stroke-medium)", background: "var(--color-fill-white)" }}>
        <span style={{ fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)" }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function StatRow({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: "1px solid var(--color-stroke-medium)" }}>
      <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", whiteSpace: "nowrap", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: "var(--font-size-tiny)", color: accent ? "var(--color-text-accent)" : "var(--color-text-strong)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], fontFamily: "var(--font-family-body)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" }}>{value}</span>
    </div>
  );
}

const modalInputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid var(--color-stroke-medium)",
  borderRadius: "var(--radius-8)",
  padding: "10px var(--spacing-12)",
  fontFamily: "var(--font-family-body)",
  fontSize: "var(--font-size-tiny)",
  color: "var(--color-text-strong)",
  background: "var(--color-fill-white)",
  outline: "none",
};
const modalGhostBtnStyle: React.CSSProperties = {
  padding: "10px 16px", border: "none", borderRadius: "var(--radius-8)", background: "none",
  fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", cursor: "pointer",
};
const modalOutlineBtnStyle: React.CSSProperties = {
  padding: "10px 20px", border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-8)",
  background: "var(--color-fill-white)", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", cursor: "pointer",
};
const modalPrimaryBtnStyle: React.CSSProperties = {
  padding: "10px 20px", border: "none", borderRadius: "var(--radius-8)", background: "var(--color-fill-accent)",
  // Fixed brand color, doesn't invert in dark mode — keep text dark.
  fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)", color: "#222222", cursor: "pointer",
};

function EditableRow({ label, value, onEdit, ariaLabel }: { label: string; value: string; onEdit: () => void; ariaLabel: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: "1px solid var(--color-stroke-medium)" }}>
      <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", whiteSpace: "nowrap", flexShrink: 0 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <span style={{ fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
        <button
          onClick={onEdit}
          aria-label={ariaLabel}
          style={{ background: "none", border: "none", padding: 2, cursor: "pointer", display: "flex", alignItems: "center", color: "var(--color-icon-weak)", flexShrink: 0 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

function residentImportLabel(type?: "bms" | "upload" | null): string {
  if (type === "bms") return "Building management system sync";
  if (type === "upload") return "Manual file upload";
  return "—";
}

function VerificationMethodRow({ method, onEdit }: { method: VerificationMethod | null; onEdit: () => void }) {
  const label =
    method === "Signature" ? "By Signature"
    : method === "Verification" ? "By Verification"
    : "—";
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid var(--color-stroke-medium)" }}>
      <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" }}>Verification Method</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)" }}>{label}</span>
        <button
          onClick={onEdit}
          aria-label="Edit verification method"
          style={{ background: "none", border: "none", padding: 2, cursor: "pointer", display: "flex", alignItems: "center", color: "var(--color-icon-weak)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Whole dollars, $6 to $25 — the range the gift card reserve reference
 * table covers (api-backend's gift-card-pricing.ts). The backend
 * rejects anything else; these are the same bounds, stated in the UI so
 * an admin is told before they submit. Kept in step with
 * BuildingCreateModal.tsx.
 */
const CREDIT_PRICE_MIN_DOLLARS = 6;
const CREDIT_PRICE_MAX_DOLLARS = 25;

function PricePerCreditRow({ price, onSave, isPending }: { price: number; onSave: (p: number) => void | Promise<void>; isPending?: boolean }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(String(price));
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    // `!Number.isFinite` (not `isNaN`) — Infinity / -Infinity parse to
    // finite numbers by isNaN's definition, so without this guard the
    // optimistic cache write could pin the UI to an invalid value. The
    // create-modal form uses the same checks (BuildingCreateModal.tsx).
    const val = parseFloat(draft);
    if (!Number.isFinite(val)) {
      setError("Enter a valid price.");
      return;
    }
    if (!Number.isInteger(val)) {
      setError("Price must be a whole dollar amount, with no cents.");
      return;
    }
    if (val < CREDIT_PRICE_MIN_DOLLARS || val > CREDIT_PRICE_MAX_DOLLARS) {
      setError(`Price must be between $${CREDIT_PRICE_MIN_DOLLARS} and $${CREDIT_PRICE_MAX_DOLLARS}.`);
      return;
    }
    setError(null);
    await onSave(val);
    setOpen(false);
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px" }}>
        <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" }}>Price per Credit</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)" }}>
            ${price.toFixed(2)}
          </span>
          <button
            onClick={() => { setDraft(String(price)); setError(null); setOpen(true); }}
            style={{ background: "none", border: "none", padding: 2, cursor: "pointer", display: "flex", alignItems: "center", color: "var(--color-icon-weak)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--spacing-16)", boxSizing: "border-box" }}
        >
          <div style={{ background: "var(--color-fill-white)", borderRadius: "var(--radius-16)", width: "100%", maxWidth: 400, fontFamily: "var(--font-family-body)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: "1px solid var(--color-stroke-medium)" }}>
              <span style={{ fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--color-text-strong)" }}>Set Price per Credit</span>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--color-icon-weak)", display: "flex" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ margin: 0, fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)" }}>
                Whole dollars from ${CREDIT_PRICE_MIN_DOLLARS} to ${CREDIT_PRICE_MAX_DOLLARS}. This sets what a credit
                costs here, and with it how many credits fund a $25 gift card.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)" }}>Price per credit ($)</label>
                <input
                  type="number"
                  min={CREDIT_PRICE_MIN_DOLLARS}
                  max={CREDIT_PRICE_MAX_DOLLARS}
                  step="1"
                  value={draft}
                  onChange={(e) => { setDraft(e.target.value); setError(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                  style={{
                    border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-8)",
                    padding: "10px 12px", fontSize: "var(--font-size-tiny)",
                    fontFamily: "var(--font-family-body)", color: "var(--color-text-strong)",
                    background: "var(--color-fill-white)", outline: "none", width: "100%",
                    boxSizing: "border-box" as React.CSSProperties["boxSizing"],
                  }}
                  autoFocus
                />
                {error != null && (
                  <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-tag-text-expired)" }}>
                    {error}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button
                  onClick={() => setOpen(false)}
                  style={{ padding: "8px 16px", borderRadius: "var(--radius-8)", border: "1px solid var(--color-stroke-medium)", background: "none", cursor: "pointer", fontSize: "var(--font-size-tiny)", fontFamily: "var(--font-family-body)", color: "var(--color-text-strong)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  style={{ padding: "8px 16px", borderRadius: "var(--radius-8)", border: "none", background: "var(--color-fill-strong)", cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.6 : 1, fontSize: "var(--font-size-tiny)", fontFamily: "var(--font-family-body)", color: "var(--color-text-white)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"] }}
                >
                  {isPending ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StatusPill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      background: bg, color,
      borderRadius: "var(--radius-48)",
      padding: "3px 10px",
      fontSize: "var(--font-size-extra-tiny)",
      fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
      fontFamily: "var(--font-family-body)",
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

// Lightweight toast — single-line pill at the bottom-center. Auto-dismisses
// after 4s. Mirrors the useToast() pattern in app/(hoa)/subscription/page.tsx
// (kept local because no shared toast module exists yet).
function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  function show(text: string) {
    setMsg(text);
    if (typeof window !== "undefined") {
      window.setTimeout(() => setMsg(null), 4000);
    }
  }
  const node = msg ? (
    <div
      role="status"
      style={{
        position: "fixed",
        bottom: "var(--spacing-32)",
        left: "50%",
        transform: "translateX(-50%)",
        background: "var(--color-fill-strong)",
        color: "var(--color-text-white)",
        padding: "var(--spacing-12) var(--spacing-24)",
        borderRadius: "var(--radius-12)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
        fontFamily: "var(--font-family-body)",
        fontSize: "var(--font-size-tiny)",
        fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
        zIndex: 3000,
        whiteSpace: "nowrap",
      }}
    >
      {msg}
    </div>
  ) : null;
  return { show, node };
}

// Pause / Resume action row at the bottom of the "Subscription & Billing"
// card. One button at a time — "Pause Subscription" when Active, "Resume
// Subscription" when Paused. The backend route is idempotent so a double-click
// is safe.
function PauseResumeRow({
  isPaused,
  pausePending,
  resumePending,
  onPauseClick,
  onResumeClick,
}: {
  isPaused: boolean;
  pausePending: boolean;
  resumePending: boolean;
  onPauseClick: () => void;
  onResumeClick: () => void;
}) {
  const buttonStyle: React.CSSProperties = {
    padding: "8px 16px",
    borderRadius: "var(--radius-8)",
    border: "1px solid var(--color-stroke-medium)",
    background: "var(--color-fill-white)",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-strong)",
    cursor: "pointer",
  };
  return (
    <div
      style={{
        padding: "12px 20px",
        display: "flex",
        justifyContent: "flex-end",
        gap: 8,
        borderTop: "1px solid var(--color-stroke-medium)",
        background: "var(--color-fill-white)",
      }}
    >
      {isPaused ? (
        <button
          type="button"
          aria-label="Resume subscription"
          onClick={onResumeClick}
          disabled={resumePending}
          style={buttonStyle}
        >
          {resumePending ? "Resuming…" : "Resume Subscription"}
        </button>
      ) : (
        <button
          type="button"
          aria-label="Pause subscription"
          onClick={onPauseClick}
          disabled={pausePending}
          style={buttonStyle}
        >
          {pausePending ? "Pausing…" : "Pause Subscription"}
        </button>
      )}
    </div>
  );
}

function SkeletonBlock({ height = 16, width = "60%", style }: { height?: number; width?: string; style?: React.CSSProperties }) {
  return (
    <div style={{
      height,
      width,
      borderRadius: 4,
      background: "var(--color-stroke-light)",
      animation: "pulse 1.5s infinite",
      ...style,
    }} />
  );
}

export default function BuildingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const windowWidth = useWindowWidth();
  const TICKETS_PER_PAGE = 10;
  const [ticketPage, setTicketPage] = useState(0);
  // Reset ticket pagination when navigating to a different building
  useEffect(() => { setTicketPage(0); }, [id]);

  // Verification Method edit state
  const queryClient = useQueryClient();
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyDraft, setVerifyDraft] = useState<VerificationMethod | "">("");

  function openVerifyModal() {
    setVerifyDraft(building?.verificationMethod ?? "");
    setVerifyOpen(true);
  }

  async function handleVerifySave() {
    if (!verifyDraft) return;
    // Optimistic update of the detail cache
    queryClient.setQueryData(buildingKeys.detail(id), (prev: typeof building) =>
      prev ? { ...prev, verificationMethod: verifyDraft } : prev
    );
    try {
      await updateBuildingSettings(id, { verificationMethod: verifyDraft });
      setVerifyOpen(false);
    } catch {
      // Roll back on error
      queryClient.invalidateQueries({ queryKey: buildingKeys.detail(id) });
    }
  }

  // Price-per-credit save (PricePerCreditRow in the "Bookings & Credits"
  // card). Dollars on the wire to the row → cents to the backend. The
  // optimistic update lives on the cached `building.creditsPriceCents`
  // (set below); the row reads that directly via its `price` prop, so no
  // mirrored local state is needed. Toast on failure so the user gets
  // feedback even though the dialog has already closed.
  const [priceSaving, setPriceSaving] = useState(false);
  async function handlePriceSave(dollars: number) {
    if (priceSaving) return;
    setPriceSaving(true);
    const cents = Math.round(dollars * 100);
    queryClient.setQueryData(buildingKeys.detail(id), (prev: typeof building) =>
      prev ? { ...prev, creditsPriceCents: cents } : prev
    );
    try {
      await updateBuildingSettings(id, { creditsPriceCents: cents });
    } catch (err) {
      queryClient.invalidateQueries({ queryKey: buildingKeys.detail(id) });
      toast.show(extractErrorMessage(err, "Could not save price per credit"));
    } finally {
      setPriceSaving(false);
    }
  }

  // HOA contact (name + email) edit state — one dialog so that changing the
  // contact to a different person updates the name and email together, and the
  // invite goes out with the NEW name.
  const [contactOpen, setContactOpen] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSaving, setContactSaving] = useState(false);

  function openContactModal() {
    setContactName(building?.hoaContact ?? "");
    setContactEmail(building?.hoaEmail ?? "");
    setContactError(null);
    setContactOpen(true);
  }

  async function handleContactSave(invite: boolean) {
    if (contactSaving) return;
    const name = contactName.trim();
    const email = contactEmail.trim();
    if (!email) { setContactError("Enter an email address."); return; }
    // Never invite a new person addressed by a stale/blank name — require the
    // name before sending the invite.
    if (invite && !name) {
      setContactError("First add the contact name so that we have the contact name first.");
      return;
    }
    if (!name) { setContactError("Enter a contact name."); return; }
    setContactError(null);
    setContactSaving(true);
    queryClient.setQueryData(buildingKeys.detail(id), (prev: typeof building) =>
      prev ? { ...prev, hoaContact: name, hoaEmail: email } : prev
    );
    try {
      await updateBuildingAdminContact(id, { name, email, invite });
      setContactOpen(false);
    } catch {
      queryClient.invalidateQueries({ queryKey: buildingKeys.detail(id) });
      setContactError("Could not save — that email may already be in use.");
    } finally {
      setContactSaving(false);
    }
  }

  // ─── Pause / Resume (superadmin override) ─────────────────────────────────
  // The backend's POST /api/buildings/:id/subscription/{pause,resume} flips
  // the subscription.status between "Active" and "Paused" without touching
  // Stripe billing — a guest-booking guardrail, not a cancellation. The
  // route is superadmin-only on the backend; the dashboard route group
  // (superadmin) is the second layer of access control.
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const toast = useToast();

  const pauseMutation = useMutation({
    mutationFn: () => pauseSubscription(id),
    onSuccess: () => {
      // Optimistically flip the building's status so the StatusPill + button
      // update immediately, then invalidate to pull the canonical row.
      queryClient.setQueryData(buildingKeys.detail(id), (prev: typeof building) =>
        prev ? { ...prev, subscriptionStatus: "Paused" } : prev
      );
      queryClient.invalidateQueries({ queryKey: buildingKeys.detail(id) });
      toast.show("Subscription paused");
      setShowPauseModal(false);
    },
    onError: (err) => {
      toast.show(extractErrorMessage(err, "Could not pause subscription"));
    },
  });

  const resumeMutation = useMutation({
    mutationFn: () => resumeSubscription(id),
    onSuccess: () => {
      queryClient.setQueryData(buildingKeys.detail(id), (prev: typeof building) =>
        prev ? { ...prev, subscriptionStatus: "Active" } : prev
      );
      queryClient.invalidateQueries({ queryKey: buildingKeys.detail(id) });
      toast.show("Subscription resumed");
      setShowResumeModal(false);
    },
    onError: (err) => {
      toast.show(extractErrorMessage(err, "Could not resume subscription"));
    },
  });

  // Fetch building
  const { data: building, isLoading: buildingLoading, isError: buildingError } = useQuery({
    queryKey: ["buildings", id],
    queryFn: () => getBuilding(id),
  });

  // Fetch alerts for this building
  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ["alerts", "building", id],
    queryFn: () => listAlerts({ buildingId: id }),
  });
  const alerts = alertsData?.data ?? [];

  // Fetch sync logs for this building (latest 5)
  const { data: syncsData, isLoading: syncsLoading } = useQuery({
    queryKey: ["sync-logs", "building", id],
    queryFn: async () => {
      const res = await listSyncLogs({ buildingId: id });
      return { data: res.data.slice(0, 5), total: res.total, page: res.page, pageSize: res.pageSize };
    },
  });
  const syncs = syncsData?.data ?? [];

  // Full booking list for this building — used to break "Total Bookings"
  // down by status (Cancelled, Awaiting confirmation, etc.), which the
  // building-detail API only pre-aggregates for a few statuses. `tab: ""`
  // bypasses the chronological tab filter entirely (see
  // api-backend routes/bookings.ts) so this returns every booking
  // regardless of status or date, not just "current"/"past"/"future".
  const { data: buildingBookingsData, isLoading: buildingBookingsLoading } = useQuery({
    queryKey: ["bookings", "building", id, "all-statuses"],
    queryFn: () => listBookings({ buildingId: id, tab: "", pageSize: 500 }),
  });
  const buildingBookings = buildingBookingsData?.data ?? [];
  const cancelledBookingsCount = buildingBookings.filter((b) => b.status === "Cancelled").length;
  const awaitingConfirmationCount = buildingBookings.filter((b) => b.status === "Draft" || b.status === "PendingApproval").length;
  // "Active" = the booking's window currently covers now — distinct from
  // "Upcoming" (spot assigned, hasn't started yet). `bookings.status` never
  // actually gets set to "Active" anywhere in the backend (the mobile app's
  // own "Active" badge is date-derived, not status-derived — see
  // mobile-app/features/bookings-tab/format.ts `timingOf`), so this mirrors
  // that same live-window check instead of filtering on a status value
  // nothing ever writes.
  const nowMs = Date.now();
  const activeBookingsCount = buildingBookings.filter((b) => {
    if (b.status !== "Assigned") return false;
    const start = new Date(b.bookingStartIso).getTime();
    const end = new Date(b.bookingEndIso).getTime();
    return start <= nowMs && nowMs <= end;
  }).length;

  // Fetch tickets for this building
  const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
    queryKey: ["tickets", "building", id],
    queryFn: () => listTickets({ buildingId: id }),
  });
  const tickets = ticketsData?.data ?? [];

  if (buildingError) {
    return (
      <div style={{ padding: "var(--spacing-24)", fontFamily: "var(--font-family-body)", color: "var(--color-text-weak)" }}>
        Failed to load building data.{" "}
        <Link href="/buildings" style={{ color: "var(--color-text-accent)" }}>← Back to Buildings</Link>
      </div>
    );
  }

  if (!buildingLoading && !building) {
    return (
      <div style={{ padding: "var(--spacing-24)", fontFamily: "var(--font-family-body)", color: "var(--color-text-weak)" }}>
        Building not found.{" "}
        <Link href="/buildings" style={{ color: "var(--color-text-accent)" }}>← Back to Buildings</Link>
      </div>
    );
  }

  const subColor = building?.subscriptionStatus === "Active" ? { bg: "var(--color-tag-active)",  color: "var(--color-tag-text-active)"  }
    : building?.subscriptionStatus === "Overdue"       ? { bg: "var(--color-tag-expired)", color: "var(--color-tag-text-expired)" }
    : building?.subscriptionStatus === "Inactive"      ? { bg: "var(--color-tag-stats)",   color: "var(--color-text-strong)" }
    : building?.subscriptionStatus === "Paused"        ? { bg: "var(--color-tag-pending)", color: "var(--color-tag-text-pending)" }
    : { bg: "var(--color-tag-pending)", color: "var(--color-tag-text-pending)" };

  const syncDotColor = building?.syncStatus === "Success" ? "var(--color-green-600)"
    : building?.syncStatus === "Failed" ? "var(--color-red-600)"
    : building?.syncStatus === "Not Synced" ? "var(--color-stroke-strong)"
    : "var(--color-mustard-600)";

  const severityColor = (sev: string) => sev === "Critical" ? "var(--color-tag-text-expired)" : sev === "Warning" ? "var(--color-tag-text-pending)" : "var(--color-tag-text-upcoming)";
  const severityBg    = (sev: string) => sev === "Critical" ? "var(--color-tag-expired)"      : sev === "Warning" ? "var(--color-tag-pending)"      : "var(--color-tag-upcoming)";

  const ticketStatusColor = (s: string) => s === "Open" ? { bg: "var(--color-tag-expired)", color: "var(--color-tag-text-expired)" }
    : s === "In Progress" ? { bg: "var(--color-tag-pending)", color: "var(--color-tag-text-pending)" }
    : { bg: "var(--color-tag-active)", color: "var(--color-tag-text-active)" };

  return (
    <div style={{ padding: "var(--spacing-24)", display: "flex", flexDirection: "column", gap: "var(--spacing-24)", fontFamily: "var(--font-family-body)" }}>

      {/* Breadcrumb + Title */}
      <div>
        <Link href="/buildings" style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", textDecoration: "none", fontFamily: "var(--font-family-body)" }}>
          ← Buildings
        </Link>
        {buildingLoading ? (
          <SkeletonBlock height={32} width="50%" style={{ marginTop: 8 }} />
        ) : building ? (
          <>
            <h1 style={{ margin: "8px 0 0", fontSize: "var(--font-size-heading-1)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-heading-1)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-heading)" }}>
              {building.name}
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: "var(--font-size-body)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" }}>
              {building.address}, {building.city}
            </p>
          </>
        ) : null}
      </div>

      {/* Two-column layout — reflows to a single column below ~600px so the
          cards inside (HOA contact, email, etc.) never get squeezed enough
          to overlap/truncate their label-value rows. */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${windowWidth > 1100 ? 520 : 320}px, 1fr))`, gap: "var(--spacing-16)" }}>

        {/* Building Profile */}
        <SectionCard title="Building Profile">
          {buildingLoading ? (
            <>
              <StatRow label="HOA Contact" value="—" />
              <StatRow label="Email" value="—" />
              <StatRow label="Units" value="—" />
              <StatRow label="Onboarded" value="—" />
              <StatRow label="Sync Platform" value="—" />
              <StatRow label="Verification Method" value="—" />
              <StatRow label="Type of resident data import" value="—" />
            </>
          ) : building ? (
            <>
              <EditableRow label="HOA Contact" value={building.hoaContact} onEdit={openContactModal} ariaLabel="Edit HOA contact" />
              <StatRow label="Email" value={building.hoaEmail} />
              <StatRow label="Units" value={building.units} />
              <StatRow label="Onboarded" value={fmtDate(building.onboardedDate)} />
              <StatRow label="Sync Platform" value={building.syncPlatform ?? "—"} />
              <VerificationMethodRow method={building.verificationMethod ?? null} onEdit={openVerifyModal} />
              <StatRow label="Type of resident data import" value={residentImportLabel(building.residentImportType)} />
            </>
          ) : null}
        </SectionCard>

        {/* Subscription */}
        <SectionCard title="Subscription & Billing">
          {buildingLoading ? (
            <>
              <div style={{ padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-stroke-medium)" }}>
                <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" }}>Status</span>
                <SkeletonBlock height={24} width="60" />
              </div>
              <StatRow label="MRR" value="—" />
              <StatRow label="ARR" value="—" />
              <StatRow label="Last Payment" value="—" />
              <StatRow label="Next Renewal" value="—" />
              <StatRow label="Contract Expiry" value="—" />
            </>
          ) : building ? (
            <>
              <div style={{ padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-stroke-medium)" }}>
                <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" }}>Status</span>
                <StatusPill label={building.subscriptionStatus} {...subColor} />
              </div>
              <StatRow label="MRR" value={`$${(building.mrr ?? 0).toLocaleString()}`} />
              {/* Real year-to-date revenue (sum of Paid invoices since Jan 1),
                  not an MRR×12 projection — see GET /api/buildings/:id. */}
              <StatRow label="ARR" value={`$${(building.arr ?? 0).toLocaleString()}`} />
              <StatRow label="Last Payment" value={fmtDate(building.lastPaymentDate)} />
              <StatRow label="Next Renewal" value={fmtDate(building.nextRenewalDate)} />
              <StatRow label="Contract Expiry" value={fmtDate(contractExpiryFromOnboarding(building.onboardedDate))} />
              <PauseResumeRow
                isPaused={building.subscriptionStatus === "Paused"}
                pausePending={pauseMutation.isPending}
                resumePending={resumeMutation.isPending}
                onPauseClick={() => setShowPauseModal(true)}
                onResumeClick={() => setShowResumeModal(true)}
              />
            </>
          ) : null}
        </SectionCard>

        {/* Resident Metrics */}
        <SectionCard title="Resident Metrics">
          {buildingLoading ? (
            <>
              <StatRow label="Invited" value="—" />
              <StatRow label="Registered" value="—" />
              <StatRow label="Adoption" value="—" />
              <StatRow label="At Credit Threshold" value="—" />
            </>
          ) : building ? (
            <>
              <StatRow label="Invited" value={building.residentsInvited} />
              <StatRow label="Registered" value={building.residentsRegistered} />
              <StatRow label="At Credit Threshold" value={building.residentsAtThreshold} />
            </>
          ) : null}
        </SectionCard>

        {/* Booking & Credit Activity */}
        <SectionCard title="Bookings & Credits">
          {buildingLoading ? (
            <>
              <StatRow label="Total Bookings" value="—" />
              <StatRow label="Bookings This Month" value="—" />
              <StatRow label="Completed Bookings" value="—" />
              <StatRow label="Upcoming Bookings" value="—" />
              <StatRow label="Active Bookings" value="—" />
              <StatRow label="Awaiting Confirmation" value="—" />
              <StatRow label="Cancelled Bookings" value="—" />
              <StatRow label="Expired Bookings" value="—" />
              <StatRow label="Credits in Circulation" value="—" />
              <StatRow label="Earned This Month" value="—" />
              <StatRow label="Spent This Month" value="—" />
            </>
          ) : building ? (
            <>
              <StatRow label="Total Bookings" value={building.totalBookings} />
              <StatRow label="Bookings This Month" value={building.bookingsThisMonth} accent={building.bookingsThisMonth === 0} />
              <StatRow label="Bookings Last Month" value={building.bookingsLastMonth} />
              <StatRow label="Completed Bookings" value={building.completedBookings} />
              <StatRow label="Upcoming Bookings" value={building.upcomingBookings} />
              <StatRow label="Active Bookings" value={buildingBookingsLoading ? "—" : activeBookingsCount} />
              <StatRow label="Awaiting Confirmation" value={buildingBookingsLoading ? "—" : awaitingConfirmationCount} />
              <StatRow label="Cancelled Bookings" value={buildingBookingsLoading ? "—" : cancelledBookingsCount} />
              <StatRow label="Expired Bookings" value={building.expiredBookings} />
              <StatRow label="Credits in Circulation" value={building.creditsInCirculation} />
              <StatRow label="Earned This Month" value={building.creditsEarnedThisMonth} />
              <StatRow label="Spent This Month" value={building.creditsSpentThisMonth} />
              <PricePerCreditRow
                price={((building as { creditsPriceCents?: number } | undefined)?.creditsPriceCents ?? 600) / 100}
                onSave={handlePriceSave}
                isPending={priceSaving}
              />
            </>
          ) : null}
        </SectionCard>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <SectionCard title={`Active Alerts (${alerts.length})`}>
          <TableScroll minWidth={600}>
          <div style={{ display: "flex", alignItems: "center", padding: "0 var(--spacing-24)", minHeight: 48, borderBottom: "1px solid var(--color-stroke-medium)", background: "var(--color-fill-white)" }}>
            {[["Timestamp", 25], ["Alert", 25], ["Severity", 50]].map(([label, flex]) => (
              <div key={label as string} style={{ flex: `${flex} 1 0`, minWidth: 0 }}>
                <span style={{ fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", textTransform: "uppercase" as const, display: "block", minWidth: 0, maxWidth: "100%" }}><TableHeadLabel>{label as string}</TableHeadLabel></span>
              </div>
            ))}
          </div>
          {alerts.map((a, i) => (
            <div key={a.id} style={{
              display: "flex", alignItems: "center",
              padding: "14px 20px",
              borderBottom: i < alerts.length - 1 ? "1px solid var(--color-stroke-medium)" : "none",
            }}>
              <div style={{ flex: "25 1 0", minWidth: 0 }}>
                <CopyableCell value={fmtTime(a.timestamp)}>
                  <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", whiteSpace: "nowrap" }}>{fmtTime(a.timestamp)}</span>
                </CopyableCell>
              </div>
              <div style={{ flex: "25 1 0", minWidth: 0 }}>
                <CopyableCell value={a.type}>
                  <div style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.type}</div>
                </CopyableCell>
                <CopyableCell value={a.description}>
                  <div style={{ fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.description}</div>
                </CopyableCell>
              </div>
              <div style={{ flex: "50 1 0", minWidth: 0 }}>
                <CopyableCell value={a.severity}>
                  <StatusPill label={a.severity} bg={severityBg(a.severity)} color={severityColor(a.severity)} />
                </CopyableCell>
              </div>
            </div>
          ))}
          </TableScroll>
        </SectionCard>
      )}

      {/* Sync History */}
      <SectionCard title="Recent Sync History">
        <TableScroll minWidth={640}>
        <div style={{ display: "flex", alignItems: "center", padding: "0 var(--spacing-24)", minHeight: 48, borderBottom: "1px solid var(--color-stroke-medium)", background: "var(--color-fill-white)" }}>
          {[["Timestamp", 25], ["Platform", 25], ["Status", 25], ["Records Synced", 25]].map(([label, flex]) => (
            <div key={label as string} style={{ flex: `${flex} 1 0`, minWidth: 0 }}>
              <span style={{ fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", textTransform: "uppercase" as const, display: "block", minWidth: 0, maxWidth: "100%" }}><TableHeadLabel>{label as string}</TableHeadLabel></span>
            </div>
          ))}
        </div>
        {syncsLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", padding: "0 20px", height: 52, borderBottom: i < 2 ? "1px solid var(--color-stroke-medium)" : "none" }}>
              <div style={{ flex: "25 1 0", minWidth: 0 }}><SkeletonBlock height={14} width="120" /></div>
              <div style={{ flex: "25 1 0", minWidth: 0, paddingLeft: 16 }}><SkeletonBlock height={14} width="80" /></div>
              <div style={{ flex: "25 1 0", minWidth: 0, paddingLeft: 16 }}><SkeletonBlock height={14} width="60" /></div>
              <div style={{ flex: "25 1 0", minWidth: 0, paddingLeft: 16 }}><SkeletonBlock height={14} width="80" /></div>
            </div>
          ))
        ) : syncs.length === 0 ? (
          <div style={{ padding: "24px 20px", textAlign: "left", color: "var(--color-text-weak)", fontSize: "var(--font-size-tiny)" }}>No sync logs for this building.</div>
        ) : syncs.map((s, i) => (
          <div key={s.id} style={{
            display: "flex", alignItems: "center", padding: "0 20px", height: 52,
            borderBottom: i < syncs.length - 1 ? "1px solid var(--color-stroke-medium)" : "none",
          }}>
            <div style={{ flex: "25 1 0", minWidth: 0 }}>
              <CopyableCell value={fmtTime(s.timestamp)}>
                <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", whiteSpace: "nowrap" }}>{fmtTime(s.timestamp)}</span>
              </CopyableCell>
            </div>
            <div style={{ flex: "25 1 0", minWidth: 0 }}>
              <CopyableCell value={s.platform}>
                <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.platform}</span>
              </CopyableCell>
            </div>
            <div style={{ flex: "25 1 0", minWidth: 0, display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: s.status === "Success" ? "var(--color-green-600)" : s.status === "Failed" ? "var(--color-red-600)" : "var(--color-mustard-600)", flexShrink: 0 }} />
              <CopyableCell value={s.status}>
                <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.status}</span>
              </CopyableCell>
            </div>
            <div style={{ flex: "25 1 0", minWidth: 0, paddingLeft: 0 }}>
              {s.errorMessage ? (
                <CopyableCell value={s.errorMessage}>
                  <span style={{ fontSize: "var(--font-size-extra-tiny)", color: "var(--color-tag-text-expired)", fontFamily: "var(--font-family-body)", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.errorMessage}</span>
                </CopyableCell>
              ) : (
                <CopyableCell value={String(s.recordsSynced)}>
                  <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", whiteSpace: "nowrap" }}>{s.recordsSynced}</span>
                </CopyableCell>
              )}
            </div>
          </div>
        ))}
        </TableScroll>
      </SectionCard>

      {/* Support Tickets */}
      <SectionCard title={`Support Tickets (${tickets.length})`}>
        <TableScroll minWidth={640}>
        {ticketsLoading ? (
          <div>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", padding: "0 20px", height: 52, borderBottom: i < 2 ? "1px solid var(--color-stroke-medium)" : "none" }}>
                <div style={{ flex: "10 1 0", minWidth: 0 }}><SkeletonBlock height={12} width="40" /></div>
                <div style={{ flex: "55 1 0", minWidth: 0, paddingLeft: 16 }}><SkeletonBlock height={14} width="70%" /></div>
                <div style={{ flex: "20 1 0", minWidth: 0, paddingLeft: 16 }}><SkeletonBlock height={24} width="60" /></div>
                <div style={{ flex: "15 1 0", minWidth: 0, paddingLeft: 16 }}><SkeletonBlock height={12} width="80" /></div>
              </div>
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ padding: "32px 20px", textAlign: "left", color: "var(--color-text-weak)", fontSize: "var(--font-size-tiny)" }}>No open tickets.</div>
        ) : (() => {
          const totalTicketPages = Math.max(1, Math.ceil(tickets.length / TICKETS_PER_PAGE));
          const ticketStart = ticketPage * TICKETS_PER_PAGE;
          const displayedTickets = tickets.slice(ticketStart, ticketStart + TICKETS_PER_PAGE);
          return (
            <>
              <div style={{ display: "flex", alignItems: "center", padding: "0 var(--spacing-24)", minHeight: 48, borderBottom: "1px solid var(--color-stroke-medium)", background: "var(--color-fill-white)" }}>
                {[["ID", 10], ["Subject", 55], ["Status", 20], ["Opened", 15]].map(([label, flex]) => (
                  <div key={label as string} style={{ flex: `${flex} 1 0`, minWidth: 0 }}>
                    <span style={{ fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", textTransform: "uppercase" as const, display: "block", minWidth: 0, maxWidth: "100%" }}><TableHeadLabel>{label as string}</TableHeadLabel></span>
                  </div>
                ))}
              </div>
              {displayedTickets.map((t, i) => {
                const tc = ticketStatusColor(t.status);
                return (
                  <div key={t.id} style={{
                    display: "flex", alignItems: "center", padding: "0 var(--spacing-24)", height: 52,
                    borderBottom: i < displayedTickets.length - 1 ? "1px solid var(--color-stroke-medium)" : "none",
                  }}>
                    <div style={{ flex: "10 1 0", minWidth: 0 }}>
                      <CopyableCell value={t.id}>
                        <IdDisplay value={t.id} style={{ fontSize: "var(--font-size-tiny)", fontFamily: "var(--font-family-body)" }} />
                      </CopyableCell>
                    </div>
                    <div style={{ flex: "55 1 0", minWidth: 0 }}>
                      <CopyableCell value={t.subject}>
                        <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{t.subject}</span>
                      </CopyableCell>
                    </div>
                    <div style={{ flex: "20 1 0", minWidth: 0 }}>
                      <CopyableCell value={t.status}>
                        <StatusPill label={t.status} bg={tc.bg} color={tc.color} />
                      </CopyableCell>
                    </div>
                    <div style={{ flex: "15 1 0", minWidth: 0 }}>
                      <CopyableCell value={fmtDate(t.openedDate)}>
                        <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", whiteSpace: "nowrap" }}>{fmtDate(t.openedDate)}</span>
                      </CopyableCell>
                    </div>
                  </div>
                );
              })}
              {tickets.length > TICKETS_PER_PAGE && (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0 var(--spacing-24)", height: 57,
                  borderTop: "1px solid var(--color-stroke-medium)",
                  background: "var(--color-fill-white)",
                }}>
                  <span style={{ fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", lineHeight: "var(--line-height-extra-tiny)", fontFamily: "var(--font-family-body)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], whiteSpace: "nowrap" }}>
                    Showing {ticketStart + 1} to {Math.min(ticketStart + TICKETS_PER_PAGE, tickets.length)} of {tickets.length} entries
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-4)" }}>
                    <button
                      onClick={() => setTicketPage((p) => Math.max(0, p - 1))}
                      disabled={ticketPage === 0}
                      style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-8)", cursor: ticketPage === 0 ? "default" : "pointer", opacity: ticketPage === 0 ? 0.4 : 1 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    {Array.from({ length: totalTicketPages }, (_, i) => i).map((i) => (
                      <button
                        key={i}
                        onClick={() => setTicketPage(i)}
                        style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: i === ticketPage ? "var(--color-fill-strong)" : "none", border: i === ticketPage ? "none" : "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-8)", cursor: "pointer", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-extra-tiny)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], color: i === ticketPage ? "var(--color-text-white)" : "var(--color-text-strong)", lineHeight: "var(--line-height-extra-tiny)" }}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setTicketPage((p) => Math.min(totalTicketPages - 1, p + 1))}
                      disabled={ticketPage === totalTicketPages - 1}
                      style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-8)", cursor: ticketPage === totalTicketPages - 1 ? "default" : "pointer", opacity: ticketPage === totalTicketPages - 1 ? 0.4 : 1 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          );
        })()}
        </TableScroll>
      </SectionCard>

      {/* Edit Verification Method Modal */}
      <Modal open={verifyOpen} onClose={() => setVerifyOpen(false)} title="Edit Verification Method" size="small">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-16)" }}>
          <p style={{ margin: 0, fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" }}>
            Choose how residents of this building verify their identity.
          </p>
          <VerificationMethodSelect
            id="edit-verification-method"
            value={verifyDraft}
            onChange={(v) => setVerifyDraft(v)}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--spacing-12)", paddingTop: "var(--spacing-4)" }}>
            <button
              onClick={() => setVerifyOpen(false)}
              style={{ padding: "10px 20px", border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-8)", background: "var(--color-fill-white)", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={handleVerifySave}
              disabled={!verifyDraft}
              style={{
                padding: "10px 20px",
                border: "none",
                borderRadius: "var(--radius-8)",
                background: "var(--color-fill-accent)",
                fontFamily: "var(--font-family-body)",
                fontSize: "var(--font-size-tiny)",
                // Fixed brand color, doesn't invert in dark mode — keep text dark.
                color: "#222222",
                cursor: !verifyDraft ? "not-allowed" : "pointer",
                opacity: !verifyDraft ? 0.6 : 1,
              }}
            >
              Save
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit HOA Contact Modal — name + email together */}
      <Modal open={contactOpen} onClose={() => setContactOpen(false)} title="Edit HOA contact" size="small">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-16)" }}>
          <p style={{ margin: 0, fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" }}>
            Update the HOA admin&apos;s name and email. Use <strong>Save &amp; Invite</strong> to re-send the platform invite to the new address, addressed by the name below.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
            <label style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" }}>Contact name</label>
            <input
              value={contactName}
              onChange={(e) => { setContactName(e.target.value); setContactError(null); }}
              placeholder="Full name"
              style={modalInputStyle}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
            <label style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" }}>Email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => { setContactEmail(e.target.value); setContactError(null); }}
              placeholder="name@example.com"
              style={modalInputStyle}
            />
          </div>
          {contactError && (
            <p style={{ margin: 0, fontSize: "var(--font-size-extra-tiny)", lineHeight: "var(--line-height-extra-tiny)", color: "var(--color-fill-error, #dc2626)", fontFamily: "var(--font-family-body)" }}>
              {contactError}
            </p>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--spacing-12)", flexWrap: "wrap", paddingTop: "var(--spacing-4)" }}>
            <button onClick={() => setContactOpen(false)} style={modalGhostBtnStyle}>Cancel</button>
            <button
              onClick={() => handleContactSave(false)}
              disabled={!contactEmail.trim() || contactSaving}
              style={{ ...modalOutlineBtnStyle, opacity: !contactEmail.trim() || contactSaving ? 0.6 : 1, cursor: !contactEmail.trim() || contactSaving ? "not-allowed" : "pointer" }}
            >
              Save
            </button>
            <button
              onClick={() => handleContactSave(true)}
              disabled={!contactEmail.trim() || contactSaving}
              style={{ ...modalPrimaryBtnStyle, opacity: !contactEmail.trim() || contactSaving ? 0.6 : 1, cursor: !contactEmail.trim() || contactSaving ? "not-allowed" : "pointer" }}
            >
              {contactSaving ? "Saving…" : "Save & Invite"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Pause subscription confirmation — superadmin override. */}
      <Modal open={showPauseModal} onClose={() => setShowPauseModal(false)} title="Pause this building's subscription?">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-16)", fontFamily: "var(--font-family-body)" }}>
          <div
            style={{
              background: "var(--color-fill-pending-soft, #fef3c7)",
              border: "1px solid var(--color-fill-pending, #f59e0b)",
              borderRadius: "var(--radius-8)",
              padding: "var(--spacing-12) var(--spacing-16)",
              fontSize: "var(--font-size-tiny)",
              lineHeight: 1.5,
              color: "var(--color-text-strong)",
            }}
          >
            <strong>New guest-bookings will be blocked.</strong>{" "}
            Billing keeps running — Stripe charges continue as scheduled, the
            resident feed keeps importing, and ACH reconciliation is
            unaffected. Existing in-flight bookings are not touched. The
            status pill will flip to "Paused" until you click Resume.
          </div>
          <p style={{ margin: 0, fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)" }}>
            {building?.name} will be paused. You can resume at any time.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--spacing-12)" }}>
            <button
              type="button"
              onClick={() => setShowPauseModal(false)}
              disabled={pauseMutation.isPending}
              style={{ ...modalOutlineBtnStyle, opacity: pauseMutation.isPending ? 0.6 : 1, cursor: pauseMutation.isPending ? "not-allowed" : "pointer" }}
            >
              Keep Active
            </button>
            <button
              type="button"
              onClick={() => pauseMutation.mutate()}
              disabled={pauseMutation.isPending}
              style={{ ...modalPrimaryBtnStyle, opacity: pauseMutation.isPending ? 0.6 : 1, cursor: pauseMutation.isPending ? "not-allowed" : "pointer" }}
            >
              {pauseMutation.isPending ? "Pausing…" : "Confirm Pause"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Resume subscription confirmation — symmetric to the pause modal. */}
      <Modal open={showResumeModal} onClose={() => setShowResumeModal(false)} title="Resume this building's subscription?">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-16)", fontFamily: "var(--font-family-body)" }}>
          <p style={{ margin: 0, fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)" }}>
            {building?.name} will resume accepting new guest-bookings. The
            status pill will flip back to "Active".
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--spacing-12)" }}>
            <button
              type="button"
              onClick={() => setShowResumeModal(false)}
              disabled={resumeMutation.isPending}
              style={{ ...modalOutlineBtnStyle, opacity: resumeMutation.isPending ? 0.6 : 1, cursor: resumeMutation.isPending ? "not-allowed" : "pointer" }}
            >
              Keep Paused
            </button>
            <button
              type="button"
              onClick={() => resumeMutation.mutate()}
              disabled={resumeMutation.isPending}
              style={{ ...modalPrimaryBtnStyle, opacity: resumeMutation.isPending ? 0.6 : 1, cursor: resumeMutation.isPending ? "not-allowed" : "pointer" }}
            >
              {resumeMutation.isPending ? "Resuming…" : "Confirm Resume"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast at the page level — auto-dismisses after 4s. */}
      {toast.node}
    </div>
  );
}