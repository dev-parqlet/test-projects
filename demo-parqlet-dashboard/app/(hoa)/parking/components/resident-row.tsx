"use client";

import { useState, useRef } from "react";
import { PhoneWithTooltip } from "./phone-tooltip";
import { Badge } from "@/components/ui/Badge";
import { CopyableCell } from "@/components/ui/CopyableCell";
import { FloatingMenu } from "@/components/ui/FloatingMenu";
import { Checkbox } from "./icons";
import type { Resident } from "./types";
import { NAME_TEXT_WIDTH, NAME_COLUMN_WIDTH } from "@/lib/name-cell";

// Re-exported so the header (COLUMNS array in each page that renders
// ResidentRow) can use the exact same widths — otherwise header and row
// cells drift out of alignment.
export { NAME_COLUMN_WIDTH };
export const PARKING_COLUMN_WIDTH = "0 0 98px";

function IcEllipsis() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="5"  cy="12" r="1.5" fill="var(--color-icon-weak)" />
      <circle cx="12" cy="12" r="1.5" fill="var(--color-icon-weak)" />
      <circle cx="19" cy="12" r="1.5" fill="var(--color-icon-weak)" />
    </svg>
  );
}

function ActionsMenu({ anchorRef, onClose, onSendInvite, onRevoke, isRevoked = false }: { anchorRef: React.RefObject<HTMLElement | null>; onClose: () => void; onSendInvite: () => void; onRevoke: () => void; isRevoked?: boolean }) {
  const itemStyle: React.CSSProperties = {
    display: "block", width: "100%",
    padding: "10px var(--spacing-12)",
    background: "none", border: "none", cursor: "pointer",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
    lineHeight: "var(--line-height-tiny)",
    textAlign: "left",
  };

  return (
    <FloatingMenu anchorRef={anchorRef} onClose={onClose} align="end">
      <div style={{
        background: "var(--color-fill-white)",
        border: "1px solid var(--color-stroke-medium)",
        borderRadius: "var(--radius-12)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        overflow: "hidden", minWidth: 160,
      }}>
        <button
          onClick={() => { onClose(); onSendInvite(); }}
          style={{
            ...itemStyle,
            color: "var(--color-text-strong)",
            borderBottom: "1px solid var(--color-stroke-weak, var(--color-stroke-medium))",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-gray-5)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
        >
          Invite to Parqlet
        </button>
        <button
          onClick={() => { onClose(); onRevoke(); }}
          style={{
            ...itemStyle,
            // Restore = positive action: use a dark "strong" text token so it
            // passes contrast on the white menu background. --color-fill-accent
            // is a yellow-green #c7e51f that renders at 1.43:1 against white,
            // which fails WCAG AA. For the destructive entry keep the existing
            // --color-fill-error (red) which already has high contrast.
            color: isRevoked ? "var(--color-text-strong)" : "var(--color-fill-error)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-gray-5)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
        >
          {isRevoked ? "Restore access" : "Revoke access"}
        </button>
      </div>
    </FloatingMenu>
  );
}

function IcNotes() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="3" width="16" height="18" rx="2" stroke="var(--color-icon-weak)" strokeWidth="1.5" />
      <path d="M8 8h8M8 12h8M8 16h5" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ResidentRow({
  resident, isLast, bulkInvited, bulkInvitedDate, checked, onToggle, onOpenNote, onSendInvite, onRevokeAccess, isRevoked = false,
}: {
  resident: Resident;
  isLast: boolean;
  bulkInvited: boolean;
  bulkInvitedDate: string;
  checked: boolean;
  onToggle: () => void;
  onOpenNote: () => void;
  onSendInvite: () => void;
  onRevokeAccess: () => void;
  // When true, the three-dot menu shows "Restore access" instead of
  // "Revoke access". Defaults to false for callers that don't yet
  // surface the revoked state (e.g. the HOA resident directory, whose
  // backend list filters out excluded rows).
  isRevoked?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  const cell = (flex: number | string, content: React.ReactNode) => (
    <div style={{ flex: typeof flex === "number" ? `${flex} 1 0` : flex, minWidth: 0 }}>{content}</div>
  );

  const cellTxt: React.CSSProperties = {
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-weak)",
    lineHeight: "var(--line-height-tiny)",
    fontFamily: "var(--font-family-body)",
    fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  // Renders text with truncation + native tooltip for overflow, and wraps
  // it in CopyableCell so a click/tap copies the underlying value.
  const txt = (value: string | null, color?: string) => (
    <CopyableCell value={value ?? undefined}>
      <span style={{ ...cellTxt, ...(color ? { color } : {}) }} title={value ?? ""}>{value ?? "—"}</span>
    </CopyableCell>
  );

  // Same as `txt`, but wraps onto a second line instead of ellipsizing —
  // for columns narrow enough (e.g. Parking #, which can hold several
  // spot numbers) that truncating with "…" hides real content.
  const wrapTxt = (value: string | null, color?: string) => (
    <CopyableCell value={value ?? undefined} style={{ display: "block" }}>
      <span
        style={{ ...cellTxt, ...(color ? { color } : {}), whiteSpace: "normal", overflow: "visible", textOverflow: "clip", wordBreak: "break-word" }}
      >
        {value ?? "—"}
      </span>
    </CopyableCell>
  );

  // A unit with multiple residents can carry multiple comma-joined emails
  // in one field. Previously that whole string got ellipsis-truncated with
  // the rest only visible on hover; now every email gets its own line so
  // all of them are always visible.
  const emailCell = (value: string | null) => {
    const emails = (value ?? "").split(",").map((e) => e.trim()).filter(Boolean);
    if (emails.length <= 1) return txt(value);
    return (
      <CopyableCell value={value ?? undefined} style={{ display: "block" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          {emails.map((e, i) => (
            <span
              key={i}
              style={{ ...cellTxt, whiteSpace: "normal", overflow: "visible", textOverflow: "clip", wordBreak: "break-word" }}
            >
              {e}
            </span>
          ))}
        </div>
      </CopyableCell>
    );
  };

  const nameTextStyle: React.CSSProperties = {
    ...cellTxt,
    display: "block",
    minWidth: NAME_TEXT_WIDTH,
    maxWidth: NAME_TEXT_WIDTH,
    whiteSpace: "normal",
    wordBreak: "break-word",
    overflow: "visible",
    textOverflow: "clip",
  };

  return (
    <div style={{
      display: "flex", alignItems: "center",
      paddingLeft: "var(--spacing-24)", paddingRight: "var(--spacing-24)",
      paddingTop: "var(--spacing-8)", paddingBottom: "var(--spacing-8)",
      minHeight: 57,
      borderBottom: isLast ? "none" : "1px solid var(--color-stroke-medium)",
    }}>
      <div style={{ width: 32, flexShrink: 0, display: "flex", alignItems: "center" }}>
        <Checkbox checked={checked} onChange={onToggle} />
      </div>
      {cell(5,  txt(resident.unitNumber))}
      {cell(NAME_COLUMN_WIDTH,
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-8)", minWidth: 0 }}>
          <CopyableCell value={resident.name} style={nameTextStyle}>
            <span style={nameTextStyle}>{resident.name}</span>
          </CopyableCell>
          <PhoneWithTooltip phone={resident.phone} />
        </div>
      )}
      {cell(PARKING_COLUMN_WIDTH,  wrapTxt(resident.parkingSpotNumbers || "N/A"))}
      {cell(16, emailCell(resident.email))}
      {cell(7,  txt(resident.residencyType))}
      {cell(10, (() => {
        if (!resident.leaseExpiration || resident.leaseExpiration === "N/A") return txt("N/A");
        const d = new Date(resident.leaseExpiration);
        if (isNaN(d.getTime())) return txt(resident.leaseExpiration);
        const formatted = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        return txt(formatted);
      })())}
      {/* Access column — green "Active" pill when the resident's access
          is fine, red "Revoked" pill when excluded. Gated on the
          `isRevoked` prop (which the caller derives from
          `resident.excludedAt`). The cell always renders (even as a
          pill with no surrounding whitespace) so the row alignment
          holds whether the resident is revoked or not. */}
      {cell(7,
        <CopyableCell value={isRevoked ? "Revoked" : "Active"}>
          {isRevoked ? <Badge variant="expired">Revoked</Badge> : <Badge variant="active">Active</Badge>}
        </CopyableCell>
      )}

      {cell(10,
        <CopyableCell value={resident.status === "Registered" ? "Registered" : "Not registered"}>
          <Badge variant={resident.status === "Registered" ? "registered" : "not-registered"}>{resident.status === "Registered" ? "Registered" : "Not registered"}</Badge>
        </CopyableCell>
      )}
      {cell(10, (() => {
        const rawDate = resident.inviteSentDate ?? (bulkInvited ? bulkInvitedDate : null);
        if (!rawDate) return txt("—");
        const d = new Date(rawDate);
        if (isNaN(d.getTime())) return txt(rawDate);
        return txt(d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }));
      })())}
      {cell(6,
        <button
          onClick={onOpenNote}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          {resident.note && resident.note.trim() ? (
            <IcNotes />
          ) : (
            <span style={{
              ...cellTxt,
              color: "var(--color-text-link)",
              textDecoration: "underline",
              textUnderlineOffset: 2,
              cursor: "pointer",
            }}>
              Add note
            </span>
          )}
        </button>
      )}
      {cell(6,
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            ref={menuTriggerRef}
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              background: menuOpen ? "var(--color-gray-5)" : "none",
              border: "1px solid var(--color-stroke-medium)",
              borderRadius: "var(--radius-8)",
              cursor: "pointer", padding: "var(--spacing-4) var(--spacing-8)",
              display: "flex", alignItems: "center",
              transition: "background 0.12s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-gray-5)"; }}
            onMouseLeave={(e) => { if (!menuOpen) e.currentTarget.style.background = "none"; }}
          >
            <IcEllipsis />
          </button>
          {menuOpen && (
            <ActionsMenu
              anchorRef={menuTriggerRef}
              onClose={() => setMenuOpen(false)}
              onSendInvite={() => { setMenuOpen(false); onSendInvite(); }}
              onRevoke={() => { setMenuOpen(false); onRevokeAccess(); }}
              isRevoked={isRevoked}
            />
          )}
        </div>
      )}
    </div>
  );
}