// Isolated full-route research. No product source/config or registry forks.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import { chromium } from "@playwright/test";
import { rechunkButtonPrototype } from "./rechunk-button-prototype.mjs";
import { measureInitialScripts, summarizeLayoutShifts } from "./site-js-budget.mjs";
import { auditButtonPrototype } from "./verify-button-prototype.mjs";

const root = process.cwd();
const dir = path.resolve(process.env.PROTOTYPE_OUTPUT || `.cache/audits/button-route-${Date.now()}`);
assert.ok(dir.startsWith(path.resolve(root, ".cache") + path.sep), "research output must stay in .cache");
await mkdir(path.dirname(dir), { recursive: true });
await mkdir(dir); // Refuse to overwrite any previous build or evidence.
const sourceRoot = root.replaceAll("\\", "/");
const require = createRequire(import.meta.url);
const viteRequire = createRequire(createRequire(require.resolve("vitest/node")).resolve("vite"));
const { build, transform, version } = await import(pathToFileURL(viteRequire.resolve("esbuild")));
const boundaries = {
  [path.join(dir, "link")]: ["PrototypeLink"],
  "registry/cadence/toc": ["Toc"],
  "registry/cadence/breadcrumb": [
    "Breadcrumb",
    "BreadcrumbItem",
    "BreadcrumbLink",
    "BreadcrumbList",
    "BreadcrumbPage",
    "BreadcrumbSeparator",
  ],
  "components/site/component-catalog": ["ComponentCatalog"],
  "components/site/motion-mode": ["MotionModeProvider", "MotionModeSwitch", "MotionSpeedSelect"],
  "components/site/package-manager-preference": ["PackageManagerProvider"],
  "components/site/theme-toggle": ["ThemeToggle"],
  "components/site/sidebar": ["Sidebar"],
  "components/site/document-entrance": ["DocumentEntrance"],
  "components/site/preview": ["PreviewFrame"],
  "components/site/package-manager-block": ["PackageManagerBlock"],
  "registry/cadence/code-block": [
    "CodeBlock",
    "CodeBlockHeader",
    "CodeBlockTitle",
    "CodeBlockActions",
    "CodeBlockCopyButton",
    "CodeBlockContent",
    "CodeBlockLine",
  ],
};
const imports = Object.entries(boundaries)
  .map(
    ([file, names]) =>
      `import { ${names.join(",")} } from ${JSON.stringify(path.resolve(root, file).replaceAll("\\", "/"))};`,
  )
  .join("\n");
const names = Object.values(boundaries).flat();
await writeFile(path.join(dir, "references.jsx"), `${imports}\nexport const references = {${names.join(",")}};`);
await writeFile(
  path.join(dir, "codec.jsx"),
  `import { createElement, Fragment } from "react";
import { references } from "./references";
export function decode(value) {
 if (Array.isArray(value)) return value.map(decode);
 if (!value || typeof value !== "object") return value;
 if (value.$element) { const [type, props, key] = value.$element;
   return createElement(type === "$fragment" ? Fragment : references[type] || type, { ...decode(props), key }); }
 return Object.fromEntries(Object.entries(value).map(([key,v])=>[key,decode(v)]));
}`,
);
// Link/navigation adapter retains SPA Button query/history behavior; other routes use the real product.
await writeFile(
  path.join(dir, "link.jsx"),
  `import { createElement } from "react";
export function PrototypeLink({href, prefetch, replace, scroll, onClick, ...props}) { return createElement("a", { ...props, href, onClick(e){onClick?.(e);if(!e.defaultPrevented && e.button===0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && href.startsWith("/") && !href.startsWith("/r/")){e.preventDefault();window.__navigate(href,replace,scroll);}} }); } export default PrototypeLink;`,
);
await writeFile(
  path.join(dir, "navigation.js"),
  `import {useSyncExternalStore} from "react";
export function usePathname(){return useSyncExternalStore(fn=>{window.addEventListener("prototype-navigation",fn);return ()=>window.removeEventListener("prototype-navigation",fn);},()=>location.pathname,()=>globalThis.__prototypePath || "/components/button");}
export function notFound(){throw Error("Not found");}`,
);
const previewSource = await readFile("components/site/previews/index.tsx", "utf8");
const previewEntries = [
  ...previewSource.matchAll(
    /(?:"([\w-]+)"|([\w]+)): dynamic\(\(\) => import\("\.\/([\w-]+)"\)\.then\(\(mod\) => \(\{ default: mod\.([\w]+) \}\)\)\)/g,
  ),
];
const registry = JSON.parse(await readFile("registry.json", "utf8"));
const componentIds = registry.items
  .filter((item) => ["registry:ui", "registry:block"].includes(item.type))
  .map((item) => item.name);
