"use client";

import { useRouter } from "next/navigation";
import { useEnrollment } from "./useEnrollment";

// ─── Logo: P lettermark ────────────────────────────────────────────────────────
function LogoP() {
  return (
    <svg
      width="30"
      height="29"
      viewBox="0 0 29.6448 28.4918"
      fill="none"
      style={{ display: "block", flexShrink: 0 }}
    >
      <path
        d="M0.915807 28.4918C0.617322 28.4918 0.373106 28.3832 0.183161 28.1662C0.0203513 27.9491 -0.0339188 27.6913 0.0203513 27.3928L5.6373 1.09897C5.69157 0.800484 5.84081 0.542701 6.08503 0.325621C6.35638 0.10854 6.6413 0 6.93978 0H18.4586C20.1952 0 21.7962 0.203512 23.2615 0.610537C24.7539 1.01756 26.0157 1.64167 27.0468 2.48285C28.1051 3.2969 28.8513 4.32804 29.2855 5.57625C29.7196 6.82446 29.7603 8.28975 29.4076 9.97212C28.7021 13.3369 27.2503 15.7926 25.0524 17.3393C22.8545 18.8588 19.8153 19.6186 15.935 19.6186H12.2718L10.603 27.3928C10.5487 27.6913 10.3859 27.9491 10.1146 28.1662C9.87036 28.3832 9.59901 28.4918 9.30053 28.4918H0.915807Z"
        fill="var(--color-text-strong)"
      />
    </svg>
  );
}

