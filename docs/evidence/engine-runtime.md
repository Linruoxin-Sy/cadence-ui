# Motion/engine runtime increment — 2026-11-02

> W2 固定剩余清单现已由 [最终验收](engine-runtime-closure.md) 和其 JSON 收尾。
> 下文的 OPEN 表是历史增量记录；当前状态以最终验收及 [项目状态](../project-status.md) 为准。
> 整体 goal 仍未完成，按用户要求在 W2 后停止。

This is a partial runtime audit, not full-library closure. API466 and the CSS lifecycle
closure remain authoritative. `engine-writers.json` discovers 33 real source sites,
including private glyphs, flight, measured values and engine integration sites. It
does not count a provider, static SVG or a forwarding export as animation proof.

## Proven defects and repairs

- External asynchronous React commits exposed the passive ControlAnimation/OTP effect:
  the first rAF after commit still showed the old state/driver. The client effect is
  now a layout effect; the existing public frame.update reassertion and cleanup stay.
  React19.0 APIs only; no useEffectEvent, render mutation, remount or animation timer.
- Checkbox and Radio reduced target scale1 was insufficient: an actual partial
  scale0.960209 continued after downgrade. Per-key scale duration0 preserves opacity.
- DocumentEntrance's unchanged opacity/y target did not stop the old animation on a
  mode change. The committed controller now owns it. Explicit none initially renders
  RESTING; full/reduced retain hidden SSR. Article/section/div are tested separately.
  The real production article is sampled from insertion through header mode change;
  same DOM identity, neutral geometry and opacity1 at the first none sample are required.
  Existing no-script/print rules, in-view trigger and completion cleanup stay.
- Button, native focusableWhenDisabled Button, Toggle and inherited-disabled
  ToggleGroupItem remained compressed after disabled. Native owned press handlers now drive
  a controlled scale, immediately neutralized for disabled/aria-disabled or a removed
  press recipe. Base still owns activation, focus and refs. Slider's actual Base
  dragging state likewise stayed true after disabled: its scale now explicitly cancels.
- CodeBlock floating Actions and both copy glyph spans continued opacity after none;
  the actual expand span continued rotation. They use the same committed controller.
  Copy scale also needed a reduced per-key zero clock (raw first frame0.999643).
  Header Actions remains static. Measured viewport and shared indicator were not
  rewritten: they need their own remaining evidence below.

## Executable proof

`tests/runtime` is an isolated real React/Motion/Base browser fixture, not a Next
route or a product budget measurement. Start `pnpm exec vite --config
tests/runtime/vite.config.mjs`, then `node tests/runtime/probe.mjs <output.json>`
and `node tests/runtime/assert-report.mjs <output.json>`. Port3165 is explicit.
It deliberately performs updates from outside a React event, without act/flushSync.
Its parent layout effect records commit plus the next two rAF samples. A later
55ms wait only collects already-recorded samples; it does not move the observation
boundary. Full starts real motion; reduced allows opacity; none requires final state.
Both OS settings run, with full explicitly nested inside none at an8× clock.

The final fixture has **23 assertions, zero failures**. Original source data are
retained in `engine-runtime-raw.json`; the same assertion functions reject old
partial scale, stale first-frame controls/entrance, held disabled scale and CodeBlock
same-target/reduced glyph failures. These are actual-source negative controls.
No getAnimations-only inference is used for JS-driven scale/rotation: raw numerical
computed matrices are compared across the commit and paint samples.

`tests/runtime/press-reenable.mjs` additionally drives real pointer and Enter-held
presses on the four actual button paths. Native disabled swallows pointerup, which
previously revived scale on re-enable for Button/Toggle/Group. The shared adapter
now clears the cancelled visual gesture and ignores inactive tap starts. All8
paths have genuine partial scale before disable and neutral scale after disable
and re-enable; native versus focusable focus strategy is recorded, not overridden.
Original Space samples were static and are not claimed as keyboard animation proof.
The unit regression also first failed a none→disable→release→enable→full sequence
(target0.97), then passed after inactive tap starts stopped storing a latent press.
Raw records are in engine-press-reenable-negative/final.json. These supplement23,
not an inflated full-library case count.

