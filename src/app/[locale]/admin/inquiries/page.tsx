"use client";

import { useLocale, useTranslations } from "next-intl";
import { MessageSquareText, Phone, Mail } from "lucide-react";
import { useAdminCollection } from "@/hooks/use-admin-data";
import { adminService } from "@/lib/admin-service";
import { timeAgo, l10n } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

export default function AdminInquiriesPage() {
  const locale = useLocale() as "ar" | "en";
  const t = useTranslations("admin");
  const { data: inquiries, loading } = useAdminCollection(() =>
    adminService.listInquiries(),
  );
  const { data: properties } = useAdminCollection(() => adminService.listProperties());

  const propertyName = (id?: string) => {
    const p = properties.find((x) => x.id === id);
    return p ? l10n(p.title, locale) : "";
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black">{t("inquiries")}</h1>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : inquiries.length === 0 ? (
        <EmptyState
          icon={MessageSquareText}
          title={t("noInquiries") ?? "No inquiries"}
          description={locale === "ar" ? "ستظهر استفسارات الموقع هنا" : "Website inquiries will appear here"}
        />
      ) : (
        <div className="space-y-3">
          {inquiries.map((inquiry) => (
            <Card key={inquiry.id}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold">{inquiry.name}</p>
                      <Badge variant={inquiry.status === "new" ? "gold" : "muted"}>
                        {inquiry.status}
                      </Badge>
                      <Badge variant="muted">{inquiry.source}</Badge>
                    </div>
                    {inquiry.subject && (
                      <p className="mt-1 text-sm font-semibold text-gold">{inquiry.subject}</p>
                    )}
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {inquiry.message}
                    </p>
                    {inquiry.propertyId && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        🏠 {propertyName(inquiry.propertyId)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 text-xs text-muted-foreground">
                    <a href={`tel:${inquiry.phone}`} className="flex items-center gap-1 hover:text-gold" dir="ltr">
                      <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                      {inquiry.phone}
                    </a>
                    {inquiry.email && (
                      <a href={`mailto:${inquiry.email}`} className="flex items-center gap-1 hover:text-gold" dir="ltr">
                        <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                        {inquiry.email}
                      </a>
                    )}
                    <span className="mt-1 text-[10px]">{timeAgo(inquiry.createdAt, locale)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
