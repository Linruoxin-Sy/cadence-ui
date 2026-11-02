import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { INITIAL_JS_LIMIT, summarizeLayoutShifts, summarizeScripts } from "../../scripts/site-js-budget.mjs";

describe("initial script accounting", () => {
  it("uses the largest CLS session, excluding recent input and splitting at one-second gaps", () => {
    expect(
      summarizeLayoutShifts([
        { startTime: 1200, value: 0.01 },
        { startTime: 1500, value: 0.015 },
        { startTime: 1600, value: 0.9, hadRecentInput: true },
        { startTime: 2500, value: 0.02 },
      ]),
    ).toBe(0.025);
    expect(
      summarizeLayoutShifts(Array.from({ length: 8 }, (_, index) => ({ startTime: 900 + index * 800, value: 0.01 }))),
    ).toBeCloseTo(0.07);
  });
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
