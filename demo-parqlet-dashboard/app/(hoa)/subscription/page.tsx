"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../components/auth/auth-provider";
import { Actions, can } from "../../lib/permissions";
import {
  cancelSubscription,
  getSubscription,
  listInvoiceNotificationTemplates,
  listInvoices,
  subscriptionKeys,
  updateBillingInfo,
  updateInvoiceNotifications,
} from "../../lib/api/subscriptions";
import type {
  Subscription,
} from "../../lib/api/subscriptions";
import { getBuilding } from "../../lib/api/buildings";
import { fmtDate, fmtFull } from "../../lib/dates";
import { IdDisplay } from "../../components/ui/IdDisplay";
import { TableScroll } from "../../components/ui/TableScroll";
import { TableHeadLabel } from "../../components/ui/TableHeadLabel";
import { CopyableCell } from "../../components/ui/CopyableCell";
import { Button } from "./components/Button";
import { EditBillingModal } from "./components/EditBillingModal";
import { EmailChipInput } from "./components/EmailChipInput";
import { UpdateCardModal } from "./components/UpdateCardModal";
import { AchPaymentMethodCard, achStatusLabel } from "./components/AchPaymentMethodCard";
import {
  ACH_INSTRUCTIONS,
  formatAddress,
  formatRoutingNumber,
  maskAccountNumber,
} from "../../lib/ach-instructions";

import "../../tokens.css";

// ─── Figma calendar illustration (base64 embedded — does not expire) ──────────
const IL_CALENDAR = "data:image/png;base64,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";

// ─── Icons ────────────────────────────────────────────────────────────────────

function IcCreditCard() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="7" cy="15" r="0.75" fill="currentColor" />
      <line x1="11" y1="15" x2="13" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IcEnvelope() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcDownload() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M12 3v13M7 12l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 19h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IcExternalLink() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M14 4h6v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 4l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcInfo() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 8v1M12 11v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onChange}
      style={{
        position:        "relative",
        display:         "inline-flex",
        alignItems:      "center",
        width:           40,
        height:          22,
        borderRadius:    99,
        border:          "none",
        cursor:          "pointer",
        padding:         0,
        flexShrink:      0,
        backgroundColor: on ? "var(--color-fill-accent)" : "var(--color-gray-30)",
        transition:      "background-color 0.18s ease",
      }}
    >
      <span style={{
        position:        "absolute",
        left:            on ? 21 : 3,
        width:           16,
        height:          16,
        borderRadius:    "50%",
        backgroundColor: "var(--color-fill-white)",
        boxShadow:       "0 1px 3px rgba(0,0,0,0.22)",
        transition:      "left 0.18s ease",
      }} />
    </button>
  );
}

// ─── Shared button components ─────────────────────────────────────────────────

function PrimaryBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        height:       36,
        padding:      "0 var(--spacing-16)",
        background:   hov ? "var(--color-accent-1200)" : "var(--color-fill-accent)",
        border:       "none",
        borderRadius: "var(--radius-8)",
        cursor:       "pointer",
        fontFamily:   "var(--font-family-body)",
        fontSize:     "var(--font-size-tiny)",
        fontWeight:   "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
        // Fixed brand color, doesn't invert in dark mode — keep text dark.
        color:        "#222222",
        whiteSpace:   "nowrap" as const,
        transition:   "background 0.12s",
      }}
    >
      {children}
    </button>
  );
}

function SecondaryBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        height:       36,
        padding:      "0 var(--spacing-16)",
        background:   hov ? "var(--color-fill-weak)" : "var(--color-fill-white)",
        border:       "1px solid var(--color-stroke-medium)",
        borderRadius: "var(--radius-8)",
        cursor:       "pointer",
        fontFamily:   "var(--font-family-body)",
        fontSize:     "var(--font-size-tiny)",
        fontWeight:   "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
        color:        "var(--color-text-strong)",
        whiteSpace:   "nowrap" as const,
        transition:   "background 0.12s",
      }}
    >
      {children}
    </button>
  );
}

function DangerOutlineBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        height:       36,
        padding:      "0 var(--spacing-16)",
        background:   hov ? "var(--color-red-50)" : "none",
        border:       "1px solid var(--color-red-1000)",
        borderRadius: "var(--radius-8)",
        cursor:       "pointer",
        fontFamily:   "var(--font-family-body)",
        fontSize:     "var(--font-size-tiny)",
        fontWeight:   "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
        color:        "var(--color-text-error)",
        whiteSpace:   "nowrap" as const,
        flexShrink:   0,
        marginLeft:   24,
        transition:   "background 0.12s",
      }}
    >
      {children}
    </button>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background:   "var(--color-fill-white)",
      border:       "1px solid var(--color-stroke-medium)",
      borderRadius: "var(--radius-12)",
      overflow:     "hidden",
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{
      display:         "flex",
      alignItems:      "center",
      justifyContent:  "space-between",
      padding:         "var(--spacing-16) var(--spacing-20)",
      borderBottom:    "1px solid var(--color-stroke-medium)",
    }}>
      <span style={{
        fontSize:   "var(--font-size-tiny)",
        fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
        lineHeight: "var(--line-height-tiny)",
        color:      "var(--color-text-strong)",
        fontFamily: "var(--font-family-body)",
      }}>
        {title}
      </span>
      {action}
    </div>
  );
}

// ─── ACH details helpers ──────────────────────────────────────────────────────
//
// Small presentational components used by the "ACH Transfer Details" Card
// on the subscription page. Kept inline (rather than a separate file) so
// the layout and the page that owns the data live next to each other.

function DetailGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{
        fontFamily:    "var(--font-family-body)",
        fontSize:      "var(--font-size-extra-tiny)",
        fontWeight:    "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
        color:         "var(--color-text-weak)",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}>
        {label}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {children}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  copyable,
}: {
  label: string;
  value: string;
  /** When set, render a small "Copy" button next to the value. */
  copyable?: string;
}) {
  return (
    <div style={{
      display:        "flex",
      alignItems:     "center",
      justifyContent: "space-between",
      gap:            12,
      padding:        "4px 0",
    }}>
      <div style={{ display: "flex", gap: 8, alignItems: "baseline", minWidth: 0, flex: 1 }}>
        <span style={{
          fontFamily:    "var(--font-family-body)",
          fontSize:      "var(--font-size-extra-tiny)",
          fontWeight:    "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
          color:         "var(--color-text-weak)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          flexShrink:   0,
        }}>
          {label}
        </span>
        <span style={{
          fontFamily:          "var(--font-family-body)",
          fontSize:            "var(--font-size-tiny)",
          fontWeight:          "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
          color:               "var(--color-text-strong)",
          lineHeight:          "var(--line-height-tiny)",
          fontFeatureSettings: '"tnum" 1',
          overflow:            "hidden",
          textOverflow:        "ellipsis",
          whiteSpace:          "nowrap",
          minWidth:            0,
        }}>
          {value}
        </span>
      </div>
      {copyable && (
        <button
          type="button"
          onClick={() => {
            if (typeof navigator === "undefined" || !navigator.clipboard) return;
            void navigator.clipboard.writeText(copyable);
          }}
          style={{
            height:        26,
            padding:       "0 var(--spacing-8)",
            background:    "var(--color-fill-white)",
            border:        "1px solid var(--color-stroke-medium)",
            borderRadius:  "var(--radius-8)",
            cursor:        "pointer",
            fontFamily:    "var(--font-family-body)",
            fontSize:      "var(--font-size-extra-tiny)",
            color:         "var(--color-text-strong)",
            whiteSpace:    "nowrap",
            flexShrink:    0,
          }}
        >
          Copy
        </button>
      )}
    </div>
  );
}

// ─── Section 1 — Dark plan card ───────────────────────────────────────────────

