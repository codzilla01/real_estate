"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Download } from "lucide-react";
import { useAdminCollection } from "@/hooks/use-admin-data";
import { adminService } from "@/lib/admin-service";
import { ClientFormDialog } from "@/components/admin/client-form-dialog";
import { formatDate, downloadCsv } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { Client } from "@/types";

export default function AdminClientsPage() {
  const locale = useLocale() as "ar" | "en";
  const t = useTranslations("admin");
  const { data: clients, loading } = useAdminCollection(() => adminService.listClients());
  const { data: agents } = useAdminCollection(() => adminService.listAgents());

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);

  const filtered = useMemo(
    () =>
      clients.filter((c) => {
        const q = search.toLowerCase();
        return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q);
      }),
    [clients, search],
  );

  const agentName = (id?: string) => agents.find((a) => a.id === id)?.name;

  const exportCsv = () => {
    downloadCsv(
      `clients-${Date.now()}.csv`,
      filtered.map((c) => ({
        name: c.name,
        phone: c.phone,
        email: c.email ?? "",
        budget: c.budget ?? "",
        status: c.status,
        agent: agentName(c.agentId) ?? "",
        createdAt: c.createdAt,
      })),
    );
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await adminService.deleteClient(deleteTarget.id);
    toast.success(locale === "ar" ? "تم الحذف" : "Deleted");
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">{t("clients")}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4" aria-hidden="true" />
            {t("exportCsv")}
          </Button>
          <Button variant="gold" size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("newClient")}
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" aria-hidden="true" />
        <Input
          placeholder={t("searchClients")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rtl:pl-3 rtl:pr-9"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={t("noClients")}
          actionLabel={t("createFirstClient")}
          onAction={() => { setEditing(null); setFormOpen(true); }}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("phone")}</TableHead>
                <TableHead>{t("budget")}</TableHead>
                <TableHead>{t("assignedAgent")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("date")}</TableHead>
                <TableHead className="text-end">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-semibold">{client.name}</TableCell>
                  <TableCell dir="ltr" className="text-muted-foreground">{client.phone}</TableCell>
                  <TableCell dir="ltr">
                    {client.budget ? client.budget.toLocaleString("en-US") : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{agentName(client.agentId) ?? "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        client.status === "hot" ? "destructive" : client.status === "active" ? "success" : "muted"
                      }
                    >
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(client.createdAt, locale)}</TableCell>
                  <TableCell className="text-end">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="iconSm" onClick={() => { setEditing(client); setFormOpen(true); }} aria-label={t("edit")}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="iconSm" className="text-destructive" onClick={() => setDeleteTarget(client)} aria-label={t("delete")}>
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

      <ClientFormDialog open={formOpen} onOpenChange={setFormOpen} client={editing} agents={agents} />

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("deleteConfirm")}</DialogTitle>
            <DialogDescription>{deleteTarget?.name}</DialogDescription>
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
