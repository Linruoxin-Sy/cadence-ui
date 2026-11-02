# B3 control runtime and React 19.0 follow-up

2026-11-02, starting clean at 682b08e; fixed upstream pin and workspace dependencies unchanged.
Raw baseline samples are in control-runtime-original.json. Final samples, browser case
results and the real React 19.0 consumer manifest/runtime observations are in
control-runtime.json. Final source/payload SHAs and commands are recorded in the handoff.

## Correcting the four-failure attribution

A fresh production build of unchanged source at 682b08e reproduced all four failures
(Checkbox/RadioGroup, none, OS no-preference/reduce), with original assertions and timeouts.
The actual failing assertion was the interaction sampler's `every(scale === 1)`, not
the earlier `initial.length > 0 && every(animations === 0)`. Original report line148
was misattributed in compatibility-base.md. Initial samples were nonempty and zero,
but contained only root/static nodes. They did not certify the indicator's first insertion.
The interaction samples started at scale0.96/opacity0/no active animations before the
click, and finished at scale1/opacity1/no active animations. This is stale geometry,
not evidence of an active nonzero-duration animation under none.

A temporary source diagnostic confirmed the committed effect received scale1/duration0
while inline DOM remained scale0.96. Motion13.5.1's installed
`animation/interfaces/visual-element-target.mjs` queues `frame.update(() => value.set(valueTarget))`
even when the target already equals the current value. An earlier full-mode same-target
write can run after none's immediate `controls.set`. Replacing useEffectEvent alone
left all four failures (45/49 passed); ordering the zero-clock reassertion closes them.
The adapter stops, sets immediately, then reasserts once through public `frame.update`;
cleanup cancels that task and stops controls. No timer, remount, delay or new recipe.
Both adapter and OTP use normal effect closures keyed to meaningful values. No ref is
mutated during render to expose uncommitted state. Unrelated renders do not replay.

## First insertion probe

The probe now records actual slotted parts (and OTP character spans), from parser child
insertions and attribute mutations through 120 rAF callbacks. It excludes provider divs,
does not stop after the first root appears, and captures slot/tag/mode/time/styles,
WAAPI play state/current time/timing/keyframes. Existing nonempty/zero assertions remain;
explicit animated-part presence and checked Checkbox/Radio none opacity1/transformnone
assertions prevent partial-root coverage. It observes SSR insertion and hydration; no
late-only sample, delayed specimen, hidden fixture or remount. The independent negative
control inserts a real opacity WAAPI animation in the same task as a new part, before
MutationObserver delivery, and requires the probe to detect it. Original interaction
scale, frame count, cancellation, stable-node/focus and timeouts remain unchanged.

## Real minimum React consumer

Installation says React19; overall-design says React19.x. Official React19.2 release
introduced useEffectEvent: https://react.dev/blog/2025/10/01/react-19-2 and
https://react.dev/reference/react/useEffectEvent. The two shipped hard imports were an
actual compatibility defect. The isolated npm consumer uses React19.0.0 and ReactDOM19.0.0
with one deduped installation, copies shipped source preserving its layout, and builds
with real Vite7.3.7/Motion13.5.1/Base1.9.0/input-otp1.5.0. Before repair its production
bundle built but actual browser execution failed `useEffectEvent is not a function`,
leaving the body blank. After repair it renders and runs the three adapters and actual
OTP input in StrictMode, all modes and both OS preferences. No host dependency or lock
change, hook mock, feature-detection bypass or dependency patch. Reproduction fixtures
and runner are in tests/fixtures/react19-consumer.

The runner verifies actual opacity/geometry frames and none cancellation, same-target
clock cancellation, preservation of real WAAPI animation identity under an unrelated
committed render, OTP JS-driven opacity progression through such a render, same input
and character nodes/focus, public native drag and cleanup refs on unmount. OTP clearing
uses actual select-all/Backspace, with an empty-value assertion; fill("") did not clear
the library's controlled character state and was corrected in the fixture. Assertions
wait one rAF for the running engine, not until it finishes. This proves the requested
minimum and affected paths, not all versions or all exported parts.

## Motion conformance and scope

Only control-animation and OTP shipped logic changes. Their callers keep their existing
state.morph/data.transition recipe sets, token targets/timing, mode branches/data-motion,
public props/slots/render/ref/DOM ownership. OTP still keeps a character span and animates
only changed characters; full scales+fades, reduced fades, none immediately settles.
The adapter's queued task has no duration and is canceled on later commits/unmount.
Shared helper reporter and real renderer observer remain mandatory and unchanged.
B3 production covers eight controls ×three modes ×two OS preferences, live cancellation,
nested full override, DOM identity/focus and the new probe negative control. Targeted
B5 indicator/selection/geometry cases cover affected adapter consumers. Full check and
fresh production JS measurement are recorded in the handoff; green checks do not waive
initial JS. Ledger remains373/466 classified,93 open B6–B9. Global CSS/Motion nested clocks,
first paint, live same-target cancellation/full→reduced, held-press disabled cancellation,
all applicable pages'120KB initial-JS budget and final goal audit remain OPEN.
