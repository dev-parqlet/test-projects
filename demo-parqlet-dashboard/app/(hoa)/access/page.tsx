"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../components/auth/auth-provider";
import { Actions, can } from "../../lib/permissions";
import {
  listMembers,
  resendMemberInvite,
  removeMember,
  updateMemberRole,
  inviteMember,
  memberKeys,
  type TeamMember,
} from "../../lib/api/members";
import {
  IcSearch,
  IcChevronLeft,
  IcChevronRight,
  MemberRow,
  PageBtn,
  EditPermissionModal,
  InviteModal,
  HOA_ROLES,
} from "../../components/access-management";
import { TableScroll } from "../../components/ui/TableScroll";
import { TableHeadLabel } from "../../components/ui/TableHeadLabel";
import "../../tokens.css";

// ─── Types & constants ─────────────────────────────────────────────────────────

type AccessTab = "all" | "registered" | "pending";

const ROW_HEIGHT    = 64;
const HEADER_HEIGHT = 48;
const FOOTER_HEIGHT = 57;
const MIN_ROWS      = 4;

const COLUMNS: { label: string; flex: number }[] = [
  { label: "Member",      flex: 14 },
  { label: "Email",       flex: 18 },
  { label: "Role",        flex: 14 },
  { label: "Status",      flex: 10 },
  { label: "Invited",     flex: 11 },
  { label: "Last Active", flex: 11 },
  { label: "Actions",     flex: 5  },
];

const tabLabel: Record<AccessTab, string> = {
  all:        "All Members",
  registered: "Registered",
  pending:    "Pending",
};

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast { id: string; message: string; kind: "success" | "error"; }

