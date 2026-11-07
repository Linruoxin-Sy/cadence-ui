# Motion presets and component bindings

Status: target design; implementation and verification pending.

This document owns the target parameter assignments used by the individual
[component contracts](README.md). The [animation system](../animation-system.md) owns recipe
semantics, base tokens, execution modes and budgets. Names in this document are design identifiers,
not additional exported APIs, registry items, CSS variables or `Recipe` union members.

## 1. Tokens, recipes, presets and bindings

| Term | Responsibility | Example |
| --- | --- | --- |
| Token | A reusable authored value; defined once in the shared motion source | `duration.fast`, `distance.xs` |
| Recipe | Allowed properties, cause, continuity and mode/cancellation semantics | `geometry.resize`, target `text.change` |
| Preset | A reviewed selection of tokens and recipe options for a particular visual purpose | `geometry.compact` |
| Component binding | Assign a preset and recipe to a real part and phase, with a cause and owner | `button.label.replace` uses `text.replace` |

A binding does not create a recipe. A recipe does not determine an entire component's choreography.
Two components may share a preset while using different parts, directions, ordering or triggers.
Component contracts own those choices; this file owns their reusable parameter values.

## 2. Shared parameter source and distribution

The future authored runtime values and preset definitions belong in
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
The exact TypeScript representation, generated CSS names and registry dependency entries remain
implementation work. No public `motionPreset` prop, engine selector or arbitrary settings object is
introduced by this design.

## 3. Default preset catalogue

All times here are full-mode, unit-clock values. `visualDuration` describes spring feel, not an exact
completion deadline. Existing token values remain owned by animation-system §2.2; numbers below make
the assignments reviewable. The new size token aliases are target additions only:

| Target token | Authored value | Reason |
| --- | --- | --- |
| `spring.sizeCompact` | visualDuration 280 ms, bounce 0 | Short inline/control size changes |
| `spring.sizePanel` | visualDuration 360 ms, bounce 0 | Bounded popup or panel content changes |

These are alternatives to `spring.morph`, not replacements for its existing value. Both must use the
same velocity-continuity conversion and rendered-size clamping as `geometry.resize`. They may enter
the shared source only with resolver, CSS/adapter and token-source tests. This document does not change
the retained runtime token example or CSS compatibility block.

