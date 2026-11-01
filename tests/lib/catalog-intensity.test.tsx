import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { catalogIntensity, checkCatalogIntensity } from "../../scripts/catalog-intensity.mjs";

describe("authored intensity", () => {
  it("audits all real metadata and rejects a mismatched rating", () => {
    const registry = JSON.parse(readFileSync("registry.json", "utf8"));
    expect(checkCatalogIntensity(registry)).toEqual([]);
    const select = registry.items.find((item: { name: string }) => item.name === "select");
    select.meta.intensity = "subtle";
    expect(checkCatalogIntensity(registry)).toEqual([
      expect.stringContaining("select: authored intensity must be expressive"),
    ]);
  });
  it("distinguishes geometry from local data feedback and tier", () => {
    const item = (name: string, motion: unknown[]) => ({ name, meta: { motion, tier: "T3" } });
    expect(catalogIntensity(item("static", []))).toBe("subtle");
    expect(catalogIntensity(item("bubble", ["data.transition"]))).toBe("subtle");
    expect(catalogIntensity(item("chart", ["data.transition"]))).toBe("medium");
    expect(catalogIntensity(item("panel", [{ recipe: "geometry.resize", form: "css-transition" }]))).toBe("medium");
    expect(catalogIntensity(item("transfer", ["handoff"]))).toBe("expressive");
  });
});