Production `.next-motion-runtime`, Edge/msedge workers2, port3167: **93/93** passed
before the final two bounded Slider/copy-scale repairs. Breakdown: B3 48, B5 indicator/
Select12, Calendar6, Carousel7, Chart6, Tabs6, Sidebar6, actual DocumentEntrance2.
The raw case titles/attachments are local `.cache/engine-runtime-browser.json`.
Final source revalidation and strict JS measurement are recorded in the handoff.
No existing timeout, threshold, native behavior assertion or helper negative was removed.
The unit observer now exercises actual Button tap callbacks and observes controls,
instead of expecting the old declarative whileTap carrier. Its retained deliberately
broken geometry/clock examples still reject violations. Explicit SSR states add9 tests.

## Exact remaining runtime work

Select probe correction: the historical B5 width sampler used the global first
SelectValue (the header speed select), not Framework. Its width samples cannot
prove Framework geometry. The new selector is scoped to the actual preview and
retains all original assertions, adding raw-frame attachments. It reproduced two
none failures at source0a97033: width41 versus natural37.171875 for one frame.
`engine-select-width.json` preserves all six scoped source cases. Reduced/none now
render intrinsic width immediately instead of waiting for a cached measured value;
the measured spring remains full-only and jump still stops its old driver. Final
scoped production verification is recorded in the handoff. No assertion is weakened.

The first auto-style repair still switched the property from Motion to React.
Source819482c subsequently failed3/6 live cells, with actual data-motion=reduced
already committed and an old numeric37.067px width still present (not a precommit
observation). engine-select-live-negative.json records actual DOM and delta.
The final repair keeps a single MotionValue width owner in all modes, jumps it to
auto, and synchronously writes the identical target before paint. Full still uses
numeric measured physics. The same scoped assertions and raw attachments remain.

Existing production suites are usable evidence for the behaviors they assert; they
do not prove earlier first paint when they skip first samples or poll a final state.
The following gaps keep the full Motion/engine matrix OPEN:

