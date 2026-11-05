import { readFile } from "node:fs/promises";
import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";
import { Children, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { installationPlugin } from "@/components/site/installation-markdown";
import {
  expandInstallation,
  hasInstallationTabs,
  installationCss,
  installationPlan,
  manualInstructions,
  manualLink,
  validateInstallation,
} from "@/scripts/installation.mjs";

const registry = JSON.parse(await readFile("registry.json", "utf8"));
function PanelCount({ children }: { children: ReactNode }) {
  return <section data-panels={Children.count(children)}>{children}</section>;
}
function CommandPanel({ children }: { children: ReactNode }) {
  return <div data-command>{children}</div>;
}
function ManualPanel({ children }: { children: ReactNode }) {
  return <div data-manual>{children}</div>;
}
function SourceMarker({ id }: { id: string }) {
  return <span data-source={id} />;
}

describe("shared installation plan", () => {
  it("covers all 59 dependency graphs and all files from multi-file libraries", async () => {
    const components = registry.items.filter((item: { type: string }) =>
      ["registry:ui", "registry:block"].includes(item.type),
    );
    expect(components).toHaveLength(59);
    for (const item of components) {
      const plan = installationPlan(registry.items, item.name);
      expect(new Set(plan.files.map((file) => file.target)).size).toBe(plan.files.length);
      expect(plan.items.at(-1)?.name).toBe(item.name);
      for (const [index, dep] of plan.items.entries()) {
        for (const address of dep.registryDependencies ?? [])
          expect(plan.items.findIndex((entry) => `@cadence/${entry.name}` === address)).toBeLessThan(index);
        const payload = JSON.parse(await readFile(`public/r/${dep.name}.json`, "utf8"));
        for (const file of payload.files ?? []) expect(plan.files.map((entry) => entry.target)).toContain(file.target);
      }
    }
    const button = installationPlan(registry.items, "button");
    expect(button.files).toHaveLength(9);
    expect(button.files.map((file) => file.target)).toContain("@components/cadence/lib/geometry.ts");
    expect(button.items.find((item) => item.name === "cadence-provider")?.files).toHaveLength(5);
    expect(button.dependencies).toEqual(
      expect.arrayContaining(["clsx", "tailwind-merge", "motion", "@base-ui/react", "class-variance-authority"]),
    );
    expect(button.dependencies).not.toContain("lucide-react");
    expect(installationPlan(registry.items, "calendar").dependencies).toContain("react-day-picker@9.13.2");
    expect(installationPlan(registry.items, "date-picker").registryDependencies.some((dep) => !dep.direct)).toBe(true);
  });

  it("uses the actual static graph without inventing motion or provider dependencies", () => {
    const plan = installationPlan(registry.items, "aspect-ratio");
    expect(plan.provider).toBe(false);
    expect(plan.dependencies).not.toContain("motion");
    expect(manualInstructions(plan)).not.toContain("CadenceProvider");
    expect(manualInstructions(installationPlan([{ name: "static", files: [] }], "static"))).toContain(
      "No additional runtime packages.",
    );
  });

  it("fails missing dependencies, cycles and conflicting targets", () => {
    expect(() => installationPlan([{ name: "a", registryDependencies: ["@cadence/b"] }], "a")).toThrow(
      "Missing installation dependency",
    );
    expect(() => installationPlan([{ name: "a", registryDependencies: ["@cadence/a"] }], "a")).toThrow("cycle");
    expect(() =>
      installationPlan(
        [
          {
            name: "a",
            files: [
              { path: "a", target: "same" },
              { path: "b", target: "same" },
            ],
          },
        ],
        "a",
      ),
    ).toThrow("Conflicting installation target");
  });

  it("serializes exact theme values and nested reduced/none rules", () => {
    const theme = registry.items.find((item: { name: string }) => item.name === "cadence-theme");
    const css = installationCss(theme);
    expect(css).toContain("@theme inline");
    expect(css).toContain("--motion-duration-fast: 160ms;");
    expect(css).toContain("[data-motion='none'] {");
    expect(css).toContain("--motion-duration-fast: 0ms;");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });
});

describe("installation authoring and AST", () => {
  const command =
    "```install\nnpx shadcn@latest add @cadence/button\n```\n\nKeep this note.\n\n```install\nnpx shadcn@latest add @cadence/spinner\n```";
  const body = `## Installation\n\n**Command**\n\n${command}\n\n**Manual**\n\n${manualLink("button")}\n\n## Usage\n\nUse it.`;

  it("preserves every command fence and note, and leaves legacy documents untouched", () => {
    const expanded = expandInstallation(body, registry.items, "button");
    expect(expanded).toContain(command);
    expect(expanded).toContain("npm install clsx tailwind-merge motion @base-ui/react class-variance-authority");
    expect(expanded).toContain("@components/cadence/lib/press-button.tsx");
    expect(expanded).toContain("[Source files: button](https://cadence.dev/r/button.json)");
    expect(expandInstallation("## Installation\n\nold", registry.items, "button")).toBe("## Installation\n\nold");
    expect(validateInstallation(body.replace("**Manual**", "**Other**"), "button")).toHaveLength(1);
    expect(hasInstallationTabs(body)).toBe(true);
  });

  it("turns only parsed boundaries into panels, retaining multiple fences and code containing marker text", async () => {
    const { content } = await compileMDX({
      source: expandInstallation(body, registry.items, "button"),
      options: { mdxOptions: { remarkPlugins: [installationPlugin] } },
      components: {
        Installation: PanelCount,
        InstallationCommand: CommandPanel,
        InstallationManual: ManualPanel,
        InstallationSource: SourceMarker,
      },
    });
    const html = renderToStaticMarkup(content);
    expect(html).toContain('data-panels="2"');
    expect(html).toContain("Keep this note.");
    expect(html).toContain("@cadence/spinner");
    expect(html).toContain('data-source="cadence-provider"');
    expect(html).not.toContain("<strong>Manual</strong>");
    const tree = {
      type: "root",
      children: [
        { type: "heading", depth: 2, children: [{ type: "text", value: "Installation" }] },
        { type: "code", value: "**Manual**" },
      ],
    };
    installationPlugin()(tree);
    expect(tree.children[1]?.type).toBe("code");
  });

  it("keeps expanded instructions identical in every distributed channel", async () => {
    const full = await readFile("public/llms-full.txt", "utf8");
    for (const item of registry.items.filter((item: { type: string }) =>
      ["registry:ui", "registry:block"].includes(item.type),
    )) {
      const raw = matter(await readFile(`content/components/${item.name}.mdx`, "utf8")).content.trim();
      const expected = expandInstallation(raw, registry.items, item.name);
      expect(JSON.parse(await readFile(`public/r/${item.name}.json`, "utf8")).docs).toBe(expected);
      expect(await readFile(`public/r/${item.name}.md`, "utf8")).toContain(expected);
      expect(full).toContain(expected);
    }
  });
});
