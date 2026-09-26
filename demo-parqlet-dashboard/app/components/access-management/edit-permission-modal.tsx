import { useState, useEffect } from "react";
import { IcClose } from "../../components/icons/IcClose";
import { StatusBadge } from "./status-badge";
import type { TeamMember } from "../../lib/api/members";

// Role tokens must match the backend enum exactly
// (parqlet-backend/src/db/schema/index.ts memberRoleEnum). The backend
// rejects invites and role updates with anything outside the canonical
// list — so picking "HOA Admin" / "Super Admin" / "View Only" silently
// failed the request and surfaced as a generic "failed to send" toast.
export const HOA_ROLES = ["Admin", "Lead Concierge", "Concierge", "Security"] as const;
export const SUPER_ADMIN_ROLES = ["Superadmin", "Developer"] as const;
export type MemberRole = string;

/**
 * Map legacy role strings (from older mock data and pre-rename records)
 * to the canonical enum. The select binds `value` to one of the entries
 * in `HOA_ROLES` / `SUPER_ADMIN_ROLES`, so an unmapped legacy value
 * would silently have no matching <option>.
 */
const LEGACY_ROLE_ALIASES: Record<string, string> = {
  "HOA Admin": "Admin",
  "Building Manager": "Lead Concierge",
};
export function normalizeRole(role: string | undefined | null, fallback: string): string {
  if (!role) return fallback;
  return LEGACY_ROLE_ALIASES[role] ?? role;
}

interface EditPermissionModalProps {
  member: TeamMember;
  onClose: () => void;
  onSave: (newRole: MemberRole) => Promise<void>;
  roles?: readonly string[];
}

export function EditPermissionModal({ member, onClose, onSave, roles = HOA_ROLES }: EditPermissionModalProps) {
  const [role, setRole] = useState<MemberRole>(normalizeRole(member.role, roles[0] ?? "Lead Concierge"));
  const [saving, setSaving] = useState(false);

  function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
  useEffect(() => {
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const initials = member.name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";
  const changed = role !== normalizeRole(member.role, roles[0] ?? "Lead Concierge");

  async function handleSave() {
    if (!changed || saving) return;
    setSaving(true);
    try {
      await onSave(role);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 600,
        background: "rgba(0,0,0,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "var(--spacing-24)",
      }}
    >
      <div style={{
        background: "var(--color-fill-white)",
        borderRadius: "var(--radius-20)",
        width: "100%", maxWidth: 480,
        display: "flex", flexDirection: "column",
        boxShadow: "0 8px 40px rgba(0,0,0,0.16)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          padding: "var(--spacing-24) var(--spacing-24) 0",
        }}>
          <div>
            <h2 style={{
              margin: 0, fontSize: "var(--font-size-heading-3)",
              fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
              lineHeight: "var(--line-height-heading-3)", color: "var(--color-text-strong)",
              fontFamily: "var(--font-family-heading)",
            }}>Edit Permission</h2>
            <p style={{
              margin: "var(--spacing-4) 0 0", fontSize: "var(--font-size-tiny)",
              fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
              color: "var(--color-text-weak)", lineHeight: "var(--line-height-tiny)",
              fontFamily: "var(--font-family-body)",
            }}>Update this member&apos;s role on the platform.</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "var(--color-gray-5)", border: "none", cursor: "pointer",
              borderRadius: "var(--radius-8)", padding: "var(--spacing-4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, marginLeft: "var(--spacing-16)", transition: "background 0.12s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-gray-20)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-gray-5)"; }}
          >
            <IcClose size={18} />
          </button>
        </div>

        {/* Member identity */}
        <div style={{
          display: "flex", alignItems: "center", gap: "var(--spacing-12)",
          margin: "var(--spacing-24) var(--spacing-24) 0",
          padding: "var(--spacing-16)", background: "var(--color-gray-5)",
          borderRadius: "var(--radius-12)",
        }}>
          <div style={{
            width: 40, height: 40, flexShrink: 0, borderRadius: "50%",
            background: "var(--color-fill-strong)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: "var(--font-size-extra-tiny)", fontFamily: "var(--font-family-body)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--color-text-white)", lineHeight: 1 }}>
              {initials}
            </span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "var(--font-size-tiny)", fontFamily: "var(--font-family-body)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--color-text-strong)", lineHeight: "var(--line-height-tiny)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {member.name}
            </div>
            <div style={{ fontSize: "var(--font-size-extra-tiny)", fontFamily: "var(--font-family-body)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], color: "var(--color-text-weak)", lineHeight: "var(--line-height-extra-tiny)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {member.email}
            </div>
          </div>
          <div style={{ marginLeft: "auto", flexShrink: 0 }}>
            <StatusBadge status={member.status} />
          </div>
        </div>

        {/* Role field */}
        <div style={{ padding: "var(--spacing-24)", display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
          <span style={{ fontSize: "var(--font-size-extra-tiny)", fontFamily: "var(--font-family-body)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-extra-tiny)", color: "var(--color-text-strong)" }}>
            Role
          </span>
          <div style={{ position: "relative" }}>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as MemberRole)}
              style={{
                width: "100%", border: "1px solid var(--color-stroke-medium)",
                borderRadius: "var(--radius-8)", padding: "12px var(--spacing-32) 12px var(--spacing-12)",
                fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)",
                color: "var(--color-text-strong)", lineHeight: "var(--line-height-tiny)",
                fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                background: "var(--color-fill-white)", outline: "none",
                appearance: "none", WebkitAppearance: "none", cursor: "pointer",
              }}
            >
              {roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <path d="M6 9l6 6 6-6" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div style={{ height: 1, background: "var(--color-stroke-medium)", flexShrink: 0 }} />

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "var(--spacing-12)", padding: "var(--spacing-16) var(--spacing-24)" }}>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "10px 0", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"] }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-text-strong)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-weak)"; }}
          >Cancel</button>
          <button
            onClick={changed && !saving ? handleSave : undefined}
            disabled={!changed || saving}
            style={{
              background: changed && !saving ? "var(--color-fill-strong)" : "var(--color-gray-20)",
              color: changed && !saving ? "var(--color-text-white)" : "var(--color-text-disabled)",
              border: "none", borderRadius: "var(--radius-8)",
              padding: "10px var(--spacing-20)", cursor: changed && !saving ? "pointer" : "default",
              fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)",
              fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
              lineHeight: "var(--line-height-tiny)", transition: "background 0.15s, color 0.15s", whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => { if (changed && !saving) e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
