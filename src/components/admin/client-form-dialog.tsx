"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { clientSchema, type ClientFormValues } from "@/schemas";
import { CLIENT_STATUSES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { Agent, Client } from "@/types";

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  agents: Agent[];
}

const empty: ClientFormValues = {
  name: "",
  phone: "",
  whatsapp: "",
  email: "",
  budget: "",
  interestedAreas: [],
  propertyTypes: [],
  bedrooms: "",
  notes: "",
  agentId: "",
  status: "new",
};

export function ClientFormDialog({ open, onOpenChange, client, agents }: ClientFormDialogProps) {
  const locale = useLocale() as "ar" | "en";
  const t = useTranslations("admin");

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({ resolver: zodResolver(clientSchema), defaultValues: empty });

  useEffect(() => {
    if (open) {
      reset(
        client
          ? {
              name: client.name,
              phone: client.phone,
              whatsapp: client.whatsapp ?? "",
              email: client.email ?? "",
              budget: client.budget ?? "",
              interestedAreas: client.interestedAreas ?? [],
              propertyTypes: client.propertyTypes ?? [],
              bedrooms: client.bedrooms ?? "",
              notes: client.notes ?? "",
              agentId: client.agentId ?? "",
              status: client.status,
            }
          : empty,
      );
    }
  }, [open, client, reset]);

  const onSubmit = async (values: ClientFormValues) => {
    try {
      const payload = {
        name: values.name,
        phone: values.phone,
        whatsapp: values.whatsapp || undefined,
        email: values.email || undefined,
        budget: values.budget ? Number(values.budget) : undefined,
        interestedAreas: values.interestedAreas,
        propertyTypes: values.propertyTypes as Client["propertyTypes"],
        bedrooms: values.bedrooms ? Number(values.bedrooms) : undefined,
        notes: values.notes || undefined,
        agentId: values.agentId || undefined,
        status: values.status,
      };
      if (client) {
        await adminService.updateClient(client.id, payload);
        toast.success(locale === "ar" ? "تم التحديث" : "Updated");
      } else {
        await adminService.createClient(payload);
        toast.success(locale === "ar" ? "تم إنشاء العميل" : "Client created");
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
          <DialogTitle>{client ? t("editClient") : t("newClient")}</DialogTitle>
          <DialogDescription>
            {locale === "ar" ? "بيانات العميل في نظام CRM" : "Client data in the CRM"}
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
              <Label>{t("budget")}</Label>
              <Input type="number" dir="ltr" {...register("budget")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("bedrooms")}</Label>
              <Input type="number" dir="ltr" {...register("bedrooms")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("interestedAreas")}</Label>
              <Input
                placeholder={locale === "ar" ? "مناطق مفصولة بفاصلة" : "Comma-separated areas"}
                defaultValue={(client?.interestedAreas ?? []).join(", ")}
                {...register("interestedAreas")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("assignedAgent")}</Label>
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
            <div className="space-y-1.5">
              <Label>{t("userStatus")}</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CLIENT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("notes")}</Label>
            <Textarea rows={2} {...register("notes")} />
          </div>
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
