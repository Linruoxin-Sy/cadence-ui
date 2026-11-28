#!/usr/bin/env node
/**
 * ADR-026 performance acceptance: read the raw evidence and decide every budget.
 *
 * The collectors measure and write; they do not decide. This script is the only place
 * where the ADR-026 table is applied to a sweep, so a verdict can be recomputed from
 * the same raw files without re-running a 15-minute browser sweep:
 *
 *   node scripts/measure-routes.mjs page   --base http://127.0.0.1:3100 --width 1280 --out .cache/f03
 *   node scripts/measure-routes.mjs page   --base http://127.0.0.1:3100 --width 390  --out .cache/f03
 *   node scripts/measure-routes.mjs frames --base http://127.0.0.1:3100 --width 1280 --out .cache/f03
 *   node scripts/measure-routes.mjs frames --base http://127.0.0.1:3100 --width 390  --out .cache/f03
 *   node scripts/audit-w3-bundles.mjs .cache/f03/audits/w3
 *   node scripts/accept-performance.mjs .cache/f03
 *
 * Three states, never two: a metric is pass, fail, or unmeasured with a reason. An
 * invalid measurement — a failed request, a partial sweep, an entity without a body
 * hash — is a correctness failure under every class, including monitored and retired,
 * so it is reported as a failure rather than as "no result" (ADR-026).
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { assessBudget, PERFORMANCE_BUDGETS, PERFORMANCE_POLICY } from "./performance-policy.mjs";

const root = process.cwd();
const dir = path.resolve(process.argv[2] ?? ".cache/f03");
const readJson = (file) =>
  readFile(path.join(dir, file), "utf8")
    .then(JSON.parse)
    .catch(() => null);

const registry = JSON.parse(await readFile(path.join(root, "registry.json"), "utf8"));
const ids = registry.items.filter((item) => item.meta?.tier).map((item) => item.name);
const docs = (await readdir(path.join(root, "content/docs"))).filter((file) => file.endsWith(".mdx"));
const expectedRoutes = ids.length + 2 + docs.length;
const interactiveIds = ["accordion", "tabs", "select", "dialog", "animated-text", "reveal", "data-table"];

/** @typedef {{metric: string, status: "pass"|"fail"|"unmeasured"|"reported", actual: number|string|null, reference: number|string|null, detail: string}} Verdict */

/** Validity first: a report that did not capture what it claims cannot be compared. */
function validatePage(report, width) {
  const problems = [];
  if (!report) return { problems: [`page-${width}.json is missing`], rows: [] };
  const rows = report.rows ?? [];
  if (report.routes !== rows.length)
    problems.push(`page-${width}: declared ${report.routes} routes, wrote ${rows.length}`);
  if (rows.length !== expectedRoutes)
    problems.push(
      `page-${width}: swept ${rows.length} of ${expectedRoutes} routes; a partial sweep cannot certify a budget`,
    );
  if (!report.build?.buildId) problems.push(`page-${width}: no BUILD_ID in the report`);
  if (!report.build?.manifests?.length) problems.push(`page-${width}: no root build manifest recorded`);
  for (const row of rows) {
    const where = `page-${width} ${row.route}`;
    if (!Number.isFinite(row.jsGzip) || row.jsGzip <= 0) problems.push(`${where}: invalid JS total`);
    if (!Number.isFinite(row.coldCls) || row.coldCls < 0) problems.push(`${where}: invalid cold CLS`);
    if (row.errors?.length) problems.push(`${where}: ${row.errors.length} collection error(s): ${row.errors[0]}`);
    if (row.consoleErrors?.length) problems.push(`${where}: instrumentation error: ${row.consoleErrors[0]}`);
    if (row.httpErrors?.length) problems.push(`${where}: HTTP ${row.httpErrors[0].status} ${row.httpErrors[0].url}`);
    if (row.missingResponses) problems.push(`${where}: ${row.missingResponses} script(s) without a captured body`);
    const files = row.jsFiles ?? [];
    if (files.length !== row.scripts)
      problems.push(`${where}: ${files.length} entities described, ${row.scripts} measured`);
    const described = files.reduce((sum, file) => sum + file.gzip, 0);
    if (described !== row.jsGzip) problems.push(`${where}: entity gzip sums to ${described}, total is ${row.jsGzip}`);
    for (const file of files) {
      // Current-source binding: an entity with no body hash cannot be tied to this build.
      if (!/^[0-9a-f]{64}$/.test(file.sha256 ?? "")) problems.push(`${where}: ${file.path} has no body hash`);
      if (!(file.status >= 200 && file.status < 400)) problems.push(`${where}: ${file.path} returned ${file.status}`);
      if (!file.initiator?.type) problems.push(`${where}: ${file.path} has no initiator`);
    }
    if (row.kind === "component" && !Number.isFinite(row.routeRemainderGzip))
      problems.push(`${where}: no route remainder`);
  }
  return { problems, rows };
}

