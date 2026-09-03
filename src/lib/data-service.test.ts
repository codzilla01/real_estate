import { describe, expect, it } from "vitest";
import {
  fetchAgent,
  fetchAgents,
  fetchAllProperties,
  fetchFeaturedProperties,
  fetchLocationBySlug,
  fetchLocations,
  fetchProperties,
  fetchPropertyBySlug,
} from "./data-service";

describe("data-service (demo mode)", () => {
  it("fetches paginated properties", async () => {
    const { items, pagination } = await fetchProperties({}, 1, 6);
    expect(items.length).toBe(6);
    expect(pagination.total).toBeGreaterThanOrEqual(20);
  });

  it("fetches all properties and finds by slug", async () => {
    const all = await fetchAllProperties({});
    const first = all[0]!;
    const bySlug = await fetchPropertyBySlug(first.slug);
    expect(bySlug?.id).toBe(first.id);
    expect(await fetchPropertyBySlug("does-not-exist")).toBeNull();
  });

  it("fetches featured properties only", async () => {
    const featured = await fetchFeaturedProperties(5);
    expect(featured.length).toBeLessThanOrEqual(5);
    expect(featured.every((p) => p.featured)).toBe(true);
  });

  it("filters by dealType through the service", async () => {
    const { items } = await fetchProperties({ dealType: "rent", status: "available" }, 1, 50);
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((p) => p.dealType === "rent")).toBe(true);
  });

  it("fetches agents and a single agent by id", async () => {
    const agents = await fetchAgents();
    expect(agents.length).toBeGreaterThanOrEqual(5);
    const byId = await fetchAgent(agents[0]!.id);
    expect(byId?.id).toBe(agents[0]!.id);
    expect(await fetchAgent("missing")).toBeNull();
  });

  it("fetches locations and by slug", async () => {
    const locations = await fetchLocations();
    expect(locations.length).toBeGreaterThan(0);
    const bySlug = await fetchLocationBySlug(locations[0]!.slug);
    expect(bySlug?.slug).toBe(locations[0]!.slug);
  });
});
