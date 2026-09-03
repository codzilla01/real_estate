import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { fetchProperties } from "@/lib/data-service";
import { PropertiesExplorer } from "@/components/property/properties-explorer";
import { filtersFromParams } from "@/lib/search-params";
import { PageHeader } from "@/components/layout/page-header";
import type { Lang } from "@/types";

interface RentPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: RentPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    title: t("rentTitle"),
    description: t("homeDescription"),
    alternates: { canonical: `/${locale}/rent` },
  };
}

export default async function RentPage({ params }: RentPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("properties");

  const { items } = await fetchProperties(
    { dealType: "rent", status: "available" },
    1,
    200,
  );

  const paramsObj = new URLSearchParams({ dealType: "rent" });

  return (
    <>
      <PageHeader
        title={t("rentTitle")}
        subtitle={t("rentSubtitle")}
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
