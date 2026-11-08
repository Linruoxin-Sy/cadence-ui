# Motion presets and component bindings

Status: parameter foundation implemented; component choreography and executor migration remain pending.

This document owns the target parameter assignments used by the individual
[component contracts](README.md). The [animation system](../animation-system.md) owns recipe
semantics, base tokens, execution modes and budgets. Preset names are design identifiers with
internal static bindings, not additional public APIs, registry items or `Recipe` union members.

## 1. Tokens, recipes, presets and bindings

| Term              | Responsibility                                                                    | Example                                    |
| ----------------- | --------------------------------------------------------------------------------- | ------------------------------------------ |
| Token             | A reusable authored value; defined once in the shared motion source               | `duration.fast`, `distance.xs`             |
| Recipe            | Allowed properties, cause, continuity and mode/cancellation semantics             | `geometry.resize`, target `text.change`    |
| Preset            | A reviewed selection of tokens and recipe options for a particular visual purpose | `geometry.compact`                         |
| Component binding | Assign a preset and recipe to a real part and phase, with a cause and owner       | `button.label.replace` uses `text.replace` |

A binding does not create a recipe. A recipe does not determine an entire component's choreography.
Two components may share a preset while using different parts, directions, ordering or triggers.
Component contracts own those choices; this file owns their reusable parameter values.

The Target forms column is the canonical vocabulary for the internal reference checker. A suffix
distinguishes the designed property/engine form, not a newly installable resolver option. In particular,
`state.color/surface` covers scoped background/border/shadow paint, `state.color/foreground` covers
text or currentColor glyph paint, and `state.color/surface-foreground` coordinates both. A surface-only
binding cannot satisfy Text colour. Native entries describe delegation rather than a Cadence recipe.
Component prose may narrow a form (for example opacity-only surface presence), never widen it.

## 2. Shared parameter source and distribution

The authored runtime values and preset definitions live in
`registry/cadence/lib/motion.ts`, consistent with the existing tokens-only rule. CSS output and
Motion/engine adapters must derive from that source. Do not add a second set of constants in
`registry/cadence/<id>/motion.ts`, MDX, site previews, theme CSS or a JSON animation database.
Component source may select a named binding/preset and supply measured targets or semantic direction;
it may not supply new literal durations, easing tuples, distances, scales or physical constants.

Keep bindings statically addressable and dependencies explicit. A component selecting a colour preset
must not import a runtime map of all 59 components or load diff, measurement and reel renderers.
The authoring location does not authorize a larger consumer bundle. Splitting the shared source later
requires a separately documented layout decision and identical single-source and budget guarantees.

Documentation remains split by responsibility: the component file records `binding -> preset ->
recipe` references without copying numeric values; this catalogue records the preset assignments.
The parameter layer uses individually exported preset objects in `lib/motion.ts`. A static
`bindMotionParameters(preset, form)` selects one of that preset's exact forms;
`resolveMotionParameters(binding, mode, options)` resolves parameters only. These are internal
building blocks, not additional `Recipe` identifiers or executors. A resolved transition cannot
establish that text diffing, reels, geometry measurement/clamping, cancellation or a component
integration exists. No public `motionPreset` prop or engine selector is introduced.

The CSS compatibility block is generated from that same TypeScript source. The generator loads
the type-erased module using the installed TypeScript compiler; it requires neither Node's optional
TypeScript stripping nor modifications to dependencies. `registry:check` compares every generated
copy with the authored source, including the case where all three copies drift together.

### 2.1 Authored inputs and effective compatibility outputs

Duration inputs use `--motion-source-duration-<name>`; the existing
`--motion-duration-<name>` variables remain effective CSS clocks. Other parameters are authored
inputs: `--ease-cadence-<name>`, `--motion-spring-<name>-duration` / `-bounce`,
`--motion-distance-<name>`, `--motion-scale-<name>`, `--motion-rotation-half-turn` and
`--motion-stagger-<name>`. Names use kebab case. CSS output derives from the same module as JS.
Easing utilities use dynamic theme variables rather than inlining the curve.

Generated duration outputs reserve the identity suffix `+ 0s * 1` inside `calc()`. Transported
effective overrides reserve `+ 0s * 2`. These valid CSS identities do not change timing. They identify
library-owned output syntax after CSS variable substitution; they are not numeric heuristics or
an inverse mode calculation. Consumer duration expressions must not use these reserved suffixes.
An unmarked legacy duration override is already effective: preserve it exactly, without applying
mode/timeScale again. It takes precedence over authored duration input. None and zero recipe clock
still settle immediately. This compatibility entry does not make an authored duration twice as slow;
consumers wanting inherited mode/clock scaling should tune the new source-duration input instead.
Legacy reduced spring/tween differences remain the installed recipe contract, not v2 completion.

Providers transport their parent's inputs through private CSS fallback variables; the provider's
own class remains the local override surface. Portals transport the owning scope's inputs and
effective overrides through the same fallback variables, so local popup class/style overrides still
win. Only actual provider/portal boundaries reset those aliases; ordinary DOM descendants retain
native CSS inheritance. Generated rules live in the base layer, so Tailwind utility overrides win.
Explicit nested mode/clock overrides resolve from authored inputs, never a parent's generated
zero. A missing provider uses one shared document-root snapshot. Internal part adapters may pass
their real element ref to `useCadenceMotion(ref)` to resolve a deeper local scope. Base UI parts use
`useCadenceMotionScope(callerRef)`: its attach signal reconnects delayed/replaced portal nodes, and
its cleanup stops observation immediately while preserving caller and render refs. A scope snapshot
is published to that owned part's React subtree without a DOM wrapper, including custom render
children. Nested portals therefore inherit the actual part's committed parameters. A physical
portal descendant resolves from its nearest transport boundary rather than unrelated body/root
overrides; ancestor origin-2 values are already-effective inputs, while its own transported output
is ignored to prevent feedback after an override is removed. A scope snapshot
does not imply that all legacy components have migrated their part-level bindings.

