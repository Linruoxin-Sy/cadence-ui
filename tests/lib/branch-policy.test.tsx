import { expect, it } from "vitest";
import { branchProblem, parsePushRefs, pushProblem } from "../../scripts/branch-policy.mjs";

it("requires a documented prefix on a work branch", () => {
  for (const branch of [
    "feature/avatar-motion",
    "feat/select-focus",
    "bugfix/select-focus",
    "fix/select-focus",
    "hotfix/toc-no-js",
    "release/v1.2.0",
    "chore/pnpm-10",
    "docs/pr-only-workflow",
    "refactor/motion-runtime",
  ])
    expect(branchProblem(branch)).toBeNull();

  for (const branch of ["feature/", "feature/Avatar", "avatar-motion", "feat_avatar", "main", "master", "", "HEAD"])
    expect(branchProblem(branch)).not.toBeNull();
});

it("refuses a push that targets a protected branch", () => {
  const refs = parsePushRefs(
    [
      "refs/heads/feature/avatar 1111111111111111111111111111111111111111 refs/heads/feature/avatar 0000000000000000000000000000000000000000",
      "",
      "refs/heads/main 1111111111111111111111111111111111111111 refs/heads/main 0000000000000000000000000000000000000000",
    ].join("\n"),
  );

  expect(refs).toHaveLength(2);
  expect(pushProblem(refs.slice(0, 1))).toBeNull();
  expect(pushProblem(refs)).toContain("refusing to push into `main`");
  expect(pushProblem(parsePushRefs("refs/tags/v1.0.0 1111 refs/tags/v1.0.0 0000"))).toBeNull();
  expect(pushProblem(parsePushRefs("refs/heads/feature/x 1111 refs/heads/wip 2222"))).toContain(
    "refusing to push branch `wip`",
  );
});