| Preset key | Recipe / execution contract | Parameter assignment and intended scope |
| --- | --- | --- |
| `presence.inline` | `data.transition`, one-shot opacity form | `duration.fast` (160 ms), `ease.out`; local newly inserted content, no travel or scale |
| `presence.surface` | `enter.pop` | `duration.base` (220 ms), `ease.out`; opacity and optional `scale.in` to 1; no automatic child entrances |
| `presence.popup` | `popup.anchored` | `duration.base`, `ease.out`; opacity, optional `distance.xs` travel from resolved side or `scale.in`; component chooses the property subset |
| `presence.tooltip` | `popup.anchored`, starting and ending opacity forms | `duration.instant` (100 ms), `ease.out`; opacity on entry/exit, no travel by default; does not change open/close intent delays |
| `presence.menu` | `popup.anchored` | `duration.fast`, `ease.out`; opacity with optional `distance.xs` on the popup surface; no item stagger |
| `presence.sheet` | `popup.anchored` / existing sheet adapter | `duration.slow` (320 ms), `ease.out`; edge-directed translation of the surface; distance comes from its own measured extent |
| `presence.exit` | `exit.fade` or the documented ending phase of `popup.anchored` | `duration.fast`, `ease.in`; opacity out, zero inherited entrance delay; a component must identify the actual recipe form |
| `presence.sheet-exit` | Ending phase of `popup.anchored`; optional `exit.fade` on the backdrop | `duration.base`, `ease.in`; return to the originating edge; backdrop does not own panel geometry |
| `state.color` | Target `state.color` | `duration.fast`, `ease.out`; explicit background/text/border/fill/stroke and declared scoped shadow feedback, no stagger |
| `feedback.press` | `feedback.press` | Existing `spring.press`, `scale.press`; only the component's chosen feedback layer, stable hit target and popup anchor |
| `state.indicator` | `state.morph` | `spring.snappy` (260 ms, bounce 0); local tick/dot/thumb or icon transition; no arbitrary SVG path morph permission |
| `layout.reflow` | `layout.move` | `spring.smooth` (400 ms, bounce 0), physics-defined retargeting; visible stable identities only |
| `layout.compact` | `layout.move` | `spring.snappy`, converted for velocity continuity; compact sibling displacement |
| `layout.sidebar` | `layout.move`, target size-linked projection form | Target `spring.sizeCompact`; the offcanvas transform is derived from the same space-progress owner as `geometry.compact`, not a separately timed spring |
| `layout.selection` | `layout.shared` | `spring.smooth`, physics-defined; one persistent indicator per single active selection scope |
| `geometry.content` | `geometry.resize` | `spring.morph` (420 ms, bounce 0), physics-defined, clamped; ordinary content-driven size |
| `geometry.compact` | `geometry.resize` | Target `spring.sizeCompact`, same continuity/clamping; inline labels, counts and bounded controls |
| `geometry.panel` | `geometry.resize` | Target `spring.sizePanel`, same continuity/clamping; bounded popup or panel changes |
| `text.replace` | Target `text.change` | Changed units exit with `duration.instant` / `ease.in`, enter with `duration.fast` / `ease.out`; optional travel at most `distance.xs`, blur off, built-in display bindings explicitly use no stagger |
| `number.roll` | Revised `number.roll` | `spring.smooth`, bounce 0; stable place-value reels, target direction and bounded travel; renderer and continuity adapter pending |
| `number.compact` | Revised `number.roll` | `spring.snappy`, bounce 0; compact counts; same place-value semantics and continuity as the standard reel |
| `content.switch` | `data.transition`, local directional content form | `duration.base`, `ease.out`, `distance.xs`; opacity and translation on the owned content paint only; axis/sign follow semantic activation order and direction |
| `content.month` | `data.transition`, calendar month-grid form | `duration.base`, `ease.out`, `distance.sm`; opacity and translation of the actual month grid, with calendar/RTL direction; no per-day entrance |
| `data.update` | `data.transition`, one-shot or documented data-engine form | `duration.base`, `ease.out` for one-shot/Recharts forms; Embla uses the documented attraction-unit calibration and option precedence, not a CSS ease; never introduces a second geometry writer |
| `data.progress` | `data.transition`, determinate progress form | `spring.snappy`, bounce 0; coordinate fill with `number.compact` on one committed target/direction/clock, never delay the semantic value |
| `status.loop` | `data.transition`, continuous form | Existing framework `--animate-spin` / `--animate-pulse` theme clock; only while active and visible; no recipe timeScale clock substitution |
| `handoff.value` | `handoff` | `spring.smooth`, physics-defined, real visible origin; destination-only fallback when origin is unavailable |
| `scroll.navigate` | `scroll.navigate` | `duration.page` (450 ms), `ease.inOut`; explicit navigation only, user input cancels |
| `engine.native` | Actual named primitive/native engine, not a new recipe | Native direct manipulation or existing engine-owned settling; no Cadence duration overlay; the component contract must identify engine, mode adapter and cancellation path |

The `layout.selection` assignment refines the general v2 layout default; the current runtime's
`layout.shared` morph spring remains a migration baseline until implemented. Similarly, a number
preset is not proof of a reel renderer or continuity support. `engine.native` cannot exempt authored
autonomous movement from modes or budgets; it distinguishes engine ownership from a competing writer.

Bindings must name one actual recipe/form for each property. For example, a Base popup's CSS ending
phase may remain `popup.anchored`, whereas a separately animated backdrop may use `exit.fade`.
Listing both possibilities in this catalogue does not authorize declaring both in metadata when only
one executes. Opacity-only subparts may use a subset of an existing recipe's properties. New spatial
forms or arbitrary path, radius, padding or font-size motion require a reviewed recipe change.

`data.update` does not implicitly include local content travel. Use `content.switch` or
`content.month` for those explicitly bounded forms. Directional paint is separate from the size host,
native popup positioner, scroll position and any selection marker. A reversal cancels the previous
one-shot path and retargets from the currently displayed offset/opacity without remounting semantic
content; it does not require velocity continuity. A collision or passive layout correction settles
placement immediately instead of inventing a navigation direction.

### 3.1 Effective modes and clock ownership

Each preset's full-mode parameters above are subject to these property-specific results. A component
action may use a narrower documented subset, but cannot retain a property that the mode removes.

