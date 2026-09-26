"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../components/auth/auth-provider";
import { usersApi } from "../../lib/api/users";
import { fmtFull } from "@/lib/dates";
import "../../tokens.css";


// ─── Icons ────────────────────────────────────────────────────────────────────

function IcUser({ color = "var(--color-icon-weak)" }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4.25" stroke={color} strokeWidth="1.5" />
      <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IcLock({ color = "var(--color-icon-weak)" }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="4.75" y="10.75" width="14.5" height="10.5" rx="1.25" stroke={color} strokeWidth="1.5" />
      <path d="M8 10.5V7a4 4 0 018 0v3.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="15.5" r="1.25" fill={color} />
      <path d="M12 16.75v2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IcCamera({ color = "var(--color-icon-weak)" }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="4" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function IcCheck({ color = "var(--color-icon-success)" }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M5 12l5 5L20 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcEye({ color = "var(--color-icon-weak)" }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M1 12C3.5 6 7.5 3 12 3s8.5 3 11 9c-2.5 6-6.5 9-11 9S3.5 18 1 12z" stroke={color} strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function IcEyeOff({ color = "var(--color-icon-weak)" }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-4.5 0-8.5-3-11-9a18.45 18.45 0 015.06-6.94M9.9 4.24A9.12 9.12 0 0112 4c4.5 0 8.5 3 11 9a18.5 18.5 0 01-2.16 3.19M3 3l18 18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionCard({
  icon, title, description, children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background: "var(--color-fill-white)",
      border: "1px solid var(--color-stroke-medium)",
      borderRadius: "var(--radius-12)",
      overflow: "hidden",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "var(--spacing-12)",
        padding: "var(--spacing-20) var(--spacing-24)",
        borderBottom: "1px solid var(--color-stroke-medium)",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "var(--radius-8)",
          background: "var(--color-gray-5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div>
          <div style={{
            fontSize: "var(--font-size-tiny)",
            fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
            color: "var(--color-text-strong)",
            fontFamily: "var(--font-family-body)",
            lineHeight: "var(--line-height-tiny)",
          }}>
            {title}
          </div>
          {description && (
            <div style={{
              fontSize: "var(--font-size-extra-tiny)",
              color: "var(--color-text-weak)",
              fontFamily: "var(--font-family-body)",
              lineHeight: "var(--line-height-extra-tiny)",
              marginTop: 2,
            }}>
              {description}
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "var(--spacing-24)" }}>
        {children}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "var(--font-size-extra-tiny)",
  fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
  color: "var(--color-text-strong)",
  fontFamily: "var(--font-family-body)",
  lineHeight: "var(--line-height-extra-tiny)",
  marginBottom: "var(--spacing-4)",
};

function FieldInput({
  label, value, onChange, placeholder, type = "text", hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%", boxSizing: "border-box",
          border: `1px solid ${focused ? "var(--color-stroke-strong)" : "var(--color-stroke-medium)"}`,
          borderRadius: "var(--radius-8)",
          padding: "12px var(--spacing-12)",
          fontFamily: "var(--font-family-body)",
          fontSize: "var(--font-size-tiny)",
          color: "var(--color-text-strong)",
          lineHeight: "var(--line-height-tiny)",
          fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
          background: "var(--color-fill-white)",
          outline: "none",
          transition: "border-color 0.12s",
        }}
      />
      {hint && (
        <span style={{
          display: "block", marginTop: "var(--spacing-4)",
          fontSize: "var(--font-size-extra-tiny)",
          color: "var(--color-text-weak)",
          fontFamily: "var(--font-family-body)",
          lineHeight: "var(--line-height-extra-tiny)",
        }}>
          {hint}
        </span>
      )}
    </div>
  );
}

function PasswordInput({
  label, value, onChange, placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow]       = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={show ? "" : (placeholder ?? "••••••••")}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%", boxSizing: "border-box",
            border: `1px solid ${focused ? "var(--color-stroke-strong)" : "var(--color-stroke-medium)"}`,
            borderRadius: "var(--radius-8)",
            padding: "12px var(--spacing-40) 12px var(--spacing-12)",
            fontFamily: "var(--font-family-body)",
            fontSize: "var(--font-size-tiny)",
            color: "var(--color-text-strong)",
            lineHeight: "var(--line-height-tiny)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            background: "var(--color-fill-white)",
            outline: "none",
            transition: "border-color 0.12s",
          }}
        />
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            style={{
              position: "absolute", right: 10, top: "50%",
              transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer",
              padding: 0, display: "flex", alignItems: "center",
            }}
          >
            {show ? <IcEyeOff /> : <IcEye />}
          </button>
        )}
      </div>
    </div>
  );
}

