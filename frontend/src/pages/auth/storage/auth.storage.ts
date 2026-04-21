import type { AuthState } from "../types/auth.types";

const AUTH_STORAGE_KEY = "omnisphere_auth";

export const authStorage = {
  get(): AuthState | null {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AuthState;
    } catch {
      return null;
    }
  },

  set(value: AuthState) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(value));
  },

  clear() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },
};