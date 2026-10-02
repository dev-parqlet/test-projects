"use client";

/**
 * The file-import panel: drop a spreadsheet, see what is in it, confirm.
 *
 * ONE definition, used from two places. It was written inside the Settings
 * page's Resident Management tab; Parking Spots now opens the same thing in
 * a dialog, and a second copy of two hundred lines of drag-and-drop, preview
 * table and phase machine would have drifted the moment either screen was
 * touched.
 *
 * `variant` is the only difference between the two callers:
 *
 *   "card"   Settings. Draws the bordered <Card> with its own heading,
 *            the way the rest of that page's sections look.
 *   "bare"   Inside a <Modal>, which already supplies the frame and the
 *            title. A card inside a dialog is a box inside a box.
 *
 * Everything else - the endpoints, the phases, the template download - is
 * identical, because it is the same import. The feed carries residents AND
 * their unit, so the same file is what tells Parking Spots which spot sits
 * on which lease; that is why one panel serves both screens rather than
 * each growing its own.
 */

import React, { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "../ui/Button";
import { TableScroll } from "../ui/TableScroll";
import { getBuilding } from "../../lib/api/buildings";
import { DEMO_IDENTITIES } from "../../lib/demo/variants";

export type ImportPanelVariant = "card" | "bare";

/** The bordered shell every Settings section uses. Local, so this panel does
 *  not reach back into the page that used to own it. */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background:   "var(--color-fill-white)",
      border:       "1px solid var(--color-stroke-medium)",
      borderRadius: "var(--radius-12)",
      overflow:     "hidden",
    }}>
      {children}
    </div>
  );
}

/** In a dialog the Modal already draws the frame and the title, so the card
 *  shell and its heading row drop out and only the contents remain. */
function Shell({ variant, title, children }: {
  variant: ImportPanelVariant;
  title: string;
  children: React.ReactNode;
}) {
  if (variant === "bare") return <>{children}</>;
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-8)", padding: "var(--spacing-16) var(--spacing-20)" }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 13V4M10 4L7 7M10 4L13 7" stroke="var(--color-icon-strong)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 14v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1" stroke="var(--color-icon-strong)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span style={{ fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)" }}>{title}</span>
      </div>
      <div style={{ height: 1, background: "var(--color-stroke-medium)" }} />
      {children}
    </Card>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      flex: 1, minWidth: 120,
      background: "var(--color-fill-white)",
      border: "1px solid var(--color-stroke-medium)",
      borderRadius: "var(--radius-8)",
      padding: "var(--spacing-12) var(--spacing-16)",
      display: "flex", flexDirection: "column", gap: "var(--spacing-4)",
    }}>
      <span style={{
        fontSize: "var(--font-size-extra-tiny)", fontWeight: "var(--font-weight-regular)",
        lineHeight: "var(--line-height-extra-tiny)", color: "var(--color-text-weak)",
        fontFamily: "var(--font-family-body)",
      }}>{label}</span>
      <span style={{
        fontSize: "var(--font-size-heading-2)", fontWeight: "var(--font-weight-regular)",
        lineHeight: "var(--line-height-heading-2)", color: "var(--color-text-strong)",
        fontFamily: "var(--font-family-body)",
      }}>{value}</span>
    </div>
  );
}

const ENTITY_LABELS: Record<string, string> = {
  resident: "Residents", building: "Buildings", parking_lot: "Parking Lots / Spots",
  team_member: "Team Members", invoice: "Invoices / Fees", unknown: "Other Data",
};
const ENTITY_COLORS: Record<string, string> = {
  resident: "var(--color-tag-text-active)", building: "var(--color-tag-text-upcoming)", parking_lot: "var(--color-tag-text-pending)",
  team_member: "#4a6fa5", invoice: "#8a6d3b", unknown: "var(--color-text-disabled)",
};

