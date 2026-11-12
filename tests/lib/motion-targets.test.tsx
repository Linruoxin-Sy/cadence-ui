import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { migrationProblems } from "../../scripts/motion-migration.mjs";
import { appendMotionIndex, motionTargetTemplate } from "../../scripts/motion-target-template.mjs";
import {
  checkMotionTargets,
  parseMotionTarget,
  parseTargetPresets,
  valueExports,
} from "../../scripts/motion-targets.mjs";
import { parseDocTokens } from "../../scripts/motion-tokens.mjs";
import negatives from "../fixtures/motion-target/negative.json";

const root = process.cwd();
const fixture = await readFile("tests/fixtures/motion-target/valid.md.txt", "utf8");
const presetSource = await readFile("docs/motion/presets.md", "utf8");
const { presets } = parseTargetPresets(presetSource);
const parse = (markdown: string) => parseMotionTarget(markdown, "fixture", presets);
function required(value: string | undefined) {
  if (!value) throw new Error("missing fixture input");
  return value;
}
async function cleanFixture(temp: string) {
  if (!path.resolve(temp).startsWith(path.resolve(root, ".cache") + path.sep))
    throw new Error("unexpected fixture cleanup path");
  await rm(temp, { recursive: true, force: true });
}

describe("internal target reference schema", () => {
  it("retains the installed token-table gate for both LF and CRLF documents", async () => {
    const markdown = (await readFile("docs/animation-system.md", "utf8")).replaceAll("\r\n", "\n");
    expect(parseDocTokens(markdown.replaceAll("\n", "\r\n"))).toEqual(parseDocTokens(markdown));
    expect(() => parseDocTokens(markdown.replace("```css", "```text"))).toThrow("no ```css fence");
  });
  it("resolves distinct default, inherited, composed and absent capabilities without a runtime claim", () => {
    const result = parse(fixture);
    expect(result.problems).toEqual([]);
    expect(result.migration).toBe("legacy");
    expect(
      result.capabilities.find((capability) => capability.name === "Changed numbers")?.references[0]?.owners,
    ).toEqual(["fixture#Fixture"]);
    expect(
      parse(
        fixture.replace(
          "default: `fixture.root.enter`",
          "default: `fixture.root.enter`; inherited: `fixture.root.enter`",
        ),
      ).problems.join("\n"),
    ).toContain("conflicting relationship");
    expect(result.bindings.get("fixture.rule.colour")).toEqual({
      preset: "state.color",
      form: "state.color/surface",
      part: "rule",
    });
    expect(parseTargetPresets(presetSource).problems).toEqual([]);
  });
  it.each(negatives)("rejects $name", ({ from, to, error }) => {
    expect(fixture).toContain(from);
    expect(parse(fixture.replace(from, to)).problems.join("\n")).toContain(error);
  });
  it("rejects ambiguous or drifting preset form declarations", () => {
    const row = required(presetSource.split("\n").find((line) => /^\|\s*`presence.inline`/.test(line)));
    expect(parseTargetPresets(presetSource.replace(row, `${row}\n${row}`)).problems.join("\n")).toContain(
      "duplicate preset presence.inline",
    );
    expect(
      parseTargetPresets(presetSource.replace("`data.transition/opacity`", "`data.transition`")).problems.join("\n"),
    ).toContain("exact target recipe/forms required");
    expect(
      parseTargetPresets(presetSource.replace("`enter.pop/surface`", "`exit.fade/surface`")).problems.join("\n"),
    ).toContain("absent from recipe description");
  });
  it("rejects duplicate capabilities, sections and conflicting repeated bindings", () => {
    const appearance = required(fixture.split("\n").find((line) => line.startsWith("| Appearance |")));
    expect(parse(fixture.replace(appearance, `${appearance}\n${appearance}`)).problems.join("\n")).toContain(
      "duplicate capability",
    );
    expect(parse(`${fixture}\n## Interruption and lifecycle\nAnother owner.\n`).problems.join("\n")).toContain(
      "duplicate section",
    );
    const row = required(fixture.split("\n").find((line) => line.startsWith("| Insert /")));
    expect(
      parse(
        fixture.replace(
          row,
          `${row}\n${row.replace("presence.inline", "status.loop").replace("data.transition/opacity", "data.transition/continuous")}`,
        ),
      ).problems.join("\n"),
    ).toContain("conflicting repeated binding");
  });
  it("requires real tables and lifecycle prose; fenced or commented specimens cannot satisfy them", () => {
    const section = required(fixture.split("## Capability ownership\n")[1]?.split("## Choreography and modes")[0]);
    for (const fake of [`\n\x60\x60\x60md\n${section}\n\x60\x60\x60\n`, `\n<!--${section}-->\n`]) {
      expect(parse(fixture.replace(section, fake)).problems.join("\n")).toContain("expected one real Markdown table");
    }
    const missing = fixture.replace(/## Interruption and lifecycle[\s\S]*?(?=## Geometry)/, "");
    expect(parse(missing).problems.join("\n")).toContain("Interruption and lifecycle: substantive content required");
    for (const heading of ["Interruption and lifecycle", "Geometry and performance", "Acceptance scenarios"]) {
      const body = required(fixture.split(`## ${heading}\n`)[1]?.split("\n## ")[0]);
      for (const fake of [`\n<!--${body}-->\n`, `\n\x60\x60\x60md\n${body}\n\x60\x60\x60\n`])
        expect(parse(fixture.replace(body, fake)).problems.join("\n")).toContain(
          `${heading}: substantive content required`,
        );
    }
  });
  it("rejects draft scaffold claims and creates a single index entry", () => {
    const draft = motionTargetTemplate("fixture", "Fixture", "Fixture");
    expect(parse(draft).problems.join("\n")).toContain("scaffold placeholders");
    const index = "## 5. Catalogue\n\n## 6. Maintenance and migration\n";
    const next = appendMotionIndex(index, "fixture", "Fixture");
    expect(next).toContain("[Fixture](components/fixture.md)");
    expect(() => appendMotionIndex(next, "fixture", "Fixture")).toThrow("already contains");
    expect(() => appendMotionIndex("", "fixture", "Fixture")).toThrow("maintenance boundary");
  });
  it("reads actual value exports rather than comments, strings or interfaces", () => {
    expect([
      ...valueExports(`// export const Fake = 1;
const text = 'export function False() {}';
export interface Props {};
type Secret = string;
const Part = () => null;
export { Part as Fixture, Secret, type Props };
export function Other() { return null; }`),
    ]).toEqual(["Fixture", "Other"]);
  });
  it("never treats an absent or v2 marker as legacy success", () => {
    expect(migrationProblems("legacy")).toEqual([]);
    for (const state of [undefined, null, true, "target", "v2"]) expect(migrationProblems(state)).not.toEqual([]);
  });
  it("rejects misplaced/invalid metadata and malformed part maps without throwing", () => {
    expect(parse(fixture.replace("## Contract references", "## Example")).problems.join("\n")).toContain(
      "expected one ## Contract references",
    );
    expect(parse(fixture.replace('"schema": 1', '"schema": NaN')).problems.join("\n")).toContain(
      "invalid target metadata",
    );
    expect(parse(fixture.replace(/"root": \[[\s\S]*?\]/, '"root": "fixture#Fixture"')).problems.join("\n")).toContain(
      "expected component#Export part references",
    );
  });
  it("keeps None independent from the zero recipe clock", () => {
    expect(parse(fixture.replace("| None |", "| None / zero |")).problems.join("\n")).toContain(
      "full/reduced/none must be independent columns",
    );
  });
});

describe("current registry inventory and real part references", () => {
  it("closes every current contract without a fixed component count", async () => {
    const registry = JSON.parse(await readFile("registry.json", "utf8"));
    const result = await checkMotionTargets(root, registry);
    expect(result.problems).toEqual([]);
    expect([...result.contracts.keys()].sort()).toEqual(
      registry.items
        .filter((item: { type: string }) => ["registry:ui", "registry:block"].includes(item.type))
        .map((item: { name: string }) => item.name)
        .sort(),
    );
    expect([...result.contracts].filter(([, contract]) => contract.migration === "v2").map(([id]) => id)).toEqual([
      "button",
      "badge",
      "kbd",
      "separator",
      "label",
      "card",
      "aspect-ratio",
      "alert",
      "empty",
      "item",
      "button-group",
      "toggle",
      "toggle-group",
      "select",
      "tabs",
    ]);
    expect([...result.contracts.values()].every((contract) => ["legacy", "v2"].includes(contract.migration))).toBe(
      true,
    );
  }, 30000); // Cold source/installation audit covers pilots and migrated catalogue items; host throughput varies.
  it("rejects real source/dependency/index drift and accepts an extended actual inventory", async () => {
    await mkdir(path.join(root, ".cache"), { recursive: true });
    const temp = await mkdtemp(path.join(root, ".cache", "motion-target-fixture-"));
    try {
      await mkdir(path.join(temp, "docs/motion/components"), { recursive: true });
      await writeFile(path.join(temp, "docs/motion/presets.md"), presetSource);
      const local = fixture.replace('"separator#Separator"', '"fixture#Rule"');
      const item = (name: string) => ({ name, type: "registry:ui", files: [{ path: `${name}.tsx` }] });
      const registry = { items: [item("fixture")] };
      const docPath = path.join(temp, "docs/motion/components/fixture.md");
      const indexPath = path.join(temp, "docs/motion/README.md");
      await writeFile(docPath, local);
      await writeFile(indexPath, "[Fixture](components/fixture.md)\n");
      await writeFile(path.join(temp, "fixture.tsx"), "export function Fixture() {}\nexport function Rule() {}");
      expect((await checkMotionTargets(temp, registry)).problems).toEqual([]);
      await writeFile(docPath, local.replace("fixture#Rule", "fixture#Imaginary"));
      expect((await checkMotionTargets(temp, registry)).problems.join("\n")).toContain(
        "unknown actual part fixture#Imaginary",
      );
      await writeFile(docPath, fixture);
      expect((await checkMotionTargets(temp, registry)).problems.join("\n")).toContain(
        "not an explicit component dependency",
      );
      await writeFile(docPath, local);
      await writeFile(indexPath, "[Fixture](components/fixture.md)\n[Duplicate](components/fixture.md)");
      expect((await checkMotionTargets(temp, registry)).problems.join("\n")).toContain("exactly once");
      registry.items.push(item("another"));
      await writeFile(path.join(temp, "another.tsx"), "export function Fixture() {}\nexport function Rule() {}");
      await writeFile(path.join(temp, "docs/motion/components/another.md"), local.replaceAll("fixture", "another"));
      await writeFile(indexPath, "[Fixture](components/fixture.md)\n[Another](components/another.md)");
      expect((await checkMotionTargets(temp, registry)).problems).toEqual([]);
    } finally {
      await cleanFixture(temp);
    }
  });
});
