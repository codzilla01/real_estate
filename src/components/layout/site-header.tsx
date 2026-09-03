"use client";

import { useState } from "react";
import { Menu, Heart, LayoutDashboard, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/logo";
import { LangSwitcher } from "@/components/layout/lang-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useFavorites } from "@/hooks/use-favorites";

export function SiteHeader() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, canAccessDashboard } = useAuth();
  const { count } = useFavorites();

  const links: Array<{ href: string; label: string }> = [
    { href: "/", label: t("home") },
    { href: "/properties", label: t("properties") },
    { href: "/buy", label: t("buy") },
    { href: "/rent", label: t("rent") },
    { href: "/projects", label: t("projects") },
    { href: "/agents", label: t("agents") },
    { href: "/locations", label: t("locations") },
    { href: "/about", label: t("about") },
    { href: "/services", label: t("services") },
    { href: "/contact", label: t("contact") },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="shrink-0" aria-label="Al Maktab Al Aqari — Home">
          <Logo />
        </Link>

        <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-gold",
                isActive(link.href)
                  ? "text-gold"
                  : "text-foreground/80",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link href="/favorites" aria-label={t("favorites")} className="relative">
            <Button variant="ghost" size="iconSm" className="rounded-full">
              <Heart className="h-4 w-4" aria-hidden="true" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-black">
                  {count}
                </span>
              )}
            </Button>
          </Link>
          <LangSwitcher />
          <ThemeToggle />
          {canAccessDashboard ? (
            <Link href="/admin">
              <Button variant="darkGold" size="sm" className="hidden sm:inline-flex">
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                {t("admin")}
              </Button>
            </Link>
          ) : (
            <Link href="/admin">
              <Button variant="gold" size="sm" className="hidden sm:inline-flex">
                {t("login")}
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            size="iconSm"
            className="rounded-full lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          className="lg:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl px-4 py-4 animate-fade-in"
          aria-label="Mobile navigation"
        >
          <div className="grid grid-cols-2 gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted",
                  isActive(link.href) ? "text-gold bg-gold/5" : "",
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            {canAccessDashboard ? (
              <Link href="/admin" className="flex-1" onClick={() => setMobileOpen(false)}>
                <Button variant="darkGold" className="w-full">
                  <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                  {t("admin")}
                </Button>
              </Link>
            ) : (
              <Link href="/admin" className="flex-1" onClick={() => setMobileOpen(false)}>
                <Button variant="gold" className="w-full">
                  {t("login")}
                </Button>
              </Link>
            )}
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            {user ? `${user.name} — ${user.email}` : ""}
          </p>
        </nav>
      )}
    </header>
  );
}
