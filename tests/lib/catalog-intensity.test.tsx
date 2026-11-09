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
  it("classifies actual extent, travel and coordination independently from recipe names, tiers or modes", () => {
    const item = (scope: string, travel = "compact", coordination = "independent") => ({
      name: "fixture",
      meta: {
        motion: ["text.change", "geometry.resize"],
        tier: "T3",
        mode: "none",
        motionProfile: { scope, travel, coordination, reason: "Owned readout changes with bounded local travel." },
      },
    });
    expect(catalogIntensity(item("local"))).toBe("subtle");
    expect(catalogIntensity(item("surface"))).toBe("medium");
    expect(catalogIntensity(item("collection"))).toBe("medium");
    expect(catalogIntensity(item("local", "extended"))).toBe("medium");
    expect(catalogIntensity(item("surface", "compact", "identity"))).toBe("expressive");
    expect(catalogIntensity(item("local", "compact", "group"))).toBe("medium");
  });
  it("never invents a profile from a tier, target recipe or unknown state", () => {
    const registry = JSON.parse(readFileSync("registry.json", "utf8"));
    const item = registry.items.find((item: { name: string }) => item.name === "animated-text");
    for (const field of ["scope", "travel", "coordination", "reason"]) {
      const broken = structuredClone(item);
      broken.meta.motionProfile[field] = "unknown";
      expect(catalogIntensity(broken)).toBeNull();
      expect(checkCatalogIntensity({ items: [broken] }).length).toBeGreaterThan(0);
    }
    delete item.meta.motionProfile;
    expect(catalogIntensity(item)).toBeNull();
    expect(checkCatalogIntensity({ items: [item] }).join("\n")).toContain("explicit authored motionProfile required");
  });
  it("rejects a profile contradicting an implemented cross-surface handoff", () => {
    const registry = JSON.parse(readFileSync("registry.json", "utf8"));
    const select = registry.items.find((item: { name: string }) => item.name === "select");
    select.meta.motionProfile.coordination = "independent";
    select.meta.intensity = "medium";
    expect(catalogIntensity(select)).toBeNull();
    expect(checkCatalogIntensity({ items: [select] }).join("\n")).toContain("requires identity coordination");
  });
});
