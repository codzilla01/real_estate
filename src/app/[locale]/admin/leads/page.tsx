"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Flame, Phone } from "lucide-react";
import { useAdminCollection } from "@/hooks/use-admin-data";
import { adminService } from "@/lib/admin-service";
import { LEAD_STATUSES } from "@/lib/constants";
import { formatDate, timeAgo, l10n } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LeadFormDialog } from "@/components/admin/lead-form-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Lead } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_META: Record<string, { labelAr: string; labelEn: string; color: string }> = {
  new: { labelAr: "جديد", labelEn: "New", color: "border-info/40 bg-info/5" },
  contacted: { labelAr: "تم التواصل", labelEn: "Contacted", color: "border-info/40 bg-info/5" },
  qualified: { labelAr: "مؤهل", labelEn: "Qualified", color: "border-gold/40 bg-gold/5" },
  viewing: { labelAr: "معاينة", labelEn: "Viewing", color: "border-warning/40 bg-warning/5" },
  negotiation: { labelAr: "تفاوض", labelEn: "Negotiation", color: "border-warning/40 bg-warning/5" },
  won: { labelAr: "صفقة ناجحة", labelEn: "Won", color: "border-success/40 bg-success/5" },
  lost: { labelAr: "ملغي", labelEn: "Lost", color: "border-destructive/40 bg-destructive/5" },
};

export default function AdminLeadsPage() {
  const locale = useLocale() as "ar" | "en";
  const t = useTranslations("admin");

  const { data: leads } = useAdminCollection(() => adminService.listLeads());
  const { data: properties } = useAdminCollection(() => adminService.listProperties());
  const { data: agents } = useAdminCollection(() => adminService.listAgents());

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, Lead[]>();
    LEAD_STATUSES.forEach((status) => map.set(status, []));
    leads.forEach((lead) => {
      const bucket = map.get(lead.status);
      if (bucket) bucket.push(lead);
    });
    return map;
  }, [leads]);

  const propertyTitle = (propertyId?: string) => {
    if (!propertyId) return "";
    const property = properties.find((p) => p.id === propertyId);
    return property ? l10n(property.title, locale) : "";
  };

  const moveLead = async (lead: Lead, nextStatus: string) => {
    await adminService.updateLead(lead.id, { status: nextStatus as Lead["status"] });
    toast.success(locale === "ar" ? "تم تحديث الحالة" : "Status updated");
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await adminService.deleteLead(deleteTarget.id);
    toast.success(locale === "ar" ? "تم الحذف" : "Deleted");
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">{t("leads")}</h1>
        <Button variant="gold" size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("newLead")}
        </Button>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex min-w-max gap-4" style={{ width: "max-content" }}>
          {LEAD_STATUSES.map((status) => {
            const meta = STATUS_META[status]!;
            const items = grouped.get(status) ?? [];
            return (
              <div key={status} className="w-72 shrink-0">
                <div className={cn("mb-3 rounded-xl border p-3", meta.color)}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">
                      {locale === "ar" ? meta.labelAr : meta.labelEn}
                    </p>
                    <Badge variant="muted">{items.length}</Badge>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {items.map((lead) => (
                    <div
                      key={lead.id}
                      className="rounded-xl border border-border bg-card p-3.5 shadow-sm transition-all hover:border-gold/40 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">{lead.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
                            {lead.phone}
                          </p>
                        </div>
                        {lead.priority === "hot" && (
                          <Flame className="h-4 w-4 shrink-0 text-destructive" aria-label="Hot" />
                        )}
                      </div>

                      {lead.propertyId && (
                        <p className="mt-2 truncate text-[11px] text-muted-foreground">
                          🏠 {propertyTitle(lead.propertyId)}
                        </p>
                      )}

                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        <Badge
                          variant={
                            lead.priority === "hot"
                              ? "destructive"
                              : lead.priority === "high"
                                ? "warning"
                                : "muted"
                          }
                        >
                          {lead.priority}
                        </Badge>
                        <Badge variant="muted">{lead.source}</Badge>
                      </div>

                      <p className="mt-2 text-[10px] text-muted-foreground">
                        {timeAgo(lead.createdAt, locale)}
                        {lead.nextFollowUp
                          ? ` · ${locale === "ar" ? "متابعة:" : "Follow-up:"} ${formatDate(lead.nextFollowUp, locale)}`
                          : ""}
                      </p>

                      {/* Move controls */}
                      <div className="mt-3 flex items-center justify-between gap-1">
                        <div className="flex gap-1">
                          <button
                            onClick={() => moveLead(lead, status)}
                            disabled
                            className="rounded-md bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground"
                          >
                            {locale === "ar" ? meta.labelAr : meta.labelEn}
                          </button>
                          {status !== "won" && status !== "lost" && (
                            <select
                              value=""
                              onChange={(e) => e.target.value && moveLead(lead, e.target.value)}
                              className="rounded-md border border-border bg-transparent px-1.5 py-1 text-[10px]"
                              aria-label="Move to"
                            >
                              <option value="">→</option>
                              {LEAD_STATUSES.filter((s) => s !== status).map((s) => (
                                <option key={s} value={s}>
                                  {locale === "ar" ? STATUS_META[s]?.labelAr : STATUS_META[s]?.labelEn}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <div className="flex gap-0.5">
                          <a href={`tel:${lead.phone}`} className="rounded p-1 text-muted-foreground hover:text-gold" aria-label="Call">
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                          <button onClick={() => { setEditing(lead); setFormOpen(true); }} className="rounded p-1 text-muted-foreground hover:text-gold" aria-label="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeleteTarget(lead)} className="rounded p-1 text-muted-foreground hover:text-destructive" aria-label="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                      {locale === "ar" ? "لا يوجد" : "Empty"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <LeadFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        lead={editing}
        properties={properties}
        agents={agents}
      />

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("deleteConfirm")}</DialogTitle>
            <DialogDescription>{deleteTarget?.name}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>{t("cancel")}</Button>
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
