/**
 * Search filter values + URL serialization.
 * Pure, isomorphic module — safe to import from both Server Components
 * and Client Components (unlike `advanced-filters.tsx`, which is "use client").
 */

export interface FilterValues {
  dealType?: string;
  type?: string;
  city?: string;
  area?: string;
  minPrice?: string;
  maxPrice?: string;
  minArea?: string;
  maxArea?: string;
  bedrooms?: string;
  bathrooms?: string;
  parking?: string;
  furnished?: boolean;
  featured?: boolean;
  sort?: string;
  amenities: string[];
  query?: string;
}

export function defaultFilters(): FilterValues {
  return {
    dealType: undefined,
    type: undefined,
    city: undefined,
    area: undefined,
    minPrice: "",
    maxPrice: "",
    minArea: "",
    maxArea: "",
    bedrooms: "",
    bathrooms: "",
    parking: "",
    furnished: false,
    featured: false,
    sort: "newest",
    amenities: [],
    query: "",
  };
}

export function filtersFromParams(params: URLSearchParams): FilterValues {
  const f = defaultFilters();
  const get = (k: string) => params.get(k) ?? undefined;
  f.dealType = get("dealType");
  f.type = get("type");
  f.city = get("city");
  f.area = get("area");
  f.minPrice = get("minPrice") ?? "";
  f.maxPrice = get("maxPrice") ?? "";
  f.minArea = get("minArea") ?? "";
  f.maxArea = get("maxArea") ?? "";
  f.bedrooms = get("bedrooms") ?? "";
  f.bathrooms = get("bathrooms") ?? "";
  f.parking = get("parking") ?? "";
  f.furnished = params.get("furnished") === "true";
  f.featured = params.get("featured") === "true";
  f.sort = get("sort") ?? "newest";
  f.query = get("q") ?? "";
  f.amenities = params.getAll("amenity");
  return f;
}

export function filtersToParams(filters: FilterValues): URLSearchParams {
  const params = new URLSearchParams();
  const set = (key: string, value?: string) => {
    if (value) params.set(key, value);
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
  set("sort", filters.sort);
  if (filters.furnished) params.set("furnished", "true");
  if (filters.featured) params.set("featured", "true");
  filters.amenities.forEach((a) => params.append("amenity", a));
  return params;
}

/** Read search params from a URLSearchParams-like record (server side). */
export function urlSearchFromParams(params: {
  [key: string]: string | string[] | undefined;
}): URLSearchParams {
  const urlSearch = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((v) => urlSearch.append(key, v));
    else if (value != null) urlSearch.set(key, value);
  });
  return urlSearch;
}
