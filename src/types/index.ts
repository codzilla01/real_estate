export type Lang = "ar" | "en";

export type DealType = "sale" | "rent";
export type PropertyType =
  | "villa"
  | "apartment"
  | "penthouse"
  | "townhouse"
  | "palace"
  | "duplex"
  | "commercial"
  | "office"
  | "land";

export type PropertyStatus =
  | "available"
  | "reserved"
  | "sold"
  | "rented"
  | "draft"
  | "archived";

export type Role =
  | "super_admin"
  | "admin"
  | "manager"
  | "agent"
  | "editor"
  | "viewer";

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "viewing"
  | "negotiation"
  | "won"
  | "lost";

export type LeadPriority = "low" | "medium" | "high" | "hot";

export type LeadSource =
  | "website"
  | "whatsapp"
  | "phone"
  | "facebook"
  | "instagram"
  | "google"
  | "referral"
  | "direct"
  | "campaign";

export type AppointmentType = "viewing" | "meeting" | "call" | "followup";
export type AppointmentStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "no_show";

export type DealStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type ClientStatus = "new" | "active" | "hot" | "inactive" | "lost";

export interface LocalizedText {
  ar: string;
  en: string;
}

export interface Agent {
  id: string;
  name: string;
  photo?: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  bio?: LocalizedText;
  languages?: string[];
  areas?: string[];
  specialties?: string[];
  experienceYears: number;
  isActive: boolean;
  createdAt: string;
}

export interface PropertyImage {
  id: string;
  url: string;
  alt?: LocalizedText;
  isCover?: boolean;
  order: number;
}

export interface Property {
  id: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  type: PropertyType;
  dealType: DealType;
  status: PropertyStatus;
  price: number;
  currency: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  yearBuilt?: number;
  furnished: boolean;
  city: string;
  areaName?: string;
  address?: string;
  latitude: number;
  longitude: number;
  amenities: string[];
  features?: string[];
  agentId?: string;
  featured: boolean;
  isNew?: boolean;
  isHot?: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  seoTitle?: LocalizedText;
  seoDescription?: LocalizedText;
  views: number;
  images: PropertyImage[];
}

export interface City {
  id: string;
  slug: string;
  name: LocalizedText;
  country: string;
}

export interface Location {
  id: string;
  slug: string;
  name: LocalizedText;
  city: string;
  description?: LocalizedText;
  image?: string;
  latitude: number;
  longitude: number;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: LeadSource;
  propertyId?: string;
  budget?: number;
  location?: string;
  agentId?: string;
  priority: LeadPriority;
  status: LeadStatus;
  notes?: string;
  lastContact?: string;
  nextFollowUp?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  budget?: number;
  interestedAreas?: string[];
  propertyTypes?: PropertyType[];
  bedrooms?: number;
  notes?: string;
  agentId?: string;
  status: ClientStatus;
  createdAt: string;
}

export interface Appointment {
  id: string;
  type: AppointmentType;
  propertyId?: string;
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  agentId?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
}

export interface Deal {
  id: string;
  propertyId: string;
  clientName?: string;
  clientId?: string;
  agentId?: string;
  type: DealType;
  amount: number;
  commission: number;
  status: DealStatus;
  date: string;
  documents?: string[];
  notes?: string;
  createdAt: string;
}

export interface Inquiry {
  id: string;
  name: string;
  phone: string;
  email?: string;
  subject?: string;
  message: string;
  propertyId?: string;
  agentId?: string;
  source: string;
  status: "new" | "contacted" | "closed";
  createdAt: string;
}

export interface Favorite {
  id: string;
  propertyId: string;
  userId?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  type:
    | "new_lead"
    | "new_inquiry"
    | "upcoming_viewing"
    | "lead_followup"
    | "property_sold"
    | "property_reserved"
    | "new_client"
    | "deal_updated"
    | "system";
  title: LocalizedText;
  message?: LocalizedText;
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface ActivityLog {
  id: string;
  action: "create" | "update" | "delete" | "login" | "logout" | "status_change" | "price_change" | "assignment";
  entityType: string;
  entityId?: string;
  entityLabel?: string;
  userId?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface Project {
  id: string;
  slug: string;
  name: LocalizedText;
  developer: string;
  location: string;
  startingPrice: number;
  completionDate: string;
  units: number;
  description?: LocalizedText;
  amenities: string[];
  images: string[];
  isActive: boolean;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  tiktok?: string;
}

export interface SeoDefaults {
  title: LocalizedText;
  description: LocalizedText;
}

export interface Settings {
  id?: string;
  companyName: LocalizedText;
  logo?: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: LocalizedText;
  social: SocialLinks;
  currency: string;
  defaultLanguage: Lang;
  defaultTheme: "dark" | "light";
  seoDefaults: SeoDefaults;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalProperties: number;
  available: number;
  sold: number;
  rented: number;
  reserved: number;
  totalLeads: number;
  hotLeads: number;
  viewings: number;
  deals: number;
  revenue: number;
  totalClients: number;
  totalAgents: number;
  conversionRate: number;
}

export interface PropertyFilters {
  query?: string;
  dealType?: DealType;
  type?: PropertyType;
  city?: string;
  area?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  furnished?: boolean;
  parking?: number;
  featured?: boolean;
  status?: PropertyStatus;
  amenities?: string[];
  agentId?: string;
  sort?: PropertySort;
}

export type PropertySort =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "area_desc"
  | "area_asc";

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: Pagination;
}
