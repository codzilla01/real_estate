"use client";

import { useCallback, useMemo, useState } from "react";
import { SlidersHorizontal, X, RotateCcw, Bookmark } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PROPERTY_TYPES, AMENITIES } from "@/lib/constants";
import { propertyTypeLabel } from "@/components/property/property-status-badge";
import { getSeedData } from "@/lib/seed-data";
import { l10n } from "@/lib/utils";
import type { Lang } from "@/types";

const locations = getSeedData().locations;
const cities = getSeedData().cities;

import {
  defaultFilters,
  filtersFromParams,
  filtersToParams,
  type FilterValues,
} from "@/lib/search-params";

export {
  defaultFilters,
  filtersFromParams,
  filtersToParams,
  type FilterValues,
};

interface AdvancedFiltersProps {
  initial: FilterValues;
  /** Called with new query params — parent owns the URL/router. */
  onChange: (params: URLSearchParams) => void;
  totalResults?: number;
  compact?: boolean;
}

export function AdvancedFilters({ initial, onChange, totalResults, compact }: AdvancedFiltersProps) {
  const locale = useLocale() as Lang;
  const t = useTranslations("search");
  const [filters, setFilters] = useState<FilterValues>(initial);
  const [open, setOpen] = useState(false);

  const apply = useCallback(() => {
    onChange(filtersToParams(filters));
  }, [filters, onChange]);

  const reset = useCallback(() => {
    const cleared = defaultFilters();
    setFilters(cleared);
    onChange(filtersToParams(cleared));
  }, [onChange]);

  const saveSearch = useCallback(() => {
    const params = filtersToParams(filters);
    try {
      const saved = JSON.parse(localStorage.getItem("ama2_saved_searches") ?? "[]");
      saved.push({
        id: Date.now(),
        params: Object.fromEntries(params.entries()),
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem("ama2_saved_searches", JSON.stringify(saved.slice(-10)));
    } catch {
      // ignore
    }
    toast.success(t("searchSaved"));
  }, [filters, t]);

  const set = <K extends keyof FilterValues>(key: K, value: FilterValues[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const activeCount = useMemo(() => {
    let n = 0;
    const f = filters;
    if (f.dealType) n++;
    if (f.type) n++;
    if (f.city) n++;
    if (f.area) n++;
    if (f.minPrice || f.maxPrice) n++;
    if (f.minArea || f.maxArea) n++;
    if (f.bedrooms) n++;
    if (f.bathrooms) n++;
    if (f.furnished) n++;
    if (f.featured) n++;
    n += f.amenities.length;
    return n;
  }, [filters]);

  const controls = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("dealType")}</Label>
          <Select
            value={filters.dealType ?? "any"}
            onValueChange={(v) => set("dealType", v === "any" ? undefined : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("any")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">{t("any")}</SelectItem>
              <SelectItem value="sale">{t("buy")}</SelectItem>
              <SelectItem value="rent">{t("rent")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("propertyType")}</Label>
          <Select
            value={filters.type ?? "any"}
            onValueChange={(v) => set("type", v === "any" ? undefined : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("any")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">{t("any")}</SelectItem>
              {PROPERTY_TYPES.map((pt) => (
                <SelectItem key={pt} value={pt}>
                  {propertyTypeLabel(pt, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("city")}</Label>
          <Select
            value={filters.city ?? "any"}
            onValueChange={(v) => set("city", v === "any" ? undefined : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("any")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">{t("any")}</SelectItem>
              {cities.map((c) => (
                <SelectItem key={c.id} value={c.slug}>
                  {l10n(c.name, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("area")}</Label>
          <Select
            value={filters.area ?? "any"}
            onValueChange={(v) => set("area", v === "any" ? undefined : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("any")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">{t("any")}</SelectItem>
              {locations.map((l) => (
                <SelectItem key={l.id} value={l.slug}>
                  {l10n(l.name, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("minPrice")}</Label>
          <Input
            type="number"
            min={0}
            placeholder="0"
            value={filters.minPrice}
            onChange={(e) => set("minPrice", e.target.value)}
            dir="ltr"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("maxPrice")}</Label>
          <Input
            type="number"
            min={0}
            placeholder={locale === "ar" ? "مثال: 5000000" : "e.g. 5000000"}
            value={filters.maxPrice}
            onChange={(e) => set("maxPrice", e.target.value)}
            dir="ltr"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("minArea")}</Label>
          <Input
            type="number"
            min={0}
            placeholder="0"
            value={filters.minArea}
            onChange={(e) => set("minArea", e.target.value)}
            dir="ltr"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("maxArea")}</Label>
          <Input
            type="number"
            min={0}
            placeholder="∞"
            value={filters.maxArea}
            onChange={(e) => set("maxArea", e.target.value)}
            dir="ltr"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("bedrooms")}</Label>
          <Select
            value={filters.bedrooms ?? "any"}
            onValueChange={(v) => set("bedrooms", v === "any" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("any")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">{t("any")}</SelectItem>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}+
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("bathrooms")}</Label>
          <Select
            value={filters.bathrooms ?? "any"}
            onValueChange={(v) => set("bathrooms", v === "any" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("any")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">{t("any")}</SelectItem>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}+
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("parking")}</Label>
          <Select
            value={filters.parking ?? "any"}
            onValueChange={(v) => set("parking", v === "any" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("any")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">{t("any")}</SelectItem>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}+
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-5">
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={filters.furnished ?? false}
            onCheckedChange={(v) => set("furnished", v)}
          />
          {t("furnished")}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={filters.featured ?? false}
            onCheckedChange={(v) => set("featured", v)}
          />
          {t("featured")}
        </label>
      </div>

      <div>
        <Label className="mb-2 block text-xs text-muted-foreground">{t("amenities")}</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {AMENITIES.slice(0, 15).map((amenity) => (
            <label
              key={amenity}
              className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs cursor-pointer hover:bg-muted/60 transition-colors"
            >
              <Checkbox
                checked={filters.amenities.includes(amenity)}
                onCheckedChange={(checked) =>
                  set(
                    "amenities",
                    checked
                      ? [...filters.amenities, amenity]
                      : filters.amenities.filter((a) => a !== amenity),
                  )
                }
              />
              <span className="truncate">
                {locale === "ar"
                  ? AMENITY_AR_LABELS[amenity as keyof typeof AMENITY_AR_LABELS] ?? amenity
                  : amenity}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {compact && (
        <div className="mb-4 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            {t("filters")}
            {activeCount > 0 && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-black">
                {activeCount}
              </span>
            )}
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {t("resetFilters")}
            </Button>
            <Button variant="ghost" size="sm" onClick={saveSearch}>
              <Bookmark className="h-4 w-4" aria-hidden="true" />
              {t("saveSearch")}
            </Button>
          </div>
        </div>
      )}

      {(!compact || open) && (
        <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
          {controls}

          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              {totalResults != null ? `${totalResults} ${t("foundProperties")}` : ""}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={reset}>
                <X className="h-4 w-4" aria-hidden="true" />
                {t("clearFilters")}
              </Button>
              <Button variant="gold" size="sm" onClick={apply}>
                {t("applyFilters")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom sheet */}
      {compact && open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border bg-card p-4 pb-8 animate-slide-up">
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-border" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{t("filters")}</h2>
              <Button variant="ghost" size="iconSm" onClick={() => setOpen(false)} aria-label={t("close")}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            {controls}
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={reset}>
                {t("resetFilters")}
              </Button>
              <Button
                variant="gold"
                className="flex-1"
                onClick={() => {
                  apply();
                  setOpen(false);
                }}
              >
                {t("applyFilters")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const AMENITY_AR_LABELS = {
  pool: "مسبح",
  gym: "نادي رياضي",
  parking: "مواقف",
  security: "حراسة",
  balcony: "شرفة",
  garden: "حديقة",
  beachAccess: "شاطئ",
  concierge: "كونسيرج",
  smartHome: "منزل ذكي",
  centralAc: "تكييف مركزي",
  elevator: "مصعد",
  childrenPlayArea: "ألعاب أطفال",
  shoppingMall: "قرب المول",
  waterfront: "واجهة مائية",
  marinaView: "إطلالة مارينا",
  cityView: "إطلالة المدينة",
  seaView: "إطلالة بحرية",
  maidRoom: "غرفة خادمة",
  studyRoom: "غرفة دراسة",
  cinema: "سينما",
  spa: "سبا",
  sauna: "ساونا",
  bbqArea: "شواء",
  roofTerrace: "تراس",
  storage: "تخزين",
} as const;
