import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import {
  fetchLocationBySlug,
  fetchLocations,
  fetchProperties,
} from "@/lib/data-service";
import { l10n } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { PropertiesExplorer } from "@/components/property/properties-explorer";
import { filtersFromParams } from "@/lib/search-params";
import type { Lang } from "@/types";

interface LocationPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  const locations = await fetchLocations();
  return ["ar", "en"].flatMap((locale) =>
    locations.map((loc) => ({ locale, slug: loc.slug })),
  );
}

export async function generateMetadata({ params }: LocationPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const location = await fetchLocationBySlug(slug);
  if (!location) return { title: "Location not found" };
  return {
    title: `${l10n(location.name, locale as Lang)} | Al Maktab Al Aqari`,
    description: l10n(location.description, locale as Lang),
    alternates: { canonical: `/${locale}/locations/${slug}` },
  };
}

export default async function LocationPage({ params }: LocationPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const lang = locale as Lang;
  const t = await getTranslations("locations");

  const location = await fetchLocationBySlug(slug);
  if (!location) notFound();

  const urlSearch = new URLSearchParams({ area: slug });
  const { items } = await fetchProperties({ area: slug, status: "available" }, 1, 200);

  return (
    <>
      <PageHeader
        title={`${t("popularIn")} ${l10n(location.name, lang)}`}
        subtitle={l10n(location.description, lang)}
        breadcrumb={[
          { label: t("title"), href: "/locations" },
          { label: l10n(location.name, lang) },
        ]}
      />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <PropertiesExplorer
          properties={items}
          initialFilters={filtersFromParams(urlSearch)}
          locale={lang}
        />
      </section>
    </>
  );
}
