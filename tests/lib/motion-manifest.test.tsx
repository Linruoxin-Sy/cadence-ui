import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { calledRecipes, cssPolicyCapabilities, implementedForm } from "../../scripts/motion-manifest.mjs";

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

describe("explicit CSS policy adoption", () => {
  const color =
    'import {useStateColor} from "../lib/css-motion"; function Part(){const color=useStateColor(ref,cm,["background-color","color"]);return <button {...color} data-slot="part"/>}';
  it("recognises a local colour CSS owner, not a resolver or dependency", () => {
    expect(implementedForm(color, "state.color", "css-transition")).toBe("css-transition");
    expect(implementedForm(color, "state.color")).toBeNull();
    expect(implementedForm('cm.transition("state.color")', "state.color", "css-transition")).toBeNull();
  });
  it.each([
    color.replace("<button {...color}", "<button"),
    color.replace('data-slot="part"', 'ref={externalRef} data-slot="part"'),
    color.replace('["background-color","color"]', '["all"]'),
    color.replace('["background-color","color"]', '["opacity"]'),
    color.replace('["background-color","color"]', "[]"),
    color.replace('import {useStateColor} from "../lib/css-motion";', ""),
  ])("rejects missing owner/managed-ref/property evidence", (source) => {
    expect(implementedForm(source, "state.color", "css-transition")).toBeNull();
  });
  it("recognises an actually bound theme-loop owner", () => {
    const source =
      'import {useContinuousMotion} from "../lib/css-motion";function Part(){const loop=useContinuousMotion(ref,cm,"spin");return <svg {...loop} data-slot="spinner"/>}';
    expect(implementedForm(source, "data.transition", "continuous")).toBe("continuous");
    expect(calledRecipes(source)).toContain("data.transition");
    expect(implementedForm(source.replace("{...loop}", ""), "data.transition", "continuous")).toBeNull();
  });
  it("follows a managed-ref chain for disjoint colour and loop owners on one SVG", () => {
    const source =
      'import {useContinuousMotion,useStateColor} from "../lib/css-motion";function Part(){const loop=useContinuousMotion(ref,cm,"spin");const color=useStateColor(loop.ref,cm,["fill","stroke"]);return <svg {...color} data-slot="spinner"/>}';
    expect(implementedForm(source, "state.color", "css-transition")).toBe("css-transition");
    expect(implementedForm(source, "data.transition", "continuous")).toBe("continuous");
    expect(calledRecipes(source)).toEqual(["state.color", "data.transition"]);
    expect(cssPolicyCapabilities(source)).toEqual(["color", "loop"]);
    expect(cssPolicyCapabilities(source.replace("useStateColor(loop.ref", "useStateColor(ref"))).toEqual(["color"]);
  });
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
