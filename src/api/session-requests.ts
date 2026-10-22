import { apiClient } from "@/api/client";
import type { TherapySessionOut } from "@/api/sessions";
import type { components } from "@/types/api";

export type SessionRequestIn = components["schemas"]["SessionRequestIn"];
export type SessionRequestOut = components["schemas"]["SessionRequestOut"];
export type SessionRequestAcceptIn = components["schemas"]["SessionRequestAcceptIn"];

export async function createSessionRequest(
  payload: SessionRequestIn,
): Promise<SessionRequestOut> {
  const { data } = await apiClient.post<SessionRequestOut>("/session-requests", payload);
  return data;
}

export async function listSessionRequests(): Promise<SessionRequestOut[]> {
  const { data } = await apiClient.get<SessionRequestOut[]>("/session-requests");
  return data;
}

export async function cancelSessionRequest(requestId: string): Promise<SessionRequestOut> {
  const { data } = await apiClient.post<SessionRequestOut>(
    `/session-requests/${requestId}/cancel`,
  );
  return data;
}

export async function acceptSessionRequest(
  requestId: string,
  payload: SessionRequestAcceptIn,
): Promise<TherapySessionOut> {
  const { data } = await apiClient.post<TherapySessionOut>(
    `/session-requests/${requestId}/accept`,
    payload,
  );
  return data;
}

export async function declineSessionRequest(requestId: string): Promise<SessionRequestOut> {
  const { data } = await apiClient.post<SessionRequestOut>(
    `/session-requests/${requestId}/decline`,
  );
  return data;
}
