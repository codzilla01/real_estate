import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { fetchProperties } from "@/lib/data-service";
import { serializeSearchParams } from "@/lib/property-filters";
import { PropertiesExplorer } from "@/components/property/properties-explorer";
import { filtersFromParams, urlSearchFromParams } from "@/lib/search-params";
import { PageHeader } from "@/components/layout/page-header";
import type { Lang } from "@/types";

interface PropertiesPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
}: PropertiesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    title: t("propertiesTitle"),
    description: t("homeDescription"),
    alternates: { canonical: `/${locale}/properties` },
  };
}

export default async function PropertiesPage({
  params,
  searchParams,
}: PropertiesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("properties");

  const sp = await searchParams;
  const urlSearch = urlSearchFromParams(sp);

  const filters = serializeSearchParams(urlSearch);
  const { items } = await fetchProperties(filters, 1, 200);
  const initialFilters = filtersFromParams(urlSearch);

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
      />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <PropertiesExplorer
          properties={items}
          initialFilters={initialFilters}
          locale={locale as Lang}
        />
      </section>
    </>
  );
}