function ReadonlyField({
  label, value, note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{
        border: "1px solid var(--color-stroke-medium)",
        borderRadius: "var(--radius-8)",
        padding: "8px var(--spacing-12)",
        background: "var(--color-gray-15)",
        fontFamily: "var(--font-family-body)",
        fontSize: "var(--font-size-tiny)",
        color: "var(--color-text-weak)",
        lineHeight: "var(--line-height-tiny)",
      }}>
        {value}
      </div>
      {note && (
        <span style={{
          display: "block", marginTop: "var(--spacing-4)",
          fontSize: "var(--font-size-extra-tiny)",
          color: "var(--color-text-weak)",
          fontFamily: "var(--font-family-body)",
          lineHeight: "var(--line-height-extra-tiny)",
        }}>
          {note}
        </span>
      )}
    </div>
  );
}

function NeutralButton({
  children, onClick, disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: "var(--spacing-8)",
        background: disabled
          ? "var(--color-gray-60)"
          : hovered
          ? "var(--color-gray-90)"
          : "var(--color-fill-strong)",
        color: "var(--color-text-white)",
        border: "none", borderRadius: "var(--radius-8)",
        padding: "11px var(--spacing-16)",
        cursor: disabled ? "default" : "pointer",
        fontFamily: "var(--font-family-body)",
        fontSize: "var(--font-size-tiny)",
        fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
        lineHeight: "var(--line-height-tiny)",
        transition: "background 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

// ─── Password strength ────────────────────────────────────────────────────────

function passwordStrength(pw: string): { label: string; color: string; bars: number } {
  if (pw.length === 0) return { label: "",       color: "var(--color-stroke-medium)", bars: 0 };
  if (pw.length < 6)   return { label: "Weak",   color: "var(--color-fill-error)",   bars: 1 };
  if (pw.length < 10)  return { label: "Fair",   color: "var(--color-fill-warning)", bars: 2 };
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw))
                        return { label: "Strong", color: "var(--color-fill-success)", bars: 4 };
  return               { label: "Good",          color: "var(--color-accent-1000)",  bars: 3 };
}

