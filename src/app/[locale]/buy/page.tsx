import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { fetchProperties } from "@/lib/data-service";
import { PropertiesExplorer } from "@/components/property/properties-explorer";
import { filtersFromParams } from "@/lib/search-params";
import { PageHeader } from "@/components/layout/page-header";
import type { Lang } from "@/types";

interface BuyPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: BuyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    title: t("buyTitle"),
    description: t("homeDescription"),
    alternates: { canonical: `/${locale}/buy` },
  };
}

export default async function BuyPage({ params }: BuyPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("properties");

  const { items } = await fetchProperties(
    { dealType: "sale", status: "available" },
    1,
    200,
  );

  const paramsObj = new URLSearchParams({ dealType: "sale" });

  return (
    <>
      <PageHeader
        title={t("buyTitle")}
        subtitle={t("buySubtitle")}
      />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <PropertiesExplorer
          properties={items}
          initialFilters={filtersFromParams(paramsObj)}
          locale={locale as Lang}
        />
      </section>
    </>
  );
}