function PlanCard({ sub, isLoading }: { sub: import("../../lib/api/subscriptions").Subscription | undefined; isLoading: boolean }) {
  const renewal = sub ? fmtFull(sub.nextRenewalDate) : "";

  const [showActivateModal, setShowActivateModal] = useState(false);

  if (isLoading) {
    return (
      <div style={{ borderRadius: 20, overflow: "hidden" }}>
        <div style={{
          backgroundColor: "var(--color-fill-strong)",
          padding: "28px 28px 28px",
          borderRadius: "20px 20px 0 0",
          height: 160,
        }} />
        <div style={{
          background: "var(--color-fill-white)",
          border: "1px solid var(--color-stroke-medium)",
          borderRadius: "0 0 20px 20px",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          gap: 32,
        }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--color-gray-30)" }} />
              <div style={{ width: 80, height: 14, borderRadius: 4, background: "var(--color-gray-30)" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!sub) {
    return (
      <div style={{
        borderRadius: 20,
        overflow: "hidden",
        border: "1px solid var(--color-stroke-medium)",
      }}>
        {/* Dark header */}
        <div style={{
          backgroundColor: "var(--color-fill-strong)",
          padding: "40px 28px 32px",
          borderRadius: "20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 12,
        }}>
          {/* Calendar icon */}
          <div style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "rgba(199, 229, 31, 0.15)",
            border: "1px solid rgba(199, 229, 31, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 4,
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="6" width="18" height="15" rx="2.5" stroke="var(--color-stroke-accent)" strokeWidth="1.5" />
              <path d="M3 10h18" stroke="var(--color-stroke-accent)" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M8 3v5M16 3v5" stroke="var(--color-stroke-accent)" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="15" r="1" fill="var(--color-fill-accent)" />
              <circle cx="12" cy="15" r="1" fill="var(--color-fill-accent)" />
              <circle cx="16" cy="15" r="1" fill="var(--color-fill-accent)" />
            </svg>
          </div>
          <span style={{
            fontFamily: "var(--font-family-heading)",
            fontSize: "var(--font-size-heading-3)",
            fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
            color: "var(--color-text-white)",
            lineHeight: "var(--line-height-heading-3)",
          }}>
            No active subscription
          </span>
          <span style={{
            fontFamily: "var(--font-family-body)",
            fontSize: "var(--font-size-tiny)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            color: "rgba(255,255,255,0.55)",
            lineHeight: "var(--line-height-tiny)",
            maxWidth: 320,
          }}>
            Attach a payment method to activate your Parqlet subscription and unlock all features
          </span>
          <button
            onClick={() => setShowActivateModal(true)}
            style={{
              height: 40,
              padding: "0 var(--spacing-20)",
              background: "var(--color-fill-accent)",
              border: "none",
              borderRadius: "var(--radius-8)",
              cursor: "pointer",
              fontFamily: "var(--font-family-body)",
              fontSize: "var(--font-size-tiny)",
              fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
              // Fixed brand color, doesn't invert in dark mode — keep text dark.
              color: "#222222",
              marginTop: 8,
              transition: "background 0.12s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-accent-1200)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-fill-accent)"; }}
          >
            Attach Payment Method
          </button>
        </div>


        {showActivateModal && (
          <ActivateSubscriptionModal
            onClose={() => setShowActivateModal(false)}
            onSuccess={() => setShowActivateModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{ borderRadius: 20, overflow: "hidden" }}>

      {/* ── Dark top section ── */}
      <div style={{
        position:        "relative",
        backgroundColor: "var(--color-fill-strong)",
        padding:         "28px 28px 28px",
        overflow:        "hidden",
        borderRadius:    "20px 20px 0 0",
      }}>
        {/* Amber glow — top right */}
        <div style={{
          position:      "absolute",
          inset:         0,
          background:    "radial-gradient(ellipse 55% 65% at 102% -5%, rgba(175, 95, 20, 0.55) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />
        {/* Olive glow — bottom left */}
        <div style={{
          position:      "absolute",
          inset:         0,
          background:    "radial-gradient(ellipse 45% 60% at -5% 115%, rgba(88, 98, 18, 0.50) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />

        {/* Content: left = title+price, right = renewal */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>

          {/* Left */}
          <div>
            {/* Title + badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span style={{
                fontFamily: "var(--font-family-heading)",
                fontSize:   "var(--font-size-heading-3)",
                fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                color:      "var(--color-text-white)",
                lineHeight: "var(--line-height-heading-3)",
              }}>
                {sub.planName}
              </span>
              <span style={{
                background:   "var(--color-tag-active)",
                color:        "var(--color-tag-text-active)",
                fontFamily:   "var(--font-family-body)",
                fontSize:     12,
                fontWeight:   "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                borderRadius: "var(--radius-48)",
                padding:      "4px 8px",
                flexShrink:   0,
                lineHeight:   "var(--line-height-uppercase)",
                whiteSpace:   "nowrap" as const,
              }}>
                {sub.status}
              </span>
            </div>

            {/* Price */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3 }}>
              <span style={{
                fontFamily: "var(--font-family-heading)",
                fontSize:   "var(--font-size-heading-1)",
                fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                color:      "var(--color-fill-accent)",
                lineHeight: "var(--line-height-heading-1)",
              }}>
                ${sub.mrr.toLocaleString()}
              </span>
              <span style={{
                fontFamily:    "var(--font-family-body)",
                fontSize:      "var(--font-size-extra-tiny)",
                fontWeight:    "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                color:         "var(--color-text-weaker)",
                lineHeight:    "var(--line-height-extra-tiny)",
                paddingBottom: 6,
              }}>
                / month
              </span>
            </div>

            {/* Payment method indicator — surfaces ACH vs card at the top
                of the page so the user doesn't have to scroll to the
                Payment Method section to know how they're paying. */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
              <span style={{
                fontFamily:    "var(--font-family-body)",
                fontSize:      "var(--font-size-extra-tiny)",
                fontWeight:    "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                color:         "var(--color-text-weaker)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}>
                Paying via
              </span>
              <span style={{
                display:       "inline-flex",
                alignItems:    "center",
                gap:           6,
                padding:       "4px 10px",
                background:    "rgba(255,255,255,0.08)",
                border:        "1px solid rgba(255,255,255,0.18)",
                borderRadius:  "var(--radius-48)",
                fontFamily:    "var(--font-family-body)",
                fontSize:      "var(--font-size-extra-tiny)",
                fontWeight:    "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                color:         "var(--color-text-white)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}>
                {sub.paymentMethodType === "ach" ? (
                  <>
                    <span
                      aria-hidden="true"
                      style={{
                        width:        6,
                        height:       6,
                        borderRadius: "50%",
                        background:   "var(--color-fill-warning, #f59e0b)",
                      }}
                    />
                    ACH bank transfer · {achStatusLabel(sub.achPaymentStatus)}
                  </>
                ) : (
                  <>
                    <IcCreditCard />
                    Credit / debit card
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Right — renewal date */}
          <div style={{ textAlign: "right" }}>
            <div style={{
              fontFamily:   "var(--font-family-body)",
              fontSize:     "var(--font-size-extra-tiny)",
              fontWeight:   "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
              color:        "rgba(255,255,255,0.55)",
              lineHeight:   "var(--line-height-extra-tiny)",
              marginBottom: 4,
            }}>
              Next Renewal Date
            </div>
            <div style={{
              fontFamily: "var(--font-family-heading)",
              fontSize:   "var(--font-size-heading-2)",
              fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
              color:      "var(--color-text-white)",
              lineHeight: "var(--line-height-heading-2)",
            }}>
              {renewal}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

// ─── Field tile ───────────────────────────────────────────────────────────────

function FieldTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{
      background:   "var(--color-fill-white)",
      border:       "1px solid var(--color-stroke-medium)",
      borderRadius: 12,
      padding:      "14px 16px",
      display:      "flex",
      alignItems:   "center",
      gap:          12,
      minWidth:     0,
    }}>
      <div style={{
        width:          40,
        height:         40,
        background:     "var(--color-fill-weak)",
        borderRadius:   "var(--radius-8)",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        flexShrink:     0,
        color:          "var(--color-text-weak)",
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin:       0,
          fontFamily:   "var(--font-family-body)",
          fontSize:     "var(--font-size-tiny)",
          fontWeight:   "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
          color:        "var(--color-text-strong)",
          lineHeight:   "var(--line-height-tiny)",
          marginBottom: 2,
          overflow:     "hidden",
          textOverflow: "ellipsis",
          whiteSpace:   "nowrap",
        }}>
          {value}
        </p>
        <p style={{
          margin:     0,
          fontFamily: "var(--font-family-body)",
          fontSize:   "var(--font-size-extra-tiny)",
          fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
          color:      "var(--color-text-weak)",
          lineHeight: "var(--line-height-extra-tiny)",
          overflow:     "hidden",
          textOverflow: "ellipsis",
          whiteSpace:   "nowrap",
        }}>
          {label}
        </p>
      </div>
    </div>
  );
}

// ─── Notification row ─────────────────────────────────────────────────────────

function NotifRow({ label, sub, on, onChange, last }: {
  label:    string;
  sub:      string;
  on:       boolean;
  onChange: () => void;
  last?:    boolean;
}) {
  return (
    <div style={{
      display:         "flex",
      alignItems:      "center",
      justifyContent:  "space-between",
      gap:             16,
      padding:         "12px 0",
      borderBottom:    last ? "none" : "1px solid var(--color-gray-20)",
    }}>
      <div>
        <p style={{
          margin:       0,
          fontFamily:   "var(--font-family-body)",
          fontSize:     14,
          fontWeight:   500,
          color:        "var(--color-text-strong)",
          lineHeight:   "20px",
          marginBottom: 2,
        }}>
          {label}
        </p>
        <p style={{
          margin:     0,
          fontFamily: "var(--font-family-body)",
          fontSize:   12,
          fontWeight: 400,
          color:      "var(--color-text-weak)",
          lineHeight: "16px",
        }}>
          {sub}
        </p>
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}

// ─── Invoice action buttons ───────────────────────────────────────────────────
// Two small text+icon buttons per invoice row:
//   • ViewBtn — primary, opens the Stripe-hosted invoice page in a new tab.
//   • PdfBtn  — secondary, opens the Stripe-hosted PDF download.
// Both deliberately share styling so the row stays compact; the "View" button
// is the primary affordance since it surfaces the customer-facing portal page.

function PdfBtn({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:     "inline-flex",
        alignItems:  "center",
        gap:         5,
        height:      28,
        padding:     "0 8px",
        background:  hov && !disabled ? "var(--color-gray-15)" : "none",
        border:      "none",
        borderRadius: 6,
        cursor:      disabled ? "not-allowed" : "pointer",
        fontFamily:  "var(--font-family-body)",
        fontSize:    12,
        fontWeight:  400,
        color:       disabled ? "var(--color-text-weaker)" : hov ? "var(--color-text-strong)" : "var(--color-text-weak)",
        opacity:     disabled ? 0.5 : 1,
        transition:  "background 0.12s, color 0.12s",
      }}
    >
      <IcDownload />
      PDF
    </button>
  );
}

function ViewBtn({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:     "inline-flex",
        alignItems:  "center",
        gap:         5,
        height:      28,
        padding:     "0 8px",
        background:  hov && !disabled ? "var(--color-gray-15)" : "none",
        border:      "none",
        borderRadius: 6,
        cursor:      disabled ? "not-allowed" : "pointer",
        fontFamily:  "var(--font-family-body)",
        fontSize:    12,
        fontWeight:  400,
        color:       disabled ? "var(--color-text-weaker)" : hov ? "var(--color-text-strong)" : "var(--color-text-weak)",
        opacity:     disabled ? 0.5 : 1,
        transition:  "background 0.12s, color 0.12s",
      }}
    >
      <IcExternalLink />
      View
    </button>
  );
}


function ActivateSubscriptionModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [hovSubmit, setHovSubmit] = useState(false);
  const [cardName,     setCardName]     = useState("");
  const [cardNumber,   setCardNumber]   = useState("");
  const [cardExpiry,   setCardExpiry]   = useState("");
  const [cardCvv,      setCardCvv]      = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState("");

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
  const labelStyle: React.CSSProperties = {
    display:      "block",
    fontFamily:   "var(--font-family-body)",
    fontSize:     "var(--font-size-extra-tiny)",
    fontWeight:   "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
    color:        "var(--color-text-weak)",
    marginBottom: 6,
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  };

  function formatCardNumber(v: string) {
    return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }
  function formatExpiry(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    return digits.length >= 3 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits;
  }

  async function handleSubmit() {
    if (!cardName || !cardNumber || !cardExpiry || !cardCvv) {
      setError("All fields are required.");
      return;
    }
    setError("");
    setSubmitting(true);
    // TODO: call backend to attach payment method and activate subscription
    // placeholder: simulate async call
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);
    onSuccess();
  }

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
          maxWidth:      480,
          boxShadow:     "0 16px 48px rgba(0,0,0,0.16)",
          padding:       "var(--spacing-24)",
          display:       "flex",
          flexDirection: "column",
          gap:           "var(--spacing-20)",
        }}
      >
        {/* Header */}
        <div>
          <h2 style={{
            margin:     "0 0 4px",
            fontSize:   "var(--font-size-heading-3)",
            fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
            color:      "var(--color-text-strong)",
            fontFamily: "var(--font-family-heading)",
            lineHeight: "var(--line-height-heading-3)",
          }}>
            Activate Subscription
          </h2>
          <p style={{
            margin:     0,
            fontSize:   "var(--font-size-tiny)",
            color:      "var(--color-text-weak)",
            fontFamily: "var(--font-family-body)",
            lineHeight: "var(--line-height-tiny)",
          }}>
            Enter your payment details to activate your Parqlet subscription. You won't be charged until the trial ends.
          </p>
        </div>

        {/* Stripe placeholder banner */}
        <div style={{
          background:   "var(--color-gray-15)",
          border:       "1px solid var(--color-gray-30)",
          borderRadius: "var(--radius-8)",
          padding:      "10px 14px",
          display:      "flex",
          alignItems:   "center",
          gap:          10,
        }}>
          {/* Stripe badge */}
          <span style={{
            background:    "#635BFF",
            color:         "var(--color-text-white)",
            fontSize:      10,
            fontWeight:    700,
            fontFamily:    "var(--font-family-body)",
            padding:       "2px 6px",
            borderRadius:  3,
            letterSpacing: "0.04em",
            flexShrink:    0,
          }}>
            STRIPE
          </span>
          <span style={{
            fontFamily: "var(--font-family-body)",
            fontSize:   12,
            color:      "var(--color-text-weak)",
            lineHeight: "17px",
          }}>
            Secured by Stripe — backend integration pending
          </span>
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Cardholder Name</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="Jane Smith"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Card Number</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Expiry Date</label>
              <input
                style={inputStyle}
                type="text"
                placeholder="MM / YY"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
              />
            </div>
            <div>
              <label style={labelStyle}>CVV</label>
              <input
                style={inputStyle}
                type="text"
                placeholder="123"
                maxLength={4}
                value={cardCvv}
                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p style={{ margin: 0, color: "var(--color-text-error)", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)" }}>
            {error}
          </p>
        )}

        {/* Submit */}
        <div style={{ display: "flex", gap: "var(--spacing-12)", justifyContent: "flex-end" }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <button
            onClick={handleSubmit}
            onMouseEnter={() => setHovSubmit(true)}
            onMouseLeave={() => setHovSubmit(false)}
            disabled={submitting}
            style={{
              height:       36,
              padding:      "0 var(--spacing-16)",
              background:   hovSubmit ? "var(--color-accent-1200)" : "var(--color-fill-accent)",
              border:       "none",
              borderRadius: "var(--radius-8)",
              cursor:       submitting ? "not-allowed" : "pointer",
              fontFamily:   "var(--font-family-body)",
              fontSize:     "var(--font-size-tiny)",
              fontWeight:   "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
              // Fixed brand color, doesn't invert in dark mode — keep text dark.
              color:        "#222222",
              opacity:      submitting ? 0.7 : 1,
              transition:   "background 0.12s, opacity 0.12s",
            }}
          >
            {submitting ? "Activating…" : "Activate Subscription"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Unsubscribe confirmation modal ───────────────────────────────────────────

function UnsubscribeModal({
  onClose,
  onConfirm,
  nextRenewalDate,
  saving,
}: {
  onClose: () => void;
  onConfirm: () => void;
  nextRenewalDate: string;
  saving: boolean;
}) {
  const endDate = new Date(nextRenewalDate);
  endDate.setMonth(endDate.getMonth() + 1);
  const fmtEnd = fmtFull(endDate.toISOString());

  return (
    <div
      onClick={onClose}
      style={{
        position:        "fixed",
        inset:           0,
        zIndex:          500,
        background:      "rgba(0,0,0,0.45)",
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        padding:         "var(--spacing-24)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background:    "var(--color-fill-white)",
          borderRadius:  "var(--radius-16)",
          width:         "100%",
          maxWidth:      480,
          boxShadow:     "0 16px 48px rgba(0,0,0,0.16)",
          padding:       "var(--spacing-24)",
          display:       "flex",
          flexDirection: "column",
          gap:           "var(--spacing-20)",
        }}
      >
        <div>
          <h2 style={{
            margin:     "0 0 8px",
            fontSize:   "var(--font-size-heading-3)",
            fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
            color:      "var(--color-text-strong)",
            fontFamily: "var(--font-family-heading)",
            lineHeight: "var(--line-height-heading-3)",
          }}>
            Cancel Subscription?
          </h2>
          <p style={{
            margin:     0,
            fontSize:   "var(--font-size-tiny)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            color:      "var(--color-text-weak)",
            fontFamily: "var(--font-family-body)",
            lineHeight: "var(--line-height-tiny)",
          }}>
            A one-month notice is required. Your subscription will remain active until{" "}
            <strong style={{ color: "var(--color-text-strong)", fontWeight: 600 }}>{fmtEnd}</strong>.
            All resident access and booking history will be removed at the end of that billing period.
          </p>
        </div>

        <div style={{
          background:   "var(--color-red-50)",
          border:       "1px solid var(--color-red-100)",
          borderRadius: "var(--radius-8)",
          padding:      "12px 16px",
          fontSize:     12,
          color:        "var(--color-text-weaker)",
          fontFamily:   "var(--font-family-body)",
          lineHeight:   "18px",
        }}>
          This action cannot be undone. Residents will lose access on <strong style={{ color: "var(--color-text-weak)" }}>{fmtEnd}</strong>.
        </div>

        <div style={{ display: "flex", gap: "var(--spacing-12)", justifyContent: "flex-end" }}>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Keep Subscription</Button>
          <button
            onClick={onConfirm}
            disabled={saving}
            style={{
              height:       36,
              padding:      "0 var(--spacing-16)",
              background:   "var(--color-fill-error)",
              border:       "none",
              borderRadius: "var(--radius-8)",
              cursor:       saving ? "not-allowed" : "pointer",
              fontFamily:   "var(--font-family-body)",
              fontSize:     "var(--font-size-tiny)",
              fontWeight:   "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
              color:        "var(--color-text-white)",
              whiteSpace:   "nowrap" as const,
              opacity:      saving ? 0.7 : 1,
            }}
            onMouseEnter={(e) => { if (!saving) e.currentTarget.style.opacity = "0.88"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = saving ? "0.7" : "1"; }}
          >
            {saving ? "Cancelling…" : "Confirm Cancellation"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function DocumentModal({ title, onClose }: { title: string; onClose: () => void }) {
  const isPrivacy = title === "Privacy Policy";
  const sections = isPrivacy ? [
    { heading: "Information We Collect", body: "We collect information you provide directly to us when you create an account, use our services, or communicate with us. This includes your name, email address, unit number, parking spot details, and any other information you choose to provide." },
    { heading: "How We Use Your Information", body: "We use the information we collect to operate, maintain, and improve our services, process bookings and credit transactions, send you technical notices and administrative messages, and respond to your comments and questions." },
    { heading: "Information Sharing", body: "We do not share your personal information with third parties except as described in this policy. We may share information with vendors and service providers who assist in our operations, when required by law, or to protect the rights and safety of our users." },
    { heading: "Data Retention", body: "We retain personal information for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required or permitted by law. Booking records and consent logs are retained for a minimum of 36 months for HOA audit compliance." },
    { heading: "Security", body: "We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. All data is encrypted in transit and at rest using industry-standard protocols." },
    { heading: "Cookies and Tracking", body: "We use cookies and similar tracking technologies to track activity on our platform and hold certain information. You can instruct your browser to refuse all cookies or indicate when a cookie is being sent." },
    { heading: "Your Rights", body: "You have the right to access, update, or delete the information we hold about you. You may also object to processing, request restriction, or request portability of your data. Contact your HOA administrator to exercise these rights." },
    { heading: "Changes to This Policy", body: "We may update this Privacy Policy from time to time. We will notify you of any changes by updating the date at the top of this policy and, where appropriate, notifying you by email." },
    { heading: "Contact Us", body: "If you have any questions about this Privacy Policy, please contact your building's HOA administrator or reach out to the Parqlet support team through the platform." },
  ] : [
    { heading: "Acceptance of Terms", body: "By accessing or using the Parqlet platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform. Your continued use constitutes acceptance of any updates." },
    { heading: "Eligibility", body: "You must be a verified resident of a Parqlet-enabled building to create an account. Your email address must be registered in the HOA's resident database. Parqlet reserves the right to verify eligibility at any time." },
    { heading: "Platform Use", body: "You agree to use the platform only for lawful purposes and in accordance with these Terms. You may not use the platform in any way that violates applicable law, infringes the rights of others, or interferes with the proper functioning of the service." },
    { heading: "Credit Economy", body: "Credits are non-transferable, building-specific, and have no cash value. Parqlet reserves the right to modify the credit system at any time with reasonable notice. Credits may not be sold, traded, or transferred between accounts." },
    { heading: "Booking Obligations", body: "Residents who book guest parking spots are responsible for their guests' conduct. By confirming a booking, you accept financial responsibility for any damages or violations caused by your guest, as disclosed in the Guest Liability Consent modal." },
    { heading: "Spot Sharing", body: "Spot sharing is voluntary. By listing your spot, you agree to make it available during the specified windows. Parqlet does not guarantee bookings or credit earnings. Spot owners must ensure their spot is free during shared windows." },
    { heading: "Limitation of Liability", body: "To the fullest extent permitted by law, Parqlet shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the platform or any booking-related dispute between residents." },
    { heading: "Termination", body: "Parqlet may terminate or suspend your account at any time, with or without cause, with or without notice. Upon termination, your right to use the platform will immediately cease and any unused credits will be forfeited." },
    { heading: "Governing Law", body: "These Terms shall be governed by and construed in accordance with the laws of the State of Texas, without regard to its conflict of law provisions." },
  ];

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 2000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "var(--spacing-24)",
      }}
    >
      <div style={{
        background:    "var(--color-fill-white)",
        borderRadius:  "var(--radius-24)",
        width:         "100%",
        maxWidth:      600,
        maxHeight:     "80vh",
        display:       "flex",
        flexDirection: "column",
        overflow:      "hidden",
        fontFamily:    "var(--font-family-body)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "24px 28px 20px",
          borderBottom: "1px solid var(--color-stroke-medium)",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: "var(--font-size-body)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--color-text-strong)", lineHeight: "var(--line-height-body)" }}>
            {title}
          </span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-icon-strong)" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", flex: 1, padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
          {sections.map((s) => (
            <div key={s.heading} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--color-text-strong)", lineHeight: "var(--line-height-tiny)" }}>
                {s.heading}
              </span>
              <span style={{ fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], color: "var(--color-text-weak)", lineHeight: "var(--line-height-tiny)" }}>
                {s.body}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Mapping from invoice-notification template id → Subscription boolean field ─

const TEMPLATE_ID_TO_FIELD: Record<string, keyof import("../../lib/api/subscriptions").Subscription["invoiceNotifications"]> = {
  tpl_on_renewal:   "onRenewal",
  tpl_copy_billing: "copyToBillingContact",
  tpl_reminder_7d:  "renewalReminder7Days",
  tpl_failed_pay:   "failedPaymentAlert",
};

// ─── Toast helper (inline fixed-position; matches profile pattern) ────────────

function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  function show(text: string) {
    setMsg(text);
    window.setTimeout(() => setMsg(null), 4000);
  }
  const node = msg ? (
    <div
      role="status"
      style={{
        position:        "fixed",
        bottom:         "var(--spacing-32)",
        left:           "50%",
        transform:      "translateX(-50%)",
        background:     "var(--color-fill-strong)",
        color:          "var(--color-text-white)",
        padding:        "var(--spacing-12) var(--spacing-24)",
        borderRadius:   "var(--radius-12)",
        boxShadow:      "0 8px 24px rgba(0,0,0,0.16)",
        fontFamily:     "var(--font-family-body)",
        fontSize:       "var(--font-size-tiny)",
        fontWeight:     "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
        zIndex:         3000,
        whiteSpace:     "nowrap",
      }}
    >
      {msg}
    </div>
  ) : null;
  return { show, node };
}

function CheckMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3 7.5l3 3 5-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SavedBadge() {
  return (
    <span style={{
      display:      "inline-flex",
      alignItems:   "center",
      gap:          6,
      color:        "#166534",
      fontFamily:   "var(--font-family-body)",
      fontSize:     "var(--font-size-tiny)",
      fontWeight:   "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
    }}>
      <CheckMark />
      Saved
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SubscriptionPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Subscription view is gated to admin + lead_concierge (Actions.ViewSubscription).
  // The sidebar hides this link for concierge/security, but a direct URL hit
  // would still render the page (and fire subscription / invoice queries). Bounce
  // unauthorized users back to /bookings so they don't see billing data.
  //
  // We gate in a wrapper rather than inside the content component so the
  // content's hooks only mount once authorization resolves. Returning `null`
  // mid-component would violate the Rules of Hooks when `useAuth()` resolves
  // from `null` to an authorized user — the inner queries / state would mount
  // conditionally.
  const isAuthorized = user ? can(user.role, Actions.ViewSubscription) : null;

  useEffect(() => {
    if (isAuthorized === false) router.replace("/bookings");
  }, [isAuthorized, router]);

  if (isAuthorized !== true) return null;

  return <SubscriptionPageContent />;
}

function SubscriptionPageContent() {
  const { user } = useAuth();
  const buildingId = user?.buildingId ?? "";
  const queryClient = useQueryClient();
  const toast = useToast();

  // ── Queries ──
  const { data: sub, isLoading: subLoading } = useQuery({
    queryKey: subscriptionKeys.detail(buildingId),
    queryFn: () => getSubscription(buildingId),
    enabled: !!buildingId,
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: subscriptionKeys.invoices(buildingId),
    queryFn: () => listInvoices(buildingId),
    enabled: !!buildingId,
  });

  const { data: templates = [] } = useQuery({
    queryKey: subscriptionKeys.templates,
    queryFn: listInvoiceNotificationTemplates,
  });

  // Building record gives us the physical mailing address shown read-only in
  // the billing edit modal. We try to find it in the buildings-list cache
  // first (no extra fetch), and fall back to a direct fetch if not present.
  const { data: building } = useQuery({
    queryKey: ["buildings", buildingId],
    queryFn: () => getBuilding(buildingId),
    enabled: !!buildingId,
  });

  // Local UI state
  const [showCancelModal,   setShowCancelModal]   = useState(false);
  const [showPaymentModal,  setShowPaymentModal]  = useState(false);
  const [showBillingModal,  setShowBillingModal]  = useState(false);
  const [docModal,          setDocModal]          = useState<"Privacy Policy" | "Terms of Service" | null>(null);

  // Drafts. Initialised from sub on first load and after a successful save.
  const [notifDraft,  setNotifDraft]  = useState<Subscription["invoiceNotifications"] | null>(null);
  const [emailsDraft, setEmailsDraft] = useState<string[] | null>(null);
  const [savedNotifsAt, setSavedNotifsAt] = useState<number | null>(null);
  const savedNotifs = savedNotifsAt !== null && Date.now() - savedNotifsAt < 3000;

  const currentNotifs  = sub?.invoiceNotifications;
  const currentEmails  = sub?.additionalInvoiceEmails ?? [];
  const notifDraftSafe = notifDraft ?? currentNotifs ?? null;
  const emailsDraftSafe = emailsDraft ?? currentEmails;

  const notifDirty =
    !!currentNotifs && !!notifDraftSafe && (
      notifDraftSafe.onRenewal           !== currentNotifs.onRenewal           ||
      notifDraftSafe.copyToBillingContact!== currentNotifs.copyToBillingContact ||
      notifDraftSafe.renewalReminder7Days!== currentNotifs.renewalReminder7Days ||
      notifDraftSafe.failedPaymentAlert  !== currentNotifs.failedPaymentAlert
    );

  const emailsDirty =
    emailsDraftSafe.length !== currentEmails.length ||
    emailsDraftSafe.some((e, i) => e !== currentEmails[i]);

  const anythingDirty = notifDirty || emailsDirty;

  // ── Mutations ──
  const invalidateSub = () => queryClient.invalidateQueries({ queryKey: subscriptionKeys.detail(buildingId) });

  // Note: card-update mutation lives in the Stripe Elements modal component
  // (`UpdateCardModal`) so it can use stripe.confirmSetup + attachSubscriptionPaymentMethod
  // from @/lib/api/subscriptions. The raw-card `updatePaymentMethod` helper was
  // removed when we deleted the PCI-scope route at app/api/subscriptions/payment-method/route.ts.

  const billingMutation = useMutation({
    mutationFn: (input: { company: string; email: string; taxId: string }) =>
      updateBillingInfo(buildingId, { subscriptionId: sub!.id, billingAddress: input }),
    onSuccess: (updated) => {
      queryClient.setQueryData(subscriptionKeys.detail(buildingId), updated);
      toast.show("Billing info updated");
      setShowBillingModal(false);
    },
    onError: () => toast.show("Could not update billing info"),
  });

  const notifMutation = useMutation({
    mutationFn: (next: { notifs: Subscription["invoiceNotifications"]; emails: string[] }) =>
      updateInvoiceNotifications(buildingId, {
        subscriptionId: sub!.id,
        invoiceNotifications: next.notifs,
        additionalInvoiceEmails: next.emails,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(subscriptionKeys.detail(buildingId), updated);
      setNotifDraft(null);
      setEmailsDraft(null);
      setSavedNotifsAt(Date.now());
      toast.show("Invoice notifications updated");
    },
    onError: () => toast.show("Could not update notifications"),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelSubscription(buildingId, { subscriptionId: sub!.id }),
    onSuccess: (updated) => {
      queryClient.setQueryData(subscriptionKeys.detail(buildingId), updated);
      const endDate = new Date(updated.nextRenewalDate);
      endDate.setMonth(endDate.getMonth() + 1);
      toast.show(`Subscription cancelled — access ends ${fmtFull(endDate.toISOString())}`);
      setShowCancelModal(false);
    },
    onError: () => toast.show("Could not cancel subscription"),
  });

  // ── Derived ──
  const paymentMethod = sub?.paymentMethod;
  const billing       = sub?.billingAddress;
  const isCancelled   = sub?.status === "Cancelled";
  const showCancel    = !!sub && !isCancelled;

  async function openBilling() {
    // Refetch first so EditBillingModal's `initial` reflects the latest server
    // state — otherwise opening it could seed stale fields and the save could
    // overwrite fresher data on the server.
    await invalidateSub();
    setShowBillingModal(true);
  }

  function openPayment() {
    setShowPaymentModal(true);
  }

  function openInvoice(url: string) {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function openAllInvoices() {
    // Open the hosted invoice page (the primary user-facing link) for each
    // invoice synchronously from the click handler. We CAN'T defer into
    // setTimeout — transient user activation expires between callbacks and
    // the browser blocks the pop-ups silently. A single user click is allowed
    // to open multiple tabs because each window.open is issued before the
    // activation expires (~5s in most browsers).
    const urls = invoices
      .map((inv) => inv.hostedInvoiceUrl)
      .filter((u): u is string => Boolean(u));
    urls.forEach((url) => window.open(url, "_blank", "noopener,noreferrer"));
    if (urls.length > 0) toast.show(`Opening ${urls.length} invoices…`);
  }

  const closePaymentModal = useCallback(() => setShowPaymentModal(false), []);

  return (
    <>
      {showCancelModal && sub && (
        <UnsubscribeModal
          onClose={() => setShowCancelModal(false)}
          onConfirm={() => cancelMutation.mutate()}
          nextRenewalDate={sub.nextRenewalDate}
          saving={cancelMutation.isPending}
        />
      )}
      {/* The new Stripe Elements UpdateCardModal is rendered when showPaymentModal is true.
          The legacy UpdatePaymentModal (raw card fields, PCI scope) is removed. */}
      {showPaymentModal && sub && (
        <UpdateCardModal
          buildingId={buildingId}
          subscriptionId={sub.id}
          onClose={closePaymentModal}
          onSuccess={closePaymentModal}
        />
      )}
      {showBillingModal && sub && building && (
        <EditBillingModal
          onClose={() => setShowBillingModal(false)}
          saving={billingMutation.isPending}
          error={billingMutation.isError ? (billingMutation.error as Error)?.message ?? "Save failed" : ""}
          onSave={(input) => billingMutation.mutate(input)}
          initial={{ company: billing?.company ?? "", email: billing?.email ?? "", taxId: billing?.taxId ?? "" }}
          buildingAddress={{
            street: building.address,
            city:   building.city,
            state:  building.state,
            zip:    building.zipCode,
          }}
        />
      )}
      {docModal && <DocumentModal title={docModal} onClose={() => setDocModal(null)} />}

      <div style={{
        padding:       "var(--spacing-24)",
        maxWidth:      900,
        display:       "flex",
        flexDirection: "column",
        gap:           "var(--spacing-24)",
      }}>

        {/* ── Page header ── */}
        <div>
          <h1 style={{
            margin:     0,
            fontSize:   "var(--font-size-heading-1)",
            lineHeight: "var(--line-height-heading-1)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            color:      "var(--color-text-strong)",
            fontFamily: "var(--font-family-heading)",
          }}>
            Subscription
          </h1>
          <p style={{
            margin:     "var(--spacing-8) 0 0",
            fontSize:   "var(--font-size-body)",
            lineHeight: "var(--line-height-body)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            color:      "var(--color-text-weak)",
            fontFamily: "var(--font-family-body)",
          }}>
            Manage your Parqlet subscription and payment methods
          </p>
        </div>

        {/* ── Section 1: Plan Overview ── */}
        <PlanCard sub={sub ?? undefined} isLoading={subLoading} />

        {/* ── Section 2: Payment Method ── */}
        <Card>
          <CardHeader
            title="Payment Method"
            action={
              // ACH subscriptions have no card on file — the only way to
              // "update" the payment method is to wait for finance to
              // approve the transfer (or move back to a card). Hide the
              // Update button until then rather than offering a misleading
              // affordance.
              sub && sub.paymentMethodType === "credit_card" ? (
                <Button
                  variant="primary"
                  onClick={openPayment}
                  disabled={!sub || isCancelled}
                >
                  Update Payment Method
                </Button>
              ) : sub && sub.paymentMethodType === "ach" ? (
                <span style={{
                  display:       "inline-flex",
                  alignItems:    "center",
                  gap:           6,
                  fontFamily:    "var(--font-family-body)",
                  fontSize:      "var(--font-size-extra-tiny)",
                  color:         "var(--color-text-weak)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}>
                  <span
                    aria-hidden="true"
                    style={{
                      width:        8,
                      height:       8,
                      borderRadius: "50%",
                      background:   "var(--color-fill-warning, #f59e0b)",
                    }}
                  />
                  {achStatusLabel(sub.achPaymentStatus)}
                </span>
              ) : null
            }
          />
          <div style={{ padding: "var(--spacing-20)" }}>
            {subLoading ? (
              <div style={{ background: "var(--color-fill-white)", border: "1px solid var(--color-stroke-medium)", borderRadius: 12, padding: "14px 16px", height: 60 }} />
            ) : sub && sub.paymentMethodType === "ach" ? (
              <AchPaymentMethodCard sub={sub} />
            ) : paymentMethod ? (
              <div style={{
                background:     "var(--color-fill-white)",
                border:         "1px solid var(--color-stroke-medium)",
                borderRadius:   12,
                padding:        "14px 16px",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{
                    background:    "#1A1F71",
                    color:         "var(--color-text-white)",
                    fontSize:      10,
                    fontWeight:    700,
                    fontFamily:    "var(--font-family-body)",
                    padding:       "4px 7px",
                    borderRadius:  5,
                    letterSpacing: "0.05em",
                    lineHeight:    1,
                    flexShrink:    0,
                  }}>
                    {paymentMethod.brand}
                  </span>
                  <div>
                    <p style={{
                      margin:       0,
                      fontFamily:   "var(--font-family-body)",
                      fontSize:     "var(--font-size-tiny)",
                      fontWeight:   "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                      color:        "var(--color-text-strong)",
                      lineHeight:   "var(--line-height-tiny)",
                      marginBottom: 2,
                    }}>
                      •••• •••• •••• {paymentMethod.last4}
                    </p>
                    <p style={{
                      margin:     0,
                      fontFamily: "var(--font-family-body)",
                      fontSize:   "var(--font-size-extra-tiny)",
                      fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                      color:      "var(--color-text-weak)",
                      lineHeight: "var(--line-height-extra-tiny)",
                    }}>
                      Expires {paymentMethod.expiry}
                    </p>
                  </div>
                </div>
                <span style={{
                  fontFamily: "var(--font-family-body)",
                  fontSize:   "var(--font-size-extra-tiny)",
                  fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                  color:      "var(--color-text-weak)",
                }}>
                  Default
                </span>
              </div>
            ) : (
              <p style={{ color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)" }}>
                No payment method on file.
              </p>
            )}
          </div>
        </Card>

        {/* ── ACH Transfer Details ──
            Duplicates the bank instructions on the subscription page so
            the HOA admin has the wire details at-a-glance without having
            to re-run the onboarding flow. Only rendered when the
            subscription is on ACH. The plan card above already shows a
            one-line indicator ("Paying via · ACH bank transfer · …");
            this block is the full receipt with the memo, the receiving
            account, and a copy-to-clipboard for the routing + account. */}
        {sub && sub.paymentMethodType === "ach" && sub.achRemittanceReference && (
          <Card>
            <CardHeader
              title="ACH Transfer Details"
              action={
                <span style={{
                  display:       "inline-flex",
                  alignItems:    "center",
                  gap:           6,
                  fontFamily:    "var(--font-family-body)",
                  fontSize:      "var(--font-size-extra-tiny)",
                  fontWeight:    "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                  color:         "var(--color-text-weak)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}>
                  <span
                    aria-hidden="true"
                    style={{
                      width:        8,
                      height:       8,
                      borderRadius: "50%",
                      background:   sub.achPaymentStatus === "approved"
                        ? "var(--color-fill-success, #10b981)"
                        : sub.achPaymentStatus === "rejected"
                          ? "var(--color-fill-error, #dc2626)"
                          : "var(--color-fill-warning, #f59e0b)",
                    }}
                  />
                  {achStatusLabel(sub.achPaymentStatus)}
                </span>
              }
            />
            <div style={{ padding: "var(--spacing-20)" }}>

              {/* Memo — the most important field, surfaced first. */}
              <div style={{
                padding:      "var(--spacing-16) var(--spacing-20)",
                background:   "var(--color-fill-accent)",
                borderRadius: "var(--radius-12)",
                display:      "flex",
                flexDirection:"column",
                gap:          6,
                marginBottom: "var(--spacing-16)",
              }}>
                <span style={{
                  fontFamily:    "var(--font-family-body)",
                  fontSize:      "var(--font-size-extra-tiny)",
                  fontWeight:    "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                  // Sits on the fixed brand green background — keep it dark; doesn't invert in dark mode.
                  color:         "#222222",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}>
                  Bank memo / reference — REQUIRED
                </span>
                <div style={{
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "space-between",
                  gap:            12,
                }}>
                  <span style={{
                    fontFamily: "var(--font-family-heading)",
                    fontSize:   "var(--font-size-heading-3)",
                    lineHeight: "var(--line-height-heading-3)",
                    fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                    // Sits on the fixed brand green background — keep it dark; doesn't invert in dark mode.
                    color:      "#222222",
                    fontFeatureSettings: '"tnum" 1',
                  }}>
                    {sub.achRemittanceReference}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator === "undefined" || !navigator.clipboard) return;
                      void navigator.clipboard.writeText(sub.achRemittanceReference!);
                    }}
                    style={{
                      height:        32,
                      padding:       "0 var(--spacing-12)",
                      background:    "var(--color-fill-white)",
                      border:        "1px solid var(--color-stroke-medium)",
                      borderRadius:  "var(--radius-8)",
                      cursor:        "pointer",
                      fontFamily:    "var(--font-family-body)",
                      fontSize:      "var(--font-size-extra-tiny)",
                      color:         "var(--color-text-strong)",
                      whiteSpace:    "nowrap",
                      flexShrink:    0,
                    }}
                  >
                    Copy
                  </button>
                </div>
                <span style={{
                  fontFamily: "var(--font-family-body)",
                  fontSize:   "var(--font-size-extra-tiny)",
                  fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                  // Sits on the fixed brand green background — keep it dark; doesn't invert in dark mode.
                  color:      "#222222",
                  lineHeight: "var(--line-height-extra-tiny)",
                }}>
                  Include this exact string in the memo / reference field of your bank&apos;s transfer form so we can match the payment to your building.
                </span>
              </div>

              {/* Bank details — grouped into Beneficiary + Receiving bank. */}
              <div style={{
                display:       "flex",
                flexDirection: "column",
                gap:           "var(--spacing-12)",
                padding:       "var(--spacing-20)",
                background:    "var(--color-fill-white)",
                border:        "1px solid var(--color-divider-neutral)",
                borderRadius:  "var(--radius-12)",
              }}>
                <DetailGroup label="Beneficiary">
                  <DetailRow label="Name"    value={ACH_INSTRUCTIONS.beneficiaryName} />
                  <DetailRow
                    label="Address"
                    value={formatAddress(ACH_INSTRUCTIONS.beneficiaryAddress).join(", ")}
                    copyable={formatAddress(ACH_INSTRUCTIONS.beneficiaryAddress).join(", ")}
                  />
                </DetailGroup>
                <DetailGroup label="Receiving bank">
                  <DetailRow label="Bank"          value={ACH_INSTRUCTIONS.bankName} />
                  <DetailRow
                    label="Bank address"
                    value={formatAddress(ACH_INSTRUCTIONS.bankAddress).join(", ")}
                    copyable={formatAddress(ACH_INSTRUCTIONS.bankAddress).join(", ")}
                  />
                  <DetailRow
                    label="Routing number (ABA)"
                    value={formatRoutingNumber(ACH_INSTRUCTIONS.routingNumber)}
                    copyable={ACH_INSTRUCTIONS.routingNumber}
                  />
                  <DetailRow
                    label="Account number"
                    value={maskAccountNumber(ACH_INSTRUCTIONS.accountNumber, 4)}
                    copyable={ACH_INSTRUCTIONS.accountNumber}
                  />
                  <DetailRow
                    label="Account type"
                    value={ACH_INSTRUCTIONS.accountType[0].toUpperCase() + ACH_INSTRUCTIONS.accountType.slice(1)}
                  />
                </DetailGroup>
                <DetailGroup label="Amount">
                  <DetailRow
                    label="Send"
                    value={`${sub.mrr.toLocaleString("en-US", { style: "currency", currency: "USD" })} per month`}
                  />
                </DetailGroup>
              </div>

              {sub.achApprovedAt && (
                <p style={{
                  margin:     "var(--spacing-12) 0 0",
                  fontFamily: "var(--font-family-body)",
                  fontSize:   "var(--font-size-extra-tiny)",
                  color:      "var(--color-text-weak)",
                }}>
                  Approved {new Date(sub.achApprovedAt).toLocaleDateString()}.
                </p>
              )}
            </div>
          </Card>
        )}

        {/* ── Section 3: Billing Information ── */}
        <Card>
          <CardHeader
            title="Billing Information"
            action={
              <Button
                variant="secondary"
                onClick={openBilling}
                disabled={!sub || isCancelled}
              >
                Edit
              </Button>
            }
          />
          <div style={{ padding: "var(--spacing-20)" }}>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 20 }}>
              {subLoading ? (
                <>
                  <div style={{ background: "var(--color-fill-white)", border: "1px solid var(--color-stroke-medium)", borderRadius: 12, padding: "14px 16px", height: 72 }} />
                  <div style={{ background: "var(--color-fill-white)", border: "1px solid var(--color-stroke-medium)", borderRadius: 12, padding: "14px 16px", height: 72 }} />
                </>
              ) : (
                <>
                  <FieldTile icon={<IcCreditCard />} label="Company name"  value={billing?.company || "—"} />
                  <FieldTile icon={<IcEnvelope />}   label="Billing email" value={billing?.email || "—"}   />
                </>
              )}
            </div>

            <div style={{ height: 1, background: "var(--color-gray-30)", marginBottom: 16 }} />

            {/* Invoice notifications */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{
                display:       "block",
                fontFamily:    "var(--font-family-body)",
                fontSize:      "var(--font-size-uppercase)",
                lineHeight:    "var(--line-height-uppercase)",
                fontWeight:    "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                color:         "var(--color-text-weak)",
                textTransform: "uppercase" as const,
              }}>
                Invoice notifications
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {savedNotifs && <SavedBadge />}
                <Button
                  variant="secondary"
                  disabled={!sub || isCancelled || notifMutation.isPending || !anythingDirty}
                  onClick={() => notifMutation.mutate({
                    notifs:  notifDraftSafe!,
                    emails:  emailsDraftSafe,
                  })}
                >
                  {notifMutation.isPending ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </div>

            {sub && !subLoading && notifDraftSafe && templates.length > 0 && (
              <>
                {templates.map((t, i) => {
                  const field = TEMPLATE_ID_TO_FIELD[t.id];
                  if (!field) return null;
                  return (
                    <NotifRow
                      key={t.id}
                      label={t.label}
                      sub={t.description}
                      on={notifDraftSafe[field]}
                      onChange={() =>
                        setNotifDraft({
                          ...notifDraftSafe,
                          [field]: !notifDraftSafe[field],
                        })
                      }
                      last={i === templates.length - 1}
                    />
                  );
                })}
              </>
            )}

            {/* Additional emails (always shown so user can pre-populate before enabling the toggle) */}
            {sub && !subLoading && (
              <div style={{
                padding:      "var(--spacing-16) 0 var(--spacing-16)",
                borderTop:    "1px solid var(--color-stroke-medium)",
                marginTop:    12,
              }}>
                <div style={{
                  display:    "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}>
                  <label style={{
                    fontFamily:    "var(--font-family-body)",
                    fontSize:      "var(--font-size-extra-tiny)",
                    fontWeight:    "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                    color:         "var(--color-text-weak)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}>
                    Additional email recipients
                  </label>
                  {savedNotifs && <SavedBadge />}
                </div>
                <EmailChipInput
                  value={emailsDraftSafe}
                  onChange={setEmailsDraft}
                  placeholder="treasurer@example.com"
                  disabled={!sub || isCancelled}
                />
                <p style={{
                  margin:     "var(--spacing-8) 0 0",
                  fontFamily: "var(--font-family-body)",
                  fontSize:   "var(--font-size-extra-tiny)",
                  color:      "var(--color-text-weaker)",
                  lineHeight: "var(--line-height-extra-tiny)",
                }}>
                  Press <strong>Enter</strong> or <strong>,</strong> to add each recipient. Click × to remove.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* ── Section 4: Invoice History ── */}
        <Card>
          <CardHeader
            title="Invoice History"
            action={
              <Button
                variant="secondary"
                onClick={openAllInvoices}
                disabled={!sub || invoices.length === 0}
              >
                Open all
              </Button>
            }
          />
          <div style={{ padding: "0 var(--spacing-20)" }}>
          <TableScroll minWidth={640}>

            <div style={{
              display:             "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr 140px",
              paddingBottom:       10,
              paddingTop:          14,
              borderBottom:        "1px solid var(--color-gray-30)",
            }}>
              {["Invoice", "Date", "Amount", "Status", ""].map((col) => (
                <span key={col} style={{
                  fontFamily:    "var(--font-family-body)",
                  lineHeight:    "var(--line-height-uppercase)",
                  fontWeight:    "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                  color:         "var(--color-text-weak)",
                  textTransform: "uppercase" as const,
                  minWidth:      0,
                  maxWidth:      "100%",
                }}>
                  {col ? <TableHeadLabel>{col}</TableHeadLabel> : null}
                </span>
              ))}
            </div>

            {invoicesLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ padding: "12px 0", borderBottom: i < 3 ? "1px solid var(--color-gray-20)" : "none" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 140px", alignItems: "center" }}>
                      <div style={{ width: 60, height: 14, background: "var(--color-gray-30)", borderRadius: 4 }} />
                      <div style={{ width: 80, height: 14, background: "var(--color-gray-30)", borderRadius: 4 }} />
                      <div style={{ width: 50, height: 14, background: "var(--color-gray-30)", borderRadius: 4 }} />
                      <div style={{ width: 40, height: 20, background: "var(--color-gray-30)", borderRadius: 10 }} />
                      <div />
                    </div>
                  </div>
                ))}
              </>
            ) : invoices.length === 0 ? (
              <p style={{ padding: "24px 0", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)", textAlign: "center" }}>No invoices yet</p>
            ) : (
              invoices.map((inv, i) => (
                <div
                  key={inv.id}
                  style={{
                    display:             "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr 140px",
                    padding:             "12px 0",
                    borderBottom:        i < invoices.length - 1 ? "1px solid var(--color-gray-20)" : "none",
                    alignItems:          "center",
                  }}
                >
                  <CopyableCell value={inv.id}>
                    <IdDisplay value={inv.id} style={{ fontFamily: "var(--font-family-body)", fontSize: 14, fontWeight: 500 }} />
                  </CopyableCell>
                  <CopyableCell value={fmtDate(inv.date)}>
                    <span style={{ fontFamily: "var(--font-family-body)", fontSize: 13, fontWeight: 400, color: "var(--color-text-weak)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {fmtDate(inv.date)}
                    </span>
                  </CopyableCell>
                  <CopyableCell value={`$${inv.amount.toFixed(2)}`}>
                    <span style={{ fontFamily: "var(--font-family-body)", fontSize: 13, fontWeight: 400, color: "var(--color-text-weak)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      ${inv.amount.toFixed(2)}
                    </span>
                  </CopyableCell>
                  <CopyableCell value={inv.status}>
                    <span style={{
                      display:      "inline-flex",
                      alignItems:   "center",
                      background:   inv.status === "Paid" ? "var(--color-tag-active)" : inv.status === "Failed" ? "var(--color-tag-terminated)" : "var(--color-gray-15)",
                      color:        inv.status === "Paid" ? "var(--color-tag-text-active)" : inv.status === "Failed" ? "var(--color-tag-text-terminated)" : "var(--color-text-weak)",
                      borderRadius: "var(--radius-48)",
                      padding:      "3px 10px",
                      fontSize:     12,
                      fontWeight:   400,
                      fontFamily:   "var(--font-family-body)",
                      whiteSpace:   "nowrap" as const,
                      width:        "fit-content",
                      maxWidth:     "100%",
                      overflow:     "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {inv.status}
                    </span>
                  </CopyableCell>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
                    <ViewBtn
                      onClick={() => openInvoice(inv.hostedInvoiceUrl)}
                      disabled={!inv.hostedInvoiceUrl}
                    />
                    <PdfBtn
                      onClick={() => openInvoice(inv.pdfUrl)}
                      disabled={!inv.pdfUrl}
                    />
                  </div>
                </div>
              ))
            )}
            <div style={{ height: "var(--spacing-20)" }} />
          </TableScroll>
          </div>
        </Card>

        {/* ── Section 5: Cancel Subscription (only when sub exists and is not already cancelled) ── */}
        {showCancel && (
          <Card>
            <div style={{ padding: "var(--spacing-20)" }}>
              <div style={{
                background:      "var(--color-red-50)",
                border:          "1px solid var(--color-red-100)",
                borderRadius:    12,
                padding:         "16px 20px",
                display:         "flex",
                alignItems:      "center",
                justifyContent:  "space-between",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin:     "0 0 4px",
                    fontFamily: "var(--font-family-heading)",
                    fontSize:   15,
                    fontWeight: 500,
                    color:      "var(--color-text-strong)",
                    lineHeight: "20px",
                  }}>
                    Cancel Subscription
                  </p>
                  <p style={{
                    margin:     0,
                    fontFamily: "var(--font-family-body)",
                    fontSize:   13,
                    fontWeight: 400,
                    color:      "var(--color-text-strong)",
                    lineHeight: "18px",
                  }}>
                    A one-month notice is required. If you cancel today, your subscription will remain
                    active until{" "}
                    <strong style={{ color: "var(--color-text-strong)", fontWeight: 600 }}>
                      {fmtFull(plusOneMonth(sub!.nextRenewalDate))}
                    </strong>.
                  </p>
                </div>
                <Button variant="danger" onClick={() => setShowCancelModal(true)}>Unsubscribe</Button>
              </div>

              <div style={{
                display:    "flex",
                alignItems: "flex-start",
                gap:        6,
                marginTop:  14,
                padding:    "0 4px",
              }}>
                <div style={{ flexShrink: 0, marginTop: 1, color: "var(--color-text-weak)" }}>
                  <IcInfo />
                </div>
                <span style={{
                  fontFamily: "var(--font-family-body)",
                  fontSize:   12,
                  fontWeight: 400,
                  color:      "var(--color-text-weak)",
                  lineHeight: "17px",
                }}>
                  Cancellation removes all resident access and booking history at the end of the billing period.
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* The Privacy Policy / Terms of Service pair that used to close
            this page is gone: both are permanent items in the left nav, so
            repeating them here was a second route to the same two
            documents and the only page that did it. */}

      </div>

      {toast.node}
    </>
  );
}

// ─── Helpers used by the page ─────────────────────────────────────────────────

function plusOneMonth(iso: string): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}
