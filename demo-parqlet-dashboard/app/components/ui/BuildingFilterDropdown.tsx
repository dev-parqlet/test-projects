"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBuildingFilter } from "../context/building-filter-context";
import { IcChevronDown } from "../super-admin-icons/IcChevronDown";
import { IcCheck } from "../super-admin-icons/IcCheck";
import { useAuth } from "../auth/auth-provider";
import { buildingKeys } from "../../lib/api/buildings";

interface Building {
  id: string;
  name: string;
}

const BACKEND_URL =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL ?? "https://api.parqlet.com"
    : "https://api.parqlet.com";

function dedupeBuildings(raw: Building[]): Building[] {
  // Deduplicate by id (StrictMode double-render guard) and then by name (the
  // backend seed may insert the same building multiple times).
  const seenId = new Set<string>();
  const byId = raw.filter((b) => (seenId.has(b.id) ? false : (seenId.add(b.id), true)));
  const seenName = new Set<string>();
  return byId.filter((b) => (seenName.has(b.name) ? false : (seenName.add(b.name), true)));
}

/** Exported so other screens can reuse the same query key and read
 *  building NAMES from cache instead of firing their own request. */
export async function fetchBuildings(): Promise<Building[]> {
  const res = await fetch(`${BACKEND_URL}/api/buildings?pageSize=100`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load buildings");
  const json = (await res.json()) as { data?: Building[] };
  return dedupeBuildings(json.data ?? []);
}

export function BuildingFilterDropdown() {
  const { user } = useAuth();
  const { selectedIds, setSelectedIds, isAll } = useBuildingFilter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: buildings = [] } = useQuery<Building[]>({
    // Distinct cache slot from the paginated-list consumers (OverviewPage,
    // buildings/page.tsx, etc.) because this returns Building[] unwrapped,
    // while listBuildings() returns PaginatedResponse<Building>. Sharing the
    // key silently corrupts the overview's stat calculations on first render
    // (see commit c1708c4).
    queryKey: buildingKeys.list({ forFilter: true }),
    queryFn: fetchBuildings,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function toggleBuilding(id: string) {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((s) => s !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  }

  const isSuperAdmin = user?.role === "super_admin";
  if (!user) return null;

  const label = isAll
    ? "All Buildings"
    : selectedIds.length === 1
    ? buildings.find((b) => b.id === selectedIds[0])?.name ?? "1 Building"
    : `${selectedIds.length} Buildings`;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          height: 36,
          padding: "0 12px",
          background: open ? "var(--color-gray-5)" : "var(--color-fill-white)",
          border: "1px solid var(--color-stroke-medium)",
          borderRadius: "var(--radius-8)",
          cursor: "pointer",
          fontFamily: "var(--font-family-body)",
          fontSize: "var(--font-size-tiny)",
          fontWeight: (!isAll ? "500" : "400") as React.CSSProperties["fontWeight"],
          color: "var(--color-text-strong)",
          whiteSpace: "nowrap",
          transition: "background 0.12s",
        }}
      >
        {!isAll && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 18,
              height: 18,
              borderRadius: 99,
              background: "var(--color-fill-accent)",
              fontSize: 11,
              fontWeight: 600,
              // Fixed brand color, doesn't invert in dark mode — keep text dark.
              color: "#222222",
              flexShrink: 0,
            }}
          >
            {selectedIds.length}
          </span>
        )}
        {label}
        <IcChevronDown />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 500,
            background: "var(--color-fill-white)",
            border: "1px solid var(--color-stroke-medium)",
            borderRadius: "var(--radius-12)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
            minWidth: 240,
            maxWidth: "calc(100vw - 32px)",
            overflow: "hidden",
          }}
        >
          {/* All Buildings */}
          <button
            onClick={() => setSelectedIds([])}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              background: isAll ? "var(--color-gray-5)" : "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-family-body)",
              fontSize: "var(--font-size-tiny)",
              fontWeight: (isAll ? "500" : "400") as React.CSSProperties["fontWeight"],
              color: "var(--color-text-strong)",
              textAlign: "left",
              borderBottom: "1px solid var(--color-stroke-medium)",
            }}
            onMouseEnter={(e) => {
              if (!isAll) e.currentTarget.style.background = "var(--color-gray-5)";
            }}
            onMouseLeave={(e) => {
              if (!isAll) e.currentTarget.style.background = "none";
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                flexShrink: 0,
                border: isAll ? "none" : "1px solid var(--color-stroke-medium)",
                background: isAll ? "var(--color-fill-strong)" : "var(--color-fill-white)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isAll && <IcCheck color="var(--color-text-white)" />}
            </span>
            All Buildings
          </button>

          {buildings.map((b) => {
            const checked = selectedIds.includes(b.id);
            return (
              <button
                key={b.id}
                onClick={() => toggleBuilding(b.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 14px",
                  background: checked ? "var(--color-gray-5)" : "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-family-body)",
                  fontSize: "var(--font-size-tiny)",
                  fontWeight: (checked ? "500" : "400") as React.CSSProperties["fontWeight"],
                  color: "var(--color-text-strong)",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  if (!checked) e.currentTarget.style.background = "var(--color-gray-5)";
                }}
                onMouseLeave={(e) => {
                  if (!checked) e.currentTarget.style.background = "none";
                }}
              >
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    flexShrink: 0,
                    border: checked ? "none" : "1px solid var(--color-stroke-medium)",
                    background: checked ? "var(--color-fill-strong)" : "var(--color-fill-white)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {checked && <IcCheck color="var(--color-text-white)" />}
                </span>
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {b.name}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}