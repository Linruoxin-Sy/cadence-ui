import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { expect, test } from "@playwright/test";
import { measureInitialScripts } from "../../scripts/site-js-budget.mjs";

test("Button production cold-load initial JavaScript is within 120 KB gzip", async ({ page, baseURL }, testInfo) => {
  const report = await measureInitialScripts(page, `${baseURL}/components/button`);
  const dist = process.env.CADENCE_DIST_DIR ?? ".next";
  const buildId = (await readFile(path.join(dist, "BUILD_ID"), "utf8")).trim();
  const manifest = JSON.parse(await readFile(path.join(dist, "build-manifest.json"), "utf8"));
  const roots = await Promise.all(
    manifest.rootMainFiles.map(async (file: string) => {
      const body = await readFile(path.join(dist, file));
      const gzip = gzipSync(body).length;
      const loaded = report.files.find((entry: { url: string }) => new URL(entry.url).pathname === `/_next/${file}`);
      // Verify the served root runtime against this production build.
      expect(loaded?.gzip, file).toBe(gzip);
      expect(loaded?.sha256, file).toBe(createHash("sha256").update(body).digest("hex"));
      return { file, gzip };
    }),
  );
  Object.assign(report, { buildId, roots });
  await testInfo.attach("initial-js-requests", {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  });
  expect(report.files.length).toBeGreaterThan(0);
  expect(report.files.every((file: { status: number }) => file.status === 200)).toBe(true);
  expect(report.errors).toEqual([]);
  expect(report.gzipBytes, JSON.stringify(report.files, null, 2)).toBeLessThanOrEqual(report.limit);
});
