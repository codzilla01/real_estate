"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  BedDouble,
  Bath,
  Car,
  Ruler,
  Heart,
  MapPin,
  Star,
  Flame,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Property } from "@/types";
import { cn, formatPrice, l10n } from "@/lib/utils";
import { getPropertyCoverImage } from "@/lib/property-filters";
import { useFavorites } from "@/hooks/use-favorites";
import {
  PropertyStatusBadge,
  propertyTypeLabel,
} from "@/components/property/property-status-badge";

interface PropertyCardProps {
  property: Property;
  className?: string;
  priority?: boolean;
}

export function PropertyCard({ property, className, priority = false }: PropertyCardProps) {
  const locale = useLocale() as "ar" | "en";
  const t = useTranslations("property");
  const { isFavorite, toggleFavorite } = useFavorites();

  const cover = getPropertyCoverImage(property.images);
  const favorite = isFavorite(property.id);

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(property.id);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn("group relative", className)}
    >
      <Link
        href={`/properties/${property.slug}`}
        className="block h-full overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-luxury hover:border-gold/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={l10n(property.title, locale)}
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          <Image
            src={cover}
            alt={l10n(property.title, locale)}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority={priority}
          />

          {/* Badges */}
          <div className="absolute top-3 flex items-center gap-2 rtl:right-3 ltr:left-3">
            {property.featured && (
              <span className="flex items-center gap-1 rounded-full bg-gold-gradient px-2.5 py-1 text-[11px] font-bold text-black shadow">
                <Star className="h-3 w-3 fill-black" aria-hidden="true" />
                {locale === "ar" ? "مميز" : "Featured"}
              </span>
            )}
            {property.isHot && (
              <span className="flex items-center gap-1 rounded-full bg-destructive/90 px-2.5 py-1 text-[11px] font-bold text-white shadow">
                <Flame className="h-3 w-3" aria-hidden="true" />
                {locale === "ar" ? "عرض ساخن" : "Hot"}
              </span>
            )}
          </div>

          <div className="absolute top-3 rtl:left-3 ltr:right-3">
            <PropertyStatusBadge status={property.status} locale={locale} className="shadow" />
          </div>

          {/* Favorite */}
          <button
            type="button"
            onClick={handleFavorite}
            aria-label={
              favorite
                ? locale === "ar" ? "إزالة من المفضلة" : "Remove from favorites"
                : locale === "ar" ? "حفظ في المفضلة" : "Save to favorites"
            }
            className={cn(
              "absolute bottom-3 rtl:right-3 ltr:left-3 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md border transition-all",
              favorite
                ? "bg-gold border-gold text-black"
                : "bg-black/30 border-white/20 text-white hover:bg-gold hover:text-black hover:border-gold",
            )}
          >
            <Heart className={cn("h-4 w-4", favorite && "fill-black")} aria-hidden="true" />
          </button>

          {/* Bottom overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 pt-12">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gold-light">
              {propertyTypeLabel(property.type, locale)} ·{" "}
              {locale === "ar"
                ? property.dealType === "sale" ? "بيع" : "إيجار"
                : property.dealType === "sale" ? "Sale" : "Rent"}
            </p>
            <h3 className="line-clamp-1 font-bold text-white" dir="auto">
              {l10n(property.title, locale)}
            </h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-white/75">
              <MapPin className="h-3.5 w-3.5 text-gold-light" aria-hidden="true" />
              {l10n({ ar: property.city, en: property.city }, locale)}
              {property.areaName ? ` — ${property.areaName}` : ""}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="p-4">
          <div className="flex items-end justify-between gap-2">
            <p className="text-xl font-black text-gradient-gold" dir="ltr">
              {formatPrice(property.price, property.currency, locale)}
            </p>
            <span className="text-[11px] text-muted-foreground">
              {property.dealType === "rent"
                ? locale === "ar" ? "/ سنويًا" : "/ year"
                : ""}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            {property.bedrooms > 0 && (
              <span className="flex items-center gap-1.5">
                <BedDouble className="h-3.5 w-3.5 text-gold/70" aria-hidden="true" />
                {property.bedrooms} {t("bedrooms")}
              </span>
            )}
            {property.bathrooms > 0 && (
              <span className="flex items-center gap-1.5">
                <Bath className="h-3.5 w-3.5 text-gold/70" aria-hidden="true" />
                {property.bathrooms} {t("bathrooms")}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Ruler className="h-3.5 w-3.5 text-gold/70" aria-hidden="true" />
              {property.area.toLocaleString(locale === "ar" ? "ar-AE" : "en-US")} م²
            </span>
            {property.parking > 0 && (
              <span className="flex items-center gap-1.5">
                <Car className="h-3.5 w-3.5 text-gold/70" aria-hidden="true" />
                {property.parking}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="aspect-[16/10] animate-pulse bg-muted" />
      <div className="space-y-2 p-4">
        <div className="h-6 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
