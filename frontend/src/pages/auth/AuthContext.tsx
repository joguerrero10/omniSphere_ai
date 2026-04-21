import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./context/auth.context";
import { authStorage } from "./storage/auth.storage";
import { getTokenRemainingMs, isTokenExpired } from "./storage/jwt";
import type { AuthContextValue, AuthState, LoginResponse } from "./types/auth.types";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  const [auth, setAuth] = useState<AuthState>(() => {
    const stored = authStorage.get();
    if (!stored?.accessToken || isTokenExpired(stored.accessToken)) {
      authStorage.clear();
      return { accessToken: null, user: null };
    }
    return stored;
  });

  const logoutTimerRef = useRef<number | null>(null);

  const clearLogoutTimer = useCallback(() => {
    if (logoutTimerRef.current) {
      window.clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  }, []);

  const logout = useCallback(
    (reason: "manual" | "expired" = "manual") => {
      clearLogoutTimer();
      authStorage.clear();
      setAuth({ accessToken: null, user: null });
      navigate(
        reason === "expired" ? "/login?reason=expired" : "/login",
        { replace: true },
      );
    },
    [clearLogoutTimer, navigate],
  );

  const scheduleAutoLogout = useCallback(
    (token: string) => {
      clearLogoutTimer();
      if (isTokenExpired(token)) return;

      const remainingMs = getTokenRemainingMs(token);
      logoutTimerRef.current = window.setTimeout(() => {
        logout("expired");
      }, remainingMs);
    },
    [clearLogoutTimer, logout],
  );

  const login = useCallback(
    (data: LoginResponse) => {
      const nextAuth: AuthState = {
        accessToken: data.access_token,
        user: data.user,
      };
      authStorage.set(nextAuth);
      setAuth(nextAuth);
      scheduleAutoLogout(data.access_token);
    },
    [scheduleAutoLogout],
  );

  const hasRole = useCallback(
    (...roles: string[]) => {
      if (!auth.user?.roles?.length) return false;
      return roles.some((role) => auth.user?.roles.includes(role as never));
    },
    [auth.user?.roles],
  );

  useEffect(() => {
    if (!auth.accessToken) return;

    if (isTokenExpired(auth.accessToken)) {
      const id = window.setTimeout(() => logout("expired"), 0);
      return () => window.clearTimeout(id);
    }

    scheduleAutoLogout(auth.accessToken);
    return () => clearLogoutTimer();
  }, [auth.accessToken, clearLogoutTimer, logout, scheduleAutoLogout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: auth.user,
      accessToken: auth.accessToken,
      isAuthenticated: !!auth.accessToken && !!auth.user,
      login,
      logout,
      hasRole,
    }),
    [auth.accessToken, auth.user, hasRole, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}