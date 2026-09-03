import type { AuthUser } from "@/lib/auth/rbac";

/**
 * Demo authentication used when Supabase is not configured.
 * Seeded accounts let you explore every role without a real backend.
 * NEVER ship real credentials here — in production, Supabase Auth is used.
 */

export const DEMO_USERS: AuthUser[] = [
  {
    id: "user-demo-admin",
    name: "مدير النظام",
    email: "demo@almaktab.ae",
    password: "demo1234",
    role: "super_admin",
    avatar: "",
    phone: "+971 50 000 0000",
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-demo-manager",
    name: "Manager Demo",
    email: "manager@almaktab.ae",
    password: "manager1234",
    role: "manager",
    avatar: "",
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-demo-agent",
    name: "Agent Demo",
    email: "agent@almaktab.ae",
    password: "agent1234",
    role: "agent",
    avatar: "",
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-demo-viewer",
    name: "Viewer Demo",
    email: "viewer@almaktab.ae",
    password: "viewer1234",
    role: "viewer",
    avatar: "",
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
] as unknown as AuthUser[];

const SESSION_KEY = "ama2_demo_session";

export interface DemoSession {
  userId: string;
  token: string;
  expiresAt: number;
}

export async function demoSignIn(
  email: string,
  password: string,
): Promise<AuthUser> {
  await new Promise((resolve) => setTimeout(resolve, 400)); // simulate network
  const user = DEMO_USERS.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
  ) as (AuthUser & { password?: string }) | undefined;

  if (!user || user.password !== password) {
    throw new Error("auth.invalidCredentials");
  }
  if (!user.isActive) {
    throw new Error("auth.invalidCredentials");
  }

  const session: DemoSession = {
    userId: user.id,
    token: `demo_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  const { password: _pw, ...safeUser } = user;
  return safeUser as AuthUser;
}

export async function demoSignOut(): Promise<void> {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

export function demoGetSessionUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as DemoSession;
    if (session.expiresAt < Date.now()) {
      window.localStorage.removeItem(SESSION_KEY);
      return null;
    }
    const user = DEMO_USERS.find((u) => u.id === session.userId) as
      | (AuthUser & { password?: string })
      | undefined;
    if (!user) return null;
    const { password: _pw, ...safeUser } = user;
    return safeUser as AuthUser;
  } catch {
    return null;
  }
}
