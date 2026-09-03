"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { CalendarCheck, MessageSquare, CheckCircle2 } from "lucide-react";
import type { Property } from "@/types";
import { viewingSchema, inquirySchema, type ViewingFormValues, type InquiryFormValues } from "@/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminService } from "@/lib/admin-service";
import { cn } from "@/lib/utils";

interface LeadCaptureFormProps {
  property: Property;
  mode: "viewing" | "inquiry";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadCaptureForm({
  property,
  mode,
  open,
  onOpenChange,
}: LeadCaptureFormProps) {
  const locale = useLocale() as "ar" | "en";
  const t = useTranslations("property");
  const [submitted, setSubmitted] = useState(false);

  const isViewing = mode === "viewing";
  const schema = isViewing ? viewingSchema : inquirySchema;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ViewingFormValues | InquiryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { propertyId: property.id },
  });

  const onSubmit = async (values: ViewingFormValues | InquiryFormValues) => {
    try {
      await adminService.createLead({
        name: values.name,
        phone: values.phone,
        email: values.email || undefined,
        source: "website",
        propertyId: property.id,
        priority: "medium",
        status: "new",
        notes:
          isViewing
            ? locale === "ar"
              ? `طلب معاينة — ${(values as ViewingFormValues).preferredDate ?? ""} ${(values as ViewingFormValues).preferredTime ?? ""}`
              : `Viewing request — ${(values as ViewingFormValues).preferredDate ?? ""} ${(values as ViewingFormValues).preferredTime ?? ""}`
            : (values as InquiryFormValues).message,
      });

      if (!isViewing) {
        await adminService.createInquiry({
          name: values.name,
          phone: values.phone,
          email: values.email || undefined,
          subject: (values as InquiryFormValues).subject || property.title.en,
          message: (values as InquiryFormValues).message,
          propertyId: property.id,
          source: "website",
          status: "new",
        });
      }

      if (isViewing) {
        await adminService.createAppointment({
          type: "viewing",
          propertyId: property.id,
          clientName: values.name,
          clientPhone: values.phone,
          date: (values as ViewingFormValues).preferredDate || new Date().toISOString().slice(0, 10),
          time: (values as ViewingFormValues).preferredTime || undefined,
          status: "scheduled",
          notes: (values as ViewingFormValues).message,
        });
      }

      setSubmitted(true);
      toast.success(t("submitted"));
      reset();
    } catch {
      toast.error(locale === "ar" ? "حدث خطأ، حاول مجددًا" : "Something went wrong");
    }
  };

  const handleClose = (next: boolean) => {
    if (!next) setSubmitted(false);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isViewing ? (
              <CalendarCheck className="h-5 w-5 text-gold" aria-hidden="true" />
            ) : (
              <MessageSquare className="h-5 w-5 text-gold" aria-hidden="true" />
            )}
            {isViewing ? t("viewingTitle") : t("inquiryTitle")}
          </DialogTitle>
          <DialogDescription>
            {isViewing ? t("viewingDesc") : t("inquiryDesc")}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="h-14 w-14 text-success" aria-hidden="true" />
            <p className="font-semibold">{t("submitted")}</p>
            <Button variant="outline" onClick={() => handleClose(false)}>
              {locale === "ar" ? "إغلاق" : "Close"}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="lead-name">{locale === "ar" ? "الاسم الكامل" : "Full name"} *</Label>
              <Input id="lead-name" placeholder={locale === "ar" ? "اسمك الكريم" : "Your name"} {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{locale === "ar" ? "الاسم مطلوب" : "Name is required"}</p>}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="lead-phone">{locale === "ar" ? "رقم الهاتف" : "Phone"} *</Label>
                <Input id="lead-phone" type="tel" placeholder="+971 5X XXX XXXX" dir="ltr" {...register("phone")} />
                {errors.phone && <p className="text-xs text-destructive">{locale === "ar" ? "رقم الهاتف مطلوب" : "Phone is required"}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead-email">{locale === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
                <Input id="lead-email" type="email" placeholder="you@email.com" dir="ltr" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{locale === "ar" ? "بريد غير صالح" : "Invalid email"}</p>}
              </div>
            </div>

            {isViewing && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="lead-date">{t("preferredDate")}</Label>
                  <Input id="lead-date" type="date" {...register("preferredDate")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lead-time">{t("preferredTime")}</Label>
                  <Input id="lead-time" type="time" {...register("preferredTime")} />
                </div>
              </div>
            )}

            {!isViewing && (
              <div className="space-y-1.5">
                <Label htmlFor="lead-message">{t("inquiryMessage")}</Label>
                <Textarea
                  id="lead-message"
                  rows={3}
                  placeholder={t("inquiryMessagePlaceholder")}
                  {...register("message")}
                  className={cn(errors.message && "border-destructive")}
                />
                {errors.message && <p className="text-xs text-destructive">{locale === "ar" ? "أدخل رسالتك" : "Enter your message"}</p>}
              </div>
            )}

            <Button type="submit" variant="gold" className="w-full" disabled={isSubmitting}>
              {isSubmitting
                ? locale === "ar" ? "جارٍ الإرسال..." : "Sending..."
                : isViewing
                  ? t("requestViewing")
                  : t("sendInquiry")}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
