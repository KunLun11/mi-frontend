import { apiClient } from "@/api/client";
import type { components } from "@/types/api";

export type DictionaryItem = components["schemas"]["DictionaryItem"];

export async function fetchApproaches(): Promise<DictionaryItem[]> {
  const { data } = await apiClient.get<DictionaryItem[]>("/dictionaries/approaches");
  return data;
}

export async function fetchItContexts(): Promise<DictionaryItem[]> {
  const { data } = await apiClient.get<DictionaryItem[]>("/dictionaries/it-contexts");
  return data;
}

export async function fetchConcerns(): Promise<DictionaryItem[]> {
  const { data } = await apiClient.get<DictionaryItem[]>("/dictionaries/concerns");
  return data;
}