| Preset family | Reduced | None / zero recipe clock | Full-mode interruption |
| --- | --- | --- | --- |
| Presence and directional content | Allowed opacity uses a short tween; all travel/scale is removed | Semantic visibility/geometry immediately, with native lifecycle completion | Retarget current paint; reopening invalidates old exit completion |
| `state.color` | Same scoped properties, tween clock multiplied by `reducedDurationScale` | Target values immediately; no duration/delay survives | Latest committed colour wins; theme coordination may suppress redundant local work |
| `feedback.press` | No scale; any colour response belongs to the separate `state.color` binding | Final unscaled presentation; native activation is unaffected | Native pointer/key owner governs cancellation; no extra scale writer |
| `state.indicator` | Geometry/rotation/scale is final immediately; changed glyph opacity may use the shared short tween | Final indicator immediately | One local controller, no queued glyphs or state changes |
| Layout, measured size, scroll navigation | Destination geometry immediately, no delayed tween | Destination immediately unless direct input has already cancelled navigation/settling | Layout/size preserve reviewed velocity; scroll uses its explicit cancellation contract |
| `text.replace` | Only changed-part opacity; no travel, blur or stagger | Final exact text immediately | Retained identity survives; newest diff replaces the old target, not the semantic string |
| Numeric reels | Final formatted value immediately, no roll or delay | Final formatted value immediately | Retarget the bounded reel presentation under §5; no intermediate-value queue |
| `data.update` / `data.progress` | Geometry is immediate; opacity-only data feedback may retain a short tween | Engine/one-shot terminal target before paint | The documented data adapter owns all affected geometry; progress shares one presentation transaction with its readout |
| `handoff.value` | No flight; changed-part opacity at the destination only | Final destination text/geometry immediately | Captured visible origin and current destination remain valid, otherwise local text fallback |
| `status.loop` | Static equivalent status; stop the existing animation | None: stop; zero recipe clock alone: theme loop is unchanged | Active/visible condition and theme clock own the loop; reduced/none always take precedence |
| `engine.native` | Required direct manipulation remains immediate; stop the documented autonomous decorative/inertial part | Direct input remains available; cancel only authored/autonomous clocks addressed by the adapter | Native engine retains gesture state, capture and geometry ownership |

For reduced opacity-only remnants of spring presets, use `duration.fast` with `ease.out`, scaled by
`reducedDurationScale` and the effective recipe clock; do not run a residual spring on layout, rotation
or scale. Existing tween presets retain their assigned tween with the same multiplier. `text.replace`
retains its separate enter/exit tween assignments. The word "short" in component mode tables refers
to this resolution, not an unregistered local duration. Zero is resolved before spring conversion.

`engine.native` has no blanket recipe-clock promise: each native adapter must state which autonomous
clock, if any, consumes timeScale. Provider changes do not cancel capture or jump away from a live
pointer/keyboard operation. Native browser scrolling is still direct operation; authored smooth scroll
is separately governed by `scroll.navigate`. Referencing `engine.native` never declares a recipe.

Zero presentation delay does not override an upstream intent delay, Toast lifetime/pause rule or
application-owned timing. Such state-machine timing is not multiplied by a motion preset or provider
clock. Once the primitive commits visibility/state, its authored presentation follows the mode table;
no animation-only hold may extend that lifecycle after native completion is available.

### 3.2 Existing data-engine clocks

| Data form | Effective full-mode clock | Preserved boundary |
| --- | --- | --- |
| Local opacity | Preset tween duration/easing and provider clock | No engine geometry or implicit translation |
| Recharts data | Cadence controller progress uses the data preset duration/easing and provider clock | Series opt-out remains; series duration/delay/easing cannot override the controller or mode ceiling |
| Embla navigation | Shared `carouselClock.unitsPerSecond` converts the default authored duration; explicit effective `opts.duration` including breakpoints retains its documented full-mode precedence | These are attraction units, not elapsed milliseconds; native friction/target/velocity remain Embla-owned, release uses the same effective engine base, no CSS easing is imposed |

