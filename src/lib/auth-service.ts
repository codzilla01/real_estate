import { isSupabaseConfigured } from "@/lib/env";
import { demoGetSessionUser, demoSignIn, demoSignOut } from "@/lib/auth/demo-auth";
import type { AuthUser } from "@/lib/auth/rbac";

/** Sign in via Supabase Auth, or the demo layer when Supabase is absent. */
export async function signIn(email: string, password: string): Promise<AuthUser> {
  if (isSupabaseConfigured()) {
    const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
    const client = getSupabaseBrowserClient();
    if (!client) throw new Error("errors.generic");
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) throw new Error("auth.invalidCredentials");

    const { data: profile } = await client
      .from("profiles")
      .select("id, name, role, avatar, phone, is_active, created_at")
      .eq("id", data.user.id)
      .single();

    return {
      id: data.user.id,
      name: profile?.name ?? email.split("@")[0] ?? "User",
      email: data.user.email ?? email,
      role: (profile?.role as AuthUser["role"]) ?? "viewer",
      avatar: profile?.avatar ?? undefined,
      phone: profile?.phone ?? undefined,
      isActive: profile?.is_active ?? true,
      createdAt: profile?.created_at ?? new Date().toISOString(),
    };
  }
  return demoSignIn(email, password);
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
    const client = getSupabaseBrowserClient();
    if (client) await client.auth.signOut();
    return;
  }
  await demoSignOut();
}

/** Current user — demo session (client-side) or Supabase session. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  if (isSupabaseConfigured()) {
    const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    const { data } = await client.auth.getUser();
    if (!data.user) return null;
    const { data: profile } = await client
      .from("profiles")
      .select("id, name, role, avatar, phone, is_active, created_at")
      .eq("id", data.user.id)
      .single();
    return {
      id: data.user.id,
      name: profile?.name ?? data.user.email?.split("@")[0] ?? "User",
      email: data.user.email ?? "",
      role: (profile?.role as AuthUser["role"]) ?? "viewer",
      avatar: profile?.avatar ?? undefined,
      phone: profile?.phone ?? undefined,
      isActive: profile?.is_active ?? true,
      createdAt: profile?.created_at ?? new Date().toISOString(),
    };
  }
  return demoGetSessionUser();
}
