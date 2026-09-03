"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Send, CheckCircle2 } from "lucide-react";
import { contactSchema, type ContactFormValues } from "@/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminService } from "@/lib/admin-service";
import { cn } from "@/lib/utils";

export function ContactForm() {
  const locale = useLocale() as "ar" | "en";
  const t = useTranslations("contact");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (values: ContactFormValues) => {
    try {
      await adminService.createInquiry({
        name: values.name,
        phone: values.phone,
        email: values.email || undefined,
        subject: values.subject || undefined,
        message: values.message,
        source: "website",
        status: "new",
      });
      toast.success(t("success"));
      reset();
    } catch {
      toast.error(locale === "ar" ? "حدث خطأ، حاول مجددًا" : "Something went wrong");
    }
  };

  const fieldError = (key: keyof ContactFormValues) =>
    errors[key] ? (
      <p className="text-xs text-destructive">
        {locale === "ar" ? "هذا الحقل مطلوب" : "This field is required"}
      </p>
    ) : null;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
        <Send className="h-5 w-5 text-gold" aria-hidden="true" />
        {t("formTitle")}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="contact-name">{t("name")} *</Label>
            <Input id="contact-name" placeholder={locale === "ar" ? "الاسم الكامل" : "Full name"} {...register("name")} className={cn(errors.name && "border-destructive")} />
            {fieldError("name")}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-phone">{t("phone")} *</Label>
            <Input id="contact-phone" type="tel" dir="ltr" placeholder="+971 5X XXX XXXX" {...register("phone")} className={cn(errors.phone && "border-destructive")} />
            {fieldError("phone")}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="contact-email">{t("email")}</Label>
            <Input id="contact-email" type="email" dir="ltr" placeholder="you@email.com" {...register("email")} className={cn(errors.email && "border-destructive")} />
            {errors.email && (
              <p className="text-xs text-destructive">{locale === "ar" ? "بريد غير صالح" : "Invalid email"}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-subject">{t("subject")}</Label>
            <Input id="contact-subject" placeholder={locale === "ar" ? "موضوع الرسالة" : "Subject"} {...register("subject")} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contact-message">{t("message")} *</Label>
          <Textarea
            id="contact-message"
            rows={5}
            placeholder={t("messagePlaceholder")}
            {...register("message")}
            className={cn(errors.message && "border-destructive")}
          />
          {errors.message && (
            <p className="text-xs text-destructive">
              {locale === "ar" ? "أدخل رسالتك (5 أحرف على الأقل)" : "Enter your message (min 5 characters)"}
            </p>
          )}
        </div>

        <Button type="submit" variant="gold" size="lg" className="w-full sm:w-auto" disabled={isSubmitting}>
          {isSubmitting ? (
            locale === "ar" ? "جارٍ الإرسال..." : "Sending..."
          ) : (
            <>
              <Send className="h-4 w-4" aria-hidden="true" />
              {t("send")}
            </>
          )}
        </Button>
      </form>

      <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
        {locale === "ar" ? "نرد خلال 24 ساعة عمل" : "We reply within 24 business hours"}
      </p>
    </div>
  );
}
