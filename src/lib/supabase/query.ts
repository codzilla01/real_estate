import { getSupabaseServerClient } from "@/lib/supabase/server";
import { paginate } from "@/lib/query";
import type {
  Agent,
  PaginatedResult,
  Property,
  PropertyFilters,
} from "@/types";

/**
 * Supabase-backed read queries.
 * These map the SQL schema (see supabase/migrations) to the app domain types.
 * Columns follow the migrations' naming: properties, property_images, agents, ...
 */

interface PropertyRow {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  type: string;
  deal_type: string;
  status: string;
  price: number;
  currency: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  year_built: number | null;
  furnished: boolean;
  city: string;
  area_name: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  amenities: string[];
  features: string[] | null;
  agent_id: string | null;
  featured: boolean;
  is_new: boolean | null;
  is_hot: boolean | null;
  published_at: string;
  created_at: string;
  updated_at: string;
  views: number;
  seo_title_ar?: string | null;
  seo_title_en?: string | null;
  seo_description_ar?: string | null;
  seo_description_en?: string | null;
  images?: Array<{ id: string; url: string; is_cover: boolean; sort_order: number }>;
  agent_name?: string | null;
}

function mapPropertyRow(row: PropertyRow): Property {
  return {
    id: row.id,
    slug: row.slug,
    title: { ar: row.title_ar, en: row.title_en },
    description: { ar: row.description_ar, en: row.description_en },
    type: row.type as Property["type"],
    dealType: row.deal_type as Property["dealType"],
    status: row.status as Property["status"],
    price: row.price,
    currency: row.currency,
    area: row.area,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    parking: row.parking,
    yearBuilt: row.year_built ?? undefined,
    furnished: row.furnished,
    city: row.city,
    areaName: row.area_name ?? undefined,
    address: row.address ?? undefined,
    latitude: row.latitude,
    longitude: row.longitude,
    amenities: row.amenities ?? [],
    features: row.features ?? undefined,
    agentId: row.agent_id ?? undefined,
    featured: row.featured,
    isNew: row.is_new ?? false,
    isHot: row.is_hot ?? false,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    views: row.views ?? 0,
    seoTitle:
      row.seo_title_ar || row.seo_title_en
        ? { ar: row.seo_title_ar ?? "", en: row.seo_title_en ?? "" }
        : undefined,
    seoDescription:
      row.seo_description_ar || row.seo_description_en
        ? { ar: row.seo_description_ar ?? "", en: row.seo_description_en ?? "" }
        : undefined,
    images:
      row.images?.map((img) => ({
        id: img.id,
        url: img.url,
        isCover: img.is_cover,
        order: img.sort_order,
      })) ?? [],
  };
}

function buildFilterChain(query: any, filters: PropertyFilters) {
  let q = query;
  if (filters.dealType) q = q.eq("deal_type", filters.dealType);
  if (filters.type) q = q.eq("type", filters.type);
  if (filters.city) q = q.eq("city", filters.city);
  if (filters.minPrice != null) q = q.gte("price", filters.minPrice);
  if (filters.maxPrice != null) q = q.lte("price", filters.maxPrice);
  if (filters.minArea != null) q = q.gte("area", filters.minArea);
  if (filters.maxArea != null) q = q.lte("area", filters.maxArea);
  if (filters.bedrooms != null && filters.bedrooms > 0)
    q = q.gte("bedrooms", filters.bedrooms);
  if (filters.bathrooms != null && filters.bathrooms > 0)
    q = q.gte("bathrooms", filters.bathrooms);
  if (filters.furnished === true) q = q.eq("furnished", true);
  if (filters.featured === true) q = q.eq("featured", true);
  if (filters.agentId) q = q.eq("agent_id", filters.agentId);
  const status = filters.status ?? "available";
  q = q.eq("status", status);
  return q;
}

export async function createSupabaseQuery(
  filters: PropertyFilters,
  page: number,
  pageSize: number,
): Promise<PaginatedResult<Property>> {
  const client = await getSupabaseServerClient();
  if (!client) return { items: [], pagination: { page, pageSize, total: 0, totalPages: 1 } };

  const base = client
    .from("properties")
    .select("*, images:property_images(id, url, is_cover, sort_order)", { count: "exact" });
  const chained = buildFilterChain(base, filters);

  const { data, error, count } = await chained
    .order(filters.sort === "price_asc" ? "price" : filters.sort === "price_desc" ? "price" : "published_at", {
      ascending: filters.sort === "price_asc" || filters.sort === "area_asc",
    })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error || !data) {
    console.error("Supabase query error", error);
    return { items: [], pagination: { page, pageSize, total: 0, totalPages: 1 } };
  }

  const items = (data as PropertyRow[]).map(mapPropertyRow);
  if (count != null) {
    const totalPages = Math.max(1, Math.ceil(count / pageSize));
    return { items, pagination: { page, pageSize, total: count, totalPages } };
  }
  return paginate(items, page, pageSize);
}

export async function fetchAllPropertiesFromDb(
  filters: PropertyFilters,
): Promise<Property[]> {
  const client = await getSupabaseServerClient();
  if (!client) return [];
  const base = client
    .from("properties")
    .select("*, images:property_images(id, url, is_cover, sort_order)");
  const chained = buildFilterChain(base, filters);
  const { data, error } = await chained;
  if (error || !data) return [];
  return (data as PropertyRow[]).map(mapPropertyRow);
}

export async function fetchPropertyFromDb(slug: string): Promise<Property | null> {
  const client = await getSupabaseServerClient();
  if (!client) return null;
  const { data, error } = await client
    .from("properties")
    .select("*, images:property_images(id, url, is_cover, sort_order)")
    .eq("slug", slug)
    .single();
  if (error || !data) return null;
  return mapPropertyRow(data as PropertyRow);
}

export async function fetchAgentsFromDb(): Promise<Agent[]> {
  const client = await getSupabaseServerClient();
  if (!client) return [];
  const { data, error } = await client
    .from("agents")
    .select("*")
    .eq("is_active", true);
  if (error || !data) return [];
  return (data as any[]).map((row) => ({
    id: row.id,
    name: row.name,
    photo: row.photo ?? undefined,
    phone: row.phone,
    whatsapp: row.whatsapp ?? undefined,
    email: row.email ?? undefined,
    bio: row.bio_ar || row.bio_en ? { ar: row.bio_ar ?? "", en: row.bio_en ?? "" } : undefined,
    languages: row.languages ?? [],
    areas: row.areas ?? [],
    specialties: row.specialties ?? [],
    experienceYears: row.experience_years ?? 0,
    isActive: row.is_active,
    createdAt: row.created_at,
  }));
}
