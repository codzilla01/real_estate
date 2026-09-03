"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { leadSchema, type LeadFormValues } from "@/schemas";
import { LEAD_PRIORITIES, LEAD_SOURCES, LEAD_STATUSES } from "@/lib/constants";
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
import type { Agent, Lead, Property } from "@/types";

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
  properties: Property[];
  agents: Agent[];
}

const empty: LeadFormValues = {
  name: "",
  phone: "",
  email: "",
  source: "website",
  propertyId: "",
  budget: "",
  location: "",
  agentId: "",
  priority: "medium",
  status: "new",
  notes: "",
  nextFollowUp: "",
};

function leadToValues(lead: Lead): LeadFormValues {
  return {
    name: lead.name,
    phone: lead.phone,
    email: lead.email ?? "",
    source: lead.source,
    propertyId: lead.propertyId ?? "",
    budget: lead.budget ?? "",
    location: lead.location ?? "",
    agentId: lead.agentId ?? "",
    priority: lead.priority,
    status: lead.status,
    notes: lead.notes ?? "",
    nextFollowUp: lead.nextFollowUp ? lead.nextFollowUp.slice(0, 10) : "",
  };
}

export function LeadFormDialog({ open, onOpenChange, lead, properties, agents }: LeadFormDialogProps) {
  const locale = useLocale() as "ar" | "en";
  const t = useTranslations("admin");

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({ resolver: zodResolver(leadSchema), defaultValues: empty });

  useEffect(() => {
    if (open) reset(lead ? leadToValues(lead) : empty);
  }, [open, lead, reset]);

  const onSubmit = async (values: LeadFormValues) => {
    try {
      const payload = {
        name: values.name,
        phone: values.phone,
        email: values.email || undefined,
        source: values.source,
        propertyId: values.propertyId || undefined,
        budget: values.budget ? Number(values.budget) : undefined,
        location: values.location || undefined,
        agentId: values.agentId || undefined,
        priority: values.priority,
        status: values.status,
        notes: values.notes || undefined,
        nextFollowUp: values.nextFollowUp || undefined,
      };
      if (lead) {
        await adminService.updateLead(lead.id, payload);
        toast.success(locale === "ar" ? "تم التحديث" : "Updated");
      } else {
        await adminService.createLead(payload);
        toast.success(locale === "ar" ? "تم إنشاء العميل المحتمل" : "Lead created");
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
          <DialogTitle>{lead ? t("editLead") : t("newLead")}</DialogTitle>
          <DialogDescription>
            {locale === "ar" ? "إدارة بيانات العميل المحتمل" : "Manage lead details"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="lead-name">{t("name")} *</Label>
              <Input id="lead-name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">Required</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-phone">{t("phone")} *</Label>
              <Input id="lead-phone" dir="ltr" {...register("phone")} />
              {errors.phone && <p className="text-xs text-destructive">Required</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-email">{t("email")}</Label>
              <Input id="lead-email" type="email" dir="ltr" {...register("email")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("source")}</Label>
              <Controller
                control={control}
                name="source"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEAD_SOURCES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("pipelineStage")}</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEAD_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("priority")}</Label>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEAD_PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
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
              <Label>{t("title")}</Label>
              <Controller
                control={control}
                name="propertyId"
                render={({ field }) => (
                  <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {properties.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {l10n(p.title, locale)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-budget">{t("budget")}</Label>
              <Input id="lead-budget" type="number" dir="ltr" {...register("budget")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-location">{t("interestedAreas")}</Label>
              <Input id="lead-location" {...register("location")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-followup">{t("nextFollowUp")}</Label>
              <Input id="lead-followup" type="date" {...register("nextFollowUp")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-notes">{t("notes")}</Label>
            <Textarea id="lead-notes" rows={2} {...register("notes")} />
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" variant="gold" disabled={isSubmitting}>
              {isSubmitting ? "…" : t("saveChanges")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