function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const { label, color, bars } = passwordStrength(password);
  return (
    <div style={{ marginTop: "var(--spacing-8)" }}>
      <div style={{ display: "flex", gap: 4, marginBottom: "var(--spacing-4)" }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i <= bars ? color : "var(--color-stroke-medium)",
              transition: "background 0.2s",
            }}
          />
        ))}
      </div>
      <span style={{
        fontSize: "var(--font-size-extra-tiny)",
        color: "var(--color-text-weak)",
        fontFamily: "var(--font-family-body)",
        lineHeight: "var(--line-height-extra-tiny)",
      }}>
        Password strength: <strong style={{ color }}>{label}</strong>
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SuperAdminProfilePage() {
  const { user, loading: authLoading, refresh } = useAuth();

  const fileInputRef  = useRef<HTMLInputElement>(null);
  const [avatarUrl,   setAvatarUrl]   = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string>("");

  // Personal info state — seeded from auth user once loaded
  const [firstName,  setFirstName]  = useState("");
  const [lastName,   setLastName]   = useState("");
  const [phone,      setPhone]      = useState("");
  const [email,      setEmail]      = useState("");
  const [role,       setRole]       = useState("");
  const [memberSince, setMemberSince] = useState("");
  const [infoSaved,  setInfoSaved]  = useState(false);
  const [infoError,  setInfoError]  = useState("");

  // Password state
  const [currentPw,  setCurrentPw]  = useState("");
  const [newPw,      setNewPw]      = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");
  const [pwSaved,    setPwSaved]    = useState(false);
  const [pwError,    setPwError]    = useState("");

  // Toast
  const [toastMsg, setToastMsg] = useState("");

  // Seed form fields once auth user is available
  useEffect(() => {
    if (!user) return;
    const parts = (user.name ?? "").split(" ");
    setFirstName(parts[0] ?? "");
    setLastName(parts.slice(1).join(" "));
    setEmail(user.email ?? "");
    setPhone((user as any).phone ?? "");
    setRole(user.role ? formatRole(user.role) : "");
    if (user.createdAt) {
      setMemberSince(fmtFull(user.createdAt));
    }
  }, [user]);

  function formatRole(r: string): string {
    const labels: Record<string, string> = {
      super_admin: "Super Admin",
      hoa_admin:   "HOA Admin",
      building_manager: "Building Manager",
      security_staff:   "Security Staff",
      board_member:     "Board Member",
    };
    return labels[r] ?? r;
  }

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 5000);
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAvatarError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image must be under 5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  const infoChanged =
    firstName !== (user?.name?.split(" ")[0] ?? "") ||
    lastName  !== (user?.name?.split(" ").slice(1).join(" ") ?? "") ||
    phone !== ((user as any)?.phone ?? "");

  async function saveInfo() {
    if (!infoChanged) return;
    setInfoError("");
    try {
      await usersApi.updateProfile({ name: `${firstName} ${lastName}`.trim(), phone });
      setInfoSaved(true);
      setTimeout(() => setInfoSaved(false), 3000);
      void refresh();
      showToast("Profile information updated.");
    } catch (err: any) {
      setInfoError(err?.message ?? "Failed to save");
    }
  }

  const pwsMatch  = newPw === confirmPw && newPw.length > 0;
  const pwCanSave = currentPw.length > 0 && pwsMatch;

  async function savePassword() {
    if (!pwCanSave) return;
    setPwError("");
    try {
      await usersApi.updatePassword({ currentPassword: currentPw, newPassword: newPw });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 3000);
      showToast("Password updated successfully.");
    } catch (err: any) {
      setPwError(err?.message ?? "Failed to update password");
    }
  }

  const fieldGrid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "var(--spacing-16)",
  };

  if (authLoading) {
    return (
      <div style={{
        fontFamily: "var(--font-family-body)",
        padding: "var(--spacing-24)",
        display: "flex", flexDirection: "column",
        gap: "var(--spacing-24)",
        maxWidth: 880,
      }}>
        {[240, 400, 300].map((w, i) => (
          <div key={i} style={{
            height: i === 0 ? 80 : i === 1 ? 280 : 200,
            borderRadius: "var(--radius-12)",
            background: "var(--color-gray-5)",
            animation: "pulse 1.5s infinite",
          }} />
        ))}
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        fontFamily: "var(--font-family-body)",
        padding: "var(--spacing-24)",
        color: "var(--color-text-weak)",
      }}>
        Redirecting to sign-in...
      </div>
    );
  }

