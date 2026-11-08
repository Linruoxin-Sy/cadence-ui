import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, it } from "vitest";
import { authoredCssTokens, generateMotionTokens, loadMotionSource } from "../../scripts/motion-token-source.mjs";
import { compareTokenSources, parseCss, parseDocTokens, parseRegistryTheme } from "../../scripts/motion-tokens.mjs";

const root = process.cwd();
const files = ["app/globals.css", "registry.json", "docs/animation-system.md", "registry/cadence/lib/motion.ts"];
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
async function copies(base: string) {
  return Promise.all(files.map((file) => readFile(path.join(base, file), "utf8")));
}
async function fixture() {
  const parent = path.resolve(process.env.CADENCE_MOTION_TOKEN_TEST_DIR ?? ".cache/tests/motion-tokens");
  await mkdir(parent, { recursive: true });
  const base = await mkdtemp(path.join(parent, "source-"));
  await Promise.all(
    files.map(async (file) => {
      await mkdir(path.dirname(path.join(base, file)), { recursive: true });
      await writeFile(path.join(base, file), await readFile(path.join(root, file)));
    }),
  );
  return base;
}
function sources(css: string, registry: string, docs: string) {
  return [
    { name: "css", parsed: parseCss(css) },
    {
      name: "registry",
      parsed: parseRegistryTheme(
        JSON.parse(registry).items.find((item: { name: string }) => item.name === "cadence-theme"),
      ),
    },
    { name: "docs", parsed: parseDocTokens(docs) },
  ];
}

it("derives all three outputs from the actual TS source and is byte-repeatable", async () => {
  const base = await fixture();
  const original = await copies(base);
  const authored = original[3]?.replace("fast: 0.16", "fast: 0.2");
  expect(authored).not.toEqual(original[3]);
  await writeFile(path.join(base, files[3] ?? ""), authored ?? "");
  const expected = await generateMotionTokens(base);
  const first = await copies(base);
  expect(first[0]).toContain("--motion-source-duration-fast: 0.2s;");
  expect(first[0]).toContain("* 0.6 * var(--cadence-time-scale, 1)");
  const generatedCss = first[0]?.slice(first[0].indexOf("/* Generated from registry/cadence/lib/motion.ts;"));
  expect(generatedCss).toBeTruthy();
  expect(first[2]?.replace(/\n\s*\n/g, "\n")).toContain(generatedCss?.trim().replace(/\n\s*\n/g, "\n"));
  expect(
    compareTokenSources([
      { name: "source", parsed: { tokens: expected, unknown: [] } },
      ...sources(first[0] ?? "", first[1] ?? "", first[2] ?? ""),
    ]),
  ).toEqual([]);
  const originalTheme = JSON.parse(original[1] ?? "{}").items.find(
    (item: { name: string }) => item.name === "cadence-theme",
  );
  const generatedTheme = JSON.parse(first[1] ?? "{}").items.find(
    (item: { name: string }) => item.name === "cadence-theme",
  );
  expect(generatedTheme.cssVars.theme).toEqual(originalTheme.cssVars.theme);
  expect(first[0]?.replaceAll("--motion-source-duration-fast: 0.2s", "--motion-source-duration-fast: 0.16s")).toEqual(
    original[0],
  );
  await generateMotionTokens(base);
  expect((await copies(base)).map(hash)).toEqual(first.map(hash));
});

it("rejects coordinated drift that the old three-copy comparison accepted", async () => {
  const [css = "", registry = "", docs = ""] = await copies(root);
  const drifted = sources(
    css.replaceAll("0.16s", "0.17s"),
    registry.replaceAll("0.16s", "0.17s"),
    docs.replaceAll("0.16s", "0.17s"),
  );
  expect(compareTokenSources(drifted)).toEqual([]);
  const authored = {
    name: "authored",
    parsed: { tokens: authoredCssTokens(await loadMotionSource(root)), unknown: [] },
  };
  expect(compareTokenSources([authored, ...drifted]).join("\n")).toContain("disagrees");
  expect(
    compareTokenSources([authored, ...sources(`${css}\n.dark { --motion-duration-fast: 2s; }`, registry, docs)]).join(
      "\n",
    ),
  ).toContain('under ".dark"');
});

it("does not partially rewrite outputs on malformed input and rejects hidden runtime dependencies", async () => {
  const base = await fixture();
  const docsPath = path.join(base, "docs/animation-system.md");
  await writeFile(docsPath, "missing generation fence");
  const before = await copies(base);
  await expect(generateMotionTokens(base)).rejects.toThrow("missing CSS documentation generation fence");
  expect((await copies(base)).map(hash)).toEqual(before.map(hash));
  await writeFile(
    path.join(base, "registry/cadence/lib/motion.ts"),
    'import "./heavy-renderer"; export const duration = {};',
  );
  await expect(loadMotionSource(base)).rejects.toThrow("standalone parameter module");
});

it("preserves independently retuned theme loops and unrelated theme values", async () => {
  const base = await fixture();
  const cssPath = path.join(base, "app/globals.css");
  await writeFile(
    cssPath,
    (await readFile(cssPath, "utf8")).replace(
      ":root {",
      ":root {\n  --animate-spin: spin 7s linear infinite;\n  --animate-pulse: pulse 8s ease-in-out infinite;",
    ),
  );
  const registryPath = path.join(base, "registry.json");
  const registry = JSON.parse(await readFile(registryPath, "utf8"));
  const theme = registry.items.find((item: { name: string }) => item.name === "cadence-theme");
  theme.cssVars.theme["--animate-spin"] = "spin 7s linear infinite";
  theme.cssVars.light["--animate-pulse"] = "pulse 8s ease-in-out infinite";
  await writeFile(registryPath, JSON.stringify(registry));
  await generateMotionTokens(base);
  expect(await readFile(cssPath, "utf8")).toContain("--animate-spin: spin 7s linear infinite;");
  const generated = JSON.parse(await readFile(registryPath, "utf8"));
  expect(generated).toEqual(registry);
  const [css = "", data = "", docs = ""] = await copies(base);
  expect(
    compareTokenSources([
      { name: "source", parsed: { tokens: authoredCssTokens(await loadMotionSource(base)), unknown: [] } },
      ...sources(css, data, docs),
    ]),
  ).toEqual([]);
});
