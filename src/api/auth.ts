import { apiClient } from "@/api/client";
import type { components } from "@/types/api";
import type { MeResponse, TokenResponse } from "@/store/auth";

export type RegisterPayload = components["schemas"]["RegisterRequest"];
export type LoginPayload = components["schemas"]["LoginRequest"];
export type VerifyEmailPayload = components["schemas"]["VerifyEmailRequest"];
export type ResendCodePayload = components["schemas"]["ResendCodeRequest"];
export type OAuthProvider = "yandex" | "google" | "github";

export async function fetchMe(): Promise<MeResponse> {
  const { data } = await apiClient.get<MeResponse>("/auth/me");
  return data;
}

export async function register(payload: RegisterPayload): Promise<void> {
  await apiClient.post("/auth/register", payload);
}

export async function verifyEmail(payload: VerifyEmailPayload): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>("/auth/verify-email", payload);
  return data;
}

export async function resendCode(payload: ResendCodePayload): Promise<void> {
  await apiClient.post("/auth/resend-code", payload);
}

export async function login(payload: LoginPayload): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>("/auth/login", payload);
  return data;
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post("/auth/logout", { refresh_token: refreshToken });
}

export async function oauthAuthorize(provider: OAuthProvider): Promise<string> {
  const { data } = await apiClient.get<components["schemas"]["OAuthAuthorizeResponse"]>(
    `/auth/oauth/${provider}/authorize`,
  );
  return data.authorize_url;
}
