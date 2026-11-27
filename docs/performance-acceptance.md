# F03 · performance acceptance against the v2 budgets

**Functional status is not decided here.** This page records only what ADR-026's budgets measured on one
commit; it is not a functional result. The one functional defect open when the run was taken — [#173](https://github.com/Linruoxin-Sy/cadence-ui/issues/173)
(drawer `full`-mode open started no entrance envelope) — is fixed in
[#185](https://github.com/Linruoxin-Sy/cadence-ui/pull/185), which changes no number on this page.

**Performance status: acceptance not met.** Every hard gate passed; three monitored metrics are over their
limits and one required measurement does not exist. ADR-026 permits acceptance only when every hard gate is
green _and_ every monitored metric is at or under its limit (or an ADR names the exception), with the device
criterion measured. That is not what this run found, so nothing here is a pass claim.

|                        |                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| Commit                 | `c232a50545ff3652b929de0166659dc3a58cc364` (`origin/main` at the start of F03)                       |
| Production build       | `next build`, BUILD_ID `K-3wOELzLpmC66QN7F657`                                                       |
| Run                    | 2026-11-26 UTC (2026-11-27 local), branch `chore/f03-performance`                                    |
| Raw evidence           | `.cache/f03/` in the checkout that ran the sweep, ignored; `acceptance.json` is the assembled result |
| Decision it answers to | [ADR-026](adr.md#adr-026--v2-performance-budgets-what-is-gated-what-is-monitored-what-is-retired)    |

## Verdicts

| budget                 | class            | measured                                                               | limit       | verdict                                                                 |
| ---------------------- | ---------------- | ---------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------- |
| `component-local-code` | hard gate        | 6 804 B worst (`code-block`), 63/63 within                             | ≤ 8 000 B   | **pass**                                                                |
| `component-addition`   | hard gate        | 63/63 within recorded + 1 024 B; largest `code-block` 201 238 B        | ratchet     | **pass**                                                                |
| `motion-union`         | hard gate        | 44 207 B shipped (44 450 with the site's `useInView`, 46 533 `domMax`) | ≤ 48 000 B  | **pass**                                                                |
| `cls`                  | hard gate        | 0.00055 cold (`pagination` 390), 0 interaction                         | < 0.02      | **pass**                                                                |
| `page-total`           | monitored        | 503 395 B worst (`/components/chart` 1280), 0 of 146 cells over        | ≤ 550 000 B | **pass**                                                                |
| `route-remainder`      | monitored        | 137 253 B worst (`chart`), 6 routes over at both widths                | ≤ 40 000 B  | **fail**, [#178](https://github.com/Linruoxin-Sy/cadence-ui/issues/178) |
| `frame-share`          | monitored        | 1.18% worst (`dialog` 390), 1.17% on the second run                    | ≤ 1%        | **fail**, [#180](https://github.com/Linruoxin-Sy/cadence-ui/issues/180) |
| `frame-block`          | monitored        | 192 ms worst (`select` 390), 174 ms on the second run                  | ≤ 150 ms    | **fail**, [#180](https://github.com/Linruoxin-Sy/cadence-ui/issues/180) |
| `tier-source`          | retired          | per item, reported by `registry:check`                                 | none        | reported, not compared                                                  |
| device ≥ 55 fps        | device criterion | —                                                                      | ≥ 55 fps    | **unmeasured**                                                          |

The device criterion is unmeasured, not failed and not waived: ADR-026 requires presented-frame timestamps from
a real 2023–2024 60 Hz mid-range Android phone, and no device was available to this run. Desktop rAF cadence is
the proxy those two frame rows come from, and it cannot stand in for that measurement.

## Which frame figure each page reports

ADR-026's table records `frame-share` as "0.33% / 0.48%" and `frame-block` as "133.9 ms". Those two shares are
**pooled** over the seven interaction windows in the S02-A files — 9 long frames of 2 698 at 1280 (0.334%) and
13 of 2 702 at 390 (0.481%) — while the worst single route in the same files is `dialog` at 0.69% (3/434) and
0.93% (4/432). [#180](https://github.com/Linruoxin-Sy/cadence-ui/issues/180) read the ADR figure as a per-route
one, could not reconcile it with the files and said so rather than picking an answer; both readings are
arithmetically correct and the ADR does not say which statistic it means. The ADR is not edited here, because its
own enforcement section makes an amendment a new ADR and no limit or class changes.

This page reports the **per-route maximum**, and on this commit the difference decides the verdict:

| frame-share statistic  | 1280           | 390            | against ≤ 1% |
| ---------------------- | -------------- | -------------- | ------------ |
| pooled over 7 windows  | 11/2 703 0.41% | 12/2 695 0.45% | inside       |
| worst route (`dialog`) | 4/428 0.94%    | 5/426 1.18%    | over at 390  |

A budget that protects "frames over 25 ms on an interaction" has to bind the route that stalls; pooling seven
windows lets six smooth routes pay for one bad one, and would report this run as inside a limit that the route
it names is over. So the breach is recorded against `dialog`@390, tracked in
[#180](https://github.com/Linruoxin-Sy/cadence-ui/issues/180), and the choice of statistic is stated here instead
of being left to whoever reads the two documents next. If the pooled reading is what ADR-026 intended, that is an
ADR decision and not a page edit.

## The run, in the order it was taken

```bash
pnpm registry:build          # reproduced the committed payloads byte-for-byte
pnpm exec next build         # BUILD_ID K-3wOELzLpmC66QN7F657
pnpm start --port 3100
node scripts/audit-w3-bundles.mjs .cache/f03/audits/w3
node scripts/measure-routes.mjs page   --base http://127.0.0.1:3100 --width 1280 --out .cache/f03
node scripts/measure-routes.mjs page   --base http://127.0.0.1:3100 --width 390  --out .cache/f03
node scripts/measure-routes.mjs frames --base http://127.0.0.1:3100 --width 1280 --out .cache/f03
node scripts/measure-routes.mjs frames --base http://127.0.0.1:3100 --width 390  --out .cache/f03
PLAYWRIGHT_CHANNEL=msedge pnpm exec playwright test \
  tests/e2e/document-interaction-layout.spec.ts tests/e2e/data-table-layout.spec.ts --workers=1
node scripts/accept-performance.mjs .cache/f03
```

`pnpm build` is `registry:build && next build`. It was run as those two steps because Next's cleanup of the
previous `.next` aborted the combined command on a bulk-delete guard in this environment; the payload step had
already reproduced the committed `public/r/**` with no diff, so the served build is the one `pnpm build`
produces. `pnpm install` was not re-run: `node_modules` in this checkout already matched `pnpm-lock.yaml`.
Wall clock: build 3 m 47 s, each page sweep 14 m 17 s and 14 m 08 s, frames 47 s per width, interaction suites
7 m 13 s, audit 4 s.

Environment: AMD Ryzen 7 5800H (16 logical), 31.9 GiB RAM, Windows_NT 10.0.22621 x64, Node v22.22.2, headless
Edge 158.0.4370.33 via `PLAYWRIGHT_CHANNEL=msedge`, 1280×720 and 390×844 at `deviceScaleFactor` 1,
`reducedMotion: no-preference` for the sweeps, server `next start` on `127.0.0.1:3100`. The host panel is
2560×1600 @ 165 Hz; idle rAF cadence measured 164 Hz before each frame window, which is why fps in the 140s is
a main-thread stall and not a slow display.

## Page evidence is bound to this build

The sweep no longer records only a total. `measure-routes.mjs` now writes, per route, one entry per JavaScript
entity with the body's SHA-256, the HTTP status and the CDP initiator, plus the root build manifest it was
served from:

- **3 057 JavaScript entity records** over 146 route-viewport cells, **120 distinct entities**, all HTTP 200,
  all with a body hash, initiated by `parser` (3 022) or `script` (35). No `fetch`/prefetch entity is
  unaccounted for, and no cell has a script without a captured body.
- **Root build manifest** `.next/build-manifest.json` (SHA-256 `784a84ce…`) with its five `rootMainFiles` and
  their hashes, plus `.next/app-path-routes-manifest.json` (`d54d972a…`) for the route inventory; `BUILD_ID`
  `K-3wOELzLpmC66QN7F657` matches the server the sweep was pointed at.
- **Shell**: 366 142 B across 19 chunks, identical at both widths. It is the union of URLs observed on all 63
  component routes, computed from the same sweep — not a manifest guess and not a proportional split of a mixed
  chunk.
- **Per-route remainder**: 1 411 B (`animated-text`) to 137 253 B (`chart`), median 9 996 B. Six routes exceed the
  40 000 B bar at both widths: `chart` 137 253, `code-block` 87 626, `date-picker` 57 392, `data-table`
  54 102, `sidebar` 47 307, `command` 41 653.
- **Reachable async cost**: each row separates what the document declares (`declaredJsGzip`) from what is
  fetched afterwards (`fetchedJsGzip`), and the install-side split of initial versus reachable-async output
  stays in the audit's `initialGzip`/`reachableAsyncGzip` per id.

The cold CLS windows are kept raw: 142 of 146 cells recorded no shift at all, and the four that did are stored
with their entries. The worst is 36× below the limit, so the gate passes on a number that is a catastrophe
detector rather than a tuning target.

## Interaction windows

The two suites ADR-026 names passed: 19 tests, 0 unexpected, 0 flaky, `--workers=1`. A first attempt at default
parallelism produced 2 failures — `data-table` 1440 in `reduced` and `none` reported `data-preview-motion="full"`
after `networkidle`, i.e. the client-side motion mode had not been applied inside the 5 s assertion window while
~20 tests shared the machine. Serial re-run of those three cases was green in 40 s each, and the full serial run
was green, so this is a hydration race in the readiness assertion under load, not a CLS result; it is recorded
because a green run reached by rerunning has to say so. The seven per-route interaction windows in the frame
sweep independently recorded CLS 0.00000 in all 14 cells.

## Where the failures go

- `route-remainder`, six routes — already owned by [#178](https://github.com/Linruoxin-Sy/cadence-ui/issues/178);
  this run reproduces its numbers on the current source and adds nothing to the decision. [#178](https://github.com/Linruoxin-Sy/cadence-ui/issues/178)
  then dispositioned them in
  [ADR-027](adr.md#adr-027--route-remainder-exceptions-the-six-pages-whose-remainder-is-their-own-item),
  naming each route with its own sweep; no number on this page moved, and the six are still reported as
  exceedances.
- `frame-share` and `frame-block` — filed as [#180](https://github.com/Linruoxin-Sy/cadence-ui/issues/180) with
  both runs and an unmodified-collector control run. It reproduces (`dialog` 1.18/1.17/1.18%, `select` 192/174/165
  ms), so it is neither a harness artifact nor a single-window fluke. No attribution is claimed: nothing here
  says whether the block is the modal entrance, the popup's layout work, or host contention.
- The 366 KB shell — [#177](https://github.com/Linruoxin-Sy/cadence-ui/issues/177) attributed it after this
  run, and it is the reason `page-total` sits at 503 KB while remaining inside its drift ceiling. The split is
  recorded in [parity-plan.md §8](parity-plan.md#8-next-work): 135 115 B framework baseline, 209 610 B registry
  runtime the page chrome mounts on every route, 6 361 B site chrome, 0 B documentation-only, 13 180 B shared
  gzip dictionary. It explains the cost and changes none of it: the `page-total` measurement above, this run's
  decision and its acceptances stand as measured.
- Device ≥ 55 fps — no issue is filed, because an issue would not produce a phone; it stays unmeasured until a
  device trace exists, exactly as ADR-026 says.

No budget, limit, method or threshold was changed to produce this page. The only source F03 touched is
measurement code.

## What this does not claim

- **Not a functional acceptance.** Functional completion and this result are separate; [#173](https://github.com/Linruoxin-Sy/cadence-ui/issues/173)
  was fixed in [#185](https://github.com/Linruoxin-Sy/cadence-ui/pull/185) after this run, and neither its
  absence at measurement time nor its fix moves a number here.
- **Not a device result.** Two monitored proxies on a 165 Hz desktop host are not ≥ 55 fps on a phone.
- **Not a clean bill for `page-total`.** 503 395 B is inside a drift ceiling that ADR-026 explicitly calls
  "not a quality claim"; 366 142 B of it is a shell nobody has attributed yet.
- **Not a waiver of the failures.** `route-remainder` and the two frame windows are recorded as exceedances and
  tracked, not relabelled as noise. The historical 120 KB page bar stays recorded as never met.

## Reproducing

`node scripts/accept-performance.mjs .cache/f03` recomputes every verdict from the raw files without a browser.
It refuses a partial sweep, an entity without a body hash, a non-2xx response, a missing initiator, a missing
`BUILD_ID` or a missing manifest, and it treats any of those as a correctness failure under every class rather
than as "no result". It exits non-zero only when a hard gate fails or a measurement is invalid: a monitored
breach does not fail the run, and the acceptance line it prints is what ADR-026's conditions decide.
