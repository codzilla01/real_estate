"use client";

import { useLocale, useTranslations } from "next-intl";
import { History } from "lucide-react";
import { useAdminCollection } from "@/hooks/use-admin-data";
import { adminService } from "@/lib/admin-service";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

const ACTION_TONE: Record<string, "success" | "warning" | "destructive" | "info" | "muted"> = {
  create: "success",
  update: "info",
  delete: "destructive",
  login: "muted",
  logout: "muted",
  status_change: "warning",
  price_change: "warning",
  assignment: "info",
};

export default function AdminActivityPage() {
  const locale = useLocale() as "ar" | "en";
  const t = useTranslations("admin");
  const { data: logs, loading } = useAdminCollection(() =>
    adminService.listActivityLogs(),
  );

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black">{t("activity")}</h1>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState icon={History} title={t("noActivity")} />
      ) : (
        <div className="relative space-y-3 before:absolute before:inset-y-2 before:right-[19px] before:w-px before:bg-border rtl:before:right-[19px] ltr:before:left-[19px]">
          {logs.map((log) => (
            <div key={log.id} className="relative flex items-start gap-4">
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card">
                <span className="h-2.5 w-2.5 rounded-full bg-gold" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1 rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold">
                    {log.entityLabel ?? log.entityType}
                  </p>
                  <Badge variant={ACTION_TONE[log.action] ?? "muted"}>{log.action}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
                  {log.entityType} · {formatDateTime(log.createdAt, locale)}
                </p>
                {log.details && Object.keys(log.details).length > 0 && (
                  <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-2 text-[10px] text-muted-foreground">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
