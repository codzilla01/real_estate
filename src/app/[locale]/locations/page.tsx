import type { Metadata } from "next";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { fetchLocations, fetchAllProperties } from "@/lib/data-service";
import { l10n } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import type { Lang } from "@/types";

interface LocationsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LocationsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return { title: t("locationsTitle"), description: t("homeDescription") };
}

export default async function LocationsPage({ params }: LocationsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lang = locale as Lang;
  const t = await getTranslations("locations");

  const [locations, properties] = await Promise.all([
    fetchLocations(),
    fetchAllProperties({ status: "available" }),
  ]);

  const countByLocation = properties.reduce<Record<string, number>>((acc, p) => {
    const key = p.areaName ?? p.city;
    if (key) acc[key.toLowerCase()] = (acc[key.toLowerCase()] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc) => {
            const slug = loc.slug;
            const count =
              countByLocation[loc.name.ar] ??
              countByLocation[loc.name.en.toLowerCase()] ??
              0;
            return (
              <Link
                key={loc.id}
                href={`/locations/${slug}`}
                className="group relative overflow-hidden rounded-xl border border-border"
              >
                <div className="relative aspect-[16/10]">
                  <Image
                    src={loc.image ?? ""}
                    alt={l10n(loc.name, lang)}
                    fill
                    sizes="(min-width: 1024px) 33vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h2 className="flex items-center gap-1.5 font-bold text-white">
                    <MapPin className="h-4 w-4 text-gold-light" aria-hidden="true" />
                    {l10n(loc.name, lang)}
                  </h2>
                  <p className="mt-0.5 text-xs text-white/70">
                    {count} {t("propertiesCount")}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
