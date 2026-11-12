import { readFile } from "node:fs/promises";
import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";
import { Children, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { documentFlowPlugin, installationPlugin } from "@/components/site/installation-markdown";
import {
  expandInstallation,
  expandInstallationGuide,
  installationCss,
  installationPlan,
  manualInstructions,
  manualLink,
  validateInstallation,
} from "@/scripts/installation.mjs";

const registry = JSON.parse(await readFile("registry.json", "utf8"));
// A dedicated static item, not a live component that may migrate later.
const staticFixtureRegistry = JSON.parse(await readFile("tests/fixtures/static-graph/registry.json", "utf8"));
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
function ProseMarker({ children }: { children: ReactNode }) {
  return <div data-prose>{children}</div>;
}

describe("shared installation plan", () => {
  it("covers all 63 dependency graphs and all files from multi-file libraries", async () => {
    const components = registry.items.filter((item: { type: string }) =>
      ["registry:ui", "registry:block"].includes(item.type),
    );
    expect(components).toHaveLength(63);
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
    expect(button.files).toHaveLength(30);
    for (const helper of [
      "motion-transaction.ts",
      "motion-presence.tsx",
      "motion-ref.ts",
      "popup-presence.tsx",
      "group-member.ts",
    ])
      expect(button.files.map((file) => file.target)).toContain(`@components/cadence/lib/${helper}`);
    expect(button.files.map((file) => file.target)).toContain("@components/cadence/lib/geometry.ts");
    expect(button.files.map((file) => file.target)).toContain("@components/cadence/lib/motion-scope.tsx");
    expect(button.files.map((file) => file.target)).toContain("@components/cadence/lib/css-motion.ts");
    expect(button.files.map((file) => file.target)).toContain("@components/cadence/lib/motion-environment.ts");
    expect(button.items.find((item) => item.name === "cadence-provider")?.files).toHaveLength(14);
    for (const helper of [
      "inline-presence.ts",
      "measured-geometry.ts",
      "use-text-presentation.ts",
      "use-number-presentation.ts",
    ])
      expect(button.files.map((file) => file.target)).toContain(`@components/cadence/lib/${helper}`);
    expect(button.dependencies).toEqual(
      expect.arrayContaining(["clsx", "tailwind-merge", "motion", "@base-ui/react", "class-variance-authority"]),
    );
    expect(button.dependencies).not.toContain("lucide-react");
    expect(installationPlan(registry.items, "calendar").dependencies).toContain("react-day-picker@9.13.2");
    expect(installationPlan(registry.items, "date-picker").registryDependencies.some((dep) => !dep.direct)).toBe(true);
  });

  it("uses a dedicated static fixture graph without inventing motion or provider dependencies", () => {
    const plan = installationPlan(staticFixtureRegistry.items, "static-fixture");
    expect(plan.provider).toBe(false);
    expect(plan.dependencies).not.toContain("motion");
    expect(plan.files.map((file: { target: string }) => file.target)).toEqual([
      "@components/cadence/static-fixture/index.tsx",
    ]);
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
    expect(css).toContain("--motion-source-duration-fast: 0.16s;");
    expect(css).toContain("[data-motion='none'] {");
    expect(css).toContain("--motion-duration-fast: calc(0s + 0s * 1);");
    expect(css).toContain("@theme static");
    expect(css.indexOf(":root {")).toBeLessThan(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });
});

describe("installation authoring and AST", () => {
  const command =
    "```install\nnpx shadcn@latest add @cadence/button\n```\n\nKeep this note.\n\n```install\nnpx shadcn@latest add @cadence/spinner\n```";
  const body = `## Installation\n\n**Command**\n\n${command}\n\n**Manual**\n\n${manualLink("button")}\n\n## Usage\n\nUse it.`;

  it("preserves every command fence and note", () => {
    const expanded = expandInstallation(body, registry.items, "button");
    expect(expanded).toContain(command);
    expect(expanded).toContain("npm install clsx tailwind-merge motion @base-ui/react class-variance-authority");
    expect(expanded).toContain("@components/cadence/lib/press-button.tsx");
    expect(expanded).toContain("[Source files: button](https://cadence.dev/r/button.json)");
  });

  it.each([
    ["unmarked", "## Installation\n\nold\n\n## Usage\n\nUse it."],
    ["missing Manual", body.replace("**Manual**", "**Other**")],
    ["inline marker", body.replace("**Command**", "Choose **Command**")],
    ["reversed methods", body.replace("**Command**", "**Manual**").replace("**Manual**\n\n[", "**Command**\n\n[")],
    ["duplicate marker", body.replace("**Manual**", "**Manual**\n\n**Manual**")],
    ["empty command", body.replace(command, "```install\n\n```")],
    ["command text outside a fence", body.replace(command, "npx shadcn@latest add @cadence/button")],
    ["wrong source item", body.replace(manualLink("button"), manualLink("badge"))],
    ["source link in prose", body.replace(manualLink("button"), `Copy ${manualLink("button")}.`)],
    ["source link in a list", body.replace(manualLink("button"), `- ${manualLink("button")}`)],
    ["duplicate source link", body.replace(manualLink("button"), `${manualLink("button")}\n\n${manualLink("button")}`)],
    ["source link outside Installation", body.replace(manualLink("button"), "").concat(`\n\n${manualLink("button")}`)],
  ])("rejects %s before expanding component instructions", (_, source) => {
    expect(validateInstallation(source, "button")).toHaveLength(1);
    expect(() => expandInstallation(source, registry.items, "button")).toThrow("Installation needs ordered");
  });

  it("rejects marker text consumed by an unclosed command fence", async () => {
    const source = await readFile("tests/fixtures/installation/unclosed-command-fence.mdx", "utf8");
    expect(validateInstallation(source, "button")).toHaveLength(1);
    expect(() => expandInstallation(source, registry.items, "button")).toThrow("Installation needs ordered");
  });

  it.each(["\n", "\r\n", "\r"])(
    "expands the parsed link, preserving marker-like source text with %j line endings",
    (newline) => {
      const literal = `~~~md\n**Command**\n**Manual**\n${manualLink("button")}\n~~~`;
      const source = body.replace(command, `${command}\n\n${literal}`).replaceAll("\n", newline);
      expect(validateInstallation(source, "button")).toEqual([]);
      const expanded = expandInstallation(source, registry.items, "button");
      expect(expanded).toContain(literal);
      expect(expanded).toBe(
        expandInstallation(body.replace(command, `${command}\n\n${literal}`), registry.items, "button"),
      );
      expect(expanded).not.toContain("\r");
      expect(expanded).toContain("[Source files: button](https://cadence.dev/r/button.json)");
      expect(expanded.split(manualLink("button"))).toHaveLength(2);
    },
  );

  it("retains the separate installation guide path without component method markers", async () => {
    const source = matter(await readFile("content/docs/installation.mdx", "utf8")).content;
    const expanded = expandInstallationGuide(source, registry.items);
    expect(expanded).toContain("--motion-duration-fast: calc(0s + 0s * 1);");
    expect(expanded).not.toContain("[Cadence theme CSS]");
    const { content } = await compileMDX({
      source: expanded,
      options: { mdxOptions: { remarkPlugins: [installationPlugin, documentFlowPlugin] } },
      components: { DocumentProse: ProseMarker },
    });
    const html = renderToStaticMarkup(content);
    expect(html).toContain("Manual installation");
    expect(html).not.toContain("data-panels");
  });

  it("turns only parsed boundaries into panels, retaining multiple fences and code containing marker text", async () => {
    const { content } = await compileMDX({
      source: expandInstallation(body, registry.items, "button"),
      options: { mdxOptions: { remarkPlugins: [installationPlugin, documentFlowPlugin] } },
      components: {
        Installation: PanelCount,
        DocumentProse: ProseMarker,
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
    const dom = document.createElement("div");
    dom.innerHTML = html;
    expect(dom.querySelector("[data-panels]")?.closest("[data-prose]")).toBeNull();
    expect(dom.querySelectorAll("[data-prose]")).toHaveLength(2);
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
      expect(expected).not.toContain("\r");
      expect(JSON.parse(await readFile(`public/r/${item.name}.json`, "utf8")).docs).toBe(expected);
      expect(await readFile(`public/r/${item.name}.md`, "utf8")).toContain(expected);
      expect(full).toContain(expected);
    }
  });
});
