import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { setUnauthorizedHandler } from "@/api/client";
import { getCurrentUser, login, logout, register } from "@/api/endpoints";
import type { AuthUser, Credentials } from "@/api/types";
import { AuthContext, authKeys, type AuthContextValue } from "./context";

// setTimeout overflows above ~24.8 days.
const MAX_TIMEOUT = 2_147_483_647;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [sessionExpired, setSessionExpired] = useState(false);

  const { data: user = null, isPending } = useQuery({
    queryKey: authKeys.me,
    queryFn: getCurrentUser,
    staleTime: Infinity,
    retry: false,
  });

  const userRef = useRef<AuthUser | null>(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const clearSession = useCallback(
    (expired: boolean) => {
      queryClient.setQueryData(authKeys.me, null);
      // Drop every cached server response that belonged to the previous user.
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== "auth" });
      setSessionExpired(expired);
    },
    [queryClient],
  );

  // Any 401 from an authenticated endpoint means the session is gone (expired or revoked).
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (userRef.current) clearSession(true);
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  // Sign out locally the moment the token expires.
  useEffect(() => {
    if (!user?.expiresAt) return;
    const remaining = new Date(user.expiresAt).getTime() - Date.now();
    const timer = window.setTimeout(
      () => clearSession(true),
      Math.max(0, Math.min(remaining, MAX_TIMEOUT)),
    );
    return () => window.clearTimeout(timer);
  }, [user, clearSession]);

  const signIn = useCallback(
    async (credentials: Credentials) => {
      const signedIn = await login(credentials);
      setSessionExpired(false);
      queryClient.setQueryData(authKeys.me, signedIn);
      return signedIn;
    },
    [queryClient],
  );

  const signUp = useCallback(
    async (credentials: Credentials) => {
      await register(credentials);
      return signIn(credentials);
    },
    [signIn],
  );

  const signOut = useCallback(async () => {
    try {
      await logout();
    } finally {
      clearSession(false);
    }
  }, [clearSession]);

  const endSession = useCallback(() => clearSession(false), [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading: isPending,
      isAdmin: user?.role === "ADMIN",
      sessionExpired,
      signIn,
      signUp,
      signOut,
      endSession,
    }),
    [user, isPending, sessionExpired, signIn, signUp, signOut, endSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