function validateFrames(report, width) {
  const problems = [];
  if (!report) return { problems: [`frames-${width}.json is missing`], rows: [] };
  const rows = report.rows ?? [];
  const missing = interactiveIds.filter((id) => !rows.some((row) => row.id === id));
  if (missing.length) problems.push(`frames-${width}: no window for ${missing.join(", ")}`);
  for (const row of rows) {
    const where = `frames-${width} ${row.id}`;
    if (row.interaction === "scripted (failed)") problems.push(`${where}: the scripted interaction failed`);
    if (row.errors?.length) problems.push(`${where}: ${row.errors[0]}`);
    if (!Number.isFinite(row.frames) || row.frames < 30) problems.push(`${where}: ${row.frames} frames in the window`);
    if (!Number.isFinite(row.interactionCls)) problems.push(`${where}: invalid interaction CLS`);
    if (!Number.isFinite(row.longestAnimationFrameMs)) problems.push(`${where}: no long-animation-frame figure`);
    if (!Number.isFinite(row.display?.refreshRateHz)) problems.push(`${where}: no display refresh rate`);
  }
  return { problems, rows };
}

const page1280 = await readJson("page-1280.json");
const page390 = await readJson("page-390.json");
const frames1280 = await readJson("frames-1280.json");
const frames390 = await readJson("frames-390.json");
const audit = await readJson("audits/w3/report.json");
const interactionSuite = await readJson("interaction-cls.json");

const pageChecks = [validatePage(page1280, 1280), validatePage(page390, 390)];
const frameChecks = [validateFrames(frames1280, 1280), validateFrames(frames390, 390)];
const pageRows = pageChecks.flatMap((check) => check.rows);
const frameRows = frameChecks.flatMap((check) => check.rows);
const pageProblems = pageChecks.flatMap((check) => check.problems);
const frameProblems = frameChecks.flatMap((check) => check.problems);
const problems = [...pageProblems, ...frameProblems];

const auditProblem = !audit
  ? "audits/w3/report.json is missing"
  : audit.components?.length !== ids.length
    ? `audit covered ${audit.components?.length} of ${ids.length} ids`
    : null;
if (auditProblem) problems.push(auditProblem);

/** @type {Verdict[]} */
const verdicts = [];
/** @type {Verdict[]} */
const observations = [];
const add = (metric, status, actual, reference, detail) => {
  verdicts.push({ metric, status, actual, reference, detail });
  return verdicts.at(-1);
};
const unmeasured = (metric, reason) => add(metric, "unmeasured", null, null, reason);
// An invalid input cannot produce a pass under any class: the number may be recorded,
// but the verdict it would have carried is withdrawn (ADR-026).
const guarded = (sourceProblems, metric, passed, actual, reference, detail) =>
  sourceProblems.length
    ? add(metric, "fail", actual, reference, `invalid measurement, so no verdict: ${sourceProblems[0]}`)
    : add(metric, passed ? "pass" : "fail", actual, reference, detail);

