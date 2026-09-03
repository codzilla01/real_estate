"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser } from "@/lib/auth/rbac";
import {
  canAccessDashboard,
  canManageAll,
  canManageSettings,
  canManageUsers,
  isScopedUser,
  isStaff,
  roleLabel,
} from "@/lib/auth/rbac";
import { getCurrentUser, signIn as doSignIn, signOut as doSignOut } from "@/lib/auth-service";
import type { Lang, Role } from "@/types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  canAccessDashboard: boolean;
  canManageAll: boolean;
  canManageUsers: boolean;
  canManageSettings: boolean;
  isScoped: boolean;
  isStaff: boolean;
  roleLabel: (locale: Lang) => string;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const current = await getCurrentUser();
      setUser(current);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    const authUser = await doSignIn(email, password);
    setUser(authUser);
    return authUser;
  }, []);

  const signOut = useCallback(async () => {
    await doSignOut();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signIn,
      signOut,
      refresh,
      canAccessDashboard: canAccessDashboard(user),
      canManageAll: canManageAll(user),
      canManageUsers: canManageUsers(user),
      canManageSettings: canManageSettings(user),
      isScoped: isScopedUser(user),
      isStaff: isStaff(user),
      roleLabel: (locale) => (user ? roleLabel(user.role, locale) : ""),
      hasRole: (...roles) => Boolean(user && roles.includes(user.role)),
    }),
    [user, loading, signIn, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
