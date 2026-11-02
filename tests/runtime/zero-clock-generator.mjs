import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { spring } from "motion";

const sourceText = JSON.parse(readFileSync("docs/evidence/zero-clock-generator-negative.json", "utf8")).sourceText;
const { transitionFor } = await import(
  `data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(sourceText)).toString("base64")}`
);
const sourceSha256 = createHash("sha256").update(sourceText).digest("hex");
const reports = [];
for (const recipe of ["geometry.resize", "layout.shared", "handoff", "state.morph", "feedback.press"])
  for (const timeScale of [1, 0]) {
    const transition = transitionFor(recipe, "full", { timeScale });
    const generator = spring({ keyframes: [0, 1], ...transition });
    reports.push({
      recipe,
      timeScale,
      transition,
      frames: [0, 16, 160, 1000].map((t) => ({ t, ...generator.next(t) })),
    });
  }

writeFileSync(
  "docs/evidence/zero-clock-generator-negative.json",
  JSON.stringify(
    { sourceText, sourceSha256, reports },
    (_, v) => (typeof v === "number" && !Number.isFinite(v) ? String(v) : v),
    2,
  ) + "\n",
);
console.log({ sourceSha256, cases: reports.length });