// ADR-026 is the reference for every number below; nothing here restates a limit.
const limit = (id) => PERFORMANCE_BUDGETS[id].limit;

if (audit?.components?.length === ids.length) {
  const worstLocal = audit.components.reduce((max, item) => (item.localGzip > max.localGzip ? item : max));
  guarded(
    auditProblem ? [auditProblem] : [],
    "component-local-code",
    assessBudget("component-local-code", worstLocal.localGzip).comparisonPassed,
    worstLocal.localGzip,
    limit("component-local-code"),
    `worst id ${worstLocal.id} of ${audit.components.length}; ${audit.components.filter((item) => item.localGzip <= limit("component-local-code")).length}/${audit.components.length} within`,
  );

  const ratchet = audit.limits?.additionRatchet ?? {};
  const tolerance = audit.limits?.additionTolerance ?? PERFORMANCE_BUDGETS["component-addition"].ratchetTolerance;
  const against = (item) =>
    ratchet[item.id] === undefined ? PERFORMANCE_BUDGETS["component-addition"].limit : ratchet[item.id] + tolerance;
  const additions = audit.components.map((item) => ({ id: item.id, gzip: item.gzip, reference: against(item) }));
  const grown = additions.filter((item) => item.gzip > item.reference);
  const worstRatio = [...additions].sort((a, b) => b.gzip / b.reference - a.gzip / a.reference)[0];
  guarded(
    auditProblem ? [auditProblem] : [],
    "component-addition",
    !grown.length,
    Math.round(worstRatio.gzip),
    worstRatio.reference,
    grown.length
      ? `${grown.length} id(s) over the ratchet: ${grown.map((item) => `${item.id} ${item.gzip}>${item.reference}`).join(", ")}`
      : `all ${additions.length} ids within their recorded value + ${tolerance} B; largest ${worstRatio.id} ${worstRatio.gzip} B (${Math.round((worstRatio.gzip / worstRatio.reference) * 100)}% of its reference)`,
  );

  const shipped = audit.motion?.find((entry) => entry.name === "actual-api-union");
  if (!shipped) unmeasured("motion-union", "the audit has no shipped-union compilation");
  else
    guarded(
      auditProblem ? [auditProblem] : [],
      "motion-union",
      assessBudget("motion-union", shipped.gzip).comparisonPassed,
      shipped.gzip,
      limit("motion-union"),
      `shipped union; site union ${audit.motion.find((entry) => entry.name === "registry-and-site-api-union")?.gzip ?? "n/a"} B, domMax candidate ${audit.motion.find((entry) => entry.name === "public-m-domMax-candidate")?.gzip ?? "n/a"} B`,
    );
} else {
  for (const metric of ["component-local-code", "component-addition", "motion-union"])
    unmeasured(metric, "the consumer-graph audit did not complete");
}

