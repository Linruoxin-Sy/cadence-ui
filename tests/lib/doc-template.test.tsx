import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { compileMDX } from "next-mdx-remote/rsc";
import { renderToStaticMarkup } from "react-dom/server";
import remarkGfm from "remark-gfm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { checkDocTemplates } from "../../scripts/doc-template.mjs";

const root = process.cwd();
const registry = JSON.parse(readFileSync("registry.json", "utf8"));
let fixture: string;
beforeAll(() => {
  fixture = mkdtempSync(path.join(os.tmpdir(), "cadence-motion-docs-"));
  cpSync("content", path.join(fixture, "content"), { recursive: true });
  cpSync("tests", path.join(fixture, "tests"), { recursive: true });
  cpSync("registry.json", path.join(fixture, "registry.json"));
  cpSync("registry-snapshots.json", path.join(fixture, "registry-snapshots.json"));
  cpSync("components", path.join(fixture, "components"), { recursive: true });
  for (const dir of ["registry", "public", "docs", "app"]) {
    symlinkSync(path.join(root, dir), path.join(fixture, dir), "junction");
  }
});
afterAll(() => rmSync(fixture, { recursive: true, force: true }));

function entry(file: string, source: string) {
  writeFileSync(path.join(fixture, file), source);
  try {
    const result = spawnSync(process.execPath, [path.join(root, "scripts/check-registry.mjs")], {
      cwd: fixture,
      encoding: "utf8",
    });
    return { status: result.status, output: result.stdout + result.stderr };
  } finally {
    writeFileSync(path.join(fixture, file), readFileSync(path.join(root, file), "utf8"));
  }
}

const badgePath = "content/components/badge.mdx";
const badge = readFileSync(badgePath, "utf8");
const without = (source: string, title: string) =>
  source.replace(new RegExp(`## ${title}\\n[\\s\\S]*?(?=\\n## |$)`), "");

describe("real registry template entry", () => {
  it("accepts all 59 real tier/block bodies", async () => {
    expect(await checkDocTemplates(root, registry)).toEqual([]);
    expect(entry(badgePath, badge).status).toBe(0);
  });
  it.each([
    ["missing performance", without(badge, "Responsiveness and performance"), "expected one ## Responsive behavior"],
    ["missing required rationale", without(badge, "When to use"), "expected one ## When to use"],
    [
      "opening order",
      badge.replace("## Installation", "## Usage").replace("## Usage\n\n```tsx", "## Installation\n\n```tsx"),
      "body must open",
    ],
    ["late example", `${badge}\n## Another example\n\nText.\n`, "out of template order"],
    ["Examples wrapper", badge.replace("## Variants", "## Examples"), "wrapper is forbidden"],
    ["nested example", badge.replace("## Variants", "### Variants"), "only ## sections"],
    [
      "nested performance",
      badge.replace("## Responsiveness and performance", "### Responsiveness and performance"),
      "only ## sections",
    ],
    ["Setext", badge.replace("## Variants", "Variants\n--------"), "use ATX"],
    ["HTML", badge.replace("## Variants", "<h3>Variants</h3>"), "not HTML headings"],
    ["body h1", badge.replace("## Variants", "# Variants"), "only ## sections"],
    ["deep API", badge.replace("## API", "## API\n\n#### `Badge`"), "only ## sections"],
    ["non-part API", badge.replace("## API", "## API\n\n### Other"), "only ## sections"],
    ["duplicate", `${badge}\n## Accessibility\n\nText.`, "found 2"],
    [
      "empty coverage",
      badge.replace(
        /## Responsiveness and performance[\s\S]*?(?=## Notes for AI)/,
        "## Responsiveness and performance\n\n",
      ),
      "must have content",
    ],
    [
      "mixed alternatives",
      badge.replace("## Notes for AI", "## Responsive behavior\n\nText.\n\n## Notes for AI"),
      "not both",
    ],
  ])("rejects %s with a source path", (_, source, diagnostic) => {
    const result = entry(badgePath, source);
    expect(result.status).toBe(1);
    expect(result.output).toContain(`${badgePath}:`);
    expect(result.output).toContain(diagnostic);
  });
  it("rejects invalid body before registry:build writes payloads", () => {
    writeFileSync(path.join(fixture, badgePath), without(badge, "Responsiveness and performance"));
    try {
      const result = spawnSync(process.execPath, [path.join(root, "scripts/build-registry.mjs")], {
        cwd: fixture,
        encoding: "utf8",
      });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(`${badgePath}: expected one ## Responsive behavior`);
    } finally {
      writeFileSync(path.join(fixture, badgePath), badge);
    }
  });
  it("requires standard-tier keyboard coverage and input ownership", () => {
    for (const [name, heading] of [
      ["dialog", "Keyboard interactions"],
      ["input", "Validation and data ownership"],
    ] as const) {
      const file = `content/components/${name}.mdx`;
      const result = entry(file, without(readFileSync(file, "utf8"), heading));
      expect(result.status).toBe(1);
      expect(result.output).toContain(`${file}: expected one ## ${heading}`);
    }
  });
  it("allows extra examples, API parts, fences and comments", () => {
    const catalogPath = path.join(fixture, "components/site/previews/examples.json");
    const catalogSource = readFileSync(catalogPath, "utf8");
    const catalog = JSON.parse(catalogSource);
    catalog.badge.push("extra");
    writeFileSync(catalogPath, JSON.stringify(catalog));
    const source = badge
      .replace(
        "## When to use",
        '## Extra example\n\nA further named composition.\n\n<ComponentExample name="extra" />\n\n```tsx\nimport { Badge } from "@/components/cadence/badge";\nexport function Extra() { return <Badge>Extra</Badge>; }\n```\n\n```md\n# ignored\n### ignored\n```\n<!-- ## Examples -->\n\n## When to use',
      )
      .replace("## API", "## API\n\n### `Badge` and `BadgeIcon`");
    try {
      const result = entry(badgePath, source);
      expect(result.status, result.output).toBe(0);
    } finally {
      writeFileSync(catalogPath, catalogSource);
    }
  });
});

