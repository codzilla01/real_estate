import type { Role } from "@/types";
import { ROLE_PERMISSIONS } from "@/lib/constants";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

/** A user can always view the dashboard if they have any non-viewer staff role. */
export function canAccessDashboard(user: AuthUser | null): boolean {
  if (!user || !user.isActive) return false;
  return ROLE_PERMISSIONS[user.role]?.canAccessAdmin ?? false;
}

/** Users with manage-all rights can create/update/delete any entity. */
export function canManageAll(user: AuthUser | null): boolean {
  if (!user || !user.isActive) return false;
  return ROLE_PERMISSIONS[user.role]?.canManageAll ?? false;
}

/** Agents & editors are scoped to their own records. */
export function isScopedUser(user: AuthUser | null): boolean {
  if (!user) return false;
  return ROLE_PERMISSIONS[user.role]?.scoped ?? false;
}

/** Whether the user may manage a given entity's records (incl. others' records). */
export function canManageEntity(user: AuthUser | null): boolean {
  return canManageAll(user);
}

export function canManageUsers(user: AuthUser | null): boolean {
  return user?.role === "super_admin" || user?.role === "admin";
}

export function canManageSettings(user: AuthUser | null): boolean {
  return user?.role === "super_admin" || user?.role === "admin";
}

export function isStaff(user: AuthUser | null): boolean {
  return canAccessDashboard(user);
}

export function roleLabel(role: Role, locale: "ar" | "en"): string {
  const labels: Record<Role, { ar: string; en: string }> = {
    super_admin: { ar: "مدير النظام", en: "Super Admin" },
    admin: { ar: "مسؤول", en: "Admin" },
    manager: { ar: "مدير", en: "Manager" },
    agent: { ar: "وسيط", en: "Agent" },
    editor: { ar: "محرر", en: "Editor" },
    viewer: { ar: "مشاهد", en: "Viewer" },
  };
  return labels[role]?.[locale] ?? role;
}
