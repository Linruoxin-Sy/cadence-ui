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
is not a performance acceptance; ADR-023 separates functional migration completion from performance
governance. A design decision, or a closed task, is not evidence that a component already supplies the
new behaviour.

The design inputs include the [59 individual component contracts](motion/README.md#5-catalogue) and the
[shared preset catalogue](motion/presets.md). Each component is designed independently; global visual
style guides its choices while the system execution contract stays mandatory. These files specify
target behavior and acceptance scenarios, not completed implementation or test evidence.

The original catalogue scope remains 59 components. AnimatedText, AnimatedNumber, Reveal and
RevealGroup are additional standalone primitives with documented delivered subsets. No third-party
reference catalogue, new application behaviour or optional animation engine is adopted implicitly.

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
Under ADR-023 these comparisons are advisory and do not constrain functional migration. Reassess
the budget representation and appropriate limits in post-migration performance governance.

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
layout, rolling and continuous motion. This includes stopping Spinner rotation and opacity loops;
the current Spinner exception and continuous-loop reduced behaviour have not yet been migrated.
The none target stops colour transitions as well as spatial, opacity and loop clocks. Existing colour
utilities and the current contract helper do not yet prove that broader guarantee.

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

## 4. Functional acceptance and deferred performance governance

The acceptance matrix includes full/reduced/none against both system preferences, live mode/clock
changes, nested providers, content changes during exit, rapid reversal, pointer/keyboard paths,
SSR/no-JS/hydration and relevant route departure. Geometry, text and number tests observe actual
properties and retained identity; a `data-motion` attribute alone is insufficient. Accessibility
checks cover readable names, duplicate outgoing text, selection/copy, native editing, focus and
errors. Test light and dark themes and realistic narrow/wide layouts.

Historical references are per-item tier source gzip, initial Motion 48000 bytes, component addition
8000 bytes excluding declared shared runtime, full-page initial JS 120000 bytes, CLS <0.02,
real-midrange presented frame rate ≥55 fps, and recorded concurrency/stagger/renderer limits.
They remain traceable advisory comparisons, never fixed effect permissions. Shared workload settings
may change with finite-work reasoning and behavior/visual evidence; no blind constant increase is
authorized. Invalid/unsupported-input and native-safety fallbacks, coalescing and cancellation remain.

Performance is unresolved in [parity-plan.md](parity-plan.md#8-next-work). Existing failures and
measurement protocols remain retained; old measurements cannot certify changed source. No repeated
budget-specific builds, complete cost matrices or device performance audits are required per migration
change. After full-library functional migration, assess costs, redesign/justify v2 budgets, optimize
and perform separate performance acceptance. Framework/product-adoption restrictions remain intact.

Cross-component geometry acceptance also checks the frame after temporary constraints are released:
natural auto/percentage/flex/grid/ratio/field-sizing remains responsive, valid empty geometry is not
confused with hidden unknown measurements, and stale cleanup cannot overwrite newer caller sizing.
Exercise individual CSS translate/rotate/scale together with transform-list/native placement, including
safe fallback and containing-block/hit-region preservation. Use full-parent/none-child and
none-parent/full-child fixtures to prove owner-local modes, inherited envelopes and the OS ceiling.
Chart's unknown-work controller path must not count as zero or invoke caller components for discovery;
native browser scrolling and snap remain distinct from each engine's authored settling clock. These
are pending acceptance requirements, not additional presets, public APIs or implementation claims.

Position acceptance distinguishes page scrolling that preserves a local marker coordinate space from
differential scroll, sticky relocation, portal movement and visual-viewport corrections that invalidate
it. Exercise Select's captured flight, scrolling selection strips, row projections and Toc's separate
document-navigation owner without adding per-frame endpoint reads or stealing native scroll control.
Inspect scrollWidth/scrollHeight, current offsets and snap/anchor behavior during and after outgoing
row/text/reel paint; decorative retention must not create a second layout shift or scrollbar. Sidebar
must settle its coupled gap/container transaction when it would disturb a known focused editor, and
Toast's configurable visible limit must not bypass the shared active-collection work bound. These are
pending browser acceptance cases; structural Markdown validation does not prove them.

For implementation changes, run `pnpm registry:build` before `pnpm check` when shipped source,
metadata or content changes, then the affected behavioral browser/runtime checks. Performance-only
remeasurement is deferred under ADR-023. Documentation
design work alone does not regenerate payloads or claim runtime conformance. Keep regression inputs
in `tests/fixtures/`, audit output in `.cache/`, and delivered provenance in Git and retained registry
snapshots.
