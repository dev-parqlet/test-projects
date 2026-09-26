"use client";

/**
 * Root route-segment error boundary. Catches render-time exceptions from any
 * client component below the root layout. Without this, an uncaught React
 * exception (e.g. rendering a non-string as a React child) would surface
 * Next.js's default "This page couldn't load" page.
 *
 * Kept intentionally minimal and inline-styled so it doesn't depend on any
 * other client component — the error itself might be coming from a provider
 * or primitive further down the tree.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        padding: "var(--spacing-32)",
        fontFamily: "var(--font-family-body)",
        color: "var(--color-text-strong)",
      }}
    >
      <h1
        style={{
          fontSize: "var(--font-size-heading-2)",
          fontWeight: "var(--font-weight-regular)",
          lineHeight: "var(--line-height-heading-2)",
          margin: 0,
        }}
      >
        Something went wrong
      </h1>
      <p
        style={{
          color: "var(--color-text-weak)",
          marginTop: "var(--spacing-12)",
          fontSize: "var(--font-size-body)",
        }}
      >
        The page failed to load. You can retry, or head back to the dashboard.
      </p>
      {error.digest && (
        <p
          style={{
            fontSize: "var(--font-size-extra-tiny)",
            color: "var(--color-text-weak)",
            marginTop: "var(--spacing-12)",
          }}
        >
          Reference: {error.digest}
        </p>
      )}
      <div
        style={{
          display: "flex",
          gap: "var(--spacing-12)",
          marginTop: "var(--spacing-20)",
        }}
      >
        <button
          onClick={reset}
          style={{
            padding: "10px 20px",
            border: "none",
            borderRadius: "var(--radius-8)",
            background: "var(--color-fill-accent)",
            // Fixed brand color, doesn't invert in dark mode — keep text dark.
            color: "#222222",
            fontFamily: "var(--font-family-body)",
            fontSize: "var(--font-size-tiny)",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <a
          href="/dashboard"
          style={{
            padding: "10px 20px",
            border: "1px solid var(--color-stroke-medium)",
            borderRadius: "var(--radius-8)",
            color: "var(--color-text-strong)",
            textDecoration: "none",
            fontFamily: "var(--font-family-body)",
            fontSize: "var(--font-size-tiny)",
          }}
        >
          Go to dashboard
        </a>
      </div>
    </div>
  );
}