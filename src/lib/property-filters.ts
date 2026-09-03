import type { PropertyFilters, PropertySort } from "@/types";

export const PAGE_SIZE_DEFAULT = 12;

export function serializeSearchParams(params: URLSearchParams): PropertyFilters {
  const filters: PropertyFilters = {};

  const q = params.get("q");
  if (q) filters.query = q;

  const dealType = params.get("dealType");
  if (dealType === "sale" || dealType === "rent") filters.dealType = dealType;

  const type = params.get("type");
  if (type) filters.type = type as PropertyFilters["type"];

  const city = params.get("city");
  if (city) filters.city = city;

  const area = params.get("area");
  if (area) filters.area = area;

  const minPrice = params.get("minPrice");
  if (minPrice && !isNaN(Number(minPrice))) filters.minPrice = Number(minPrice);

  const maxPrice = params.get("maxPrice");
  if (maxPrice && !isNaN(Number(maxPrice))) filters.maxPrice = Number(maxPrice);

  const minArea = params.get("minArea");
  if (minArea && !isNaN(Number(minArea))) filters.minArea = Number(minArea);

  const maxArea = params.get("maxArea");
  if (maxArea && !isNaN(Number(maxArea))) filters.maxArea = Number(maxArea);

  const bedrooms = params.get("bedrooms");
  if (bedrooms && !isNaN(Number(bedrooms))) filters.bedrooms = Number(bedrooms);

  const bathrooms = params.get("bathrooms");
  if (bathrooms && !isNaN(Number(bathrooms))) filters.bathrooms = Number(bathrooms);

  const parking = params.get("parking");
  if (parking && !isNaN(Number(parking))) filters.parking = Number(parking);

  if (params.get("furnished") === "true") filters.furnished = true;
  if (params.get("featured") === "true") filters.featured = true;

  const status = params.get("status");
  if (status) filters.status = status as PropertyFilters["status"];

  const amenities = params.getAll("amenity");
  if (amenities.length > 0) filters.amenities = amenities;

  const agentId = params.get("agentId");
  if (agentId) filters.agentId = agentId;

  const sort = params.get("sort") as PropertySort | null;
  if (sort) filters.sort = sort;

  return filters;
}

export function serializeFiltersToParams(
  filters: PropertyFilters,
  existing: URLSearchParams = new URLSearchParams(),
): URLSearchParams {
  const params = new URLSearchParams(existing);
  const set = (key: string, value: string | number | undefined | null) => {
    if (value === undefined || value === null || value === "") params.delete(key);
    else params.set(key, String(value));
  };

  set("q", filters.query);
  set("dealType", filters.dealType);
  set("type", filters.type);
  set("city", filters.city);
  set("area", filters.area);
  set("minPrice", filters.minPrice);
  set("maxPrice", filters.maxPrice);
  set("minArea", filters.minArea);
  set("maxArea", filters.maxArea);
  set("bedrooms", filters.bedrooms);
  set("bathrooms", filters.bathrooms);
  set("parking", filters.parking);
  set("furnished", filters.furnished === true ? "true" : undefined);
  set("featured", filters.featured === true ? "true" : undefined);
  set("status", filters.status);
  set("sort", filters.sort);

  params.delete("amenity");
  filters.amenities?.forEach((a) => params.append("amenity", a));

  return params;
}

export function getPropertyCoverImage(images: { url: string; isCover?: boolean }[] | undefined, fallback?: string): string {
  if (!images || images.length === 0) {
    return fallback ?? FALLBACK_PROPERTY_IMAGE;
  }
  const cover = images.find((img) => img.isCover) ?? images[0];
  return cover?.url ?? FALLBACK_PROPERTY_IMAGE;
}

export const FALLBACK_PROPERTY_IMAGE =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80";

export const FALLBACK_LOCATION_IMAGE =
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80";

export const FALLBACK_AGENT_IMAGE =
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80";

export function parsePageParam(value: string | null, _pageSize = PAGE_SIZE_DEFAULT): number {
  const page = parseInt(value ?? "1", 10);
  if (isNaN(page) || page < 1) return 1;
  return page;
}
