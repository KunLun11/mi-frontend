import { apiClient } from "@/api/client";
import type { components } from "@/types/api";

export type QuizIn = components["schemas"]["QuizIn"];
export type QuizOut = components["schemas"]["QuizOut"];
export type RecommendationOut = components["schemas"]["RecommendationOut"];

export async function createQuiz(payload: QuizIn): Promise<QuizOut> {
  const { data } = await apiClient.post<QuizOut>("/quizzes", payload);
  return data;
}

export async function getQuiz(quizId: string): Promise<QuizOut> {
  const { data } = await apiClient.get<QuizOut>(`/quizzes/${quizId}`);
  return data;
}

export async function getRecommendations(quizId: string): Promise<RecommendationOut[]> {
  const { data } = await apiClient.get<RecommendationOut[]>(
    `/quizzes/${quizId}/recommendations`,
  );
  return data;
}
