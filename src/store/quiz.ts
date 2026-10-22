import { create } from "zustand";

import type { components } from "@/types/api";

type ITRole = components["schemas"]["ITRole"];
type Format = components["schemas"]["Format"];

export type BudgetChoice = number | "unknown";

interface QuizDraftState {
  step: number;
  roleInIt: ITRole | null;
  concernId: number | null;
  format: Format | null;
  budget: BudgetChoice | null;
  freeText: string;
  setStep: (step: number) => void;
  setRoleInIt: (role: ITRole) => void;
  setConcernId: (id: number) => void;
  setFormat: (format: Format) => void;
  setBudget: (budget: BudgetChoice) => void;
  setFreeText: (value: string) => void;
  reset: () => void;
}

const INITIAL = {
  step: 1,
  roleInIt: null,
  concernId: null,
  format: null,
  budget: null,
  freeText: "",
} satisfies Pick<
  QuizDraftState,
  "step" | "roleInIt" | "concernId" | "format" | "budget" | "freeText"
>;

export const useQuizStore = create<QuizDraftState>((set) => ({
  ...INITIAL,
  setStep: (step) => set({ step }),
  setRoleInIt: (roleInIt) => set({ roleInIt }),
  setConcernId: (concernId) => set({ concernId }),
  setFormat: (format) => set({ format }),
  setBudget: (budget) => set({ budget }),
  setFreeText: (freeText) => set({ freeText }),
  reset: () => set({ ...INITIAL }),
}));
