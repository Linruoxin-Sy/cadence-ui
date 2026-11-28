# Animation system implementation plan

This page holds the contract the migration is judged by. The execution plan — what is left, in what
order, with which dependencies and acceptance — lives in the [issue tracker](https://github.com/Linruoxin-Sy/cadence-ui/issues?q=is%3Aissue%20label%3Amotion-v2),
one epic per phase, each listing child issues:

- [#36 contract-to-tooling alignment](https://github.com/Linruoxin-Sy/cadence-ui/issues/36)
- [#37 shared capabilities and the four public primitives](https://github.com/Linruoxin-Sy/cadence-ui/issues/37)
- [#38 the five pilots](https://github.com/Linruoxin-Sy/cadence-ui/issues/38)
- [#39 catalogue rollout by ownership family](https://github.com/Linruoxin-Sy/cadence-ui/issues/39)
- [#40 functional distribution, then performance governance](https://github.com/Linruoxin-Sy/cadence-ui/issues/40)

Change the schedule by editing its issue, not by growing this page. This directory holds concepts and
contracts: [animation-system.md](animation-system.md) is the target contract,
[motion/README.md](motion/README.md) and [motion/presets.md](motion/presets.md) are the per-component
and shared-parameter designs, and [parity-plan.md](parity-plan.md) records scope, compatibility tiers
and catalogue-level future work.

Progress and evidence live in Git history and in the issue that closed the work. An issue marked done
is not a performance acceptance; ADR-023 separated functional migration from performance governance,
and ADR-026 now decides what that governance gates. A design decision, or a closed task, is not evidence that a component already supplies the
new behaviour.

The design inputs include the [59 individual component contracts](motion/README.md#5-catalogue) and the
[shared preset catalogue](motion/presets.md). Each component is designed independently; global visual
style guides its choices while the system execution contract stays mandatory. These files specify
target behavior and acceptance scenarios, not completed implementation or test evidence.

The original catalogue scope remains 59 components. AnimatedText, AnimatedNumber, Reveal and
RevealGroup are additional standalone primitives with documented delivered subsets. No third-party
reference catalogue, new application behaviour or optional animation engine is adopted implicitly.

## Status

Functional migration is delivered across the catalogue — the 59 components and the four standalone
primitives — with a target contract, registry metadata, public MDX and executed evidence for each id.
`registry:check` walks all 63 reference graphs and keeps targets and payloads in sync; by its own
output it is legacy enforcement, so it does not itself certify v2 runtime. That runtime evidence is
the per-item `tests/components/<id>.test.tsx` suites and the v2 action plan they feed. This is a
functional conclusion only.

The last item this section carried as open is closed:

- **#173 — fixed in #185.** The drawer declares an edge flight on opening — "edge travel by the
  popup's own extent on `transform`, plus opacity, on the popup's own edge clock" in
  [drawer.md](motion/components/drawer.md) — and `full` used to start none of it. `drawerSwipeClasses`
  installs the primitive's `transform, translate` family with a non-zero duration, `createModalPresence`
  read that family as caller paint and returned before writing anything, and only `reduced`/`none` —
  which emit `transition-none` — reached the opacity envelope. #185 composes that controller so the
  primitive's release family is not mistaken for caller transform, and reports the live swipe state
  into the commit so the envelope leases opacity alone while the pointer owns the drag channel.
  `reduced`/`none` behaviour is unchanged, and the target above was not weakened to fit the fix.

The three items this section used to carry are closed and counted as delivered: #168 (Navigation Menu's
declared shell size writer for a content revision inside one open panel) in #175; #165 (the hover-card
matrix pose) and #169 (44 `motion-matrix` cells across ten blocks) in #174, with #165 closed as a subset
of #169. The browser smoke that read the presence fade out of the colour family now reads each entrance
from the writer that owns it, and `motion-matrix.spec.ts` asserts the drawer's declared edge flight
against `CLOCKS.sheet[mode]` instead of recording its absence. The four primitives, Carousel, Data Table
and Sidebar also keep an explicit `legacy` migration marker by design; each contract records its reason.

Performance governance is **decided but not accepted**. [ADR-026](adr.md#adr-026--v2-performance-budgets-what-is-gated-what-is-monitored-what-is-retired)
sets the v2 budgets and their classes on the S02-A matrix; no budget, byte count or device measurement
in this document is a passing result, and the F03 acceptance run is recorded in
[performance-acceptance.md](performance-acceptance.md) with a not-met verdict.

## 1. Outcome and boundaries

Every component must cover the six baseline capabilities where its semantic parts have the relevant
content or state: appearance, measured size change, surface colour change, text colour change,
changed-text animation and numeric rolling. These are default component behaviour after migration,
not an advanced tier or six switches consumers must enable. A separator has no numeric content;
an input's editable value remains a native editing surface. Such cases need an explicit applicability
decision, not a fabricated animation or a claim that the entire component is exempt.

Retain the four-layer architecture defined by the animation system: component signals (semantic
state, cause, identity, direction and revision), policy and coordination (modes, initial render,
ownership, group rhythm and interruption), recipes and tokens, then executors. CSS owns visual
definitions, state styles and suitable transitions. Motion owns measured continuity and physical
retargeting where required. Existing engines retain their own geometry writers behind adapters.
This division does not require a new general animation DSL, a global DOM observer or an engine
selector on every component.

The baseline and additional effects have different triggers:

| Capability     | Default integration target                                              | Required boundary                                                                                                            |
| -------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Appearance     | Newly presented surfaces, inserted content and component-owned presence | Preserve readable SSR and hydration; do not replay an already presented first screen or duplicate parent and child entrances |
| Size change    | Content or committed component-state changes that alter a measured host | One owner per dimension; distinguish content changes from font loading, passive reflow and direct pointer resizing           |
| Surface colour | Existing background, border and related state feedback                  | Explicit CSS properties and shared tokens; never `transition: all`                                                           |
| Text colour    | Existing semantic text-state changes                                    | Coordinate with the background without postponing focus, error or disabled information                                       |
| Text change    | Component-owned display strings and explicit animated text slots        | Preserve unchanged graphemes and their identity; protect rich content, native editing and complex shaping                    |
| Number change  | Values the component knows are numeric and explicit number slots        | Use value and locale semantics; do not guess that an identifier, date or numeric-looking string is a counter                 |

Viewport reveal, including once and repeat policies, is additional to baseline appearance. Gesture
physics, list movement, shared selection, icon changes, loading transitions and coordinated handoff
remain component-specific compositions. They must be designed where relevant rather than copied
onto every component.

Keep the individual contract in `docs/motion/components/<id>.md`, all linked from `docs/motion/README.md`.
That central directory is deliberately split by component; compound parts remain in their owner's file.
Store shared parameter assignments in `docs/motion/presets.md`, not copied into 59 documents. Component
bindings may refine visual defaults through reviewed presets while retaining the same mode, semantic,
ownership and cancellation rules. Runtime values remain in the shared motion source. No generic motion
wrapper, full-catalogue runtime configuration map or new public settings object is implied.

## 2. Preserve compatibility during migration

### 2.1 Public API and source distribution

Keep all pinned shadcn ids, exports, props, defaults and `data-slot` values. Preserve Base UI `render`,
controlled/uncontrolled state, refs, event cancellation, focus and keyboard semantics. Additive public
APIs need documentation and parity checks. Animation must not invent minimum loading durations,
delay a successful selection, own validation or change when application state commits.

Keep shared implementation under `registry/cadence/lib/`, with explicit registry items and namespaced
dependencies. Shipped imports remain relative. Each component installs only its required helpers;
one colour transition must not pull in text diffing, number wheels and layout engines. Do not run
consumer scaffolding or introduce a second component tree.

Preserve `CadenceProvider` mode and clock semantics. Do not introduce a parallel runtime intensity
system. Ordinary component usage should receive the authored baseline without a large `motion`
configuration object. Use the existing provider boundary and documented primitive APIs for explicit
scope or content semantics; use CSS tokens for visual tuning.

### 2.2 Registry and metadata

`meta.motion` remains a declaration of implemented recipes, not a list of desired future abilities.
Shared `state.color` and the explicit AnimatedText `text.change/changed-runs` form are implemented;
ordinary components may declare them only with their own runtime adoption and checks. `number.roll`
already names a recipe, but that alone does not provide a digit-wheel primitive or prove any
component's rolling implementation.

Tier is no longer permission to animate. During the schema transition, retain existing `meta.tier`
and matching frontmatter because current checks, source budgets and templates depend on them.
Retain tier and historical budget values/reasons for traceability; do not relabel tiers to hide costs.
ADR-026 retired these comparisons as a budget: the item's file list includes the shared
`registry/cadence/lib/**` helpers it copies, so the ladder measured "what this item's file list
weighs" rather than what the component costs. The number is still reported per item by
`registry:check`, and the compiled budgets in §4 bound the cost that matters.

Keep the declaration small: recipe names and implementation forms, existing origin/dependency
metadata, and any justified additive fields. Put part-level causes, property ownership, mode outcomes
and cancellation behaviour in the Motion contract and executable fixtures. Do not copy a complete
configuration matrix into every source file, registry entry and JSX call site.

The internal per-component contract is the authoritative target detail. Public MDX gains only the
implemented subset during migration and must identify actual recipes, not internal preset/binding names.
Update the component's target contract when a design decision changes; do not maintain a second target
table inside this rollout plan or change a public claim to conceal missing implementation.

The [minimal coverage schema](motion/README.md#22-minimal-installed-coverage-schema) separates the
internal six target relationships from installed recipe ownership. Default, inherited, composed
and not-applicable target references resolve to real part anchors with reasons. Installed coverage
has exactly the declared recipe/forms and reached integration owners, never target-derived defaults
or false inapplicable effects. Existing recipe, origin/dependency and source-budget fields remain
readable. Strict per-item v2 enablement and complete shared-stage acceptance remain gated.

`meta.motionProfile`, intensity, public explanations and `scripts/catalog-intensity.mjs` now use
implemented perceptual extent, travel and coordination together. Text/geometry presence alone is
not a medium label. Future adoptions must review their strongest actual behaviour and preserve the
descriptive-only boundary; profiles cannot restrict capabilities or weaken modes. This tooling is
not evidence of a component's complete target adoption or of the remaining shared-stage gates.

## 3. Shared implementation work

These workstreams are prerequisites for component adoption, not per-component tasks. Their delivery
issues live under the phase epics linked at the top of this page.

| Workstream           | Deliverable                                                                                                                               | Acceptance evidence                                                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tokens and recipes   | One authored token source; CSS and Motion adapters; `state.color` and `text.change` definitions; updated `number.roll` execution contract | Recipe catalogue, CSS token exports, guide tables and resolver tests agree; no component-local motion literals                                       |
| Presets and bindings | Implement the reviewed purpose/compact/panel presets and each component's part bindings without a full-catalogue runtime map              | Parameter references resolve to the shared source; CSS/JS effective clocks agree; overrides cannot bypass modes, clamping or finite-work protections |
| Semantic changes     | Explicit content/state revision and stable identity handling                                                                              | Re-renders and passive resizes do not restart effects; rapid updates follow the latest committed state                                               |
| Geometry             | Shared measurement and retargeting helpers with one writer per axis                                                                       | Observe natural content and size a separate host; clamp valid geometry; avoid feedback loops; preserve text scale and baseline                       |
| Presence             | Entry/exit ownership integrated with Base UI and ordinary React content                                                                   | Closing can reverse; obsolete completion cannot remove reopened content; focus/portal/scroll ownership cleans up correctly                           |
| Text                 | Grapheme-aware stable diff with bounded work and shaping fallback                                                                         | Unchanged content stays mounted; insert/delete/replace and repeated characters behave correctly; only the intended accessible text is exposed        |
| Numbers              | Locale-aware value decomposition and stable digit-place identity                                                                          | Correct direction, carry, sign, separators, precision and digit-count changes; retarget without replaying intermediate update queues                 |
| Modes and clocks     | Shared CSS/Motion/engine cancellation paths                                                                                               | Running full-to-reduced/none changes settle before paint; zero clock is immediate; nested scopes respect system preference                           |
| Existing engines     | Adapters for actual installed writers such as Embla and Recharts                                                                          | No second transform/data-geometry writer; actual engine motion obeys the effective mode and lifecycle                                                |

A CSS sampled spring curve can express a fixed transition but does not replace a physics controller
that must inherit velocity from an interrupted gesture. CSS intrinsic-size interpolation also does
not remove the need to measure arbitrary content changes. Keep these engine decisions internal and
test the promised behaviour rather than requiring all animation to use one API.

The target reduced mode keeps short opacity/colour feedback where appropriate and removes spatial,
layout, rolling and continuous motion. Spinner rotation and continuous opacity loops stop in reduced
and none, proven on the shipped glyph and its status name (`tests/components/spinner.test.tsx`,
`tests/e2e/b2.spec.ts`). The none target also stops colour transitions through the zeroed
`--motion-duration-*` clocks; the colour utilities' per-owner browser proof of that broader guarantee
is not yet recorded, so this page does not claim it as accepted.

### 3.1 Public primitives

| Primitive        | Design scope                                                                                   | Integration boundary                                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `AnimatedText`   | Changed display text, stable retained graphemes, inserted/deleted content and shaping fallback | Text animation owns character transitions; the enclosing component may own geometry. Do not recursively rewrite arbitrary React children |
| `AnimatedNumber` | Numeric value, locale/formatting and digit-place rolling                                       | Display only; preserve native input/IME/caret handling. Affixes and formatting changes need explicit semantics                           |
| `Reveal`         | A single surface entering the viewport, with once/repeat behaviour                             | Readable first screen, hydration and no-JS fallback; visibility policy is separate from presence                                         |
| `RevealGroup`    | Group-owned reveal order and bounded stagger                                                   | Prevent nested duplicate entrances; stable item ids and a total delay/concurrency cap                                                    |

AnimatedText, AnimatedNumber, Reveal and RevealGroup have standalone registry entries; their delivered
API subsets, relative dependency trees and conservative native fallbacks are described in public MDX.
Complete four-install/shared-stage acceptance remains a separate gate; their existence does not
establish original-catalogue adoption or full six-capability conformance.
Existing components will integrate the same internal helpers for their owned strings/numbers; consumers need not
wrap every built-in label to obtain the baseline. Complex user-authored content uses explicit
composition so that links, refs, keys, selection and accessibility remain intact.

The primitive fixtures must exercise the target defaults: changed-character delay is 12 ms with a
final 120 ms delay cap after effective timeScale for standalone AnimatedText, still subject to the
20-element concurrency bound; built-in `text.replace` bindings explicitly select no stagger.
RevealGroup defaults to replay once, amount 0.08, top inset 0.03, bottom inset 0.08 and
stagger none. Insets are fractions of the observation root's height, converted to pixels and updated
when that root changes size; amount is the target's intersection-area ratio. Explicit cycle stagger
uses repeating 0/55/110 ms slots, not a three-animation concurrency limit. Test once/repeat policy
separately, including skipped or already consumed first-screen reveals.

## 4. Functional acceptance and the v2 budget decision

The acceptance matrix includes full/reduced/none against both system preferences, live mode/clock
changes, nested providers, content changes during exit, rapid reversal, pointer/keyboard paths,
SSR/no-JS/hydration and relevant route departure. Geometry, text and number tests observe actual
properties and retained identity; a `data-motion` attribute alone is insufficient. Accessibility
checks cover readable names, duplicate outgoing text, selection/copy, native editing, focus and
errors. Test light and dark themes and realistic narrow/wide layouts.

[ADR-026](adr.md#adr-026--v2-performance-budgets-what-is-gated-what-is-monitored-what-is-retired)
replaced the advisory phase with a decision, and §4 is the summary of it rather than a second copy.
Four metrics are hard gates: own compiled code ≤ 8 000 B per id, install addition ≤ its recorded value
per id (new ids ≤ 224 000 B), the Motion runtime union ≤ 48 000 B, and CLS < 0.02 wherever a suite
measures it. Three are monitored: the route remainder ≤ 40 000 B and the page total ≤ 550 000 B per
route, plus the share of frames over 25 ms and the longest block on this host. One is retired: the
per-item source gzip, still reported and no longer compared. Workload settings — participants, stagger, grapheme/sample/column caps,
drawing area — are not budgets; they stay adjustable with finite-work reasoning and behaviour/visual
evidence, and no blind constant increase is authorized. Invalid/unsupported-input and native-safety
fallbacks, coalescing and cancellation remain unconditional.

Measured and gated are not the same list, and the difference is deliberate: the three bundle gates run
inside `pnpm check` through `tests/lib/performance-budgets.test.tsx`, while the page and frame metrics
need a production build and a 15-minute browser sweep that required CI does not run. Their values are
recorded per sweep in `.cache/` and compared against the table; the acceptance run that reads them is
[performance-acceptance.md](performance-acceptance.md), and it did not meet ADR-026's conditions: three
monitored metrics are over their limits and no mid-range device trace exists for ≥ 55 fps. What S03
delivered afterwards moved no number on that page and is not a pass either: #177 attributed the 366 142 B
shared shell, #178 dispositioned the six route remainders in
[ADR-027](adr.md#adr-027--route-remainder-exceptions-the-six-pages-whose-remainder-is-their-own-item), and
#180 attributed the two frame windows in #187.
[ADR-028](adr.md#adr-028--the-two-frame-proxies-and-the-device-criterion-no-exception-no-waiver) dispositions
those two windows without an exception — the cause is a removable runtime cost, owned by
[#189](https://github.com/Linruoxin-Sy/cadence-ui/issues/189) — and leaves the device criterion unmeasured and
unwaived. Historical
failures and missing measurements stay source-bound: the 120 KB page bar was never met, 23 of 63 items
exceeded the retired tier ladder, and no device frame trace exists.
[parity-plan.md](parity-plan.md#8-next-work) records what is still open against that decision.

Cross-component geometry acceptance also checks the frame after temporary constraints are released:
natural auto/percentage/flex/grid/ratio/field-sizing remains responsive, valid empty geometry is not
confused with hidden unknown measurements, and stale cleanup cannot overwrite newer caller sizing.
Exercise individual CSS translate/rotate/scale together with transform-list/native placement, including
safe fallback and containing-block/hit-region preservation. Use full-parent/none-child and
none-parent/full-child fixtures to prove owner-local modes, inherited envelopes and the OS ceiling.
Chart's unknown-work controller path must not count as zero or invoke caller components for discovery;
native browser scrolling and snap remain distinct from each engine's authored settling clock. These
are acceptance requirements, not additional presets, public APIs or implementation claims, and the
recorded browser audits are where their evidence lives.

Position acceptance distinguishes page scrolling that preserves a local marker coordinate space from
differential scroll, sticky relocation, portal movement and visual-viewport corrections that invalidate
it. Exercise Select's captured flight, scrolling selection strips, row projections and Toc's separate
document-navigation owner without adding per-frame endpoint reads or stealing native scroll control.
Inspect scrollWidth/scrollHeight, current offsets and snap/anchor behavior during and after outgoing
row/text/reel paint; decorative retention must not create a second layout shift or scrollbar. Sidebar
must settle its coupled gap/container transaction when it would disturb a known focused editor, and
Toast's configurable visible limit must not bypass the shared active-collection work bound. These are
browser acceptance cases, whose evidence is a recorded browser pass rather than structural Markdown
validation.

For implementation changes, run `pnpm registry:build` before `pnpm check` when shipped source,
metadata or content changes, then the affected behavioral browser/runtime checks. A change that moves a
bundle gate re-runs `tests/lib/performance-budgets.test.tsx` with it; page and frame remeasurement
belongs to a recorded sweep (ADR-026), not to every pull request. Documentation
design work alone does not regenerate payloads or claim runtime conformance. Keep regression inputs
in `tests/fixtures/`, audit output in `.cache/`, and delivered provenance in Git and retained registry
snapshots.