assert.deepEqual(previewEntries.map((m) => m[1] || m[2]).sort(), [...componentIds].sort());
const exampleIds = JSON.parse(await readFile("components/site/previews/examples.json", "utf8")).button;
await writeFile(
  path.join(dir, "all-previews.jsx"),
  previewEntries
    .map((m, i) => `import {${m[4]} as P${i}} from "${sourceRoot}/components/site/previews/${m[3]}";`)
    .join("\n") +
    `\nexport const previews={${previewEntries.map((m, i) => `${JSON.stringify(m[1] || m[2])}:P${i}`).join(",")}};`,
);
await writeFile(
  path.join(dir, "dynamic.jsx"),
  `import {createElement} from "react";
export const pending=[];export default function dynamic(loader){let Component;const load=async()=>{Component=(await loader()).default;};pending.push(load);const Wrapped=props=>Component?createElement(Component,props):null;Wrapped.preload=load;return Wrapped;}`,
);
await writeFile(
  path.join(dir, "client.jsx"),
  `import { hydrateRoot } from "react-dom/client";
import {decode} from "./codec";
import {previews} from "${sourceRoot}/components/site/previews";
async function preload(path){const id=path.split("?")[0].split("/")[2];await previews[id]?.preload();}
await preload(location.pathname);
const tree = await fetch("/prototype-tree.json?path="+encodeURIComponent(location.pathname)).then(r=>r.json());
window.__hydrationErrors=[];
const root=hydrateRoot(document, decode(tree), {onRecoverableError(e){window.__hydrationErrors.push(e.message);console.error(e);}});
let serial=0;let renderedPath=location.pathname;
window.__navigate=async(href,replace=false,scroll=true,history=true)=>{const current=++serial;const url=new URL(href,location.href);if(url.pathname===renderedPath){if(history)window.history[replace?"replaceState":"pushState"](window.history.state,"",url);window.dispatchEvent(new Event("prototype-navigation"));return;}await preload(url.pathname);const next=await fetch("/prototype-tree.json?path="+encodeURIComponent(url.pathname)).then(r=>{if(!r.ok)throw Error("Route "+r.status);return r.json();});if(current!==serial)return;if(history)window.history[replace?"replaceState":"pushState"](null,"",url);root.render(decode(next));renderedPath=url.pathname;window.dispatchEvent(new Event("prototype-navigation"));if(scroll)window.scrollTo(0,0);};
window.addEventListener("popstate",()=>window.__navigate(location.href,false,false,false));
window.__prototypeReady=true;`,
);
await writeFile(
  path.join(dir, "server.jsx"),
  `import {createElement, isValidElement, Fragment} from "react";
import {renderToString} from "react-dom/server";
import Root, {metadata as rootMetadata} from "${sourceRoot}/app/layout";
import Layout from "${sourceRoot}/app/(site)/layout";
import Page, {generateMetadata as componentMetadata} from "${sourceRoot}/app/(site)/components/[id]/page";
import Catalog from "${sourceRoot}/app/(site)/components/page";
import Docs from "${sourceRoot}/app/(site)/docs/page";
import Guide, {generateMetadata as guideMetadata} from "${sourceRoot}/app/(site)/docs/[slug]/page";
import Home from "${sourceRoot}/app/page";
import {references} from "./references";
import {decode} from "./codec";
const ids=new Map(Object.entries(references).map(([k,v])=>[v,k]));
async function encode(value){
 if (value == null || typeof value !== "object" && typeof value !== "function") return value;
 if(Array.isArray(value)) return Promise.all(value.map(encode));
 if(isValidElement(value)) {
  const {type,props,key}=value;
  if(typeof type === "function" && !ids.has(type)) return encode(await type(props));
  const name=type===Fragment?"$fragment":ids.get(type)||type;
  if(typeof name!=="string") throw Error("Unsupported server element "+String(type)+" keys="+Object.keys(type||{})+" render="+String(type?.render?.name)+" props="+Object.keys(props));
  return {$element:[name,await encode(props),key]};
 }
 if(typeof value==="function") throw Error("Function crossed server boundary");
 return Object.fromEntries(await Promise.all(Object.entries(value).map(async([k,v])=>[k,await encode(v)])));
}
export async function generate(pathname="/components/button"){
 globalThis.__prototypePath=pathname;
 let page=pathname==="/components"?createElement(Catalog):pathname==="/docs"?createElement(Docs):pathname.startsWith("/docs/")?createElement(Guide,{params:Promise.resolve({slug:pathname.split("/")[2]})}):pathname==="/"?createElement(Home):createElement(Page,{params:Promise.resolve({id:pathname.split("/")[2]})});
 const tree=await encode(createElement(Root,null,pathname==="/"?page:createElement(Layout,null,page)));
 const head=tree.$element[1].children[0];
 const metadata=pathname.startsWith("/components/")?await componentMetadata({params:Promise.resolve({id:pathname.split("/")[2]})}):pathname.startsWith("/docs/")?await guideMetadata({params:Promise.resolve({slug:pathname.split("/")[2]})}):{title:pathname==="/components"?"Components":pathname==="/docs"?"Docs":"Cadence UI — animation-first components for shadcn"};
 head.$element[1].children.push({$element:["title",{children:pathname==="/"?metadata.title:metadata.title+" · Cadence UI"},null]});
 if(metadata.description)head.$element[1].children.push({$element:["meta",{name:"description",content:metadata.description},null]});
 for(const [property,content]of Object.entries({"og:title":rootMetadata.openGraph.title,"og:description":rootMetadata.openGraph.description,"og:type":rootMetadata.openGraph.type}))head.$element[1].children.push({$element:["meta",{property,content},null]});
 for(const [name,content]of Object.entries({"twitter:card":"summary","twitter:title":rootMetadata.openGraph.title,"twitter:description":rootMetadata.openGraph.description}))head.$element[1].children.push({$element:["meta",{name,content},null]});
 head.$element[1].children.unshift({$element:["meta",{charSet:"utf-8"},null]},{$element:["meta",{name:"viewport",content:"width=device-width, initial-scale=1"},null]});
 head.$element[1].children.push({$element:["link",{rel:"stylesheet",href:"/prototype.css"},null]});
 head.$element[1].children.push({$element:["script",{type:"module",src:"/client.js"},null]});
 return {tree,html:"<!doctype html>"+renderToString(decode(tree))};
}`,
);
let serverBuild = false;
const plugins = [
  {
    name: "prototype-adapters",
    setup(b) {
      b.onResolve({ filter: /^next\/link$/ }, () => ({ path: path.join(dir, "link.jsx") }));
      b.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: path.join(dir, "navigation.js") }));
      b.onResolve({ filter: /^next\/dynamic$/ }, () => ({ path: path.join(dir, "dynamic.jsx") }));
      b.onResolve({ filter: /^\.\/previews$/ }, (args) =>
        serverBuild && args.importer.endsWith("preview.tsx") ? { path: path.join(dir, "all-previews.jsx") } : undefined,
      );
      b.onLoad({ filter: /\.css$/ }, () => ({ contents: "", loader: "js" }));
    },
  },
];
const common = {
  bundle: true,
  jsx: "automatic",
  plugins,
  tsconfig: path.join(root, "tsconfig.json"),
  define: { "process.env.NODE_ENV": JSON.stringify(process.env.PROTOTYPE_DEBUG ? "development" : "production") },
  logLevel: "error",
};
const client = await build({
  ...common,
  entryPoints: [path.join(dir, "client.jsx")],
  outdir: path.join(dir, "browser"),
  platform: "browser",
  format: "esm",
  splitting: true,
  minify: true,
  metafile: true,
});
const compact =
  process.env.PROTOTYPE_COMPACT_INITIAL === "1" ? await rechunkButtonPrototype(dir, client.metafile, transform) : null;
