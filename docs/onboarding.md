# Onboarding

This page takes a new contributor from a clone to a green pull request. The component rules are in
[CONTRIBUTING.md](../CONTRIBUTING.md); the motion contract is in
[animation-system-plan.md](animation-system-plan.md). This page is only the path through them.

## 1. Prerequisites

| Requirement                 | How to get it                                                                                                       | Check                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Node 24                     | [`nvm`](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) — the repository pins it in `.nvmrc` | `node --version`                 |
| pnpm 12                     | `corepack enable` — `packageManager` in `package.json` selects the exact version                                    | `pnpm --version`                 |
| Git and a GitHub account    | —                                                                                                                   | `gh auth status`                 |
| Chromium for browser checks | `pnpm exec playwright install chromium`                                                                             | `pnpm exec playwright --version` |

Do not use `npm`, `yarn` or `bun`: the lockfile is pnpm-only and other lockfiles are ignored.

## 2. First run

```bash
git clone https://github.com/Linruoxin-Sy/cadence-ui.git
cd cadence-ui
corepack enable
pnpm install          # also installs the commit hooks through "prepare": "husky"
pnpm registry:build   # writes public/r/** from registry.json; required before the site and most checks
pnpm dev              # the docs site renders every component from registry/cadence/**
```

Then prove the checkout before changing anything:

```bash
pnpm check:static                                       # typecheck, Biome, registry, parity
pnpm test:local tests/components/button.test.tsx        # one component suite
```

Both must pass on a clean `main`. If they do not, stop and report it — a red baseline is not your bug
to fix silently.

## 3. Where work comes from

The schedule lives in the [issue tracker](https://github.com/Linruoxin-Sy/cadence-ui/issues?q=is%3Aissue%20label%3Amotion-v2), not in this repository. Filter with:

```bash
gh issue list --label motion-v2 --label status:ready         # claimable now
gh issue list --label status:blocked                          # waiting on another issue
gh issue list --label "task" --search "C41"                    # one task by id
```

- **Claim** it with `gh issue edit <n> --remove-label status:ready --add-label status:claimed --add-assignee @me`.
  An issue a pull request closes must also carry the `task` label; the `plan` job checks both.
- **One issue, one branch, one pull request.** Do not fold an unrelated docs or chore change into a
  component migration.
- Read the issue's _Blocked by_ list first; a pending dependency means the composition cannot be
  judged yet, not that the dependency text can be skipped.
- The issue carries the verbatim scope, the required reading and the full acceptance list. It is the
  authority for that task; this page only explains how to run it.

## 4. Branch and pull request

```bash
git switch main && git pull --ff-only
git switch -c feature/<component>-motion
# ... work ...
git push -u origin feature/<component>-motion
gh pr create --base main --head feature/<component>-motion
```

`main` only receives pull request merges. The husky hooks refuse a commit on `main` and a push whose
destination is `main`; the CI `branch-policy` job refuses a pull request from a branch outside the
naming table in [CONTRIBUTING.md](../CONTRIBUTING.md#branch-and-merge-policy).

Put exactly one `Closes #<issue>` in the pull request body. The `plan` job fails the pull request when the
body has zero or two, when the issue is not a claimed task, or when a `Blocked by` reference is still open.
Merge with `gh pr merge <n> --squash` once `check` is green and delete the branch; the merge closes the
issue and `issue-status.yml` moves its label to `status:done`. Nothing else records the outcome.

## 5. Verification layers

Run the narrowest layer that can still fail, then one full pass per change set.

| Layer  | Command                                                           | When                                                                     |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Static | `pnpm check:static`                                               | After editing source, metadata or docs; before staging                   |
| Scoped | `pnpm test:local tests/components/<id>.test.tsx`                  | While iterating on one component                                         |
| Shared | `pnpm exec vitest run <file>` for each `grep -rl <id> tests/` hit | Once the component suite is green                                        |
| Gates  | `pnpm test:gate`                                                  | When contracts, presets, metadata, MDX templates or gate scripts changed |
| Full   | `pnpm test`                                                       | Once per change set                                                      |

CI is the authority. `check` is the only required status on `main`; it fails when any fan-out job
fails, is cancelled or is skipped. The `plan` job is part of `check` and reads the issue link, not the
diff, so a docs-only pull request is held to the same rule. A local "all assertions passed" note does
not replace it.

## 6. Evidence and generated files

- Generated payloads under `public/r/**` and `public/llms-full.txt` come from `pnpm registry:build`.
  Never hand-edit them, and never include a Next build tree in a commit.
- Browser evidence for full/reduced/none goes in the pull request: screenshots or a CI artifact link.
  Anything kept locally belongs under the ignored `.cache/` and is not evidence anyone else can see.
- Report missing or failed measurements as missing or failed. ADR-023 makes numeric budgets advisory
  during functional migration; it does not make an unmeasured claim a pass.

## 7. Common failures

| Symptom                                      | Cause                                                | Fix                                                                    |
| -------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------- |
| `registry:check` reports a stale payload     | Source, metadata or MDX changed after the last build | `pnpm registry:build`, then rerun the check                            |
| `Cannot find name 'beforeEach'`              | Test uses Vitest globals without importing them      | `import { beforeEach, afterEach } from "vitest"`                       |
| Conflict in `registry.json` or `public/r/**` | Both branches rebuilt generated files                | Take both items and rerun `pnpm registry:build`; never resolve by hand |
| Commit refused with `branch-policy`          | The checkout is on `main` or a detached HEAD         | `git switch -c feature/<topic>` first                                  |
| `pnpm install` installs a different pnpm     | Corepack is disabled                                 | `corepack enable`, then check `pnpm --version`                         |

## 8. Where things live

| Location                                                  | Holds                                                                  |
| --------------------------------------------------------- | ---------------------------------------------------------------------- |
| `registry/cadence/**`                                     | Shipped component source, copied verbatim into consumer projects       |
| `registry.json`, `public/r/**`                            | Install metadata and the payloads the registry serves                  |
| `content/components/*.mdx`, `components/site/previews/**` | User-facing documentation and previews                                 |
| `docs/**`                                                 | Concepts, contracts and per-component target design — not the schedule |
| Issue tracker                                             | Scope, dependencies, acceptance and status for every task              |
| `.cache/`                                                 | Local reports, traces and build trees; never committed                 |