if (pageRows.length) {
  const worstCold = pageRows.reduce((max, row) => (row.coldCls > max.coldCls ? row : max));
  const coldCounts = pageRows.map((row) => row.coldCls).filter((value) => value > 0).length;
  const frameInteraction = frameRows.length
    ? frameRows.reduce((max, row) => (row.interactionCls > max.interactionCls ? row : max))
    : null;
  const e2eGreen = interactionSuite ? interactionSuite.stats?.unexpected === 0 : null;
  const clsActual = Math.max(worstCold.coldCls, frameInteraction?.interactionCls ?? 0);
  const clsPass = assessBudget("cls", clsActual).comparisonPassed && e2eGreen !== false;
  guarded(
    pageProblems,
    "cls",
    clsPass,
    Number(clsActual.toFixed(5)),
    limit("cls"),
    `cold max ${worstCold.coldCls.toFixed(5)} (${worstCold.route} ${worstCold.kind}, ${worstCold.viewport ?? ""}); ${pageRows.length - coldCounts}/${pageRows.length} cold windows with no shift; interaction max ${frameInteraction ? `${frameInteraction.interactionCls.toFixed(5)} (${frameInteraction.id})` : "unmeasured"}; interaction suites ${e2eGreen === null ? "unmeasured" : e2eGreen ? "green" : "red"}`,
  );

  const worstTotal = pageRows.reduce((max, row) => (row.jsGzip > max.jsGzip ? row : max));
  guarded(
    pageProblems,
    "page-total",
    assessBudget("page-total", worstTotal.jsGzip).comparisonPassed,
    worstTotal.jsGzip,
    limit("page-total"),
    `worst route ${worstTotal.route} at ${worstTotal.viewport ?? ""}; ${pageRows.filter((row) => row.jsGzip > limit("page-total")).length} of ${pageRows.length} route-viewport cells over the ceiling`,
  );

  const componentRows = pageRows.filter((row) => row.kind === "component");
  const remainders = componentRows.map((row) => ({
    route: row.route,
    viewport: row.viewport,
    gzip: row.routeRemainderGzip,
  }));
  const over = remainders.filter((row) => row.gzip > limit("route-remainder")).sort((a, b) => b.gzip - a.gzip);
  const worstRemainder = remainders.reduce((max, row) => (row.gzip > max.gzip ? row : max));
  guarded(
    pageProblems,
    "route-remainder",
    !over.length,
    worstRemainder.gzip,
    limit("route-remainder"),
    over.length
      ? `${over.length} route-viewport cell(s) dispositioned in ADR-027: ${over
          .map((row) => `${row.route}@${row.viewport} ${row.gzip}`)
          .join(", ")}`
      : `no component route-viewport cell over the bar; worst ${worstRemainder.route}@${worstRemainder.viewport}`,
  );
} else {
  for (const metric of ["cls", "page-total", "route-remainder"]) unmeasured(metric, "no page sweep was captured");
}

if (frameRows.length) {
  const worstShare = frameRows
    .map((row) => ({ row, share: (row.frames > 1 ? row.longFramesOver25ms / (row.frames - 1) : 0) * 100 }))
    .reduce((max, item) => (item.share > max.share ? item : max), { share: -1, row: null });
  guarded(
    frameProblems,
    "frame-share",
    assessBudget("frame-share", worstShare.share / 100).comparisonPassed,
    Number(worstShare.share.toFixed(2)),
    limit("frame-share") * 100,
    `worst window ${worstShare.row.id}@${worstShare.row.viewport}: ${worstShare.row.longFramesOver25ms}/${worstShare.row.frames - 1} intervals over 25 ms, ${worstShare.row.display?.refreshRateHz ?? "?"} Hz`,
  );
  const worstBlock = frameRows.reduce((max, row) =>
    row.longestAnimationFrameMs > max.longestAnimationFrameMs ? row : max,
  );
  guarded(
    frameProblems,
    "frame-block",
    assessBudget("frame-block", worstBlock.longestAnimationFrameMs).comparisonPassed,
    worstBlock.longestAnimationFrameMs,
    limit("frame-block"),
    `worst window ${worstBlock.id}@${worstBlock.viewport}; ${frameRows.length} windows`,
  );
} else {
  for (const metric of ["frame-share", "frame-block"]) unmeasured(metric, "no frame window was captured");
}

// ADR-026 retires the tier ladder as a budget but keeps the per-item figure on the record.
observations.push({
  metric: "tier-source",
  status: "reported",
  actual: null,
  reference: null,
  detail:
    "retired by ADR-026: no comparison exists, so no verdict is possible; the per-item figure is reported by `pnpm registry:check`, not by this sweep",
});

// The device criterion is a separate line in ADR-026 with no collector in this repository.
const device = await readJson("device-frames.json");
add(
  "device-frames",
  device ? "pass" : "unmeasured",
  device?.medianFps ?? null,
  "≥ 55 fps",
  device
    ? `${device.device}; presented-frame timestamps from ${device.source}`
    : "no mid-range Android device was available to this run: ADR-026 requires presented-frame timestamps from a real 2023–2024 60 Hz phone, and desktop rAF cadence is the proxy, not a substitute",
);

