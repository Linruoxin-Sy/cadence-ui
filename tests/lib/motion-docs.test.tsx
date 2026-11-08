import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
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

function entry(file: string, source: string, fresh = false) {
  writeFileSync(path.join(fixture, file), source);
  if (fresh) freshDocs(fixture, path.basename(file, ".mdx"), source);
  try {
    const result = spawnSync(process.execPath, [path.join(root, "scripts/check-registry.mjs")], {
      cwd: fixture,
      encoding: "utf8",
    });
    return { status: result.status, output: result.stdout + result.stderr };
  } finally {
    writeFileSync(path.join(fixture, file), readFileSync(path.join(root, file), "utf8"));
    if (fresh) freshDocs(fixture, path.basename(file, ".mdx"), readFileSync(path.join(root, file), "utf8"));
  }
}

// biome-ignore lint/correctness/usePlaywrightValidDescribeCallback: This is Vitest's suite timeout overload; full-catalogue AST/registry subprocesses need startup headroom under full-suite I/O contention.
describe("registry:check motion docs entry", { timeout: 15_000 }, () => {
  it("requires an animated component's actual test file", () => {
    const file = path.join(fixture, "tests/components/button.test.tsx");
    const source = readFileSync(file, "utf8");
    unlinkSync(file);
    try {
      const result = entry(buttonPath, button);
      expect(result.status).toBe(1);
      expect(result.output).toContain("button: missing animated contract suite tests/components/button.test.tsx");
    } finally {
      writeFileSync(file, source);
    }
  }, 15_000);

  it("accepts all 60 real contracts, including T0, composed, continuous, CSS and engine forms", async () => {
    expect(
      registry.items.filter((item: { type: string }) => ["registry:ui", "registry:block"].includes(item.type)),
    ).toHaveLength(60);
    expect(await checkMotionDocs(root, registry, catalogue)).toEqual([]);
    expect(entry(buttonPath, button).status).toBe(0);
  });

  it.each([
    [
      "missing recipe",
      button.replaceAll("`feedback.press` / `spring.press`", "`spring.press`"),
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
    [
      "frontmatter drift",
      button.replace("motion: [feedback.press]", "motion: [reveal]"),
      "frontmatter motion: missing recipe",
    ],
    [
      "duplicate frontmatter",
      button.replace("motion: [feedback.press]", "motion: [feedback.press, feedback.press]"),
      "frontmatter motion: duplicate recipe",
    ],
    [
      "invalid frontmatter",
      button.replace("motion: [feedback.press]", "motion: feedback.press"),
      "frontmatter motion must be an array",
    ],
  ])("rejects %s through the actual check script", (_, source, diagnostic) => {
    const result = entry(buttonPath, source);
    expect(result.status).toBe(1);
    expect(result.output).toContain(`${buttonPath}:`);
    expect(result.output).toContain(diagnostic);
  });

  it.each([
    ["missing", guide.replace(/^\| `reveal`.*\n/m, ""), 'missing recipe "reveal"'],
    ["unknown", guide.replace("| `reveal`", "| `theme.reveal`"), 'unknown recipe "theme.reveal"'],
    ["duplicate", guide.replace("| `enter.pop`", "| `reveal`"), 'duplicate recipe "reveal"'],
    ["missing table", guide.replace("| Recipe |", "| Other |"), "expected one Recipes recipe table"],
  ])("rejects guide catalogue %s through the check script", (_, source, diagnostic) => {
    const result = entry(guidePath, source);
    expect(result.status).toBe(1);
    expect(result.output).toContain(diagnostic);
  });

  it("does not mistake prose, API tables, comments or fenced examples for declarations", () => {
    const extra =
      "\nProse can discuss `theme.reveal`.\n<!-- ## Motion contract -->\n\n```md\n## Motion contract\n| Token |\n| --- |\n| `theme.reveal` |\n```\n\n~~~md\n## Motion contract\n~~~\n";
    const result = entry(
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
  it.each([{ motion: [] }, { motion: ["reveal", "exit.fade"] }])(
    "emits the complete declared set %j",
    async ({ motion }) => {
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
            motion.length ? "T2" : "T0",
            "--motion",
            motion.join(","),
          ],
          { cwd: temp, encoding: "utf8" },
        );
        expect(result.status, result.stderr).toBe(0);
        const target = readFileSync(path.join(temp, "docs/motion/components/fixture.md"), "utf8");
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
        }

        expect(
          await checkMotionDocs(temp, JSON.parse(readFileSync(path.join(temp, "registry.json"), "utf8")), catalogue),
        ).toEqual([]);
      } finally {
        rmSync(temp, { recursive: true, force: true });
      }
    },
  );
});
