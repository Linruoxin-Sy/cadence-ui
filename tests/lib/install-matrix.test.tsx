import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  checkInstallMatrix,
  HOST_PACKAGES,
  importClosureProblems,
  importSpecifiers,
  packageName,
  resolveTarget,
} from "../../scripts/install-matrix.mjs";

const plan = (files: string[], dependencies: string[] = ["motion@^13"], items = ["fixture", "cadence-motion"]) => ({
  id: "fixture",
  items: items.map((name) => ({ name, registryDependencies: [] })),
  dependencies,
  files: files.map((target) => ({ path: `registry/cadence/${target.slice("@components/cadence/".length)}`, target })),
});
const sources = (entries: Record<string, string>) => async (file: string) => {
  const source = entries[file];
  if (source === undefined) throw new Error(`unexpected read: ${file}`);
  return source;
};

describe("install matrix import closure", () => {
  it("accepts relative, namespaced, declared and host imports", async () => {
    const target = "@components/cadence/fixture/index.tsx";
    const problems = await importClosureProblems(
      plan([target, "@components/cadence/lib/cn.ts"]),
      sources({
        "registry/cadence/fixture/index.tsx": [
          'import { cn } from "../lib/cn";',
          'import { useCadenceMotion } from "@cadence/cadence-motion";',
          'import { motion } from "motion/react";',
          'import type { ReactNode } from "react";',
        ].join("\n"),
        "registry/cadence/lib/cn.ts": "export const cn = () => '';",
      }),
    );
    expect(problems).toEqual([]);
    expect([...HOST_PACKAGES]).toEqual(["react", "react-dom", "next"]);
  });

  it("reports a relative import no plan installs", async () => {
    const target = "@components/cadence/fixture/index.tsx";
    const problems = await importClosureProblems(
      plan([target]),
      sources({
        "registry/cadence/fixture/index.tsx": 'import { nativeTextContext } from "../lib/text-layout";',
      }),
    );
    expect(problems).toEqual([
      'fixture: registry/cadence/fixture/index.tsx imports "../lib/text-layout" (@components/cadence/lib/text-layout) but no plan installs it',
    ]);
  });

  it("reports an undeclared package exactly once per import", async () => {
    const target = "@components/cadence/fixture/index.tsx";
    const problems = await importClosureProblems(
      plan([target]),
      sources({
        "registry/cadence/fixture/index.tsx": 'import { useVirtualizer } from "@tanstack/react-virtual";',
      }),
    );
    expect(problems).toEqual([
      'fixture: registry/cadence/fixture/index.tsx imports "@tanstack/react-virtual" but the plan declares no "@tanstack/react-virtual"',
    ]);
  });

  it.each([
    ['import { Button } from "@/components/cadence/button";', 'imports the host alias "@/components/cadence/button"'],
    ['import { helper } from "@cadence/cadence-geometry";', 'imports "@cadence/cadence-geometry" outside its plan'],
    ['import { z } from "zod";', 'imports the validation library "zod" (P11)'],
    ['import { readFile } from "node:fs/promises";', 'imports the Node builtin "node:fs/promises"'],
    ['import { join } from "path";', 'imports the Node builtin "path"'],
    ['import { up } from "../../outside";', 'imports "../../outside", which leaves the installed tree'],
  ])("reports %s", async (source, detail) => {
    const target = "@components/cadence/fixture/index.tsx";
    const problems = await importClosureProblems(
      plan([target]),
      sources({
        "registry/cadence/fixture/index.tsx": source,
      }),
    );
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain(detail);
  });

  it("ignores comments and plain strings, so a retired import cannot fail the gate", () => {
    const source = [
      '// import { z } from "zod";',
      "const note = \"from '@/components/nope'\";",
      'import { cn } from "./cn";',
    ].join("\n");
    expect(importSpecifiers(source)).toEqual(["./cn"]);
  });

  it("normalizes package names and relative targets", () => {
    expect(packageName("@tanstack/react-table@9.3.1")).toBe("@tanstack/react-table");
    expect(packageName("motion/react")).toBe("motion");
    expect(packageName("react-day-picker@9.13.2")).toBe("react-day-picker");
    expect(resolveTarget("@components/cadence/toggle/index.tsx", "../lib/cn")).toBe("@components/cadence/lib/cn");
    // The installable tree is `@components/cadence/`; a sibling alias path is not installed either.
    expect(resolveTarget("@components/cadence/lib/cn.ts", "../../app/x")).toBeNull();
    expect(resolveTarget("@components/cadence/lib/cn.ts", "../../../x")).toBeNull();
  });
});

describe("install matrix over the committed registry", () => {
  it("resolves every payload and every install plan", async () => {
    const registry = JSON.parse(await readFile("registry.json", "utf8"));
    const { rows, problems } = await checkInstallMatrix(process.cwd(), registry);
    expect(problems).toEqual([]);
    expect(rows).toHaveLength(registry.items.length);
    const components = rows.filter((row) => row.component);
    expect(components.length).toBeGreaterThanOrEqual(63);
    // Every catalogue item must resolve to a real plan; support items install too.
    expect(rows.filter((row) => row.planFiles !== undefined)).toHaveLength(registry.items.length);
    for (const row of rows) expect(row.failures).toEqual([]);
  });
});
