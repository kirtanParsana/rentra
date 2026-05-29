import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { login as loginApi, register as registerApi } from "../api/auth";
import { verifySession } from "../api/session";
import { ApiError } from "../api/http";
import { clearAuthStorage, readAuthFromStorage, writeAuthToStorage } from "../utils/authStorage";
import { isJwtExpired } from "../utils/jwt";

const AuthContext = createContext(null);

function normalizeAuthResponse(data) {
  const token = typeof data?.token === "string" ? data.token : "";
  const user = data?.user ?? null;
  return { token, user };
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => readAuthFromStorage());
  const [isCheckingSession, setIsCheckingSession] = useState(Boolean(auth.token));
  const abortRef = useRef(null);
  const tokenRef = useRef(auth.token);

  useEffect(() => {
    tokenRef.current = auth.token;
  }, [auth.token]);

  const logout = useCallback(() => {
    abortRef.current?.abort?.();
    abortRef.current = null;
    clearAuthStorage();
    setAuth({ token: "", user: null });
    setIsCheckingSession(false);
  }, []);

  const persist = useCallback(
    (data) => {
      const next = writeAuthToStorage(normalizeAuthResponse(data));
      setAuth(next);
      return next;
    },
    [setAuth]
  );

  const login = useCallback(
    async (payload) => {
      const data = await loginApi(payload);
      return persist(data);
    },
    [persist]
  );

  const register = useCallback(
    async (payload) => {
      const data = await registerApi(payload);
      return persist(data);
    },
    [persist]
  );

  useEffect(() => {
    const token = auth.token;

    if (!token) {
      setIsCheckingSession(false);
      return;
    }

    if (isJwtExpired(token)) {
      logout();
      return;
    }

    const controller = new AbortController();
    abortRef.current?.abort?.();
    abortRef.current = controller;
    setIsCheckingSession(true);

    (async () => {
      try {
        await verifySession(token, { signal: controller.signal });
      } catch (err) {
        // Only clear session on auth failures; keep session on transient network errors.
        const isAuthFailure = err instanceof ApiError && (err.status === 401 || err.status === 403);
        if (isAuthFailure) {
          logout();
        }
      } finally {
        if (!controller.signal.aborted && tokenRef.current === token) {
          setIsCheckingSession(false);
        }
      }
    })();

    return () => controller.abort();
  }, [auth.token, logout]);

  const value = useMemo(
    () => ({
      token: auth.token,
      user: auth.user,
      isCheckingSession,
      login,
      register,
      logout,
      isAuthenticated: Boolean(auth.token && auth.user),
    }),
    [auth.token, auth.user, isCheckingSession, login, logout, register]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

