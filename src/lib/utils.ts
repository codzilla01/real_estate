import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { LocalizedText, Lang } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Pick the localized string for the given locale, falling back to the other locale then empty. */
export function l10n(text: LocalizedText | undefined, locale: Lang): string {
  if (!text) return "";
  return text[locale]?.trim() || text[locale === "ar" ? "en" : "ar"] || "";
}

export function slugify(input: string): string {
  return input
    .toString()
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatPrice(price: number, currency = "AED", locale: Lang = "ar"): string {
  const localeTag = locale === "ar" ? "ar-AE" : "en-US";
  try {
    return new Intl.NumberFormat(localeTag, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
      notation: price >= 1_000_000 ? "compact" : "standard",
    }).format(price);
  } catch {
    return `${price.toLocaleString(localeTag)} ${currency}`;
  }
}

export function formatNumber(value: number, locale: Lang = "ar"): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-US").format(value);
}

export function formatDate(date: string | Date, locale: Lang = "ar"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-AE" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return d.toDateString();
  }
}

export function formatDateTime(date: string | Date, locale: Lang = "ar"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-AE" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return d.toString();
  }
}

export function formatCompact(value: number, locale: Lang = "ar"): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function timeAgo(date: string | Date, locale: Lang = "ar"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale === "ar" ? "ar" : "en", {
    numeric: "auto",
  });
  const intervals: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ];
  for (const [unit, secondsInUnit] of intervals) {
    if (seconds >= secondsInUnit) {
      return rtf.format(-Math.floor(seconds / secondsInUnit), unit);
    }
  }
  return rtf.format(-seconds, "second");
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

export function buildWhatsAppLink(
  phone: string,
  message: string,
): string {
  const clean = phone.replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function buildTelLink(phone: string): string {
  return `tel:${phone.replace(/\s/g, "")}`;
}

/** Build the default WhatsApp message for a property, localized. */
export function propertyWhatsAppMessage(
  propertyTitle: string,
  locale: Lang,
): string {
  return locale === "ar"
    ? `مرحبًا، أنا مهتم بالعقار: ${propertyTitle}`
    : `Hello, I'm interested in this property: ${propertyTitle}`;
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length).trim()}…`;
}

export function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]!);
  const escapeCell = (value: unknown) => {
    const str = String(value ?? "").replace(/"/g, '""');
    return /[",\n]/.test(str) ? `"${str}"` : str;
  };
  const csv = [
    headers.map(escapeCell).join(","),
    ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(",")),
  ].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function isEmailValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isPhoneValid(phone: string): boolean {
  return /^[+\d][\d\s-]{6,}$/.test(phone.trim());
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

/** Hash a string (used for demo auth only — real auth uses Supabase). */
export async function hashString(input: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const data = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
