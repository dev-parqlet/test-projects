"use client";

import { useState, useEffect, useCallback } from "react";
import {
  listAdminBroadcasts,
  createAdminBroadcast,
  updateAdminBroadcast,
  deleteAdminBroadcast,
  type AdminBroadcastCampaign,
  type AdminBroadcastPayload,
} from "@/lib/api/super-admin";
import { listBuildings, type Building } from "@/lib/api/buildings";
import { TableScroll } from "../../../components/ui/TableScroll";
import { TableHeadLabel } from "../../../components/ui/TableHeadLabel";
import { CopyableCell } from "../../../components/ui/CopyableCell";
import { Modal } from "../../../components/ui/Modal";
import "../../../tokens.css";

function todayLocalDate(): string {
  return new Intl.DateTimeFormat("en-CA").format(new Date());
}

// Default when the audience is "all buildings" (no single building's zone
// applies) or no specific building has been picked yet — not the admin's
// own browser timezone, which could be anywhere and has nothing to do with
// where the message is actually read. Austin, TX (Central) per product
// request.
const DEFAULT_TIME_ZONE = "America/Chicago";

/** The zone "Times of day" is interpreted in: the first selected building's
 *  own timezone once one is picked, otherwise DEFAULT_TIME_ZONE. Every
 *  schedule for a campaign shares one zone (see admin-broadcast-job.ts on
 *  the backend), so a multi-building selection still resolves to a single
 *  zone — the first pick's. */
function resolveTimeZone(form: FormState, buildings: Building[]): string {
  if (form.audience === "specific" && form.buildingIds.length > 0) {
    const b = buildings.find((x) => x.id === form.buildingIds[0]);
    if (b?.timeZone) return b.timeZone;
  }
  return DEFAULT_TIME_ZONE;
}