| Actual writer                              | Existing applicable proof                                                                                                                                                                        | Remaining condition to execute                                                                                                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button/Toggle/ToggleGroupItem              | basic-controls-runtime.json: six cells, actual native hosts, initial disabled and held pointer/Enter, inherited clock, mode cancellation, same-node cleanup; old eight-path proof retained       | Real Next proof remains scoped to its actual assertions; native press replaces Motion keyboard synthesis (negative retained). No global hydration claim.                           |
| Slider ControlDiv                          | basic-controls-runtime.json: actual value-changing drag, full partial scale, live explicit clock/reduced/disabled, external value first frames, both OS and cleanup                              | Positive clocks 8/4/2 only; independent CSS/direct drag geometry is semantic. Real Next first-frame coverage remains as asserted by B3.                                            |
| Checkbox/Radio ControlSpan                 | six client cells; real indicator IDs, controlled selection/reversal, positive inherited/explicit clock native timing plus numeric JS samples, first-frame mode cancellation and cleanup          | Existing production insertion/hydration proof is scoped; no expanded all-host SSR matrix.                                                                                          |
| Switch/Progress/OTP                        | six client cells; async checked/value/character, default and public composed Progress indicator, clock changes, reversal/deletion, no unrelated replay, semantic terminal transforms and cleanup | Switch resize first rAF may precede RO delivery; second rAF is proven. No claim that this isolated client fixture proves full-shell SSR.                                           |
| Select/Combobox/Menu checkbox/radio        | Dropdown checkbox only: six B5 cells with nonempty raw samples; all other actual hosts source-inventoried                                                                                        | Dropdown radio, Context checkbox/radio, Select and Combobox actual indicator matrices; MenuBar exact delegation reuse; async clock/first-paint interruption                        |
| Select measured value/portal flight        | correctly scoped B5 six cells including true width/flight frames, resize and live cancellation; two separate source negatives repaired                                                           | same-target full spring clock, async first-paint cancel, flight handoff/cleanup and inherited/explicit clocks                                                                      |
| Tabs/CodeBlock shared indicator            | Tabs six cells; historical CodeBlock tab tests                                                                                                                                                   | CodeBlock actual shared host source/trajectory, mode downgrade at partial projection, reversal/resize; decorative branch identity follows source, not permanent-node assumptions   |
| CodeBlock floating Actions/two copy/expand | actual-source negatives,23 fixture assertions and final CodeBlock production regression                                                                                                          | six initial cells, clock-only mid-flight, re-entry/controlled reversal/cleanup, actual Next private-host frame probes; header static path excluded                                 |
| CodeBlock measured viewport                | existing fold tests prove final size                                                                                                                                                             | actual partial height, first-paint reduced/none, same-target clock, resize/reversal/cleanup; test real motion value, not static pre/SVG                                            |
| Sidebar scalar/onUpdate                    | six desktop/mobile cases including reversal and live cancel                                                                                                                                      | first-paint samples at async mode/clock, inherited/explicit clocks, onUpdate cancellation and cleanup                                                                              |
| Calendar native WAAPI grid                 | six month-navigation cases and native timing unit assertions                                                                                                                                     | first-frame cancellation/clock, external controlled month, re-open/hydration and cleanup of actual grid                                                                            |
| Embla track/loop relocation                | seven actual-engine cases, axes/loop/drag/resize/live downgrade                                                                                                                                  | first-paint clock/none trajectories and engine state, dynamic-slide cleanup; direct drag geometry remains semantic                                                                 |
| Recharts AnimationController               | six actual bar/line/area/pie data-path cases                                                                                                                                                     | enumerate other installed controller-backed series, first-paint immediate completion (existing test ignores first2), controller progress/clock/cleanup; no blanket SVG suppression |
| Site DocumentEntrance article/section/div  | SSR9; fixture async cancellation; real article2                                                                                                                                                  | six initial mode/OS cells, offscreen entry, inherited/explicit live clock, settled/no-replay, real hydration/noJS/print regression after adapter change                            |

No GSAP writer exists. Site Reveal/Chevron/PreviewStack stay closed under CSS proof.
Compositions reuse their actual controls/context; they do not gain a new root engine.
Performance120KB/48KB/8KB/55fps/CLS and the final whole-goal audit remain OPEN.

## Final authority

Primary-pointer follow-up: runtime **a656074** fixes the native adapter's missing
pointer ownership. `press-ownership-negative.json` preserves exact4d06c24 and
legacy50cc262 source, trusted two-contact events and numerical scale samples.
The4d06c24 regression starts nonprimary Toggle feedback and releases held Press
when only the second contact ends. The legacy comparison itself fails final cleanup;
it is not a complete behaviour oracle. The initial diagnostic also expected a click
after multitouch; both implementations actually suppress it. That exploratory
expectation remains visible in the raw negative and was corrected before positive proof.

`press-ownership-runtime.json`: **36 cases /222 assertions**, full/reduced/none ×
both OS preferences, real CDP primary/nonprimary touch, owner release/cancel,
disabled/none/blur/unmount, same-node numeric transforms. Six release cases also
prove single-touch Toggle activation, Enter activation/feedback, and outside mouse
release. Secondary release cannot start feedback or release the primary. No synthetic
pointercancel, dependency patch, timer or event suppression was introduced.
`press-ownership-controls.json` retains a new exact full raw gzip, **138/138**;
legacy23/23 and held-release8/8 remain passing. The first rerun's raw gzip is retained
separately: an old queued paint2 crossed collector reset, producing three paints.
The sampler now tags requested commits and requires exactly their paint1/paint2,
retaining every raw frame. Source hashes identify the runtime; the ownership report's
capture-start HEAD predates its source commit and verifiedRuntimeSource binds exact bytes.
All remaining conditions below, including zero/nonfinite clocks, SSR and other writers,
remain OPEN. New performance/production/check results are in the pointer ownership handoff.

