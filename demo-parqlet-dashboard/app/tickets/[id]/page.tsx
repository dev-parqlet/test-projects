"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTicketDetail,
  updateTicket,
  addTicketMessage,
  getTicketThread,
  superAdminKeys,
  type SupportTicket,
  type TicketMessage,
  type TicketThreadMessage,
} from "../../lib/api/super-admin";
import { ApiError } from "../../lib/api/client";
import { useAuth } from "../../components/auth/auth-provider";
import { fmtDateTime as fmtDate, fmtShortDate } from "@/lib/dates";
import { IdDisplay } from "../../components/ui/IdDisplay";
import "../../tokens.css";

/** Polling cadence for the live Gmail thread while a ticket is open —
 *  matches the backend sweep's own 3-minute cadence (src/index.ts,
 *  api-backend). A manual Refresh button covers "I need it right now". */
const THREAD_POLL_MS = 3 * 60_000;

// ─── Helpers ───────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, { bg: string; color: string }> = {
  Critical:  { bg: "var(--color-tag-expired)", color: "var(--color-tag-text-expired)" },
  High:      { bg: "var(--color-tag-pending)",  color: "var(--color-tag-text-pending)"  },
  Medium:    { bg: "var(--color-tag-upcoming)", color: "var(--color-tag-text-upcoming)" },
  Low:       { bg: "var(--color-tag-active)",   color: "var(--color-tag-text-active)"   },
};

const STATUS_COLORS: Record<SupportTicket["status"], { bg: string; color: string }> = {
  Open:          { bg: "var(--color-tag-expired)", color: "var(--color-tag-text-expired)" },
  "In Progress": { bg: "var(--color-tag-pending)", color: "var(--color-tag-text-pending)" },
  Resolved:      { bg: "var(--color-tag-active)",  color: "var(--color-tag-text-active)"  },
};

// ─── Sub-components ────────────────────────────────────────────────────────

function StatusBadge({ children, map }: { children: string; map: Record<string, { bg: string; color: string }> }) {
  const s = map[children] ?? { bg: "var(--color-gray-30)", color: "var(--color-text-weak)" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      background: s.bg, color: s.color,
      borderRadius: "var(--radius-48)",
      padding: "3px 10px",
      fontSize: "var(--font-size-extra-tiny)",
      fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
      fontFamily: "var(--font-family-body)",
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push("/tickets")}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: "none", border: "none",
        cursor: "pointer", padding: "4px 0",
        fontFamily: "var(--font-family-body)",
        fontSize: "var(--font-size-tiny)",
        color: "var(--color-text-weak)",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M15 18l-6-6 6-6" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Back to Tickets
    </button>
  );
}

/** Manual "sync now" affordance on the thread panel — same glyph shape as
 *  BackButton's inline chevron above, just a circular-arrows refresh icon.
 *  `spinning` (while a refetch is in flight) rotates it via a tiny scoped
 *  `<style>` tag since inline `style` props can't declare `@keyframes`. */
function RefreshIcon({ spinning }: { spinning?: boolean }) {
  return (
    <>
      <style>{"@keyframes ticket-thread-refresh-spin { to { transform: rotate(360deg); } }"}</style>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        style={spinning ? { animation: "ticket-thread-refresh-spin 0.8s linear infinite" } : undefined}
      >
        <polyline points="23 4 23 10 17 10" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="1 20 1 14 7 14" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path
          d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"
          stroke="var(--color-icon-weak)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </>
  );
}

// ─── Status Update Dropdown ────────────────────────────────────────────────

