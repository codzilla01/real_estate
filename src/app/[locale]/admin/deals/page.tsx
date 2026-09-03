"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAdminCollection } from "@/hooks/use-admin-data";
import { adminService } from "@/lib/admin-service";
import { DealFormDialog } from "@/components/admin/deal-form-dialog";
import { formatPrice, formatDate, l10n } from "@/lib/utils";
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
import type { Deal } from "@/types";

export default function AdminDealsPage() {
  const locale = useLocale() as "ar" | "en";
  const t = useTranslations("admin");

  const { data: deals, loading } = useAdminCollection(() => adminService.listDeals());
  const { data: properties } = useAdminCollection(() => adminService.listProperties());
  const { data: agents } = useAdminCollection(() => adminService.listAgents());

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Deal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Deal | null>(null);

  const sorted = useMemo(
    () => [...deals].sort((a, b) => b.date.localeCompare(a.date)),
    [deals],
  );

  const totalCommission = useMemo(
    () => deals.filter((d) => d.status !== "cancelled").reduce((sum, d) => sum + d.commission, 0),
    [deals],
  );

  const propertyName = (id: string) => {
    const p = properties.find((x) => x.id === id);
    return p ? l10n(p.title, locale) : "—";
  };

  const agentName = (id?: string) => agents.find((a) => a.id === id)?.name ?? "—";

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await adminService.deleteDeal(deleteTarget.id);
    toast.success(locale === "ar" ? "تم الحذف" : "Deleted");
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">{t("deals")}</h1>
        <div className="flex items-center gap-3">
          <Badge variant="gold" className="px-3 py-1.5 text-xs">
            {t("reportCommission")}:{" "}
            <span dir="ltr">{formatPrice(totalCommission, "AED", locale)}</span>
          </Badge>
          <Button variant="gold" size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("newDeal")}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          title={t("noDeals")}
          actionLabel={t("createFirstDeal")}
          onAction={() => { setEditing(null); setFormOpen(true); }}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>{t("title")}</TableHead>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("assignedAgent")}</TableHead>
                <TableHead>{t("dealAmount")}</TableHead>
                <TableHead>{t("commission")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("dealDate")}</TableHead>
                <TableHead className="text-end">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell className="max-w-[220px] truncate font-semibold">
                    {propertyName(deal.propertyId)}
                  </TableCell>
                  <TableCell>{deal.clientName ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{agentName(deal.agentId)}</TableCell>
                  <TableCell>
                    <span className="font-bold" dir="ltr">
                      {formatPrice(deal.amount, "AED", locale)}
                    </span>
                  </TableCell>
                  <TableCell dir="ltr">{deal.commission.toLocaleString("en-US")}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        deal.status === "completed"
                          ? "success"
                          : deal.status === "cancelled"
                            ? "destructive"
                            : deal.status === "in_progress"
                              ? "warning"
                              : "muted"
                      }
                    >
                      {deal.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(deal.date, locale)}</TableCell>
                  <TableCell className="text-end">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="iconSm" onClick={() => { setEditing(deal); setFormOpen(true); }} aria-label={t("edit")}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="iconSm" className="text-destructive" onClick={() => setDeleteTarget(deal)} aria-label={t("delete")}>
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

      <DealFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        deal={editing}
        properties={properties}
        agents={agents}
      />

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("deleteConfirm")}</DialogTitle>
            <DialogDescription>
              {deleteTarget?.clientName} · {formatPrice(deleteTarget?.amount ?? 0, "AED", locale)}
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
