import { isSupabaseConfigured } from "@/lib/env";
import { getSeedData } from "@/lib/seed-data";
import { queryProperties, filterProperties, sortProperties } from "@/lib/query";
import type {
  Agent,
  City,
  DealType,
  Location,
  PaginatedResult,
  Project,
  Property,
  PropertyFilters,
  Settings,
} from "@/types";
import { demoStore } from "@/lib/demo/store";

/**
 * Read service for public pages.
 * Uses Supabase when configured, otherwise serves curated seed data
 * so the platform is fully browsable out of the box.
 */

const seed = getSeedData();

export async function fetchProperties(
  filters: PropertyFilters = {},
  page = 1,
  pageSize = 12,
): Promise<PaginatedResult<Property>> {
  if (isSupabaseConfigured()) {
    // Real DB query built from the same filters (see supabase/README notes)
    const { createSupabaseQuery } = await import("@/lib/supabase/query");
    return createSupabaseQuery(filters, page, pageSize);
  }
  return queryProperties(seed.properties, filters, page, pageSize);
}

export async function fetchAllProperties(
  filters: PropertyFilters = {},
): Promise<Property[]> {
  if (isSupabaseConfigured()) {
    const { fetchAllPropertiesFromDb } = await import("@/lib/supabase/query");
    return fetchAllPropertiesFromDb(filters);
  }
  return sortProperties(filterProperties(seed.properties, filters), filters.sort);
}

export async function fetchPropertyBySlug(
  slug: string,
): Promise<Property | null> {
  if (isSupabaseConfigured()) {
    const { fetchPropertyFromDb } = await import("@/lib/supabase/query");
    return fetchPropertyFromDb(slug);
  }
  return seed.properties.find((p) => p.slug === slug) ?? null;
}

export async function fetchRelatedProperties(
  property: Property,
  limit = 4,
): Promise<Property[]> {
  const filters: PropertyFilters = {
    dealType: property.dealType,
    city: property.city,
    status: property.status,
  };
  const { items } = await fetchProperties(filters, 1, limit * 3);
  return items.filter((p) => p.id !== property.id).slice(0, limit);
}

export async function fetchAgents(): Promise<Agent[]> {
  if (isSupabaseConfigured()) {
    const { fetchAgentsFromDb } = await import("@/lib/supabase/query");
    return fetchAgentsFromDb();
  }
  return seed.agents;
}

export async function fetchAgent(id: string): Promise<Agent | null> {
  if (isSupabaseConfigured()) {
    const { fetchAgentsFromDb } = await import("@/lib/supabase/query");
    const agents = await fetchAgentsFromDb();
    return agents.find((a) => a.id === id) ?? null;
  }
  return seed.agents.find((a) => a.id === id) ?? null;
}

export async function fetchLocations(): Promise<Location[]> {
  return seed.locations;
}

export async function fetchLocationBySlug(slug: string): Promise<Location | null> {
  return seed.locations.find((l) => l.slug === slug) ?? null;
}

export async function fetchCities(): Promise<City[]> {
  return seed.cities;
}

export async function fetchProjects(): Promise<Project[]> {
  return seed.projects;
}

export async function fetchProjectBySlug(slug: string): Promise<Project | null> {
  return seed.projects.find((p) => p.slug === slug) ?? null;
}

export async function fetchSettings(): Promise<Settings> {
  return seed.settings;
}

export async function fetchFeaturedProperties(limit = 6): Promise<Property[]> {
  const { items } = await fetchProperties(
    { featured: true, status: "available" },
    1,
    limit,
  );
  return items;
}

export async function fetchNewProperties(limit = 6): Promise<Property[]> {
  const { items } = await fetchProperties({ status: "available" }, 1, limit);
  return items;
}

export async function fetchDealTypeProperties(
  dealType: DealType,
  limit = 12,
): Promise<PaginatedResult<Property>> {
  return fetchProperties({ dealType, status: "available" }, 1, limit);
}

export async function fetchPropertiesByAgent(
  agentId: string,
  limit = 100,
): Promise<Property[]> {
  const { items } = await fetchProperties({ agentId, status: "available" }, 1, limit);
  return items;
}

export async function fetchAgentStats(agentId: string) {
  const properties = await fetchPropertiesByAgent(agentId);
  return {
    properties: properties.length,
    featured: properties.filter((p) => p.featured).length,
  };
}

export function getDemoStoreForClient() {
  return demoStore;
}