function StatusDropdown({
  currentStatus,
  ticketId,
  onUpdated,
}: {
  currentStatus: SupportTicket["status"];
  ticketId: string;
  onUpdated: () => void;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (status: SupportTicket["status"]) => updateTicket(ticketId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: superAdminKeys.ticketDetail(ticketId) });
      queryClient.invalidateQueries({ queryKey: superAdminKeys.tickets({}) });
      onUpdated();
      setOpen(false);
    },
  });

  const statuses: SupportTicket["status"][] = ["Open", "In Progress", "Resolved"];

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "8px 16px",
          background: "var(--color-fill-white)",
          border: "1px solid var(--color-stroke-medium)",
          borderRadius: "var(--radius-8)",
          cursor: "pointer",
          fontFamily: "var(--font-family-body)",
          fontSize: "var(--font-size-tiny)",
          color: "var(--color-text-strong)",
        }}
      >
        <StatusBadge map={STATUS_COLORS}>{currentStatus}</StatusBadge>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
          <div style={{
            position: "absolute", top: "100%", left: 0, marginTop: 4,
            background: "var(--color-fill-white)",
            border: "1px solid var(--color-stroke-medium)",
            borderRadius: "var(--radius-8)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            zIndex: 11, minWidth: 160, overflow: "hidden",
          }}>
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => updateMutation.mutate(s)}
                disabled={s === currentStatus || updateMutation.isPending}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  width: "100%", padding: "10px 14px",
                  border: "none", background: s === currentStatus ? "var(--color-gray-5)" : "transparent",
                  cursor: s === currentStatus ? "default" : "pointer",
                  fontFamily: "var(--font-family-body)",
                  fontSize: "var(--font-size-tiny)",
                  color: "var(--color-text-strong)",
                  textAlign: "left",
                  opacity: s === currentStatus ? 0.6 : 1,
                }}
              >
                <StatusBadge map={STATUS_COLORS}>{s}</StatusBadge>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// No color coding for category — just a neutral pill via StatusBadge's own
// unknown-value fallback (empty map means every value hits that fallback).
const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {};
// Non-optional locally (unlike SupportTicket["priority"/"category"], which
// are optional to accommodate mock fixtures) — both dropdowns are always
// handed the `?? "Medium"`/`?? "General"` fallback at the call site, never
// undefined, and StatusBadge's `children: string` prop requires that.
type NonOptionalPriority = NonNullable<SupportTicket["priority"]>;
type NonOptionalCategory = NonNullable<SupportTicket["category"]>;
const TICKET_CATEGORIES: NonOptionalCategory[] = ["General", "Booking", "Availability", "Credits", "Account", "Other"];
const TICKET_PRIORITIES: NonOptionalPriority[] = ["Low", "Medium", "High", "Critical"];

/** Triage-metadata dropdown for Priority/Category — same "click badge,
 *  pick from list" shape as StatusDropdown, but editable by any admin
 *  with access to the ticket (not gated to super_admin like status). */
