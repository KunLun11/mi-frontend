import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import { useAuthStore, type TokenResponse } from "@/store/auth";

const configuredBaseUrl = import.meta.env.VITE_API_URL;

if (!configuredBaseUrl) {
  throw new Error("VITE_API_URL is not configured");
}

export const API_URL = configuredBaseUrl.replace(/\/+$/, "");

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const AUTH_ENDPOINTS = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"];

function extractDetail(payload: unknown): string | null {
  if (typeof payload === "object" && payload !== null && "detail" in payload) {
    const detail = (payload as { detail: unknown }).detail;
    return typeof detail === "string" ? detail : null;
  }
  return null;
}

function redirectToLogin(): void {
  if (typeof window === "undefined" || window.location.pathname === "/login") {
    return;
  }
  const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
  window.location.assign(`/login?next=${next}`);
}

function logoutAndRedirect(): void {
  useAuthStore.getState().clear();
  redirectToLogin();
}

async function performRefresh(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) {
    return null;
  }

  try {
    const { data } = await axios.post<TokenResponse>(`${API_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    });
    useAuthStore.getState().setTokens(data);
    return data.access_token;
  } catch (error) {
    console.error("Token refresh failed", error);
    return null;
  }
}

/**
 * Единственная точка обновления access-токена.
 *
 * Если несколько запросов одновременно получили `token_expired`, реальный
 * refresh выполняется один раз — остальные ждут тот же промис.
 */
let refreshPromise: Promise<string | null> | null = null;

export function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise === null) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { Accept: "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;
    const detail = extractDetail(error.response?.data);

    if (status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => originalRequest.url?.startsWith(path));
    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    const hasSession = useAuthStore.getState().refreshToken !== null;

    if (detail === "token_expired" && hasSession) {
      originalRequest._retry = true;
      const accessToken = await refreshAccessToken();

      if (accessToken) {
        originalRequest.headers.set("Authorization", `Bearer ${accessToken}`);
        return apiClient(originalRequest);
      }

      logoutAndRedirect();
      return Promise.reject(error);
    }

    if (
      hasSession &&
      (detail === "invalid_token" || detail === "token_revoked" || detail === "not_authenticated")
    ) {
      logoutAndRedirect();
    }

    return Promise.reject(error);
  },
);