The [engine contracts](../animation-system.md#311-datatransition-for-embla-collections) describe the
actual adapters; the numeric default does not replace them. Reduced/none and zero recipe clock cancel
autonomous engine interpolation through those adapters without interrupting held direct input. Caller
plugins that animate or advance independently are explicit compositions: the plugin owner supplies
pause/stop and mode integration before claiming conformance. Cadence does not generically discover or
remove arbitrary plugin objects, and routing their engine calls through a zero clock alone does not
stop an automatic schedule.

Standalone planned `AnimatedText` retains the system's character-stagger default (`stagger.char`,
12 ms, capped at 120 ms). Built-in `text.replace` bindings deliberately select no stagger so that
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
clock. A nonzero clock/theme change
retains identity and the latest semantic target; adapters explicitly document whether they retime
or keep the active transition, without replaying an already settled action.

New component-specific parameter values are allowed through a named shared preset when existing
assignments cannot express the intended experience. Review the reason, full/reduced/none behavior,
interruption, CSS/JS equivalence and cost together. Update this catalogue and the affected component
bindings first; then implement all affected runtime/declaration/docs checks in the rollout. Do not
create 59 copies of an easing curve or use a new preset name to avoid a recipe's safety contract.

## 5. Geometry, text and numerical limits

Preset selection never changes natural content ownership. Observe natural content and size one
separate host per axis, with no render-time reads or per-frame glyph measurement. Passive viewport,
font or ancestor reflow resolves immediately. Components specify destination-width reflow versus
continuous reflow; text is never scaled to simulate size. Clamp rendered geometry to valid intrinsic,
closed and available sizes; closing disclosure height may reach zero. Temporary clipping belongs only
to the content viewport, never to focus outlines or portal positioning.

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

All bindings inherit [the system budgets](../animation-system.md#7-performance-budgets-and-implementation-rules):
existing per-item source ceilings, consumer/runtime/page limits, real-device frame rate and CLS.
The 20-element concurrency limit is for stagger scenarios, and the 400 ms limit is total stagger,
not the maximum duration of every animation. Components may set stricter visible-work bounds. On
overflow, reduce the moving set or show the latest final state; never delay semantic data or grow a
backlog to fit an animation budget.

The following are target shared renderer work limits, not proof of measured performance. They belong
in the same future shared source and may be tightened per component; relaxing them requires review
and measurement. A budget fallback never truncates content or delays its accessible value.

| Target limit | Bound | Overflow behavior |
| --- | --- | --- |
| Changed-text moving set | At most 64 changed graphemes per owned slot/revision and across one known coordinated content transaction, grouped into safe shaping runs | Apply affected text immediately; retained content does not replay |
| General text diff input | At most 2048 graphemes per compared owned display string; streaming uses the append fast path | Show final affected content immediately; code/large-document owners may work on bounded visible lines, never split a shaping run merely to fit |
| Middle-diff work | At most 4096 candidate comparisons after prefix/suffix trimming | Abort the visual diff and commit final affected text; no synchronous quadratic work beyond the cap |
| Numeric moving set | At most 12 changed place-value columns per numeric display and across one known coordinated content transaction | Show the complete final formatted value immediately; never drop significant digits |
| Chart data interpolation | At most 200 participating samples/marks across all animated visible series in one chart revision | Commit final data geometry immediately; do not resample, omit data or queue the excess |
| Pending targets | One latest committed target per owner | Replace the obsolete target; no queue of intermediate text, digits or measurements |

For very long append-only messages, the append detector may use an explicit content revision/chunk
boundary instead of scanning or segmenting the entire historical message for each token. That boundary
is owned by the content integration, not inferred by recursively rewriting arbitrary child trees.
Diff work limits count analysis of the changed middle; linear input/formatting and DOM costs remain
subject to the component's own visible-work and full-page performance requirements.

The chart bound counts interpolation work, including line/area samples whose dots are hidden, not
only visible SVG node count. Unknown/unbounded caller geometry uses an immediate safe engine target
or remains explicitly caller-owned; it cannot claim automatic bounded interpolation. The bound is a
conservative target pending real-device measurement, not a proven frame-rate threshold.

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

Use visibility already known from the primitive, virtualizer or shared visibility controller. Do not
poll every component's rectangle or add a per-glyph observer to discover offscreen work. An active
native selection/copy range, browser find result or focused editing region takes precedence over
decorative text replacement: settle the affected visual when it cannot preserve the live range.
Accessible-name hiding alone does not remove outgoing text from copy; the renderer must prove one
current selectable/copyable value or use immediate exact text for that slot.
