import { useState, useEffect } from "react";
import { IcClose } from "../../components/icons/IcClose";
import { IcPlus } from "./icons";
import { TrashButton } from "./table-row";
import { HOA_ROLES, type MemberRole } from "./edit-permission-modal";
import { Input } from "../ui/Input";
import { useWindowWidth } from "../hooks/useWindowSize";

const fieldLabelStyle: React.CSSProperties = {
  fontSize: "var(--font-size-extra-tiny)", fontFamily: "var(--font-family-body)",
  fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
  lineHeight: "var(--line-height-extra-tiny)", color: "var(--color-text-strong)",
  marginBottom: "var(--spacing-4)", display: "block",
};

interface InviteEntry { id: string; name: string; email: string; role: MemberRole; buildingId?: string; }

interface InviteResult {
  email: string;
  enrollmentUrl: string;
}

export interface InviteModalBuilding { id: string; name: string; }

interface InviteModalProps {
  onClose: () => void;
  onSend: (entries: InviteEntry[]) => Promise<InviteResult[]>;
  roles?: readonly string[];
  /**
   * Buildings the inviter can scope invites to. Pass an empty array (the
   * default) when the inviter is scoped to a single building — the modal
   * then auto-fills that building on every row and hides the picker.
   * Pass >1 building for super_admin (or any cross-building inviter) so
   * each row can pick its own building; the picker is required.
   */
  buildings?: InviteModalBuilding[];
  /** Used as the default for new rows when `buildings` has exactly one entry. */
  defaultBuildingId?: string;
}