Computed style is sampled only after a client commit or a scope/environment event. Root/scoped
class/public-token style changes, `data-motion`/`data-theme`/`data-color-scheme`, font context/loading,
head stylesheet DOM/load changes and viewport resize refresh snapshots. Transform/opacity frame writes
and private transport writes do not resample tokens. A stylesheet
edited solely through CSSOM, or an application-specific theme signal without a DOM/resize event,
must dispatch the explicit `refreshCadenceMotionTokens()` signal; this also covers unrelated CSS
media/pseudo-class changes without a committed owner update. No CSSOM monkeypatch, per-frame
polling or global per-glyph scan is used. The updated theme is an explicit provider registry
dependency; source-only consumers must update the generated theme together with the scope adapter.
Inputs must resolve to finite non-negative times, lengths or scalar values in their documented unit;
percentage geometry is not a parameter input. Cubic-bezier curves and standard CSS easing keywords
are supported, not arbitrary steps/linear() functions. Relative font lengths are resolved in the
committed owner's font context. Portal transport uses normalized seconds/pixels/degrees, and a local
public override establishes its own context. A bounded isolated shadow probe in the document head
resolves calc/font units without inserting children into the sampled part. Unrepresentable physics
or native-unit conversions throw rather than return Infinity or Motion fallback physics.
Scope parameter correctness does not establish S04 active-writer cancellation.

`resolveGeometryBounds` reports an infeasible interval when available space is below the measured
intrinsic/readability minimum; it never lowers that minimum to fabricate an animatable range.
The owning geometry controller must use immediate native layout/valid overflow in that case.
This parameter result is not a rendered clamp. Theme-owned `--animate-*` clocks are outside the
CSS recipe generator's ownership and remain intact when tokens are regenerated.

## 3. Default preset catalogue

All times here are full-mode, unit-clock values. `visualDuration` describes spring feel, not an exact
completion deadline. Existing token values remain owned by animation-system §2.2; numbers below make
the assignments reviewable. The following parameter tokens exist in the shared source; component
adoption and rendered geometry enforcement remain rollout work:

| Target token         | Authored value                  | Reason                                                               |
| -------------------- | ------------------------------- | -------------------------------------------------------------------- |
| `spring.sizeCompact` | visualDuration 280 ms, bounce 0 | Short inline/control size changes                                    |
| `spring.sizePanel`   | visualDuration 360 ms, bounce 0 | Bounded popup or panel content changes                               |
| `rotation.halfTurn`  | 180 degrees                     | A documented disclosure chevron orientation; not a general icon spin |

The size springs are alternatives to `spring.morph`, not replacements for its existing value. Both must use the
same velocity-continuity conversion and rendered-size clamping as `geometry.resize`. They may enter
the shared source with parameter and token-source tests. Their pure resolver does not establish
rendered-size clamping, provider overrides or a component migration. Existing legacy recipe
assignments remain unchanged, and the CSS compatibility block retains its existing exposed values.

