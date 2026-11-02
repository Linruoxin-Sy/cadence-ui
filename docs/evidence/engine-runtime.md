# Motion/engine runtime increment — 2026-11-02

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
  ToggleGroupItem remained compressed after disabled. Motion tap callbacks now drive
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

Existing production suites are usable evidence for the behaviors they assert; they
do not prove earlier first paint when they skip first samples or poll a final state.
The following gaps keep the full Motion/engine matrix OPEN:

| Actual writer                              | Existing applicable proof                                                   | Remaining condition to execute                                                                                                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button/Toggle/ToggleGroupItem              | real tap/keyboard and six-cell B3; four held disabled fixture paths         | native and focusable disabled keyboard-held interruption, re-enable/cleanup; distinguish inherited group state                                                                     |
| Slider ControlDiv                          | six-cell B3 drag; actual held disabled negative and repair                  | async mode/clock/value first paint on the actual dragged thumb, disabled under both OS                                                                                             |
| Checkbox/Radio ControlSpan                 | six-cell B3 insertion/interaction; async partial-scale reduced/none samples | external clock retarget and cleanup/reversal first-paint samples on actual indicator                                                                                               |
| Switch/Progress/OTP                        | six-cell B3; OTP async character/mode first paint                           | Switch/Progress external controlled commits and same-target clock at first paint; OTP clock/unrelated-render/cleanup trajectory                                                    |
| Select/Combobox/Menu checkbox/radio        | B5 indicator cells and actual source ControlSpan                            | identify every checkbox/radio host including Context and Menubar context; async partial-scale/clock/first insertion per distinct path, precise delegation reuse                    |
| Select measured value/portal flight        | B5 six cells including width, flight, resize/live cancel                    | clock change during same-target width spring; async cancel before first paint, flight handoff/cleanup and inherited/explicit clock                                                 |
| Tabs/CodeBlock shared indicator            | Tabs six cells; historical CodeBlock tab tests                              | CodeBlock actual shared host source/trajectory, mode downgrade at partial projection, reversal/resize; decorative branch identity follows source, not permanent-node assumptions   |
| CodeBlock floating Actions/two copy/expand | actual-source negatives and23 fixture assertions                            | six initial cells, clock-only mid-flight, re-entry/controlled reversal/cleanup, actual Next specimen; header static path is excluded                                               |
| CodeBlock measured viewport                | existing fold tests prove final size                                        | actual partial height, first-paint reduced/none, same-target clock, resize/reversal/cleanup; test real motion value, not static pre/SVG                                            |
| Sidebar scalar/onUpdate                    | six desktop/mobile cases including reversal and live cancel                 | first-paint samples at async mode/clock, inherited/explicit clocks, onUpdate cancellation and cleanup                                                                              |
| Calendar native WAAPI grid                 | six month-navigation cases and native timing unit assertions                | first-frame cancellation/clock, external controlled month, re-open/hydration and cleanup of actual grid                                                                            |
| Embla track/loop relocation                | seven actual-engine cases, axes/loop/drag/resize/live downgrade             | first-paint clock/none trajectories and engine state, dynamic-slide cleanup; direct drag geometry remains semantic                                                                 |
| Recharts AnimationController               | six actual bar/line/area/pie data-path cases                                | enumerate other installed controller-backed series, first-paint immediate completion (existing test ignores first2), controller progress/clock/cleanup; no blanket SVG suppression |
| Site DocumentEntrance article/section/div  | SSR9; fixture async cancellation; real article2                             | six initial mode/OS cells, offscreen entry, inherited/explicit live clock, settled/no-replay, real hydration/noJS/print regression after adapter change                            |

No GSAP writer exists. Site Reveal/Chevron/PreviewStack stay closed under CSS proof.
Compositions reuse their actual controls/context; they do not gain a new root engine.
Performance120KB/48KB/8KB/55fps/CLS and the final whole-goal audit remain OPEN.
