"use client";

import { useLocale, useTranslations } from "next-intl";
import { ShieldCheck } from "lucide-react";
import { DEMO_USERS } from "@/lib/auth/demo-auth";
import { roleLabel } from "@/lib/auth/rbac";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { initials } from "@/lib/utils";

export default function AdminUsersPage() {
  const locale = useLocale() as "ar" | "en";
  const t = useTranslations("admin");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">{t("users")}</h1>
        <Badge variant="gold">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          {t("userRole")}: RBAC
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_USERS.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
                  <AvatarFallback className="bg-gold/15 font-black text-gold">
                    {initials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground" dir="ltr">
                    {user.email}
                  </p>
                </div>
                <Badge variant={user.isActive ? "success" : "muted"}>
                  {user.isActive ? (locale === "ar" ? "نشط" : "Active") : (locale === "ar" ? "غير نشط" : "Inactive")}
                </Badge>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <Badge variant="goldSoft">{roleLabel(user.role, locale)}</Badge>
                <span className="text-[10px] text-muted-foreground">
                  {user.lastLogin ? formatDate(user.lastLogin, locale) : ""}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
        {locale === "ar"
          ? "في وضع الإنتاج، تُدار المستخدمون عبر Supabase Auth ولوحة Supabase، مع صلاحيات RLS."
          : "In production, users are managed via Supabase Auth with RLS-based permissions."}
      </p>
    </div>
  );
}
