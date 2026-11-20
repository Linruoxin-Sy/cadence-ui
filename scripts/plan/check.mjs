#!/usr/bin/env node
/**
 * Checks the plan a pull request declares, not the diff it carries.
 *
 * A pull request must:
 *   - contain exactly one `Closes #<n>` in its body;
 *   - close an issue carrying the `task` label;
 *   - close an issue currently `status:claimed` or `status:in-review`;
 *   - close an issue whose `Blocked by` section names no open issue.
 *
 * The script is read-only: it edits no issue, label or file. The workflow hands
 * it the built-in `GITHUB_TOKEN`, so a pull request from a fork is checked with
 * the same rules as one from a branch in this repository.
 *
 * Usage:
 *   node scripts/plan/check.mjs                     # CI: reads GITHUB_EVENT_PATH
 *   node scripts/plan/check.mjs --self-test         # fixtures, no network
 *   node scripts/plan/check.mjs --body-file body.md --repo owner/name
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ACCEPTED_STATUS = ["status:claimed", "status:in-review"];

/**
 * Returns the issue numbers named by `Closes #<n>` in a pull request body and
 * whether there is exactly one. `fixes` and `resolves` are deliberately not
 * accepted: one keyword keeps the link machine-readable and the status sync
 * deterministic.
 */