// ─── Logo: arQlet wordmark ─────────────────────────────────────────────────────
function LogoArQlet() {
  return (
    <svg
      width="165"
      height="32"
      viewBox="0 0 165.157 31.5365"
      fill="none"
      style={{ display: "block", flexShrink: 0 }}
    >
      <path d="M149.287 28.8915C148.989 28.8915 148.731 28.7965 148.514 28.6066C148.324 28.3896 148.229 28.1319 148.229 27.8335V7.97568H141.23C140.932 7.97568 140.674 7.88073 140.457 7.69084C140.267 7.47381 140.172 7.21609 140.172 6.91768V1.46493C140.172 1.16652 140.267 0.922364 140.457 0.732468C140.674 0.515443 140.932 0.40693 141.23 0.40693H164.099C164.397 0.40693 164.642 0.515443 164.831 0.732468C165.049 0.922364 165.157 1.16652 165.157 1.46493V6.91768C165.157 7.21609 165.049 7.47381 164.831 7.69084C164.642 7.88073 164.397 7.97568 164.099 7.97568H157.1V27.8335C157.1 28.1319 156.991 28.3896 156.774 28.6066C156.585 28.7965 156.34 28.8915 156.042 28.8915H149.287Z" fill="var(--color-text-strong)" />
      <path d="M116.395 28.8915C116.123 28.8915 115.879 28.7965 115.662 28.6066C115.445 28.3896 115.337 28.1319 115.337 27.8335V1.46493C115.337 1.16652 115.445 0.922364 115.662 0.732468C115.879 0.515443 116.123 0.40693 116.395 0.40693H136.334C136.632 0.40693 136.89 0.515443 137.107 0.732468C137.324 0.922364 137.432 1.16652 137.432 1.46493V6.26661C137.432 6.53789 137.324 6.78204 137.107 6.99907C136.89 7.21609 136.632 7.3246 136.334 7.3246H123.76V11.3531H135.439C135.737 11.3531 135.995 11.4616 136.212 11.6787C136.429 11.8686 136.537 12.1127 136.537 12.4111V16.8059C136.537 17.1043 136.429 17.362 136.212 17.579C135.995 17.7689 135.737 17.8639 135.439 17.8639H123.76V21.9738H136.659C136.958 21.9738 137.215 22.0823 137.432 22.2993C137.649 22.5164 137.758 22.7741 137.758 23.0725V27.8335C137.758 28.1319 137.649 28.3896 137.432 28.6066C137.215 28.7965 136.958 28.8915 136.659 28.8915H116.395Z" fill="var(--color-text-strong)" />
      <path d="M91.5183 28.8915C91.2471 28.8915 91.0029 28.7965 90.7859 28.6066C90.5688 28.3896 90.4603 28.1319 90.4603 27.8335V1.46493C90.4603 1.16652 90.5688 0.922364 90.7859 0.732468C91.0029 0.515443 91.2471 0.40693 91.5183 0.40693H98.2732C98.5716 0.40693 98.8294 0.515443 99.0464 0.732468C99.2634 0.922364 99.3719 1.16652 99.3719 1.46493V21.6483H111.132C111.43 21.6483 111.688 21.7568 111.905 21.9738C112.122 22.1637 112.231 22.4079 112.231 22.7063V27.8335C112.231 28.1319 112.122 28.3896 111.905 28.6066C111.688 28.7965 111.43 28.8915 111.132 28.8915H91.5183Z" fill="var(--color-text-strong)" />
      <path d="M79.0029 31.5365C78.5417 31.5365 78.1891 31.4144 77.9449 31.1702C77.7008 30.9532 77.5109 30.7633 77.3752 30.6005L76.1138 28.9729C75.2186 29.1899 74.2284 29.2984 73.1432 29.2984C70.5661 29.2984 68.3144 28.8915 66.3883 28.0776C64.4622 27.2638 62.9566 26.043 61.8715 24.4153C60.7864 22.7605 60.1896 20.7123 60.081 18.2708C60.0539 17.1314 60.0404 15.9649 60.0404 14.7713C60.0404 13.5505 60.0539 12.3433 60.081 11.1497C60.1896 8.73526 60.7864 6.70065 61.8715 5.04583C62.9566 3.39102 64.4622 2.14312 66.3883 1.30215C68.3144 0.434051 70.5661 0 73.1432 0C75.6933 0 77.9314 0.434051 79.8575 1.30215C81.7836 2.14312 83.3027 3.39102 84.415 5.04583C85.5272 6.70065 86.1241 8.73526 86.2054 11.1497C86.2597 12.3433 86.2868 13.5505 86.2868 14.7713C86.2868 15.9649 86.2597 17.1314 86.2054 18.2708C86.0427 21.4719 85.0525 23.9948 83.2349 25.8396L86.3682 30.275C86.3953 30.3021 86.4225 30.3564 86.4496 30.4378C86.4767 30.5192 86.4903 30.587 86.4903 30.6412C86.5174 30.8854 86.436 31.0888 86.2461 31.2516C86.0834 31.4415 85.8935 31.5365 85.6764 31.5365H79.0029ZM73.1432 22.3807C74.3098 22.3807 75.2457 22.0416 75.951 21.3634C76.6835 20.6581 77.0633 19.5458 77.0904 18.0266C77.1446 16.8601 77.1718 15.7343 77.1718 14.6492C77.1718 13.5369 77.1446 12.4111 77.0904 11.2717C77.0633 10.268 76.8734 9.44059 76.5207 8.78952C76.1952 8.13844 75.734 7.6637 75.1372 7.36529C74.5675 7.06688 73.9028 6.91768 73.1432 6.91768C72.3837 6.91768 71.7055 7.06688 71.1086 7.36529C70.5389 7.6637 70.0778 8.13844 69.7251 8.78952C69.3724 9.44059 69.1825 10.268 69.1554 11.2717C69.1283 12.4111 69.1147 13.5369 69.1147 14.6492C69.1147 15.7343 69.1283 16.8601 69.1554 18.0266C69.2097 19.5458 69.5895 20.6581 70.2948 21.3634C71.0273 22.0416 71.9767 22.3807 73.1432 22.3807Z" fill="var(--color-text-strong)" />
      <path d="M33.3413 28.8915C33.07 28.8915 32.8259 28.7965 32.6088 28.6066C32.3918 28.3896 32.2833 28.1319 32.2833 27.8335V1.46493C32.2833 1.16652 32.3918 0.922364 32.6088 0.732468C32.8259 0.515443 33.07 0.40693 33.3413 0.40693H44.9386C48.628 0.40693 51.5171 1.2479 53.606 2.92985C55.722 4.61179 56.78 6.95837 56.78 9.9696C56.78 11.8686 56.3459 13.4827 55.4778 14.812C54.6097 16.1412 53.4704 17.1857 52.0597 17.9453L57.3497 27.5486C57.4311 27.7114 57.4718 27.8606 57.4718 27.9962C57.4718 28.2404 57.3904 28.4574 57.2276 28.6473C57.0648 28.8101 56.8614 28.8915 56.6172 28.8915H49.7402C49.2248 28.8915 48.8315 28.783 48.5602 28.5252C48.2889 28.254 48.1126 28.0098 48.0312 27.7928L43.962 19.4102H41.0321V27.8335C41.0321 28.1319 40.9236 28.3896 40.7066 28.6066C40.5167 28.7965 40.2725 28.8915 39.9741 28.8915H33.3413ZM41.0321 12.696H44.8979C45.8474 12.696 46.5527 12.4383 47.0139 11.9228C47.475 11.3803 47.7056 10.7156 47.7056 9.92891C47.7056 9.11506 47.475 8.4233 47.0139 7.8536C46.5798 7.28391 45.8745 6.99907 44.8979 6.99907H41.0321V12.696Z" fill="var(--color-text-strong)" />
      <path d="M0.895274 28.8915C0.651121 28.8915 0.434096 28.8101 0.244199 28.6473C0.0814298 28.4574 4.53786e-05 28.2404 4.53786e-05 27.9962C4.53786e-05 27.8877 0.0271735 27.7928 0.0814298 27.7114L9.35925 1.66839C9.44064 1.36998 9.61697 1.08513 9.88825 0.813852C10.1867 0.542571 10.58 0.40693 11.0683 0.40693H18.515C19.0304 0.40693 19.4238 0.542571 19.6951 0.813852C19.9664 1.08513 20.1427 1.36998 20.2241 1.66839L29.5426 27.7114C29.5697 27.7928 29.5833 27.8877 29.5833 27.9962C29.5833 28.2404 29.4883 28.4574 29.2984 28.6473C29.1357 28.8101 28.9322 28.8915 28.6881 28.8915H22.4214C21.9603 28.8915 21.6212 28.783 21.4041 28.5659C21.1871 28.3489 21.0379 28.1455 20.9565 27.9556L19.6951 24.5374H9.88825L8.62679 27.9556C8.54541 28.1455 8.3962 28.3489 8.17918 28.5659C7.98928 28.783 7.65018 28.8915 7.16187 28.8915H0.895274ZM11.7601 17.6604H17.8232L14.7713 8.50468L11.7601 17.6604Z" fill="var(--color-text-strong)" />
    </svg>
  );
}

