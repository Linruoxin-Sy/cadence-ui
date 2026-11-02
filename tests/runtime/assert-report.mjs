import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

export function assertReport(reports) {
  const failures = [];
  let checks = 0;
  const check = (name, run) => {
    checks++;
    try {
      run();
    } catch (error) {
      failures.push({ name, message: error.message });
    }
  };
  for (const report of reports) {
    if (report.blockReduced)
      for (const phase of ["paint1", "paint2"])
        check(`${report.os} ${phase} CodeBlock reduced glyph geometry`, () => {
          const parts = report.blockReduced.find((f) => f.phase === phase)?.parts;
          assert.ok(parts);
          const copy = parts.findIndex((p) => p.slot === "code-block-copy-button");
          for (const p of parts.slice(copy + 1, copy + 3)) assert.equal(p.transform, "none");
        });
    if (report.slider)
      check("held disabled Slider", () => {
        assert.notEqual(report.slider.before.transform, "none");
        assert.equal(report.slider.after.transform, "none");
      });
    const prefix = report.os;
    if (report.select) {
      for (const phase of ["paint1", "paint2"]) {
        const reduced = report.downgrade.find((f) => f.phase === phase);
        check(`${prefix} ${phase} reduced geometry`, () => {
          assert.ok(reduced);
          assert.equal(reduced.parts.length >= 11, true);
          for (const p of reduced.parts.slice(0, 4)) assert.equal(p.transform, "none");
        });
        const none = report.none.find((f) => f.phase === phase);
        check(`${prefix} ${phase} none controls and entrance`, () => {
          assert.ok(none);
          assert.deepEqual(
            none.parts.slice(0, 4).map((p) => p.opacity),
            ["0", "0", "1", "1"],
          );
          for (const p of none.parts.slice(0, 11)) {
            assert.equal(p.transform, "none");
            assert.equal(p.animations.length, 0);
            if (["Article", "Section", "Div"].includes(p.text)) {
              assert.equal(p.opacity, "1");
              assert.equal(p.filter, "none");
              assert.equal(p.clip, "none");
            }
          }
        });
      }
      check(`${prefix} recipe actually plays`, () => {
        const frames = report.select.filter((f) => f.phase !== "commit");
        assert.equal(frames.length, 2);
        assert.ok(frames.some((f) => Number(f.parts[3].opacity) < 1));
        if (prefix === "no-preference") assert.ok(frames.some((f) => f.parts[0].transform !== "none"));
      });
    }
    if (report.name)
      check(`held disabled ${report.name}`, () => {
        assert.notEqual(report.before, "none");
        assert.equal(report.after, "none");
        for (const f of report.disabled.filter((f) => f.phase !== "commit")) {
          const index = { Press: 4, "Focusable press": 5, Toggle: 6, Group: 7 }[report.name];
          assert.equal(f.parts[index].transform, "none");
        }
      });
    if (report.blockNone)
      for (const phase of ["paint1", "paint2"])
        check(`${prefix} ${phase} CodeBlock same-target cancellation`, () => {
          const parts = report.blockNone.find((f) => f.phase === phase)?.parts;
          assert.ok(parts);
          const actions = parts.find((p) => p.slot === "code-block-actions");
          assert.equal(actions.opacity, "1");
          assert.equal(actions.animations.length, 0);
          const copy = parts.findIndex((p) => p.slot === "code-block-copy-button");
          assert.deepEqual(
            parts.slice(copy + 1, copy + 3).map((p) => p.opacity),
            ["0", "1"],
          );
          for (const p of parts.slice(copy + 1, copy + 3)) {
            assert.equal(p.transform, "none");
            assert.equal(p.animations.length, 0);
          }
          assert.equal(parts.at(-1).transform, "matrix(-1, 0, 0, -1, 0, 0)");
        });
  }
  return { checks, failures };
}
if (process.argv[2]) {
  const result = assertReport(JSON.parse(readFileSync(process.argv[2], "utf8")));
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.failures.length ? 1 : 0;
}
