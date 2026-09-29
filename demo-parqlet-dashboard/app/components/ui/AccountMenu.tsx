"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "../auth/auth-provider";

export function AccountMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const displayName = user?.name ?? "—";
  const displayEmail = user?.email ?? "—";
  const initials = displayName !== "—" ? displayName.slice(0, 2).toUpperCase() : "—";

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", minWidth: 0 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: hovered || open ? "var(--color-fill-weak)" : "none",
          border: "none", cursor: "pointer", borderRadius: 8,
          padding: "4px 8px", transition: "background 0.15s",
          minWidth: 0, maxWidth: "100%", boxSizing: "border-box",
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "var(--color-fill-strong)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-family-body)",
          fontSize: 13, fontWeight: 600, color: "var(--color-text-white)",
          flexShrink: 0,
        }}>
          {initials}
        </div>
        <div style={{ textAlign: "left", minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-strong)", lineHeight: "16px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</div>
          <div style={{ fontSize: 11, color: "var(--color-text-weak)", lineHeight: "14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayEmail}</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginLeft: 2 }}>
          <path d="M6 9l6 6 6-6" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          width: 220,
          background: "var(--color-fill-white)",
          borderRadius: "var(--radius-12)",
          border: "1px solid var(--color-stroke-medium)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
          zIndex: 300, overflow: "hidden",
        }}>
          {/* Identity header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "14px 16px",
            borderBottom: "1px solid var(--color-stroke-medium)",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "var(--color-fill-strong)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-family-body)",
              fontSize: 13, fontWeight: 600, color: "var(--color-text-white)",
              flexShrink: 0,
            }}>{initials}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-strong)", lineHeight: "16px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</div>
              <div style={{ fontSize: 11, color: "var(--color-text-weak)", lineHeight: "14px" }}>{displayEmail}</div>
            </div>
          </div>

          {/* Menu items */}
          {[
            { key: "profile",    label: "Your profile",      href: "/super-admin-profile"        },
            { key: "access",    label: "Access management",  href: "/access-management"         },
            { key: "settings",  label: "Settings",          href: "/super-admin-settings"      },
            { key: "privacy",   label: "Privacy Policy",     href: "https://parqlet-terms-and-privacy.notion.site/Privacy-Policy-35d38574a76480a0be27c1cac5735ebe" },
            { key: "terms",     label: "Terms of Service",  href: "https://parqlet-terms-and-privacy.notion.site/Terms-of-Service-35d38574a76480228d7bc194bc23c6de"  },
          ].map(({ key, label, href }) => {
            // Only the policy links leave the app. The three above them are
            // pages in this dashboard, and opening those in a new tab left a
            // trail of tabs behind - which now matters more, because the
            // sidebar no longer carries Profile or Access Management and
            // this menu is the only way in.
            const external = href.startsWith("http");
            return (
            <Link
              key={key}
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              style={{ textDecoration: "none", display: "block" }}
              onClick={() => setOpen(false)}>
              <div
                onMouseEnter={() => setHoveredItem(key)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  padding: "12px 16px",
                  background: hoveredItem === key ? "var(--color-gray-5)" : "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-family-body)",
                  fontSize: "var(--font-size-tiny)",
                  color: "var(--color-text-strong)",
                  transition: "background 0.12s",
                }}
              >
                {label}
              </div>
            </Link>
            );
          })}

          <div style={{ borderTop: "1px solid var(--color-stroke-medium)", margin: "4px 0" }} />

          <button
            onMouseEnter={() => setHoveredItem("signout")}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={() => { setOpen(false); void signOut(); }}
            style={{
              display: "block", width: "100%", padding: "12px 16px",
              background: hoveredItem === "signout" ? "var(--color-gray-5)" : "none",
              border: "none", cursor: "pointer", textAlign: "left",
              fontFamily: "var(--font-family-body)",
              fontSize: "var(--font-size-tiny)",
              color: "var(--color-fill-error)",
              transition: "background 0.12s",
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}