function fmt12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour}${ampm}` : `${hour}:${String(m).padStart(2, "0")}${ampm}`;
}

function audienceLabel(buildingIds: string[] | null, buildingsById: Map<string, string>): string {
  if (!buildingIds || buildingIds.length === 0) return "All buildings";
  if (buildingIds.length === 1) return buildingsById.get(buildingIds[0]) ?? "1 building";
  return `${buildingIds.length} buildings`;
}

const EMPTY_FORM = {
  title: "",
  message: "",
  audience: "all" as "all" | "specific",
  buildingIds: [] as string[],
  startDate: todayLocalDate(),
  endDate: todayLocalDate(),
  times: ["09:00"] as string[],
};

type FormState = typeof EMPTY_FORM;

function BroadcastForm({
  buildings,
  initial,
  onCancel,
  onSave,
  saving,
  error,
}: {
  buildings: Building[];
  initial: FormState;
  onCancel: () => void;
  onSave: (form: FormState) => void;
  saving: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<FormState>(initial);

  const labelStyle: React.CSSProperties = {
    display: "block", marginBottom: 6,
    fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
    color: "var(--color-text-strong)",
  };
  const inputStyle: React.CSSProperties = {
    width: "100%", height: 36, padding: "0 12px", boxSizing: "border-box",
    border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-8)",
    fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-strong)", outline: "none",
  };

  function updateTime(i: number, value: string) {
    setForm((f) => ({ ...f, times: f.times.map((t, idx) => (idx === i ? value : t)) }));
  }
  function addTime() {
    setForm((f) => ({ ...f, times: [...f.times, "09:00"] }));
  }
  function removeTime(i: number) {
    setForm((f) => ({ ...f, times: f.times.filter((_, idx) => idx !== i) }));
  }
  function toggleBuilding(id: string) {
    setForm((f) => ({
      ...f,
      buildingIds: f.buildingIds.includes(id) ? f.buildingIds.filter((b) => b !== id) : [...f.buildingIds, id],
    }));
  }

  const canSave =
    form.title.trim().length > 0 &&
    form.message.trim().length > 0 &&
    form.startDate <= form.endDate &&
    form.times.length > 0 &&
    (form.audience === "all" || form.buildingIds.length > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <label style={labelStyle}>Title</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          maxLength={100}
          placeholder="e.g. Going away for Labor Day?"
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Message</label>
        <textarea
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          maxLength={500}
          rows={3}
          placeholder="What should residents see?"
          style={{ ...inputStyle, height: "auto", padding: 10, resize: "vertical", fontFamily: "var(--font-family-body)" }}
        />
      </div>

      <div>
        <label style={labelStyle}>Audience</label>
        <div style={{ display: "flex", gap: 8, marginBottom: form.audience === "specific" ? 10 : 0 }}>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, audience: "all" }))}
            style={{
              flex: 1, height: 36, borderRadius: "var(--radius-8)", cursor: "pointer",
              border: `1px solid ${form.audience === "all" ? "var(--color-fill-strong)" : "var(--color-stroke-medium)"}`,
              background: form.audience === "all" ? "var(--color-fill-strong)" : "var(--color-fill-white)",
              color: form.audience === "all" ? "var(--color-text-white)" : "var(--color-text-strong)",
              fontSize: "var(--font-size-tiny)", fontFamily: "var(--font-family-body)",
            }}
          >
            All buildings
          </button>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, audience: "specific" }))}
            style={{
              flex: 1, height: 36, borderRadius: "var(--radius-8)", cursor: "pointer",
              border: `1px solid ${form.audience === "specific" ? "var(--color-fill-strong)" : "var(--color-stroke-medium)"}`,
              background: form.audience === "specific" ? "var(--color-fill-strong)" : "var(--color-fill-white)",
              color: form.audience === "specific" ? "var(--color-text-white)" : "var(--color-text-strong)",
              fontSize: "var(--font-size-tiny)", fontFamily: "var(--font-family-body)",
            }}
          >
            Specific buildings
          </button>
        </div>
        {form.audience === "specific" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 160, overflowY: "auto", border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-8)", padding: 10 }}>
            {buildings.length === 0 && (
              <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)" }}>No buildings found.</span>
            )}
            {buildings.map((b) => (
              <label key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", cursor: "pointer" }}>
                <input type="checkbox" checked={form.buildingIds.includes(b.id)} onChange={() => toggleBuilding(b.id)} />
                {b.name}
              </label>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Start date</label>
          <input type="date" lang="en-US" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>End date</label>
          <input type="date" lang="en-US" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} style={inputStyle} />
        </div>
      </div>
      {form.startDate > form.endDate && (
        <span style={{ fontSize: "var(--font-size-extra-tiny)", color: "var(--color-tag-text-expired)", marginTop: -12 }}>
          End date must be on or after the start date.
        </span>
      )}

      <div>
        <label style={labelStyle}>Times of day ({resolveTimeZone(form, buildings)})</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {form.times.map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="time" value={t} onChange={(e) => updateTime(i, e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              {form.times.length > 1 && (
                <button type="button" onClick={() => removeTime(i)} style={{ height: 36, padding: "0 10px", border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-8)", background: "var(--color-fill-white)", cursor: "pointer", color: "var(--color-text-weak)", fontSize: "var(--font-size-tiny)" }}>
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        {form.times.length < 12 && (
          <button type="button" onClick={addTime} style={{ marginTop: 8, background: "none", border: "none", cursor: "pointer", color: "var(--color-text-link, #2563eb)", fontSize: "var(--font-size-tiny)", padding: 0 }}>
            + Add another time
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: "10px 14px", background: "var(--color-tag-expired)", borderRadius: "var(--radius-8)", color: "var(--color-tag-text-expired)", fontSize: "var(--font-size-tiny)" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
        <button type="button" onClick={onCancel} style={{ height: 38, padding: "0 18px", border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-8)", background: "var(--color-fill-white)", cursor: "pointer", fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)" }}>
          Cancel
        </button>
        <button
          type="button"
          disabled={!canSave || saving}
          onClick={() => onSave(form)}
          style={{
            height: 38, padding: "0 18px", border: "none", borderRadius: "var(--radius-8)",
            background: !canSave || saving ? "var(--color-stroke-medium)" : "var(--color-fill-strong)",
            color: "var(--color-text-white)", cursor: !canSave || saving ? "default" : "pointer",
            fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
          }}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

function formToPayload(form: FormState, buildings: Building[]): AdminBroadcastPayload {
  return {
    title: form.title.trim(),
    message: form.message.trim(),
    buildingIds: form.audience === "all" ? null : form.buildingIds,
    startDate: form.startDate,
    endDate: form.endDate,
    times: [...form.times].sort(),
    timeZone: resolveTimeZone(form, buildings),
  };
}

function campaignToForm(c: AdminBroadcastCampaign): FormState {
  return {
    title: c.title ?? "",
    message: c.message,
    audience: c.buildingIds && c.buildingIds.length > 0 ? "specific" : "all",
    buildingIds: c.buildingIds ?? [],
    startDate: c.startDate,
    endDate: c.endDate,
    times: c.times,
  };
}

export default function BroadcastsPage() {
  const [campaigns, setCampaigns] = useState<AdminBroadcastCampaign[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const buildingsById = new Map(buildings.map((b) => [b.id, b.name]));

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listAdminBroadcasts();
      setCampaigns(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load broadcasts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
    listBuildings({ pageSize: 100 }).then((res) => setBuildings(res.data)).catch(() => {});
  }, [fetchCampaigns]);

  async function handleSave(form: FormState) {
    setSaving(true);
    setFormError(null);
    try {
      const payload = formToPayload(form, buildings);
      if (modalMode === "edit" && editingId) {
        await updateAdminBroadcast(editingId, payload);
      } else {
        await createAdminBroadcast(payload);
      }
      setModalMode(null);
      setEditingId(null);
      await fetchCampaigns();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save broadcast");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteAdminBroadcast(id);
      await fetchCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete broadcast");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={{ padding: "var(--spacing-24)", display: "flex", flexDirection: "column", gap: "var(--spacing-24)", fontFamily: "var(--font-family-body)", height: "100%", overflow: "hidden", boxSizing: "border-box" as React.CSSProperties["boxSizing"] }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "var(--font-size-heading-1)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-heading-1)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-heading)" }}>
            Broadcasts
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: "var(--font-size-body)", color: "var(--color-text-weak)" }}>
            {loading ? "Loading..." : `${campaigns.length} scheduled campaign${campaigns.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => { setModalMode("create"); setFormError(null); }}
          style={{ height: 38, padding: "0 18px", border: "none", borderRadius: "var(--radius-8)", background: "var(--color-fill-strong)", color: "var(--color-text-white)", cursor: "pointer", fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"] }}
        >
          + New broadcast
        </button>
      </div>

      {error && (
        <div style={{ padding: "16px 20px", background: "var(--color-tag-expired)", borderRadius: "var(--radius-8)", color: "var(--color-tag-text-expired)", fontSize: "var(--font-size-tiny)" }}>
          {error}
        </div>
      )}

      <div style={{ background: "var(--color-fill-white)", border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-12)", overflow: "hidden", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          <TableScroll minWidth={860}>
            <div style={{ display: "flex", alignItems: "center", padding: "0 var(--spacing-24)", minHeight: 48, borderBottom: "1px solid var(--color-stroke-medium)", background: "var(--color-fill-white)", position: "sticky", top: 0, zIndex: 2 }}>
              {([["Message", 30], ["Audience", 16], ["Dates", 18], ["Times", 18], ["", 12]] as const).map(([label, flex]) => (
                <div key={label} style={{ flex: `${flex} 1 0`, minWidth: 0 }}>
                  <span style={{ lineHeight: "var(--line-height-uppercase)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", textTransform: "uppercase" as const, display: "block", paddingLeft: label === "Audience" || label === "Dates" ? "8px" : "0" }}>
                    <TableHeadLabel>{label}</TableHeadLabel>
                  </span>
                </div>
              ))}
            </div>

            {loading ? (
              <div style={{ padding: "48px 20px", color: "var(--color-text-weak)", fontSize: "var(--font-size-tiny)" }}>Loading...</div>
            ) : campaigns.length === 0 ? (
              <div style={{ padding: "48px 20px", color: "var(--color-text-weak)", fontSize: "var(--font-size-tiny)" }}>
                No broadcasts scheduled. Create one to message residents on a recurring schedule.
              </div>
            ) : (
              campaigns.map((c, i) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", padding: "0 var(--spacing-24)", minHeight: 56, borderBottom: i < campaigns.length - 1 ? "1px solid var(--color-stroke-medium)" : "none" }}>
                  <div style={{ flex: "30 1 0", minWidth: 0, paddingRight: 12 }}>
                    <CopyableCell value={`${c.title ?? "Announcement"}\n${c.message}`}>
                      <span title={c.title ?? "Announcement"} style={{ fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--color-text-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                        {c.title || "Announcement"}
                      </span>
                      <span title={c.message} style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                        {c.message}
                      </span>
                    </CopyableCell>
                  </div>
                  <div style={{ flex: "16 1 0", minWidth: 0 }}>
                    <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)" }}>{audienceLabel(c.buildingIds, buildingsById)}</span>
                  </div>
                  <div style={{ flex: "18 1 0", minWidth: 0 }}>
                    <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)" }}>{c.startDate} → {c.endDate}</span>
                  </div>
                  <div style={{ flex: "18 1 0", minWidth: 0 }}>
                    <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)" }}>{c.times.map(fmt12h).join(", ")}</span>
                  </div>
                  <div style={{ flex: "12 1 0", minWidth: 0, display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button
                      onClick={() => { setModalMode("edit"); setEditingId(c.id); setFormError(null); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-strong)", fontSize: "var(--font-size-tiny)", padding: 0 }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      style={{ background: "none", border: "none", cursor: deletingId === c.id ? "default" : "pointer", color: "var(--color-tag-text-expired)", fontSize: "var(--font-size-tiny)", padding: 0 }}
                    >
                      {deletingId === c.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </TableScroll>
        </div>
      </div>

      <Modal
        open={modalMode !== null}
        onClose={() => { setModalMode(null); setEditingId(null); }}
        title={modalMode === "edit" ? "Edit broadcast" : "New broadcast"}
        size="large"
      >
        {modalMode !== null && (
          <BroadcastForm
            buildings={buildings}
            initial={modalMode === "edit" ? campaignToForm(campaigns.find((c) => c.id === editingId)!) : EMPTY_FORM}
            onCancel={() => { setModalMode(null); setEditingId(null); }}
            onSave={handleSave}
            saving={saving}
            error={formError}
          />
        )}
      </Modal>
    </div>
  );
}