describe("real new-item entry", () => {
  it.each(["T0", "T1", "T2", "T3", "T4", "T5"])("generates legal %s docs with input ownership", (tier) => {
    const temp = mkdtempSync(path.join(os.tmpdir(), "cadence-template-scaffold-"));
    try {
      cpSync(path.join(root, "content"), path.join(temp, "content"), { recursive: true });
      cpSync(path.join(root, "components"), path.join(temp, "components"), { recursive: true });
      cpSync(path.join(root, "tests"), path.join(temp, "tests"), { recursive: true });
      for (const file of ["registry.json", "registry-snapshots.json"])
        cpSync(path.join(root, file), path.join(temp, file));
      for (const dir of ["public", "docs", "app"]) symlinkSync(path.join(root, dir), path.join(temp, dir), "junction");
      cpSync(path.join(root, "registry"), path.join(temp, "registry"), { recursive: true });
      const result = spawnSync(
        process.execPath,
        [
          path.join(root, "scripts/new-item.mjs"),
          "--name",
          "fixture",
          "--tier",
          tier,
          "--batch",
          "B1",
          "--description",
          "Fixture.",
          "--input",
          ...(tier === "T0" ? [] : ["--motion", "reveal"]),
        ],
        { cwd: temp, encoding: "utf8" },
      );
      expect(result.status, result.stderr).toBe(0);
      const run = () =>
        spawnSync(process.execPath, [path.join(root, "scripts/check-registry.mjs")], { cwd: temp, encoding: "utf8" });
      // Stubs intentionally fail implementation/payload checks; the actual entry must accept their body.
      const accepted = run();
      expect(accepted.stderr).not.toContain("content/components/fixture.mdx:");
      const file = path.join(temp, "content/components/fixture.mdx");
      const doc = readFileSync(file, "utf8");
      expect(doc).toContain("## Validation and data ownership");
      expect(doc).toContain('<ComponentExample name="composition" />');
      expect(
        JSON.parse(readFileSync(path.join(temp, "components/site/previews/examples.json"), "utf8")).fixture,
      ).toEqual(["composition"]);
      writeFileSync(file, without(doc, "Responsiveness and performance"));
      const rejected = run();
      expect(rejected.status).toBe(1);
      expect(rejected.stderr).toContain("content/components/fixture.mdx: expected one ## Responsive behavior");
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });
});

function ExampleFixture() {
  return <div data-example-fixture />;
}

it("renders representative real MDX bodies with the site compiler and GFM", async () => {
  for (const name of ["card", "input", "resizable", "button", "dialog", "data-table", "attachment"]) {
    const source = readFileSync(`content/components/${name}.mdx`, "utf8");
    const result = await compileMDX({
      source,
      // Actual specimen rendering is covered through the production route; this
      // isolated Markdown structure check supplies the site's custom MDX name.
      components: { ComponentExample: ExampleFixture },
      options: { parseFrontmatter: true, mdxOptions: { remarkPlugins: [remarkGfm] } },
    });
    const html = renderToStaticMarkup(result.content);
    expect(html).toContain("<h2>Installation</h2>");
    expect(html).toContain("<table>");
    expect(html).toMatch(/<h2>(?:Responsiveness and performance|Responsive behavior)<\/h2>/);
  }
});
