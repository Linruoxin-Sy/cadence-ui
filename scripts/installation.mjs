/** Shared, deterministic installation plan for authoring, distribution and the site. */
export const SITE = "https://cadence.dev";
export const manualLink = (id) => `[Manual installation files](${SITE}/r/${id}.json)`;

/** @typedef {{path: string, target: string, content?: string}} InstallFile */
/** @typedef {{name: string, dependencies?: string[], devDependencies?: string[], registryDependencies?: string[], files?: InstallFile[], cssVars?: Record<string, Record<string, string>>, css?: Record<string, unknown>}} InstallItem */

/** Dependency-first traversal; preserve package specs verbatim, including pins. */
export function installationPlan(/** @type {InstallItem[]} */ items, /** @type {string} */ id) {
  const byId = new Map(items.map((item) => [item.name, item]));
  const root = byId.get(id);
  if (!root) throw new Error(`Unknown installation item: ${id}`);
  /** @type {InstallItem[]} */
  const ordered = [];
  const visiting = new Set();
  const visited = new Set();
  const visit = (name) => {
    if (visited.has(name)) return;
    if (visiting.has(name)) throw new Error(`Installation dependency cycle: ${name}`);
    const item = byId.get(name);
    if (!item) throw new Error(`Missing installation dependency: ${name}`);
    visiting.add(name);
    for (const dep of item.registryDependencies ?? []) {
      if (!dep.startsWith("@cadence/")) throw new Error(`Unsupported installation dependency: ${dep}`);
      visit(dep.slice("@cadence/".length));
    }
    visiting.delete(name);
    visited.add(name);
    ordered.push(item);
  };
  visit(id);
  const direct = new Set(root.registryDependencies ?? []);
  const targets = new Map();
  const files = ordered.flatMap((item) =>
    (item.files ?? [])
      .filter((file) => {
        if (!file.target) throw new Error(`Missing installation target: ${file.path}`);
        const existing = targets.get(file.target);
        if (existing && existing !== file.path) throw new Error(`Conflicting installation target: ${file.target}`);
        targets.set(file.target, file.path);
        return !existing;
      })
      .map((file) => ({ ...file, item: item.name })),
  );
  return {
    id,
    items: ordered,
    dependencies: [...new Set(ordered.flatMap((item) => item.dependencies ?? []))],
    devDependencies: [...new Set(ordered.flatMap((item) => item.devDependencies ?? []))],
    registryDependencies: ordered
      .filter((item) => item.name !== id)
      .map((item) => ({
        id: item.name,
        direct: direct.has(`@cadence/${item.name}`),
      })),
    files,
    provider: visited.has("cadence-provider"),
  };
}

/** Serialize registry CSS without another maintained copy of theme tokens. */
function cssRules(rules, depth = 0) {
  const indent = "  ".repeat(depth);
  return Object.entries(rules)
    .map(([key, value]) =>
      typeof value === "object" && value !== null
        ? `${indent}${key} {\n${cssRules(value, depth + 1)}\n${indent}}`
        : `${indent}${key}: ${value};`,
    )
    .join("\n");
}

export function installationCss(item) {
  const vars = item.cssVars ?? {};
  return [
    vars.theme ? `@theme inline {\n${cssRules(vars.theme, 1)}\n}` : "",
    vars.light ? `:root {\n${cssRules(vars.light, 1)}\n}` : "",
    vars.dark ? `.dark {\n${cssRules(vars.dark, 1)}\n}` : "",
    item.css ? cssRules(item.css) : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function expandInstallationGuide(body, items) {
  const theme = items.find((item) => item.name === "cadence-theme");
  if (!theme) throw new Error("Missing cadence-theme setup metadata");
  return body.replace(
    "[Cadence theme CSS](https://cadence.dev/r/cadence-theme.json)",
    `\`\`\`css\n${installationCss(theme)}\n\`\`\``,
  );
}

export function manualInstructions(plan) {
  const lines = [
    "Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.",
    "",
    "1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.",
    "",
    ...(plan.dependencies.length
      ? ["```package-manager", `npm install ${plan.dependencies.join(" ")}`, "```", ""]
      : ["No additional runtime packages.", ""]),
    ...(plan.devDependencies.length
      ? ["```package-manager", `npm install -D ${plan.devDependencies.join(" ")}`, "```", ""]
      : []),
    "2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.",
    "",
    ...plan.registryDependencies.map(
      (dep) =>
        `- [@cadence/${dep.id}](${SITE}/r/${dep.id}.json) — ${dep.direct ? "direct" : "transitive"} registry dependency.`,
    ),
    ...(plan.registryDependencies.length ? [] : ["No registry dependencies."]),
    "",
    "3. Place every file at its target below. `@components` means your components directory, for example `src/components`; keep the remaining `cadence/` tree and relative imports intact. Each source block on the website copies the entire file, including folded lines.",
    "",
    "| Item | Target file | Full source |",
    "| --- | --- | --- |",
    ...plan.files.map(
      (file) => `| ${file.item} | \`${file.target}\` | [JSON files[].content](${SITE}/r/${file.item}.json) |`,
    ),
    "",
    ...plan.items
      .filter((item) => item.files?.length)
      .flatMap((item) => [`[Source files: ${item.name}](${SITE}/r/${item.name}.json)`, ""]),
    "4. Apply the required CSS/configuration below, then follow [Usage](#usage) for the component imports and composition.",
    "",
  ];
  for (const item of plan.items) {
    const css = installationCss(item);
    if (css)
      lines.push(
        `Merge the CSS from [${item.name}](${SITE}/r/${item.name}.json) into your global stylesheet after your base theme:`,
        "",
        "```css",
        css,
        "```",
        "",
      );
  }
  if (!plan.items.some((item) => installationCss(item)))
    lines.push("No additional item-specific CSS configuration is required beyond the base theme.", "");
  if (plan.provider)
    lines.push(
      "The provider files above are required imports. Wrapping your application is optional; standalone components respect the system motion preference. To control a subtree, wrap it once:",
      "",
      "```tsx",
      'import { CadenceProvider } from "@/components/cadence/lib/provider";',
      "",
      "export function MotionRoot({ children }: { children: React.ReactNode }) {",
      '  return <CadenceProvider mode="full">{children}</CadenceProvider>;',
      "}",
      "```",
      "",
    );
  return lines.join("\n").trim();
}

/** The marker opts in a page; legacy pages remain unchanged during migration. */
export function hasInstallationTabs(body) {
  return /^\*\*(?:Command|Manual)\*\*\s*$/m.test(body);
}

export function validateInstallation(body, id) {
  if (!hasInstallationTabs(body)) return [];
  const section = body.match(/^## Installation\s*\n([\s\S]*?)(?=^## |$(?![\s\S]))/m)?.[1] ?? "";
  const command = section.indexOf("**Command**");
  const manual = section.indexOf("**Manual**");
  const count = (text) => section.split(text).length - 1;
  return command >= 0 &&
    manual > command &&
    count("**Command**") === 1 &&
    count("**Manual**") === 1 &&
    count(manualLink(id)) === 1 &&
    /```install\s/.test(section.slice(command, manual))
    ? []
    : [
        `${id}: Installation needs ordered standalone **Command** / **Manual** boundaries, an install fence and exactly one ${manualLink(id)}`,
      ];
}

export function expandInstallation(body, items, id) {
  const problems = validateInstallation(body, id);
  if (problems.length) throw new Error(problems.join("\n"));
  if (!hasInstallationTabs(body)) return body;
  return body.replace(manualLink(id), manualInstructions(installationPlan(items, id)));
}
