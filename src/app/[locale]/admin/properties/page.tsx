"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Download,
  Star,
} from "lucide-react";
import { useAdminCollection } from "@/hooks/use-admin-data";
import { adminService } from "@/lib/admin-service";
import { PropertyFormDialog } from "@/components/admin/property-form-dialog";
import {
  PropertyStatusBadge,
  propertyTypeLabel,
} from "@/components/property/property-status-badge";
import { getPropertyCoverImage } from "@/lib/property-filters";
import { formatPrice, l10n, downloadCsv } from "@/lib/utils";
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
import type { Property } from "@/types";

export default function AdminPropertiesPage() {
  const locale = useLocale() as "ar" | "en";
  const t = useTranslations("admin");

  const { data: properties, loading } = useAdminCollection(() =>
    adminService.listProperties(),
  );
  const { data: agents } = useAdminCollection(() => adminService.listAgents());

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      const q = search.toLowerCase();
      const matchesQuery =
        !q ||
        l10n(p.title, locale).toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" || p.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [properties, search, statusFilter, locale]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (property: Property) => {
    setEditing(property);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminService.deleteProperty(deleteTarget.id);
      toast.success(locale === "ar" ? "تم حذف العقار" : "Property deleted");
      setDeleteTarget(null);
    } catch {
      toast.error(locale === "ar" ? "حدث خطأ" : "Something went wrong");
    }
  };

  const exportCsv = () => {
    const rows = filtered.map((p) => ({
      id: p.id,
      slug: p.slug,
      title_ar: p.title.ar,
      title_en: p.title.en,
      type: p.type,
      dealType: p.dealType,
      status: p.status,
      price: p.price,
      currency: p.currency,
      area: p.area,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      parking: p.parking,
      city: p.city,
      featured: p.featured,
      views: p.views,
    }));
    downloadCsv(`properties-${Date.now()}.csv`, rows);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">{t("properties")}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4" aria-hidden="true" />
            {t("exportCsv")}
          </Button>
          <Button variant="gold" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("newProperty")}
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" aria-hidden="true" />
          <Input
            placeholder={t("searchProperties")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rtl:pl-3 rtl:pr-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["all", "available", "reserved", "sold", "rented", "draft"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === status
                  ? "bg-gold text-black"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {status === "all"
                ? locale === "ar" ? "الكل" : "All"
                : status === "available" ? (locale === "ar" ? "متاح" : "Available")
                : status === "reserved" ? (locale === "ar" ? "محجوز" : "Reserved")
                : status === "sold" ? (locale === "ar" ? "مباع" : "Sold")
                : status === "rented" ? (locale === "ar" ? "مؤجّر" : "Rented")
                : (locale === "ar" ? "مسودة" : "Draft")}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={t("noProperties")}
          description={locale === "ar" ? "أضف أول عقار لبدء عرضه للجمهور" : "Add your first property to start showcasing"}
          actionLabel={t("createFirstProperty")}
          onAction={openCreate}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-[280px]">{t("title")}</TableHead>
                <TableHead>{t("propertyType")}</TableHead>
                <TableHead>{t("price")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead className="text-center">Featured</TableHead>
                <TableHead className="text-end">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((property) => (
                <TableRow key={property.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getPropertyCoverImage(property.images)}
                        alt=""
                        className="h-11 w-16 rounded-md object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {l10n(property.title, locale)}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground" dir="ltr">
                          {property.slug}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="goldSoft">{propertyTypeLabel(property.type, locale)}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold" dir="ltr">
                      {formatPrice(property.price, property.currency, locale)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <PropertyStatusBadge status={property.status} locale={locale} />
                  </TableCell>
                  <TableCell className="text-center">
                    {property.featured && (
                      <Star className="mx-auto h-4 w-4 fill-gold text-gold" aria-hidden="true" />
                    )}
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="iconSm" onClick={() => openEdit(property)} aria-label={t("edit")}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="iconSm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(property)}
                        aria-label={t("delete")}
                      >
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

      <PropertyFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        property={editing}
        agents={agents}
        onSaved={() => {}}
      />

      {/* Delete confirm */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("deleteConfirm")}</DialogTitle>
            <DialogDescription>
              {deleteTarget ? l10n(deleteTarget.title, locale) : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t("cancel")}
            </Button>
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
