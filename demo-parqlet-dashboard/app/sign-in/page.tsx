"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { defaultLandingFor, readCallbackUrl } from "../lib/callback-url";
import { useAuth } from "../components/auth/auth-provider";

/**
 * Resolve an existing session from dev localStorage (localhost) or by calling
 * /api/auth/me (cookie session). Returns null when there's no session. Lives
 * outside the component so it can also be reused by the AuthProvider if we
 * ever decide to fold it in.
 */
async function readExistingSession(): Promise<{ role: string } | null> {
  if (typeof window === "undefined") return null;

  // Refuse to look for a session immediately after sign-out. The sign-out
  // button stashes a timestamp in sessionStorage; honour it for a short
  // window so a slow or failed /api/auth/sign-out response can't let
  // readExistingSession see the still-valid cookie and bounce the user
  // straight back to /dashboard. The user can still sign in manually by
  // submitting the form — we only suppress the auto-redirect.
  if (wasJustSignedOut()) return null;

  // DEMO: the dev-switcher localStorage short-circuit that used to live here
  // is gone along with the switcher itself. Leaving it would let a
  // `dev_mock_user` key stored on a previous visit - possibly a super admin -
  // resurrect a session this build has no route for.

  // Cookie session: fetch /api/auth/me directly. AuthProvider's meQuery is
  // disabled on /sign-in (intentional — it loops with the sign-in submit
  // path), so we have to ask the backend ourselves.
  try {
    const res = await fetch(
      (process.env.NEXT_PUBLIC_API_URL ?? "https://api.parqlet.com") + "/api/auth/me",
      { credentials: "include", cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { role?: string } | { user?: { role?: string } };
    let role: string | undefined;
    if ("user" in data && data.user) {
      role = data.user.role;
    } else if ("role" in data) {
      role = data.role;
    }
    return role ? { role } : null;
  } catch {
    return null;
  }
}

// AuthProvider's signOut onSettled stamps sessionStorage with the sign-out
// time. This window is the grace period during which the sign-in page
// refuses to auto-redirect — long enough to outlast a slow /api/auth/sign-out
// round trip + a hard navigation, short enough that a user who changes their
// mind and wants to sign in as a different identity isn't stuck on the
// sign-in form.
const POST_SIGNOUT_GRACE_MS = 5_000;

function wasJustSignedOut(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stamped = window.sessionStorage.getItem("parqlet_signed_out_at");
    if (!stamped) return false;
    const at = Number(stamped);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at < POST_SIGNOUT_GRACE_MS;
  } catch {
    return false;
  }
}

function IcOrganized() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L4 6L12 10L20 6L12 2Z" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 10L12 14L20 10" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 18L12 22L20 18" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 14L12 18L20 14" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcEye() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M10 12C10 12.5304 10.2107 13.0391 10.5858 13.4142C10.9609 13.7893 11.4696 14 12 14C12.5304 14 13.0391 13.7893 13.4142 13.4142C13.7893 13.0391 14 12.5304 14 12C14 11.4696 13.7893 10.9609 13.4142 10.5858C13.0391 10.2107 12.5304 10 12 10C11.4696 10 10.9609 10.2107 10.5858 10.5858C10.2107 10.9609 10 11.4696 10 12Z" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12C18.6 16 15.6 18 12 18C8.4 18 5.4 16 3 12C5.4 8 8.4 6 12 6C15.6 6 18.6 8 21 12Z" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcPrivate() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M11.5 21H7C6.46957 21 5.96086 20.7893 5.58579 20.4142C5.21071 20.0391 5 19.5304 5 19V13C5 12.4696 5.21071 11.9609 5.58579 11.5858C5.96086 11.2107 6.46957 11 7 11H17C17.5304 11 18.0391 11.2107 18.4142 11.5858C18.7893 11.9609 19 12.4696 19 13V13.5" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 16C11 16.2652 11.1054 16.5196 11.2929 16.7071C11.4804 16.8946 11.7348 17 12 17C12.2652 17 12.5196 16.8946 12.7071 16.7071C12.8946 16.5196 13 16.2652 13 16C13 15.7348 12.8946 15.4804 12.7071 15.2929C12.5196 15.1054 12.2652 15 12 15C11.7348 15 11.4804 15.1054 11.2929 15.2929C11.1054 15.4804 11 15.7348 11 16Z" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 11V7C8 5.93913 8.42143 4.92172 9.17157 4.17157C9.92172 3.42143 10.9391 3 12 3C13.0609 3 14.0783 3.42143 14.8284 4.17157C15.5786 4.92172 16 5.93913 16 7V11" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 19L17 21L21 17" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FeatureItem({ icon, label, sublabel }: { icon: React.ReactNode; label: string; sublabel: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--spacing-8)", width: 110 }}>
      <div style={{ width: 24, height: 24, flexShrink: 0 }}>{icon}</div>
      <p style={{ margin: 0, fontFamily: "var(--font-family-body)", textAlign: "center", color: "var(--color-text-white)" }}>
        <span style={{ display: "block", fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-medium)", lineHeight: "var(--line-height-tiny)" }}>{label}</span>
        <span style={{ display: "block", fontSize: "var(--font-size-extra-tiny)", fontWeight: "var(--font-weight-regular)", lineHeight: "var(--line-height-extra-tiny)" }}>{sublabel}</span>
      </p>
    </div>
  );
}

function IcEyeToggle({ off }: { off: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M10 12C10 12.5304 10.2107 13.0391 10.5858 13.4142C10.9609 13.7893 11.4696 14 12 14C12.5304 14 13.0391 13.7893 13.4142 13.4142C13.7893 13.0391 14 12.5304 14 12C14 11.4696 13.7893 10.9609 13.4142 10.5858C13.0391 10.2107 12.5304 10 12 10C11.4696 10 10.9609 10.2107 10.5858 10.5858C10.2107 10.9609 10 11.4696 10 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12C18.6 16 15.6 18 12 18C8.4 18 5.4 16 3 12C5.4 8 8.4 6 12 6C15.6 6 18.6 8 21 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {off && <path d="M4 4L20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />}
    </svg>
  );
}

function FormField({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [focused, setFocused] = React.useState(false);
  const [reveal, setReveal] = React.useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && reveal ? "text" : type;
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
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            boxSizing: "border-box" as React.CSSProperties["boxSizing"],
            border: `1px solid ${focused ? "var(--color-stroke-strong)" : "var(--color-stroke-medium)"}`,
            borderRadius: "var(--radius-8)",
            padding: isPassword ? "12px 44px 12px var(--spacing-12)" : "12px var(--spacing-12)",
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
        {isPassword && (
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
        )}
      </div>
    </div>
  );
}

function DocumentModal({ title, onClose }: { title: string; onClose: () => void }) {
  const isPrivacy = title === "Privacy Policy";
  const sections = isPrivacy ? [
    { heading: "Information We Collect", body: "We collect information you provide directly to us when you create an account, use our services, or communicate with us. This includes your name, email address, unit number, parking spot details, and any other information you choose to provide." },
    { heading: "How We Use Your Information", body: "We use the information we collect to operate, maintain, and improve our services, process bookings and credit transactions, send you technical notices and administrative messages, and respond to your comments and questions." },
    { heading: "Information Sharing", body: "We do not share your personal information with third parties except as described in this policy. We may share information with vendors and service providers who assist in our operations, when required by law, or to protect the rights and safety of our users." },
    { heading: "Data Retention", body: "We retain personal information for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required or permitted by law. Booking records and consent logs are retained for a minimum of 36 months for HOA audit compliance." },
    { heading: "Security", body: "We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. All data is encrypted in transit and at rest using industry-standard protocols." },
    { heading: "Cookies and Tracking", body: "We use cookies and similar tracking technologies to track activity on our platform and hold certain information. You can instruct your browser to refuse all cookies or indicate when a cookie is being sent." },
    { heading: "Your Rights", body: "You have the right to access, update, or delete the information we hold about you. You may also object to processing, request restriction, or request portability of your data. Contact your HOA administrator to exercise these rights." },
    { heading: "Changes to This Policy", body: "We may update this Privacy Policy from time to time. We will notify you of any changes by updating the date at the top of this policy and, where appropriate, notifying you by email." },
    { heading: "Contact Us", body: "If you have any questions about this Privacy Policy, please contact your building's HOA administrator or reach out to the Parqlet support team through the platform." },
  ] : [
    { heading: "Acceptance of Terms", body: "By accessing or using the Parqlet platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform. Your continued use constitutes acceptance of any updates." },
    { heading: "Eligibility", body: "You must be a verified resident of a Parqlet-enabled building to create an account. Your email address must be registered in the HOA's resident database. Parqlet reserves the right to verify eligibility at any time." },
    { heading: "Platform Use", body: "You agree to use the platform only for lawful purposes and in accordance with these Terms. You may not use the platform in any way that violates applicable law, infringes the rights of others, or interferes with the proper functioning of the service." },
    { heading: "Credit Economy", body: "Credits are non-transferable, building-specific, and have no cash value. Parqlet reserves the right to modify the credit system at any time with reasonable notice. Credits may not be sold, traded, or transferred between accounts." },
    { heading: "Booking Obligations", body: "Residents who book guest parking spots are responsible for their guests' conduct. By confirming a booking, you accept financial responsibility for any damages or violations caused by your guest, as disclosed in the Guest Liability Consent modal." },
    { heading: "Spot Sharing", body: "Spot sharing is voluntary. By listing your spot, you agree to make it available during the specified windows. Parqlet does not guarantee bookings or credit earnings. Spot owners must ensure their spot is free during shared windows." },
    { heading: "Limitation of Liability", body: "To the fullest extent permitted by law, Parqlet shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the platform or any booking-related dispute between residents." },
    { heading: "Termination", body: "Parqlet may terminate or suspend your account at any time, with or without cause, with or without notice. Upon termination, your right to use the platform will immediately cease and any unused credits will be forfeited." },
    { heading: "Governing Law", body: "These Terms shall be governed by and construed in accordance with the laws of the State of Texas, without regard to its conflict of law provisions." },
  ];

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--spacing-24)" }}
    >
      <div style={{ background: "var(--color-fill-white)", borderRadius: "var(--radius-24)", width: "100%", maxWidth: 600, boxSizing: "border-box" as React.CSSProperties["boxSizing"], maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "var(--font-family-body)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 28px 20px", borderBottom: "1px solid var(--color-stroke-medium)", flexShrink: 0 }}>
          <span style={{ fontSize: "var(--font-size-body)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--color-text-strong)", lineHeight: "var(--line-height-body)" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", color: "var(--color-icon-strong)" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
          {sections.map((s) => (
            <div key={s.heading} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--color-text-strong)", lineHeight: "var(--line-height-tiny)" }}>{s.heading}</span>
              <span style={{ fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], color: "var(--color-text-weak)", lineHeight: "var(--line-height-tiny)" }}>{s.body}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [docModal, setDocModal] = React.useState<"Privacy Policy" | "Terms of Service" | null>(null);
  const [forgotOpen, setForgotOpen] = React.useState(false);
  const [forgotEmail, setForgotEmail] = React.useState("");
  const [forgotSent, setForgotSent] = React.useState(false);
  const [forgotLoading, setForgotLoading] = React.useState(false);
  const [forgotError, setForgotError] = React.useState<string | null>(null);

  // Auto-redirect when a session already exists — either a real cookie session
  // or a dev mock user from DevAuthSwitcher. This fires when an authenticated
  // user lands on /sign-in at all, most often because a guard bounced them here
  // before the session resolved, so it MUST honor ?callbackUrl=; sending them
  // to the role default instead silently drops the page they asked for.
  //
  // AuthProvider's meQuery is intentionally disabled on /sign-in (it loops with
  // the submit flow), so we check the session ourselves. `useAuth()` still
  // handles the in-process cache so we don't double-fetch when the user just
  // signed in and the cache already has them.
  const { user, loading: authLoading } = useAuth();
  React.useEffect(() => {
    if (authLoading || !user) return;
    // Same post-signout guard as Effect 2 below — if the user just signed out
    // we must not auto-redirect even if a cached `user` is briefly still in
    // the React Query cache from before the sign-out, or the
    // /sign-in?callbackUrl=… <-> /dashboard loop restarts.
    if (wasJustSignedOut()) return;
    router.replace(readCallbackUrl() ?? defaultLandingFor(user.role));
  }, [user, authLoading, router]);

  React.useEffect(() => {
    let cancelled = false;
    // The AuthProvider may already have a cached user (e.g. just signed in).
    // Skip the network call so we don't race the cache write.
    readExistingSession().then((session) => {
      if (cancelled || !session) return;
      router.replace(readCallbackUrl() ?? defaultLandingFor(session.role));
    });
    return () => {
      cancelled = true;
    };
    // Read once on mount — a fresh sign-in redirect will re-render the page
    // (router.replace), so we don't need to react to user changes here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSignIn = email.trim().length > 0 && password.trim().length > 0 && !loading;

  const handleSignIn = async () => {
    if (!canSignIn) return;
    setLoading(true);
    setError(null);

    try {
      const BACKEND_URL =
        typeof window !== "undefined"
          ? (process.env.NEXT_PUBLIC_API_URL ?? "https://api.parqlet.com")
          : "https://api.parqlet.com";

      const res = await fetch(`${BACKEND_URL}/api/auth/sign-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password: password.trim() }),
      });

      const data = await res.json() as {
        error?: { message?: string };
        user?: { role?: string };
      };

      if (!res.ok) {
        throw new Error(data?.error?.message ?? "Invalid email or password");
      }

      // Role is returned directly from sign-in — navigate immediately, no second /api/auth/me needed.
      // Honor the requested callbackUrl when one is present; fall back to the
      // role's default landing page only when no callback was supplied. This
      // lets a super_admin follow a link to /bookings (or any other page)
      // instead of being silently funneled to /super-admin.
      const redirectTo = readCallbackUrl() ?? defaultLandingFor(data?.user?.role);

      // Session cookie is now set by the backend — hard redirect so the browser
      // sends the cookie on the very first /api/auth/me request from AuthProvider.
      // router.push() is a soft nav and can miss the cookie on the first request,
      // causing an infinite Loading... spinner until a manual page reload fixes it.
      window.location.href = redirectTo;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const canForgot = forgotEmail.trim().length > 0 && !forgotLoading;

  const handleForgotSubmit = async () => {
    if (!canForgot) return;
    setForgotLoading(true);
    setForgotError(null);

    try {
      // Hit the local /api/auth/forgot-password route (relative) so the Next.js
      // proxy dispatches via handleRequest — handles mock vs proxy mode
      // automatically and keeps cookies same-origin regardless of how
      // NEXT_PUBLIC_API_URL is set.
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });

      const data = (await res.json().catch(() => null)) as {
        success?: boolean;
        operationCode?: "delivered" | "bounced" | "rate_limited";
        error?: { message?: string };
      } | null;

      // Backend always returns 200 with `{ operationCode }` to prevent account
      // enumeration, so any non-2xx is a genuine failure.
      if (!res.ok) {
        throw new Error(data?.error?.message ?? "Failed to send reset link");
      }

      // Rate-limited requests return 200 too — show a distinct message instead
      // of the misleading "Check your inbox" so a throttled user isn't told an
      // email is on the way when none will be sent.
      if (data?.operationCode === "rate_limited") {
        setForgotError("Too many reset attempts for this email. Please wait a few minutes and try again.");
        return;
      }

      setForgotSent(true);
    } catch (err: unknown) {
      setForgotError(err instanceof Error ? err.message : "Failed to send reset link");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <>
    {docModal && <DocumentModal title={docModal} onClose={() => setDocModal(null)} />}
    {forgotOpen && (
      <div
        onClick={(e) => { if (e.target === e.currentTarget) setForgotOpen(false); }}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--spacing-24)" }}
      >
        <div style={{ background: "var(--color-fill-white)", borderRadius: "var(--radius-24)", width: "100%", maxWidth: 480, boxSizing: "border-box" as React.CSSProperties["boxSizing"], fontFamily: "var(--font-family-body)", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 28px 20px", borderBottom: "1px solid var(--color-stroke-medium)" }}>
            <span style={{ fontSize: "var(--font-size-body)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--color-text-strong)", lineHeight: "var(--line-height-body)" }}>
              Reset password
            </span>
            <button onClick={() => setForgotOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", color: "var(--color-icon-strong)" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
          </div>
          {/* Body */}
          <div style={{ padding: "24px 28px 28px", display: "flex", flexDirection: "column", gap: "var(--spacing-16)" }}>
            {forgotSent ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
                <p style={{ margin: 0, fontSize: "var(--font-size-tiny)", lineHeight: "var(--line-height-tiny)", color: "var(--color-text-strong)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"] }}>
                  Check your inbox
                </p>
                <p style={{ margin: 0, fontSize: "var(--font-size-tiny)", lineHeight: "var(--line-height-tiny)", color: "var(--color-text-weak)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], overflowWrap: "break-word", wordBreak: "break-word" }}>
                  If <strong>{forgotEmail}</strong> is registered, you'll receive a password reset link shortly.
                </p>
                <button
                  onClick={() => setForgotOpen(false)}
                  style={{
                    marginTop: "var(--spacing-8)",
                    background: "var(--color-button-neutral)", color: "var(--color-text-white)", border: "none",
                    borderRadius: "var(--radius-8)", height: 42, padding: "0 var(--spacing-16)",
                    fontSize: "var(--font-size-body)", lineHeight: "var(--line-height-body)",
                    fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                    fontFamily: "var(--font-family-body)", cursor: "pointer",
                    alignSelf: "flex-start", transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-gray-90)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-button-neutral)"; }}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <p style={{ margin: 0, fontSize: "var(--font-size-tiny)", lineHeight: "var(--line-height-tiny)", color: "var(--color-text-weak)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"] }}>
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
                  <label style={{ fontSize: "var(--font-size-tiny)", lineHeight: "var(--line-height-tiny)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], color: "var(--color-text-weak)" }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => { setForgotEmail(e.target.value); if (forgotError) setForgotError(null); }}
                    placeholder="you@example.com"
                    disabled={forgotLoading}
                    style={{
                      width: "100%", boxSizing: "border-box" as React.CSSProperties["boxSizing"],
                      border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-8)",
                      padding: "12px var(--spacing-12)", fontFamily: "var(--font-family-body)",
                      fontSize: "var(--font-size-tiny)", lineHeight: "var(--line-height-tiny)",
                      color: "var(--color-text-strong)", background: "var(--color-fill-white)", outline: "none",
                    }}
                  />
                </div>
                {forgotError && (
                  <p style={{ margin: 0, fontSize: 13, color: "var(--color-fill-error, #dc2626)" }}>
                    {forgotError}
                  </p>
                )}
                <button
                  onClick={handleForgotSubmit}
                  disabled={!canForgot}
                  style={{
                    background: canForgot ? "var(--color-button-neutral)" : "var(--color-gray-60)",
                    color: "var(--color-text-white)", border: "none", borderRadius: "var(--radius-8)",
                    height: 42, padding: "0 var(--spacing-16)",
                    fontSize: "var(--font-size-body)", lineHeight: "var(--line-height-body)",
                    fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                    fontFamily: "var(--font-family-body)",
                    cursor: canForgot ? "pointer" : "not-allowed",
                    alignSelf: "flex-start", transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => { if (canForgot) e.currentTarget.style.background = "var(--color-gray-90)"; }}
                  onMouseLeave={(e) => { if (canForgot) e.currentTarget.style.background = "var(--color-button-neutral)"; }}
                >
                  {forgotLoading ? "Sending..." : "Send reset link"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )}
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
          from { opacity: 0.04; transform: translate(0px,  0px);  }
          to   { opacity: 1;    transform: translate(18px, 14px); }
        }
        .signin-btn:hover {
          background-color: var(--color-accent-1200) !important;
        }
        @media (max-width: 768px) {
          .signin-right-panel { display: none !important; }
          .signin-left-col { padding: var(--spacing-24) var(--spacing-16) !important; }
          .signin-legal { display: none; }
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 1440, display: "flex", alignItems: "stretch" }}>

        {/* Left column */}
        <div className="signin-left-col" style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "var(--spacing-48) var(--spacing-56)",
          minWidth: 0,
        }}>

          {/* Logo */}
          <div>
            <a href="https://parqlet.com" target="_blank" rel="noopener noreferrer">
              <img
                src="/onboarding/logo-dark.svg"
                alt="Parqlet"
                style={{ display: "block", height: 26, width: "auto", alignSelf: "flex-start", filter: "var(--logo-dark-filter)" }}
              />
            </a>
          </div>

          {/* Form content — vertically centered */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 420 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-32)" }}>

              {/* Heading */}
              <h1 style={{
                margin: 0,
                fontSize: "var(--font-size-heading-1)",
                lineHeight: "var(--line-height-heading-1)",
                fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                color: "var(--color-text-strong)",
                fontFamily: "var(--font-family-heading)",
              }}>
                Sign In
              </h1>

              <form
                id="signin-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSignIn();
                }}
                style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-16)" }}
              >
                <FormField
                  label="Email address"
                  type="email"
                  placeholder=""
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
                  <FormField
                    label="Password"
                    type="password"
                    placeholder=""
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => { setForgotEmail(email); setForgotSent(false); setForgotError(null); setForgotOpen(true); }}
                    style={{
                      background: "none", border: "none", padding: 0, cursor: "pointer",
                      alignSelf: "flex-end",
                      fontFamily: "var(--font-family-body)",
                      fontSize: "var(--font-size-tiny)",
                      lineHeight: "var(--line-height-tiny)",
                      fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                      color: "var(--color-text-weak)",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; e.currentTarget.style.color = "var(--color-text-strong)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; e.currentTarget.style.color = "var(--color-text-weak)"; }}
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Sign In button */}
                <button
                  type="submit"
                  className={canSignIn ? "signin-btn" : ""}
                  disabled={!canSignIn}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 56,
                    padding: "0 var(--spacing-16)",
                    backgroundColor: canSignIn ? "var(--color-button-primary)" : "var(--color-accent-800)",
                    border: "none",
                    borderRadius: "var(--radius-8)",
                    cursor: canSignIn ? "pointer" : "not-allowed",
                    fontFamily: "var(--font-family-body)",
                    fontSize: "var(--font-size-heading-3)",
                    lineHeight: "var(--line-height-heading-3)",
                    fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                    // canSignIn branch sits on the fixed brand green — keep it dark; doesn't invert in dark mode.
                    color: canSignIn ? "#222222" : "var(--color-text-disabled)",
                    transition: "background-color 0.12s",
                    width: "100%",
                  }}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>
              {error && (
                <p style={{ margin: 0, fontSize: 13, color: "var(--color-fill-error, #dc2626)", textAlign: "center" }}>
                  {error}
                </p>
              )}
            </div>
          </div>

          {/* Legal */}
          <p className="signin-legal" style={{
            margin: 0,
            fontSize: "var(--font-size-tiny)",
            lineHeight: "var(--line-height-tiny)",
            fontWeight: "var(--font-weight-regular)",
            color: "var(--color-text-weak)",
            maxWidth: 420,
          }}>
            By continuing, you agree to our{" "}
            <a href="https://parqlet-terms-and-privacy.notion.site/Terms-of-Service-35d38574a76480228d7bc194bc23c6de" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-text-link)", fontWeight: "var(--font-weight-medium)", textDecoration: "underline", textUnderlineOffset: 2, fontSize: "inherit", fontFamily: "inherit", lineHeight: "inherit" }}>
              Terms of Service
            </a>
            {" "}and{" "}
            <a href="https://parqlet-terms-and-privacy.notion.site/Privacy-Policy-35d38574a76480a0be27c1cac5735ebe" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-text-link)", fontWeight: "var(--font-weight-medium)", textDecoration: "underline", textUnderlineOffset: 2, fontSize: "inherit", fontFamily: "inherit", lineHeight: "inherit" }}>
              Privacy Policy
            </a>
          </p>
        </div>

        {/* Right column — dark panel */}
        <div className="signin-right-panel" style={{
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
              animation: "ambientA 2.2s ease-in-out infinite alternate",
            }} />
            <div style={{
              position: "absolute",
              inset: 0,
              filter: "blur(40px)",
              background: `
                radial-gradient(ellipse 130% 110% at -12% -8%, rgba(20,20,20,0.95) 0%, transparent 58%),
                radial-gradient(ellipse 130% 110% at 112% 108%, rgba(20,20,20,0.95) 0%, transparent 58%)
              `,
              animation: "ambientB 2.2s ease-in-out infinite alternate",
            }} />

            {/* Feature items */}
            <div style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "var(--spacing-96)",
            }}>
              <FeatureItem icon={<IcOrganized />} label="Organized" sublabel="guest parking" />
              <FeatureItem icon={<IcEye />} label="Real-time" sublabel="visibility" />
              <FeatureItem icon={<IcPrivate />} label="Private building" sublabel="environment" />
            </div>
          </div>
        </div>

      </div>
    </div>
    </>
  );
}
