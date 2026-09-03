"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { appointmentSchema, type AppointmentFormValues } from "@/schemas";
import { APPOINTMENT_STATUSES, APPOINTMENT_TYPES } from "@/lib/constants";
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
import type { Agent, Appointment, Property } from "@/types";

interface AppointmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | null;
  properties: Property[];
  agents: Agent[];
}

const empty: AppointmentFormValues = {
  type: "viewing",
  propertyId: "",
  clientName: "",
  clientPhone: "",
  agentId: "",
  date: new Date().toISOString().slice(0, 10),
  time: "",
  status: "scheduled",
  notes: "",
};

export function AppointmentFormDialog({
  open,
  onOpenChange,
  appointment,
  properties,
  agents,
}: AppointmentFormDialogProps) {
  const locale = useLocale() as "ar" | "en";
  const t = useTranslations("admin");

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: empty,
  });

  useEffect(() => {
    if (open) {
      reset(
        appointment
          ? {
              type: appointment.type,
              propertyId: appointment.propertyId ?? "",
              clientName: appointment.clientName ?? "",
              clientPhone: appointment.clientPhone ?? "",
              agentId: appointment.agentId ?? "",
              date: appointment.date,
              time: appointment.time ?? "",
              status: appointment.status,
              notes: appointment.notes ?? "",
            }
          : empty,
      );
    }
  }, [open, appointment, reset]);

  const onSubmit = async (values: AppointmentFormValues) => {
    try {
      const payload = {
        type: values.type,
        propertyId: values.propertyId || undefined,
        clientName: values.clientName || undefined,
        clientPhone: values.clientPhone || undefined,
        agentId: values.agentId || undefined,
        date: values.date,
        time: values.time || undefined,
        status: values.status,
        notes: values.notes || undefined,
      };
      if (appointment) {
        await adminService.updateAppointment(appointment.id, payload);
        toast.success(locale === "ar" ? "تم التحديث" : "Updated");
      } else {
        await adminService.createAppointment(payload);
        toast.success(locale === "ar" ? "تم إنشاء الموعد" : "Appointment created");
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
          <DialogTitle>{appointment ? t("editAppointment") : t("newAppointment")}</DialogTitle>
          <DialogDescription>
            {locale === "ar" ? "معاينة، اجتماع، مكالمة أو متابعة" : "Viewing, meeting, call or follow-up"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t("appointmentType")}</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {APPOINTMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
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
                      {APPOINTMENT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("name")}</Label>
              <Input {...register("clientName")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("phone")}</Label>
              <Input dir="ltr" {...register("clientPhone")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("appointmentDate")} *</Label>
              <Input type="date" {...register("date")} />
              {errors.date && <p className="text-xs text-destructive">Required</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{t("appointmentTime")}</Label>
              <Input type="time" {...register("time")} />
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
                        <SelectItem key={p.id} value={p.id}>{l10n(p.title, locale)}</SelectItem>
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
