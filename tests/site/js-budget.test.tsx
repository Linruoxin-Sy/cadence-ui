import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { INITIAL_JS_LIMIT, summarizeScripts } from "../../scripts/site-js-budget.mjs";

describe("initial script accounting", () => {
  it("deduplicates shared URLs and gzips each HTTP entity separately, including automatic chunks", () => {
    const body = Buffer.from("repeated code ".repeat(100));
    const files = ["runtime.js", "runtime.js", "automatic.js"].map((name) => ({
      url: `https://cadence.dev/${name}`,
      body,
      status: 200,
    }));
    const summary = summarizeScripts(files);
    expect(summary.files).toHaveLength(2);
    expect(summary.gzipBytes).toBe(2 * gzipSync(body).length);
    expect(summary.gzipBytes).toBeGreaterThan(gzipSync(Buffer.concat([body, body])).length);
    expect(INITIAL_JS_LIMIT).toBe(120_000);
  });
});