function Toast({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 900,
      display: "flex", alignItems: "center", gap: "var(--spacing-12)",
      background: toast.kind === "success" ? "var(--color-tag-active)" : "var(--color-fill-error)",
      color: toast.kind === "success" ? "var(--color-tag-text-active)" : "var(--color-text-white)",
      borderRadius: "var(--radius-12)",
      padding: "var(--spacing-12) var(--spacing-16)",
      boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
      fontFamily: "var(--font-family-body)",
      fontSize: "var(--font-size-tiny)",
      fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
      lineHeight: "var(--line-height-tiny)",
    }}>
      <span>{toast.message}</span>
      <button
        onClick={onDismiss}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "inherit", fontSize: 16, lineHeight: 1 }}
      >×</button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function AccessManagementPageContent() {
  const { user } = useAuth();
  const [page, setPage]                = useState(1);
  const [activeTab, setActiveTab]      = useState<AccessTab>("all");
  const [query, setQuery]              = useState("");
  const [editMember, setEditMember]    = useState<TeamMember | null>(null);
  const [inviteOpen, setInviteOpen]    = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<TeamMember | null>(null);
  const [toast, setToast]             = useState<Toast | null>(null);

  const rowsPerPage = 10;

  // Use `isFetching` rather than `isLoading` here. With `initialData` set,
  // React Query treats the query as already-successful on the first render,
  // so `isLoading` is permanently false and the skeleton never shows.
  const { data, refetch, isFetching, error } = useQuery({
    queryKey: memberKeys.list({}),
    queryFn: () => listMembers({}),
  });

  const apiMembers: TeamMember[] = data?.data ?? [];

  // Build filtered pipeline: API data → tab → search → page
  const pipeline = apiMembers
    .filter((m) => {
      if (activeTab === "registered") return m.status === "Registered";
      if (activeTab === "pending")    return m.status === "Pending";
      return true;
    })
    .filter((m) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    });

  const totalPages = Math.max(1, Math.ceil(pipeline.length / rowsPerPage));
  // Clamp the current page: tab/search resets page, but revoking the last
  // member on the final page (or a refetch returning fewer rows) can leave
  // page > totalPages. Without this, displayed is empty and the pagination
  // controls hide — stranding the user on a blank table.
  const effectivePage = Math.min(Math.max(1, page), totalPages);
  const pageStart  = (effectivePage - 1) * rowsPerPage;
  const displayed  = pipeline.slice(pageStart, pageStart + rowsPerPage);

  function switchTab(t: AccessTab) { setActiveTab(t); setPage(1); }

  function showToast(message: string, kind: Toast["kind"]) {
    const id = String(Date.now());
    setToast({ id, message, kind });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleInvite(entries: { name: string; email: string; role: string; buildingId?: string }[]): Promise<{ email: string; enrollmentUrl: string }[]> {
    const results = await Promise.all(
      entries.map(async (e) => {
        try {
          const member = await inviteMember(
            e.email,
            e.role,
            e.buildingId ?? user?.buildingIds?.[0],
            e.name || undefined
          ) as TeamMember & { enrollmentUrl?: string };
          showToast(`Invite sent to ${e.email}`, "success");
          // Don't fabricate an enrollment URL when the server omits one —
          // /onboarding?email=… carries no token, so the admin would hand
          // out a link that won't enroll anyone. InviteModal treats an
          // empty enrollmentUrl as a row-level failure and reports it.
          return {
            email: e.email,
            enrollmentUrl: member.enrollmentUrl ?? "",
          };
        } catch {
          showToast(`Failed to invite ${e.email}`, "error");
          return { email: e.email, enrollmentUrl: "" };
        }
      })
    );
    void refetch();
    return results;
  }

  async function handleRoleUpdate(member: TeamMember, role: TeamMember["role"]) {
    try {
      await updateMemberRole(member.id, role);
      setEditMember(null);
      showToast("Permission updated", "success");
      void refetch();
    } catch {
      showToast(`Failed to update permission for ${member.name}.`, "error");
    }
  }

  async function handleResend(member: TeamMember) {
    try {
      await resendMemberInvite(member.id);
      showToast(`Invite resent to ${member.email}`, "success");
    } catch {
      showToast("Failed to resend invite", "error");
    }
  }

  async function handleRevoke(member: TeamMember) {
    try {
      await removeMember(member.id);
      showToast(`Access revoked for ${member.email}`, "success");
      void refetch();
    } catch {
      showToast("Failed to revoke access", "error");
    } finally {
      setRevokeTarget(null);
    }
  }

  // Header row
  const headerRow = (
    <div style={{
      display: "flex", alignItems: "center",
      paddingLeft: "var(--spacing-24)", paddingRight: "var(--spacing-24)",
      minHeight: HEADER_HEIGHT,
      borderBottom: "1px solid var(--color-stroke-medium)",
      background: "var(--color-fill-white)",
      position: "sticky", top: 0, zIndex: 2,
    }}>
      {COLUMNS.map((col) => (
        <div key={col.label} style={{ flex: `${col.flex} 1 0`, minWidth: 0, maxWidth: "100%", display: "flex", justifyContent: col.label === "Actions" ? "flex-end" : "flex-start", fontSize: "var(--font-size-extra-tiny)", fontFamily: "var(--font-family-body)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--color-text-weak)", lineHeight: "var(--line-height-extra-tiny)", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
          <TableHeadLabel>{col.label}</TableHeadLabel>
        </div>
      ))}
    </div>
  );

  // Empty state
  const emptyState = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", height: ROW_HEIGHT * MIN_ROWS, gap: "var(--spacing-8)", paddingLeft: "var(--spacing-24)" }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="var(--color-icon-weak)" strokeWidth="1.5" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span style={{ fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", lineHeight: "var(--line-height-tiny)" }}>
        {query ? `No members matching "${query}"` : `No ${activeTab === "all" ? "" : activeTab} members yet`}
      </span>
    </div>
  );

  // Loading skeleton
  const skeletonRows = Array.from({ length: MIN_ROWS });

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        fontFamily: "var(--font-family-body)",
        padding: "var(--spacing-24)",
        display: "flex", flexDirection: "column",
        gap: "var(--spacing-24)", height: "100%",
      }}>

        {/* Title */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--spacing-16)" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "var(--font-size-heading-1)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-heading-1)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-heading)" }}>
              Access Management
            </h1>
            <p style={{ margin: "var(--spacing-8) 0 0", fontSize: "var(--font-size-body)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], color: "var(--color-text-weak)", lineHeight: "var(--line-height-body)" }}>
              Manage team members and their access to the Parqlet platform
            </p>
          </div>
          <button
            onClick={() => setInviteOpen(true)}
            style={{
              display: "flex", alignItems: "center",
              // Fixed brand color, doesn't invert in dark mode — keep text dark.
              background: "var(--color-fill-accent)", color: "#222222",
              border: "none", borderRadius: "var(--radius-8)",
              padding: "11px var(--spacing-16)", cursor: "pointer", flexShrink: 0,
              fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)",
              fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
              lineHeight: "var(--line-height-tiny)", transition: "background 0.15s", whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-accent-1200)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-fill-accent)"; }}
          >
            Invite Member
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "var(--spacing-24)", borderBottom: "1px solid var(--color-stroke-medium)" }}>
          {(["all", "registered", "pending"] as AccessTab[]).map((t) => {
            const isActive = activeTab === t;
            return (
              <button
                key={t}
                onClick={() => switchTab(t)}
                style={{
                  background: "none", border: "none", padding: "0 0 var(--spacing-12)",
                  cursor: "pointer", fontSize: "var(--font-size-tiny)",
                  fontWeight: (isActive ? "var(--font-weight-medium)" : "var(--font-weight-regular)") as React.CSSProperties["fontWeight"],
                  lineHeight: "var(--line-height-tiny)",
                  color: isActive ? "var(--color-text-strong)" : "var(--color-text-weak)",
                  fontFamily: "var(--font-family-body)", whiteSpace: "nowrap",
                  borderBottom: isActive ? "2px solid var(--color-text-strong)" : "2px solid transparent",
                  marginBottom: -1, transition: "color 0.15s, border-color 0.15s",
                }}
              >
                {tabLabel[t]}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "var(--color-fill-white)",
          border: "1px solid var(--color-stroke-medium)",
          borderRadius: "var(--radius-8)", padding: "var(--spacing-8) 10px",
          maxWidth: 400,
        }}>
          <IcSearch />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search by name or email…"
            style={{
              flex: 1, minWidth: 0,
              border: "none", outline: "none",
              fontFamily: "var(--font-family-body)",
              fontSize: "var(--font-size-tiny)",
              color: "var(--color-text-strong)",
              fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
              lineHeight: "var(--line-height-tiny)",
              background: "transparent",
            }}
          />
        </div>

        {/* Error banner — surfaced so listMembers failures don't render as a silent empty table */}
        {error && (
          <div role="alert" style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "var(--color-fill-error)",
            color: "var(--color-text-white)",
            borderRadius: "var(--radius-12)",
            padding: "var(--spacing-12) var(--spacing-16)",
            fontFamily: "var(--font-family-body)",
            fontSize: "var(--font-size-tiny)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            lineHeight: "var(--line-height-tiny)",
          }}>
            <span>
              Couldn&apos;t load team members. {(error as Error)?.message ?? "Please try again."}
            </span>
            <button
              onClick={() => void refetch()}
              style={{
                background: "var(--color-fill-white)",
                color: "var(--color-text-strong)",
                border: "none",
                borderRadius: "var(--radius-8)",
                padding: "6px var(--spacing-12)",
                cursor: "pointer",
                fontFamily: "var(--font-family-body)",
                fontSize: "var(--font-size-extra-tiny)",
                fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                lineHeight: "var(--line-height-extra-tiny)",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        <div style={{
          flex: 1, minHeight: 0,
          background: "var(--color-fill-white)",
          borderRadius: "var(--radius-16)",
          border: "1px solid var(--color-stroke-medium)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          <TableScroll minWidth={760}>
          {headerRow}

          {isFetching
            ? skeletonRows.map((_, i) => (
                <div key={i} style={{ height: ROW_HEIGHT, display: "flex", alignItems: "center", paddingLeft: "var(--spacing-24)", borderBottom: i < MIN_ROWS - 1 ? "1px solid var(--color-stroke-medium)" : "none" }}>
                  <div style={{ height: 12, width: "60%", borderRadius: 6, background: "var(--color-gray-10)", animation: "spin 1.5s linear infinite" }} />
                </div>
              ))
            : displayed.length === 0
            ? emptyState
            : displayed.map((member, i) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  currentUserId={user?.id}
                  isLast={i === displayed.length - 1}
                  onEditPermission={setEditMember}
                  onResendInvite={handleResend}
                  onRevokeAccess={(m) => setRevokeTarget(m)}
                />
              ))
          }
          </TableScroll>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "flex-end",
            height: FOOTER_HEIGHT, paddingRight: "var(--spacing-24)",
            gap: "var(--spacing-8)",
          }}>
            <span style={{ fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", lineHeight: "var(--line-height-extra-tiny)", marginRight: "var(--spacing-8)" }}>
              {pipeline.length} member{pipeline.length !== 1 ? "s" : ""}
            </span>
            <PageBtn onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              <IcChevronLeft />
            </PageBtn>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..."
                  ? <span key={`ellipsis-${i}`} style={{ fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-disabled)", padding: "0 4px" }}>…</span>
                  : <PageBtn key={p} active={p === page} onClick={() => setPage(p as number)}>{p}</PageBtn>
              )
            }
            <PageBtn onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <IcChevronRight />
            </PageBtn>
          </div>
        )}
      </div>

      {/* Modals */}
      {editMember && (
        <EditPermissionModal
          member={editMember}
          onClose={() => setEditMember(null)}
          onSave={(role) => handleRoleUpdate(editMember, role)}
          roles={HOA_ROLES}
        />
      )}

      {inviteOpen && (
        <InviteModal
          onClose={() => setInviteOpen(false)}
          onSend={handleInvite}
          roles={HOA_ROLES}
          buildings={user?.buildingIds?.length
            ? [{ id: user.buildingIds[0], name: user.buildings?.[0]?.name ?? "Building" }]
            : undefined}
          defaultBuildingId={user?.buildingIds?.[0]}
        />
      )}

      {/* Revoke access confirmation modal */}
      {revokeTarget && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setRevokeTarget(null); }}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "var(--spacing-24)",
          }}
        >
          <div style={{
            background: "var(--color-fill-white)",
            borderRadius: "var(--radius-12)",
            padding: "var(--spacing-32)",
            width: "100%", maxWidth: 400,
            boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
            display: "flex", flexDirection: "column", gap: "var(--spacing-24)",
            fontFamily: "var(--font-family-body)",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
              <p style={{
                margin: 0,
                fontSize: "var(--font-size-tiny)",
                fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                lineHeight: "var(--line-height-tiny)",
                color: "var(--color-text-strong)",
              }}>
                Revoke access for {revokeTarget.name}?
              </p>
              <p style={{
                margin: 0,
                fontSize: "var(--font-size-extra-tiny)",
                fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                lineHeight: "var(--line-height-extra-tiny)",
                color: "var(--color-text-weak)",
              }}>
                This will remove their access to the platform. This action cannot be undone.
              </p>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--spacing-8)" }}>
              <button
                onClick={() => setRevokeTarget(null)}
                style={{
                  height: 36, padding: "0 var(--spacing-20)",
                  background: "var(--color-fill-white)",
                  border: "1px solid var(--color-stroke-medium)",
                  borderRadius: "var(--radius-8)", cursor: "pointer",
                  fontFamily: "var(--font-family-body)",
                  fontSize: "var(--font-size-tiny)",
                  fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                  lineHeight: "var(--line-height-tiny)",
                  color: "var(--color-text-strong)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-fill-weak)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-fill-white)"; }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleRevoke(revokeTarget)}
                style={{
                  height: 36, padding: "0 var(--spacing-20)",
                  background: "var(--color-fill-error)",
                  border: "none",
                  borderRadius: "var(--radius-8)", cursor: "pointer",
                  fontFamily: "var(--font-family-body)",
                  fontSize: "var(--font-size-tiny)",
                  fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                  lineHeight: "var(--line-height-tiny)",
                  color: "var(--color-text-white)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-red-1000)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-fill-error)"; }}
              >
                Revoke access
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}
    </>
  );
}

// ─── Auth wrapper ─────────────────────────────────────────────────────────────

/**
 * Outer wrapper handles the team-management gate. We split the page into a
 * wrapper + content pair (rather than gating inside the content component) so
 * that the inner component's hooks only mount once we know the user is
 * authorized. Returning `null` mid-component would violate the Rules of Hooks
 * when `useAuth()` resolves from `null` to an authorized user — the inner
 * content's state and queries would mount conditionally.
 *
 * Team management is admin + lead_concierge only (Actions.InviteTeamMember).
 * The sidebar hides this link for concierge/security, but a direct URL hit
 * would still render the page otherwise — bounce unauthorized users back to
 * /bookings so they land somewhere their role can actually use.
 */
export default function AccessManagementPage() {
  const { user } = useAuth();
  const router = useRouter();

  const isAuthorized = user ? can(user.role, Actions.InviteTeamMember) : null;

  useEffect(() => {
    if (isAuthorized === false) router.replace("/bookings");
  }, [isAuthorized, router]);

  if (isAuthorized !== true) return null;

  return <AccessManagementPageContent />;
}