export function parseClosingIssue(body) {
  const matches = [...String(body ?? "").matchAll(/\bcloses\s+#(\d+)\b/gi)];
  const found = matches.map((match) => Number(match[1]));
  if (found.length === 1) return { ok: true, number: found[0], found, problem: null };
  const detail =
    found.length === 0 ? "found 0" : `found ${found.length} (${found.map((number) => `#${number}`).join(", ")})`;
  return {
    ok: false,
    number: null,
    found,
    problem: `PR body must contain exactly one "Closes #<n>"; ${detail}.`,
  };
}

/**
 * Returns the issue numbers a `Blocked by` section references, from `#<n>` and
 * from `.../issues/<n>` links. Names without a number (`G01-pilots — complete`)
 * cannot be resolved through the API and are left to the reader.
 */
export function parseBlockedBy(body) {
  const lines = String(body ?? "").split(/\r?\n/);
  const start = lines.findIndex(
    (line) =>
      /^#{1,6}\s*blocked\s*by\b/i.test(line) || /^\*\*blocked\s*by\*\*/i.test(line) || /^blocked\s*by\s*:/i.test(line),
  );
  if (start === -1) return [];

  const section = [];
  for (let index = start; index < lines.length; index += 1) {
    const line = lines[index];
    if (index > start && (/^#{1,6}\s/.test(line) || /^\*\*[^*]+\*\*\s*$/.test(line))) break;
    section.push(line);
  }

  const text = section.join("\n");
  const numbers = new Set();
  for (const match of text.matchAll(/#(\d+)\b/g)) numbers.add(Number(match[1]));
  for (const match of text.matchAll(/\/issues\/(\d+)\b/g)) numbers.add(Number(match[1]));
  return [...numbers];
}

function labelNames(labels = []) {
  return labels.map((label) => (typeof label === "string" ? label : label?.name)).filter(Boolean);
}

function formatList(items) {
  return items.length ? items.join(", ") : "no labels";
}

/**
 * Pure rule evaluation. `issue` is the REST issue object (or a fixture with the
 * same `number`, `labels` and `body`); `dependencies` holds `{ number, state }`
 * for every `Blocked by` reference, with `state: "missing"` for a number the
 * repository does not have.
 */
export function evaluatePlan({ body, issue, dependencies = [] }) {
  const problems = [];
  const closing = parseClosingIssue(body);
  if (!closing.ok) {
    problems.push(closing.problem);
    return problems;
  }
  if (!issue) {
    problems.push(`Issue #${closing.number} could not be read, so its labels and dependencies cannot be checked.`);
    return problems;
  }

  const number = issue.number;
  const labels = labelNames(issue.labels);

  if (!labels.includes("task")) {
    problems.push(
      `Issue #${number} must carry the "task" label; it has ${formatList(labels)}. Add it with "gh issue edit ${number} --add-label task".`,
    );
  }

  const statuses = labels.filter((label) => label.startsWith("status:"));
  if (statuses.length !== 1) {
    problems.push(
      `Issue #${number} must carry exactly one status label; it has ${statuses.length ? formatList(statuses) : "none"}. Set status:claimed with "gh issue edit ${number} --add-label status:claimed".`,
    );
  } else if (!ACCEPTED_STATUS.includes(statuses[0])) {
    problems.push(
      `Issue #${number} must be status:claimed or status:in-review before a pull request; it is ${statuses[0]}. Claim it with "gh issue edit ${number} --remove-label ${statuses[0]} --add-label status:claimed --add-assignee @me".`,
    );
  }

  for (const dependency of dependencies) {
    if (dependency.number === number) continue;
    if (dependency.state === "missing") {
      problems.push(
        `Issue #${number} is blocked by #${dependency.number}, which does not exist in this repository. Use a live issue number in "Blocked by".`,
      );
    } else if (dependency.state !== "closed") {
      problems.push(
        `Issue #${number} is blocked by #${dependency.number}, which is still ${dependency.state}. Finish or close #${dependency.number} before this pull request.`,
      );
    }
  }

  return problems;
}

const apiBase = () => process.env.GITHUB_API_URL ?? "https://api.github.com";

async function github(pathname, token) {
  const response = await fetch(`${apiBase()}${pathname}`, {
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "user-agent": "cadence-plan-check",
      "x-github-api-version": "2022-11-28",
    },
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300).replaceAll("\n", " ");
    throw new Error(`GET ${pathname} returned ${response.status}: ${detail}`);
  }
  return response.json();
}

async function readContext(args) {
  const bodyFile = value(args, "body-file");
  if (bodyFile) {
    const repository = value(args, "repo") ?? process.env.GITHUB_REPOSITORY;
    if (!repository) throw new Error("pass --repo owner/name with --body-file");
    return { body: await readFile(path.resolve(bodyFile), "utf8"), repository, number: null };
  }

  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) throw new Error("GITHUB_EVENT_PATH is not set; pass --body-file and --repo for a local run");
  const event = JSON.parse(await readFile(eventPath, "utf8"));
  const pullRequest = event.pull_request;
  if (!pullRequest) return null;
  return { body: pullRequest.body ?? "", repository: process.env.GITHUB_REPOSITORY, number: pullRequest.number };
}

function value(args, name) {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? undefined : args[index + 1];
}

async function run(args) {
  const context = await readContext(args);
  if (!context) {
    console.log("No pull request in this event; the plan check only runs for pull requests.");
    return 0;
  }

  const repository = context.repository;
  if (!repository) throw new Error("GITHUB_REPOSITORY is not set");
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not set; the check reads labels and issue state from the API");

  const closing = parseClosingIssue(context.body);
  if (!closing.ok) {
    console.log(`plan check failed for ${describeTarget(repository, context.number)}:`);
    console.log(`- ${closing.problem}`);
    return 1;
  }

  const issueNumber = closing.number;
  const issue = await github(`/repos/${repository}/issues/${issueNumber}`, token);
  const dependencies = [];
  if (issue) {
    for (const number of parseBlockedBy(issue.body)) {
      if (number === issueNumber) continue;
      const dependency = await github(`/repos/${repository}/issues/${number}`, token);
      dependencies.push({ number, state: dependency?.state ?? "missing" });
    }
  }

  const problems = evaluatePlan({ body: context.body, issue, dependencies });
  if (problems.length) {
    console.log(`plan check failed for ${describeTarget(repository, context.number)}:`);
    for (const problem of problems) console.log(`- ${problem}`);
    return 1;
  }

  const labels = labelNames(issue.labels).filter((label) => label.startsWith("status:"));
  console.log(
    `plan check passed: ${describeTarget(repository, context.number)} closes #${issueNumber} (${labels.join(", ")}); ${dependencies.length} blocked-by reference(s) closed.`,
  );
  return 0;
}

function describeTarget(repository, number) {
  return number ? `${repository}#${number}` : repository;
}

function selfTest() {
  const failures = [];
  let total = 0;
  const expect = (name, actual, expected) => {
    total += 1;
    if (actual !== expected)
      failures.push(`${name}\n    expected: ${JSON.stringify(expected)}\n    actual:   ${JSON.stringify(actual)}`);
  };
  const expectIncludes = (name, values, fragment) => {
    total += 1;
    if (!values.some((entry) => entry.includes(fragment))) {
      failures.push(`${name}\n    expected an entry containing: ${fragment}\n    actual: ${JSON.stringify(values)}`);
    }
  };

  const missing = parseClosingIssue("This pull request tracks the work.");
  expect("missing Closes is rejected", missing.ok, false);
  expect("missing Closes reports found 0", missing.problem, 'PR body must contain exactly one "Closes #<n>"; found 0.');

  const single = parseClosingIssue("Closes #104\n\nDetails.");
  expect("one Closes is accepted", single.ok, true);
  expect("one Closes reports its issue", single.number, 104);

  const lower = parseClosingIssue("closes #104");
  expect("the keyword is case-insensitive", lower.number, 104);

  const double = parseClosingIssue("Closes #104\nCloses #105");
  expect("two Closes are rejected", double.ok, false);
  expectIncludes("two Closes reports both", [double.problem], "found 2 (#104, #105)");

  expect(
    "Blocked by list is parsed",
    parseBlockedBy("## Blocked by\n- #82 (F01)\n- #92\n\n## Read first\n- #7").join(","),
    "82,92",
  );
  expect(
    "Blocked by links are parsed",
    parseBlockedBy("**Blocked by**\n- https://github.com/a/b/issues/82\n").join(","),
    "82",
  );
  expect("no Blocked by section parses to nothing", parseBlockedBy("## Scope\nNo dependencies.").length, 0);

  const issue = { number: 104, labels: ["motion-v2", "task", "status:claimed"], body: "## Blocked by\n- #92" };

  expect(
    "a claimed task with closed dependencies passes",
    JSON.stringify(evaluatePlan({ body: "Closes #104", issue, dependencies: [{ number: 92, state: "closed" }] })),
    "[]",
  );

  const missingTask = evaluatePlan({
    body: "Closes #104",
    issue: { ...issue, labels: ["status:claimed"] },
    dependencies: [],
  });
  expectIncludes("a missing task label is reported", missingTask, '"task" label');

  const ready = evaluatePlan({
    body: "Closes #104",
    issue: { ...issue, labels: ["task", "status:ready"] },
    dependencies: [],
  });
  expectIncludes("status:ready is reported", ready, "must be status:claimed or status:in-review");

  const claimedAndReview = evaluatePlan({
    body: "Closes #104",
    issue: { ...issue, labels: ["task", "status:claimed", "status:in-review"] },
    dependencies: [],
  });
  expectIncludes("two status labels are reported", claimedAndReview, "exactly one status label");

  const blocked = evaluatePlan({ body: "Closes #104", issue, dependencies: [{ number: 92, state: "open" }] });
  expectIncludes("an open dependency is reported", blocked, "blocked by #92, which is still open");

  const missingDependency = evaluatePlan({
    body: "Closes #104",
    issue,
    dependencies: [{ number: 91, state: "missing" }],
  });
  expectIncludes("a missing dependency is reported", missingDependency, "does not exist in this repository");

  const noIssue = evaluatePlan({ body: "Closes #104", issue: null, dependencies: [] });
  expectIncludes("an unreadable issue is reported", noIssue, "could not be read");

  for (const failure of failures) console.error(`not ok - ${failure}`);
  console.log(`${failures.length ? "failed" : "ok"} - ${failures.length} failure(s) in ${total} plan-check fixtures`);
  return failures.length === 0;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--self-test")) {
    process.exitCode = selfTest() ? 0 : 1;
    return;
  }
  try {
    process.exitCode = await run(args);
  } catch (error) {
    console.error(`plan check could not run: ${error.message}`);
    process.exitCode = 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) await main();
