import { describe, expect, it } from "vitest";
import { DEMO_USERS, demoGetSessionUser, demoSignIn, demoSignOut } from "./demo-auth";

describe("demo-auth", () => {
  it("exposes the documented demo accounts", () => {
    const emails = DEMO_USERS.map((u) => u.email);
    expect(emails).toContain("demo@almaktab.ae");
    expect(emails).toContain("manager@almaktab.ae");
    expect(emails).toContain("agent@almaktab.ae");
    expect(emails).toContain("viewer@almaktab.ae");
  });

  it("signs in with valid credentials and never returns the password", async () => {
    const user = await demoSignIn("demo@almaktab.ae", "demo1234");
    expect(user.email).toBe("demo@almaktab.ae");
    expect(user.name).toBeTruthy();
    expect((user as unknown as Record<string, unknown>).password).toBeUndefined();
  });

  it("rejects wrong credentials", async () => {
    await expect(demoSignIn("demo@almaktab.ae", "wrong")).rejects.toThrow();
    await expect(demoSignIn("nobody@almaktab.ae", "demo1234")).rejects.toThrow();
  });

  it("signs in case-insensitively on email", async () => {
    const user = await demoSignIn("  DEMO@ALMAKTAB.AE ", "demo1234");
    expect(user.id).toBe("user-demo-admin");
  });

  it("session helpers are no-ops without window (node env)", () => {
    expect(demoGetSessionUser()).toBeNull();
    expect(() => demoSignOut()).not.toThrow();
  });
});
