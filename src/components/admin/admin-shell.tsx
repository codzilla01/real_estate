"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserRound,
  CalendarDays,
  Handshake,
  MessageSquareText,
  BarChart3,
  Bell,
  History,
  Settings,
  ShieldCheck,
  LogOut,
  ExternalLink,
  Loader2,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAdminData } from "@/hooks/use-admin-data";
import { demoStore } from "@/lib/demo/store";
import { adminService } from "@/lib/admin-service";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LangSwitcher } from "@/components/layout/lang-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, initials } from "@/lib/utils";
import type { AppNotification } from "@/types";

const NAV_ITEMS = [
  { href: "/admin/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/admin/properties", key: "properties", icon: Building2 },
  { href: "/admin/leads", key: "leads", icon: Users },
  { href: "/admin/clients", key: "clients", icon: UserRound },
  { href: "/admin/agents", key: "agents", icon: ShieldCheck },
  { href: "/admin/appointments", key: "appointments", icon: CalendarDays },
  { href: "/admin/deals", key: "deals", icon: Handshake },
  { href: "/admin/inquiries", key: "inquiries", icon: MessageSquareText },
  { href: "/admin/reports", key: "reports", icon: BarChart3 },
  { href: "/admin/notifications", key: "notifications", icon: Bell },
  { href: "/admin/activity", key: "activity", icon: History },
  { href: "/admin/users", key: "users", icon: Users },
  { href: "/admin/settings", key: "settings", icon: Settings },
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("admin");
  const locale = useLocale() as "ar" | "en";
  const { user, loading, signOut, canAccessDashboard } = useAuth();
  const { version } = useAdminData();
  const router = useRouter();
  const params = useParams<{ slug?: string[] }>();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  // Path segments from params (locale is first segment)
  const segments = params?.slug ?? [];
  const currentPath = `/${["admin", ...segments].join("/")}`;
  const isLogin = currentPath === "/admin/login";

  // Count unread notifications (demo store)
  useEffect(() => {
    const notifs: AppNotification[] = demoStore.listNotifications();
    setUnread(notifs.filter((n) => !n.read).length);
  }, [version]);

  useEffect(() => {
    if (!loading && !canAccessDashboard) {
      router.replace(`/${locale}/admin/login`);
    }
  }, [loading, canAccessDashboard, router, locale]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" aria-hidden="true" />
      </div>
    );
  }

  if (isLogin) {
    return <>{children}</>;
  }

  if (!canAccessDashboard) return null;

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") {
      return currentPath === "/admin" || currentPath === "/admin/dashboard" || currentPath === "/admin/";
    }
    return currentPath.startsWith(href);
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <Link href="/" onClick={() => setSidebarOpen(false)}>
          <Logo compact />
        </Link>
        <Button
          variant="ghost"
          size="iconSm"
          className="lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Admin navigation">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive(item.href)
                ? "bg-gold/10 text-gold"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="flex-1">{t(item.key)}</span>
            {item.key === "notifications" && unread > 0 && (
              <Badge variant="gold" className="h-5 min-w-5 justify-center px-1.5 text-[10px]">
                {unread}
              </Badge>
            )}
          </Link>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar className="h-9 w-9">
            {user?.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
            <AvatarFallback className="bg-gold/15 text-gold">
              {user ? initials(user.name) : "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{user?.name}</p>
            <p className="truncate text-[11px] text-muted-foreground" dir="ltr">
              {user?.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="iconSm"
            onClick={signOut}
            aria-label={t("logout")}
            title={t("logout")}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 right-0 z-40 hidden w-64 border-l border-border bg-card lg:block rtl:right-0 ltr:left-0">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute inset-y-0 right-0 w-72 border-l border-border bg-card">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="lg:mr-64 ltr:lg:ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border glass px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="iconSm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-sm font-bold">{t("title")}</p>
              <p className="text-[11px] text-muted-foreground">
                {locale === "ar" ? "نظام إدارة العقارات" : "Real Estate OS"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {adminService.mode === "demo" && (
              <Badge variant="warning" className="hidden sm:inline-flex">
                {t("demoMode")}
              </Badge>
            )}
            <Link href="/">
              <Button variant="ghost" size="iconSm" aria-label={t("backToSite")} title={t("backToSite")}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
            <LangSwitcher />
            <ThemeToggle />
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
