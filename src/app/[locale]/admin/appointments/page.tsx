"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, CalendarDays } from "lucide-react";
import { useAdminCollection } from "@/hooks/use-admin-data";
import { adminService } from "@/lib/admin-service";
import { AppointmentFormDialog } from "@/components/admin/appointment-form-dialog";
import { formatDate, l10n } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Appointment } from "@/types";

export default function AdminAppointmentsPage() {
  const locale = useLocale() as "ar" | "en";
  const t = useTranslations("admin");

  const { data: appointments, loading } = useAdminCollection(() =>
    adminService.listAppointments(),
  );
  const { data: properties } = useAdminCollection(() => adminService.listProperties());
  const { data: agents } = useAdminCollection(() => adminService.listAgents());

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);

  const sorted = useMemo(
    () => [...appointments].sort((a, b) => a.date.localeCompare(b.date)),
    [appointments],
  );

  const propertyName = (id?: string) => {
    const p = properties.find((x) => x.id === id);
    return p ? l10n(p.title, locale) : "";
  };

  const today = new Date().toISOString().slice(0, 10);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await adminService.deleteAppointment(deleteTarget.id);
    toast.success(locale === "ar" ? "تم الحذف" : "Deleted");
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">{t("appointments")}</h1>
        <Button variant="gold" size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("newAppointment")}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          title={t("noAppointments")}
          actionLabel={t("createFirstAppointment")}
          onAction={() => { setEditing(null); setFormOpen(true); }}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>{t("appointmentType")}</TableHead>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("title")}</TableHead>
                <TableHead>{t("appointmentDate")}</TableHead>
                <TableHead>{t("appointmentTime")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead className="text-end">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((appt) => (
                <TableRow key={appt.id}>
                  <TableCell>
                    <Badge variant="info">
                      <CalendarDays className="h-3 w-3" aria-hidden="true" />
                      {appt.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">{appt.clientName ?? "—"}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {propertyName(appt.propertyId) || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={appt.date === today ? "gold" : "muted"}>{appt.date}</Badge>
                  </TableCell>
                  <TableCell dir="ltr" className="text-muted-foreground">{appt.time ?? "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        appt.status === "completed"
                          ? "success"
                          : appt.status === "cancelled"
                            ? "destructive"
                            : "warning"
                      }
                    >
                      {appt.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="iconSm" onClick={() => { setEditing(appt); setFormOpen(true); }} aria-label={t("edit")}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="iconSm" className="text-destructive" onClick={() => setDeleteTarget(appt)} aria-label={t("delete")}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AppointmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        appointment={editing}
        properties={properties}
        agents={agents}
      />

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("deleteConfirm")}</DialogTitle>
            <DialogDescription>
              {deleteTarget?.clientName} · {formatDate(deleteTarget?.date ?? "", locale)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>{t("cancel")}</Button>
            <Button variant="destructive" onClick={confirmDelete}>{t("delete")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
