import { create } from "zustand";

import type { components } from "@/types/api";

export type TokenResponse = components["schemas"]["TokenResponse"];
export type UserPublic = components["schemas"]["UserPublic"];
export type MeResponse = components["schemas"]["MeResponse"];

const ACCESS_TOKEN_KEY = "mindit.access_token";
const REFRESH_TOKEN_KEY = "mindit.refresh_token";

type StoredTokens = Pick<TokenResponse, "access_token" | "refresh_token">;

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: MeResponse | null;
  hydrated: boolean;
  setTokens: (tokens: StoredTokens) => void;
  setUser: (user: MeResponse | null) => void;
  clear: () => void;
  hydrate: () => void;
}

function readToken(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeToken(key: string, value: string | null): void {
  try {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Приватный режим или отключённое хранилище — работаем в памяти.
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  hydrated: false,

  setTokens: (tokens) => {
    writeToken(ACCESS_TOKEN_KEY, tokens.access_token);
    writeToken(REFRESH_TOKEN_KEY, tokens.refresh_token);
    set({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    });
  },

  setUser: (user) => set({ user }),

  clear: () => {
    writeToken(ACCESS_TOKEN_KEY, null);
    writeToken(REFRESH_TOKEN_KEY, null);
    set({ accessToken: null, refreshToken: null, user: null });
  },

  hydrate: () =>
    set({
      accessToken: readToken(ACCESS_TOKEN_KEY),
      refreshToken: readToken(REFRESH_TOKEN_KEY),
      hydrated: true,
    }),
}));
