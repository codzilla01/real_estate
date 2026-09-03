"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROPERTY_TYPES, DEAL_TYPES } from "@/lib/constants";
import { propertyTypeLabel } from "@/components/property/property-status-badge";
import { getSeedData } from "@/lib/seed-data";
import { l10n } from "@/lib/utils";
import { cn } from "@/lib/utils";

const locations = getSeedData().locations;

export function SearchHero() {
  const locale = useLocale() as "ar" | "en";
  const t = useTranslations("search");
  const router = useRouter();

  const [dealType, setDealType] = useState<"sale" | "rent">("sale");
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [bedrooms, setBedrooms] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("dealType", dealType);
    if (type) params.set("type", type);
    if (location) params.set("area", location);
    if (budget) params.set("maxPrice", budget);
    if (bedrooms) params.set("bedrooms", bedrooms);
    router.push(`/properties?${params.toString()}`);
  };

  return (
    <form
      onSubmit={submit}
      className="mx-auto w-full max-w-4xl rounded-2xl border border-white/15 bg-black/30 p-4 shadow-luxury backdrop-blur-xl sm:p-6"
      role="search"
      aria-label={t("advancedSearch")}
    >
      {/* Buy / Rent toggle */}
      <div className="mb-4 flex w-fit items-center rounded-full border border-white/15 bg-black/30 p-1">
        {DEAL_TYPES.map((dt) => (
          <button
            key={dt}
            type="button"
            onClick={() => setDealType(dt)}
            className={cn(
              "rounded-full px-6 py-1.5 text-sm font-bold transition-all",
              dealType === dt
                ? "bg-gold-gradient text-black shadow"
                : "text-white/70 hover:text-white",
            )}
            aria-pressed={dealType === dt}
          >
            {dt === "sale" ? t("buy") : t("rent")}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Select value={type || "any"} onValueChange={(v) => setType(v === "any" ? "" : v)}>
          <SelectTrigger className="border-white/20 bg-black/30 text-white [&>span]:text-white/80">
            <SelectValue placeholder={t("propertyType")} />
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

        <Select value={location || "any"} onValueChange={(v) => setLocation(v === "any" ? "" : v)}>
          <SelectTrigger className="border-white/20 bg-black/30 text-white [&>span]:text-white/80">
            <SelectValue placeholder={t("location")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">{t("any")}</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={loc.slug}>
                {l10n(loc.name, locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={bedrooms || "any"} onValueChange={(v) => setBedrooms(v === "any" ? "" : v)}>
          <SelectTrigger className="border-white/20 bg-black/30 text-white [&>span]:text-white/80">
            <SelectValue placeholder={t("bedrooms")} />
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

        <Input
          type="number"
          min={0}
          placeholder={locale === "ar" ? "السعر حتى (د.إ)" : "Max price (AED)"}
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="border-white/20 bg-black/30 text-white placeholder:text-white/50"
          dir="ltr"
        />

        <Button type="submit" variant="gold" className="h-10 w-full md:col-span-1">
          <Search className="h-4 w-4" aria-hidden="true" />
          {t("searchButton")}
        </Button>
      </div>
    </form>
  );
}
