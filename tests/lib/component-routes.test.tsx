import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { checkComponentRoutes } from "../../scripts/component-routes.mjs";

const root = process.cwd();

it("binds every registry component to its own Next route and preview", async () => {
  const registry = JSON.parse(readFileSync("registry.json", "utf8"));
  expect(await checkComponentRoutes(root, registry)).toEqual([]);
});

describe("component route boundary failures", () => {
  let fixture: string;
  let directory: string;
  let file: string;
  const registry = {
    items: [
      { name: "button", type: "registry:ui" },
      { name: "cadence-motion", type: "registry:lib" },
    ],
  };

  beforeEach(() => {
    fixture = mkdtempSync(path.join(os.tmpdir(), "cadence-component-routes-"));
    directory = path.join(fixture, "app/(site)/components");
    mkdirSync(directory, { recursive: true });
    cpSync(path.join(root, "app/(site)/components/button"), path.join(directory, "button"), { recursive: true });
    file = path.join(directory, "button/page.tsx");
  });
  afterEach(() => rmSync(fixture, { recursive: true, force: true }));

  it.each([
    ["another preview", "previews/button", "previews/badge"],
    ["another document", 'id="button"', 'id="badge"'],
    [
      "an extra client import",
      "export function generateMetadata()",
      'import "@/components/site/previews/chart";\nexport function generateMetadata()',
    ],
  ])("rejects %s in a component entry", async (_, before, after) => {
    writeFileSync(file, readFileSync(file, "utf8").replace(before, after));
    expect(await checkComponentRoutes(fixture, registry)).toEqual([
      "button: component route must import only its own preview and use the shared page template",
    ]);
  });

  it("rejects a missing component entry", async () => {
    rmSync(file);
    expect(await checkComponentRoutes(fixture, registry)).toEqual([
      "button: missing app/(site)/components/button/page.tsx",
    ]);
  });

  it("rejects a generic fallback that could restore the whole preview graph", async () => {
    mkdirSync(path.join(directory, "[id]"));
    expect(await checkComponentRoutes(fixture, registry)).toEqual(["Unexpected component route: [id]"]);
  });
});
