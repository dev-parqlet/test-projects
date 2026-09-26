import { useState, useRef } from "react";
import { StatusBadge } from "./status-badge";
import {
  IcEllipsis,
  IcChevronLeft,
  IcChevronRight,
} from "./icons";
import { CopyableCell } from "../ui/CopyableCell";
import { FloatingMenu } from "../ui/FloatingMenu";
import type { TeamMember } from "../../lib/api/members";

const ROW_HEIGHT = 64;

// ─── TrashButton ─────────────────────────────────────────────────────────────

export function TrashButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 28, height: 28, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: hovered && !disabled ? "var(--color-red-50)" : "none",
        border: "none", borderRadius: "var(--radius-8)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.3 : 1,
        transition: "background 0.12s", padding: 0,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke={hovered && !disabled ? "var(--color-fill-error)" : "var(--color-icon-weak)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

// ─── PageBtn ─────────────────────────────────────────────────────────────────

export function PageBtn({ children, active, disabled, onClick }: {
  children: React.ReactNode; active?: boolean; disabled?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 32, height: 32, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: active ? "var(--color-fill-strong)" : "var(--color-fill-white)",
        border: "1px solid var(--color-stroke-medium)",
        borderRadius: "var(--radius-8)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        fontFamily: "var(--font-family-body)",
        fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
        fontSize: "var(--font-size-extra-tiny)",
        color: active ? "var(--color-text-white)" : "var(--color-text-weak)",
      }}
    >
      {children}
    </button>
  );
}

// ─── RowActionsMenu ───────────────────────────────────────────────────────────

export function RowActionsMenu({ member, currentUserId, anchorRef, onClose, onEditPermission, onResendInvite, onRevokeAccess }: {
  member: TeamMember; currentUserId: string | undefined;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  onEditPermission: () => void; onResendInvite: () => void; onRevokeAccess: () => void;
}) {
  const isSelf = member.userId === currentUserId;

  const items: { label: string; danger?: boolean; action?: () => void; disabled?: boolean }[] = [
    ...(member.status === "Pending" ? [{ label: "Resend invite", action: () => { onClose(); onResendInvite(); } }] : []),
    { label: "Edit permission", action: () => { onClose(); onEditPermission(); } },
    { label: "Revoke access", danger: true, action: () => { onClose(); onRevokeAccess(); }, disabled: isSelf },
  ];

  return (
    <FloatingMenu anchorRef={anchorRef} onClose={onClose} align="end">
      <div style={{
        background: "var(--color-fill-white)",
        border: "1px solid var(--color-stroke-medium)",
        borderRadius: "var(--radius-12)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        overflow: "hidden", minWidth: 160,
      }}>
        {items.map(({ label, danger, action, disabled }) => (
          <button
            key={label}
            onClick={disabled ? undefined : (action ?? onClose)}
            style={{
              display: "block", width: "100%",
              padding: "10px var(--spacing-12)",
              background: "none", border: "none", cursor: disabled ? "default" : "pointer",
              fontFamily: "var(--font-family-body)",
              fontSize: "var(--font-size-tiny)",
              color: disabled ? "var(--color-text-disabled)" : danger ? "var(--color-fill-error)" : "var(--color-text-strong)",
              fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
              lineHeight: "var(--line-height-tiny)", textAlign: "left",
            }}
            onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "var(--color-gray-5)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
          >
            {label}{disabled ? " (you)" : ""}
          </button>
        ))}
      </div>
    </FloatingMenu>
  );
}

// ─── MemberRow ───────────────────────────────────────────────────────────────

export function MemberRow({ member, currentUserId, isLast, onEditPermission, onResendInvite, onRevokeAccess }: {
  member: TeamMember; currentUserId: string | undefined; isLast: boolean;
  onEditPermission: (m: TeamMember) => void;
  onResendInvite: (m: TeamMember) => void;
  onRevokeAccess: (m: TeamMember) => void;
}) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsTriggerRef = useRef<HTMLButtonElement>(null);

  const cell = (flex: number, content: React.ReactNode, align: "left" | "right" = "left") => (
    <div style={{ flex: `${flex} 1 0`, minWidth: 0, paddingRight: 4, display: "flex", alignItems: "center", justifyContent: align === "right" ? "flex-end" : "flex-start" }}>
      {content}
    </div>
  );

  const cellTxt: React.CSSProperties = {
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-weak)",
    lineHeight: "var(--line-height-tiny)",
    fontFamily: "var(--font-family-body)",
    fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
    display: "block",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  };

  return (
    <div style={{
      display: "flex", alignItems: "center",
      paddingLeft: "var(--spacing-24)", paddingRight: "var(--spacing-24)",
      height: ROW_HEIGHT,
      borderBottom: isLast ? "none" : "1px solid var(--color-stroke-medium)",
    }}>
      {cell(14,
        <CopyableCell value={member.name}>
          <span style={{ ...cellTxt, color: "var(--color-text-strong)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"] }}>
            {member.name}
          </span>
        </CopyableCell>
      )}
      {cell(20, <CopyableCell value={member.email}><span style={cellTxt}>{member.email}</span></CopyableCell>)}
      {cell(13, <CopyableCell value={member.role}><span style={cellTxt}>{member.role}</span></CopyableCell>)}
      {cell(10, <CopyableCell value={member.status}><StatusBadge status={member.status} /></CopyableCell>)}
      {cell(11, <CopyableCell value={member.invited}><span style={cellTxt}>{member.invited}</span></CopyableCell>)}
      {cell(11, <CopyableCell value={member.lastActive ?? undefined}><span style={cellTxt}>{member.lastActive ?? "—"}</span></CopyableCell>)}
      {cell(5,
        <div>
          <button
            ref={actionsTriggerRef}
            onClick={() => setActionsOpen((o) => !o)}
            style={{
              background: actionsOpen ? "var(--color-gray-5)" : "none",
              border: "none", cursor: "pointer", padding: "var(--spacing-4)",
              borderRadius: "var(--radius-8)", display: "flex", alignItems: "center",
              transition: "background 0.12s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-gray-5)"; }}
            onMouseLeave={(e) => { if (!actionsOpen) e.currentTarget.style.background = "none"; }}
          >
            <IcEllipsis />
          </button>
          {actionsOpen && (
            <RowActionsMenu
              member={member}
              currentUserId={currentUserId}
              anchorRef={actionsTriggerRef}
              onClose={() => setActionsOpen(false)}
              onEditPermission={() => onEditPermission(member)}
              onResendInvite={() => onResendInvite(member)}
              onRevokeAccess={() => onRevokeAccess(member)}
            />
          )}
        </div>,
        "right"
      )}
    </div>
  );
}