const browserFiles = compact?.chunks.map((chunk) => chunk.file) || Object.keys(client.metafile.outputs);
serverBuild = true;
const serverOutput = await build({
  ...common,
  entryPoints: [path.join(dir, "server.jsx")],
  outfile: path.join(dir, "server.mjs"),
  platform: "node",
  format: "esm",
  packages: "external",
  metafile: true,
});
const postcss = (await import("postcss")).default;
const tailwind = (await import("@tailwindcss/postcss")).default;
const css = await postcss([tailwind()]).process(await readFile("app/globals.css", "utf8"), {
  from: path.join(root, "app/globals.css"),
});
await writeFile(path.join(dir, "prototype.css"), css.css);
const { generate } = await import(pathToFileURL(path.join(dir, "server.mjs")));
const { html, tree } = await generate();
await writeFile(path.join(dir, "index.html"), html);
await writeFile(path.join(dir, "prototype-tree.json"), JSON.stringify(tree));
await writeFile(
  path.join(dir, "build.json"),
  JSON.stringify({ esbuild: version, client: client.metafile, compact, server: serverOutput.metafile }, null, 2),
);
const fallback = process.env.PROTOTYPE_BASELINE || "http://127.0.0.1:3100";
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://fixture.invalid");
    let file;
    if (url.pathname === "/prototype-tree.json") {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify(
          (url.searchParams.get("path") || "/components/button") === "/components/button"
            ? tree
            : (await generate(url.searchParams.get("path"))).tree,
        ),
      );
      return;
    }
    if (url.pathname === "/" || /^\/(components|docs)(\/[^/]+)?$/.test(url.pathname)) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(url.pathname === "/components/button" ? html : (await generate(url.pathname)).html);
      return;
    } else if (url.pathname === "/prototype.css") file = "prototype.css";
    else if (browserFiles.some((p) => path.basename(p) === url.pathname.slice(1)))
      file = `${compact ? "browser-compact" : "browser"}/${url.pathname.slice(1)}`;
    if (file) {
      res.setHeader(
        "Content-Type",
        file.endsWith(".json") ? "application/json" : file.endsWith(".css") ? "text/css" : "text/javascript",
      );
      res.end(await readFile(path.join(dir, file)));
      return;
    }
    const response = await fetch(fallback + req.url);
    res.statusCode = response.status;
    for (const [key, value] of response.headers)
      if (!["content-encoding", "content-length", "transfer-encoding"].includes(key)) res.setHeader(key, value);
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (e) {
    res.statusCode = 500;
    res.end(String(e));
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
console.log(`PROTOTYPE ${origin}`);
if (process.argv.includes("--serve")) await new Promise(() => {});
else {
  let browser;
  try {
    const results = [];
    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 390, height: 844 },
    ]) {
      browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || "msedge" });
      const context = await browser.newContext({ viewport, reducedMotion: "no-preference" });
      await context.addInitScript(() => {
        window.__shifts = [];
        new PerformanceObserver((list) => {
          for (const e of list.getEntries())
            window.__shifts.push({ value: e.value, startTime: e.startTime, hadRecentInput: e.hadRecentInput });
        }).observe({ type: "layout-shift", buffered: true });
      });
      const page = await context.newPage();
      const measured = await measureInitialScripts(page, `${origin}/components/button`);
      await page.waitForFunction(() => window.__prototypeReady);
      results.push({
        viewport,
        ...measured,
        hydrationErrors: await page.evaluate(() => window.__hydrationErrors),
        shifts: await page.evaluate(() => window.__shifts),
        cls: summarizeLayoutShifts(await page.evaluate(() => window.__shifts)),
      });
      await context.close();
      await browser.close();
    }
    browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || "msedge" });
    const functionality = await auditButtonPrototype(browser, origin, fallback, dir, { componentIds, exampleIds });
    const hash = (body) => createHash("sha256").update(body).digest("hex");
    const sourceHashes = {};
    for (const file of [
      ...new Set([
        ...Object.keys(client.metafile.inputs),
        ...Object.keys(serverOutput.metafile.inputs),
        "scripts/prototype-button-route.mjs",
        "scripts/verify-button-prototype.mjs",
        "scripts/rechunk-button-prototype.mjs",
        "scripts/site-js-budget.mjs",
        "package.json",
        "pnpm-lock.yaml",
        "app/globals.css",
        "app/typeset.css",
        "content/components/button.mdx",
        "public/r/button.json",
      ]),
    ]
      .filter((file) => !file.startsWith("node_modules/"))
      .sort())
      sourceHashes[file] = hash(await readFile(file));
    const loaded = new Set(results[0].files.map((f) => new URL(f.url).pathname.slice(1)));
    const loadedStageOneOutputs = compact
      ? new Set(compact.chunks.filter((chunk) => loaded.has(chunk.fileName)).flatMap((chunk) => chunk.stageOneOutputs))
      : null;
    const modules = {};
    for (const [file, output] of Object.entries(client.metafile.outputs))
      if (loadedStageOneOutputs ? loadedStageOneOutputs.has(path.resolve(file)) : loaded.has(path.basename(file)))
        for (const [input, value] of Object.entries(output.inputs))
          modules[input] = (modules[input] || 0) + value.bytesInOutput;
    const outputFiles = [];
    for (const file of browserFiles) {
      const body = await readFile(file);
      outputFiles.push({ file, bytes: body.length, gzip6: gzipSync(body, { level: 6 }).length, sha256: hash(body) });
    }
    const report = {
      source: (await import("node:child_process"))
        .execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" })
        .trim(),
      scope: "Isolated full Button route research; no product framework adoption or Next budget certification",
      outputDirectory: dir,
      dirtySourceFiles: (await import("node:child_process"))
        .execFileSync("git", ["diff", "--name-only"], { encoding: "utf8" })
        .trim()
        .split(/\r?\n/)
        .filter(Boolean),
      baselineBuildId: (await readFile(path.join(process.env.CADENCE_DIST_DIR || ".next", "BUILD_ID"), "utf8")).trim(),
      componentIds,
      exampleIds,
      outputFiles,
      ssr: { decoded: Buffer.byteLength(html), gzip6: gzipSync(html, { level: 6 }).length, sha256: hash(html) },
      node: process.version,
      esbuild: version,
      compact,
      browser: browser.version(),
      protocol:
        "fresh context/cache disabled/no interception, scroll or interaction; load + networkidle +10s +networkidle; all automatic script URLs; decoded bodies gzip6 independently",
      status: results.every((r) => r.gzipBytes <= 120000) ? "PASS_BUTTON_ONLY" : "FAIL_BUDGET",
      htmlSha256: hash(html),
      sourceHashes,
      moduleAttribution: {
        unit: compact
          ? "stage-one minified raw bytes of inputs in loaded rechunked outputs, NOT final bytes or additive gzip allocation"
          : "minified raw bytes in loaded outputs, NOT additive gzip package allocation",
        modules,
      },
      results,
      functionality,
    };
    await writeFile(path.join(dir, "raw.json.gz"), gzipSync(JSON.stringify(report), { level: 9 }));
    await writeFile(
      path.join(dir, "report.json"),
      JSON.stringify(
        {
          ...report,
          results: results.map(({ requests, ...result }) => ({ ...result, rawRequestCount: requests.length })),
          moduleAttribution: {
            ...report.moduleAttribution,
            modules: Object.fromEntries(
              Object.entries(modules)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 30),
            ),
          },
        },
        null,
        2,
      ),
    );
    console.log(
      JSON.stringify(
        results.map(({ viewport, gzipBytes, errors, hydrationErrors, cls }) => ({
          viewport,
          gzipBytes,
          errors,
          hydrationErrors,
          cls,
        })),
      ),
    );
    assert.ok(
      results.every(
        (r) => r.errors.length === 0 && r.hydrationErrors.length === 0 && r.files.every((file) => file.status === 200),
      ),
      "runtime or HTTP failure",
    );
    assert.ok(
      results.every((r) => r.cls < 0.02),
      "cold CLS failed",
    );
    assert.ok(
      functionality.every((check) => check.status === "PASS"),
      "functional verification failed; see retained report",
    );
    assert.ok(
      results.every((r) => r.gzipBytes <= 120000),
      "initial JS budget failed; see retained report",
    );
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
}
