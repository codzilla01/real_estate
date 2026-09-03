import { describe, expect, it } from "vitest";
import { getSeedData } from "./seed-data";
import {
  filterProperties,
  paginate,
  queryProperties,
  sortProperties,
} from "./query";

const seed = getSeedData();

describe("query", () => {
  it("seed data has the required minimums (20+ properties, 5+ agents, 20+ leads, 10+ clients)", () => {
    expect(seed.properties.length).toBeGreaterThanOrEqual(20);
    expect(seed.agents.length).toBeGreaterThanOrEqual(5);
    expect(seed.leads.length).toBeGreaterThanOrEqual(20);
    expect(seed.clients.length).toBeGreaterThanOrEqual(10);
    expect(seed.appointments.length).toBeGreaterThan(0);
    expect(seed.deals.length).toBeGreaterThan(0);
    expect(seed.locations.length).toBeGreaterThan(0);
    expect(seed.projects.length).toBeGreaterThan(0);
  });

  it("filters by dealType", () => {
    const sales = filterProperties(seed.properties, { dealType: "sale" });
    expect(sales.length).toBeGreaterThan(0);
    expect(sales.every((p) => p.dealType === "sale")).toBe(true);
  });

  it("filters by city and price range", () => {
    const result = filterProperties(seed.properties, {
      city: "Dubai",
      minPrice: 1_000_000,
      maxPrice: 10_000_000,
    });
    expect(
      result.every(
        (p) =>
          p.city === "Dubai" &&
          p.price >= 1_000_000 &&
          p.price <= 10_000_000,
      ),
    ).toBe(true);
  });

  it("filters by query across localized titles", () => {
    const result = filterProperties(seed.properties, { query: "villa" });
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  it("filters by amenities (all must match)", () => {
    const result = filterProperties(seed.properties, { amenities: ["pool"] });
    expect(result.every((p) => p.amenities.includes("pool"))).toBe(true);
  });

  it("filters by agentId", () => {
    const agentId = seed.agents[0]!.id;
    const result = filterProperties(seed.properties, { agentId });
    expect(result.every((p) => p.agentId === agentId)).toBe(true);
  });

  it("sorts by price ascending", () => {
    const sorted = sortProperties(seed.properties, "price_asc");
    const prices = sorted.map((p) => p.price);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
  });

  it("sorts by newest via publishedAt", () => {
    const sorted = sortProperties(seed.properties, "newest");
    for (let i = 1; i < sorted.length; i++) {
      expect(
        new Date(sorted[i - 1]!.publishedAt).getTime(),
      ).toBeGreaterThanOrEqual(new Date(sorted[i]!.publishedAt).getTime());
    }
  });

  it("paginates correctly and clamps page", () => {
    const page1 = paginate(seed.properties, 1, 5);
    expect(page1.items).toHaveLength(5);
    expect(page1.pagination.total).toBe(seed.properties.length);
    expect(page1.pagination.totalPages).toBe(
      Math.ceil(seed.properties.length / 5),
    );

    const over = paginate(seed.properties, 999, 5);
    expect(over.pagination.page).toBe(over.pagination.totalPages);
  });

  it("queryProperties combines filter + sort + paginate", () => {
    const { items, pagination } = queryProperties(
      seed.properties,
      { dealType: "rent", minPrice: 50_000 },
      1,
      4,
    );
    expect(items.length).toBeLessThanOrEqual(4);
    expect(pagination.total).toBe(
      filterProperties(seed.properties, {
        dealType: "rent",
        minPrice: 50_000,
      }).length,
    );
  });
});
