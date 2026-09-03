"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useAdminCollection } from "@/hooks/use-admin-data";
import { adminService } from "@/lib/admin-service";
import {
  LeadsOverTimeChart,
  RevenueChart,
  SalesRentalsChart,
  PropertyDistributionChart,
  AgentPerformanceChart,
} from "@/components/admin/charts";
import { KpiCard } from "@/components/admin/kpi-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Percent, CircleDollarSign, Banknote } from "lucide-react";
import { formatPrice, formatNumber } from "@/lib/utils";
import type { Lang } from "@/types";

export default function AdminReportsPage() {
  const locale = useLocale() as Lang;
  const t = useTranslations("admin");

  const { data: properties } = useAdminCollection(() => adminService.listProperties());
  const { data: leads } = useAdminCollection(() => adminService.listLeads());
  const { data: deals } = useAdminCollection(() => adminService.listDeals());
  const { data: agents } = useAdminCollection(() => adminService.listAgents());

  const stats = useMemo(() => {
    const completed = deals.filter((d) => d.status === "completed");
    const inProgress = deals.filter((d) => d.status === "in_progress");
    const revenue = completed.reduce((s, d) => s + d.amount, 0) + inProgress.reduce((s, d) => s + d.amount, 0);
    const commission = completed.reduce((s, d) => s + d.commission, 0);
    const wonLeads = leads.filter((l) => l.status === "won").length;
    const conversion = leads.length ? Math.round((wonLeads / leads.length) * 100) : 0;
    return { revenue, commission, conversion, wonLeads };
  }, [deals, leads]);

  const sourcePerformance = useMemo(() => {
    const map = new Map<string, number>();
    leads.forEach((l) => map.set(l.source, (map.get(l.source) ?? 0) + 1));
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [leads]);

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return d.getMonth();
  });
  const monthNames = locale === "ar"
    ? ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const leadsByMonth = months.map((m) => ({
    month: monthNames[m]!,
    leads: leads.filter((l) => new Date(l.createdAt).getMonth() === m).length,
  }));

  const revenueByMonth = months.map((m) => ({
    month: monthNames[m]!,
    revenue: deals
      .filter((d) => new Date(d.date).getMonth() === m)
      .reduce((s, d) => s + d.amount, 0),
  }));

  const salesRentals = months.map((m) => ({
    month: monthNames[m]!,
    sales: deals.filter((d) => d.type === "sale" && new Date(d.date).getMonth() === m).length,
    rentals: deals.filter((d) => d.type === "rent" && new Date(d.date).getMonth() === m).length,
  }));

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

  const distMap = new Map<string, number>();
  properties.forEach((p) => distMap.set(p.type, (distMap.get(p.type) ?? 0) + 1));
  const propertyDistribution = Array.from(distMap.entries()).map(([k, v]) => ({
    name: typeLabels[k] ?? k,
    value: v,
  }));

  const agentPerf = agents.map((agent) => {
    const agentDeals = deals.filter((d) => d.agentId === agent.id);
    return {
      name: agent.name,
      deals: agentDeals.length,
      revenue: agentDeals.reduce((s, d) => s + d.amount, 0),
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">{t("reportsTitle")}</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label={t("reportRevenue")} value={formatNumber(stats.revenue, locale)} icon={CircleDollarSign} tone="gold" />
        <KpiCard label={t("reportCommission")} value={formatPrice(stats.commission, "AED", locale)} icon={Banknote} tone="success" />
        <KpiCard label={t("reportConversion")} value={`${stats.conversion}%`} icon={Percent} tone="info" hint={`${stats.wonLeads} won`} />
        <KpiCard label={t("reportSales")} value={deals.filter((d) => d.type === "sale").length} icon={TrendingUp} tone="warning" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LeadsOverTimeChart data={leadsByMonth} />
        <RevenueChart data={revenueByMonth} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SalesRentalsChart data={salesRentals} />
        <PropertyDistributionChart data={propertyDistribution} />
        <AgentPerformanceChart data={agentPerf} />
      </div>

      {/* Source performance */}
      <Card>
        <CardContent className="p-5">
          <h3 className="mb-4 text-sm font-bold">{t("reportSourcePerformance")}</h3>
          <div className="space-y-3">
            {sourcePerformance.map(([source, count]) => {
              const max = sourcePerformance[0]?.[1] ?? 1;
              return (
                <div key={source} className="flex items-center gap-3">
                  <Badge variant="muted" className="w-24 justify-center">{source}</Badge>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gold-gradient"
                      style={{ width: `${(count / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-end text-xs font-semibold" dir="ltr">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
