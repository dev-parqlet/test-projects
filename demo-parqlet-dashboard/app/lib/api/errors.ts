/**
 * Best-effort extraction of a user-presentable error message from an unknown
 * value (typically a parsed JSON error body or an `ApiError.body`).
 *
 * Order of preference:
 *   1. { error: { message: "…" } }   ← canonical backend shape
 *   2. { error: { detail:  "…" } }
 *   3. { error: "string" }
 *   4. { message: "string" }
 *   5. The input itself if a non-empty string
 *   6. The supplied `fallback`
 *
 * Always returns a non-empty trimmed string so the caller can render it
 * directly as a React child without crashing.
 */
export function extractErrorMessage(input: unknown, fallback: string): string {
  if (input == null) return fallback;

  if (typeof input === "string") {
    const trimmed = input.trim();
    return trimmed || fallback;
  }

  if (typeof input === "object") {
    const e = (input as { error?: unknown }).error;

    if (typeof e === "string") {
      const trimmed = e.trim();
      if (trimmed) return trimmed;
    }

    if (e && typeof e === "object") {
      const m = (e as { message?: unknown }).message;
      if (typeof m === "string" && m.trim()) return m.trim();

      const d = (e as { detail?: unknown }).detail;
      if (typeof d === "string" && d.trim()) return d.trim();
    }

    const top = (input as { message?: unknown }).message;
    if (typeof top === "string" && top.trim()) return top.trim();
  }

  return fallback;
}