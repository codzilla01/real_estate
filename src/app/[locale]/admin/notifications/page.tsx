"use client";

import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Bell, CheckCheck } from "lucide-react";
import { useAdminCollection, useAdminData } from "@/hooks/use-admin-data";
import { adminService } from "@/lib/admin-service";
import { demoStore } from "@/lib/demo/store";
import { timeAgo, l10n } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export default function AdminNotificationsPage() {
  const locale = useLocale() as "ar" | "en";
  const t = useTranslations("admin");
  const { data: notifications, loading } = useAdminCollection(() =>
    adminService.listNotifications(),
  );
  const { refresh } = useAdminData();

  const markAll = async () => {
    await adminService.markAllNotificationsRead();
    toast.success(locale === "ar" ? "تم التحديد" : "Marked");
    refresh();
  };

  const markOne = async (id: string) => {
    demoStore.markNotificationRead(id);
    refresh();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">{t("notifications")}</h1>
        <Button variant="outline" size="sm" onClick={markAll}>
          <CheckCheck className="h-4 w-4" aria-hidden="true" />
          {t("markAllRead")}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title={t("noNotifications")} />
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4 transition-colors",
                notification.read ? "border-border bg-card" : "border-gold/40 bg-gold/5",
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  notification.read ? "bg-muted text-muted-foreground" : "bg-gold/15 text-gold",
                )}
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {l10n(notification.title, locale)}
                </p>
                {notification.message && (
                  <p className="truncate text-xs text-muted-foreground">
                    {l10n(notification.message, locale)}
                  </p>
                )}
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {timeAgo(notification.createdAt, locale)}
                </p>
              </div>
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markOne(notification.id)}
                  className="text-xs"
                >
                  <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Read
                </Button>
              )}
              {notification.link && (
                <Link href={notification.link} className="text-xs font-semibold text-gold hover:text-gold-light">
                  {locale === "ar" ? "عرض" : "View"} →
                </Link>
              )}
              {!notification.read && <Badge variant="gold">new</Badge>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
