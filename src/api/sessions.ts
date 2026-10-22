import { apiClient } from "@/api/client";
import type { components } from "@/types/api";

export type TherapySessionOut = components["schemas"]["TherapySessionOut"];

export async function listSessions(): Promise<TherapySessionOut[]> {
  const { data } = await apiClient.get<TherapySessionOut[]>("/sessions");
  return data;
}

export async function completeSession(sessionId: string): Promise<TherapySessionOut> {
  const { data } = await apiClient.post<TherapySessionOut>(
    `/sessions/${sessionId}/complete`,
  );
  return data;
}

export async function markSessionNoShow(sessionId: string): Promise<TherapySessionOut> {
  const { data } = await apiClient.post<TherapySessionOut>(
    `/sessions/${sessionId}/no-show`,
  );
  return data;
}
