import { IcSmallCheck } from "./icons";

export type MemberStatus = "Registered" | "Pending";
export { IcSmallCheck };

export function StatusBadge({ status }: { status: MemberStatus }) {
  const map: Record<MemberStatus, { bg: string; color: string }> = {
    Registered: { bg: "var(--color-tag-active)",  color: "var(--color-tag-text-active)"  },
    Pending:    { bg: "var(--color-tag-pending)", color: "var(--color-tag-text-pending)" },
  };
  const s = map[status];
  return (
    <div style={{
      display: "inline-flex", alignItems: "center",
      background: s.bg,
      borderRadius: "var(--radius-48)",
      padding: "var(--spacing-4) var(--spacing-8)",
      whiteSpace: "nowrap",
    }}>
      <span style={{
        fontSize: "var(--font-size-extra-tiny)",
        color: s.color,
        lineHeight: "var(--line-height-extra-tiny)",
        fontFamily: "var(--font-family-body)",
        fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
      }}>
        {status}
      </span>
    </div>
  );
}
