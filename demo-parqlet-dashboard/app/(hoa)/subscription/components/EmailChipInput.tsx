"use client";

/**
 * EmailChipInput — tag-style input for collecting a list of email addresses.
 *
 * Reusable across the subscription page and any future CC/notification list.
 *
 * Behaviour:
 *   - Type then Enter, Tab, or comma to commit the chip.
 *   - Click × on a chip to remove it.
 *   - Backspace in an empty input removes the last chip.
 *   - Each chip is RFC-5322-lite validated on commit; invalid input keeps the
 *     text in the input and shows an error message beneath.
 */

import { useState, useRef, KeyboardEvent, ChangeEvent } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const chipWrap: React.CSSProperties = {
  display:       "flex",
  flexWrap:      "wrap",
  alignItems:    "center",
  gap:           6,
  width:         "100%",
  minHeight:     40,
  boxSizing:     "border-box",
  border:        "1px solid var(--color-stroke-medium)",
  borderRadius:  "var(--radius-8)",
  padding:       "6px 8px",
  background:    "var(--color-fill-white)",
  fontFamily:    "var(--font-family-body)",
  cursor:        "text",
};

const chipBase: React.CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  gap:            4,
  background:     "var(--color-fill-weak)",
  color:          "var(--color-text-strong)",
  borderRadius:   "var(--radius-16)",
  padding:        "4px 4px 4px 10px",
  fontSize:       "var(--font-size-tiny)",
  lineHeight:     "var(--line-height-tiny)",
  fontFamily:     "var(--font-family-body)",
  whiteSpace:     "nowrap",
  maxWidth:       "100%",
};

const chipCloseBase: React.CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  justifyContent: "center",
  width:          18,
  height:         18,
  borderRadius:   "50%",
  border:         "none",
  background:     "transparent",
  color:          "var(--color-text-weak)",
  cursor:         "pointer",
  padding:        0,
  fontFamily:     "var(--font-family-body)",
};

const inputBase: React.CSSProperties = {
  flex:           1,
  minWidth:       120,
  border:         "none",
  outline:        "none",
  background:     "transparent",
  fontFamily:     "var(--font-family-body)",
  fontSize:       "var(--font-size-tiny)",
  lineHeight:     "var(--line-height-tiny)",
  color:          "var(--color-text-strong)",
  padding:        "4px 6px",
};

const errorStyle: React.CSSProperties = {
  marginTop:      6,
  fontFamily:     "var(--font-family-body)",
  fontSize:       "var(--font-size-extra-tiny)",
  lineHeight:     "var(--line-height-extra-tiny)",
  color:          "var(--color-text-error)",
};

type Props = {
  /** Controlled list of committed chips. */
  value: string[];
  /** Called with the next list when a chip is committed or removed. */
  onChange: (next: string[]) => void;
  /** Placeholder shown when the input is empty. */
  placeholder?: string;
  /** Disable editing (renders chips without × and a read-only input). */
  disabled?: boolean;
  /** Optional id used to associate a label. */
  id?: string;
};

export function EmailChipInput({
  value,
  onChange,
  placeholder = "Type email and press Enter",
  disabled = false,
  id,
}: Props) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hoverCloseIdx, setHoverCloseIdx] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function commit(rawValue: string) {
    const next = rawValue.trim().replace(/,$/, "").trim();
    if (!next) return;
    if (!EMAIL_RE.test(next)) {
      setError(`"${next}" is not a valid email address.`);
      return;
    }
    if (value.includes(next)) {
      setError(`"${next}" is already in the list.`);
      return;
    }
    setError(null);
    onChange([...value, next]);
    setDraft("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (disabled) return;
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      if (draft.trim()) {
        e.preventDefault();
        commit(draft);
      }
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    if (v.includes(",")) {
      const parts = v.split(",");
      const last = parts.pop() ?? "";
      let nextValue = value;
      for (const part of parts) {
        const candidate = part.trim();
        if (!candidate) continue;
        if (!EMAIL_RE.test(candidate) || nextValue.includes(candidate)) {
          setError(`"${candidate}" is not a valid or unique email address.`);
          setDraft(v);
          return;
        }
        nextValue = [...nextValue, candidate];
      }
      onChange(nextValue);
      setError(null);
      setDraft(last);
      return;
    }
    setDraft(v);
    if (error) setError(null);
  }

  function removeAt(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
    inputRef.current?.focus();
  }

  return (
    <div>
      <div
        style={chipWrap}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((email, idx) => (
          <span key={`${email}-${idx}`} style={chipBase}>
            {email}
            {!disabled && (
              <button
                type="button"
                aria-label={`Remove ${email}`}
                onClick={(e) => { e.stopPropagation(); removeAt(idx); }}
                onMouseEnter={() => setHoverCloseIdx(idx)}
                onMouseLeave={() => setHoverCloseIdx(null)}
                style={{
                  ...chipCloseBase,
                  color: hoverCloseIdx === idx ? "var(--color-text-error)" : chipCloseBase.color,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          type="email"
          value={draft}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (draft.trim()) commit(draft); }}
          placeholder={value.length === 0 ? placeholder : ""}
          disabled={disabled}
          style={inputBase}
        />
      </div>
      {error && <div style={errorStyle} role="alert">{error}</div>}
    </div>
  );
}
