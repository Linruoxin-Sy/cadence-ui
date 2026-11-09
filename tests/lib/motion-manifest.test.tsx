import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { calledRecipes, cssPolicyCapabilities, implementedForm } from "../../scripts/motion-manifest.mjs";

const source = readFileSync("registry/cadence/accordion/index.tsx", "utf8");

describe("installed numeric form", () => {
  const number = readFileSync("registry/cadence/animated-number/index.tsx", "utf8");
  it("requires a mounted relative numeric adapter, not a recipe name or dead call", () => {
    expect(implementedForm(number, "number.roll", "reels")).toBe("reels");
    expect(calledRecipes(number)).toContain("number.roll");
    for (const candidate of [
      number.replace("{text}", "{value}"),
      number.replace("useNumberPresentation(node,", "missing(node,"),
      number.replace('"../lib/use-number-presentation"', '"@/host/use-number-presentation"'),
      `// ${number.replaceAll("\n", "\n// ")}`,
      'cm.transition("number.roll")',
    ])
      expect(implementedForm(candidate, "number.roll", "reels")).toBeNull();
    expect(implementedForm(number, "number.roll", "one-shot")).toBeNull();
  });
});

describe("installed changed-text form", () => {
  const text = readFileSync("registry/cadence/animated-text/index.tsx", "utf8");
  it("recognizes the mounted adapter and rejects absent/dead declarations", () => {
    expect(implementedForm(text, "text.change", "changed-runs")).toBe("changed-runs");
    expect(calledRecipes(text)).toContain("text.change");
    for (const candidate of [
      text.replace("{text}", "{value}"),
      text.replace("useTextPresentation(node,", "missing(node,"),
      text.replace('"../lib/use-text-presentation"', '"@/host/use-text-presentation"'),
      `// ${text.replaceAll("\n", "\n// ")}`,
    ])
      expect(implementedForm(candidate, "text.change", "changed-runs")).toBeNull();
    expect(implementedForm(text, "text.change", "one-shot")).toBeNull();
  });
});

describe("installed content and selection forms", () => {
  const tabs = readFileSync("registry/cadence/lib/tabs-motion.tsx", "utf8");
  const calendar = readFileSync("registry/cadence/calendar/index.tsx", "utf8");
  it("requires the actual coordinator adoption for each installed form", () => {
    expect(implementedForm(tabs, "layout.shared", "selection")).toBe("selection");
    expect(implementedForm(tabs, "data.transition", "directional-content")).toBe("directional-content");
    expect(implementedForm(calendar, "data.transition", "month-grid")).toBe("month-grid");
    expect(implementedForm(tabs.replaceAll("projection.commit(", "missing("), "layout.shared", "selection")).toBeNull();
    expect(
      implementedForm(calendar.replaceAll("paint.commit(", "missing("), "data.transition", "month-grid"),
    ).toBeNull();
    expect(implementedForm('cm.transition("data.transition")', "data.transition", "month-grid")).toBeNull();
  });
});

describe("installed size-linked geometry forms", () => {
  const sidebar = readFileSync("registry/cadence/lib/sidebar-geometry.ts", "utf8");
  it("requires the actual label gate and geometry completion callback", () => {
    expect(implementedForm(sidebar, "data.transition")).toBe("one-shot");
    for (const anchor of [
      "prepareSidebarLabels(labels, transaction, revision)",
      "labelGate.start()",
      "labelGate?.complete()",
      "projection.commit(",
    ])
      expect(implementedForm(sidebar.replaceAll(anchor, "missing("), "data.transition")).toBeNull();
  });
  it.each([
    ["layout.move", "size-linked"],
    ["geometry.resize", "measured"],
  ])("requires actual %s/%s adoption", (recipe, form) => {
    expect(implementedForm(sidebar, recipe, form)).toBe(form);
    expect(implementedForm(sidebar.replaceAll("projection.prepare(", "missing("), recipe, form)).toBeNull();
    expect(implementedForm(sidebar.replaceAll("projection.commit(", "missing("), recipe, form)).toBeNull();
    expect(implementedForm(`cm.transition("${recipe}")`, recipe, form)).toBeNull();
  });
});

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
