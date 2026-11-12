#!/usr/bin/env node
/**
 * Finalizes one motion-v2 queue task and refreshes the rolling handoff/board.
 *
 * This script writes local working state under `.cache/` (ignored by Git) and,
 * when available, re-renders `.workbuddy/board/BOARD.md`. It is the repeatable
 * replacement for the per-session finalize snippets.
 *
 * Usage:
 *   node scripts/finalize-task.mjs --task C11-avatar \
 *     --commits 1111111,2222222 --summary-file .cache/c11-handoff.md
 *   node scripts/finalize-task.mjs ... --next C12-badge --dry-run
 *   node scripts/finalize-task.mjs ... --no-board
 *
 * The queue path, handoff path, repository and board renderer are all
 * overridable, so a gate fixture can exercise the script without touching the
 * real working state.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const value = (name) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? undefined : args[index + 1];
};
const has = (name) => args.includes(`--${name}`);

const help = `Usage:
  node scripts/finalize-task.mjs --task <id> --commits <sha,...> --summary-file <file>
  node scripts/finalize-task.mjs --task <id> --commits <sha,...> --summary "<markdown>"

Options:
  --task <id>            Queue task to mark complete (required)
  --commits <sha,...>    Atomic commits, oldest first; the last one is recorded (required)
  --summary-file <file>  Handoff body, relative to the repository
  --summary "<text>"     Handoff body inline
  --next <id|none>       Override the computed next task
  --queue <file>         Default .cache/motion-v2-execution/queue.json
  --handoff <file>       Default .cache/motion-v2-execution/handoff.md
  --board <file>         Default .workbuddy/board/render.py
  --repo <dir>           Default current working directory
  --dry-run              Validate and print the planned write, change nothing
  --no-board             Skip the board renderer
  --force                Re-finalize an already complete task
  --help                 Print this message

The script validates that every commit exists, updates status/commit/currentHead/
currentScope/nextTask, replaces the rolling handoff body with the summary, and
then runs the board renderer when it exists.`;
if (has("help") || has("h")) {
  console.log(help);
  process.exit(0);
}

const repo = path.resolve(value("repo") ?? process.cwd());
const queuePath = path.resolve(repo, value("queue") ?? ".cache/motion-v2-execution/queue.json");
const handoffPath = path.resolve(repo, value("handoff") ?? ".cache/motion-v2-execution/handoff.md");
const boardArgument = value("board");
const boardPath = path.resolve(repo, boardArgument ?? ".workbuddy/board/render.py");
const taskId = value("task");
const commits = (value("commits") ?? "")
  .split(",")
  .map((sha) => sha.trim())
  .filter(Boolean);
const summaryFile = value("summary-file");
const summaryInline = value("summary");
const nextChoice = value("next");
const dryRun = has("dry-run");
const force = has("force");

if (!taskId) throw new Error("--task <id> is required");
if (!commits.length) throw new Error("--commits <sha,...> is required");
if (!summaryFile && !summaryInline) throw new Error("--summary-file or --summary is required");
if (summaryFile && summaryInline) throw new Error("pass --summary-file or --summary, not both");
for (const sha of commits) if (!/^[0-9a-f]{7,40}$/i.test(sha)) throw new Error(`not a commit sha: ${sha}`);
for (const sha of commits) {
  try {
    execFileSync("git", ["cat-file", "-e", `${sha}^{commit}`], { cwd: repo, stdio: "ignore" });
  } catch {
    throw new Error(`commit ${sha} is not in ${repo}`);
  }
}

const queue = JSON.parse(await readFile(queuePath, "utf8"));
if (!Array.isArray(queue.tasks)) throw new Error(`${queuePath} has no tasks array`);
const task = queue.tasks.find((entry) => entry.id === taskId);
if (!task) throw new Error(`unknown task ${taskId}`);
const finalCommit = commits.at(-1);
if (task.status === "complete" && task.commit === finalCommit && !force) {
  console.log(`${taskId} is already complete at ${finalCommit}; nothing to write.`);
  process.exit(0);
}

const summary = (summaryFile ? await readFile(path.resolve(repo, summaryFile), "utf8") : summaryInline).trim();
if (!summary) throw new Error("the handoff summary is empty");

const byId = new Map(queue.tasks.map((entry) => [entry.id, entry]));
const order = queue.executionOrder ?? queue.tasks.map((entry) => entry.id);
const dependenciesComplete = (entry) =>
  (entry.dependsOn ?? []).every((dependency) => byId.get(dependency)?.status === "complete");

task.status = "complete";
task.commit = finalCommit;
const explicitNext = nextChoice === "none" ? null : nextChoice;
let nextId = explicitNext ?? null;
if (!explicitNext && nextChoice !== "none")
  nextId =
    order.find((id) => {
      const candidate = byId.get(id);
      return candidate && candidate.id !== taskId && candidate.status !== "complete" && dependenciesComplete(candidate);
    }) ?? null;
if (explicitNext && !byId.has(explicitNext)) throw new Error(`unknown next task ${explicitNext}`);
if (nextId && !dependenciesComplete(byId.get(nextId)))
  throw new Error(`next task ${nextId} still has incomplete dependencies`);

queue.currentHead = finalCommit;
queue.currentScope = taskId;
queue.nextTask = nextId;
queue.updatedAt = new Date().toISOString();

const existingHandoff = await readFile(handoffPath, "utf8").catch(() => "");
const existingHeader = existingHandoff.split(/\r?\n/, 1)[0];
const header = existingHeader?.startsWith("# ") ? existingHeader : "# Motion v2 serial handoff";
const handoff = `${header}\n\n${summary}\n`;

if (dryRun) {
  console.log(
    JSON.stringify(
      {
        task: taskId,
        commits,
        currentHead: finalCommit,
        nextTask: nextId,
        queue: queuePath,
        handoff: handoffPath,
        handoffBody: handoff,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

await writeFile(queuePath, `${JSON.stringify(queue, null, 2)}\n`, "utf8");
await writeFile(handoffPath, handoff, "utf8");
console.log(`finalized ${taskId} at ${finalCommit}; next=${nextId ?? "none"}`);

if (has("no-board")) process.exit(0);
if (!existsSync(boardPath)) {
  console.warn(`board renderer not found at ${boardPath}; queue and handoff were written.`);
  process.exit(0);
}
try {
  execFileSync(boardPath.endsWith(".py") ? "python" : "node", [boardPath], {
    cwd: repo,
    stdio: "inherit",
  });
} catch (error) {
  // The queue/handoff write already succeeded; do not hide it behind a board
  // failure, but make the failure visible and fail the command.
  console.error(`board renderer failed: ${error.message}`);
  process.exitCode = 1;
}
