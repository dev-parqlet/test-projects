"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { authKeys } from "../components/auth/auth-provider";

function IcEyeToggle({ off }: { off: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M10 12C10 12.5304 10.2107 13.0391 10.5858 13.4142C10.9609 13.7893 11.4696 14 12 14C12.5304 14 13.0391 13.7893 13.4142 13.4142C13.7893 13.0391 14 12.5304 14 12C14 11.4696 13.7893 10.9609 13.4142 10.5858C13.0391 10.2107 12.5304 10 12 10C11.4696 10 10.9609 10.2107 10.5858 10.5858C10.2107 10.9609 10 11.4696 10 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12C18.6 16 15.6 18 12 18C8.4 18 5.4 16 3 12C5.4 8 8.4 6 12 6C15.6 6 18.6 8 21 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {off && <path d="M4 4L20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />}
    </svg>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}) {
  const [focused, setFocused] = React.useState(false);
  const [reveal, setReveal] = React.useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
      <label style={{
        fontFamily: "var(--font-family-body)",
        fontSize: "var(--font-size-tiny)",
        lineHeight: "var(--line-height-tiny)",
        fontWeight: "var(--font-weight-regular)",
        color: "var(--color-text-weak)",
      }}>
        {label}
      </label>
      <div style={{ position: "relative", display: "flex" }}>
        <input
          type={reveal ? "text" : "password"}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          style={{
            width: "100%",
            boxSizing: "border-box" as React.CSSProperties["boxSizing"],
            border: `1px solid ${focused ? "var(--color-stroke-strong)" : "var(--color-stroke-medium)"}`,
            borderRadius: "var(--radius-8)",
            padding: "12px 44px 12px var(--spacing-12)",
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
        <button
          type="button"
          onClick={() => setReveal((v) => !v)}
          aria-label={reveal ? "Hide password" : "Show password"}
          aria-pressed={reveal}
          style={{
            position: "absolute",
            right: "var(--spacing-12)",
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            color: "var(--color-text-weak)",
            transition: "color 0.12s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-text-strong)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-weak)"; }}
        >
          <IcEyeToggle off={reveal} />
        </button>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [token, setToken] = React.useState<string | null>(null);
  const [tokenReady, setTokenReady] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Read ?token from URL on mount — same approach used by sign-in for callbackUrl.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    setToken(t && t.length >= 32 ? t : null);
    setTokenReady(true);
  }, []);

  const canSubmit =
    tokenReady &&
    !!token &&
    password.length >= 8 &&
    password === confirmPassword &&
    !loading;

  const handleSubmit = async () => {
    if (!canSubmit || !token) return;
    setLoading(true);
    setError(null);

    try {
      // Hit the local /api/auth/reset-password route (relative) so the Next.js
      // proxy dispatches via handleRequest — handles mock vs proxy mode
      // automatically and keeps cookies same-origin regardless of how
      // NEXT_PUBLIC_API_URL is set.
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = (await res.json().catch(() => null)) as {
        success?: boolean;
        error?: { message?: string };
      } | null;

      if (!res.ok) {
        throw new Error(data?.error?.message ?? "Failed to reset password");
      }

      // Backend deletes all sessions for the user (parqlet-backend/src/routes/auth.ts
      // tx: clears sessions table inside the reset tx), so any existing cookie is
      // now stale. Clear the cached /api/auth/me entry directly — calling
      // useAuth().signOut() would fire a fetch to /api/auth/sign-out which has no
      // local proxy route and fails with "Failed to fetch" in dev.
      queryClient.setQueryData(authKeys.me, null);
      window.location.href = "/sign-in?reset=success";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "var(--color-fill-weak)",
      fontFamily: "var(--font-family-body)",
      display: "flex",
      justifyContent: "center",
    }}>
      <style>{`
        @keyframes ambientA {
          from { opacity: 1;    transform: translate(0px,   0px);   }
          to   { opacity: 0.04; transform: translate(-18px, -14px); }
        }
        @keyframes ambientB {
          from { opacity: 0.04; transform: translate(0px,  18px);  }
          to   { opacity: 1;    transform: translate(-12px, -10px); }
        }
        .reset-pwd-btn:hover {
          background-color: var(--color-accent-1200) !important;
        }
        @media (max-width: 768px) {
          .reset-pwd-right-panel { display: none !important; }
          .reset-pwd-left-col { padding: var(--spacing-24) var(--spacing-16) !important; }
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 1440, display: "flex", alignItems: "stretch" }}>

        {/* Left column */}
        <div className="reset-pwd-left-col" style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "var(--spacing-48) var(--spacing-56)",
          minWidth: 0,
        }}>
          <div>
            <a href="https://parqlet.com" target="_blank" rel="noopener noreferrer">
              <img
                src="/onboarding/logo-dark.svg"
                alt="Parqlet"
                style={{ display: "block", height: 26, width: "auto", alignSelf: "flex-start", filter: "var(--logo-dark-filter)" }}
              />
            </a>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 420 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-32)" }}>

              <h1 style={{
                margin: 0,
                fontSize: "var(--font-size-heading-1)",
                lineHeight: "var(--line-height-heading-1)",
                fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                color: "var(--color-text-strong)",
                fontFamily: "var(--font-family-heading)",
              }}>
                Reset your password
              </h1>

              {!tokenReady ? (
                <p style={{ margin: 0, fontSize: "var(--font-size-body)", lineHeight: "var(--line-height-body)", color: "var(--color-text-weak)" }}>
                  Loading…
                </p>
              ) : !token ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-16)" }}>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--color-fill-error, #dc2626)" }}>
                    Invalid or expired reset link.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push("/sign-in")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 56,
                      padding: "0 var(--spacing-16)",
                      backgroundColor: "var(--color-button-primary)",
                      border: "none",
                      borderRadius: "var(--radius-8)",
                      cursor: "pointer",
                      fontFamily: "var(--font-family-body)",
                      fontSize: "var(--font-size-heading-3)",
                      lineHeight: "var(--line-height-heading-3)",
                      fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                      // Fixed brand color, doesn't invert in dark mode — keep text dark.
                      color: "#222222",
                      transition: "background-color 0.12s",
                      width: "100%",
                    }}
                  >
                    Back to sign in
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                  }}
                  style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-16)" }}
                >
                  <p style={{ margin: 0, fontSize: "var(--font-size-tiny)", lineHeight: "var(--line-height-tiny)", color: "var(--color-text-weak)" }}>
                    Choose a new password for your account. It must be at least 8 characters.
                  </p>

                  <PasswordField
                    label="New password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }}
                    disabled={loading}
                  />

                  <PasswordField
                    label="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); if (error) setError(null); }}
                    disabled={loading}
                  />

                  {confirmPassword.length > 0 && password !== confirmPassword && (
                    <p style={{ margin: 0, fontSize: 13, color: "var(--color-fill-error, #dc2626)" }}>
                      Passwords do not match.
                    </p>
                  )}

                  {error && (
                    <p style={{ margin: 0, fontSize: 13, color: "var(--color-fill-error, #dc2626)" }}>
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    className={canSubmit ? "reset-pwd-btn" : ""}
                    disabled={!canSubmit}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 56,
                      padding: "0 var(--spacing-16)",
                      backgroundColor: canSubmit ? "var(--color-button-primary)" : "var(--color-accent-800)",
                      border: "none",
                      borderRadius: "var(--radius-8)",
                      cursor: canSubmit ? "pointer" : "not-allowed",
                      fontFamily: "var(--font-family-body)",
                      fontSize: "var(--font-size-heading-3)",
                      lineHeight: "var(--line-height-heading-3)",
                      fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                      // canSubmit branch sits on the fixed brand green — keep it dark; doesn't invert in dark mode.
                      color: canSubmit ? "#222222" : "var(--color-text-disabled)",
                      transition: "background-color 0.12s",
                      width: "100%",
                    }}
                  >
                    {loading ? "Resetting..." : "Reset password"}
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/sign-in")}
                    style={{
                      alignSelf: "center",
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      fontFamily: "var(--font-family-body)",
                      fontSize: "var(--font-size-tiny)",
                      lineHeight: "var(--line-height-tiny)",
                      color: "var(--color-text-link)",
                      textDecoration: "underline",
                      textUnderlineOffset: 2,
                    }}
                  >
                    Back to sign in
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Right column — dark panel (visual parity with /sign-in) */}
        <div className="reset-pwd-right-panel" style={{
          width: 664,
          flexShrink: 0,
          padding: "var(--spacing-48)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            position: "relative",
            width: "100%",
            height: "100%",
            borderRadius: "var(--radius-20)",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--color-fill-strong)",
          }}>
            {/* Square grid */}
            <div style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
              `,
              backgroundSize: "32px 32px",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
              maskImage: "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
            }} />

            {/* Color glows */}
            <div style={{
              position: "absolute",
              inset: 0,
              background: `
                radial-gradient(ellipse 90% 70% at 0% 100%, #B8C231 0%, transparent 65%),
                radial-gradient(ellipse 90% 70% at 100% 0%, #EA7D0B 0%, transparent 65%)
              `,
              mixBlendMode: "screen",
              opacity: 0.9,
            }} />

            {/* Radial dark base */}
            <div style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(20,20,20,1) 30%, rgba(20,20,20,0.68) 100%)",
            }} />

            {/* Ambient layers */}
            <div style={{
              position: "absolute",
              inset: 0,
              filter: "blur(40px)",
              background: `
                radial-gradient(ellipse 130% 110% at 112% -8%, rgba(20,20,20,0.95) 0%, transparent 58%),
                radial-gradient(ellipse 130% 110% at -12% 108%, rgba(20,20,20,0.95) 0%, transparent 58%)
              `,
              animation: "ambientA 18s ease-in-out infinite alternate",
            }} />
            <div style={{
              position: "absolute",
              inset: 0,
              filter: "blur(40px)",
              background: `
                radial-gradient(ellipse 130% 110% at -12% -8%, rgba(20,20,20,0.95) 0%, transparent 58%),
                radial-gradient(ellipse 130% 110% at 112% 108%, rgba(20,20,20,0.95) 0%, transparent 58%)
              `,
              animation: "ambientB 22s ease-in-out infinite alternate",
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
