import { describe, expect, it } from "vitest";
import {
  buildTelLink,
  buildWhatsAppLink,
  cn,
  formatCompact,
  formatDate,
  formatPrice,
  initials,
  isEmailValid,
  isPhoneValid,
  l10n,
  normalizePhone,
  slugify,
  stripHtml,
  truncate,
  uid,
} from "./utils";

describe("utils", () => {
  it("cn merges tailwind classes", () => {
    expect(cn("px-2", "px-3")).toBe("px-3");
    expect(cn("a", false, undefined, "b")).toBe("a b");
  });

  it("l10n picks the localized value with fallback", () => {
    const text = { ar: "فيلا", en: "Villa" };
    expect(l10n(text, "ar")).toBe("فيلا");
    expect(l10n(text, "en")).toBe("Villa");
    expect(l10n(undefined, "ar")).toBe("");
    expect(l10n({ ar: "", en: "Fallback" }, "ar")).toBe("Fallback");
  });

  it("slugify produces safe slugs", () => {
    expect(slugify("Palm Jumeirah Villa")).toBe("palm-jumeirah-villa");
    expect(slugify("  Hello   World!! ")).toBe("hello-world");
    expect(slugify("قلعة زعبيل")).toBe("");
    expect(slugify("Villa 1 — Marina")).toBe("villa-1-marina");
  });

  it("formatPrice formats AED with compact notation for millions", () => {
    const en = formatPrice(2_500_000, "AED", "en");
    expect(en).toMatch(/AED/);
    expect(en).toMatch(/M/);
    const ar = formatPrice(500_000, "AED", "ar");
    expect(ar.length).toBeGreaterThan(0);
  });

  it("formatDate formats ISO strings", () => {
    const out = formatDate("2025-01-15", "en");
    expect(out).toMatch(/2025/);
  });

  it("formatCompact uses compact notation", () => {
    expect(formatCompact(1_500, "en")).toMatch(/1\.5/);
  });

  it("uid is unique with prefix", () => {
    const a = uid("prop");
    const b = uid("prop");
    expect(a.startsWith("prop_")).toBe(true);
    expect(a).not.toBe(b);
  });

  it("initials extracts up to two initials", () => {
    expect(initials("Mohannad Abdulkhalek")).toBe("MA");
    expect(initials("علي")).toBe("ع");
  });

  it("buildWhatsAppLink strips non-digits and encodes message", () => {
    expect(buildWhatsAppLink("+971 50 123 4567", "Hello")).toBe(
      "https://wa.me/971501234567?text=Hello",
    );
    expect(buildWhatsAppLink("971501234567", "Hi there")).toContain(
      encodeURIComponent("Hi there"),
    );
  });

  it("buildTelLink removes spaces", () => {
    expect(buildTelLink("+971 50 123 4567")).toBe("tel:+971501234567");
  });

  it("stripHtml removes tags", () => {
    expect(stripHtml("<p>Hello <b>World</b></p>")).toBe("Hello World");
  });

  it("truncate appends ellipsis", () => {
    expect(truncate("abcdef", 3)).toBe("abc…");
    expect(truncate("abc", 5)).toBe("abc");
  });

  it("isEmailValid / isPhoneValid / normalizePhone", () => {
    expect(isEmailValid("a@b.com")).toBe(true);
    expect(isEmailValid("nope")).toBe(false);
    expect(isPhoneValid("+971501234567")).toBe(true);
    expect(isPhoneValid("12")).toBe(false);
    expect(normalizePhone("+971 50 123-4567")).toBe("+971501234567");
  });
});