Basic-control increment: `tests/runtime/controls.mjs` records actual host identities,
numeric computed styles, native timing/keyframes, commit and first two rAFs (plus
later samples), external asynchronous React commits and detached-node cleanup.
The 85ms collection wait does not defer recording. A full child inherits clock8
inside none; inherited4 and explicit2 retarget the same hosts, with OS reduce winning.
OTP clock changes settle the existing character; unrelated renders preserve its
progress, replacement animates a new character, deletion empties the same span.
Switch/Progress retain their semantic x/scaleX endpoints. Progress's public composed
indicator and its automatically appended default are sampled separately.

Two actual-source negatives are retained in `basic-controls-negative.json` and
`basic-controls-slider-negative.json`. Motion13.5.1's Enter keyboard press leaves a
blur listener that later synthesizes a bubbling pointercancel from the previous
button; Base Slider's document listener cancels the new real drag. PressButton now
drives the same controller through native pointer/Enter/blur handlers, forwarding
caller/Base handlers and cleaning up outside-release listeners. No remount, timeout,
event suppression, dependency patch or public API change. Slider reduced retarget
now zeroes the feedback scale immediately rather than tweening its old partial scale.

Native spring WAAPI duration is generated from the interrupted distance/thresholds;
positive clock reduction shortens it but is not asserted to divide its baked duration
exactly. Raw actual durations remain. Switch's width change reaches ResizeObserver
after the first rAF; second rAF has the new endpoint. This is not proof of synchronous
first-rAF resize measurement. Zero/negative/nonfinite timeScale is not certified here.
Other independent writers in the remaining table stay OPEN. Final commands, counts,
source hashes and production proof are recorded in basic-controls handoff.

Final basic-control authority is `basic-controls-validation.json`: runtime4d06c24,
client138/138, legacy23/23 + held-release8/8, complete check687/687 in88 files,
production193/193. `basic-controls-runtime.json` indexes the exact original raw
JSON in its `.json.gz` sibling (51,195,294 UTF8 bytes; no frames discarded).
The archive tool verifies lossless decompression and records SHA256. Real native
ResizeObserver delivery and disconnect are instrumented without mocking delivery.
Current strict four-page JS is Button293406, Chart414456, Calendar318764 and
CodeBlock376803 gzip bytes; all FAIL120000. Source50cc262 numbers below remain history.

Runtime source50cc262: full pnpm check687/687 in88 files, isolated production build
and106/106 behavior cases. Correctly scoped Select6/6 and strengthened nonempty
Dropdown-checkbox6/6 pass; the latter samples only that actual checkbox writer, not
every menu indicator. Final fixtures23/23 plus8 genuine pointer/Enter disable-release-
re-enable paths pass. Actual React/ReactDOM19.0 StrictMode consumer executes the three
control adapters/OTP, clock/unrelated-render and native ref cleanup paths with copied
source bytes matching final runtime. It is not a product budget measurement.

Final strict initial JS: Button293136/23 scripts, Chart414186/24, Calendar318494/24,
CodeBlock376533/29 gzip bytes/scripts, all above120000. All responses200, no pageerrors,
served root hashes/gzip match the final build manifest. Reproduce with
scripts/audit-site-pages-js.mjs: fresh Edge per page, cache disabled, every automatic
script, networkidle+10s+networkidle, no interaction. The existing helper only gained
an optional page-specific readiness selector; no accounting, timing or threshold changed.
The audit exits1 for the four genuine budget failures. Source819482c measurements
remain separately preserved. Full evidence: engine-runtime-final.json and engine-runtime-js.json.

Post-runtime review only strengthens tap/indicator nonempty assertions and adds the
four-page audit tool. Typecheck/lint and the accounting unit pass. No payload sourceSha
refresh is required for these test/evidence changes. No full-library or whole-goal closure.
