import { execFile, spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { checkCatalogIntensity } from "../../scripts/catalog-intensity.mjs";
import { checkMotionCoverage } from "../../scripts/motion-coverage.mjs";
import { checkMotionDocs } from "../../scripts/motion-docs.mjs";
import { recipeCatalogue } from "../../scripts/motion-manifest.mjs";
import { freshDocs } from "../fixtures/fresh-docs";

const root = process.cwd();
const registry = JSON.parse(readFileSync("registry.json", "utf8"));
const catalogue = recipeCatalogue(readFileSync("registry/cadence/lib/motion.ts", "utf8"));
let fixture: string;
const buttonPath = "content/components/button.mdx";
const guidePath = "content/docs/motion.mdx";
const button = readFileSync(buttonPath, "utf8");
const guide = readFileSync(guidePath, "utf8");

beforeAll(() => {
  fixture = mkdtempSync(path.join(os.tmpdir(), "cadence-motion-docs-"));
  cpSync("content", path.join(fixture, "content"), { recursive: true });
  cpSync("tests", path.join(fixture, "tests"), { recursive: true });
  cpSync("registry.json", path.join(fixture, "registry.json"));
  cpSync("registry-snapshots.json", path.join(fixture, "registry-snapshots.json"));
  cpSync("public", path.join(fixture, "public"), {
    recursive: true,
    filter: (file) => path.basename(file) !== "snapshots",
  });
  symlinkSync(path.join(root, "public/r/snapshots"), path.join(fixture, "public/r/snapshots"), "junction");
  for (const dir of ["registry", "docs", "app", "components"]) {
    symlinkSync(path.join(root, dir), path.join(fixture, dir), "junction");
  }
});
afterAll(() => rmSync(fixture, { recursive: true, force: true }));

async function entry(file: string, source: string, fresh = false) {
  writeFileSync(path.join(fixture, file), source);
  if (fresh) freshDocs(fixture, path.basename(file, ".mdx"), source);
  try {
    try {
      const result = await promisify(execFile)(process.execPath, [path.join(root, "scripts/check-registry.mjs")], {
        cwd: fixture,
        encoding: "utf8",
        env: { ...process.env, CADENCE_IMPLEMENTATION_CACHE: path.join(fixture, ".cache/implementation") },
      });
      return { status: 0, output: result.stdout + result.stderr };
    } catch (error) {
      const result = error as { code: number; stdout: string; stderr: string };
      return { status: result.code, output: result.stdout + result.stderr };
    }
  } finally {
    writeFileSync(path.join(fixture, file), readFileSync(path.join(root, file), "utf8"));
    if (fresh) freshDocs(fixture, path.basename(file, ".mdx"), readFileSync(path.join(root, file), "utf8"));
  }
}

// The deadline is a hang guard, not a performance assertion: each case cold-starts
// `check-registry.mjs` in a fresh fixture, which measures host throughput rather than
// regression (a clean ab731bf4 snapshot fails the same 15s deadline). Keep it generous;
// 60s still catches real hangs while tolerating AV/IO contention on developer machines.
// biome-ignore lint/correctness/usePlaywrightValidDescribeCallback: This is Vitest's suite timeout overload; full-catalogue AST/registry subprocesses need startup headroom under full-suite I/O contention.
describe("registry:check motion docs entry", { timeout: 60_000 }, () => {
  it("requires an animated component's actual test file", async () => {
    const file = path.join(fixture, "tests/components/button.test.tsx");
    const source = readFileSync(file, "utf8");
    unlinkSync(file);
    try {
      const result = await entry(buttonPath, button);
      expect(result.status).toBe(1);
      expect(result.output).toContain("button: missing animated contract suite tests/components/button.test.tsx");
    } finally {
      writeFileSync(file, source);
    }
  }, 60_000);

  it("accepts all 63 real contracts, including T0, composed, viewport, continuous, CSS and engine forms", async () => {
    expect(
      registry.items.filter((item: { type: string }) => ["registry:ui", "registry:block"].includes(item.type)),
    ).toHaveLength(63);
    expect(await checkMotionDocs(root, registry, catalogue)).toEqual([]);
    const result = await entry(buttonPath, button);
    expect(result.status, result.output).toBe(0);
  });
  it.each(["button.json", "catalog.json", "registry.json"])(
    "rejects stale published profile/ownership in %s",
    async (name) => {
      const file = `public/r/${name}`;
      const published = JSON.parse(readFileSync(path.join(fixture, file), "utf8"));
      const metadata =
        name === "catalog.json"
          ? published.find((item: { name: string }) => item.name === "button")
          : name === "registry.json"
            ? published.items.find((item: { name: string }) => item.name === "button").meta
            : published.meta;
      metadata.motionCoverage.effects = {};
      metadata.motionProfile.scope = "surface";
      metadata.intensity = "medium";
      const result = await entry(file, JSON.stringify(published));
      expect(result.status, result.output).toBe(1);
      for (const field of ["motionCoverage", "motionProfile", "intensity"])
        expect(result.output).toContain(`button: ${file} ${field} differs from installed metadata`);
    },
  );

  it.each([
    [
      "missing recipe",
      button.replaceAll("`feedback.press/one-shot` / `spring.press`", "`spring.press`"),
      'missing recipe "feedback.press"',
    ],
    ["extra recipe", button.replace("`spring.press`", "`reveal` / `spring.press`"), 'extra recipe "reveal"'],
    ["unknown recipe", button.replace("`spring.press`", "`theme.reveal`"), 'unknown recipe "theme.reveal"'],
    [
      "duplicate cell",
      button.replace("`spring.press`", "`feedback.press` / `spring.press`"),
      'duplicate recipe "feedback.press"',
    ],
    ["missing section", button.replace("## Motion contract", "## Other"), "expected one ## Motion contract section"],
    ["duplicate section", `${button}\n## Motion contract\n`, "found 2"],
    ["missing table", button.replaceAll("| Phase", "Phase"), "expected one Motion contract recipe table"],
    ["frontmatter drift", button.replace(/^motion:.*$/m, "motion: [reveal]"), "frontmatter motion: missing recipe"],
    [
      "duplicate frontmatter",
      button.replace(/^motion:.*$/m, "motion: [feedback.press, feedback.press]"),
      "frontmatter motion: duplicate recipe",
    ],
    [
      "wrong frontmatter form",
      button.replace(/^motion:.*$/m, "motion: [{ recipe: feedback.press, form: continuous }]"),
      "frontmatter motion forms differ",
    ],
    [
      "wrong table form",
      button.replaceAll("feedback.press/one-shot", "feedback.press/continuous"),
      "Motion contract forms differ",
    ],
    [
      "missing explicit table form",
      button.replaceAll("feedback.press/one-shot", "feedback.press"),
      "requires exact recipe/form",
    ],
    [
      "invalid frontmatter",
      button.replace(/^motion:.*$/m, "motion: feedback.press"),
      "frontmatter motion must be an array",
    ],
    ["missing ownership", button.replace(/^motionCoverage: .*\r?\n/m, ""), "docs motionCoverage differs"],
    ["missing profile", button.replace(/^motionProfile: .*\r?\n/m, ""), "docs motionProfile differs"],
    [
      "false intensity explanation",
      button.replace("Authored intensity is **subtle**", "Authored intensity is **medium**"),
      "visible authored intensity/profile explanation differs",
    ],
  ])("rejects %s through the actual check script", async (_, source, diagnostic) => {
    const result = await entry(buttonPath, source);
    expect(result.status).toBe(1);
    expect(result.output).toContain(`${buttonPath}:`);
    expect(result.output).toContain(diagnostic);
  });

  it.each([
    ["missing", guide.replace(/^\| `reveal`.*\n/m, ""), 'missing recipe "reveal"'],
    ["unknown", guide.replace("| `reveal`", "| `theme.reveal`"), 'unknown recipe "theme.reveal"'],
    ["duplicate", guide.replace("| `enter.pop`", "| `reveal`"), 'duplicate recipe "reveal"'],
    ["missing table", guide.replace("| Recipe |", "| Other |"), "expected one Recipes recipe table"],
  ])("rejects guide catalogue %s through the check script", async (_, source, diagnostic) => {
    const result = await entry(guidePath, source);
    expect(result.status).toBe(1);
    expect(result.output).toContain(diagnostic);
  });

  it("does not mistake prose, API tables, comments or fenced examples for declarations", async () => {
    const extra =
      "\nProse can discuss `theme.reveal`.\n<!-- ## Motion contract -->\n\n```md\n## Motion contract\n| Token |\n| --- |\n| `theme.reveal` |\n```\n\n~~~md\n## Motion contract\n~~~\n";
    const result = await entry(
      buttonPath,
      button.replace(
        "## Motion contract",
        `| Prop | Type |\n| --- | --- |\n| recipe | \`theme.reveal\` |\n${extra}\n## Motion contract`,
      ),
      true,
    );
    expect(result.status, result.output).toBe(0);
  });

  it("rejects duplicate meta.motion even when frontmatter and table sets agree", async () => {
    const copy = structuredClone(registry);
    copy.items.find((item: { name: string }) => item.name === "button").meta.motion.push("feedback.press");
    expect(await checkMotionDocs(root, copy, catalogue)).toContain(
      'button: meta.motion: duplicate recipe "feedback.press"',
    );
  });
});

describe("new-item motion docs scaffold", () => {
  it.each([
    { motion: [], tier: "T0" },
    { motion: ["reveal", "exit.fade"], tier: "T2" },
    { motion: [], tier: "T3" },
  ])("emits the complete declared set %j", async ({ motion, tier }) => {
    const temp = mkdtempSync(path.join(os.tmpdir(), "cadence-scaffold-"));
    try {
      cpSync("docs", path.join(temp, "docs"), { recursive: true });
      cpSync("content", path.join(temp, "content"), { recursive: true });
      cpSync("components", path.join(temp, "components"), { recursive: true });
      writeFileSync(path.join(temp, "registry.json"), '{"items":[]}');
      const result = spawnSync(
        process.execPath,
        [
          path.join(root, "scripts/new-item.mjs"),
          "--name",
          "fixture",
          "--description",
          "Fixture.",
          "--batch",
          "B1",
          "--tier",
          tier,
          "--motion",
          motion.join(","),
        ],
        { cwd: temp, encoding: "utf8" },
      );
      expect(result.status, result.stderr).toBe(0);
      const target = readFileSync(path.join(temp, "docs/motion/components/fixture.md"), "utf8");
      const scaffold = JSON.parse(readFileSync(path.join(temp, "registry.json"), "utf8"));
      expect(checkCatalogIntensity(scaffold).join("\n")).toContain("authored behaviour reason");
      if (motion.length)
        expect(checkMotionCoverage(scaffold).join("\n")).toContain("substantive ownership/boundary reason");
      expect(scaffold.items[0].meta.intensity).toBe("subtle");
      expect(target).toContain('"migration": "legacy"');
      expect(target).toContain("TODO: assess applicability, actual owner and reason.");
      expect(readFileSync(path.join(temp, "docs/motion/README.md"), "utf8")).toContain(
        "[Fixture](components/fixture.md)",
      );
      const testSource = readFileSync(path.join(temp, "tests/components/fixture.test.tsx"), "utf8");
      if (motion.length) {
        expect(testSource).toContain('import { expectMotionContract } from "../motion-contract"');
        expect(testSource).toContain('it.each(["full", "reduced", "none"] as const)');
        expect(testSource).toContain("expectMotionContract(mode)");
      } else {
        expect(testSource).not.toContain("expectMotionContract");
        expect(testSource).not.toContain("CadenceProvider");
        expect(scaffold.items[0].registryDependencies).toEqual(["@cadence/cadence-utils"]);
        expect(scaffold.items[0].dependencies).toEqual([]);
      }

      expect(
        await checkMotionDocs(temp, JSON.parse(readFileSync(path.join(temp, "registry.json"), "utf8")), catalogue),
      ).toEqual([]);
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });
});
