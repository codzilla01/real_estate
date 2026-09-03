import { describe, expect, it } from "vitest";
import type { AuthUser } from "./rbac";
import {
  canAccessDashboard,
  canManageAll,
  canManageSettings,
  canManageUsers,
  isScopedUser,
  isStaff,
  roleLabel,
} from "./rbac";

function user(role: AuthUser["role"], active = true): AuthUser {
  return {
    id: `u-${role}`,
    name: role,
    email: `${role}@test.ae`,
    role,
    isActive: active,
    createdAt: new Date().toISOString(),
  };
}

describe("rbac", () => {
  it("denies access for null and inactive users", () => {
    expect(canAccessDashboard(null)).toBe(false);
    expect(canAccessDashboard(user("admin", false))).toBe(false);
    expect(canManageAll(null)).toBe(false);
  });

  it("allows dashboard access for all staff roles", () => {
    for (const role of ["super_admin", "admin", "manager", "agent", "editor", "viewer"] as const) {
      expect(canAccessDashboard(user(role))).toBe(true);
    }
  });

  it("manage-all is reserved for super_admin, admin, manager", () => {
    expect(canManageAll(user("super_admin"))).toBe(true);
    expect(canManageAll(user("admin"))).toBe(true);
    expect(canManageAll(user("manager"))).toBe(true);
    expect(canManageAll(user("agent"))).toBe(false);
    expect(canManageAll(user("editor"))).toBe(false);
    expect(canManageAll(user("viewer"))).toBe(false);
  });

  it("agents/editors/viewers are scoped users", () => {
    expect(isScopedUser(user("agent"))).toBe(true);
    expect(isScopedUser(user("editor"))).toBe(true);
    expect(isScopedUser(user("super_admin"))).toBe(false);
    expect(isScopedUser(null)).toBe(false);
  });

  it("users/settings management is super_admin/admin only", () => {
    expect(canManageUsers(user("super_admin"))).toBe(true);
    expect(canManageUsers(user("admin"))).toBe(true);
    expect(canManageUsers(user("manager"))).toBe(false);
    expect(canManageSettings(user("admin"))).toBe(true);
    expect(canManageSettings(user("agent"))).toBe(false);
  });

  it("isStaff mirrors dashboard access", () => {
    expect(isStaff(user("manager"))).toBe(true);
    expect(isStaff(user("viewer", false))).toBe(false);
  });

  it("roleLabel localizes", () => {
    expect(roleLabel("super_admin", "ar")).toBe("مدير النظام");
    expect(roleLabel("admin", "en")).toBe("Admin");
  });
});
