import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync, gzipSync } from "node:zlib";

const input = process.argv[2];
const output = process.argv[3] || "docs/evidence/basic-controls-runtime.json";
assert.ok(input, "pass the controls.mjs raw JSON output");
const raw = readFileSync(input);
const report = JSON.parse(raw);
assert.equal(report.failures.length, 0);
assert.equal(report.cases.length, 6);
const gzip = gzipSync(raw, { level: 6 });
assert.ok(gunzipSync(gzip).equals(raw));
const rawPath = `${output}.gz`;
writeFileSync(rawPath, gzip);
writeFileSync(
  output,
  `${JSON.stringify(
    {
      source: report.source,
      sourceHashes: report.sourceHashes,
      fixture: report.fixture,
      checks: report.checks,
      failures: report.failures,
      raw: {
        path: rawPath,
        bytes: raw.length,
        gzipBytes: gzip.length,
        sha256: createHash("sha256").update(raw).digest("hex"),
        encoding: "gzip, exact original UTF8 JSON; no samples discarded",
      },
      cases: report.cases.map((c) => ({
        os: c.os,
        mode: c.mode,
        errors: c.errors,
        steps: c.steps.map((s) => ({
          name: s.name,
          frames: s.frames.length,
          earliest: s.frames.slice(0, 3).map((f) => f.phase),
        })),
        observers: c.observers,
        cleanup: c.cleanup,
      })),
    },
    null,
    2,
  )}\n`,
);
console.log(`${report.checks} checks; ${raw.length} raw bytes preserved in ${gzip.length} gzip bytes`);
