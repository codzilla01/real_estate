"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ImagePlus, ArrowUp, ArrowDown, Star, Trash2, Plus, X } from "lucide-react";
import { propertySchema, type PropertyFormValues } from "@/schemas";
import { PROPERTY_TYPES, PROPERTY_STATUSES, DEAL_TYPES, AMENITIES, CURRENCIES } from "@/lib/constants";
import { propertyTypeLabel, propertyStatusTone } from "@/components/property/property-status-badge";
import { uid } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminService } from "@/lib/admin-service";
import type { Agent, Property } from "@/types";
import { cn } from "@/lib/utils";

interface PropertyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property?: Property | null;
  agents: Agent[];
  onSaved?: () => void;
}

const emptyValues: PropertyFormValues = {
  titleAr: "",
  titleEn: "",
  descriptionAr: "",
  descriptionEn: "",
  type: "villa",
  dealType: "sale",
  status: "available",
  price: 0,
  currency: "AED",
  area: 0,
  bedrooms: 0,
  bathrooms: 0,
  parking: 0,
  yearBuilt: "",
  furnished: false,
  city: "dubai",
  areaName: "",
  address: "",
  latitude: 25.2048,
  longitude: 55.2708,
  amenities: [],
  features: [],
  agentId: "",
  featured: false,
  isNew: false,
  isHot: false,
  seoTitleAr: "",
  seoTitleEn: "",
  seoDescriptionAr: "",
  seoDescriptionEn: "",
  slug: "",
  images: [],
};

function propertyToValues(property: Property): PropertyFormValues {
  return {
    titleAr: property.title.ar,
    titleEn: property.title.en,
    descriptionAr: property.description.ar,
    descriptionEn: property.description.en,
    type: property.type,
    dealType: property.dealType,
    status: property.status,
    price: property.price,
    currency: property.currency,
    area: property.area,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    parking: property.parking,
    yearBuilt: property.yearBuilt ?? "",
    furnished: property.furnished,
    city: property.city,
    areaName: property.areaName ?? "",
    address: property.address ?? "",
    latitude: property.latitude,
    longitude: property.longitude,
    amenities: property.amenities,
    features: property.features ?? [],
    agentId: property.agentId ?? "",
    featured: property.featured,
    isNew: property.isNew ?? false,
    isHot: property.isHot ?? false,
    seoTitleAr: property.seoTitle?.ar ?? "",
    seoTitleEn: property.seoTitle?.en ?? "",
    seoDescriptionAr: property.seoDescription?.ar ?? "",
    seoDescriptionEn: property.seoDescription?.en ?? "",
    slug: property.slug,
    images: property.images.map((img) => ({
      url: img.url,
      alt: img.alt ? img.alt.ar : "",
      isCover: img.isCover ?? false,
    })),
  };
}

