"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { LayoutGrid, Map as MapIcon, Loader2, SearchX } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import type { Property } from "@/types";
import { cn } from "@/lib/utils";
import { PropertyCard } from "@/components/property/property-card";
import { MapWrapper } from "@/components/maps/map-wrapper";
import { AdvancedFilters } from "@/components/search/advanced-filters";
import {
  filtersFromParams,
  filtersToParams,
  type FilterValues,
} from "@/lib/search-params";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

const PAGE_SIZE = 12;

interface PropertiesExplorerProps {
  properties: Property[];
  initialFilters: FilterValues;
  /** Kept for API compatibility; sorting/labels are resolved from translations. */
  locale?: "ar" | "en";
}

export function PropertiesExplorer(props: PropertiesExplorerProps) {
  return (
    <Suspense
      fallback={
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-2xl" />
          ))}
        </div>
      }
    >
      <PropertiesExplorerInner {...props} />
    </Suspense>
  );
}

function PropertiesExplorerInner({
  properties,
  initialFilters,
}: PropertiesExplorerProps) {
  const t = useTranslations("search");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  const [view, setView] = useState<"grid" | "map">("grid");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isNavigating, setIsNavigating] = useState(false);

  const signature = searchParams.toString();

  // Sync when URL changes (server re-fetch)
  useEffect(() => {
    setFilters(filtersFromParams(searchParams));
    setVisibleCount(PAGE_SIZE);
  }, [signature, searchParams]);

  const handleFiltersChange = (params: URLSearchParams) => {
    setIsNavigating(true);
    const qs = params.toString();
    router.replace(`/properties${qs ? `?${qs}` : ""}`, { scroll: false });
    // The server re-render will update props; keep UI snappy by filtering locally too
    window.setTimeout(() => setIsNavigating(false), 600);
  };

  const sorted = useMemo(() => {
    const list = [...properties];
    switch (filters.sort) {
      case "price_asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "area_desc":
        list.sort((a, b) => b.area - a.area);
        break;
      case "area_asc":
        list.sort((a, b) => a.area - b.area);
        break;
      default:
        list.sort(
          (a, b) =>
            new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
        );
    }
    return list;
  }, [properties, filters.sort]);

  const visible = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  return (
    <div className="space-y-5">
      <AdvancedFilters
        initial={initialFilters}
        onChange={handleFiltersChange}
        totalResults={sorted.length}
        compact
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-bold text-foreground">{sorted.length}</span>{" "}
          {t("foundProperties")}
        </p>
        <div className="flex items-center gap-2">
          <Select
            value={filters.sort ?? "newest"}
            onValueChange={(v) => {
              const next = { ...filters, sort: v };
              handleFiltersChange(filtersToParams(next));
            }}
          >
            <SelectTrigger className="h-9 w-[150px] text-xs sm:w-[180px]">
              <SelectValue placeholder={t("sortBy")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t("sortNewest")}</SelectItem>
              <SelectItem value="price_asc">{t("sortPriceAsc")}</SelectItem>
              <SelectItem value="price_desc">{t("sortPriceDesc")}</SelectItem>
              <SelectItem value="area_desc">{t("sortAreaDesc")}</SelectItem>
              <SelectItem value="area_asc">{t("sortAreaAsc")}</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex rounded-lg border border-border p-0.5">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "flex h-8 w-9 items-center justify-center rounded-md transition-colors",
                view === "grid" ? "bg-gold text-black" : "text-muted-foreground hover:text-foreground",
              )}
              aria-label={t("listView")}
              aria-pressed={view === "grid"}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              onClick={() => setView("map")}
              className={cn(
                "flex h-8 w-9 items-center justify-center rounded-md transition-colors",
                view === "map" ? "bg-gold text-black" : "text-muted-foreground hover:text-foreground",
              )}
              aria-label={t("mapView")}
              aria-pressed={view === "map"}
            >
              <MapIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {isNavigating ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[340px] rounded-xl" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={t("noResultsTitle")}
          description={t("noResultsDesc")}
          actionLabel={t("resetFilters")}
          onAction={() => handleFiltersChange(new URLSearchParams())}
        />
      ) : view === "map" ? (
        <div className="h-[70vh] overflow-hidden rounded-xl border border-border">
          <MapWrapper properties={sorted} className="h-full w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((property, index) => (
            <PropertyCard key={property.id} property={property} priority={index < 3} />
          ))}
        </div>
      )}

      {view === "grid" && hasMore && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
            <Loader2 className="h-4 w-4" aria-hidden="true" />
            {tCommon("loadMore")}
          </Button>
        </div>
      )}
    </div>
  );
}