| Preset key            | Recipe / execution contract                                            | Parameter assignment and intended scope                                                                                                                                                         | Target forms                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `presence.inline`     | `data.transition`, one-shot opacity form                               | `duration.fast` (160 ms), `ease.out`; local newly inserted content, no travel or scale                                                                                                          | `data.transition/opacity`                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `presence.surface`    | `enter.pop`                                                            | `duration.base` (220 ms), `ease.out`; opacity and optional `scale.in` to 1; no automatic child entrances                                                                                        | `enter.pop/surface`, `enter.pop/opacity`                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `presence.popup`      | `popup.anchored`                                                       | `duration.base`, `ease.out`; opacity, optional `distance.xs` travel from resolved side or `scale.in`; component chooses the property subset                                                     | `popup.anchored/presence`                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `presence.tooltip`    | `popup.anchored`, starting and ending opacity forms                    | `duration.instant` (100 ms), `ease.out`; opacity on entry/exit, no travel by default; does not change open/close intent delays                                                                  | `popup.anchored/opacity-enter`, `popup.anchored/opacity-exit`                                                                                                                                                                                                                                                                                                                                                                                                                |
| `presence.menu`       | `popup.anchored`                                                       | `duration.fast`, `ease.out`; opacity with optional `distance.xs` on the popup surface; no item stagger                                                                                          | `popup.anchored/presence`                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `presence.sheet`      | `popup.anchored` / existing sheet adapter                              | `duration.slow` (320 ms), `ease.out`; edge-directed translation of the surface; distance comes from its own measured extent                                                                     | `popup.anchored/edge`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `presence.exit`       | `exit.fade` or the documented ending phase of `popup.anchored`         | `duration.fast`, `ease.in`; opacity out, zero inherited entrance delay; a component must identify the actual recipe form                                                                        | `exit.fade/opacity`, `popup.anchored/ending`                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `presence.sheet-exit` | Ending phase of `popup.anchored`; optional `exit.fade` on the backdrop | `duration.base`, `ease.in`; return to the originating edge; backdrop does not own panel geometry                                                                                                | `popup.anchored/edge-exit`, `exit.fade/opacity`                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `state.color`         | Target `state.color`                                                   | `duration.fast`, `ease.out`; explicit background/text/border/fill/stroke and declared scoped shadow feedback, no stagger                                                                        | `state.color/surface`, `state.color/foreground`, `state.color/surface-foreground`                                                                                                                                                                                                                                                                                                                                                                                            |
| `feedback.press`      | `feedback.press`                                                       | Existing `spring.press`, `scale.press`; only the component's chosen feedback layer, stable hit target and popup anchor                                                                          | `feedback.press/scale`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `state.indicator`     | `state.morph`                                                          | `spring.snappy` (260 ms, bounce 0); component selects opacity, `scale.in`, measured thumb placement or `rotation.halfTurn` explicitly; no arbitrary SVG path morph permission                   | `state.morph/indicator`                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `layout.reflow`       | `layout.move`                                                          | `spring.smooth` (400 ms, bounce 0), physics-defined retargeting; visible stable identities only                                                                                                 | `layout.move/position`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `layout.compact`      | `layout.move`                                                          | `spring.snappy`, converted for velocity continuity; compact sibling displacement                                                                                                                | `layout.move/position`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `layout.sidebar`      | `layout.move`, target size-linked projection form                      | Target `spring.sizeCompact`; the offcanvas transform is derived from the same space-progress owner as `geometry.compact`, not a separately timed spring                                         | `layout.move/size-linked`                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `layout.selection`    | `layout.shared`                                                        | `spring.smooth`, physics-defined; one persistent indicator per single active selection scope                                                                                                    | `layout.shared/selection`                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `geometry.content`    | `geometry.resize`                                                      | `spring.morph` (420 ms, bounce 0), physics-defined, clamped; ordinary content-driven size                                                                                                       | `geometry.resize/measured`                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `geometry.compact`    | `geometry.resize`                                                      | Target `spring.sizeCompact`, same continuity/clamping; inline labels, counts and bounded controls                                                                                               | `geometry.resize/measured`                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `geometry.panel`      | `geometry.resize`                                                      | Target `spring.sizePanel`, same continuity/clamping; bounded popup or panel changes                                                                                                             | `geometry.resize/measured`                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `text.replace`        | Target `text.change`                                                   | Changed units exit with `duration.instant` / `ease.in`, enter with `duration.fast` / `ease.out`; replacement opacity only, no travel/scale/blur, built-in display bindings use no stagger       | `text.change/changed-runs`                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `number.roll`         | Revised `number.roll`                                                  | `spring.smooth`, bounce 0; stable place-value reels, target direction and bounded travel; renderer and continuity adapter pending                                                               | `number.roll/reels`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `number.compact`      | Revised `number.roll`                                                  | `spring.snappy`, bounce 0; compact counts; same place-value semantics and continuity as the standard reel                                                                                       | `number.roll/reels`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `content.switch`      | `data.transition`, local directional content form                      | `duration.base`, `ease.out`, `distance.xs`; opacity and translation on the owned content paint only; axis/sign follow semantic activation order and direction                                   | `data.transition/directional-content`                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `content.month`       | `data.transition`, calendar month-grid form                            | `duration.base`, `ease.out`, `distance.sm`; opacity and translation of the actual month grid, with calendar/RTL direction; no per-day entrance                                                  | `data.transition/month-grid`                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `data.update`         | `data.transition`, one-shot or documented data-engine form             | `duration.base`, `ease.out` for one-shot/Recharts forms; Embla uses the documented attraction-unit calibration and option precedence, not a CSS ease; never introduces a second geometry writer | `data.transition/opacity`, `data.transition/embla`, `data.transition/recharts`                                                                                                                                                                                                                                                                                                                                                                                               |
| `data.progress`       | `data.transition`, determinate progress form                           | `spring.snappy`, bounce 0; share a bounded monotonic phase with `number.compact`; incompatible retargets show the latest readout immediately, without delaying semantics                        | `data.transition/determinate`                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `status.loop`         | `data.transition`, continuous form                                     | Existing framework `--animate-spin` / `--animate-pulse` theme clock; only while active and visible; no recipe timeScale clock substitution                                                      | `data.transition/continuous`                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `handoff.value`       | `handoff`                                                              | `spring.smooth`, physics-defined, real visible origin; destination-only fallback when origin is unavailable                                                                                     | `handoff/value`                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `scroll.navigate`     | `scroll.navigate`                                                      | `duration.page` (450 ms), `ease.inOut`; explicit navigation only, user input cancels                                                                                                            | `scroll.navigate/scroll`                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `engine.native`       | Actual named primitive/native engine, not a new recipe                 | Native direct manipulation or existing engine-owned settling; no Cadence duration overlay; the component contract must identify engine, mode adapter and cancellation path                      | `native/css-layout`, `native/embla`, `native/recharts`, `native/base-ui-combobox`, `native/cmdk`, `native/base-ui-context-menu`, `native/base-ui-drawer`, `native/base-ui-menu`, `native/base-ui-preview-card`, `native/input`, `native/input-otp`, `native/base-ui-popover`, `native/resizable-panels`, `native/base-ui-scroll-area`, `native/base-ui-select`, `native/base-ui-slider`, `native/table`, `native/textarea`, `native/base-ui-toast`, `native/base-ui-tooltip` |

The `layout.selection` assignment refines the general v2 layout default; the current runtime's
`layout.shared` morph spring remains a migration baseline until implemented. Similarly, a number
preset is not proof of a reel renderer or continuity support. `engine.native` cannot exempt authored
autonomous movement from modes or budgets; it distinguishes engine ownership from a competing writer.

Bindings must name one actual recipe/form for each property. For example, a Base popup's CSS ending
phase may remain `popup.anchored`, whereas a separately animated backdrop may use `exit.fade`.
Listing both possibilities in this catalogue does not authorize declaring both in metadata when only
one executes. Opacity-only subparts may use a subset of an existing recipe's properties. New spatial
forms or arbitrary path, radius, padding or font-size motion require a reviewed recipe change.

`enter.pop/opacity` is the exact surface form for a stationary fade, including backdrops; use
`enter.pop/surface` only when the component actually chooses the scale envelope. An inherited
binding uses its owner's preset and property subset. A composition choosing a different preset
must declare that as an override at the existing owner, with a reason and mode/cancellation proof;
it cannot silently call a second writer an inherited effect. Text displacement to make room for a
changed run is layout ownership, not travel added by `text.replace`. A spatial replacement needs a
separately reviewed preset instead of relying on an unspecified optional distance.

`data.update` does not implicitly include local content travel. Use `content.switch` or
`content.month` for those explicitly bounded forms. Directional paint is separate from the size host,
native popup positioner, scroll position and any selection marker. A reversal cancels the previous
one-shot path and retargets from the currently displayed offset/opacity without remounting semantic
content; it does not require velocity continuity. A collision or passive layout correction settles
placement immediately instead of inventing a navigation direction.

