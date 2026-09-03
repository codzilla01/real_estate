"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { settingsSchema, type SettingsFormValues } from "@/schemas";
import { adminService } from "@/lib/admin-service";
import { CURRENCIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


export default function AdminSettingsPage() {
  const locale = useLocale() as "ar" | "en";
  const t = useTranslations("admin");
  const [loading, setLoading] = useState(true);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<SettingsFormValues>({ resolver: zodResolver(settingsSchema) });

  useEffect(() => {
    adminService.getSettings().then((settings) => {
      reset({
        companyNameAr: settings.companyName.ar,
        companyNameEn: settings.companyName.en,
        phone: settings.phone,
        whatsapp: settings.whatsapp,
        email: settings.email,
        addressAr: settings.address?.ar ?? "",
        addressEn: settings.address?.en ?? "",
        facebook: settings.social?.facebook ?? "",
        instagram: settings.social?.instagram ?? "",
        twitter: settings.social?.twitter ?? "",
        linkedin: settings.social?.linkedin ?? "",
        currency: settings.currency,
        defaultLanguage: settings.defaultLanguage,
        defaultTheme: settings.defaultTheme,
        seoTitleAr: settings.seoDefaults?.title?.ar ?? "",
        seoTitleEn: settings.seoDefaults?.title?.en ?? "",
        seoDescriptionAr: settings.seoDefaults?.description?.ar ?? "",
        seoDescriptionEn: settings.seoDefaults?.description?.en ?? "",
      });
      setLoading(false);
    });
  }, [reset]);

  const onSubmit = async (values: SettingsFormValues) => {
    try {
      await adminService.updateSettings({
        companyName: { ar: values.companyNameAr, en: values.companyNameEn },
        phone: values.phone,
        whatsapp: values.whatsapp,
        email: values.email,
        address: { ar: values.addressAr ?? "", en: values.addressEn ?? "" },
        social: {
          facebook: values.facebook || undefined,
          instagram: values.instagram || undefined,
          twitter: values.twitter || undefined,
          linkedin: values.linkedin || undefined,
        },
        currency: values.currency,
        defaultLanguage: values.defaultLanguage,
        defaultTheme: values.defaultTheme,
        seoDefaults: {
          title: { ar: values.seoTitleAr ?? "", en: values.seoTitleEn ?? "" },
          description: { ar: values.seoDescriptionAr ?? "", en: values.seoDescriptionEn ?? "" },
        },
      });
      toast.success(t("settingsSaved"));
    } catch {
      toast.error(locale === "ar" ? "حدث خطأ" : "Something went wrong");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">{t("settings")}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("settingsCompany")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("companyNameAr")}</Label>
              <Input {...register("companyNameAr")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("companyNameEn")}</Label>
              <Input dir="ltr" {...register("companyNameEn")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("contactPhone")}</Label>
              <Input dir="ltr" {...register("phone")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("whatsappNumber")}</Label>
              <Input dir="ltr" {...register("whatsapp")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("contactEmail")}</Label>
              <Input type="email" dir="ltr" {...register("email")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("defaultCurrency")}</Label>
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
              <Label>{t("defaultLanguage")}</Label>
              <Controller
                control={control}
                name="defaultLanguage"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("defaultTheme")}</Label>
              <Controller
                control={control}
                name="defaultTheme"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">{t("themeDark")}</SelectItem>
                      <SelectItem value="light">{t("themeLight")}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>{t("companyAddress")}</Label>
              <Textarea rows={2} {...register("addressAr")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("socialLinks")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Facebook</Label>
              <Input dir="ltr" {...register("facebook")} placeholder="https://facebook.com/..." />
            </div>
            <div className="space-y-1.5">
              <Label>Instagram</Label>
              <Input dir="ltr" {...register("instagram")} placeholder="https://instagram.com/..." />
            </div>
            <div className="space-y-1.5">
              <Label>X (Twitter)</Label>
              <Input dir="ltr" {...register("twitter")} placeholder="https://x.com/..." />
            </div>
            <div className="space-y-1.5">
              <Label>LinkedIn</Label>
              <Input dir="ltr" {...register("linkedin")} placeholder="https://linkedin.com/..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("seoDefaults")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("seoDefaultTitle")} (AR)</Label>
              <Input {...register("seoTitleAr")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("seoDefaultTitle")} (EN)</Label>
              <Input dir="ltr" {...register("seoTitleEn")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("seoDefaultDescription")} (AR)</Label>
              <Input {...register("seoDescriptionAr")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("seoDefaultDescription")} (EN)</Label>
              <Input dir="ltr" {...register("seoDescriptionEn")} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="gold" disabled={isSubmitting}>
            <Save className="h-4 w-4" aria-hidden="true" />
            {t("saveSettings")}
          </Button>
        </div>
      </form>
    </div>
  );
}
