"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Property } from "@/types";
import { useFavorites } from "@/hooks/use-favorites";
import { PropertyCard } from "@/components/property/property-card";
import { EmptyState } from "@/components/ui/empty-state";

export function FavoritesList({
  allProperties,
}: {
  allProperties: Property[];
}) {
  const t = useTranslations("favorites");
  const { favorites } = useFavorites();

  const saved = allProperties.filter((p) =>
    favorites.some((f) => f.propertyId === p.id),
  );

  if (saved.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title={t("emptyTitle")}
        description={t("emptyDesc")}
        actionLabel={t("browseProperties")}
        actionHref="/properties"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {saved.map((property, index) => (
        <PropertyCard key={property.id} property={property} priority={index < 3} />
      ))}
    </div>
  );
}