export function InviteModal({ onClose, onSend, roles = HOA_ROLES, buildings, defaultBuildingId }: InviteModalProps) {
  const width = useWindowWidth();
  const isMobile = width < 640;
  const showBuildingPicker = !!buildings && buildings.length > 1;
  const lockedBuildingId = !showBuildingPicker
    ? (defaultBuildingId ?? buildings?.[0]?.id)
    : undefined;
  // Fixed, capped widths for Name/Email/Role ONLY in the multi-building
  // (Super Admin Access Management) invocation of this modal, AND only on
  // desktop — freeing up room for Building, which needs it more. On mobile
  // the rows stack in a column, so a pixel flex-basis sizes main-axis
  // (height, not width) and would force each field to that many pixels
  // tall; mobile always keeps the original full-width/flexible sizing.
  // HOA invites (single building, picker hidden) are unaffected either way.
  const capColumns = showBuildingPicker && !isMobile;
  const nameColStyle: React.CSSProperties = capColumns
    ? { flex: "0 0 150px", maxWidth: 150 }
    : { flex: "3 1 0" };
  const emailColStyle: React.CSSProperties = capColumns
    ? { flex: "0 0 200px", maxWidth: 200 }
    : { flex: "4 1 0" };
  const roleColStyle: React.CSSProperties = capColumns
    ? { flex: "0 0 150px", maxWidth: 150 }
    : { flex: "3 1 0" };
  const [entries, setEntries] = useState<InviteEntry[]>([
    {
      id: "e-1",
      name: "",
      email: "",
      role: roles[0] ?? "Lead Concierge",
      buildingId: lockedBuildingId,
    },
  ]);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<InviteResult[] | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Backfill rows once `buildings` resolves after the modal has already
  // mounted with `lockedBuildingId` undefined (async building fetch).
  // Without this, the picker stays hidden (length === 1 still fails
  // `> 1`) and rows keep `buildingId: undefined`, so the Send button is
  // permanently disabled with no visible way to fix it.
  useEffect(() => {
    if (!lockedBuildingId) return;
    setEntries((prev) =>
      prev.map((e) => (e.buildingId ? e : { ...e, buildingId: lockedBuildingId }))
    );
  }, [lockedBuildingId]);

  function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
  useEffect(() => {
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function addRow() {
    setEntries((prev) => [...prev, {
      id: `e-${Date.now()}`,
      name: "",
      email: "",
      role: roles[0] ?? "Lead Concierge",
      buildingId: lockedBuildingId ?? prev[0]?.buildingId,
    }]);
  }
  function removeRow(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }
  function update(id: string, field: keyof InviteEntry, value: string) {
    setEntries((prev) => prev.map((e) => {
      if (e.id !== id) return e;
      if (field === "role") {
        // Superadmin invites are platform-wide — the backend's
        // inviteMemberSchema requires buildingId to be null for this role
        // and 400s if one is set, so clear any previously-picked building
        // when switching a row to Superadmin. Switching back away from it
        // restores the single-building default (if applicable) so the row
        // doesn't silently stay unsendable.
        return {
          ...e,
          role: value as MemberRole,
          buildingId: value === "Superadmin" ? undefined : (e.buildingId ?? lockedBuildingId),
        };
      }
      return { ...e, [field]: value };
    }));
  }

  // Each row is sendable iff it has an email AND (a buildingId OR is a
  // Superadmin invite, which must NOT have one — see inviteMemberSchema).
  const validCount = entries.filter((e) => e.email.trim().length > 0 && (e.role === "Superadmin" || e.buildingId)).length;
  const canSend = validCount > 0 && !sending;

  

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    try {
      const res = await onSend(entries);
      setResults(res);
    } finally {
      setSending(false);
    }
  }

  async function copyUrl(url: string, idx: number) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  }

  // ── Results view ────────────────────────────────────────────────────
  if (results) {
    const successResults = results.filter((r) => r.enrollmentUrl);
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3005";

    return (
      <div
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--spacing-24)" }}
      >
        <div style={{ background: "var(--color-fill-white)", borderRadius: "var(--radius-20)", width: "100%", maxWidth: 600, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 40px rgba(0,0,0,0.16)" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "var(--spacing-24) var(--spacing-24) 0" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "var(--font-size-heading-3)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-heading-3)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-heading)" }}>
                Invites Sent
              </h2>
              <p style={{ margin: "var(--spacing-4) 0 0", fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], color: "var(--color-text-weak)", lineHeight: "var(--line-height-tiny)", fontFamily: "var(--font-family-body)" }}>
                {successResults.length} of {results.length} invite{results.length !== 1 ? "s" : ""} sent successfully
              </p>
            </div>
            <button
              onClick={onClose}
              style={{ background: "var(--color-gray-5)", border: "none", cursor: "pointer", borderRadius: "var(--radius-8)", padding: "var(--spacing-4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: "var(--spacing-16)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-gray-20)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-gray-5)"; }}
            >
              <IcClose size={18} />
            </button>
          </div>

          {/* Enrollment links */}
          <div style={{ padding: "var(--spacing-20) var(--spacing-24)", display: "flex", flexDirection: "column", gap: "var(--spacing-12)" }}>
            {successResults.map((r, i) => {
              const fullUrl = `${origin}${r.enrollmentUrl}`;
              return (
                <div key={r.email} style={{
                  display: "flex", alignItems: "center", gap: "var(--spacing-8)",
                  padding: "var(--spacing-12) var(--spacing-16)",
                  border: "1px solid var(--color-stroke-medium)",
                  borderRadius: "var(--radius-12)",
                  background: "var(--color-fill-weak)",
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "var(--font-size-tiny)", fontWeight: "500" as React.CSSProperties["fontWeight"], color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)" }}>
                      {r.email}
                    </div>
                    <div style={{
                      fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)",
                      fontFamily: "monospace", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {fullUrl}
                    </div>
                  </div>
                  <button
                    onClick={() => copyUrl(fullUrl, i)}
                    style={{
                      flexShrink: 0,
                      background: copiedIndex === i ? "var(--color-tag-active)" : "var(--color-fill-white)",
                      border: "1px solid var(--color-stroke-medium)",
                      borderRadius: "var(--radius-8)",
                      padding: "8px 12px",
                      cursor: "pointer",
                      fontSize: "var(--font-size-extra-tiny)",
                      fontFamily: "var(--font-family-body)",
                      color: copiedIndex === i ? "var(--color-tag-text-active)" : "var(--color-text-strong)",
                      transition: "background 0.15s, color 0.15s",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => { if (copiedIndex !== i) e.currentTarget.style.background = "var(--color-gray-10)"; }}
                    onMouseLeave={(e) => { if (copiedIndex !== i) e.currentTarget.style.background = "var(--color-fill-white)"; }}
                  >
                    {copiedIndex === i ? "Copied!" : "Copy Link"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ height: 1, background: "var(--color-stroke-medium)", flexShrink: 0 }} />
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "var(--spacing-16) var(--spacing-24)", flexShrink: 0 }}>
            <button
              onClick={onClose}
              style={{
                background: "var(--color-fill-strong)", color: "var(--color-text-white)",
                border: "none", borderRadius: "var(--radius-12)",
                padding: "10px var(--spacing-20)",
                cursor: "pointer",
                fontFamily: "var(--font-family-body)",
                fontSize: "var(--font-size-tiny)",
                fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form view ───────────────────────────────────────────────────────
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--spacing-24)" }}
    >
      <div style={{ background: "var(--color-fill-white)", borderRadius: "var(--radius-20)", width: "100%", maxWidth: showBuildingPicker ? 880 : 600, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 40px rgba(0,0,0,0.16)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "var(--spacing-24) var(--spacing-24) 0" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "var(--font-size-heading-3)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-heading-3)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-heading)" }}>
              Invite Team Members
            </h2>
            <p style={{ margin: "var(--spacing-4) 0 0", fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], color: "var(--color-text-weak)", lineHeight: "var(--line-height-tiny)", fontFamily: "var(--font-family-body)" }}>
              Add members. Each invite generates a unique enrollment link.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "var(--color-gray-5)", border: "none", cursor: "pointer", borderRadius: "var(--radius-8)", padding: "var(--spacing-4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: "var(--spacing-16)", transition: "background 0.12s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-gray-20)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-gray-5)"; }}
          >
            <IcClose size={18} />
          </button>
        </div>

        {/* Column labels (desktop only — mobile shows inline labels per stacked field instead) */}
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-8)", padding: "var(--spacing-16) var(--spacing-24) 0" }}>
            <div style={nameColStyle}><span style={fieldLabelStyle}>Name</span></div>
            <div style={emailColStyle}><span style={fieldLabelStyle}>Email address</span></div>
            <div style={roleColStyle}><span style={fieldLabelStyle}>Role</span></div>
            {showBuildingPicker && (
              <div style={{ flex: "3 1 0" }}><span style={fieldLabelStyle}>Building</span></div>
            )}
            <div style={{ width: 28, flexShrink: 0 }} />
          </div>
        )}

        {/* Rows */}
        <div style={{ padding: "var(--spacing-8) var(--spacing-24)", display: "flex", flexDirection: "column", gap: isMobile ? "var(--spacing-16)" : "var(--spacing-8)" }}>
          {entries.map((entry, idx) => (
            <div key={entry.id} style={isMobile ? {
              display: "flex", flexDirection: "column", gap: "var(--spacing-8)",
              padding: "var(--spacing-12)", border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-12)",
            } : { display: "flex", alignItems: "center", gap: "var(--spacing-8)" }}>
              {isMobile && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ ...fieldLabelStyle, marginBottom: 0, color: "var(--color-text-weak)" }}>Member {idx + 1}</span>
                  <TrashButton disabled={entries.length === 1} onClick={() => removeRow(entry.id)} />
                </div>
              )}
              <div style={nameColStyle}>
                {isMobile && <span style={fieldLabelStyle}>Name</span>}
                <Input
                  type="text" placeholder="Full name"
                  value={entry.name}
                  onChange={(e) => update(entry.id, "name", e.target.value)}
                  style={{ width: isMobile ? "100%" : "100%", maxWidth: isMobile ? undefined : nameColStyle.maxWidth, boxSizing: "border-box" }}
                />
              </div>
              <div style={emailColStyle}>
                {isMobile && <span style={fieldLabelStyle}>Email address</span>}
                <Input
                  type="email" placeholder="email@example.com"
                  value={entry.email}
                  onChange={(e) => update(entry.id, "email", e.target.value)}
                  style={{ width: isMobile ? "100%" : "100%", maxWidth: isMobile ? undefined : emailColStyle.maxWidth, boxSizing: "border-box" }}
                />
              </div>
              <div style={{ ...roleColStyle, position: "relative" }}>
                {isMobile && <span style={fieldLabelStyle}>Role</span>}
                <select
                  value={entry.role}
                  onChange={(e) => update(entry.id, "role", e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", appearance: "none", WebkitAppearance: "none", paddingRight: "var(--spacing-32)", cursor: "pointer", color: "var(--color-text-weak)", background: "var(--color-fill-white)", border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-8)", padding: "8px var(--spacing-12)", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)", lineHeight: "var(--line-height-tiny)", fontWeight: "var(--font-weight-medium)", outline: "none", transition: "border-color 0.12s" }}
                >
                  {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ position: "absolute", right: 10, top: isMobile ? "calc(50% + 9px)" : "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                  <path d="M6 9l6 6 6-6" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {showBuildingPicker && (
                <div style={{ flex: "3 1 0", position: "relative" }}>
                  {isMobile && <span style={fieldLabelStyle}>Building</span>}
                  {entry.role === "Superadmin" ? (
                    // Superadmin is platform-wide — the backend rejects an
                    // invite that pairs this role with a buildingId (see
                    // inviteMemberSchema in api-backend/src/types/dto.ts), so
                    // there's nothing to pick here. Every other invitable
                    // role (including "Developer") is building-scoped and
                    // still needs the picker below.
                    <div style={{
                      display: "flex", alignItems: "center",
                      height: 36, boxSizing: "border-box", padding: "0 var(--spacing-12)",
                      fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)",
                      lineHeight: "var(--line-height-tiny)", color: "var(--color-text-weaker)",
                      fontStyle: "italic", whiteSpace: "nowrap",
                    }}>
                      All buildings
                    </div>
                  ) : (
                    <>
                      <select
                        value={entry.buildingId ?? ""}
                        onChange={(e) => update(entry.id, "buildingId", e.target.value)}
                        style={{ width: "100%", boxSizing: "border-box", appearance: "none", WebkitAppearance: "none", paddingRight: "var(--spacing-32)", cursor: "pointer", color: "var(--color-text-weak)", background: "var(--color-fill-white)", border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-8)", padding: "8px var(--spacing-12)", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)", lineHeight: "var(--line-height-tiny)", fontWeight: "var(--font-weight-medium)", outline: "none", transition: "border-color 0.12s" }}
                      >
                        <option value="" disabled>Select building…</option>
                        {buildings!.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ position: "absolute", right: 10, top: isMobile ? "calc(50% + 9px)" : "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                        <path d="M6 9l6 6 6-6" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </>
                  )}
                </div>
              )}
              {!isMobile && <TrashButton disabled={entries.length === 1} onClick={() => removeRow(entry.id)} />}
            </div>
          ))}
        </div>

        {/* Add row */}
        <div style={{ padding: "0 var(--spacing-24) var(--spacing-16)" }}>
          <button
            onClick={addRow}
            style={{
              display: "inline-flex", alignItems: "center", gap: "var(--spacing-4)",
              background: "none", border: "none", cursor: "pointer", padding: 0,
              fontFamily: "var(--font-family-body)",
              fontSize: "var(--font-size-tiny)",
              color: "var(--color-text-strong)",
              lineHeight: "var(--line-height-tiny)",
              fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
              transition: "opacity 0.12s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.7"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            <IcPlus />
            Add another member
          </button>
        </div>

        <div style={{ height: 1, background: "var(--color-stroke-medium)", flexShrink: 0 }} />

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--spacing-16) var(--spacing-24)", flexShrink: 0 }}>
          <span style={{ fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", lineHeight: "var(--line-height-extra-tiny)" }}>
            {sending ? "Sending invites…" : validCount > 0 ? `${validCount} invite${validCount === 1 ? "" : "s"} ready to send` : "Fill in at least one email to send"}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-12)" }}>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "10px 0", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"] }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-text-strong)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-weak)"; }}
            >
              Cancel
            </button>
            <button
              onClick={canSend ? handleSend : undefined}
              disabled={!canSend}
              style={{
                display: "flex", alignItems: "center", gap: "var(--spacing-8)",
                background: canSend ? "var(--color-fill-strong)" : "var(--color-gray-20)",
                color: canSend ? "var(--color-text-white)" : "var(--color-text-disabled)",
                border: "none", borderRadius: "var(--radius-12)",
                padding: "10px var(--spacing-20)",
                cursor: canSend ? "pointer" : "default",
                fontFamily: "var(--font-family-body)",
                fontSize: "var(--font-size-tiny)",
                fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                lineHeight: "var(--line-height-tiny)",
                transition: "background 0.15s, color 0.15s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => { if (canSend) e.currentTarget.style.opacity = "0.85"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            >
              {canSend ? `Send ${validCount} Invite${validCount === 1 ? "" : "s"}` : "Send Invites"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