const hardGateFailures = verdicts.filter(
  (verdict) => verdict.status === "fail" && PERFORMANCE_BUDGETS[verdict.metric]?.class === "hard-gate",
);
const monitoredBreaches = verdicts.filter(
  (verdict) => verdict.status === "fail" && PERFORMANCE_BUDGETS[verdict.metric]?.class === "monitored",
);
const unmeasuredVerdicts = verdicts.filter((verdict) => verdict.status === "unmeasured");
const acceptance = {
  decided: !problems.length && !hardGateFailures.length && !monitoredBreaches.length && !unmeasuredVerdicts.length,
  reasons: [
    ...problems.map((problem) => `invalid measurement: ${problem}`),
    ...hardGateFailures.map(
      (verdict) => `hard gate failed: ${verdict.metric} at ${verdict.actual} against ${verdict.reference}`,
    ),
    ...monitoredBreaches.map(
      (verdict) =>
        `monitored metric over its limit: ${verdict.metric} at ${verdict.actual} against ${verdict.reference}`,
    ),
    ...unmeasuredVerdicts.map((verdict) => `unmeasured: ${verdict.metric} — ${verdict.detail}`),
  ],
};

const result = {
  performancePolicy: PERFORMANCE_POLICY,
  directory: path.relative(root, dir).replaceAll("\\", "/"),
  sourceCommit: page1280?.environment?.commit ?? null,
  buildId: page1280?.environment?.buildId ?? null,
  environment: page1280?.environment ?? null,
  expectedRoutes,
  configs: {
    registries: ids.length,
    pageRoutes: pageRows.length,
    frameWindows: frameRows.length,
    interactionSuite: interactionSuite
      ? {
          expected: interactionSuite.stats?.expected,
          unexpected: interactionSuite.stats?.unexpected,
          flaky: interactionSuite.stats?.flaky,
        }
      : null,
  },
  validity: { valid: problems.length === 0, problems },
  verdicts,
  observations,
  acceptance,
};
await writeFile(path.join(dir, "acceptance.json"), `${JSON.stringify(result, null, 2)}\n`);

const label = (verdict) =>
  verdict.status === "fail" && PERFORMANCE_BUDGETS[verdict.metric]
    ? `${verdict.status} (${PERFORMANCE_BUDGETS[verdict.metric].class})`
    : verdict.status;
console.log(`F03 acceptance · ${result.directory} · commit ${result.sourceCommit} · build ${result.buildId}`);
console.log(
  `routes per sweep ${page1280?.rows?.length ?? 0}/${expectedRoutes} and ${page390?.rows?.length ?? 0}/${expectedRoutes} · frame windows ${frameRows.length}\n`,
);
console.log("| budget | class | actual | reference | verdict |");
console.log("| --- | --- | --- | --- | --- |");
for (const verdict of verdicts) {
  const budget = PERFORMANCE_BUDGETS[verdict.metric];
  console.log(
    `| \`${verdict.metric}\` | ${budget?.class ?? "device criterion"} | ${verdict.actual ?? "—"} | ${verdict.reference ?? "—"} | ${label(verdict)} |`,
  );
}
for (const observation of observations)
  console.log(`| \`${observation.metric}\` | retired | — | — | ${observation.status} (no comparison) |`);
console.log("\n## Detail\n");
for (const verdict of verdicts) console.log(`- **${verdict.metric}** ${verdict.status}: ${verdict.detail}`);
if (observations.length)
  for (const observation of observations)
    console.log(`- **${observation.metric}** ${observation.status}: ${observation.detail}`);
console.log(`\nAcceptance: ${acceptance.decided ? "MET" : "NOT MET"}`);
for (const reason of acceptance.reasons) console.log(`  - ${reason}`);

// A hard gate or an invalid measurement fails the run that produced it (ADR-026);
// a monitored breach is reported and tracked, so it does not.
if (hardGateFailures.length || problems.length) process.exitCode = 1;