return (<>
    <style>{`
      .sap-two-col { display: flex; gap: var(--spacing-24); align-items: flex-start; }
      .sap-identity-card { width: 220px; flex-shrink: 0; }
      @media (max-width: 640px) {
        .sap-two-col { flex-direction: column; }
        .sap-identity-card { width: 100%; }
      }
    `}</style>
    <div style={{
        fontFamily: "var(--font-family-body)",
        padding: "var(--spacing-24)",
        display: "flex", flexDirection: "column",
        gap: "var(--spacing-24)",
        maxWidth: 880,
      }}>

        {/* ── Title ─────────────────────────────────────────────────────── */}
        <div>
          <h1 style={{
            margin: 0,
            fontSize: "var(--font-size-heading-1)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            lineHeight: "var(--line-height-heading-1)",
            color: "var(--color-text-strong)",
            fontFamily: "var(--font-family-heading)",
          }}>
            Your Profile
          </h1>
          <p style={{
            margin: "var(--spacing-8) 0 0",
            fontSize: "var(--font-size-body)",
            color: "var(--color-text-weak)",
            lineHeight: "var(--line-height-body)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
          }}>
            Manage your personal information and account settings
          </p>
        </div>

        {/* ── Two-column layout ──────────────────────────────────────────── */}
        <div className="sap-two-col">

          {/* Left: identity card */}
          <div className="sap-identity-card" style={{
            background: "var(--color-fill-white)",
            border: "1px solid var(--color-stroke-medium)",
            borderRadius: "var(--radius-12)",
            padding: "var(--spacing-24)",
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: "var(--spacing-16)",
            textAlign: "center",
          }}>
            {/* Avatar */}
            <div style={{ position: "relative", display: "inline-block" }}>
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                background: "var(--color-fill-weak)",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden",
              }}>
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile photo"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{
                    fontSize: "var(--font-size-heading-2)",
                    fontFamily: "var(--font-family-heading)",
                    fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                    color: "var(--color-text-strong)",
                    lineHeight: 1,
                  }}>
                    {initials}
                  </span>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: "none" }}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: "absolute", bottom: 0, right: 0,
                  width: 26, height: 26, borderRadius: "50%",
                  background: "var(--color-fill-weak)",
                  border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-gray-20)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-fill-weak)"; }}
              >
                <IcCamera color="var(--color-fill-white)" />
              </button>
            </div>

            {/* Name + email */}
            <div style={{ width: "100%", minWidth: 0 }}>
              <div style={{
                fontSize: "var(--font-size-tiny)",
                fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                color: "var(--color-text-strong)",
                lineHeight: "var(--line-height-tiny)",
                fontFamily: "var(--font-family-body)",
                overflowWrap: "anywhere",
              }}>
                {firstName} {lastName}
              </div>
              <div style={{
                marginTop: "var(--spacing-4)",
                fontSize: "var(--font-size-extra-tiny)",
                color: "var(--color-text-weak)",
                lineHeight: "var(--line-height-extra-tiny)",
                fontFamily: "var(--font-family-body)",
                overflowWrap: "anywhere",
              }}>
                {email}
              </div>
            </div>

            {/* Role badge */}
            <div style={{
              display: "inline-flex", alignItems: "center",
              background: "var(--color-fill-weak)",
              borderRadius: "var(--radius-48)",
              padding: "var(--spacing-4) var(--spacing-8)",
            }}>
              <span style={{
                fontSize: "var(--font-size-extra-tiny)",
                fontFamily: "var(--font-family-body)",
                fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                color: "var(--color-text-strong)",
                lineHeight: "var(--line-height-extra-tiny)",
              }}>
                {role}
              </span>
            </div>

            {/* Divider */}
            <div style={{ width: "100%", height: 1, background: "var(--color-stroke-medium)" }} />

            {/* Meta */}
            <div style={{ width: "100%", textAlign: "left" }}>
              <div style={{ marginBottom: "var(--spacing-12)" }}>
                <div style={{
                  fontSize: "var(--font-size-extra-tiny)",
                  color: "var(--color-text-weak)",
                  fontFamily: "var(--font-family-body)",
                  lineHeight: "var(--line-height-extra-tiny)",
                  marginBottom: 2,
                }}>
                  Member since
                </div>
                <div style={{
                  fontSize: "var(--font-size-extra-tiny)",
                  fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                  color: "var(--color-text-strong)",
                  fontFamily: "var(--font-family-body)",
                  lineHeight: "var(--line-height-extra-tiny)",
                }}>
                  {memberSince}
                </div>
              </div>
            </div>
          </div>

          {/* Right: form cards */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "var(--spacing-16)" }}>

            {/* ── Personal Information ───────────────────────────────────── */}
            <SectionCard
              icon={<IcUser />}
              title="Personal Information"
              description="Update your name and contact details"
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-16)" }}>
                <div style={fieldGrid}>
                  <FieldInput
                    label="First name"
                    value={firstName}
                    onChange={setFirstName}
                    placeholder="First name"
                  />
                  <FieldInput
                    label="Last name"
                    value={lastName}
                    onChange={setLastName}
                    placeholder="Last name"
                  />
                </div>
                <ReadonlyField
                  label="Email address"
                  value={email}
                  note="Email is tied to your Parqlet account and cannot be changed here."
                />
                <FieldInput
                  label="Phone number"
                  value={phone}
                  onChange={setPhone}
                  placeholder="+1 (512) 555-0000"
                  hint="Used for internal notifications only."
                />
                <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-12)", marginTop: "var(--spacing-4)" }}>
                  <NeutralButton onClick={saveInfo} disabled={!infoChanged}>
                    Save Changes
                  </NeutralButton>
                  {infoSaved && (
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-4)" }}>
                      <IcCheck />
                      <span style={{
                        fontSize: "var(--font-size-extra-tiny)",
                        color: "var(--color-fill-success)",
                        fontFamily: "var(--font-family-body)",
                        lineHeight: "var(--line-height-extra-tiny)",
                      }}>
                        Saved
                      </span>
                    </div>
                  )}
                </div>
                {infoError && (
                  <span style={{
                    fontSize: "var(--font-size-extra-tiny)",
                    color: "var(--color-text-error)",
                    fontFamily: "var(--font-family-body)",
                  }}>
                    {infoError}
                  </span>
                )}
              </div>
            </SectionCard>

            {/* ── Change Password ────────────────────────────────────────── */}
            <SectionCard
              icon={<IcLock />}
              title="Change Password"
              description="Use a strong password with letters, numbers, and symbols"
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-16)" }}>
                <PasswordInput
                  label="Current password"
                  value={currentPw}
                  onChange={setCurrentPw}
                />
                <PasswordInput
                  label="New password"
                  value={newPw}
                  onChange={setNewPw}
                  placeholder="Enter new password"
                />
                {newPw.length > 0 && <PasswordStrengthMeter password={newPw} />}
                <PasswordInput
                  label="Confirm new password"
                  value={confirmPw}
                  onChange={setConfirmPw}
                  placeholder="Re-enter new password"
                />
                {confirmPw.length > 0 && newPw.length > 0 && !pwsMatch && (
                  <span style={{
                    fontSize: "var(--font-size-extra-tiny)",
                    color: "var(--color-text-error)",
                    fontFamily: "var(--font-family-body)",
                    lineHeight: "var(--line-height-extra-tiny)",
                    marginTop: "calc(-1 * var(--spacing-8))",
                  }}>
                    Passwords don&apos;t match.
                  </span>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-12)", marginTop: "var(--spacing-4)" }}>
                  <NeutralButton onClick={savePassword} disabled={!pwCanSave}>
                    Update Password
                  </NeutralButton>
                  {pwSaved && (
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-4)" }}>
                      <IcCheck />
                      <span style={{
                        fontSize: "var(--font-size-extra-tiny)",
                        color: "var(--color-fill-success)",
                        fontFamily: "var(--font-family-body)",
                        lineHeight: "var(--line-height-extra-tiny)",
                      }}>
                        Password updated
                      </span>
                    </div>
                  )}
                </div>
                {pwError && (
                  <span style={{
                    fontSize: "var(--font-size-extra-tiny)",
                    color: "var(--color-text-error)",
                    fontFamily: "var(--font-family-body)",
                  }}>
                    {pwError}
                  </span>
                )}
              </div>
            </SectionCard>

          </div>
        </div>
      </div>

      {/* Toast */}
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
}
