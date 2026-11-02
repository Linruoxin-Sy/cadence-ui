import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync, gzipSync } from "node:zlib";
import { summarizeLayoutShifts } from "./site-js-budget.mjs";

const site = JSON.parse(readFileSync(".cache/w3-site.json", "utf8"));
const bundles = JSON.parse(readFileSync(".cache/w3-bundles/report.json", "utf8"));
assert.equal(site.reports.length, 138, "69 HTML routes × two viewports required");
assert.equal(new Set(site.reports.map((entry) => `${entry.viewport.width}:${entry.route}`)).size, 138);
assert.equal(bundles.components.length, 58);
for (const entry of site.reports) assert.equal(entry.cls, summarizeLayoutShifts(entry.layout.shifts));
function archive(from, to) {
  const bytes = readFileSync(from);
  const compressed = gzipSync(bytes, { level: 9 });
  assert.deepEqual(gunzipSync(compressed), bytes);
  writeFileSync(to, compressed);
  return {
    file: to,
    bytes: bytes.length,
    gzip: compressed.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}
const rootScripts = site.reports[0].roots.map((root) => ({
  ...root,
  gzip: site.reports[0].files.find((file) => new URL(file.url).pathname === `/_next/${root.file}`).gzip,
}));
const summary = {
  source: site.source,
  buildId: site.buildId,
  date: "2026-11-02",
  protocol: site.protocol,
  clsScope: site.clsScope,
  raw: [
    archive(".cache/w3-site.json", "docs/evidence/w3-site.json.gz"),
    archive(".cache/w3-bundles/report.json", "docs/evidence/w3-bundles.json.gz"),
  ],
  roots: { files: rootScripts, gzip: rootScripts.reduce((sum, file) => sum + file.gzip, 0) },
  site: site.reports.map(({ route, viewport, gzipBytes, cls, jsPassed, clsPassed, errors, files, browser }) => ({
    route,
    viewport,
    gzipBytes,
    scripts: files.length,
    cls,
    jsPassed,
    clsPassed,
    errors,
    browser,
  })),
  excludedRoutes: site.excludedRoutes,
  motion: bundles.motion.map(({ name, files, gzip }) => ({ name, files, gzip, passed: gzip <= 48000 })),
  componentProtocol: bundles.componentProtocol,
  components: bundles.components.map(({ id, gzip, passed, localOnly }) => ({
    id,
    gzip,
    passed,
    localOnlyGzip: localOnly.reduce((sum, file) => sum + file.gzip, 0),
  })),
  mobileFPS: {
    status: "unproven",
    discovery:
      "adb devices -l returned no devices; no physical device model/OS/GPU/trace supplied; desktop emulation is not evidence",
  },
};
writeFileSync("docs/evidence/w3-performance.json", `${JSON.stringify(summary, null, 2)}\n`);
console.log(
  JSON.stringify({
    pages: summary.site.length,
    jsPasses: summary.site.filter((entry) => entry.jsPassed).length,
    clsPasses: summary.site.filter((entry) => entry.clsPassed).length,
    maxCLS: Math.max(...summary.site.map((entry) => entry.cls)),
    roots: summary.roots.gzip,
  }),
);
