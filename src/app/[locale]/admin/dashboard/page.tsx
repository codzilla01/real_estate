"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import {
  Building2,
  CircleCheck,
  CircleDollarSign,
  Flame,
  CalendarDays,
  Handshake,
  Users,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAdminCollection } from "@/hooks/use-admin-data";
import { adminService } from "@/lib/admin-service";
import { KpiCard } from "@/components/admin/kpi-card";
import {
  LeadsOverTimeChart,
  RevenueChart,
  PropertyDistributionChart,
  AgentPerformanceChart,
  SalesRentalsChart,
} from "@/components/admin/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCompact, formatPrice, timeAgo } from "@/lib/utils";
import type { Lang } from "@/types";

const MONTH_NAMES_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const MONTH_NAMES_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function AdminDashboardPage() {
  const locale = useLocale() as Lang;
  const t = useTranslations("admin");
  const { user } = useAuth();

  const { data: properties, loading: loadingProps } = useAdminCollection(() =>
    adminService.listProperties(),
  );
  const { data: leads } = useAdminCollection(() => adminService.listLeads());
  const { data: agents } = useAdminCollection(() => adminService.listAgents());
  const { data: appointments } = useAdminCollection(() => adminService.listAppointments());
  const { data: deals } = useAdminCollection(() => adminService.listDeals());
  const { data: notifications } = useAdminCollection(() => adminService.listNotifications());
  const { data: activity } = useAdminCollection(() => adminService.listActivityLogs());

  const stats = useMemo(() => {
    const available = properties.filter((p) => p.status === "available").length;
    const sold = properties.filter((p) => p.status === "sold").length;
    const rented = properties.filter((p) => p.status === "rented").length;
    const hotLeads = leads.filter((l) => l.priority === "hot").length;
    const viewings = appointments.filter((a) => a.type === "viewing" && a.status === "scheduled").length;
    const revenue = deals
      .filter((d) => d.status === "completed" || d.status === "in_progress")
      .reduce((sum, d) => sum + d.amount, 0);
    const commission = deals
      .filter((d) => d.status === "completed")
      .reduce((sum, d) => sum + d.commission, 0);
    return { available, sold, rented, hotLeads, viewings, revenue, commission };
  }, [properties, leads, appointments, deals]);

  const charts = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return d.getMonth();
    });

    const leadsByMonth = months.map((m) => {
      const count = leads.filter((l) => {
        const lm = new Date(l.createdAt).getMonth();
        const lyr = new Date(l.createdAt).getFullYear();
        const y = new Date().getFullYear();
        return lm === m && lyr === y;
      }).length;
      return { month: (locale === "ar" ? MONTH_NAMES_AR : MONTH_NAMES_EN)[m]!, leads: count };
    });

    const revenueByMonth = months.map((m) => ({
      month: (locale === "ar" ? MONTH_NAMES_AR : MONTH_NAMES_EN)[m]!,
      revenue: deals
        .filter((d) => new Date(d.date).getMonth() === m)
        .reduce((sum, d) => sum + d.amount, 0),
    }));

    const salesRentals = months.map((m) => ({
      month: (locale === "ar" ? MONTH_NAMES_AR : MONTH_NAMES_EN)[m]!,
      sales: deals.filter((d) => d.type === "sale" && new Date(d.date).getMonth() === m).length,
      rentals: deals.filter((d) => d.type === "rent" && new Date(d.date).getMonth() === m).length,
    }));

    const distMap = new Map<string, number>();
    properties.forEach((p) => {
      const key = p.type;
      distMap.set(key, (distMap.get(key) ?? 0) + 1);
    });
    const typeLabels: Record<string, string> = {
      villa: locale === "ar" ? "فيلا" : "Villa",
      apartment: locale === "ar" ? "شقة" : "Apartment",
      penthouse: locale === "ar" ? "بنتهاوس" : "Penthouse",
      townhouse: locale === "ar" ? "تاون هاوس" : "Townhouse",
      palace: locale === "ar" ? "قصر" : "Palace",
      duplex: locale === "ar" ? "دوبلكس" : "Duplex",
      commercial: locale === "ar" ? "تجاري" : "Commercial",
      office: locale === "ar" ? "مكتب" : "Office",
      land: locale === "ar" ? "أرض" : "Land",
    };
    const propertyDistribution = Array.from(distMap.entries()).map(([key, value]) => ({
      name: typeLabels[key] ?? key,
      value,
    }));

    const agentPerf = agents.map((agent) => {
      const agentDeals = deals.filter((d) => d.agentId === agent.id);
      return {
        name: agent.name,
        deals: agentDeals.length,
        revenue: agentDeals.reduce((sum, d) => sum + d.amount, 0),
      };
    });

    return { leadsByMonth, revenueByMonth, salesRentals, propertyDistribution, agentPerf };
  }, [leads, deals, properties, agents, locale]);

  const upcomingAppointments = useMemo(
    () =>
      appointments
        .filter((a) => a.status === "scheduled")
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5),
    [appointments],
  );

  const recentLeads = useMemo(() => leads.slice(0, 5), [leads]);

  const recentActivity = useMemo(() => activity.slice(0, 6), [activity]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">
            {t("welcome")}, {user?.name} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date().toLocaleDateString(locale === "ar" ? "ar-AE" : "en-US", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <Link href="/admin/properties">
          <span className="inline-flex items-center gap-2 rounded-lg bg-gold-gradient px-4 py-2 text-sm font-bold text-black shadow-gold-glow transition-transform hover:scale-[1.02]">
            + {t("newProperty")}
          </span>
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard
          label={t("kpiTotalProperties")}
          value={loadingProps ? "…" : properties.length}
          icon={Building2}
          tone="gold"
          hint={`${stats.available} ${t("kpiAvailable")}`}
        />
        <KpiCard
          label={t("kpiTotalLeads")}
          value={leads.length}
          icon={Users}
          tone="info"
          hint={`${stats.hotLeads} ${t("kpiHotLeads")}`}
        />
        <KpiCard
          label={t("kpiViewings")}
          value={stats.viewings}
          icon={CalendarDays}
          tone="warning"
        />
        <KpiCard
          label={t("kpiDeals")}
          value={deals.length}
          icon={Handshake}
          tone="success"
        />
        <KpiCard
          label={t("kpiRevenue")}
          value={formatCompact(stats.revenue, locale)}
          icon={CircleDollarSign}
          tone="default"
          hint={formatPrice(stats.commission, "AED", locale)}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LeadsOverTimeChart data={charts.leadsByMonth} />
        <RevenueChart data={charts.revenueByMonth} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SalesRentalsChart data={charts.salesRentals} />
        <PropertyDistributionChart data={charts.propertyDistribution} />
        <AgentPerformanceChart data={charts.agentPerf} />
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("upcomingAppointments")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingAppointments.length === 0 ? (
              <EmptyState title={t("noAppointments")} className="py-8" />
            ) : (
              upcomingAppointments.map((appt) => (
                <div key={appt.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{appt.clientName}</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">
                      {appt.date} {appt.time}
                    </p>
                  </div>
                  <Badge variant={appt.date === today ? "gold" : "muted"}>
                    {appt.date === today ? (locale === "ar" ? "اليوم" : "Today") : appt.date.slice(5)}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("recentLeads")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentLeads.length === 0 ? (
              <EmptyState title={t("noLeads")} className="py-8" />
            ) : (
              recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{lead.name}</p>
                    <p className="truncate text-xs text-muted-foreground" dir="ltr">
                      {lead.phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {lead.priority === "hot" && (
                      <Flame className="h-4 w-4 text-destructive" aria-label="Hot" />
                    )}
                    <Badge variant="goldSoft">{lead.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("recentActivity")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentActivity.length === 0 ? (
              <EmptyState title={t("noActivity")} className="py-8" />
            ) : (
              recentActivity.map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 rounded-lg border border-border p-2.5">
                  <CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">
                      {log.entityLabel ?? log.entityType}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {log.action} · {timeAgo(log.createdAt, locale)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {notifications.length > 0 && (
        <Link
          href="/admin/notifications"
          className="flex items-center gap-2 text-sm font-semibold text-gold hover:text-gold-light"
        >
          {t("recentNotifications")} ({notifications.filter((n) => !n.read).length})
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
