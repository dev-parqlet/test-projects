import { apiClient } from "./client";

export interface TeamMember {
  id: string;
  buildingId: string | null;
  userId: string;
  name: string;
  email: string;
  role: string;
  status: "Registered" | "Pending";
  invited: string;
  lastActive: string | null;
  avatarUrl: string | null;
  /** Raw ISO instant — bumped whenever status changes (e.g. Pending -> Registered). */
  updatedAt: string;
}

export const memberKeys = {
  all: ["members"] as const,
  list: (filters: Record<string, string | number | boolean>) => ["members", "list", filters] as const,
  detail: (id: string) => ["members", id] as const,
};

export interface ListMembersParams {
  buildingId?: string;
  status?: TeamMember["status"];
  page?: number;
  pageSize?: number;
}

export async function listMembers(params: ListMembersParams) {
  return apiClient.get<{ data: TeamMember[]; total: number; page: number; pageSize: number }>(
    "/api/members",
    params
  );
}

export async function inviteMember(email: string, role: string, buildingId?: string, name?: string) {
  return apiClient.post<TeamMember>("/api/members/invite", { email, role, buildingId, name });
}

export async function updateMemberRole(id: string, role: string) {
  return apiClient.put<TeamMember>(`/api/members/${id}/role`, { role });
}

export async function removeMember(id: string) {
  return apiClient.delete<void>(`/api/members/${id}`);
}

export async function resendMemberInvite(id: string) {
  return apiClient.post<void>(`/api/members/${id}/resend-invite`);
}