import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const root = process.cwd();
const registry = JSON.parse(readFileSync("registry.json", "utf8"));
// Exercise origin policy independently of any installed Cadence original.
registry.items = registry.items.filter(
  (item: { meta?: { upstream?: { registry?: string } } }) => item.meta?.upstream?.registry !== "cadence",
);
registry.items.push({
  name: "original-fixture",
  type: "registry:ui",
  meta: {
    since: "0.5.0",
    upstream: { registry: "cadence", style: "native", version: "0.5.0", reason: "Independent policy fixture" },
  },
});
const pinned = Object.keys(JSON.parse(readFileSync("upstream/manifest.json", "utf8")).items).sort();
let fixture: string;

beforeAll(() => {
  mkdirSync(path.join(root, ".cache"), { recursive: true });
  fixture = mkdtempSync(path.join(root, ".cache", "component-origin-"));
  mkdirSync(path.join(fixture, "upstream"));
  copyFileSync(path.join(root, "upstream/manifest.json"), path.join(fixture, "upstream/manifest.json"));
  symlinkSync(path.join(root, "registry"), path.join(fixture, "registry"), "junction");
});

afterAll(() => {
  if (!path.resolve(fixture).startsWith(`${path.join(root, ".cache", "component-origin-")}`))
    throw new Error("Unexpected fixture path");
  rmSync(fixture, { recursive: true, force: true });
});

function check(mutate?: (items: typeof registry.items) => void) {
  const input = structuredClone(registry);
  mutate?.(input.items);
  writeFileSync(path.join(fixture, "registry.json"), JSON.stringify(input));
  const result = spawnSync(process.execPath, [path.join(root, "scripts/parity.mjs"), "--json"], {
    cwd: fixture,
    encoding: "utf8",
  });
  return JSON.parse(result.stdout);
}

describe("Cadence original origin", () => {
  it("compares every pinned shadcn component while excluding the original fixture", () => {
    const result = check();
    expect(result.ok).toBe(true);
    expect([...result.checked].sort()).toEqual(pinned);
    expect(result.checked).not.toContain("original-fixture");
  });

  it("rejects disguising a pinned component as an original", () => {
    const result = check((items) => {
      const button = items.find((item: { name: string }) => item.name === "button");
      button.meta.upstream = {
        registry: "cadence",
        style: "native",
        version: button.meta.since,
        reason: "Pretend original",
      };
    });
    expect(result.ok).toBe(false);
    expect(result.problems).toContain("button: a pinned shadcn item cannot be reclassified as a Cadence original");
  });

  it("requires a stated origin reason", () => {
    const result = check((items) => {
      items.find((item: { name: string }) => item.name === "original-fixture").meta.upstream.reason = "";
    });
    expect(result.ok).toBe(false);
    expect(result.problems).toContain("original-fixture: invalid Cadence original origin metadata");
  });
});
