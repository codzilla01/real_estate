"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { agentSchema, type AgentFormValues } from "@/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminService } from "@/lib/admin-service";
import type { Agent } from "@/types";

interface AgentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent?: Agent | null;
}

const empty: AgentFormValues = {
  name: "",
  phone: "",
  whatsapp: "",
  email: "",
  bioAr: "",
  bioEn: "",
  languages: [],
  areas: [],
  specialties: [],
  experienceYears: 1,
  isActive: true,
  photo: "",
};

export function AgentFormDialog({ open, onOpenChange, agent }: AgentFormDialogProps) {
  const locale = useLocale() as "ar" | "en";
  const t = useTranslations("admin");

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AgentFormValues>({ resolver: zodResolver(agentSchema), defaultValues: empty });

  useEffect(() => {
    if (open) {
      reset(
        agent
          ? {
              name: agent.name,
              phone: agent.phone,
              whatsapp: agent.whatsapp ?? "",
              email: agent.email ?? "",
              bioAr: agent.bio?.ar ?? "",
              bioEn: agent.bio?.en ?? "",
              languages: agent.languages ?? [],
              areas: agent.areas ?? [],
              specialties: agent.specialties ?? [],
              experienceYears: agent.experienceYears,
              isActive: agent.isActive,
              photo: agent.photo ?? "",
            }
          : empty,
      );
    }
  }, [open, agent, reset]);

  const onSubmit = async (values: AgentFormValues) => {
    try {
      const payload = {
        name: values.name,
        phone: values.phone,
        whatsapp: values.whatsapp || undefined,
        email: values.email || undefined,
        bio: { ar: values.bioAr || "", en: values.bioEn || "" },
        languages: values.languages,
        areas: values.areas,
        specialties: values.specialties,
        experienceYears: values.experienceYears,
        isActive: values.isActive,
        photo: values.photo || undefined,
      };
      if (agent) {
        await adminService.updateAgent(agent.id, payload);
        toast.success(locale === "ar" ? "تم التحديث" : "Updated");
      } else {
        await adminService.createAgent(payload);
        toast.success(locale === "ar" ? "تم إنشاء الوسيط" : "Agent created");
      }
      onOpenChange(false);
    } catch {
      toast.error(locale === "ar" ? "حدث خطأ" : "Something went wrong");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{agent ? t("editAgent") : t("newAgent")}</DialogTitle>
          <DialogDescription>
            {locale === "ar" ? "إدارة بيانات الوسيط العقاري" : "Manage real estate agent data"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("name")} *</Label>
              <Input {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">Required</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{t("phone")} *</Label>
              <Input dir="ltr" {...register("phone")} />
              {errors.phone && <p className="text-xs text-destructive">Required</p>}
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp</Label>
              <Input dir="ltr" {...register("whatsapp")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("email")}</Label>
              <Input type="email" dir="ltr" {...register("email")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("experience") ?? "Experience (years)"}</Label>
              <Input type="number" min={0} max={60} dir="ltr" {...register("experienceYears", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <Label>Photo URL</Label>
              <Input dir="ltr" {...register("photo")} placeholder="https://..." />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Bio (AR)</Label>
              <Textarea rows={3} {...register("bioAr")} />
            </div>
            <div className="space-y-1.5">
              <Label>Bio (EN)</Label>
              <Textarea rows={3} dir="ltr" {...register("bioEn")} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{locale === "ar" ? "المناطق (مفصولة بفاصلة)" : "Areas (comma separated)"}</Label>
              <Input
                dir="ltr"
                defaultValue={(agent?.areas ?? []).join(", ")}
                {...register("areas")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{locale === "ar" ? "اللغات (مفصولة بفاصلة)" : "Languages (comma separated)"}</Label>
              <Input
                dir="ltr"
                defaultValue={(agent?.languages ?? []).join(", ")}
                {...register("languages")}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            {t("active")}
          </label>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" variant="gold" disabled={isSubmitting}>
              {t("saveChanges")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
