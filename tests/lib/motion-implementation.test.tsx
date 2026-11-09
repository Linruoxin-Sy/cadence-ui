import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { checkMotionImplementations } from "../../scripts/motion-implementation.mjs";
import { calledRecipes, implementedForm } from "../../scripts/motion-manifest.mjs";
import negatives from "../fixtures/motion/implementation-negative.json";

describe("exact live installed implementations", () => {
  it.each(negatives)("rejects $name without mistaking syntax for playback", ({ source, called }) => {
    expect(calledRecipes(source).includes("feedback.press")).toBe(Boolean(called));
    expect(implementedForm(source, "feedback.press")).toBeNull();
  });

  it("distinguishes one-shot from every other form and recognizes aliased local values", () => {
    const source =
      "export function Part(){const clock=cm.transition('feedback.press');return <motion.span transition={clock}/>}";
    expect(implementedForm(source, "feedback.press")).toBe("one-shot");
    for (const form of ["continuous", "css-transition", "selection", "viewport", "reels", "changed-runs"])
      expect(implementedForm(source, "feedback.press", form)).toBeNull();
    expect(
      implementedForm(
        'export function Part(){return <span className="animate-pulse animate-none"/>}',
        "feedback.press",
        "continuous",
      ),
    ).toBeNull();
  });

  it("requires the same mounted host for text/number, and rejects type-only CSS imports and cross-scope names", async () => {
    for (const [id, recipe, form] of [
      ["animated-text", "text.change", "changed-runs"],
      ["animated-number", "number.roll", "reels"],
    ]) {
      const source = await readFile(`registry/cadence/${id}/index.tsx`, "utf8");
      expect(implementedForm(source, recipe, form)).toBe(form);
      for (const broken of [
        source.replace("ref={ref}", "ref={other}"),
        source.replace("data-motion={cm.mode}", "data-motion={other.mode}"),
        source.replace("{text}", "{value}"),
      ])
        expect(implementedForm(broken, recipe, form)).toBeNull();
    }
    const source =
      'import {useStateColor as usePaint} from "../lib/css-motion";export function Part(){const paint=usePaint(ref,cm,["fill"]);return <svg {...paint} data-slot="part"/>}';
    expect(implementedForm(source, "state.color", "css-transition")).toBe("css-transition");
    expect(implementedForm(source.replace("import {", "import type {"), "state.color", "css-transition")).toBeNull();
    expect(
      implementedForm(
        source.replace(
          'return <svg {...paint} data-slot="part"/>',
          'return <span/>}export function Other(){return <svg {...paint} data-slot="part"/>',
        ),
        "state.color",
        "css-transition",
      ),
    ).toBeNull();
  });

  it("follows the selected live export, never dependency-only, type-only, dead or sibling exports", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "cadence-implementation-"));
    const component = "registry/cadence/part/index.tsx",
      owner = "registry/cadence/lib/owner.tsx";
    const componentItem = {
      name: "part",
      type: "registry:ui",
      meta: { motion: ["feedback.press"] },
      files: [{ path: component }],
      registryDependencies: ["@cadence/owner"],
    };
    const registry = {
      items: [componentItem, { name: "owner", type: "registry:lib", files: [{ path: owner }] }],
    };
    const live = 'import {Owner as NativeOwner} from "../lib/owner";export function Part(){return <NativeOwner/>}';
    try {
      for (const file of [component, owner]) await mkdir(path.dirname(path.join(root, file)), { recursive: true });
      await writeFile(
        path.join(root, owner),
        "export function Owner(){return <motion.span transition={cm.transition('feedback.press')}/>};export function Plain(){return <span/>}",
      );
      const check = async (source: string) => {
        await writeFile(path.join(root, component), source);
        return checkMotionImplementations(root, registry, undefined, path.join(root, ".cache/implementation"));
      };
      const positive = await check(live);
      expect(positive.problems).toEqual([]);
      expect(await check(live)).toEqual(positive);
      expect(positive.references.part).toEqual([
        { recipe: "feedback.press", form: "one-shot", file: owner, via: [`${component}#NativeOwner`] },
      ]);
      for (const source of [
        "export function Part(){return <span/>}",
        live.replace("<NativeOwner/>", "<span/>"),
        live.replace("import {", "import type {").replace("<NativeOwner/>", "<span/>"),
        live
          .replace("export function Part(){", "function Never(){return <NativeOwner/>};export function Part(){")
          .replace(/return <NativeOwner\/>}$/, "return <span/>}"),
        live.replace("{Owner as", "{Plain as"),
      ])
        expect((await check(source)).problems).toContain(
          'part: declares "feedback.press" (one-shot) but nothing implements it on a live installed import path',
        );
      await writeFile(path.join(root, component), live);
      componentItem.registryDependencies = [];
      expect((await checkMotionImplementations(root, registry)).problems).toHaveLength(1);
      // Shipping an unused file beside the entry point is not adoption either.
      componentItem.files.push({ path: owner });
      expect((await check("export function Part(){return <span/>}")).problems).toContain(
        'part: declares "feedback.press" (one-shot) but nothing implements it on a live installed import path',
      );
      // Reintroducing the live import cannot reuse the old positive after the
      // executor bytes change, even though the declaration and path are equal.
      componentItem.registryDependencies = ["@cadence/owner"];
      await writeFile(path.join(root, owner), "export function Owner(){return <span/>}");
      expect((await check(live)).problems).toContain(
        'part: declares "feedback.press" (one-shot) but nothing implements it on a live installed import path',
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
