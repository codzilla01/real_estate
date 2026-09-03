import type {
  PaginatedResult,
  Property,
  PropertyFilters,
} from "@/types";

const DEFAULT_PAGE_SIZE = 12;

export function filterProperties(
  properties: Property[],
  filters: PropertyFilters = {},
): Property[] {
  let result = properties;

  if (filters.query) {
    const q = filters.query.toLowerCase().trim();
    result = result.filter(
      (p) =>
        p.title.ar.toLowerCase().includes(q) ||
        p.title.en.toLowerCase().includes(q) ||
        p.description.ar.toLowerCase().includes(q) ||
        p.description.en.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        (p.areaName ?? "").toLowerCase().includes(q),
    );
  }

  if (filters.dealType) {
    result = result.filter((p) => p.dealType === filters.dealType);
  }

  if (filters.type) {
    result = result.filter((p) => p.type === filters.type);
  }

  if (filters.city) {
    result = result.filter((p) => p.city === filters.city);
  }

  if (filters.area) {
    result = result.filter((p) =>
      p.areaName?.toLowerCase() === filters.area?.toLowerCase() ||
      p.city === filters.area ||
      (p.areaName ?? "").toLowerCase().includes((filters.area ?? "").toLowerCase()),
    );
  }

  if (filters.minPrice != null) {
    result = result.filter((p) => p.price >= (filters.minPrice as number));
  }

  if (filters.maxPrice != null) {
    result = result.filter((p) => p.price <= (filters.maxPrice as number));
  }

  if (filters.minArea != null) {
    result = result.filter((p) => p.area >= (filters.minArea as number));
  }

  if (filters.maxArea != null) {
    result = result.filter((p) => p.area <= (filters.maxArea as number));
  }

  if (filters.bedrooms != null && filters.bedrooms > 0) {
    result = result.filter((p) => p.bedrooms >= (filters.bedrooms as number));
  }

  if (filters.bathrooms != null && filters.bathrooms > 0) {
    result = result.filter((p) => p.bathrooms >= (filters.bathrooms as number));
  }

  if (filters.parking != null && filters.parking > 0) {
    result = result.filter((p) => p.parking >= (filters.parking as number));
  }

  if (filters.furnished === true) {
    result = result.filter((p) => p.furnished === true);
  }

  if (filters.featured === true) {
    result = result.filter((p) => p.featured === true);
  }

  if (filters.status) {
    result = result.filter((p) => p.status === filters.status);
  } else {
    // By default, hide drafts & archived from public listings
    result = result.filter(
      (p) => p.status !== "draft" && p.status !== "archived",
    );
  }

  if (filters.amenities && filters.amenities.length > 0) {
    result = result.filter((p) =>
      filters.amenities!.every((a) => p.amenities.includes(a)),
    );
  }

  if (filters.agentId) {
    result = result.filter((p) => p.agentId === filters.agentId);
  }

  return result;
}

export function sortProperties(
  properties: Property[],
  sort: PropertyFilters["sort"] = "newest",
): Property[] {
  const sorted = [...properties];
  switch (sort) {
    case "price_asc":
      sorted.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      sorted.sort((a, b) => b.price - a.price);
      break;
    case "area_desc":
      sorted.sort((a, b) => b.area - a.area);
      break;
    case "area_asc":
      sorted.sort((a, b) => a.area - b.area);
      break;
    case "newest":
    default:
      sorted.sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      );
      break;
  }
  return sorted;
}

export function paginate<T>(
  items: T[],
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): PaginatedResult<T> {
  const safePage = Math.max(1, page);
  const safeSize = Math.max(1, pageSize);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / safeSize));
  const clampedPage = Math.min(safePage, totalPages);
  const start = (clampedPage - 1) * safeSize;
  return {
    items: items.slice(start, start + safeSize),
    pagination: {
      page: clampedPage,
      pageSize: safeSize,
      total,
      totalPages,
    },
  };
}

export function queryProperties(
  properties: Property[],
  filters: PropertyFilters = {},
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): PaginatedResult<Property> {
  const filtered = filterProperties(properties, filters);
  const sorted = sortProperties(filtered, filters.sort);
  return paginate(sorted, page, pageSize);
}
