# Zero recipe clock review — 2026-11-02

Runtime commit: **384e94a**. Starting commit: **95747f5**. Installed Motion13.5.1,
real React/Base hosts in Edge; no generator/renderer mock or dependency patch.

## Defect and scope

The exact original motion.ts SHA256 is
`5091af569d54981515b3154aa7ad328b08b78632dd3a5649e796a6408d5d52f6`.
`zero-clock-generator-negative.json` retains its full text and10 actual public
spring generator runs (positive and zero clocks). Physics zero creates Infinity;
visualDuration0 still plays Motion's fallback spring. Warnings were not suppressed.
The generator script replays the preserved source, never forces the fixed
zero-duration result through a spring-only dispatcher.

The browser negative loads those exact source bytes through a read-only Vite
plugin. Its actual Motion animate dispatcher drives a MotionValue bound to a
motion.div. The current source is read and checked for unchanged bytes. The
fixture does not impersonate a Next route, network SSR, hydration or a budget.

Every19 catalogue recipe resolves zero before conversion, including delay0.
Direct physicalSpring(0) is immediate. Finite non-negative timeScale is explicit;
invalid provider/active-recipe clocks and direct physical durations throw
RangeError. Existing none recipe options remain ignored. Positive spring shapes,
velocity continuity and caller Motion fallback semantics are unchanged. Zero does
not change mode/reduced/disabled or stop theme-clock CSS loops. Native in-flight
CSS transitions have no new live-retime promise.

## Evidence

- Unit old-source counterexample:24 failing /17 passing before repair; final
  motion-token/provider subset51/51. Full check721/721,88files, mandatory animated
  suites/reporter retained. `.cache/zero-clock-unit-negative.log`, `zero-clock-unit.log`,
  `zero-clock-check-final.log`. Initial full-check attempts stopped at JSON
  formatting; formatting changed whitespace only.
- `zero-clock-negative.json` and `zero-clock-runtime.json`: same real dispatcher
  and19 recipes, inherited initial0, retarget and delay cancellation, nested0
  over positive parent, per-call0 over positive, unrelated render, restoration
  to a positive clock and genuinely partial positive motion for four recipe
  families, same-target change to0, direct physical0 and actual Base Button held
  press scale0.97 in full0. Mode flags remain full/false/false.
- Positive unrelated renders retain controller start count. Cleanup begins during
  real partial geometry motion; both postRender frames freeze at the cleanup
  value and final isAnimating is false. Full raw commit/paint1/paint2 samples are
  retained, including reset/positive setup updates; no initial frames discarded.
  PostRender reads actual rendered transforms, values and engine state. An
  independent pass verified164 actual host paint samples against exact target,
  transform and idle state before adding those assertions to the executable.
- Early probe diagnostic: Motion GroupAnimation state getter throws before
  resolution. `zero-clock-probe-diagnostic.json` records it. Actual MotionValue
  isAnimating avoids that getter. `zero-clock-cleanup-diagnostic.json` preserves
  the false assumption that isAnimating must clear synchronously inside stop();
  raw values were frozen, and it cleared by the first frame. The corrected
  assertion requires both first frames frozen and eventual stopped state.
  `zero-clock-initial-negative.json` keeps the initial actual negative with its
  unmount sampling timeout; the final probe no longer waits for an unmounted
  component to emit a commit sample. These are probe corrections, not product
  changes or relaxed motion value tolerances.
- Isolated final Next production build passed, `.cache/zero-clock-build.log`;
  own generated tsconfig changes inspected and restored. Production193/193,
  zero skipped/unexpected/flaky, `.cache/zero-clock-production.json`.

This closes the base zero-clock calculation and the bounded dispatcher/Button
proof, not every consumer's same-target clock subscription. Select width/flight,
projection, menus, Sidebar/Calendar/Embla/Recharts and DocumentEntrance keep the
part-specific remaining conditions in `engine-runtime.md`. Initial network SSR
and all-shell performance are separate gates. CSS/continuous engine clocks were
not silently converted into recipe clocks.

## Final stable run

Negative: **92 records /49 failures**, exit1. Current: **92 records /0 failures**,
exit0; **345 raw samples**, including every setup commit and its first two paints.
The executable now checks all164 zero-clock host paint transforms and idle states,
in addition to MotionValue numbers and mode flags. Both runs use that same final script.
Only console warning is the fixture favicon404; no pageerror is hidden.

- `registry/cadence/lib/motion.ts` SHA256 `72305fb185390db69a8d2b9c82837adf7fe42c3f1125e0a069e5237ef09656e6`.
- `registry/cadence/lib/provider.tsx` SHA256 `d8a91762f4f39fcc1aa2f323716da97ddfdbe10ef0decda60cdeeb5259960a54`.

Final production193/193; four-page JS293597/414647/318955/376994 bytes, all
FAIL120000 with23/24/24/29 scripts. `zero-clock-js.json` retains the complete
network accounting. No performance gate closes in this increment.
