import { describe, expect, it } from "vitest";
import {
  defaultFilters,
  filtersFromParams,
  filtersToParams,
  urlSearchFromParams,
} from "./search-params";

describe("search-params", () => {
  it("defaultFilters returns empty state", () => {
    const f = defaultFilters();
    expect(f.amenities).toEqual([]);
    expect(f.sort).toBe("newest");
    expect(f.minPrice).toBe("");
  });

  it("filtersFromParams parses URLSearchParams", () => {
    const params = new URLSearchParams();
    params.set("dealType", "sale");
    params.set("minPrice", "1000");
    params.set("maxPrice", "5000");
    params.set("sort", "price_asc");
    params.set("furnished", "true");
    params.append("amenity", "pool");
    params.append("amenity", "gym");

    const f = filtersFromParams(params);
    expect(f.dealType).toBe("sale");
    expect(f.minPrice).toBe("1000");
    expect(f.maxPrice).toBe("5000");
    expect(f.sort).toBe("price_asc");
    expect(f.furnished).toBe(true);
    expect(f.amenities).toEqual(["pool", "gym"]);
  });

  it("filtersToParams round-trips through filtersFromParams", () => {
    const f = defaultFilters();
    f.dealType = "rent";
    f.city = "Dubai";
    f.bedrooms = "3";
    f.amenities = ["balcony", "pool"];
    f.query = "marina";

    const params = filtersToParams(f);
    const back = filtersFromParams(params);
    expect(back.dealType).toBe("rent");
    expect(back.city).toBe("Dubai");
    expect(back.bedrooms).toBe("3");
    expect(back.amenities).toEqual(["balcony", "pool"]);
    expect(back.query).toBe("marina");
  });

  it("filtersToParams only keeps non-empty values (default sort included)", () => {
    const params = filtersToParams(defaultFilters());
    expect(params.toString()).toBe("sort=newest");
  });

  it("urlSearchFromParams handles arrays and undefined", () => {
    const us = urlSearchFromParams({
      q: "villa",
      amenity: ["pool", "gym"],
      empty: undefined,
    });
    expect(us.get("q")).toBe("villa");
    expect(us.getAll("amenity")).toEqual(["pool", "gym"]);
    expect(us.has("empty")).toBe(false);
  });
});
