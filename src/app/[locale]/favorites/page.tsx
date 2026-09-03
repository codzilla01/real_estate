import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { fetchAllProperties } from "@/lib/data-service";
import { PageHeader } from "@/components/layout/page-header";
import { FavoritesList } from "@/components/property/favorites-list";

interface FavoritesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: FavoritesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return { title: t("favoritesTitle"), description: t("homeDescription") };
}

export default async function FavoritesPage({ params }: FavoritesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("favorites");

  const properties = await fetchAllProperties({});

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <FavoritesList allProperties={properties} />
      </section>
    </>
  );
}