For `data.progress`, a shared bounded monotonic transaction phase coordinates compatible fill/reel
travel; that phase is animation progress, never an interpolated business percentage. Both participants
resolve their destinations from the same committed revision. If the visible fill is at 60 while the
committed value changes from 100 to 80, the fill still moves toward 80 while the readout's semantic
trend decreases. Do not force them to claim the same direction. When directions or an interrupted
two-cell reel cannot safely share the phase, show the latest readout immediately and retarget the fill
independently from its current presentation. Do not fabricate intermediate values, add reel cells or
retry a queued obsolete transaction. The semantic value is always current.

### 3.1 Effective modes and clock ownership

Each preset's full-mode parameters above are subject to these property-specific results. A component
action may use a narrower documented subset, but cannot retain a property that the mode removes.

Select an eligible committed cause before resolving a preset's clock. Under the
[committed-change contract](../animation-system.md#coordinating-one-committed-change), rejected
requests and uncommitted intermediate targets create no action in any mode. Same-target renders
preserve eligible in-flight work, while native reset/restoration establishes current control paint
immediately in full, reduced and none. A delayed direct-input echo retains the direct-operation
path; unknown correspondence does not grant a programmatic spring or readout reel. These gates do
not change the preset's duration, add another zero-time preset or bypass same-target mode/clock
cancellation. A later genuinely independent programmatic revision remains eligible under its binding.

For `state.color`, the assigned tween is conditional on the colour owner's current state and readable
intermediate paint. When that owner contains native DOM focus (including focus-within) or carries
invalid state, apply its entire declared paint set immediately in full and reduced as well as none;
cancel a running colour transition before paint. Establishing the focus outline alone while the same
owner's foreground/background keeps tweening does not satisfy this rule. Other independent colour
owners may continue their eligible transitions. Pointer hover, selected state and an
`aria-activedescendant` highlight are not themselves DOM focus; resolve the actual owner rather than
disabling every item in the collection. The safe unverified-palette fallback is also immediate.
These conditions narrow the existing preset; they require neither another timing token nor a second
focus/invalid writer. Leaving a restricted state never replays updates suppressed while it was active.

The [rendered-colour contract](../animation-system.md#35-colour-feedback) also covers different
owner clocks and a moving selected surface behind text. `state.color` does not certify that palette,
and `layout.selection` is conditional on a readable path. When the combination is unsafe or unknown,
use immediate placement/paint for the affected known owners; never shorten a duration as a substitute
for readability, add a second foreground writer or override a nested provider. Under reduced/none,
marker geometry is already immediate; any remaining colour feedback must still pass that combination.

| Preset family                            | Reduced                                                                                                              | None                                                                                            | Full-mode interruption                                                                                                 |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Presence and directional content         | Allowed opacity uses a short tween; all travel/scale is removed                                                      | Semantic visibility/geometry immediately, with native lifecycle completion                      | Retarget current paint; reopening invalidates old exit completion                                                      |
| `state.color`                            | Eligible paint uses the tween clock multiplied by `reducedDurationScale`; focus/invalid or unsafe paint is immediate | Target values immediately; no duration/delay survives                                           | Latest committed colour wins; focus/invalid cancels the owner's flight; theme coordination may suppress redundant work |
| `feedback.press`                         | No scale; any colour response belongs to the separate `state.color` binding                                          | Final unscaled presentation; native activation is unaffected                                    | Native pointer/key owner governs cancellation; no extra scale writer                                                   |
| `state.indicator`                        | Geometry/rotation/scale is final immediately; changed glyph opacity may use the shared short tween                   | Final indicator immediately                                                                     | One local controller, no queued glyphs or state changes                                                                |
| Layout, measured size, scroll navigation | Destination geometry immediately, no delayed tween                                                                   | Destination immediately unless direct input has already cancelled navigation/settling           | Layout/size preserve reviewed velocity; scroll uses its explicit cancellation contract                                 |
| `text.replace`                           | Only changed-part opacity; no travel, blur or stagger                                                                | Final exact text immediately                                                                    | Retained identity survives; newest diff replaces the old target, not the semantic string                               |
| Numeric reels                            | Final formatted value immediately, no roll or delay                                                                  | Final formatted value immediately                                                               | Retarget the bounded reel presentation under §5; no intermediate-value queue                                           |
| `data.update` / `data.progress`          | Geometry is immediate; opacity-only data feedback may retain a short tween                                           | Engine/one-shot terminal target before paint                                                    | The documented data adapter owns all affected geometry; progress shares one presentation transaction with its readout  |
| `handoff.value`                          | No flight; changed-part opacity at the destination only                                                              | Final destination text/geometry immediately                                                     | Captured visible origin and current destination remain valid, otherwise local text fallback                            |
| `status.loop`                            | Static equivalent status; stop the existing animation                                                                | Static equivalent status; stop the existing animation                                           | Active/visible condition and theme clock own the loop; reduced/none always take precedence                             |
| `engine.native`                          | Required direct manipulation remains immediate; stop the documented autonomous decorative/inertial part              | Direct input remains available; cancel only authored/autonomous clocks addressed by the adapter | Native engine retains gesture state, capture and geometry ownership                                                    |

Zero recipe time is a separate timing decision, **not** the None column. Resolve the effective mode's
target first, then reach that target immediately with no recipe duration or delay. In full mode a
held press still reaches `scale.press`; release reaches rest immediately. Reduced/none remove that
decorative scale. A checked thumb, selected marker, folded panel or native swipe retains its correct
state/placement in all modes. Zero cancels an existing recipe writer even when its target is unchanged;
it does not clear a held gesture, cancel a theme-clock loop or bypass native intent/lifetime timers.
The documented native engine adapter determines which autonomous clocks also observe zero.

Resting paint is the current authored semantic paint, not a universal opacity of 1 or transform of
none. Disabled opacity, caller transparency and required placement survive entry completion, loop
cancellation and mode changes. One owner composes the presence/activity envelope with that resting
paint, using a safe separate layer or its resolved target; two opacity writers on one node are not
permitted. Disabled-opacity changes are immediate unless a component records a separate approved
opacity action; `state.color` does not implicitly animate opacity. Only an actual exit targets hidden
paint. Reduced/none loop cancellation must restore the current static equivalent, not freeze a
half-faded loading shape or overwrite caller paint.

For `status.loop`, "pause while hidden" means release the active visual writer and keep the current
static equivalent. A still-active owner may start a fresh theme-clock phase when full-mode visibility
returns; it does not resume the old phase, replay presence or process missed status revisions. A
completed, removed or still-reduced owner cannot restart from a stale visibility/presence callback.
This is the same loop policy for Spinner, Skeleton, loading text and composed status parts, with their
individual active conditions retained; it does not turn zero recipe timeScale into a loop stop.

For reduced opacity-only remnants of spring presets, use `duration.fast` with `ease.out`, scaled by
`reducedDurationScale` and the effective recipe clock; do not run a residual spring on layout, rotation
or scale. Existing tween presets retain their assigned tween with the same multiplier. `text.replace`
retains its separate enter/exit tween assignments. The word "short" in component mode tables refers
to this resolution, not an unregistered local duration. Zero is resolved before spring conversion.

`engine.native` has no blanket recipe-clock promise: each native adapter must state which autonomous
clock, if any, consumes timeScale. Provider changes do not cancel capture or jump away from a live
pointer/keyboard operation. Native browser scrolling is still direct operation; authored smooth scroll
is separately governed by `scroll.navigate`. Referencing `engine.native` never declares a recipe.

The native adapter's cancelled inertia means the explicitly named engine's autonomous settling, such
as Embla release or a Drawer snap. It does not mean cancelling browser/OS touch momentum or native
scroll-snap behavior in ScrollArea. Those remain direct native operation in every mode; only an
authored scrolling controller is governed by its own recipe. An adapter must identify its actual
clock before claiming that reduced, none or zero stops it.

Zero presentation delay does not override an upstream intent delay, Toast lifetime/pause rule or
application-owned timing. Such state-machine timing is not multiplied by a motion preset or provider
clock. Once the primitive commits visibility/state, its authored presentation follows the mode table;
no animation-only hold may extend that lifecycle after native completion is available.

For a positive-to-positive clock change with no new semantic target, finite CSS/WAAPI/Motion tweens
and duration-defined indicator/press springs keep their captured clock until completion; the next committed action uses the new clock. Physics-backed
layout/size/reel controllers and the explicit scroll controller retime from current presentation
through their reviewed adapter, without replaying initial state or adding entrance delay. Native
data/gesture engines and Calendar's month-grid WAAPI adapter retain the documented exceptions in
section 3.2 and the component file; the calendar grid settles on a clock change without replay.
A mode downgrade or a change to zero always cancels the prohibited writer immediately, including
same-target CSS work; it cannot wait for a transitionend event that cancellation may prevent.
Returning from zero or reduced to a positive full clock establishes a baseline and does not replay
settled work. Token/theme changes that alter geometry or paint targets follow their environment/state
contract, not this clock-only rule. These are target executor obligations, not runtime claims.

### 3.2 Existing data-engine clocks

| Data form        | Effective full-mode clock                                                                                                                                                          | Preserved boundary                                                                                                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local opacity    | Preset tween duration/easing and provider clock                                                                                                                                    | No engine geometry or implicit translation                                                                                                                                      |
| Recharts data    | Cadence controller progress uses the data preset duration/easing and provider clock                                                                                                | Series opt-out remains; series duration/delay/easing cannot override the controller or mode ceiling                                                                             |
| Embla navigation | Shared `carouselClock.unitsPerSecond` converts the default authored duration; explicit effective `opts.duration` including breakpoints retains its documented full-mode precedence | These are attraction units, not elapsed milliseconds; native friction/target/velocity remain Embla-owned, release uses the same effective engine base, no CSS easing is imposed |

Calendar's month-grid adapter cancels and settles the current grid paint on any live clock change;
its next month revision uses `content.month`. Recharts preserves current progress and integrates
subsequent deltas with the new positive clock. Embla retains its existing full-mode attraction-unit
policy and explicit option precedence; its next autonomous operation reads the effective engine
base without reinitializing the engine. A clock edit cannot manufacture a month/data/navigation
revision. These adapter rules take precedence over the generic captured-tween default.

The [engine contracts](../animation-system.md#311-datatransition-for-embla-collections) describe the
actual adapters; the numeric default does not replace them. Reduced/none and zero recipe clock cancel
autonomous engine interpolation through those adapters without interrupting held direct input. Caller
plugins that animate or advance independently are explicit compositions: the plugin owner supplies
pause/stop and mode integration before claiming conformance. Cadence does not generically discover or
remove arbitrary plugin objects, and routing their engine calls through a zero clock alone does not
stop an automatic schedule.

Standalone planned `AnimatedText` retains the system's character-stagger default (`stagger.char`,
12 ms, with the final start delay capped at 120 ms after effective timeScale and no more than 20
simultaneously animated elements). Built-in `text.replace` bindings deliberately select no stagger so that
control labels and rapidly changing display strings arrive together. A component may opt into the
character rhythm only in its recorded binding; unchanged units never participate and reduced/none
always remove the delay. This is a binding policy, not a new caller-facing raw timing prop.

## 4. Selection, overrides and effective clocks

Resolve a binding in this order:

1. The component contract selects the part, semantic cause, actual recipe/form, preset and permitted
   property subset. A missing binding may use the system default only after that choice is recorded;
   a whole component may not claim completion by inheriting an unspecified generic animation.
2. The preset references shared tokens. Consumer theme/token overrides may replace exposed values
   within the documented property, clamping and budget constraints. CSS and Motion must resolve the
   same effective value, including local provider boundaries and portals; changing a CSS variable
   alone must not silently leave the JS executor on another clock.
3. Resolve provider/local clock inheritance using the existing public contract. Apply effective
   `timeScale` exactly once before physics conversion, and scale/clamp stagger to its budget.
   Native engine clocks remain native unless their documented adapter explicitly maps them.
4. Apply the mode ceiling: OS reduce cannot be bypassed; reduced removes spatial/layout/reel/stagger
   work, scales allowed tween clocks by `reducedDurationScale`, and stops continuous loops. None
   cancels every library-authored duration, delay and loop. A zero recipe clock settles recipe work
   immediately before physics conversion; continuous theme clocks still follow the separate loop rule.

Mode restrictions and geometry limits are not visual overrides. A preset cannot turn a reduced
width jump into a short width tween or re-enable a loop. Invalid non-finite/negative clocks are
rejected or resolved by the existing clock validation; no preset invents its own fallback timer.
Live downgrades cancel disallowed active writers before paint and resolve allowed feedback through
the new mode. A zero recipe clock cancels recipe writers; it does not replace the continuous theme
clock. Positive clock-only changes use section 3.1's executor policy; theme/token target changes
retain identity and follow their state/environment owner without replaying settled actions.

New component-specific parameter values are allowed through a named shared preset when existing
assignments cannot express the intended experience. Review the reason, full/reduced/none behavior,
interruption, CSS/JS equivalence and cost together. Update this catalogue and the affected component
bindings first; then implement all affected runtime/declaration/docs checks in the rollout. Do not
create 59 copies of an easing curve or use a new preset name to avoid a recipe's safety contract.

A composition-level assignment may refine an inherited owner without creating a new preset, but
record the upstream binding, replacement binding, cause and consumed child geometry together.
Do not infer an override from a general preset's intended scope: Popover explicitly selects
`geometry.compact`, and DatePicker inherits that same binding. The existence of `geometry.panel`
does not assign it to every popup. An actual override changes rhythm, never ownership, mode ceilings,
readability or native completion rules.

Resolve timing from the actual binding's selected form and phase. Sharing a duration token does not
make two recipes interchangeable: an opacity exit can use `ease.in` while an entry using the same
duration uses `ease.out`. Do not borrow an unrelated recipe's transition merely because its current
numeric duration matches. A CSS adapter and its cancellation/ownership guard must use the same
effective property set, duration, easing and delay, including local token overrides and mode/clock
resolution. Compare browser-equivalent CSS values, not raw authored spelling or unrounded floating
point values; timing-list repetition and functions containing commas retain native CSS semantics.

A genuine caller transition/animation family keeps its existing override authority. Ordinary
layout/paint classes and callbacks do not establish such a family. Known library owners with disjoint
properties compose their transition family once; an ownership check must not mistake that composition
for a caller override. The same duration with a different curve or delay is not the library's clock.
Indistinguishable computed values do not prove author provenance, so do not promise arbitrary CSS
origin detection. Use the explicit owner boundary and observable native behaviour; inspection must
not strip live styles/classes, restart a native animation, scan every stylesheet or add frame polling.
These are target adapter and verification requirements, not new presets or public settings.

## 5. Geometry, text and numerical limits

Preset selection never changes natural content ownership. Observe natural content and size one
separate host per axis, with no render-time reads or per-frame glyph measurement. Passive viewport,
font or ancestor reflow resolves immediately. Components specify destination-width reflow versus
continuous reflow; text is never scaled to simulate size. Clamp rendered geometry to valid intrinsic,
closed and available sizes; closing disclosure height may reach zero. Temporary clipping belongs only
to the content viewport, never to focus outlines or portal positioning. Measurement and writes use
the same box/coordinate space under [the system size rules](../animation-system.md#34-measured-size-and-position);
transformed viewport rectangles are not directly writable CSS sizes.

Destination-width reflow is a measurement choice, not permission to crop newly committed content.
If an intermediate smaller shell would hide a required label, a focused control/caret or content
needed for the current action beyond the existing overflow/truncation policy, settle that axis
immediately or use an already valid overflow region. Do not introduce extra ellipsis, alter wrapping
or scale glyphs just to preserve an animation. An explicit disclosure may progressively reveal its
body, but focus into a still-clipped region forces sufficient geometry immediately.

For the same content revision, a compound parent and child must either delegate the affected axis to
one named owner or resolve coordinated destinations from the natural layout before either writer
starts. A parent must not treat every interpolated child frame as a new content event. If the final
constraints cannot be resolved without feedback, use immediate native layout for the dependent axis.
Measurement after hidden/zero-size recovery establishes a baseline; it is not a new entrance/resize.

The size preset ends in the current native sizing policy, not a permanently frozen measured pixel
box. Its executor follows the system's temporary-constraint release and transform-composition rules;
neither spring completion nor an immediate fallback may erase a newer caller style or required
placement. A valid empty destination is distinct from an unavailable hidden measurement. These rules
change no spring assignment or duration and require no component-local cleanup timer.

Text decomposition also preserves existing typography, white-space and inline flow under
[the changed-text contract](../animation-system.md#36-changed-text); safe run or immediate rendering
is preferable to introducing a new line-break policy for animation.

Reels retarget their current presentation without replaying an update queue. A place that is unchanged
stays still. Direction derives from semantic value change, not lexicographic strings or a forced
growth story. Carry, precision, locale, affix and digit-count changes retain the system's contract.
Neither a spring profile nor a bounded fallback may animate the entire unchanged text again.

The default reel is a bounded two-cell presentation for each changed place: the departing and target
digit, clipped to one line. Each revision travels at most one cell height toward its target; it does
not tour intermediate digits or add full turns. Under `trend`, an increasing numeric value sends the
old digit upward and the new digit in from below; a decreasing value reverses that direction, including
negative values. Explicit up/down uses that visual direction. Explicit shortest compares the forward
and backward decimal-cycle distances of each changed digit and chooses the shorter direction, with
an up tie-break. It still displays only departing/target cells, not the intermediate digits. Shortest
does not override the whole-value trend unless the caller explicitly selected it.

Retarget from current offsets. A same-direction update may keep velocity under the shared reviewed
physics adapter; when semantic direction reverses, discard opposing velocity at the current position
so the display does not first travel in the wrong direction. Clamp the rendered reel to its active
cell lane and rebase only visually equivalent cells; do not reset the digit to a previous value. If a
new target cannot preserve a readable bounded presentation during interruption, show that latest
formatted value immediately rather than adding more turns or a backlog. A
formatter/locale-only revision settles the numeric lane and changes only necessary affixes/formatting,
without a growth/decline story. NaN/Infinity and unsupported digit systems display their exact formatter
output immediately. Nonfinite values are never fed to physics. These are target renderer requirements,
not a claim that the existing `number.roll` resolver supplies them.

### 5.1 Numeric identity and formatting decisions

The renderer receives the original supported numeric value and the existing display policy; it never
reconstructs a quantity from rendered DOM or a string. Built-in integration preserves that policy's
exact output. In particular, a raw React numeric child keeps `1000`, `1.234567`, `0` for negative zero,
and `1e+21` where that is the existing output; default Intl grouping, rounding, sign display or exponent
expansion must not silently replace it. Existing format APIs keep their own formatting. An output
that cannot be safely decomposed remains exact and immediate. The planned standalone AnimatedNumber's
explicit formatter remains governed by its API, not a change to existing component defaults.

Existing conditional, placeholder and falsy-content branches run before renderer selection, as in
[the changed-text contract](../animation-system.md#36-changed-text). Keep the existing font metrics;
do not add tabular-nums automatically to make reels easier. Comparison uses values of the same
supported numeric domain, not a lossy conversion of a large integer to Number. These decisions apply
to every numeric binding:

| Revision                                                                             | Required presentation                                                                                                                                                                   |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Value changes but formatted output is unchanged                                      | Update semantic data only; no reel, affix effect or size measurement solely for that value                                                                                              |
| First value, string/number renderer change, or unsupported numeric-domain conversion | Exact current formatted baseline immediately; no assumed zero/source value                                                                                                              |
| Positive/negative value change with stable notation                                  | Compare the whole numeric values for trend, including negative-to-negative changes; roll only changed decimal places                                                                    |
| Cross zero                                                                           | Use whole-value trend; sign insertion/removal is changed affix text and never an extra digit column                                                                                     |
| Negative zero versus positive zero                                                   | Equal magnitude supplies no trend; preserve formatter sign policy and change only displayed sign/affix text if needed                                                                   |
| Precision or rounding configuration changes                                          | Formatting revision: settle numeric columns immediately, preserve shared place identities where valid and update only affected affixes; no simulated value growth                       |
| Same formatter, changed digit count or rounded carry                                 | Preserve surviving units/tens/fractional identities; a newly present column enters from its own bounded edge without inventing a prior zero, and a removed column has no semantic value |
| Stable percentage/currency/unit notation                                             | Compare original values and keep the same documented formatting scale; affixes are text, with one coordinated shell owner                                                               |
| Compact suffix, exponent, currency/unit or formatting scale changes                  | Settle the numeric lane immediately and replace only changed affixes; a mantissa in a new scale is not the old place-value reel                                                         |
| Locale, numbering system or direction changes                                        | Re-establish exact formatting/layout immediately; safe changed affixes may use text replacement, never a fictitious trend or cross-script digit morph                                   |
| NaN, Infinity, unsupported digits/parts or an unsafe formatter                       | Exact formatter output immediately; no physics, inferred parsing, digit loss or whole-label fallback fade                                                                               |

Existing rounding/sign/currency options stay authoritative; motion does not choose business precision
or silently round large values. BigInt and non-Latin rolling support require explicit renderer/API
evidence before being claimed; otherwise their valid formatted display remains immediate. Currency
symbols, accounting parentheses, grouping, decimal markers and bidi isolation are preserved. Never
reverse digit order to implement RTL; the formatter determines logical order and layout, while reel
travel is vertical. The numeric output remains current and singular for accessibility and copying.

Both number presets use the [readout cause gate](../animation-system.md#37-changed-numbers) before
starting a reel: query/filter-derived counts and direct scrubbing are immediate in all modes, including
their delayed accepted echoes. A known independent revision may still roll under the component's
binding. Editable contexts use the [native text boundary](../animation-system.md#36-changed-text) and
never acquire reels merely because the supplied child has a numeric type. These are applicability
rules, not additional presets, duration values or runtime availability claims.

### 5.2 Shared work limits

All bindings inherit [the system budgets](../animation-system.md#7-performance-budgets-and-implementation-rules):
existing per-item source ceilings, consumer/runtime/page limits, real-device frame rate and CLS.
The 20-element concurrency limit is for stagger scenarios, and the 400 ms limit is total stagger,
not the maximum duration of every animation. Components may set stricter visible-work bounds. On
overflow, reduce the moving set or show the latest final state; never delay semantic data or grow a
backlog to fit an animation budget.

The following are target shared renderer work limits, not proof of measured performance. They belong
in the same future shared source and may be tightened per component; relaxing them requires review
and measurement. A budget fallback never truncates content or delays its accessible value.

| Target limit              | Bound                                                                                                                                                                         | Overflow behavior                                                                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Automatic collection work | At most 50 participating collection visuals (members, distinct outgoing copies and participating shells/markers) in one known scope, including still-active earlier revisions | Apply the affected collection presence/layout immediately; preserve all semantic items and native layout, without a queued batch               |
| Changed-text moving set   | At most 64 changed graphemes per owned slot/revision and across one known coordinated content transaction, grouped into safe shaping runs                                     | Apply affected text immediately; retained content does not replay                                                                              |
| General text diff input   | At most 2048 graphemes per compared owned display string; streaming uses the append fast path                                                                                 | Show final affected content immediately; code/large-document owners may work on bounded visible lines, never split a shaping run merely to fit |
| Middle-diff work          | At most 4096 candidate comparisons after prefix/suffix trimming                                                                                                               | Abort the visual diff and commit final affected text; no synchronous quadratic work beyond the cap                                             |
| Numeric moving set        | At most 12 changed place-value columns per numeric display and across one known coordinated content transaction                                                               | Show the complete final formatted value immediately; never drop significant digits                                                             |
| Chart data interpolation  | At most 200 participating samples/marks in one chart, including still-active visible series from earlier revisions                                                                              | Commit final data geometry immediately; do not resample, omit data or queue the excess                                                         |
| Pending targets           | One latest committed target per owner                                                                                                                                         | Replace the obsolete target; no queue of intermediate text, digits or measurements                                                             |

The collection bound is a target for the shared coordinator; it is not an implemented runtime
parameter/export or a measured performance allowance. Count the members whose automatic collection
presence, position or size presentation actually participates, including retained siblings measured
or projected to move. Presence plus position/size on the same member visual counts once, not once
per binding or property; this never permits competing writers on a property. A retargeted stable
member counts once; a distinct outgoing decorative copy also occupies capacity until retired.
Count active work from earlier revisions in that same scope,
not just the new commit. A single whole-group opacity envelope is one participant, not every
descendant. A collection shell/selection marker with its own writer is counted as its own visual
when it participates; nested representations of the same member do not create fresh allowances.

Determine eligibility from the known rendered/registered identities or the existing virtualizer's
visible range before per-member layout reads or retained-copy allocation. Bounded collection may
stop at limit + 1 and reject the effect; measuring every row first and then falling back is not
bounded work. At the bound, only a set whose retained and proposed work still fits is eligible.
Above it, settle the affected automatic collection transaction immediately, releasing superseded
decoration without removing real content, changing pagination or waiting for capacity. Manual
transforms, pagination and virtualisation are not unlimited exemptions: a composed adapter must
declare its own bounded visible working set, one placement owner and independent performance proof.
Without that adapter, use immediate native layout and content.

The counting unit follows the actual collection adapter: payment rows in DataTable, participating
source-line presentations in CodeBlock, avatar/count tiles and known-group image appearance in AvatarGroup, segments/keycaps/crumbs
or chips in their groups, and actual month-grid presentations in Calendar. One moved month-grid
table counts as one unit, not each date cell; independently animated cell/list parts count when
they have their own collection writer. Native Embla track geometry, scrolling and Recharts sample
interpolation retain their separate contracts; the chart limit is not replaced by this item count.
The independent text/reel limits still apply within a permitted collection, and the 20-element cap
remains specific to stagger concurrency. None of these bounds certifies full-page cost or frame rate.

For very long append-only messages, the append detector may use an explicit content revision/chunk
boundary instead of scanning or segmenting the entire historical message for each token. That boundary
is owned by the content integration, not inferred by recursively rewriting arbitrary child trees.
Diff work limits count analysis of the changed middle; linear input/formatting and DOM costs remain
subject to the component's own visible-work and full-page performance requirements.

The chart bound counts interpolation work, including line/area samples whose dots are hidden, not
only visible SVG node count. Count the proposed work together with still-active visible series from
earlier revisions in the same chart; a new revision or a different series does not reset the allowance.
Retargeting the same sample under one replacement controller counts once, including its source/target
endpoint pair; a distinct concurrently interpolated outgoing series/sample consumes its own capacity.
Establish the working set from the adapter's known series/data identities and lengths before
allocating interpolation state or invoking per-sample
animation work. This is separate from Recharts' necessary final data rendering, which is never omitted.
If safe counting is unavailable or the combined set exceeds the bound, settle the affected chart-data
transaction and release obsolete interpolation state; never queue it until older series finish.
Unknown/unbounded caller geometry uses an immediate safe engine target
or remains explicitly caller-owned; it cannot claim automatic bounded interpolation. The bound is a
conservative target pending real-device measurement, not a proven frame-rate threshold.

Unknown work is not zero work. A shared engine controller reached without a verified series/work
descriptor cannot acquire a zero-sample animation allowance; zero is valid only for a known empty or
nonparticipating set. The eligibility check must cover that entry path before any interpolation loop
starts. Do not invoke arbitrary React function children or formatters to discover hidden series, or
clone their trees for counting. Unsupported wrappers retain their existing caller boundary and exact
final data, without a claim of automatically bounded interpolation.

Enforce the input limit while segmenting, not after allocating or diffing the complete oversized
string. Known compound/list/update owners aggregate the moving-set limits across their changed slots;
splitting a large update into many small children must not bypass them. If no such shared semantic
owner exists, apply each local limit and the page budget rather than creating a global DOM scanner.
The text moving-set count includes outgoing and incoming changed graphemes; retained units are not
replacement effects, though their displacement still belongs to the layout owner's budget. Numeric
limits count changed place-value columns, including their bounded departing/target cells, not the
number of intermediate values in a numerical delta. Affix text follows the ordinary text contract.
Overflow settles the remaining affected slots immediately, in stable document order, without delaying
their semantics. Coalescing cannot keep an old target indefinitely: a superseded changed visual is
replaced, and a hidden/detached owner cancels rather than accumulating work for later playback.

The moving-set limits also bound live work across overlapping revisions in the same known owner scope.
Count still-moving incoming/outgoing units from earlier revisions together with the proposed new
moving set; a fresh revision does not reset that allowance. Retargeting an existing unit counts that
unit once, while distinct departing/incoming text units count separately as above. Release obsolete
decorative layers when their authority ends, not only when an old completion would have fired. If
the combined set cannot fit, settle superseded work and apply the affected latest content immediately;
do not defer a new revision until capacity becomes free. This bounds visual work without removing
caller-persisted panels, truncating message history or conflating independent list item identities.
Unchanged retained text and intentionally mounted inactive semantic content are not retiring visual
copies; they keep their existing identity and lifecycle.

Use visibility already known from the primitive, virtualizer or shared visibility controller. Do not
poll every component's rectangle or add a per-glyph observer to discover offscreen work. An active
native selection/copy range, browser find result or focused editing region takes precedence over
decorative text replacement: settle the affected visual when it cannot preserve the live range.
Accessible-name hiding alone does not remove outgoing text from copy; the renderer must prove one
current selectable/copyable value or use immediate exact text for that slot.