function PriorityDropdown({ currentPriority, ticketId }: { currentPriority: NonOptionalPriority; ticketId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (priority: SupportTicket["priority"]) => updateTicket(ticketId, { priority }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: superAdminKeys.ticketDetail(ticketId) });
      queryClient.invalidateQueries({ queryKey: superAdminKeys.tickets({}) });
      setOpen(false);
    },
  });

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "8px 16px",
          background: "var(--color-fill-white)",
          border: "1px solid var(--color-stroke-medium)",
          borderRadius: "var(--radius-8)",
          cursor: "pointer",
          fontFamily: "var(--font-family-body)",
          fontSize: "var(--font-size-tiny)",
          color: "var(--color-text-strong)",
        }}
      >
        <StatusBadge map={PRIORITY_COLORS}>{currentPriority}</StatusBadge>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
          <div style={{
            position: "absolute", top: "100%", left: 0, marginTop: 4,
            background: "var(--color-fill-white)",
            border: "1px solid var(--color-stroke-medium)",
            borderRadius: "var(--radius-8)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            zIndex: 11, minWidth: 160, overflow: "hidden",
          }}>
            {TICKET_PRIORITIES.map((p) => (
              <button
                key={p}
                onClick={() => updateMutation.mutate(p)}
                disabled={p === currentPriority || updateMutation.isPending}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  width: "100%", padding: "10px 14px",
                  border: "none", background: p === currentPriority ? "var(--color-gray-5)" : "transparent",
                  cursor: p === currentPriority ? "default" : "pointer",
                  fontFamily: "var(--font-family-body)",
                  fontSize: "var(--font-size-tiny)",
                  color: "var(--color-text-strong)",
                  textAlign: "left",
                  opacity: p === currentPriority ? 0.6 : 1,
                }}
              >
                <StatusBadge map={PRIORITY_COLORS}>{p}</StatusBadge>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CategoryDropdown({ currentCategory, ticketId }: { currentCategory: NonOptionalCategory; ticketId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (category: SupportTicket["category"]) => updateTicket(ticketId, { category }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: superAdminKeys.ticketDetail(ticketId) });
      queryClient.invalidateQueries({ queryKey: superAdminKeys.tickets({}) });
      setOpen(false);
    },
  });

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "8px 16px",
          background: "var(--color-fill-white)",
          border: "1px solid var(--color-stroke-medium)",
          borderRadius: "var(--radius-8)",
          cursor: "pointer",
          fontFamily: "var(--font-family-body)",
          fontSize: "var(--font-size-tiny)",
          color: "var(--color-text-strong)",
        }}
      >
        <StatusBadge map={CATEGORY_COLORS}>{currentCategory}</StatusBadge>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
          <div style={{
            position: "absolute", top: "100%", left: 0, marginTop: 4,
            background: "var(--color-fill-white)",
            border: "1px solid var(--color-stroke-medium)",
            borderRadius: "var(--radius-8)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            zIndex: 11, minWidth: 160, overflow: "hidden",
          }}>
            {TICKET_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => updateMutation.mutate(cat)}
                disabled={cat === currentCategory || updateMutation.isPending}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  width: "100%", padding: "10px 14px",
                  border: "none", background: cat === currentCategory ? "var(--color-gray-5)" : "transparent",
                  cursor: cat === currentCategory ? "default" : "pointer",
                  fontFamily: "var(--font-family-body)",
                  fontSize: "var(--font-size-tiny)",
                  color: "var(--color-text-strong)",
                  textAlign: "left",
                  opacity: cat === currentCategory ? 0.6 : 1,
                }}
              >
                <StatusBadge map={CATEGORY_COLORS}>{cat}</StatusBadge>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Message Thread ────────────────────────────────────────────────────────

const MAX_MESSAGE_LENGTH = 500;

/** One unified, chronologically-sortable row — merges dashboard-only
 *  internal notes (`TicketMessage`) with the live Gmail thread
 *  (`TicketThreadMessage`) into a single timeline. They're never the
 *  same list server-side (see tickets.ts), only here for display. */
interface TimelineRow {
  key: string;
  timestamp: string;
  author: string;
  roleLabel: string;
  body: string;
  isInternal: boolean;
  isInboundFromCustomer: boolean;
  hasAttachment: boolean;
}

