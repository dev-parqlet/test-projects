/**
 * API client — base fetch wrapper with auth, error handling, and typed responses.
 * All API calls go through here.
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Serialize params to URLSearchParams, skipping undefined/null values */
function serializeParams(params: unknown): URLSearchParams {
  const sp = new URLSearchParams();
  if (params && typeof params === "object") {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) {
        sp.set(k, String(v));
      }
    }
  }
  return sp;
}

/**
 * Where /api/* lives.
 *
 * `.env.production` deliberately sets NEXT_PUBLIC_API_URL to EMPTY, meaning
 * "call your own origin", so one build serves demo.parqlet.com and every
 * preview URL without being rebuilt per domain. But `??` only falls back on
 * null and undefined - an empty string is not nullish, so the base stayed
 * "" and `new URL("/api/gift-cards", "")` throws "is not a valid URL". That
 * is why every data screen on the deployed demo failed to load while
 * localhost, which sets the variable to a real origin, was fine.
 *
 * Resolved here rather than at module scope because the browser origin is
 * not knowable during a server render.
 */
function resolveBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configured) return configured;
  // Same origin. In the browser that is the page we are on; during a server
  // render there is no origin to speak of, and any absolute base will do
  // because these calls only ever run client-side.
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3005";
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = new URL(path, resolveBaseUrl());

  const res = await fetch(url.toString(), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    credentials: "include",
  });

  if (!res.ok) {
    let body: unknown;
    try { body = await res.json(); } catch { body = undefined; }
    if (res.status === 401) {
      throw new ApiError(401, "Unauthorized", body);
    }
    throw new ApiError(res.status, `API error ${res.status}`, body);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const apiClient = {
  get<T>(path: string, params?: Record<string, string | number | boolean | undefined | null> | unknown) {
    const qs = params ? `?${serializeParams(params)}` : "";
    return apiFetch<T>(path + qs, { method: "GET" });
  },

  post<T>(path: string, body?: unknown) {
    return apiFetch<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(path: string, body?: unknown) {
    return apiFetch<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(path: string, body?: unknown) {
    return apiFetch<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(path: string) {
    return apiFetch<T>(path, { method: "DELETE" });
  },
};
