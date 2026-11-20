#!/usr/bin/env node
/**
 * Moves an issue's status label with its pull request. Labels are the only
 * state written here: no comment, no file, no commit.
 *
 *   opened, reopened    -> status:in-review
 *   converted_to_draft  -> status:claimed
 *   closed and merged   -> status:done
 *   closed, not merged  -> status:claimed, the work returns to its author
 *
 * The issue number comes from the single `Closes #<n>` the `plan` check already
 * requires. A body without exactly one is left alone: that pull request is
 * failing for a reason worth reading, and two writers guessing would be worse.
 */

import { readFile } from "node:fs/promises";
import { parseClosingIssue } from "./check.mjs";

const STATUS_LABELS = ["status:ready", "status:claimed", "status:blocked", "status:in-review", "status:done"];

function targetStatus(action, pullRequest) {
  if (action === "opened" || action === "reopened") return "status:in-review";
  if (action === "converted_to_draft") return "status:claimed";
  if (action === "closed") return pullRequest.merged ? "status:done" : "status:claimed";
  return null;
}

function labelNames(labels = []) {
  return labels.map((label) => (typeof label === "string" ? label : label?.name)).filter(Boolean);
}

function warning(message) {
  console.log(`::warning::${message}`);
  console.log(message);
}

async function request(url, token, method = "GET", payload) {
  const response = await fetch(url, {
    method,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "user-agent": "cadence-issue-status",
      "x-github-api-version": "2022-11-28",
    },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(`${method} ${url} returned ${response.status}: ${JSON.stringify(body).slice(0, 200)}`);
    error.status = response.status;
    throw error;
  }
  return body;
}

async function main() {
  const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, "utf8"));
  const pullRequest = event.pull_request;
  if (!pullRequest) {
    console.log("No pull request in this event; nothing to sync.");
    return 0;
  }

  const target = targetStatus(event.action, pullRequest);
  if (!target) {
    console.log(`"${event.action}" does not change an issue status.`);
    return 0;
  }

  const closing = parseClosingIssue(pullRequest.body ?? "");
  if (!closing.ok) {
    console.log(
      `Pull request #${pullRequest.number} does not name exactly one issue; leaving its status alone. The plan check reports the body error.`,
    );
    return 0;
  }

  if (pullRequest.head?.repo?.fork) {
    warning(
      `Pull request #${pullRequest.number} comes from a fork, where the pull_request token is read-only. Issue status was not synced: a maintainer must set ${target} on #${closing.number}.`,
    );
    return 0;
  }

  const repository = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;
  const base = process.env.GITHUB_API_URL ?? "https://api.github.com";
  const issueUrl = `${base}/repos/${repository}/issues/${closing.number}`;

  const issue = await request(issueUrl, token);
  const labels = labelNames(issue.labels);

  if (event.action === "closed" && !pullRequest.merged && !labels.includes("status:in-review")) {
    console.log(`#${closing.number} was not status:in-review; a closed pull request changes nothing.`);
    return 0;
  }

  const remove = STATUS_LABELS.filter((label) => label !== target && labels.includes(label));
  const add = labels.includes(target) ? [] : [target];
  if (!remove.length && !add.length) {
    console.log(`#${closing.number} is already ${target}.`);
    return 0;
  }

  try {
    for (const label of remove) {
      await request(`${issueUrl}/labels/${encodeURIComponent(label)}`, token, "DELETE");
    }
    if (add.length) await request(`${issueUrl}/labels`, token, "POST", { labels: add });
  } catch (error) {
    if (error.status === 403 || error.status === 404) {
      warning(
        `Issue #${closing.number} was not moved to ${target}: the token cannot write labels (${error.message}). A maintainer must set the label.`,
      );
      return 0;
    }
    throw error;
  }

  console.log(`#${closing.number}: removed [${remove.join(", ")}], added [${add.join(", ")}] (${event.action}).`);
  return 0;
}

try {
  process.exitCode = await main();
} catch (error) {
  console.error(`issue status sync failed: ${error.message}`);
  process.exitCode = 1;
}
