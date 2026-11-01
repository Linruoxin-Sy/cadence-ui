import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { implementedForm } from "../../scripts/motion-manifest.mjs";

const source = readFileSync("registry/cadence/accordion/index.tsx", "utf8");

describe("disclosure motion manifest", () => {
  it("requires an explicit CSS geometry form", () => {
    expect(implementedForm(source, "geometry.resize", "css-transition")).toBe("css-transition");
    expect(implementedForm(source, "geometry.resize")).toBeNull();
  });
  it.each(["ResizeObserver", "Math.max(0,", "data-[ending-style]:h-0", "duration-0", "--motion-duration-slow"])(
    "rejects missing %s evidence",
    (evidence) => {
      expect(implementedForm(source.replaceAll(evidence, "missing"), "geometry.resize", "css-transition")).toBeNull();
    },
  );
});

const navigation = readFileSync("registry/cadence/navigation-menu/index.tsx", "utf8");
describe("shared navigation popup geometry manifest", () => {
  it("requires the explicit measured CSS form", () => {
    expect(implementedForm(navigation, "geometry.resize", "css-transition")).toBe("css-transition");
    expect(implementedForm(navigation, "geometry.resize")).toBeNull();
  });
  it.each([
    "--popup-width",
    "--popup-height",
    "--available-width",
    "--available-height",
    "cm.reduced",
    "--motion-duration-slow",
    "transition-[opacity,scale,width,height]",
  ])("rejects missing %s evidence", (evidence) => {
    expect(implementedForm(navigation.replaceAll(evidence, "missing"), "geometry.resize", "css-transition")).toBeNull();
  });
});
