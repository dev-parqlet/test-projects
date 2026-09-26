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

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.parqlet.com";
  const url = new URL(path, BACKEND_URL);

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
