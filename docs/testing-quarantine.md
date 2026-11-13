# Testing quarantine

Purpose: keep one full `pnpm test` run interpretable when a failure comes from the host or sandbox
rather than from the change under review. A quarantined suite is **still run**; this file only records
why a failure in it is known noise. It is never permission to skip an assertion, exclude a project or
call a red run green.

Add an entry only when all of these are true:

1. The failing stack names an exact test file and case.
2. The same case passes when run alone with `pnpm exec vitest run <file>`.
3. The failure signature is environmental: a timeout on a cold gate, a sandbox delete denial, an
   unavailable browser or device, or a host resource limit. "It is flaky" is not enough.
4. It names an exit condition: the environment change or code fix that lets the entry be deleted.

Do not list a real assertion failure, a missing capability, a stale payload or a product defect here.
Those are fixed or tracked on the board, not quarantined. In particular, the F02 native/no-JS `#api`
reload defect is a product failure, not test noise.

## Active entries

| #   | Test                                                                                                                                          | Signature                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Exit condition                                                                                                                                                                                                                                                   |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `tests/lib/motion-contract.test.tsx > expectMotionContract > fails the actual Vitest entry for unused, dead, skipped and incomplete adoption` | Re-opens C2 with a different stack. Every assertion passes, then the `finally` teardown throws `[safe-delete][SAFE_DELETE_BULK_CONFIRM_REQUIRED] {"count":223…261,"threshold":50,"scope":"turn"}` from `node-safe-delete-shim.cjs` when `rm(fixture, …)` deletes its own `.cache/motion-contract-gate-*` tree. Passes when cleanup is skipped (`CADENCE_GATE_EVIDENCE=1`) or permitted; the same guard also interrupts `tests/lib/motion-targets.test.tsx`'s temp fixture on some turns. | The host stops counting a tool-created temporary fixture as a bulk personal-file delete, or the suite stops removing its own fixture inside the test process. Delete this entry once a full `pnpm --project cli-gates` run reports 7/7 files green on this host. |

Observed 2026-11-13 (C12-input, `1c5b17c7`): two sandboxed full `cli-gates` runs and one unsandboxed
run reported 6/7 files with only this signature; `pnpm exec vitest run --project cli-gates
tests/lib/motion-contract.test.tsx -t "fails the actual Vitest entry"` passed 1/1. No assertion was
skipped, excluded or edited to obtain that result.

## Cleared entries

| #   | Test                                 | Was                                                                                                                                                          | Cleared by                                                                                                                                            |
| --- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | `tests/lib/motion-targets.test.tsx`  | The cold catalogue audit had an inline 10s deadline; this host takes 10.1–10.7s, so a passing audit reported `Test timed out`.                               | `4d3c0891` replaced the inline deadline with the suite's 30s cold-audit hang guard. The audit itself was unchanged.                                   |
| C2  | `tests/lib/motion-contract.test.tsx` | One Windows/Dsh sandbox run passed every assertion, then its `finally` teardown logged `EPERM`/`ENOTEMPTY`/`EBUSY` deleting `.cache/motion-contract-gate-*`. | A full run on 2026-11-13 completed the same teardown without failure. **Re-opened as A1** with a different (bulk-delete guard) stack on the same day. |

## Reading a red full run

1. Open the first failing stack and copy its file path. Ignore the one-line summary.
2. Run only that file: `pnpm exec vitest run <file>`.
3. If it passes, check this list for its signature. If it is listed, quote the entry in the handoff;
   if it is not, add an entry only after steps 1–4 above hold.
4. If it fails, fix that file. Do not re-run a neighbouring long suite to "confirm" a diagnosis.

A full run with only listed entries may be described as "N assertions passed, known environmental
noise recorded", never as "all green". CI on Linux is the merge gate; local Windows runs are the
development loop.
