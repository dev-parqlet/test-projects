// TODO: re-enable when backend WebSocket server is ready
/*
export async function getWsToken(): Promise<string> {
  const res = await fetch("/api/auth/ws-token", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to get WS token");
  const data = await res.json();
  return data.token;
}
*/