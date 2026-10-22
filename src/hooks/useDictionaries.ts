import { useQuery } from "@tanstack/react-query";

import {
  fetchApproaches,
  fetchConcerns,
  fetchItContexts,
  type DictionaryItem,
} from "@/api/dictionaries";

export interface Dictionaries {
  approaches: DictionaryItem[];
  itContexts: DictionaryItem[];
  concerns: DictionaryItem[];
}

export const dictionariesQueryKey = ["dictionaries"] as const;

export function useDictionaries() {
  return useQuery({
    queryKey: dictionariesQueryKey,
    queryFn: async (): Promise<Dictionaries> => {
      const [approaches, itContexts, concerns] = await Promise.all([
        fetchApproaches(),
        fetchItContexts(),
        fetchConcerns(),
      ]);
      return { approaches, itContexts, concerns };
    },
    staleTime: 3_600_000,
    gcTime: 3_600_000,
  });
}
