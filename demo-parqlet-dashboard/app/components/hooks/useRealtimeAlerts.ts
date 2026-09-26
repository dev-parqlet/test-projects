/**
 * useRealtimeAlerts — WebSocket connection for real-time alerts.
 *
 * When NEXT_PUBLIC_MOCK_ENABLED=true, falls back to polling /api/alerts
 * every 30 seconds instead of opening a WebSocket connection.
 *
 * The alert list lives in the TanStack Query cache (key
 * `["realtimeAlerts", "feed"]`) so AlertToast and other consumers share one
 * source of truth. Each new alert is pushed via `queryClient.setQueryData`
 * instead of setState.
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface RealtimeAlert {
  id: string;
  buildingId: string;
  buildingName: string;
  severity: "Critical" | "Warning" | "Info";
  type: string;
  description: string;
  timestamp: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.parqlet.com";
const IS_MOCK = process.env.NEXT_PUBLIC_MOCK_ENABLED === "true";
const MOCK_POLL_INTERVAL = 30_000;
const MAX_FEED_SIZE = 50;

export const realtimeAlertKeys = {
  feed: ["realtimeAlerts", "feed"] as const,
};

function parseAlert(raw: unknown): RealtimeAlert | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (
    typeof o.id !== "string" ||
    typeof o.severity !== "string" ||
    typeof o.buildingName !== "string" ||
    typeof o.description !== "string" ||
    typeof o.timestamp !== "string"
  )
    return null;
  return {
    id: o.id,
    buildingId: (o.buildingId as string) ?? "",
    buildingName: o.buildingName,
    severity: o.severity as RealtimeAlert["severity"],
    type: (o.type as string) ?? "",
    description: o.description,
    timestamp: o.timestamp,
  };
}

async function fetchRecentAlert(): Promise<RealtimeAlert | null> {
  const res = await fetch(`${API_URL}/api/alerts?pageSize=1`, {
    credentials: "include",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: unknown[] };
  const items = json.data ?? [];
  if (items.length === 0) return null;
  return parseAlert(items[0]);
}

export function useRealtimeAlerts() {
  const queryClient = useQueryClient();

  // Alert list lives in QueryClient cache. `data` stays undefined while idle;
  // consumers should treat undefined as "not yet received anything" rather than
  // an empty array (which would mean "explicitly cleared").
  const { data: alerts = [] } = useQuery<RealtimeAlert[]>({
    queryKey: realtimeAlertKeys.feed,
    queryFn: () => Promise.resolve([]),
    staleTime: Infinity,
    gcTime: Infinity,
    initialData: [],
  });

  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;

  // Imperative handle — refs are correct here because the timer id isn't read
  // for rendering and we don't want timer changes to re-run the effect.
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const clearAlerts = useCallback(() => {
    queryClientRef.current.setQueryData<RealtimeAlert[]>(realtimeAlertKeys.feed, []);
  }, []);

  const addAlert = useCallback((alert: RealtimeAlert) => {
    queryClientRef.current.setQueryData<RealtimeAlert[]>(realtimeAlertKeys.feed, (prev) => {
      const list = prev ?? [];
      if (list.some((a) => a.id === alert.id)) return list;
      return [alert, ...list].slice(0, MAX_FEED_SIZE);
    });
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    if (IS_MOCK) {
      // ── Mock mode: poll /api/alerts every 30s ────────────────────────────
      let lastId: string | null = null;

      const poll = async () => {
        try {
          const newest = await fetchRecentAlert();
          if (!newest) return;
          if (lastId !== null && newest.id !== lastId) {
            addAlert(newest);
          }
          lastId = newest.id;
        } catch {
          // ignore poll errors silently
        }
      };

      poll();
      pollTimerRef.current = setInterval(poll, MOCK_POLL_INTERVAL);

      return () => {
        mountedRef.current = false;
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      };
    }

    // ── Real mode: WebSocket (DISABLED — backend WS not ready) ────────────
    // TODO: re-enable when backend WebSocket server is ready
    /*
    let cancelled = false;

    function connect() {
      if (cancelled || !mountedRef.current) return;

      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.onmessage = null;
        wsRef.current.close();
        wsRef.current = null;
      }

      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const apiHost = API_URL.replace(/^https?:\/\//, "");
      const url = `${wsProtocol}//${apiHost}/ws?token=pending`;

      fetch("/api/auth/ws-token", { credentials: "include" })
        .then((r) => {
          if (!r.ok) throw new Error(`Token fetch failed: ${r.status}`);
          return r.json();
        })
        .then((data) => {
          if (cancelled || !mountedRef.current) return;
          const token = data.token as string;
          const authenticatedUrl = `${wsProtocol}//${apiHost}/ws?token=${encodeURIComponent(token)}`;

          const ws = new WebSocket(authenticatedUrl);
          wsRef.current = ws;

          ws.onopen = () => { backoffRef.current = 1000; };

          ws.onmessage = (event) => {
            try {
              const parsed = JSON.parse(event.data);
              if (parsed.type === "alert" && parsed.alert) {
                const alert = parseAlert(parsed.alert);
                if (alert && mountedRef.current) addAlert(alert);
              }
            } catch {}
          };

          ws.onclose = () => {
            wsRef.current = null;
            if (cancelled || !mountedRef.current) return;
            const delay = backoffRef.current;
            backoffRef.current = Math.min(backoffRef.current * 2, 30_000);
            reconnectTimerRef.current = setTimeout(connect, delay);
          };

          ws.onerror = () => { ws.close(); };
        })
        .catch(() => {
          if (cancelled || !mountedRef.current) return;
          const delay = backoffRef.current;
          backoffRef.current = Math.min(backoffRef.current * 2, 30_000);
          reconnectTimerRef.current = setTimeout(connect, delay);
        });
    }

    connect();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.onmessage = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
    */
  }, [addAlert]);

  return { alerts, clearAlerts };
}