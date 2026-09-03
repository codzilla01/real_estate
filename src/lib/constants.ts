import type {
  AppointmentStatus,
  AppointmentType,
  ClientStatus,
  DealStatus,
  DealType,
  LeadPriority,
  LeadSource,
  LeadStatus,
  PropertySort,
  PropertyStatus,
  PropertyType,
  Role,
} from "@/types";

export const PROPERTY_TYPES: PropertyType[] = [
  "villa",
  "apartment",
  "penthouse",
  "townhouse",
  "palace",
  "duplex",
  "commercial",
  "office",
  "land",
];

export const DEAL_TYPES: DealType[] = ["sale", "rent"];

export const PROPERTY_STATUSES: PropertyStatus[] = [
  "available",
  "reserved",
  "sold",
  "rented",
  "draft",
  "archived",
];

export const ROLES: Role[] = [
  "super_admin",
  "admin",
  "manager",
  "agent",
  "editor",
  "viewer",
];

export const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "viewing",
  "negotiation",
  "won",
  "lost",
];

export const LEAD_PRIORITIES: LeadPriority[] = ["low", "medium", "high", "hot"];

export const LEAD_SOURCES: LeadSource[] = [
  "website",
  "whatsapp",
  "phone",
  "facebook",
  "instagram",
  "google",
  "referral",
  "direct",
  "campaign",
];

export const APPOINTMENT_TYPES: AppointmentType[] = [
  "viewing",
  "meeting",
  "call",
  "followup",
];

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "scheduled",
  "completed",
  "cancelled",
  "no_show",
];

export const DEAL_STATUSES: DealStatus[] = [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
];

export const CLIENT_STATUSES: ClientStatus[] = [
  "new",
  "active",
  "hot",
  "inactive",
  "lost",
];

export const SORTS: PropertySort[] = [
  "newest",
  "price_asc",
  "price_desc",
  "area_desc",
  "area_asc",
];

export const AMENITIES: string[] = [
  "pool",
  "gym",
  "parking",
  "security",
  "balcony",
  "garden",
  "beachAccess",
  "concierge",
  "smartHome",
  "centralAc",
  "elevator",
  "childrenPlayArea",
  "shoppingMall",
  "waterfront",
  "marinaView",
  "cityView",
  "seaView",
  "maidRoom",
  "studyRoom",
  "cinema",
  "spa",
  "sauna",
  "bbqArea",
  "roofTerrace",
  "storage",
];

export const CURRENCIES = ["AED", "USD", "SAR", "EGP", "EUR"];

export const DEFAULT_CURRENCY = "AED";

export const CONTACT_INFO = {
  phone: "+971 4 123 4567",
  whatsapp: "971501234567",
  email: "info@almaktab.ae",
  addressAr: "شارع الشيخ زايد، دبي، الإمارات العربية المتحدة",
  addressEn: "Sheikh Zayed Road, Dubai, United Arab Emirates",
};

export const ROLE_PERMISSIONS: Record<
  Role,
  { label: string; canAccessAdmin: boolean; canManageAll: boolean; scoped: boolean }
> = {
  super_admin: { label: "super_admin", canAccessAdmin: true, canManageAll: true, scoped: false },
  admin: { label: "admin", canAccessAdmin: true, canManageAll: true, scoped: false },
  manager: { label: "manager", canAccessAdmin: true, canManageAll: true, scoped: false },
  agent: { label: "agent", canAccessAdmin: true, canManageAll: false, scoped: true },
  editor: { label: "editor", canAccessAdmin: true, canManageAll: false, scoped: true },
  viewer: { label: "viewer", canAccessAdmin: true, canManageAll: false, scoped: true },
};
