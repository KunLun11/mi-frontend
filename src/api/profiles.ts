import { apiClient } from "@/api/client";
import type { components } from "@/types/api";

export type PsychologistProfileIn = components["schemas"]["PsychologistProfileIn"];
export type PsychologistProfileOut = components["schemas"]["PsychologistProfileOut"];

export const psychologistProfileQueryKey = ["psychologists", "me"] as const;

export async function getMyPsychologistProfile(): Promise<PsychologistProfileOut> {
  const { data } = await apiClient.get<PsychologistProfileOut>("/psychologists/me");
  return data;
}

export async function updateMyPsychologistProfile(
  payload: PsychologistProfileIn,
): Promise<PsychologistProfileOut> {
  const { data } = await apiClient.put<PsychologistProfileOut>(
    "/psychologists/me",
    payload,
  );
  return data;
}

export async function submitMyPsychologistProfile(): Promise<PsychologistProfileOut> {
  const { data } = await apiClient.post<PsychologistProfileOut>("/psychologists/me/submit");
  return data;
}