function buildTimeline(notes: TicketMessage[], thread: TicketThreadMessage[]): TimelineRow[] {
  const rows: TimelineRow[] = [
    ...notes.map((m) => ({
      key: `note-${m.id}`,
      timestamp: m.timestamp,
      author: m.author,
      roleLabel: m.authorRole,
      body: m.body,
      isInternal: true,
      isInboundFromCustomer: false,
      hasAttachment: false,
    })),
    ...thread.map((m) => ({
      key: `gmail-${m.gmailMessageId}`,
      timestamp: m.date,
      author: m.direction === "outbound" ? "Parqlet support" : (m.fromName ?? m.fromEmail),
      roleLabel: m.direction === "outbound" ? "Sent via email" : m.fromEmail,
      body: m.bodyText,
      isInternal: false,
      isInboundFromCustomer: m.direction === "inbound",
      hasAttachment: m.hasAttachment,
    })),
  ];
  return rows.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function MessageThread({ messages, ticketId }: { messages: TicketMessage[]; ticketId: string }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [draft, setDraft] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const canAddInternalNote = user?.role === "super_admin";

  const threadQuery = useQuery({
    queryKey: superAdminKeys.ticketThread(ticketId),
    queryFn: () => getTicketThread(ticketId),
    refetchInterval: THREAD_POLL_MS,
  });

  const addMsgMutation = useMutation({
    mutationFn: (body: { body: string; isInternal: boolean }) => addTicketMessage(ticketId, body),
    onSuccess: (result) => {
      setSendError(null);
      queryClient.invalidateQueries({ queryKey: superAdminKeys.ticketDetail(ticketId) });
      if (!("isInternal" in result && result.isInternal)) {
        // Sent via Gmail — the new message only exists in the live
        // thread, not in the ticket_responses list invalidated above.
        queryClient.invalidateQueries({ queryKey: superAdminKeys.ticketThread(ticketId) });
      }
      setDraft("");
    },
    onError: (err) => {
      setSendError(err instanceof ApiError && typeof err.body === "object" && err.body && "error" in err.body
        ? String((err.body as { error: unknown }).error)
        : "Failed to send. Try again.");
    },
  });

  function handleSend() {
    if (!draft.trim() || addMsgMutation.isPending) return;
    setSendError(null);
    addMsgMutation.mutate({ body: draft.trim(), isInternal });
  }

  const thread = threadQuery.data?.data ?? [];
  const timeline = buildTimeline(messages, thread);

  const labelStyle: React.CSSProperties = {
    fontSize: "var(--font-size-extra-tiny)",
    color: "var(--color-text-weak)",
    fontFamily: "var(--font-family-body)",
    fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
    display: "block",
    marginBottom: "var(--spacing-4)",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-4)" }}>
        <span style={labelStyle}>Conversation ({timeline.length} messages)</span>
        <button
          onClick={() => threadQuery.refetch()}
          disabled={threadQuery.isFetching}
          title="Check Gmail for new replies now"
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            background: "none", border: "none", padding: 0,
            color: "var(--color-text-link)", cursor: threadQuery.isFetching ? "default" : "pointer",
            fontSize: "var(--font-size-extra-tiny)", fontFamily: "var(--font-family-body)",
          }}
        >
          <RefreshIcon spinning={threadQuery.isFetching} />
          {threadQuery.isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      {threadQuery.data?.configured === false && (
        <p style={{ margin: "0 0 var(--spacing-8)", fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weaker)", fontFamily: "var(--font-family-body)" }}>
          Gmail isn&apos;t connected on this server yet — showing internal notes only.
        </p>
      )}

      {/* Merged timeline: internal notes + the live Gmail thread */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-12)", marginBottom: "var(--spacing-16)" }}>
        {timeline.map((row) => (
          <div
            key={row.key}
            style={{
              background: row.isInternal
                ? "var(--color-accent-50)"
                : row.isInboundFromCustomer
                  ? "var(--color-tag-upcoming)"
                  : "var(--color-gray-5)",
              borderRadius: "var(--radius-12)",
              padding: "var(--spacing-12) var(--spacing-16)",
              border: row.isInternal ? "1px dashed var(--color-accent-400)" : "none",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", rowGap: 4, marginBottom: "var(--spacing-4)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flexWrap: "wrap", rowGap: 4 }}>
                <span style={{
                  fontSize: "var(--font-size-tiny)",
                  fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                  color: "var(--color-text-strong)",
                  fontFamily: "var(--font-family-body)",
                  lineHeight: "var(--line-height-tiny)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220,
                }}>
                  {row.author}
                </span>
                <span style={{
                  fontSize: "var(--font-size-extra-tiny)",
                  color: "var(--color-text-weaker)",
                  fontFamily: "var(--font-family-body)",
                  flexShrink: 0,
                }}>
                  {row.roleLabel}
                </span>
                {row.isInternal && (
                  <span style={{
                    fontSize: "var(--font-size-extra-tiny)",
                    background: "var(--color-accent-400)",
                    color: "var(--color-text-strong)",
                    padding: "1px 6px",
                    borderRadius: "var(--radius-48)",
                    fontFamily: "var(--font-family-body)",
                    flexShrink: 0,
                  }}>
                    Internal
                  </span>
                )}
              </div>
              <span style={{
                fontSize: "var(--font-size-extra-tiny)",
                color: "var(--color-text-weaker)",
                fontFamily: "var(--font-family-body)",
                flexShrink: 0,
              }}>
                {fmtDate(row.timestamp)}
              </span>
            </div>
            <p style={{
              margin: 0,
              fontSize: "var(--font-size-tiny)",
              color: "var(--color-text-weak)",
              fontFamily: "var(--font-family-body)",
              lineHeight: "var(--line-height-tiny)",
              whiteSpace: "pre-wrap",
            }}>
              {row.body}
            </p>
            {row.hasAttachment && (
              <p style={{
                margin: "var(--spacing-4) 0 0",
                fontSize: "var(--font-size-extra-tiny)",
                color: "var(--color-text-weaker)",
                fontFamily: "var(--font-family-body)",
                fontStyle: "italic",
              }}>
                📎 This message has an attachment — view it in Gmail.
              </p>
            )}
          </div>
        ))}
      </div>

      {/* New message input */}
      <div style={{
        background: "var(--color-gray-5)",
        borderRadius: "var(--radius-12)",
        padding: "var(--spacing-12)",
        marginBottom: "var(--spacing-8)",
      }}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
          placeholder={isInternal ? "Type an internal note…" : "Type a reply — sent to the submitter by email…"}
          rows={3}
          style={{
            width: "100%", border: "none", outline: "none",
            background: "transparent", resize: "none",
            fontSize: "var(--font-size-tiny)",
            color: "var(--color-text-strong)",
            lineHeight: "var(--line-height-tiny)",
            fontFamily: "var(--font-family-body)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: "var(--spacing-8)" }}>
        {canAddInternalNote ? (
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)" }}>
            <input
              type="checkbox"
              checked={isInternal}
              onChange={() => setIsInternal(!isInternal)}
              style={{ cursor: "pointer" }}
            />
            Internal note (only visible to support team — not emailed)
          </label>
        ) : (
          <span style={{ fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weaker)", fontFamily: "var(--font-family-body)" }}>
            Sent as a reply email to the ticket submitter
          </span>
        )}
        <span style={{ fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weaker)", fontFamily: "var(--font-family-body)" }}>
          {draft.length} / {MAX_MESSAGE_LENGTH}
        </span>
      </div>
      {sendError && (
        <p style={{ margin: "0 0 var(--spacing-8)", fontSize: "var(--font-size-extra-tiny)", color: "var(--color-tag-text-expired)", fontFamily: "var(--font-family-body)" }}>
          {sendError}
        </p>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={handleSend}
          disabled={!draft.trim() || addMsgMutation.isPending}
          style={{
            background: draft.trim() && !addMsgMutation.isPending ? "var(--color-fill-strong)" : "var(--color-gray-30)",
            color: draft.trim() && !addMsgMutation.isPending ? "var(--color-text-white)" : "var(--color-text-weak)",
            border: "none",
            borderRadius: "var(--radius-48)",
            padding: "var(--spacing-8) var(--spacing-24)",
            fontSize: "var(--font-size-tiny)",
            fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
            lineHeight: "var(--line-height-tiny)",
            fontFamily: "var(--font-family-body)",
            cursor: draft.trim() && !addMsgMutation.isPending ? "pointer" : "default",
            transition: "background 0.15s, color 0.15s",
          }}
        >
          {addMsgMutation.isPending ? "Sending…" : isInternal ? "Add note" : "Send reply"}
        </button>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function TicketDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: ticket, isLoading, isError, error } = useQuery({
    queryKey: superAdminKeys.ticketDetail(id),
    queryFn: () => getTicketDetail(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div style={{ padding: "var(--spacing-24)", fontFamily: "var(--font-family-body)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-24)", maxWidth: 900, margin: "0 auto" }}>
          <BackButton />
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 20, width: `${60 + i * 20}%`, borderRadius: 4, background: "var(--color-gray-30)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: "var(--spacing-24)", fontFamily: "var(--font-family-body)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <BackButton />
          <div style={{
            marginTop: 24, padding: "48px 20px", textAlign: "center",
            color: "var(--color-tag-text-expired)", fontSize: "var(--font-size-tiny)",
            border: "1px solid var(--color-tag-text-expired)", borderRadius: "var(--radius-8)",
          }}>
            Failed to load ticket. {error instanceof Error ? error.message : "Please try again."}
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  const sectionStyle: React.CSSProperties = {
    background: "var(--color-fill-white)",
    border: "1px solid var(--color-stroke-medium)",
    borderRadius: "var(--radius-12)",
    padding: "var(--spacing-24)",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "var(--font-size-extra-tiny)",
    color: "var(--color-text-weak)",
    fontFamily: "var(--font-family-body)",
    fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
    display: "block",
    marginBottom: "var(--spacing-4)",
  };

  const valueStyle: React.CSSProperties = {
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-strong)",
    fontFamily: "var(--font-family-body)",
    fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
    lineHeight: "var(--line-height-tiny)",
  };

  return (
    <div style={{ padding: "var(--spacing-24)", fontFamily: "var(--font-family-body)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-20)", maxWidth: 900, margin: "0 auto" }}>
        {/* Back + Header */}
        <BackButton />

        <div style={{ minWidth: 0 }}>
          <h1 style={{
            margin: 0,
            fontSize: "var(--font-size-heading-1)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            lineHeight: "var(--line-height-heading-1)",
            color: "var(--color-text-strong)",
            fontFamily: "var(--font-family-heading)",
            overflowWrap: "break-word",
            wordBreak: "break-word",
          }}>
            {ticket.subject}
          </h1>
          <p style={{
            margin: "6px 0 0",
            fontSize: "var(--font-size-body)",
            color: "var(--color-text-weak)",
            fontFamily: "var(--font-family-body)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}>
            <IdDisplay value={ticket.id} style={{ fontSize: "var(--font-size-body)", verticalAlign: "baseline" }} />
            <span>· Opened {fmtShortDate(ticket.openedDate)} · {ticket.buildingName}</span>
          </p>
        </div>

        {/* Meta Info */}
        <div style={{ ...sectionStyle, display: "flex", gap: "var(--spacing-40)", flexWrap: "wrap" }}>
          <div>
            <span style={labelStyle}>Status</span>
            <StatusDropdown currentStatus={ticket.status} ticketId={ticket.id} onUpdated={() => {}} />
          </div>
          <div>
            <span style={labelStyle}>Priority</span>
            <PriorityDropdown currentPriority={ticket.priority ?? "Medium"} ticketId={ticket.id} />
          </div>
          <div>
            <span style={labelStyle}>Category</span>
            <CategoryDropdown currentCategory={ticket.category ?? "General"} ticketId={ticket.id} />
          </div>
          <div>
            <span style={labelStyle}>Sent</span>
            <span style={valueStyle}>{fmtDate(ticket.openedDate)}</span>
          </div>
        </div>

        {/* Description */}
        <div style={sectionStyle}>
          <span style={labelStyle}>Description</span>
          <p style={{
            margin: "var(--spacing-8) 0 0",
            fontSize: "var(--font-size-tiny)",
            color: "var(--color-text-weak)",
            fontFamily: "var(--font-family-body)",
            lineHeight: "1.6",
            whiteSpace: "pre-wrap",
          }}>
            {ticket.description}
          </p>
        </div>

        {/* Attachments */}
        {ticket.attachments && ticket.attachments.length > 0 && (
          <div style={sectionStyle}>
            <span style={labelStyle}>Attachments ({ticket.attachments.length})</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)", marginTop: "var(--spacing-8)" }}>
              {ticket.attachments.map((att) => (
                <div key={att.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "var(--spacing-8) var(--spacing-12)",
                  background: "var(--color-gray-5)",
                  borderRadius: "var(--radius-8)",
                  minWidth: 0,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                    <rect x="5" y="3" width="14" height="18" rx="2" stroke="var(--color-icon-weak)" strokeWidth="1.5" />
                    <line x1="9" y1="8" x2="15" y2="8" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="9" y1="12" x2="15" y2="12" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span style={{
                    flex: 1, minWidth: 0,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)",
                  }}>
                    {att.name}
                  </span>
                  <span style={{ flexShrink: 0, fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weaker)", fontFamily: "var(--font-family-body)" }}>
                    {att.size}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message Thread */}
        <div style={sectionStyle}>
          <MessageThread messages={ticket.messages ?? []} ticketId={ticket.id} />
        </div>
      </div>
    </div>
  );
}
