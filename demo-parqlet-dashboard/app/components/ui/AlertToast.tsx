/**
 * AlertToast — floating toast notification for real-time alerts.
 *
 * Pops up from the bottom-center of the screen when a new alert arrives.
 * Auto-dismisses based on severity. Max 3 visible toasts at a time.
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { RealtimeAlert } from "../hooks/useRealtimeAlerts";
import { fmtTime } from "../../lib/dates";

// ─── Severity theming ──────────────────────────────────────────────────────────

const SEVERITY_STYLES: Record<
  RealtimeAlert["severity"],
  { border: string; bg: string; labelBg: string; labelColor: string }
> = {
  Critical: {
    border: "var(--color-tag-text-expired)",
    bg: "rgba(199,58,58,0.10)",
    labelBg: "var(--color-tag-expired)",
    labelColor: "var(--color-tag-text-expired)",
  },
  Warning: {
    border: "var(--color-tag-text-pending)",
    bg: "rgba(189,161,46,0.10)",
    labelBg: "var(--color-tag-pending)",
    labelColor: "var(--color-tag-text-pending)",
  },
  Info: {
    border: "var(--color-tag-text-upcoming)",
    bg: "rgba(65,120,147,0.10)",
    labelBg: "var(--color-tag-upcoming)",
    labelColor: "var(--color-tag-text-upcoming)",
  },
};

// ─── Individual toast item ─────────────────────────────────────────────────────

function ToastItem({
  alert,
  onDismiss,
}: {
  alert: RealtimeAlert;
  onDismiss: () => void;
}) {
  const styles = SEVERITY_STYLES[alert.severity];

  return (
    <div
      onClick={onDismiss}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        width: 380,
        background: "var(--color-fill-strong)",
        borderRadius: "var(--radius-12)",
        borderLeft: `4px solid ${styles.border}`,
        padding: "14px 16px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        cursor: "pointer",
        transition: "opacity 0.2s, transform 0.2s",
        animation: "alertToastSlideUp 0.25s ease-out",
        fontFamily: "var(--font-family-body)",
      }}
    >
      {/* Severity badge */}
      <span
        style={{
          flexShrink: 0,
          display: "inline-flex",
          alignItems: "center",
          background: styles.labelBg,
          color: styles.labelColor,
          borderRadius: "var(--radius-48)",
          padding: "2px 8px",
          fontSize: "var(--font-size-extra-tiny)",
          fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
          lineHeight: "var(--line-height-extra-tiny)",
          whiteSpace: "nowrap",
        }}
      >
        {alert.severity}
      </span>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "var(--font-size-tiny)",
            fontWeight: "500" as React.CSSProperties["fontWeight"],
            color: "var(--color-text-white)",
            lineHeight: "var(--line-height-tiny)",
            marginBottom: 4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {alert.buildingName}
        </div>
        <div
          style={{
            fontSize: "var(--font-size-extra-tiny)",
            color: "var(--color-text-weaker)",
            lineHeight: "var(--line-height-extra-tiny)",
            marginBottom: 4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {alert.type}: {alert.description}
        </div>
        <div
          style={{
            fontSize: "var(--font-size-extra-tiny)",
            color: "var(--color-text-disabled)",
            lineHeight: "var(--line-height-extra-tiny)",
          }}
        >
          {fmtTime(alert.timestamp)}
        </div>
      </div>

      {/* Close X */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        style={{
          flexShrink: 0,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 20,
          height: 20,
          color: "var(--color-text-weaker)",
          fontSize: 16,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}

// ─── Toast container ───────────────────────────────────────────────────────────

interface ActiveToast {
  id: string;
  alert: RealtimeAlert;
  timerId: ReturnType<typeof setTimeout>;
}

export function AlertToast({ alerts }: { alerts: RealtimeAlert[] }) {
  const [activeToasts, setActiveToasts] = useState<ActiveToast[]>([]);
  const queueRef = useRef<RealtimeAlert[]>([]);
  const MAX_VISIBLE = 3;

  const dismiss = useCallback((id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Process queue whenever we have room
  const processQueue = useCallback(() => {
    setActiveToasts((prev) => {
      if (queueRef.current.length === 0) return prev;
      if (prev.length >= MAX_VISIBLE) return prev;

      const remaining = MAX_VISIBLE - prev.length;
      const batch = queueRef.current.splice(0, remaining);

      const newToasts = batch.map((alert) => {
        const dismissMs =
          alert.severity === "Critical" ? 15_000
          : alert.severity === "Warning" ? 10_000
          : 8_000;
        const timerId = setTimeout(() => {
          dismiss(alert.id);
        }, dismissMs);
        return { id: alert.id, alert, timerId };
      });

      return [...prev, ...newToasts];
    });
  }, [dismiss]);

  // When new alerts arrive, queue them
  useEffect(() => {
    if (alerts.length === 0) return;

    // We only process the *newest* alert — use the first one from the array
    const latest = alerts[0];
    if (!latest) return;

    // Check if it's already active or queued
    setActiveToasts((prev) => {
      if (prev.some((t) => t.id === latest.id)) return prev;
      return prev;
    });
    if (activeToasts.some((t) => t.id === latest.id)) return;
    if (queueRef.current.some((a) => a.id === latest.id)) return;

    // If there's room, show immediately
    setActiveToasts((prev) => {
      if (prev.some((t) => t.id === latest.id)) return prev;
      if (prev.length < MAX_VISIBLE) {
        const dismissMs =
          latest.severity === "Critical" ? 15_000
          : latest.severity === "Warning" ? 10_000
          : 8_000;
        const timerId = setTimeout(() => {
          dismiss(latest.id);
        }, dismissMs);
        return [...prev, { id: latest.id, alert: latest, timerId }];
      }
      // Queue it
      queueRef.current.push(latest);
      return prev;
    });
  }, [alerts, dismiss, activeToasts]);

  // Process queue after dismissals
  useEffect(() => {
    if (queueRef.current.length > 0 && activeToasts.length < MAX_VISIBLE) {
      const timer = setTimeout(processQueue, 100);
      return () => clearTimeout(timer);
    }
  }, [activeToasts.length, processQueue]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      setActiveToasts((prev) => {
        prev.forEach((t) => clearTimeout(t.timerId));
        return [];
      });
    };
  }, []);

  if (activeToasts.length === 0) return null;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-css */}
      <style>{`
        @keyframes alertToastSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          bottom: "var(--spacing-32)",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          zIndex: 3000,
          pointerEvents: "none",
        }}
      >
        {activeToasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: "auto" }}>
            <ToastItem
              alert={t.alert}
              onDismiss={() => {
                clearTimeout(t.timerId);
                dismiss(t.id);
              }}
            />
          </div>
        ))}
      </div>
    </>
  );
}
