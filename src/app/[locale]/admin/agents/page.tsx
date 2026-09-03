"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAdminCollection } from "@/hooks/use-admin-data";
import { adminService } from "@/lib/admin-service";
import { AgentFormDialog } from "@/components/admin/agent-form-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { initials } from "@/lib/utils";
import type { Agent } from "@/types";

export default function AdminAgentsPage() {
  const locale = useLocale() as "ar" | "en";
  const t = useTranslations("admin");

  const { data: agents, loading } = useAdminCollection(() => adminService.listAgents());
  const { data: properties } = useAdminCollection(() => adminService.listProperties());

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Agent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Agent | null>(null);

  const countProperties = (agentId: string) =>
    properties.filter((p) => p.agentId === agentId).length;

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await adminService.deleteAgent(deleteTarget.id);
    toast.success(locale === "ar" ? "تم الحذف" : "Deleted");
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">{t("agents")}</h1>
        <Button variant="gold" size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("newAgent")}
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <EmptyState
          title={t("noAgents")}
          actionLabel={t("createFirstAgent")}
          onAction={() => { setEditing(null); setFormOpen(true); }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14">
                    {agent.photo ? <AvatarImage src={agent.photo} alt={agent.name} /> : null}
                    <AvatarFallback className="bg-gold/15 text-lg font-black text-gold">
                      {initials(agent.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{agent.name}</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">
                      {agent.phone}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge variant="goldSoft">
                        {agent.experienceYears} {locale === "ar" ? "سنة" : "yrs"}
                      </Badge>
                      <Badge variant="muted">
                        {countProperties(agent.id)} {t("properties")}
                      </Badge>
                      <Badge variant={agent.isActive ? "success" : "muted"}>
                        {agent.isActive ? (locale === "ar" ? "نشط" : "Active") : (locale === "ar" ? "غير نشط" : "Inactive")}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="iconSm" onClick={() => { setEditing(agent); setFormOpen(true); }} aria-label={t("edit")}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="iconSm" className="text-destructive" onClick={() => setDeleteTarget(agent)} aria-label={t("delete")}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {agent.areas && agent.areas.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {agent.areas.map((area) => (
                      <span key={area} className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground">
                        {area}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AgentFormDialog open={formOpen} onOpenChange={setFormOpen} agent={editing} />

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
