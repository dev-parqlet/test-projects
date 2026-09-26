"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "../../components/auth/auth-provider";
import { listBuildings, buildingKeys } from "../../lib/api/buildings";
import { submitTicket } from "../../lib/api/super-admin";
import "../../tokens.css";

// ─── Constants ──────────────────────────────────────────────────────────────

const CATEGORIES = ["General", "Hardware", "Software", "Security", "Billing", "Integration", "Onboarding", "Feature Request"];
const PRIORITIES = [
  { value: "Low",      label: "Low",      desc: "Minor issue, no urgency" },
  { value: "Medium",   label: "Medium",   desc: "Moderate impact, should be addressed" },
  { value: "High",     label: "High",     desc: "Significant impact, needs attention" },
  { value: "Critical", label: "Critical", desc: "System down or security issue" },
];
const MAX_DESC_LENGTH = 2000;

// ─── Icons ──────────────────────────────────────────────────────────────────

function IcArrowLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M15 18l-6-6 6-6" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IcChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M6 9l6 6 6-6" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── Inline Input Components ────────────────────────────────────────────────

function SubjectInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type="text"
      placeholder="Brief summary of the issue"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%",
        height: 40,
        padding: "0 12px",
        border: `1px solid ${focused ? "var(--color-stroke-strong)" : "var(--color-stroke-medium)"}`,
        borderRadius: "var(--radius-8)",
        background: "var(--color-fill-white)",
        fontSize: "var(--font-size-tiny)",
        fontFamily: "var(--font-family-body)",
        color: "var(--color-text-strong)",
        outline: "none",
        boxSizing: "border-box",
        transition: "border-color 0.12s",
      }}
    />
  );
}

function DescInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      placeholder="Describe the issue in detail. Include steps to reproduce, affected areas, and any relevant context."
      value={value}
      onChange={(e) => onChange(e.target.value.slice(0, MAX_DESC_LENGTH))}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      rows={5}
      style={{
        width: "100%",
        padding: "12px",
        border: `1px solid ${focused ? "var(--color-stroke-strong)" : "var(--color-stroke-medium)"}`,
        borderRadius: "var(--radius-8)",
        background: "var(--color-fill-white)",
        fontSize: "var(--font-size-tiny)",
        fontFamily: "var(--font-family-body)",
        color: "var(--color-text-strong)",
        outline: "none",
        boxSizing: "border-box",
        resize: "vertical",
        minHeight: 120,
        lineHeight: "var(--line-height-tiny)",
        transition: "border-color 0.12s",
      }}
    />
  );
}

// ─── Label style ────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "var(--font-size-extra-tiny)",
  fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
  color: "var(--color-text-strong)",
  fontFamily: "var(--font-family-body)",
  lineHeight: "var(--line-height-extra-tiny)",
  marginBottom: "var(--spacing-6)",
};

const sectionCard: React.CSSProperties = {
  background: "var(--color-fill-white)",
  border: "1px solid var(--color-stroke-medium)",
  borderRadius: "var(--radius-12)",
  padding: "var(--spacing-24)",
};

// ─── Page ──────────────────────────────────────────────────────────────────

