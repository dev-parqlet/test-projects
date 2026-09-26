"use client";

/**
 * Last-resort error boundary that replaces the root document when an
 * exception is thrown inside `app/layout.tsx` itself (which `app/error.tsx`
 * cannot catch). Renders a minimal `<html><body>` shell so the user always
 * has a recovery path even when the rest of the app's providers are broken.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: "var(--spacing-32)",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          color: "#1a1a1a",
          background: "#ffffff",
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 500, margin: 0 }}>
          Something went wrong
        </h1>
        <p style={{ color: "#666", marginTop: 12, fontSize: 16 }}>
          The application failed to start. You can retry, or head back to the
          dashboard.
        </p>
        {error.digest && (
          <p style={{ color: "#999", marginTop: 12, fontSize: 12 }}>
            Reference: {error.digest}
          </p>
        )}
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button
            onClick={reset}
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: 8,
              background: "#ffce3d",
              color: "#1a1a1a",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          <a
            href="/dashboard"
            style={{
              padding: "10px 20px",
              border: "1px solid #ccc",
              borderRadius: 8,
              color: "#1a1a1a",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            Go to dashboard
          </a>
        </div>
      </body>
    </html>
  );
}