export function PropertyFormDialog({ open, onOpenChange, property, agents, onSaved }: PropertyFormDialogProps) {
  const locale = useLocale() as "ar" | "en";
  const t = useTranslations("admin");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newFeature, setNewFeature] = useState("");

  const isEdit = Boolean(property);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: emptyValues,
  });

  const images = useFieldArray({ control, name: "images" });
  const [featureList, setFeatureList] = useState<string[]>([]);
  const amenities = watch("amenities");

  useEffect(() => {
    if (open) {
      reset(property ? propertyToValues(property) : emptyValues);
      setNewImageUrl("");
      setNewFeature("");
      setFeatureList(property?.features ?? []);
    }
  }, [open, property, reset]);

  // Keep features in sync with the form state
  useEffect(() => {
    setValue("features", featureList, { shouldDirty: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featureList]);

  const addImageUrl = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    const isCover = images.fields.length === 0;
    images.append({ url, alt: "", isCover });
    setNewImageUrl("");
  };

  const toggleAmenity = (amenity: string, checked: boolean) => {
    setValue(
      "amenities",
      checked
        ? [...amenities, amenity]
        : amenities.filter((a) => a !== amenity),
    );
  };

  const onSubmit = async (values: PropertyFormValues) => {
    try {
      const imagesPayload = values.images.map((img, index) => ({
        id: uid("img"),
        url: img.url,
        isCover: img.isCover || index === 0,
        order: index,
      }));

      const base = {
        slug: values.slug?.trim() || undefined,
        title: { ar: values.titleAr, en: values.titleEn },
        description: { ar: values.descriptionAr, en: values.descriptionEn },
        type: values.type,
        dealType: values.dealType,
        status: values.status,
        price: values.price,
        currency: values.currency,
        area: values.area,
        bedrooms: values.bedrooms,
        bathrooms: values.bathrooms,
        parking: values.parking,
        yearBuilt: values.yearBuilt ? Number(values.yearBuilt) : undefined,
        furnished: values.furnished,
        city: values.city,
        areaName: values.areaName || undefined,
        address: values.address || undefined,
        latitude: values.latitude,
        longitude: values.longitude,
        amenities: values.amenities,
        features: values.features,
        agentId: values.agentId || undefined,
        featured: values.featured,
        isNew: values.isNew,
        isHot: values.isHot,
        seoTitle:
          values.seoTitleAr || values.seoTitleEn
            ? { ar: values.seoTitleAr || "", en: values.seoTitleEn || "" }
            : undefined,
        seoDescription:
          values.seoDescriptionAr || values.seoDescriptionEn
            ? { ar: values.seoDescriptionAr || "", en: values.seoDescriptionEn || "" }
            : undefined,
        images: imagesPayload,
        publishedAt: property?.publishedAt ?? new Date().toISOString(),
      };

      if (property) {
        await adminService.updateProperty(property.id, base);
        toast.success(locale === "ar" ? "تم تحديث العقار" : "Property updated");
      } else {
        await adminService.createProperty(base);
        toast.success(locale === "ar" ? "تم إنشاء العقار" : "Property created");
      }
      onSaved?.();
      onOpenChange(false);
    } catch {
      toast.error(locale === "ar" ? "حدث خطأ، حاول مجددًا" : "Something went wrong");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editProperty") : t("newProperty")}</DialogTitle>
          <DialogDescription>
            {locale === "ar"
              ? "أكمل بيانات العقار بالعربية والإنجليزية"
              : "Fill in the property details in Arabic and English"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Bilingual titles */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="titleAr">{t("titleAr")} *</Label>
              <Input id="titleAr" {...register("titleAr")} className={cn(errors.titleAr && "border-destructive")} />
              {errors.titleAr && <p className="text-xs text-destructive">Required</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="titleEn">{t("titleEn")} *</Label>
              <Input id="titleEn" dir="ltr" {...register("titleEn")} className={cn(errors.titleEn && "border-destructive")} />
              {errors.titleEn && <p className="text-xs text-destructive">Required</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="descriptionAr">{t("descriptionAr")} *</Label>
              <Textarea id="descriptionAr" rows={3} {...register("descriptionAr")} className={cn(errors.descriptionAr && "border-destructive")} />
              {errors.descriptionAr && <p className="text-xs text-destructive">Required</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="descriptionEn">{t("descriptionEn")} *</Label>
              <Textarea id="descriptionEn" rows={3} dir="ltr" {...register("descriptionEn")} className={cn(errors.descriptionEn && "border-destructive")} />
              {errors.descriptionEn && <p className="text-xs text-destructive">Required</p>}
            </div>
          </div>

          {/* Core fields */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label>{t("propertyType")}</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map((pt) => (
                        <SelectItem key={pt} value={pt}>{propertyTypeLabel(pt, locale)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("propertyType")}</Label>
              <Controller
                control={control}
                name="dealType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DEAL_TYPES.map((dt) => (
                        <SelectItem key={dt} value={dt}>
                          {dt === "sale" ? (locale === "ar" ? "بيع" : "Sale") : locale === "ar" ? "إيجار" : "Rent"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("status")}</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROPERTY_STATUSES.map((st) => (
                        <SelectItem key={st} value={st}>
                          {propertyStatusTone(st).label[locale]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("agent")}</Label>
              <Controller
                control={control}
                name="agentId"
                render={({ field }) => (
                  <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="price">{t("price")} *</Label>
              <Input id="price" type="number" dir="ltr" {...register("price", { valueAsNumber: true })} className={cn(errors.price && "border-destructive")} />
              {errors.price && <p className="text-xs text-destructive">Required</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{t("currency")}</Label>
              <Controller
                control={control}
                name="currency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="area">{t("area")} *</Label>
              <Input id="area" type="number" dir="ltr" {...register("area", { valueAsNumber: true })} className={cn(errors.area && "border-destructive")} />
              {errors.area && <p className="text-xs text-destructive">Required</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="yearBuilt">{t("yearBuilt")}</Label>
              <Input id="yearBuilt" type="number" dir="ltr" {...register("yearBuilt")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bedrooms">{t("bedrooms")}</Label>
              <Input id="bedrooms" type="number" dir="ltr" {...register("bedrooms", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bathrooms">{t("bathrooms")}</Label>
              <Input id="bathrooms" type="number" dir="ltr" {...register("bathrooms", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="parking">{t("parking")}</Label>
              <Input id="parking" type="number" dir="ltr" {...register("parking", { valueAsNumber: true })} />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="city">{t("city")}</Label>
              <Input id="city" {...register("city")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="areaName">{t("area")}</Label>
              <Input id="areaName" {...register("areaName")} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address">{t("address")}</Label>
              <Input id="address" {...register("address")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="latitude">{t("latitude")}</Label>
              <Input id="latitude" type="number" step="0.0001" dir="ltr" {...register("latitude", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="longitude">{t("longitude")}</Label>
              <Input id="longitude" type="number" step="0.0001" dir="ltr" {...register("longitude", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" dir="ltr" {...register("slug")} placeholder="auto" />
            </div>
          </div>

          {/* Flags */}
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Controller control={control} name="furnished" render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )} />
              {t("furnished")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Controller control={control} name="featured" render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )} />
              {t("featured")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Controller control={control} name="isNew" render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )} />
              {t("isNew")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Controller control={control} name="isHot" render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )} />
              {t("isHot")}
            </label>
          </div>

          {/* Amenities */}
          <div>
            <Label className="mb-2 block">{t("amenities")}</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {AMENITIES.map((amenity) => (
                <label key={amenity} className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs cursor-pointer hover:bg-muted/60">
                  <Checkbox
                    checked={amenities.includes(amenity)}
                    onCheckedChange={(checked) => toggleAmenity(amenity, Boolean(checked))}
                  />
                  <span className="truncate">{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Features */}
          <div>
            <Label className="mb-2 block">{t("features")}</Label>
            <div className="flex gap-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder={locale === "ar" ? "أضف ميزة..." : "Add a feature..."}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (newFeature.trim()) {
                      setFeatureList((list) => [...list, newFeature.trim()]);
                      setNewFeature("");
                    }
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (newFeature.trim()) {
                    setFeatureList((list) => [...list, newFeature.trim()]);
                    setNewFeature("");
                  }
                }}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            {featureList.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {featureList.map((feature, index) => (
                  <span key={`${feature}-${index}`} className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs">
                    {feature}
                    <button
                      type="button"
                      onClick={() =>
                        setFeatureList((list) => list.filter((_, i) => i !== index))
                      }
                      aria-label="Remove"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Images */}
          <div>
            <Label className="mb-2 block">{t("images")}</Label>
            <div className="flex gap-2">
              <Input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder={locale === "ar" ? "ألصق رابط صورة..." : "Paste an image URL..."}
                dir="ltr"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addImageUrl();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addImageUrl} aria-label={t("uploadImages")}>
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            {images.fields.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {images.fields.map((field, index) => (
                  <div key={field.id} className="group relative overflow-hidden rounded-lg border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={field.url} alt="" className="aspect-[4/3] w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => images.move(index, Math.max(0, index - 1))}
                        disabled={index === 0}
                        className="rounded p-1 text-white hover:bg-white/20 disabled:opacity-30"
                        aria-label="Move up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => images.move(index, Math.min(images.fields.length - 1, index + 1))}
                        disabled={index === images.fields.length - 1}
                        className="rounded p-1 text-white hover:bg-white/20 disabled:opacity-30"
                        aria-label="Move down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => images.update(index, { ...field, isCover: true })}
                        className={cn("rounded p-1", field.isCover ? "text-gold" : "text-white hover:bg-white/20")}
                        aria-label={t("coverImage")}
                      >
                        <Star className={cn("h-3.5 w-3.5", field.isCover && "fill-gold")} />
                      </button>
                      <button
                        type="button"
                        onClick={() => images.remove(index)}
                        className="rounded p-1 text-white hover:bg-destructive/80"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {field.isCover && (
                      <span className="absolute left-1 top-1 rounded bg-gold px-1.5 py-0.5 text-[9px] font-bold text-black">
                        {locale === "ar" ? "رئيسية" : "Cover"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SEO */}
          <div className="rounded-lg border border-border p-4">
            <p className="mb-3 text-sm font-bold">SEO</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="seoTitleAr">SEO Title (AR)</Label>
                <Input id="seoTitleAr" {...register("seoTitleAr")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="seoTitleEn">SEO Title (EN)</Label>
                <Input id="seoTitleEn" dir="ltr" {...register("seoTitleEn")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="seoDescriptionAr">SEO Description (AR)</Label>
                <Input id="seoDescriptionAr" {...register("seoDescriptionAr")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="seoDescriptionEn">SEO Description (EN)</Label>
                <Input id="seoDescriptionEn" dir="ltr" {...register("seoDescriptionEn")} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" variant="gold" disabled={isSubmitting}>
              {isSubmitting ? (locale === "ar" ? "جارٍ الحفظ..." : "Saving...") : t("saveChanges")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