export default function NewTicketPage() {
  const router = useRouter();
  const { user } = useAuth();
  const userBuildingId = user?.buildingId ?? "";

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [priority, setPriority] = useState("Medium");
  const [selectedBuildingId, setSelectedBuildingId] = useState(userBuildingId);
  const [submitError, setSubmitError] = useState("");

  // Fetch buildings for selector
  const { data: buildingsData } = useQuery({
    queryKey: buildingKeys.list(),
    queryFn: () => listBuildings({ pageSize: 100 }),
    enabled: !userBuildingId,
  });
  const buildingsList = buildingsData?.data ?? [];
  const showBuildingSelector = !userBuildingId || user?.role === "super_admin";

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: () =>
      submitTicket({
        buildingId: selectedBuildingId || userBuildingId,
        subject: subject.trim(),
        description: description.trim(),
        priority: priority as "Low" | "Medium" | "High" | "Critical",
        category,
        submitterName: user?.name ?? "HOA Admin",
        submitterEmail: user?.email ?? "",
      }),
    onSuccess: (data) => {
      router.push(`/tickets/${data.id}`);
    },
    onError: (err: any) => {
      setSubmitError(err?.message || "Failed to submit ticket. Please try again.");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    if (!subject.trim() || !description.trim()) return;
    submitMutation.mutate();
  }

  const isValid = subject.trim().length > 0 && description.trim().length > 0;

  // ─── Select component with focus state ────────────────────────────────────

  function SelectField({
    value,
    onChange,
    options,
  }: {
    value: string;
    onChange: (v: string) => void;
    options: string[];
  }) {
    const [focused, setFocused] = useState(false);
    return (
      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            height: 40,
            padding: "0 32px 0 12px",
            border: `1px solid ${focused ? "var(--color-stroke-strong)" : "var(--color-stroke-medium)"}`,
            borderRadius: "var(--radius-8)",
            background: "var(--color-fill-white)",
            fontSize: "var(--font-size-tiny)",
            fontFamily: "var(--font-family-body)",
            color: "var(--color-text-strong)",
            cursor: "pointer",
            outline: "none",
            appearance: "none",
            WebkitAppearance: "none",
            boxSizing: "border-box",
            transition: "border-color 0.12s",
          }}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          <IcChevronDown />
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "var(--spacing-24)", fontFamily: "var(--font-family-body)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--spacing-20)" }}>
        {/* Back + Title */}
        <div>
          <button
            onClick={() => router.push("/tickets")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "none", border: "none",
              cursor: "pointer", padding: "4px 0",
              fontFamily: "var(--font-family-body)",
              fontSize: "var(--font-size-tiny)",
              color: "var(--color-text-weak)",
              marginBottom: "var(--spacing-8)",
            }}
          >
            <IcArrowLeft />
            Back to Tickets
          </button>
          <h1 style={{
            margin: 0,
            fontSize: "var(--font-size-heading-1)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            lineHeight: "var(--line-height-heading-1)",
            color: "var(--color-text-strong)",
            fontFamily: "var(--font-family-heading)",
          }}>
            Submit a Support Ticket
          </h1>
          <p style={{
            margin: "6px 0 0",
            fontSize: "var(--font-size-body)",
            color: "var(--color-text-weak)",
            fontFamily: "var(--font-family-body)",
          }}>
            Describe the issue you&apos;re experiencing and our support team will follow up.
          </p>
        </div>

        {/* Error toast */}
        {submitError && (
          <div style={{
            background: "var(--color-tag-expired)",
            color: "var(--color-tag-text-expired)",
            borderRadius: "var(--radius-8)",
            padding: "var(--spacing-12) var(--spacing-16)",
            fontSize: "var(--font-size-tiny)",
            fontFamily: "var(--font-family-body)",
          }}>
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-20)" }}>
          {/* Building selector */}
          {showBuildingSelector && (
            <div style={sectionCard}>
              <span style={labelStyle}>Building</span>
              <SelectField
                value={selectedBuildingId}
                onChange={setSelectedBuildingId}
                options={["", ...buildingsList.map((b) => b.name)]}
              />
              {selectedBuildingId && (
                <input type="hidden" value={buildingsList.find((b) => b.name === selectedBuildingId)?.id ?? ""} />
              )}
            </div>
          )}

          {/* Subject */}
          <div style={sectionCard}>
            <span style={labelStyle}>Subject *</span>
            <SubjectInput value={subject} onChange={setSubject} />
          </div>

          {/* Description */}
          <div style={sectionCard}>
            <span style={labelStyle}>Description *</span>
            <DescInput value={description} onChange={setDescription} />
            <div style={{ textAlign: "right", marginTop: "var(--spacing-4)" }}>
              <span style={{
                fontSize: "var(--font-size-extra-tiny)",
                color: "var(--color-text-weaker)",
                fontFamily: "var(--font-family-body)",
              }}>
                {description.length} / {MAX_DESC_LENGTH}
              </span>
            </div>
          </div>

          {/* Category + Priority */}
          <div style={{ ...sectionCard, display: "flex", flexWrap: "wrap", gap: "var(--spacing-20)" }}>
            <div style={{ flex: "1 1 160px", minWidth: 0 }}>
              <span style={labelStyle}>Category</span>
              <SelectField value={category} onChange={setCategory} options={CATEGORIES} />
            </div>
            <div style={{ flex: "2 1 240px", minWidth: 0 }}>
              <span style={labelStyle}>Priority</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--spacing-8)" }}>
                {PRIORITIES.map((p) => {
                  const active = priority === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriority(p.value)}
                      style={{
                        flex: "1 1 70px",
                        padding: "var(--spacing-8) var(--spacing-12)",
                        background: active ? "var(--color-fill-strong)" : "var(--color-fill-white)",
                        border: `1px solid ${active ? "var(--color-fill-strong)" : "var(--color-stroke-medium)"}`,
                        borderRadius: "var(--radius-8)",
                        cursor: "pointer",
                        color: active ? "var(--color-text-white)" : "var(--color-text-strong)",
                        fontFamily: "var(--font-family-body)",
                        fontSize: "var(--font-size-extra-tiny)",
                        fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                        lineHeight: "var(--line-height-extra-tiny)",
                        textAlign: "center",
                        transition: "all 0.12s",
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div style={{
            ...sectionCard,
            background: "var(--color-gray-5)",
            border: "none",
            display: "flex",
            justifyContent: "flex-end",
            flexWrap: "wrap",
            gap: "var(--spacing-12)",
          }}>
            <button
              type="button"
              onClick={() => router.push("/tickets")}
              style={{
                padding: "10px 24px",
                background: "var(--color-fill-white)",
                border: "1px solid var(--color-stroke-medium)",
                borderRadius: "var(--radius-48)",
                cursor: "pointer",
                fontFamily: "var(--font-family-body)",
                fontSize: "var(--font-size-tiny)",
                color: "var(--color-text-strong)",
                fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || submitMutation.isPending}
              style={{
                padding: "10px 24px",
                background: isValid && !submitMutation.isPending ? "var(--color-fill-strong)" : "var(--color-gray-30)",
                color: isValid && !submitMutation.isPending ? "var(--color-text-white)" : "var(--color-text-weak)",
                border: "none",
                borderRadius: "var(--radius-48)",
                cursor: isValid && !submitMutation.isPending ? "pointer" : "default",
                fontFamily: "var(--font-family-body)",
                fontSize: "var(--font-size-tiny)",
                fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                transition: "all 0.15s",
              }}
            >
              {submitMutation.isPending ? "Submitting\u2026" : "Submit Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}