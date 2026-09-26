"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../components/auth/auth-provider";
import { preferencesApi } from "../../lib/api/preferences";
import { ThemeToggle } from "../../components/ui/ThemeToggle";
import "../../tokens.css";

function IcClose({ size = 16, color = "var(--color-icon-strong)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 40, height: 24, borderRadius: 12,
        background: checked ? "var(--color-fill-accent)" : "var(--color-stroke-medium)",
        border: "none", cursor: "pointer", position: "relative", flexShrink: 0, transition: "background 0.15s",
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: checked ? 19 : 3,
        width: 18, height: 18, borderRadius: "50%",
        background: "var(--color-fill-white)",
        transition: "left 0.15s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

function SectionCard({ title, description, icon, children }: { title: string; description?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--color-fill-white)", border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-12)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-8)", padding: "var(--spacing-16) var(--spacing-20)", borderBottom: "1px solid var(--color-stroke-medium)" }}>
        {icon && <div style={{ flexShrink: 0, display: "flex" }}>{icon}</div>}
        <div>
          <div style={{ fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)" }}>{title}</div>
          {description && <div style={{ marginTop: 2, fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", lineHeight: "var(--line-height-extra-tiny)" }}>{description}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

function SettingRow({ label, description, control }: { label: string; description?: string; control: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, padding: "16px 24px", borderBottom: "1px solid var(--color-stroke-medium)", flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", fontWeight: "500" as React.CSSProperties["fontWeight"] }}>{label}</div>
        {description && <div style={{ marginTop: 2, fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" }}>{description}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{control}</div>
    </div>
  );
}

// ─── Tabs ──────────────────────────────────────────────────────────────────────

type SettingsTab = "notifications" | "reports" | "platform";

const SETTINGS_TABS: { id: SettingsTab; label: string }[] = [
  { id: "notifications", label: "Notifications" },
  { id: "reports",       label: "Reports"       },
  { id: "platform",      label: "Platform"      },
];

function TabBar({ active, onChange }: { active: SettingsTab; onChange: (t: SettingsTab) => void }) {
  const [hovered, setHovered] = useState<SettingsTab | null>(null);
  return (
    <div style={{
      display: "flex", alignItems: "flex-end", gap: 0,
      borderBottom: "1px solid var(--color-stroke-medium)",
      marginBottom: "var(--spacing-24)",
    }}>
      {SETTINGS_TABS.map(({ id, label }) => {
        const isActive  = active === id;
        const isHovered = hovered === id && !isActive;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            onMouseEnter={() => setHovered(id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              padding: "0 var(--spacing-4)", height: 40, marginRight: "var(--spacing-24)",
              background: "none", border: "none",
              borderBottom: isActive ? "2px solid var(--color-text-strong)" : "2px solid transparent",
              cursor: "pointer",
              fontFamily: "var(--font-family-body)",
              fontSize: "var(--font-size-tiny)",
              fontWeight: (isActive ? "var(--font-weight-medium)" : "var(--font-weight-regular)") as React.CSSProperties["fontWeight"],
              lineHeight: "var(--line-height-tiny)",
              color: isActive || isHovered ? "var(--color-text-strong)" : "var(--color-text-weak)",
              transition: "color 0.15s, border-color 0.15s",
              marginBottom: -1, whiteSpace: "nowrap",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab,      setActiveTab]      = useState<SettingsTab>("notifications");
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [alertCritical,  setAlertCritical]  = useState(true);
  const [alertWarning,   setAlertWarning]   = useState(true);
  const [alertInfo,      setAlertInfo]      = useState(false);
  const [syncFailNotify, setSyncFailNotify] = useState(true);
  const [overdueNotify,  setOverdueNotify]  = useState(true);
  const [weeklyDigest,   setWeeklyDigest]   = useState(true);
  const [adminEmail,     setAdminEmail]     = useState(user?.email ?? "");
  const [toastMsg,       setToastMsg]       = useState("");
  const initialLoadDone = useRef(false);

  // Debounce timer for auto-saving
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  }

  // ── Load preferences on mount ────────────────────────────────────────────
  useEffect(() => {
    async function fetchPrefs() {
      try {
        const prefs = await preferencesApi.get();
        setAlertCritical(prefs.alertSeverityPreferences?.critical?.email ?? true);
        setAlertWarning(prefs.alertSeverityPreferences?.warning?.email ?? true);
        setAlertInfo(prefs.alertSeverityPreferences?.info?.email ?? false);
        setSyncFailNotify(prefs.notificationPreferences?.["sync-fail"]?.email ?? true);
        setOverdueNotify(prefs.notificationPreferences?.["overdue"]?.email ?? true);
        setWeeklyDigest(prefs.notificationPreferences?.["weekly-digest"]?.email ?? true);
        if (prefs.adminNotificationEmail) {
          setAdminEmail(prefs.adminNotificationEmail);
        }
        initialLoadDone.current = true;
      } catch {
        // Use defaults on error
        initialLoadDone.current = true;
      } finally {
        setLoading(false);
      }
    }
    fetchPrefs();
  }, []);

  // ── Build full preferences payload ───────────────────────────────────────
  function buildPreferences() {
    return {
      adminNotificationEmail: adminEmail,
      alertSeverityPreferences: {
        critical: { email: alertCritical, web: true },
        warning:  { email: alertWarning,  web: true },
        info:     { email: alertInfo,     web: true },
      },
      notificationPreferences: {
        "sync-fail":     { email: syncFailNotify, web: true },
        "overdue":       { email: overdueNotify,  web: true },
        "weekly-digest": { email: weeklyDigest,   web: false },
      },
    };
  }

  // ── Save preferences ─────────────────────────────────────────────────────
  const savePreferences = useCallback(async (prefs: ReturnType<typeof buildPreferences>) => {
    setSaving(true);
    try {
      await preferencesApi.update(prefs);
      showToast("Preferences saved.");
    } catch {
      showToast("Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  }, []);

  // ── Auto-save on toggle changes ──────────────────────────────────────────
  function scheduleAutoSave() {
    if (!initialLoadDone.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      savePreferences(buildPreferences());
    }, 600);
  }

// ── Wrapper setters that trigger auto-save ──────────────────────────────
  function setCritical(v: boolean) { setAlertCritical(v); scheduleAutoSave(); }
  function setWarning(v: boolean)  { setAlertWarning(v);  scheduleAutoSave(); }
  function setInfo(v: boolean)     { setAlertInfo(v);     scheduleAutoSave(); }
  function setSyncFail(v: boolean) { setSyncFailNotify(v); scheduleAutoSave(); }
  function setOverdue(v: boolean)  { setOverdueNotify(v);  scheduleAutoSave(); }
  function setDigest(v: boolean)   { setWeeklyDigest(v);   scheduleAutoSave(); }

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: "var(--spacing-24)", display: "flex", flexDirection: "column", gap: "var(--spacing-24)", fontFamily: "var(--font-family-body)", maxWidth: 800 }}>
        {[180, 320, 160].map((w, i) => (
          <div key={i} style={{
            height: i === 0 ? 80 : i === 1 ? 280 : 120,
            borderRadius: "var(--radius-12)",
            background: "var(--color-gray-5)",
            animation: "pulse 1.5s infinite",
          }} />
        ))}
      </div>
    );
  }

return (<>
    <div style={{ padding: "var(--spacing-24)", display: "flex", flexDirection: "column", gap: "var(--spacing-24)", fontFamily: "var(--font-family-body)", maxWidth: 800 }}>

        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-12)" }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: "var(--font-size-heading-1)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-heading-1)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-heading)" }}>
              Settings
            </h1>
            <p style={{ margin: "6px 0 0", fontSize: "var(--font-size-body)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" }}>
              Internal platform configuration
            </p>
          </div>
          {saving && (
            <span style={{
              fontSize: "var(--font-size-extra-tiny)",
              color: "var(--color-text-weak)",
              fontFamily: "var(--font-family-body)",
              whiteSpace: "nowrap",
            }}>
              Saving…
            </span>
          )}
        </div>

        <TabBar active={activeTab} onChange={setActiveTab} />

        {/* Notifications tab */}
        {activeTab === "notifications" && (
          <SectionCard
            title="Alert Notifications"
            description="Choose which alert types trigger an email to the admin address below."
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3C8.13 3 5 6.13 5 10v7H4v2h16v-2h-1v-7c0-3.87-3.13-7-7-7z" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinejoin="round"/><path d="M10 20a2 2 0 0 0 4 0" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round"/></svg>}
          >
            <SettingRow
              label="Critical alerts"
              description="Sync failures, overdue payments"
              control={<Toggle checked={alertCritical} onChange={setCritical} />}
            />
            <SettingRow
              label="Warning alerts"
              description="Low adoption, contract expiring, zero bookings"
              control={<Toggle checked={alertWarning} onChange={setWarning} />}
            />
            <SettingRow
              label="Info alerts"
              description="Credit stagnation and low-priority notices"
              control={<Toggle checked={alertInfo} onChange={setInfo} />}
            />
            <SettingRow
              label="Sync failure notifications"
              description="Immediate email on every failed sync"
              control={<Toggle checked={syncFailNotify} onChange={setSyncFail} />}
            />
            <SettingRow
              label="Overdue subscription notifications"
              description="Email when a building payment is past due"
              control={<Toggle checked={overdueNotify} onChange={setOverdue} />}
            />
            <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"] }}>
                Admin notification email
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => { setAdminEmail(e.target.value); scheduleAutoSave(); }}
                style={{
                  height: 36, padding: "0 12px", width: "100%", maxWidth: 360, boxSizing: "border-box",
                  border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-8)",
                  background: "var(--color-fill-white)", fontFamily: "var(--font-family-body)",
                  fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", outline: "none",
                }}
              />
            </div>
          </SectionCard>
        )}

        {/* Reports tab */}
        {activeTab === "reports" && (
          <SectionCard
            title="Reports & Digests"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="2" stroke="var(--color-icon-weak)" strokeWidth="1.5"/><path d="M8 8h8M8 12h8M8 16h5" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round"/></svg>}
          >
            <SettingRow
              label="Weekly portfolio digest"
              description="Summary email every Monday: MRR, adoption, alerts, sync health"
              control={<Toggle checked={weeklyDigest} onChange={setDigest} />}
            />
            <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--color-stroke-medium)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"] }}>Export all data</div>
                <div style={{ marginTop: 2, fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" }}>Download a CSV of all buildings, sync logs, and ticket history</div>
              </div>
              <button style={{
                height: 36, padding: "0 16px", flexShrink: 0,
                background: "var(--color-fill-white)", color: "var(--color-text-strong)",
                border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-8)",
                fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)",
                fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], cursor: "pointer",
                whiteSpace: "nowrap",
              }}>
                Export CSV
              </button>
            </div>
          </SectionCard>
        )}

        {/* Platform tab */}
        {activeTab === "platform" && (
          <SectionCard
            title="Platform"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="3" width="20" height="14" rx="2" stroke="var(--color-icon-weak)" strokeWidth="1.5"/><line x1="8" y1="21" x2="16" y2="21" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round"/><line x1="12" y1="17" x2="12" y2="21" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round"/></svg>}
          >
            <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--color-stroke-medium)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"] }}>Appearance</div>
                <div style={{ marginTop: 2, fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" }}>Switch between light and dark mode</div>
              </div>
              <ThemeToggle />
            </div>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--color-stroke-medium)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"] }}>Environment</div>
                <div style={{ marginTop: 2, fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" }}>Current deployment target</div>
              </div>
              <span style={{
                display: "inline-flex", alignItems: "center", flexShrink: 0,
                background: "var(--color-tag-active)", color: "var(--color-tag-text-active)",
                borderRadius: "var(--radius-48)", padding: "3px 10px",
                fontSize: "var(--font-size-extra-tiny)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], fontFamily: "var(--font-family-body)",
                whiteSpace: "nowrap",
              }}>
                Production
              </span>
            </div>
            <div style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"] }}>Version</div>
                <div style={{ marginTop: 2, fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" }}>Super-Admin Dashboard</div>
              </div>
              <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", flexShrink: 0, whiteSpace: "nowrap" }}>v1.0.0</span>
            </div>
          </SectionCard>
        )}

      </div>

      {toastMsg && (
        <div style={{
          position: "fixed",
          bottom: "var(--spacing-32)",
          left: "50%",
          transform: "translateX(-50%)",
          background: "var(--color-fill-strong)",
          color: "var(--color-text-white)",
          fontFamily: "var(--font-family-body)",
          fontSize: "var(--font-size-tiny)",
          fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
          lineHeight: "var(--line-height-tiny)",
          padding: "var(--spacing-12) var(--spacing-24)",
          borderRadius: "var(--radius-12)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
          zIndex: 3000,
          maxWidth: "calc(100vw - 48px)",
          width: "max-content",
          boxSizing: "border-box",
          textAlign: "center",
          whiteSpace: "normal",
        }}>
          {toastMsg}
        </div>
      )}
    </>
  );
};
