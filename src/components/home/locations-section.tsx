import Image from "next/image";
import { MapPin, ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Location } from "@/types";
import { l10n } from "@/lib/utils";

export async function LocationsSection({
  locations,
  locale,
}: {
  locations: Location[];
  locale: "ar" | "en";
}) {
  const t = await getTranslations("home");

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-gold">
          {t("popularLocationsSubtitle")}
        </p>
        <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
          {t("popularLocationsTitle")}
        </h2>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {locations.slice(0, 8).map((loc, index) => (
          <Link
            key={loc.id}
            href={`/locations/${loc.slug}`}
            className={`group relative overflow-hidden rounded-xl border border-border ${
              index === 0 || index === 3 ? "col-span-2 aspect-[16/8]" : "aspect-[16/10]"
            }`}
          >
            <Image
              src={loc.image ?? ""}
              alt={l10n(loc.name, locale)}
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
              <div>
                <h3 className="flex items-center gap-1.5 font-bold text-white">
                  <MapPin className="h-4 w-4 text-gold-light" aria-hidden="true" />
                  {l10n(loc.name, locale)}
                </h3>
                <p className="text-xs text-white/70">
                  {l10n(loc.description ?? { ar: "", en: "" }, locale).slice(0, 42)}…
                </p>
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/90 text-black opacity-0 transition-opacity group-hover:opacity-100">
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
