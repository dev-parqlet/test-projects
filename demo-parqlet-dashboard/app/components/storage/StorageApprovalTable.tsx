"use client";

/**
 * The Storage approval queue: claims waiting on the office.
 *
 * Its columns are the ones a manager checks a claim AGAINST, in the
 * order they check them: which unit, who, which locker, what kind.
 * That is why it is not the bookings table with a filter - a booking
 * is described by its dates, and a claim has none.
 *
 * Approve and Decline are icons WITH their words. Two circled glyphs
 * alone, in a column headed "Manage Storage", would ask a manager to
 * remember which of green-tick and red-cross does what on the one
 * screen where getting it backwards hands somebody else's locker away.
 */

import { IcCheck, IcReject } from "@/components/icons";
import { PhoneWithTooltip } from "@/(hoa)/residents/components/phone-tooltip";
import type { DemoStorageApproval } from "@/lib/demo/storage-approvals";

const UNIT = "6 1 70px";
const NAME = "12 1 140px";
const NUMBER = "6 1 80px";
const TYPE = "10 1 120px";
const ACTIONS = "12 1 180px";

const headStyle: React.CSSProperties = {
  fontSize: "var(--font-size-tiny)",
  lineHeight: "var(--line-height-tiny)",
  fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
  color: "var(--color-text-strong)",
  fontFamily: "var(--font-family-body)",
};

const cellStyle: React.CSSProperties = {
  fontSize: "var(--font-size-tiny)",
  lineHeight: "var(--line-height-tiny)",
  color: "var(--color-text-strong)",
  fontFamily: "var(--font-family-body)",
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

function Action({
  label,
  color,
  icon,
  onClick,
}: {
  label: string;
  color: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--spacing-8)",
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        fontSize: "var(--font-size-tiny)",
        fontFamily: "var(--font-family-body)",
        color,
      }}
    >
      {icon}
      {label}
    </button>
  );
}

export function StorageApprovalTable({
  rows,
  onApprove,
  onReject,
}: {
  rows: DemoStorageApproval[];
  onApprove: (row: DemoStorageApproval) => void;
  onReject: (row: DemoStorageApproval) => void;
}) {
  return (
    <div style={{
      marginTop: "var(--spacing-24)",
      border: "1px solid var(--color-stroke-medium)",
      borderRadius: "var(--radius-12)",
      overflow: "hidden",
      background: "var(--color-fill-white)",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "var(--spacing-8)",
        padding: "var(--spacing-16) var(--spacing-24)",
        borderBottom: "1px solid var(--color-stroke-medium)",
      }}>
        {([
          ["Unit #", UNIT],
          ["Resident Name", NAME],
          ["Storage #", NUMBER],
          ["Storage Type", TYPE],
          ["Manage Storage", ACTIONS],
        ] as const).map(([label, flex]) => (
          <div key={label} style={{ flex, minWidth: 0 }}>
            <span style={headStyle}>{label}</span>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <div style={{
          padding: "var(--spacing-64) var(--spacing-24)",
          color: "var(--color-text-weaker)",
          fontSize: "var(--font-size-tiny)",
          fontFamily: "var(--font-family-body)",
        }}>
          Nothing waiting. When a resident lists a storage unit, it appears here
          until you confirm the unit is theirs.
        </div>
      ) : (
        rows.map((r, i) => (
          <div
            key={r.id}
            style={{
              display: "flex", alignItems: "center", gap: "var(--spacing-8)",
              padding: "var(--spacing-16) var(--spacing-24)",
              borderBottom: i === rows.length - 1 ? "none" : "1px solid var(--color-stroke-medium)",
            }}
          >
            <div style={{ flex: UNIT, minWidth: 0 }}>
              <span style={cellStyle}>{r.unitNumber}</span>
            </div>
            <div style={{ flex: NAME, minWidth: 0, display: "flex", alignItems: "center", gap: "var(--spacing-8)" }}>
              <PhoneWithTooltip phone={r.residentPhone} />
              <span style={cellStyle}>{r.residentName}</span>
            </div>
            <div style={{ flex: NUMBER, minWidth: 0 }}>
              <span style={cellStyle}>{r.storageNumber}</span>
            </div>
            <div style={{ flex: TYPE, minWidth: 0 }}>
              <span style={{ ...cellStyle, whiteSpace: "normal" }}>{r.storageType}</span>
            </div>
            <div style={{ flex: ACTIONS, minWidth: 0, display: "flex", alignItems: "center", gap: "var(--spacing-24)" }}>
              <Action
                label="Approve"
                color="var(--color-text-success, #69BE38)"
                icon={<IcCheck size={20} color="var(--color-text-success, #69BE38)" />}
                onClick={() => onApprove(r)}
              />
              <Action
                label="Decline"
                color="var(--color-text-error, #C73A3A)"
                icon={<IcReject size={20} />}
                onClick={() => onReject(r)}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
