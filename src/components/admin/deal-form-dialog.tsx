"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { dealSchema, type DealFormValues } from "@/schemas";
import { DEAL_STATUSES, DEAL_TYPES } from "@/lib/constants";
import { l10n } from "@/lib/utils";
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
import type { Agent, Deal, Property } from "@/types";

interface DealFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: Deal | null;
  properties: Property[];
  agents: Agent[];
}

const empty: DealFormValues = {
  propertyId: "",
  clientName: "",
  agentId: "",
  type: "sale",
  amount: 0,
  commission: 0,
  status: "pending",
  date: new Date().toISOString().slice(0, 10),
  notes: "",
};

export function DealFormDialog({ open, onOpenChange, deal, properties, agents }: DealFormDialogProps) {
  const locale = useLocale() as "ar" | "en";
  const t = useTranslations("admin");

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DealFormValues>({ resolver: zodResolver(dealSchema), defaultValues: empty });

  const amount = watch("amount");

  useEffect(() => {
    if (open) {
      reset(
        deal
          ? {
              propertyId: deal.propertyId,
              clientName: deal.clientName ?? "",
              agentId: deal.agentId ?? "",
              type: deal.type,
              amount: deal.amount,
              commission: deal.commission,
              status: deal.status,
              date: deal.date.slice(0, 10),
              notes: deal.notes ?? "",
            }
          : empty,
      );
    }
  }, [open, deal, reset]);

  const autoCommission = (value: number) => {
    if (!deal) {
      setValue("commission", Math.round(value * 0.03));
    }
  };

  const onSubmit = async (values: DealFormValues) => {
    try {
      const payload = {
        propertyId: values.propertyId,
        clientName: values.clientName || undefined,
        agentId: values.agentId || undefined,
        type: values.type,
        amount: values.amount,
        commission: values.commission,
        status: values.status,
        date: values.date,
        notes: values.notes || undefined,
      };
      if (deal) {
        await adminService.updateDeal(deal.id, payload);
        toast.success(locale === "ar" ? "تم التحديث" : "Updated");
      } else {
        await adminService.createDeal(payload);
        toast.success(locale === "ar" ? "تم إنشاء الصفقة" : "Deal created");
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
          <DialogTitle>{deal ? t("editDeal") : t("newDeal")}</DialogTitle>
          <DialogDescription>
            {locale === "ar" ? "إدارة الصفقات والعمولات" : "Manage deals and commissions"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("title")} *</Label>
              <Controller
                control={control}
                name="propertyId"
                render={({ field }) => (
                  <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {properties.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{l10n(p.title, locale)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.propertyId && <p className="text-xs text-destructive">Required</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{t("name")} *</Label>
              <Input {...register("clientName")} />
              {errors.clientName && <p className="text-xs text-destructive">Required</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{t("dealType")}</Label>
              <Controller
                control={control}
                name="type"
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
              <Label>{t("dealAmount")} *</Label>
              <Input
                type="number"
                dir="ltr"
                {...register("amount", { valueAsNumber: true, onChange: (e) => autoCommission(Number(e.target.value)) })}
              />
              {errors.amount && <p className="text-xs text-destructive">Required</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{t("commission")} *</Label>
              <Input type="number" dir="ltr" {...register("commission", { valueAsNumber: true })} />
              <p className="text-[10px] text-muted-foreground">
                {locale === "ar" ? "افتراضي 3%" : "Default 3%"} ({amount ? Math.round((amount / 100) * 3).toLocaleString("en-US") : "—"})
              </p>
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
                      {DEAL_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("dealDate")} *</Label>
              <Input type="date" {...register("date")} />
              {errors.date && <p className="text-xs text-destructive">Required</p>}
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