function EntityBadge({ entity }: { entity: string }) {
  const color = ENTITY_COLORS[entity] ?? "var(--color-text-disabled)";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "var(--spacing-4)",
      padding: "2px var(--spacing-8)", borderRadius: 99,
      fontSize: "var(--font-size-extra-tiny)", fontWeight: "var(--font-weight-medium)",
      lineHeight: "var(--line-height-extra-tiny)", fontFamily: "var(--font-family-body)",
      color, background: `${color}18`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block" }} />
      {ENTITY_LABELS[entity] ?? entity}
    </span>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: Record<string, string>[] }) {
  if (rows.length === 0) {
    return <p style={{ margin: 0, fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", textAlign: "center", padding: "var(--spacing-24)" }}>No data rows found in this sheet.</p>;
  }
  const tableMinWidth = Math.max(480, headers.length * 160 + 60);

  return (
    <TableScroll minWidth={tableMinWidth}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-extra-tiny)", lineHeight: "var(--line-height-extra-tiny)" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "var(--spacing-8) var(--spacing-12)", fontWeight: "var(--font-weight-medium)", color: "var(--color-text-strong)", borderBottom: "1px solid var(--color-stroke-medium)", background: "var(--color-fill-weak)", whiteSpace: "nowrap" }}>#</th>
            {headers.map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "var(--spacing-8) var(--spacing-12)", fontWeight: "var(--font-weight-medium)", color: "var(--color-text-strong)", borderBottom: "1px solid var(--color-stroke-medium)", background: "var(--color-fill-weak)", whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td style={{ padding: "var(--spacing-6) var(--spacing-12)", color: "var(--color-text-weak)", borderBottom: "1px solid var(--color-stroke-weak)", whiteSpace: "nowrap", verticalAlign: "top" }}>{i + 1}</td>
              {headers.map((h) => (
                <td key={h} style={{ padding: "var(--spacing-6) var(--spacing-12)", color: "var(--color-text-strong)", borderBottom: "1px solid var(--color-stroke-weak)", whiteSpace: "nowrap", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", verticalAlign: "top" }}>
                  {row[h] || <span style={{ color: "var(--color-text-disabled)" }}>&mdash;</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
}

// ─── Resident Management tab ───────────────────────────────────────────────────

interface SheetPreview {
  sheetName: string;
  guessedEntity: string;
  rowCount: number;
  headers: string[];
  sample: Record<string, string>[];
}
interface ImportPreview {
  fileName: string;
  fileSize: number;
  totalSheets: number;
  totalRows: number;
  sheets: SheetPreview[];
  detectedEntities: string[];
  /** Dry-run counts from the backend: what confirming would actually
   *  do. Optional so an older API still renders the preview. */
  willInsert?: number;
  willUpdate?: number;
  willSkip?: number;
  /** Existing residents whose stored phone differs from the file's.
   *  Replaced only if `overwritePhones` is sent on confirm. */
  phoneConflicts?: number;
}

type ImportPhase = "drop" | "parsing" | "preview" | "importing" | "done";

/**
 * The resident import template.
 *
 * Columns are exactly the keys `importResidentRows` reads
 * (api-backend/src/lib/resident-importer.ts). Headers are normalised on
 * upload by stripping spaces, so "First Name" and "FirstName" both
 * work — but the spelling must match, since matching is strict.
 *
 * PRE-FILLED WITH THE BUILDING'S OWN NAME, ADDRESS, CITY AND STATE. The
 * import correlates each row to a building by matching those exactly, so a
 * template that said "Your Building Name" produced files where every row
 * skipped with `no_building_match` - the most likely way for an upload to
 * fail, and one the uploader cannot diagnose from the result.
 *
 * RESIDENT TYPE follows the product. `ResidentType` maps "Renter" to Renter
 * and EVERYTHING ELSE to Owner, so an apartment manager copying an "Owner"
 * example would file every tenant under the one role an apartment resident
 * is not. A Condo's residents own their spots; an Apartment's rent them.
 */
const IMPORT_TEMPLATE_COLUMNS = [
  "Email",
  "FirstName",
  "LastName",
  "CellPhone",
  "UnitNumber",
  "PropertyName",
  "PropertyAddress",
  "PropertyCity",
  "PropertyState",
  "ResidentType",
  "ResidentId",
  "OccupancyId",
  "MoveOutDate",
  "LeaseEndDate",
] as const;

/** The property columns a row must carry for the import to find the building. */
type TemplateBuilding = {
  name: string;
  address: string;
  city: string;
  state: string;
};

function importTemplateRows(
  building: TemplateBuilding,
  buildingType: "condo" | "apartment",
): string[][] {
  const { name, address, city, state } = building;
  // Two rows, because one leaves the reader guessing whether anything
  // varies per row. A Condo shows one of each, since ResidentType is the
  // field that genuinely has two meanings there. An Apartment shows two
  // Renters: everyone there rents, and an "Owner" example would be copied.
  const first = buildingType === "apartment" ? "Renter" : "Owner";
  const second = "Renter";
  return [
    [
      "jane.doe@example.com", "Jane", "Doe", "+1 512 555 0101", "101",
      name, address, city, state, first, "R-1001", "O-2001", "", "",
    ],
    [
      "sam.lee@example.com", "Sam", "Lee", "+1 512 555 0102", "102",
      name, address, city, state, second, "R-1002", "O-2002", "", "2027-06-30",
    ],
  ];
}

/** RFC 4180: quote every field, double any embedded quote. Phone numbers
 *  and addresses contain commas, and an unquoted template would teach
 *  people to produce files that break on the first comma. */
function toCsv(rows: readonly (readonly string[])[]): string {
  return rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
}

function downloadImportTemplate(
  building: TemplateBuilding,
  buildingType: "condo" | "apartment",
) {
  const csv = toCsv([IMPORT_TEMPLATE_COLUMNS, ...importTemplateRows(building, buildingType)]);
  // BOM so Excel opens it as UTF-8 rather than mangling accented names.
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "parqlet-resident-import-template.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ImportDataCard({
  product,
  variant = "card",
  title = "Import Residents & Data",
  blurb = "Upload an Excel (.xlsx, .xls) or CSV file to bulk-import residents, buildings, parking lots, and more.",
  onDone,
}: {
  product: "condo" | "apartment";
  variant?: ImportPanelVariant;
  title?: string;
  blurb?: string;
  /** Called once an import finishes, so a caller can refresh behind itself. */
  onDone?: () => void;
}) {
    const [phase, setPhase] = useState<ImportPhase>("drop");
    const [dragOver, setDragOver] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<ImportPreview | null>(null);
    // Off unless the operator ticks it. Those are numbers residents may
    // have corrected in the app, so replacing them is a decision, never a
    // side effect of uploading a roster.
    const [overwritePhones, setOverwritePhones] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // The template is pre-filled with the building of whichever demo is
    // open, because the import matches a row to a building on name +
    // address + city + state exactly. The id comes from DEMO_IDENTITIES so
    // it cannot drift from the mock data the rest of the page reads.
    const demoBuilding = DEMO_IDENTITIES[product].user.buildings[0];
    const { data: buildingDetail } = useQuery({
      queryKey: ["building", demoBuilding?.id],
      queryFn: () => getBuilding(demoBuilding!.id),
      enabled: !!demoBuilding?.id,
    });

    const acceptFile = useCallback((f: File) => {
      const ext = f.name.split(".").pop()?.toLowerCase();
      if (!["xlsx", "xls", "csv"].includes(ext ?? "")) {
        setError(`"${ext}" files are not supported. Upload .xlsx, .xls, or .csv.`);
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        setError("File exceeds 10 MB limit.");
        return;
      }
      setError(null);
      setFile(f);
      setPhase("parsing");
      uploadFile(f);
    }, []);

    const uploadFile = useCallback(async (f: File) => {
      setPhase("parsing");
      setPreview(null);
      try {
        const formData = new FormData();
        formData.append("file", f);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/residents/import/preview`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error?.message ?? `Server returned ${res.status}`);
        }
        const data: ImportPreview = await res.json();
        setPreview(data);
        setPhase("preview");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setPhase("drop");
        setFile(null);
      }
    }, []);

    const handleImport = useCallback(async () => {
      if (!file) return;
      setPhase("importing");
      try {
        const formData = new FormData();
        formData.append("file", file);
        if (overwritePhones) formData.append("overwritePhones", "true");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/residents/import/confirm`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error?.message ?? `Import failed: ${res.status}`);
        }
        setPhase("done");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Import failed");
        setPhase("preview");
      }
    }, [file, overwritePhones]);

    const handleReset = useCallback(() => {
      setPhase("drop");
      setFile(null);
      setPreview(null);
      setError(null);
      setOverwritePhones(false);
    }, []);

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
    const handleDragLeave = () => setDragOver(false);
    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) acceptFile(f);
    };

    function formatSize(bytes: number): string {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

  return (
          <Shell variant={variant} title={title}>

            <div style={{ padding: "var(--spacing-20)", display: "flex", flexDirection: "column", gap: "var(--spacing-16)" }}>
              <p style={{ margin: 0, fontSize: "var(--font-size-extra-tiny)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-extra-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" }}>
                {blurb}
              </p>

              {/* Error */}
              {error && (
                <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-8)", padding: "var(--spacing-12) var(--spacing-16)", background: "var(--color-red-50)", borderRadius: "var(--radius-8)", border: "1px solid var(--color-red-100)", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)", lineHeight: "var(--line-height-tiny)", color: "var(--color-text-error)" }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                    <circle cx="8" cy="8" r="7" stroke="var(--color-fill-error)" strokeWidth="1.3" />
                    <line x1="8" y1="5" x2="8" y2="9" stroke="var(--color-fill-error)" strokeWidth="1.3" strokeLinecap="round" />
                    <circle cx="8" cy="11" r="0.8" fill="var(--color-fill-error)" />
                  </svg>
                  <span>{error}</span>
                  <button onClick={() => setError(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--color-text-error)", flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                  </button>
                </div>
              )}

              {/* ── DROP ── */}
              {phase === "drop" && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `1.5px dashed ${dragOver ? "var(--color-text-strong)" : "var(--color-stroke-medium)"}`,
                    borderRadius: "var(--radius-8)",
                    background: dragOver ? "var(--color-fill-weak)" : "transparent",
                    padding: "var(--spacing-32) var(--spacing-20)",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--spacing-8)",
                    cursor: "pointer", transition: "border-color 0.15s, background 0.15s", textAlign: "center",
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: "var(--radius-10)", background: "var(--color-fill-weak)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path d="M12 16V5M12 5l-4 4M12 5l4 4" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3 17v1.5A2.5 2.5 0 0 0 5.5 21h13a2.5 2.5 0 0 0 2.5-2.5V17" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-tiny)", color: "var(--color-text-strong)" }}>
                      Drop your file here, or <span style={{ textDecoration: "underline" }}>browse</span>
                    </p>
                    <p style={{ margin: "4px 0 0", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-extra-tiny)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-extra-tiny)", color: "var(--color-text-weak)" }}>
                      .xlsx, .xls, .csv &mdash; max 10 MB
                    </p>
                  </div>
                  <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) acceptFile(f); e.target.value = ""; }} />
                </div>
              )}

              {/* ── PARSING ── */}
              {phase === "parsing" && (
                <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-16)", padding: "var(--spacing-24)" }}>
                  <div style={{ width: 24, height: 24, border: "2px solid var(--color-stroke-medium)", borderTopColor: "var(--color-text-strong)", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
                  <div>
                    <p style={{ margin: 0, fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-tiny)", color: "var(--color-text-strong)" }}>Parsing {file?.name}&hellip;</p>
                    <p style={{ margin: "var(--spacing-4) 0 0", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-extra-tiny)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-extra-tiny)", color: "var(--color-text-weak)" }}>Extracting sheets, columns, and data</p>
                  </div>
                </div>
              )}

              {/* ── PREVIEW ── */}
              {phase === "preview" && preview && (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-16)" }}>
                  {/* Stats */}
                  <div style={{ display: "flex", gap: "var(--spacing-8)", flexWrap: "wrap" }}>
                    <StatCard label="File" value={preview.fileName} />
                    <StatCard label="Size" value={formatSize(preview.fileSize)} />
                    <StatCard label="Sheets" value={preview.totalSheets} />
                    <StatCard label="Rows" value={preview.totalRows} />
                  </div>

                  {/* What confirming would actually do. "312 rows" says
                      nothing about impact — a roster meant to add five
                      people that reports 300 updates is visibly the wrong
                      file, and this is the moment to notice. */}
                  {preview.willInsert != null && (
                    <div style={{ display: "flex", gap: "var(--spacing-8)", flexWrap: "wrap" }}>
                      <StatCard label="Will add" value={preview.willInsert} />
                      <StatCard label="Will update" value={preview.willUpdate ?? 0} />
                      <StatCard label="Will skip" value={preview.willSkip ?? 0} />
                    </div>
                  )}

                  {/* Phone numbers are the one field residents edit
                      themselves, so replacing them is opt-in and the cost is
                      stated before the choice. */}
                  {(preview.phoneConflicts ?? 0) > 0 && (
                    <div style={{
                      background: "var(--color-fill-weak)",
                      border: "1px solid var(--color-stroke-medium)",
                      borderRadius: "var(--radius-8)",
                      padding: "var(--spacing-12) var(--spacing-16)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--spacing-8)",
                    }}>
                      <label style={{ display: "flex", alignItems: "flex-start", gap: "var(--spacing-8)", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={overwritePhones}
                          onChange={(e) => setOverwritePhones(e.target.checked)}
                          style={{ marginTop: 2, cursor: "pointer" }}
                        />
                        <span style={{ fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)" }}>
                          Also update phone numbers for existing residents
                        </span>
                      </label>
                      <span style={{ fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", paddingLeft: 24 }}>
                        {preview.phoneConflicts} resident
                        {preview.phoneConflicts === 1 ? "" : "s"} would have their phone number
                        replaced. Residents can edit their own number in the app, so leave this
                        off unless the file is the more reliable source.
                      </span>
                    </div>
                  )}

                  {/* Entity badges */}
                  {preview.detectedEntities.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-8)", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "var(--font-size-extra-tiny)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" }}>Detected entities:</span>
                      {preview.detectedEntities.map((e) => <EntityBadge key={e} entity={e} />)}
                    </div>
                  )}

                  {/* Sheet previews */}
                  {preview.sheets.map((sheet) => (
                    <div key={sheet.sheetName} style={{ background: "var(--color-fill-white)", border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-8)", overflow: "hidden", padding: "var(--spacing-16)" }}>
                      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", rowGap: "var(--spacing-4)", gap: "var(--spacing-8)", marginBottom: "var(--spacing-12)" }}>
                        <div style={{ width: 28, height: 28, borderRadius: "var(--radius-6)", background: "var(--color-fill-weak)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg width="14" height="14" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="2" stroke="var(--color-icon-weak)" strokeWidth="1.3" /><line x1="2" y1="7" x2="16" y2="7" stroke="var(--color-icon-weak)" strokeWidth="1.3" /><line x1="7" y1="2" x2="7" y2="16" stroke="var(--color-icon-weak)" strokeWidth="1.3" /></svg>
                        </div>
                        <p style={{ margin: 0, minWidth: 0, flexShrink: 1, fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-tiny)", color: "var(--color-text-strong)", display: "flex", alignItems: "center", gap: "var(--spacing-6)" }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{sheet.sheetName}</span>
                          <EntityBadge entity={sheet.guessedEntity} />
                        </p>
                        <span style={{ marginLeft: "auto", flexShrink: 0, whiteSpace: "nowrap", fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" }}>{sheet.rowCount} rows &middot; {sheet.headers.length} columns</span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--spacing-4)", marginBottom: "var(--spacing-12)" }}>
                        {sheet.headers.map((h) => (
                          <span key={h} style={{ display: "inline-flex", alignItems: "center", padding: "2px var(--spacing-6)", background: "var(--color-fill-weak)", borderRadius: "var(--radius-4)", fontSize: "var(--font-size-extra-tiny)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], fontFamily: "var(--font-family-body)", color: "var(--color-text-weak)", lineHeight: "var(--line-height-extra-tiny)" }}>{h}</span>
                        ))}
                      </div>
                      <DataTable headers={sheet.headers} rows={sheet.sample} />
                      {sheet.rowCount > sheet.sample.length && (
                        <p style={{ margin: "var(--spacing-8) 0 0", textAlign: "center", fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" }}>Showing {sheet.sample.length} of {sheet.rowCount} rows</p>
                      )}
                    </div>
                  ))}

                  {/* Actions */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--spacing-12) 0 0" }}>
                    <span style={{ fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" }}>{preview.totalRows} total rows ready</span>
                    <div style={{ display: "flex", gap: "var(--spacing-8)" }}>
                      <button onClick={handleReset}
                        style={{ height: 36, padding: "0 var(--spacing-14)", background: "var(--color-fill-white)", border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-8)", cursor: "pointer", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], color: "var(--color-text-strong)", transition: "background 0.12s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-fill-weak)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-fill-white)"; }}>Cancel</button>
                      <button onClick={handleImport}
                        style={{ height: 36, padding: "0 var(--spacing-16)", background: "var(--color-button-neutral)", color: "white", border: "none", borderRadius: "var(--radius-8)", cursor: "pointer", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], transition: "background 0.12s", display: "flex", alignItems: "center", gap: "var(--spacing-6)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-gray-90)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-button-neutral)"; }}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 11V2M8 2l-4 4M8 2l4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M1 12v.5A1.5 1.5 0 0 0 2.5 14h11a1.5 1.5 0 0 0 1.5-1.5V12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                        Import all data
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── IMPORTING ── */}
              {phase === "importing" && (
                <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-16)", padding: "var(--spacing-24)" }}>
                  <div style={{ width: 24, height: 24, border: "2px solid var(--color-stroke-medium)", borderTopColor: "var(--color-text-strong)", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
                  <div>
                    <p style={{ margin: 0, fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-tiny)", color: "var(--color-text-strong)" }}>Importing data&hellip;</p>
                    <p style={{ margin: "var(--spacing-4) 0 0", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-extra-tiny)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-extra-tiny)", color: "var(--color-text-weak)" }}>Writing to database</p>
                  </div>
                </div>
              )}

              {/* ── DONE ── */}
              {phase === "done" && (
                <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-12)", padding: "var(--spacing-16)", background: "var(--color-tag-active)", borderRadius: "var(--radius-8)" }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><path d="M3 8l4 4 6-6" stroke="var(--color-tag-text-active)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-tiny)", color: "var(--color-tag-text-active)" }}>{preview?.fileName} imported successfully</p>
                    <p style={{ margin: "2px 0 0", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-extra-tiny)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-extra-tiny)", color: "var(--color-tag-text-active)" }}>{preview?.totalRows} rows processed across {preview?.totalSheets} sheets</p>
                  </div>
                  <button onClick={handleReset}
                    style={{ height: 32, padding: "0 var(--spacing-12)", background: "var(--color-button-neutral)", color: "white", border: "none", borderRadius: "var(--radius-6)", cursor: "pointer", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-extra-tiny)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], transition: "background 0.12s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-gray-90)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-button-neutral)"; }}>Upload another file</button>
                </div>
              )}

              {/* Template download */}
              <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-6)" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M7 9l-3-3M7 9l3-3" stroke="var(--color-text-weak)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M1 11v.5A1.5 1.5 0 0 0 2.5 13h9a1.5 1.5 0 0 0 1.5-1.5V11" stroke="var(--color-text-weak)" strokeWidth="1.2" strokeLinecap="round" /></svg>
                <button style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-extra-tiny)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-extra-tiny)", color: "var(--color-text-weak)", textDecoration: "underline", textUnderlineOffset: 2 }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-text-strong)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-weak)"; }}
                  onClick={() =>
                    downloadImportTemplate(
                      {
                        // Falls back to the placeholders when the detail
                        // request has not landed, so the button never does
                        // nothing - but the common case hands back real values.
                        name: buildingDetail?.name ?? demoBuilding?.name ?? "Your Building Name",
                        address: buildingDetail?.address ?? "123 Main Street",
                        city: buildingDetail?.city ?? "Austin",
                        state: buildingDetail?.state ?? "TX",
                      },
                      product,
                    )
                  }>Download template</button>
              </div>
            </div>

            {/* Spinner keyframe */}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </Shell>
  );
}
