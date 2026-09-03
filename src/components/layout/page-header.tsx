import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ChevronRight, Home } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb?: Array<{ label: string; href?: string }>;
}

export async function PageHeader({
  title,
  subtitle,
  breadcrumb,
}: PageHeaderProps) {
  const t = await getTranslations("nav");

  const crumbs: Array<{ label: string; href?: string }> = [
    { label: t("home"), href: "/" },
    ...(breadcrumb ?? []),
  ];

  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-card/60 py-14">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgb(212_175_55/0.1),transparent_60%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {crumbs.map((crumb, index) => (
              <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                {index > 0 && (
                  <ChevronRight className="h-3 w-3 rtl:rotate-180" aria-hidden="true" />
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="inline-flex items-center gap-1 transition-colors hover:text-gold"
                  >
                    {index === 0 && <Home className="h-3 w-3" aria-hidden="true" />}
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground/70">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
        {subtitle && (
          <p className="mt-3 max-w-2xl text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </section>
  );
}
