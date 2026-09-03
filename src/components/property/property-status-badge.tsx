import type { PropertyStatus } from "@/types";
import { Badge } from "@/components/ui/badge";

export function propertyStatusTone(status: PropertyStatus): {
  variant: "success" | "warning" | "destructive" | "info" | "muted" | "gold";
  label: { ar: string; en: string };
} {
  switch (status) {
    case "available":
      return { variant: "success", label: { ar: "متاح", en: "Available" } };
    case "reserved":
      return { variant: "warning", label: { ar: "محجوز", en: "Reserved" } };
    case "sold":
      return { variant: "destructive", label: { ar: "مباع", en: "Sold" } };
    case "rented":
      return { variant: "info", label: { ar: "مؤجّر", en: "Rented" } };
    case "draft":
      return { variant: "muted", label: { ar: "مسودة", en: "Draft" } };
    case "archived":
      return { variant: "muted", label: { ar: "مؤرشف", en: "Archived" } };
  }
}

export function PropertyStatusBadge({
  status,
  locale,
  className,
}: {
  status: PropertyStatus;
  locale: "ar" | "en";
  className?: string;
}) {
  const tone = propertyStatusTone(status);
  return (
    <Badge variant={tone.variant} className={className}>
      {tone.label[locale]}
    </Badge>
  );
}

export function propertyTypeLabel(
  type: string,
  locale: "ar" | "en",
): string {
  const map: Record<string, { ar: string; en: string }> = {
    villa: { ar: "فيلا", en: "Villa" },
    apartment: { ar: "شقة", en: "Apartment" },
    penthouse: { ar: "بنتهاوس", en: "Penthouse" },
    townhouse: { ar: "تاون هاوس", en: "Townhouse" },
    palace: { ar: "قصر", en: "Palace" },
    duplex: { ar: "دوبلكس", en: "Duplex" },
    commercial: { ar: "تجاري", en: "Commercial" },
    office: { ar: "مكتب", en: "Office" },
    land: { ar: "أرض", en: "Land" },
  };
  return map[type]?.[locale] ?? type;
}

export function dealTypeLabel(
  dealType: "sale" | "rent",
  locale: "ar" | "en",
): string {
  return dealType === "sale"
    ? locale === "ar" ? "بيع" : "Sale"
    : locale === "ar" ? "إيجار" : "Rent";
}
