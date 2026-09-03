"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useLocale } from "next-intl";

const GOLD = "#d4af37";
const GOLD_LIGHT = "#e9c95a";
const GOLD_DARK = "#a87e1f";
const EMERALD = "#10b981";
const MUTED = "#98a0ad";

const tooltipStyle = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "0.5rem",
  color: "var(--foreground)",
  fontSize: "12px",
};

function ChartCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 shadow-sm ${className ?? ""}`}>
      <h3 className="mb-4 text-sm font-bold">{title}</h3>
      <div className="h-64">{children}</div>
    </div>
  );
}

export function LeadsOverTimeChart({ data }: { data: Array<{ month: string; leads: number }> }) {
  return (
    <ChartCard title="Leads Over Time">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="leads" stroke={GOLD} strokeWidth={2.5} dot={{ fill: GOLD_LIGHT, r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function RevenueChart({ data }: { data: Array<{ month: string; revenue: number }> }) {
  const locale = useLocale();
  return (
    <ChartCard title="Revenue">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 10, fill: MUTED }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) =>
              new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-US", {
                notation: "compact",
              }).format(v)
            }
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [
              new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-US", {
                notation: "compact",
              }).format(Number(value) || 0),
              "AED",
            ]}
          />
          <Bar dataKey="revenue" fill={GOLD} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function SalesRentalsChart({
  data,
}: {
  data: Array<{ month: string; sales: number; rentals: number }>;
}) {
  return (
    <ChartCard title="Sales & Rentals">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="sales" name="Sales" fill={GOLD} radius={[4, 4, 0, 0]} />
          <Bar dataKey="rentals" name="Rentals" fill={EMERALD} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function PropertyDistributionChart({
  data,
}: {
  data: Array<{ name: string; value: number }>;
}) {
  const COLORS = [GOLD, GOLD_LIGHT, GOLD_DARK, EMERALD, MUTED, "#f59e0b", "#6366f1"];
  return (
    <ChartCard title="Property Distribution">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3}>
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]!} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function AgentPerformanceChart({
  data,
}: {
  data: Array<{ name: string; deals: number; revenue: number }>;
}) {
  const locale = useLocale();
  return (
    <ChartCard title="Agent Performance">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 30, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: MUTED }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) =>
              new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-US", { notation: "compact" }).format(v)
            }
          />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} width={90} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="revenue" name="Revenue" fill={GOLD} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
