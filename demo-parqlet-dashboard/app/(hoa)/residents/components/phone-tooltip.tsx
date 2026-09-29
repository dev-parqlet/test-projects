'use client';

import { useState, useRef, useEffect } from 'react';
import { IcPhone } from './icons';

const MENU_WIDTH = 200;

export function PhoneWithTooltip({ phone }: { phone: string }) {
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const iconRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function handleEnter() {
    if (!menuOpen && iconRef.current) setHoverRect(iconRef.current.getBoundingClientRect());
  }
  function handleLeave() {
    setHoverRect(null);
  }

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    setHoverRect(null);
    setMenuOpen((open) => !open);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(phone);
    } catch {
      const el = document.createElement("textarea");
      el.value = phone;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      try { document.execCommand("copy"); } catch { /* no-op */ }
      document.body.removeChild(el);
    }
    setCopied(true);
    window.setTimeout(() => {
      setCopied(false);
      setMenuOpen(false);
    }, 900);
  }

  // Close on outside click / Escape, same pattern as the other dropdowns in this app.
  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !iconRef.current?.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const iconRect = iconRef.current?.getBoundingClientRect();
  // Clamp horizontally so the menu never overflows either edge of the
  // viewport, regardless of where in a wide (possibly horizontally-scrolled)
  // table this icon sits.
  const menuLeft = iconRect
    ? Math.min(Math.max(iconRect.left + iconRect.width / 2 - MENU_WIDTH / 2, 8), window.innerWidth - MENU_WIDTH - 8)
    : 0;

  return (
    <span
      ref={iconRef}
      style={{ display: "inline-flex", alignItems: "center", cursor: "pointer", flexShrink: 0, position: "relative" }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={handleClick}
      title={menuOpen ? undefined : "Call or copy"}
    >
      <IcPhone />

      {hoverRect && !menuOpen && (
        <span style={{
          position: "fixed",
          top: hoverRect.top - 6,
          left: hoverRect.left + hoverRect.width / 2,
          transform: "translate(-50%, -100%)",
          background: "var(--color-fill-strong)",
          color: "var(--color-text-white)",
          fontSize: "var(--font-size-extra-tiny)",
          lineHeight: "var(--line-height-extra-tiny)",
          fontFamily: "var(--font-family-body)",
          fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
          padding: "var(--spacing-4) var(--spacing-8)",
          borderRadius: "var(--radius-8)",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          zIndex: 9999,
        }}>
          {phone}
        </span>
      )}

      {menuOpen && iconRect && (
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: iconRect.bottom + 6,
            left: menuLeft,
            width: MENU_WIDTH,
            background: "var(--color-fill-white)",
            border: "1px solid var(--color-stroke-medium)",
            borderRadius: "var(--radius-12)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
            zIndex: 9999,
            overflow: "hidden",
            fontFamily: "var(--font-family-body)",
          }}
        >
          <div style={{
            padding: "8px 12px",
            fontSize: "var(--font-size-extra-tiny)",
            color: "var(--color-text-weak)",
            borderBottom: "1px solid var(--color-stroke-weak)",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {phone}
          </div>
          <a
            href={`tel:${phone}`}
            onClick={() => setMenuOpen(false)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 12px",
              fontSize: "var(--font-size-tiny)",
              color: "var(--color-text-strong)",
              textDecoration: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-gray-5)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
          >
            <IcPhone />
            Call
          </a>
          <button
            onClick={handleCopy}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              width: "100%", padding: "10px 12px",
              background: "none", border: "none", borderTop: "1px solid var(--color-stroke-weak)",
              fontSize: "var(--font-size-tiny)", fontFamily: "var(--font-family-body)",
              color: copied ? "var(--color-text-active-tag)" : "var(--color-text-strong)",
              cursor: "pointer", textAlign: "left",
            }}
            onMouseEnter={(e) => { if (!copied) e.currentTarget.style.background = "var(--color-gray-5)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="9" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5 15V5a2 2 0 0 1 2-2h10" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            {copied ? "Copied!" : "Copy number"}
          </button>
        </div>
      )}
    </span>
  );
}
