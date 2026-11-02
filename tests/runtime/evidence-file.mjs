import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
export function readEvidence(file) {
  const index = JSON.parse(readFileSync(file, "utf8"));
  if (!index.raw?.path) return index;
  const raw = gunzipSync(readFileSync(index.raw.path));
  assert.equal(createHash("sha256").update(raw).digest("hex"), index.raw.sha256);
  return JSON.parse(raw);
}
if (process.argv[1]?.replaceAll("\\", "/").endsWith("/evidence-file.mjs")) {
  for (const file of process.argv.slice(2)) {
    const raw = readFileSync(file);
    const report = JSON.parse(raw);
    if (report.raw?.path) continue;
    const compressed = gzipSync(raw, { level: 6 });
    assert(gunzipSync(compressed).equals(raw));
    const archive = `${file}.gz`;
    writeFileSync(archive, compressed);
    assert(gunzipSync(readFileSync(archive)).equals(raw));
    writeFileSync(
      `${file}.index`,
      `${JSON.stringify(
        {
          sourceHashes: Object.fromEntries(
            Object.entries(report.sources || {}).map(([id, source]) => [id, source.sha256]),
          ),
          cases: report.cases?.length || 0,
          failures: report.failures || [],
          errors: report.errors || [],
          raw: {
            path: path.relative(process.cwd(), archive).replaceAll("\\", "/"),
            bytes: raw.length,
            gzipBytes: compressed.length,
            sha256: createHash("sha256").update(raw).digest("hex"),
            encoding: "gzip; exact original UTF8 JSON, all samples and source text retained",
          },
        },
        null,
        2,
      )}\n`,
    );
    console.log(`${file}: verified ${raw.length} bytes`);
  }
}