// ─── Feature icons ─────────────────────────────────────────────────────────────
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

// ─── Arrow icon ────────────────────────────────────────────────────────────────
function IcArrowRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      {/* Only used inside the fixed brand-green CTA button — keep it dark; doesn't invert in dark mode. */}
      <path d="M4 10H16M10 4L16 10L10 16" stroke="#222222" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Feature item ──────────────────────────────────────────────────────────────
function FeatureItem({
  icon,
  label,
  sublabel,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
}) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "var(--spacing-8)",
      width: 110,
    }}>
      <div style={{ width: 24, height: 24, flexShrink: 0 }}>{icon}</div>
      <p style={{
        margin: 0,
        fontFamily: "var(--font-family-body)",
        textAlign: "center",
        color: "var(--color-text-white)",
      }}>
        <span style={{
          display: "block",
          fontSize: "var(--font-size-tiny)",
          fontWeight: "var(--font-weight-medium)",
          lineHeight: "var(--line-height-tiny)",
        }}>
          {label}
        </span>
        <span style={{
          display: "block",
          fontSize: "var(--font-size-extra-tiny)",
          fontWeight: "var(--font-weight-regular)",
          lineHeight: "var(--line-height-extra-tiny)",
        }}>
          {sublabel}
        </span>
      </p>
    </div>
  );
}

