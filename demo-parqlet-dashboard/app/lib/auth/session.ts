/**
 * Server-side session check.
 * Calls the backend on port 3002 to verify the user has an active session.
 * Cookies from the incoming request are forwarded so auth works correctly.
 */

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

const BACKEND_URL = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://api.parqlet.com";

export async function getSession(
  cookieHeader?: string | null
): Promise<SessionUser | null> {
  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      cache: "no-store",
    };

    if (cookieHeader) {
      headers["Cookie"] = cookieHeader;
    }

    const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
      method: "GET",
      headers,
      credentials: "include",
    });

    if (!res.ok) return null;

    const data = (await res.json()) as { user: SessionUser | null } | SessionUser;
    // Backend wraps in { user: ... } or returns user directly
    if ("user" in data) return data.user;
    return data;
  } catch {
    // Backend not yet available — treat as unauthenticated
    return null;
  }
}
