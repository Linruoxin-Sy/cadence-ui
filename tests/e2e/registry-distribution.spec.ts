import { createHash } from "node:crypto";
import { mkdir, readdir, readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { registryItemSchema, registrySchema } from "shadcn/schema";

test("production /r overrides public files and serves exact conditional resources", async ({ request }, info) => {
  const evidence = [];
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  for (const name of (await readdir("public/r")).filter((name) => /^[a-z0-9-]+\.(json|md)$/.test(name))) {
    const response = await request.get(`/r/${name}`);
    expect(response.status(), name).toBe(200);
    const body = await response.body();
    expect(body.equals(await readFile(`public/r/${name}`)), name).toBe(true);
    const headers = response.headers();
    expect(
      headers["cache-control"]
        ?.split(",")
        .map((v) => v.trim())
        .sort(),
    ).toEqual(["max-age=0", "must-revalidate", "public"]);
    expect(headers.etag).toBe(`"${createHash("sha256").update(body).digest("hex")}"`);
    expect(headers["content-type"]).toContain(name.endsWith(".md") ? "text/markdown" : "application/json");
    if (name === "registry.json") registrySchema.parse(JSON.parse(body.toString()));
    else if (name === "catalog.json") {
      const catalog = JSON.parse(body.toString());
      expect(catalog).toHaveLength(registry.items.length);
      for (const entry of catalog) {
        expect((await request.get(entry.docs)).status(), entry.docs).toBe(200);
        expect((await request.get(entry.item)).status(), entry.item).toBe(200);
      }
    } else if (name.endsWith(".json")) registryItemSchema.parse(JSON.parse(body.toString()));
    evidence.push({ name, status: response.status(), headers });
  }
  for (const name of ["button.json", "button.md", "catalog.json", "registry.json"]) {
    const get = await request.get(`/r/${name}`);
    const head = await request.head(`/r/${name}`);
    expect(head.status()).toBe(200);
    expect(await head.body()).toHaveLength(0);
    expect(head.headers().etag).toBe(get.headers().etag);
    for (const condition of [get.headers().etag ?? "", `"other", W/${get.headers().etag}`, "*"]) {
      for (const method of ["GET", "HEAD"]) {
        const conditional = await request.fetch(`/r/${name}`, { method, headers: { "If-None-Match": condition } });
        expect(conditional.status()).toBe(304);
        expect(await conditional.body()).toHaveLength(0);
      }
    }
    expect((await request.get(`/r/${name}`, { headers: { "If-None-Match": '"stale"' } })).status()).toBe(200);
  }
  for (const resource of [
    "unknown.json",
    "button.tsx",
    "nested/button.json",
    "%2e%2e%5cregistry.json",
    "snapshots/invalid/button.json",
    `snapshots/${"0".repeat(64)}/button.json`,
  ]) {
    const response = await request.get(`/r/${resource}`);
    expect(response.status(), resource).toBe(404);
    expect(response.headers()["cache-control"]).toBe("no-store");
  }
  await info.attach("registry-http", { body: JSON.stringify(evidence, null, 2), contentType: "application/json" });
  const llms = await request.get("/llms.txt");
  for (const slug of ["accessibility", "registry", "ai", "changelog"]) {
    expect(await llms.text()).toContain(`/docs/${slug}`);
  }
});

test("retained snapshots serve immutable exact bytes and dependency closure", async ({ request }, info) => {
  const ids = await readdir("public/r/snapshots");
  expect(ids.length).toBeGreaterThan(0);
  const evidence = [];
  for (const id of ids) {
    const manifest = JSON.parse(await readFile(`public/r/snapshots/${id}/manifest.json`, "utf8"));
    for (const [name, hash] of Object.entries(manifest.files)) {
      const response = await request.get(`/r/snapshots/${id}/${name}`);
      expect(response.status()).toBe(200);
      expect(
        createHash("sha256")
          .update(await response.body())
          .digest("hex"),
      ).toBe(hash);
      expect(
        response
          .headers()
          ["cache-control"]?.split(",")
          .map((v) => v.trim())
          .sort(),
      ).toEqual(["immutable", "max-age=31536000", "public"]);
      expect(response.headers().etag).toBe(`"${hash}"`);
      if (name.endsWith(".json") && !["catalog.json", "registry.json"].includes(name)) {
        const item = registryItemSchema.parse(await response.json());
        for (const dep of item.registryDependencies ?? []) {
          if (dep.startsWith("@cadence/")) expect(manifest.files[`${dep.slice(9)}.json`]).toBeTruthy();
        }
      }
    }
    const url = `/r/snapshots/${id}/button.json`;
    const head = await request.head(url);
    expect(head.status()).toBe(200);
    expect((await request.get(url, { headers: { "If-None-Match": head.headers().etag ?? "" } })).status()).toBe(304);
    evidence.push({ id, count: Object.keys(manifest.files).length, head: head.headers() });
  }
  await info.attach("snapshot-http", { body: JSON.stringify(evidence, null, 2), contentType: "application/json" });
});

for (const theme of ["light", "dark"]) {
  for (const width of [1280, 390]) {
    test(`new guides render and link correctly ${theme}/${width}`, async ({ page, request }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((theme) => localStorage.setItem("cadence-theme", theme), theme);
      const checkedLinks = new Set<string>();
      for (const slug of ["accessibility", "registry", "ai", "changelog"]) {
        await page.goto(`/docs/${slug}?motion=none`);
        await page.waitForLoadState("networkidle");
        await expect(page.locator("main h1")).toBeVisible();
        expect(await page.title()).not.toBe("");
        const links = await page
          .locator("main a[href^='/']")
          .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href") ?? ""));
        for (const href of new Set(links)) {
          if (checkedLinks.has(href)) continue;
          expect((await request.get(href)).status(), href).toBe(200);
          checkedLinks.add(href);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(
          (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations,
        ).toEqual([]);
        await mkdir(".cache/distribution-guides-proof", { recursive: true });
        await page.screenshot({
          path: `.cache/distribution-guides-proof/${slug}-${theme}-${width}.png`,
          fullPage: true,
        });
      }
      await mkdir(".cache/distribution-guides-proof", { recursive: true });
      await page.screenshot({ path: `.cache/distribution-guides-proof/${theme}-${width}.png`, fullPage: true });
      await page.goto("/docs?motion=none");
      const hrefs = await page
        .locator("main .grid > a[href^='/docs/']")
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")));
      expect(hrefs).toEqual(
        ["installation", "theming", "motion", "motion-modes", "accessibility", "registry", "ai", "changelog"].map(
          (slug) => `/docs/${slug}`,
        ),
      );
    });
  }
}

test("all new guides remain readable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    for (const slug of ["accessibility", "registry", "ai", "changelog"]) {
      await page.goto(`http://127.0.0.1:${process.env.PLAYWRIGHT_PORT ?? 3100}/docs/${slug}`);
      await expect(page.locator("main h1")).toBeVisible();
      await expect(page.locator("article h2").first()).toBeVisible();
      expect(await page.locator("article").textContent()).toContain(
        slug === "changelog"
          ? "Unreleased"
          : slug === "ai"
            ? "Available context"
            : slug === "registry"
              ? "Run a local registry"
              : "Keyboard and semantics",
      );
    }
  } finally {
    await context.close();
  }
});