// ─── Welcome page ──────────────────────────────────────────────────────────────
export default function WelcomePage() {
  const router = useRouter();
  const { data: enrollment, loading: enrollmentLoading } = useEnrollment();

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "var(--color-fill-weak)",
      fontFamily: "var(--font-family-body)",
      display: "flex",
      justifyContent: "center",
    }}>
      {/* ── Centered max-width container ────────────────────────────────── */}
      <div style={{
        width: "100%",
        maxWidth: 1440,
        display: "flex",
        alignItems: "stretch",
      }}>

      {/* ── Left column ─────────────────────────────────────────────────── */}
      <div className="welcome-left-col" style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "var(--spacing-48) var(--spacing-56)",
        minWidth: 0,
        position: "relative",
      }}>

        {/* Logo + client */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-24)" }}>
          {/* Parqlet logo wordmark */}
          <img
            src="/onboarding/logo-dark.svg"
            alt="Parqlet"
            style={{ display: "block", height: 26, width: "auto", alignSelf: "flex-start", filter: "var(--logo-dark-filter)" }}
          />
        </div>

        {/* Main content — vertically centered in remaining space */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: 420,
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-32)" }}>
            {/* Heading + subtitle */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-16)" }}>
              <h1 style={{
                margin: 0,
                fontSize: "var(--font-size-heading-1)",
                lineHeight: "var(--line-height-heading-1)",
                fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                color: "var(--color-text-strong)",
                fontFamily: "var(--font-family-heading)",
              }}>
                Welcome to Parqlet!
              </h1>
              <p style={{
                margin: 0,
                fontSize: "var(--font-size-heading-2)",
                lineHeight: "var(--line-height-heading-2)",
                fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                color: "var(--color-text-weak)",
              }}>
                Get full visibility into guest parking in your building
              </p>
            </div>

            {/* CTA button */}
            <button
              onClick={() => {
                const t = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("token") : null;
                router.push(t ? `/onboarding/setup-account?token=${encodeURIComponent(t)}` : "/onboarding/setup-account");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "var(--spacing-8)",
                height: 56,
                padding: "0 var(--spacing-16)",
                backgroundColor: "var(--color-button-primary)",
                border: "none",
                borderRadius: "var(--radius-8)",
                cursor: "pointer",
                fontFamily: "var(--font-family-body)",
                fontSize: "var(--font-size-heading-3)",
                lineHeight: "var(--line-height-heading-3)",
                fontWeight: "var(--font-weight-regular)",
                // Fixed brand color, doesn't invert in dark mode — keep text dark.
                color: "#222222",
                transition: "background-color 0.12s",
                width: "100%",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-accent-1200)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--color-button-primary)"; }}
            >
              Get started
              <IcArrowRight />
            </button>

            {/* Sign in link for returning users */}
            <p style={{ margin: 0, fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)", lineHeight: "var(--line-height-tiny)", color: "var(--color-text-weak)" }}>
              Already have an account?{" "}
              <button
                onClick={() => router.push("/sign-in")}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)", lineHeight: "var(--line-height-tiny)", color: "var(--color-text-strong)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], textDecoration: "none" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "underline"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "none"; }}
              >
                Sign in
              </button>
            </p>
          </div>
        </div>

        {/* Legal text — bottom, left-aligned with content */}
        <p style={{
          margin: 0,
          fontSize: "var(--font-size-tiny)",
          lineHeight: "var(--line-height-tiny)",
          fontWeight: "var(--font-weight-regular)",
          color: "var(--color-text-weak)",
          maxWidth: 420,
        }}>
          By continuing, you agree to our{" "}
          <a href="https://parqlet-terms-and-privacy.notion.site/Terms-of-Service-35d38574a76480228d7bc194bc23c6de" target="_blank" rel="noopener noreferrer" style={{
            color: "var(--color-text-link)",
            fontWeight: "var(--font-weight-medium)",
            textDecoration: "underline",
            textUnderlineOffset: 2,
          }}>
            Terms of Service
          </a>
          {" "}and{" "}
          <a href="https://parqlet-terms-and-privacy.notion.site/Privacy-Policy-35d38574a76480a0be27c1cac5735ebe" target="_blank" rel="noopener noreferrer" style={{
            color: "var(--color-text-link)",
            fontWeight: "var(--font-weight-medium)",
            textDecoration: "underline",
            textUnderlineOffset: 2,
          }}>
            Privacy Policy
          </a>
        </p>
      </div>

      {/* ── Right column — animated dark panel ─────────────────────────── */}
      <style>{`
        /* Phase A: TL+BR corners revealed */
        @keyframes ambientA {
          from { opacity: 1;    transform: translate(0px,   0px);   }
          to   { opacity: 0.04; transform: translate(-18px, -14px); }
        }
        /* Phase B: TR+BL corners revealed — opposite phase */
        @keyframes ambientB {
          from { opacity: 0.04; transform: translate(0px,  0px);  }
          to   { opacity: 1;    transform: translate(18px, 14px); }
        }
        @media (max-width: 768px) {
          .welcome-right-panel { display: none !important; }
          .welcome-left-col { padding: var(--spacing-24) var(--spacing-16) !important; }
        }
      `}</style>

      <div className="welcome-right-panel" style={{
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

          {/* Layer 1: square grid — masked to fade at top and bottom edges */}
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

          {/* Layer 2: color glows — green bottom-left, orange top-right */}
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

          {/* Layer 3: radial dark base — fully opaque in center (hides grid), partial at edges */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(20,20,20,1) 30%, rgba(20,20,20,0.68) 100%)",
          }} />

          {/* Layer A: radials at TR+BL — covers those corners, revealing TL+BR. */}
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

          {/* Layer B: radials at TL+BR — covers those corners, revealing TR+BL. */}
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
            <FeatureItem
              icon={<IcOrganized />}
              label="Organized"
              sublabel="guest parking"
            />
            <FeatureItem
              icon={<IcEye />}
              label="Real-time"
              sublabel="visibility"
            />
            <FeatureItem
              icon={<IcPrivate />}
              label="Private building"
              sublabel="environment"
            />
          </div>
        </div>
      </div>

      </div>{/* end centered container */}
    </div>
  );
}
