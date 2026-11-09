# Animation system implementation plan

This is the implementation plan for the target contract in [animation-system.md](animation-system.md).
The design is specified; the runtime implementation phases below remain pending. Internal target
reference validation and scaffolding exist, as distinguished under Phase 1. Existing components,
registry metadata, public documentation and executable checks still describe the installed system
until each migration is implemented and verified. A design decision is not evidence that a component
already supplies the new behaviour.

The design inputs include the [59 individual component contracts](motion/README.md#5-catalogue)
and the [shared preset catalogue](motion/presets.md). Each component is designed independently;
global visual style guides its choices while the system execution contract stays mandatory. These
files specify target behavior and acceptance scenarios, not completed implementation or test evidence.

The original catalogue scope remains 59 components. AnimatedText is an additional shipped primitive;
the other three public animation primitives below remain planned additions. No third-party
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
ordinary components may declare them only with their own runtime adoption and checks. `number.roll` already names a recipe, but that alone
does not provide a digit-wheel primitive or prove any component's rolling implementation.

Tier is no longer permission to animate. During the schema transition, retain existing `meta.tier`
and matching frontmatter because current checks, source budgets and templates depend on them.
Retain each item's current source budget; raising its tier to accommodate a larger implementation is
not a valid migration. Introduce an independent budget representation only with equivalent limits
and updated checks. The existing `meta.budget` exceptions keep their written reasons.

Keep the declaration small: recipe names and implementation forms, existing origin/dependency
metadata, and any justified additive fields. Put part-level causes, property ownership, mode outcomes
and cancellation behaviour in the Motion contract and executable fixtures. Do not copy a complete
configuration matrix into every source file, registry entry and JSX call site.

The internal per-component contract is the authoritative target detail. Public MDX gains only the
implemented subset during migration and must identify actual recipes, not internal preset/binding names.
Update the component's target contract when a design decision changes; do not maintain a second target
table inside this rollout plan or change a public claim to conceal missing implementation.

Phase 1 must define the minimal capability schema and its relationship to that contract: default
(integrated by the component), inherited, composed, or not applicable with a reason. An inherited capability does
not prove a local recipe implementation. Existing metadata must remain readable during the schema
transition; new defaults must not silently turn an unimplemented declaration into a passing check.

Revisit `meta.intensity` and `scripts/catalog-intensity.mjs` together. Adding text or geometry to every
applicable component would otherwise turn the current recipe-name heuristic into a nearly uniform
label. Intensity remains descriptive and must not restrict capability or weaken runtime modes.

## 3. Shared implementation work

| Workstream           | Deliverable                                                                                                                               | Acceptance evidence                                                                                                                           |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Tokens and recipes   | One authored token source; CSS and Motion adapters; `state.color` and `text.change` definitions; updated `number.roll` execution contract | Recipe catalogue, CSS token exports, guide tables and resolver tests agree; no component-local motion literals                                |
| Presets and bindings | Implement the reviewed purpose/compact/panel presets and each component's part bindings without a full-catalogue runtime map              | Parameter references resolve to the shared source; CSS/JS effective clocks agree; overrides cannot bypass modes, clamping or budgets          |
| Semantic changes     | Explicit content/state revision and stable identity handling                                                                              | Re-renders and passive resizes do not restart effects; rapid updates follow the latest committed state                                        |
| Geometry             | Shared measurement and retargeting helpers with one writer per axis                                                                       | Observe natural content and size a separate host; clamp valid geometry; avoid feedback loops; preserve text scale and baseline                |
| Presence             | Entry/exit ownership integrated with Base UI and ordinary React content                                                                   | Closing can reverse; obsolete completion cannot remove reopened content; focus/portal/scroll ownership cleans up correctly                    |
| Text                 | Grapheme-aware stable diff with bounded work and shaping fallback                                                                         | Unchanged content stays mounted; insert/delete/replace and repeated characters behave correctly; only the intended accessible text is exposed |
| Numbers              | Locale-aware value decomposition and stable digit-place identity                                                                          | Correct direction, carry, sign, separators, precision and digit-count changes; retarget without replaying intermediate update queues          |
| Modes and clocks     | Shared CSS/Motion/engine cancellation paths                                                                                               | Running full-to-reduced/none changes settle before paint; zero clock is immediate; nested scopes respect system preference                    |
| Existing engines     | Adapters for actual installed writers such as Embla and Recharts                                                                          | No second transform/data-geometry writer; actual engine motion obeys the effective mode and lifecycle                                         |

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

AnimatedText is installed as `@cadence/animated-text`; its string/locale/granularity surface, relative
dependency tree and conservative native fallback are described in its public MDX. The other names
remain planned capabilities, with additive props and install dependencies still due in Phase 2.
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

## 4. Catalogue migration matrix

The following mutually exclusive groups cover the original 59 registry UI/block items exactly once.
All groups evaluate the six baseline capabilities in section 1; the final column records the main
ownership and extra effects to resolve. A group is planning scope, not a replacement motion tier.
Every row is pending implementation and acceptance.

Use the [individual file index](motion/README.md#5-catalogue) for the actual part-level design. The
family matrix schedules related ownership work; it does not replace the six-capability table, action
mode table, interruption rules, bindings or geometry/performance constraints of any one component.

| Family                             | Current ids                                                                                                      | Main integration and ownership work                                                                                                                                  |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actions and action groups (4)      | `button`, `toggle`, `button-group`, `toggle-group`                                                               | Preserve press semantics; animate owned labels and numeric values with one size owner; groups own shared highlight/reflow, not duplicate child entrances             |
| Inline structure (4)               | `badge`, `kbd`, `label`, `separator`                                                                             | Local colour and content continuity; numeric/text slots only where content exists; preserve label association, inline layout and separator semantics                 |
| Surfaces and content structure (5) | `card`, `alert`, `empty`, `item`, `aspect-ratio`                                                                 | A surface owns presence/geometry; owned title/description/icon slots compose changes; preserve caller children and aspect-ratio constraints                          |
| Editing and field composition (5)  | `input`, `textarea`, `input-otp`, `field`, `input-group`                                                         | Native values/caret/IME stay immediate; helper/error/count/addon slots receive applicable text/number/presence/size behaviour without owning validation              |
| Selection controls (6)             | `checkbox`, `radio-group`, `switch`, `slider`, `select`, `combobox`                                              | One state/indicator or gesture writer; distinguish direct manipulation from committed changes; labels/readouts and popup geometry share explicit ownership           |
| Popup surfaces and menus (9)       | `dialog`, `alert-dialog`, `popover`, `tooltip`, `hover-card`, `sheet`, `drawer`, `dropdown-menu`, `context-menu` | Base UI owns semantic open/close; adapter owns visual completion; anchored origin, content changes and exits preserve focus and portal lifecycle                     |
| Navigation (7)                     | `breadcrumb`, `pagination`, `menubar`, `command`, `navigation-menu`, `sidebar`, `toc`                            | Stable navigation identity, insertion/reorder and shared indicators; preserve real links, keyboard focus, scrolling and selection semantics                          |
| Disclosure and panels (3)          | `accordion`, `collapsible`, `tabs`                                                                               | One content-size writer; coordinate content changes and icon/selection state; reverse mid-flight without remounting the active panel                                 |
| Feedback and media (5)             | `avatar`, `skeleton`, `spinner`, `progress`, `toast`                                                             | Loading-to-content and present/dismiss lifecycles; progress/readout consistency; static reduced/none loading indicators and bounded loops in full mode               |
| Collections and data (6)           | `table`, `data-table`, `chart`, `calendar`, `carousel`, `date-picker`                                            | Stable record/value ids; content changes and formatting; existing engines own geometry; no blanket per-cell observers or animation of every row                      |
| Layout and scroll hosts (2)        | `scroll-area`, `resizable`                                                                                       | Preserve direct pointer and native scrolling responsiveness; animate committed transitions only where meaningful; prevent nested measurement and global cursor leaks |
| AI/content utilities (3)           | `code-block`, `attachment`, `bubble`                                                                             | Content/attachment state and presence; preserve source selection, streaming ownership and unread/scroll behaviour; bounded text work for long or frequent updates    |

The five pilots are `button`, `badge`, `card`, `tabs` and `select`. They span an interactive control,
inline content, a nested surface, a shared selection/panel and cross-tree geometry/handoff. A pilot
passing does not certify another family or enlarge its source budget.

## 5. Dependency-ordered phases

Under [ADR-022](adr.md#adr-022--continuous-performance-work-with-final-hard-gates), the existing
performance task in [parity-plan §8](parity-plan.md#8-next-work) stays pending while shared capabilities
and component migration follow their technical dependencies. It must close before final performance
acceptance and the final audit. Performance work continues during these phases, with source budgets,
mandatory checks and affected real browser/engine and performance measurements retained.

Phases 1–4 accept their own behavior, compatibility, source-budget and regression evidence. Required
measurements must be collected and their actual failures retained; an existing global JS-budget
failure or missing real-device proof remains unresolved in the performance task and Phase 5. This
distinction does not permit missing stage measurements, failed stage checks or weakened assertions.
Compare affected costs with recorded baselines. Before propagating a pattern, fix behavior,
compatibility, source-budget or layout-stability regressions and unexplained or unbounded cost growth.
Quantified costs of authorized capabilities require a named remediation owner/task and plan in the
unresolved performance task and Phase 5; zero byte growth per build is not required. Replacing a
baseline cannot certify a failed budget. Stage completion is not performance acceptance or delivery.

### Phase 1: Contract-to-tooling alignment

Depends on the target design. Target reference tooling is available; runtime support and per-item
v2 enforcement remain pending. Shared runtime work follows contract/tooling alignment; closing the
existing performance task is a final delivery dependency, not a development prerequisite.

- `scripts/motion-targets.mjs` validates current UI/block inventory, actual value-export anchors,
  six capability references and exact target preset/recipe forms. `new-item` creates a deliberately
  unfinished individual contract and index entry; placeholders fail validation. The reference schema
  in motion/README keeps shared target forms separate from runtime Recipe identifiers. It checks
  structural closure, not semantic truth, active property ownership or runtime acceptance.
- Implement preset resolution, target size springs and `rotation.halfTurn`, and single-source CSS/Motion output without
  changing unrelated base-token defaults. Prove mode/zero-clock precedence, local/portal clocks and
  static per-component dependency reachability; colour-only usage must not load the whole catalogue.
- Validate the semantic closure of each contract: applicable capability to action/owner, action to
  exact preset/recipe form, and full/reduced/none plus interruption to observable properties. Include
  directional `content.switch`/`content.month` and size-linked `layout.sidebar` as explicit target forms;
  equal timing tokens alone do not prove coordinated progress or geometry.
  Audit exact host/region coverage as well as export existence: title/count/checkbox/sub-trigger text,
  separator/arrow/backdrop paint, native editor foreground and inherited accessories cannot disappear
  behind a broad root anchor. A composition either uses its dependency's preset/form unchanged or
  explicitly overrides that existing owner; no second writer is introduced. Exercise disjoint menu
  item/surface colour channels and single-writer theme/interaction updates.
  Reject an incomplete binding chain, conflicting repeated binding or an inherited action with an
  unnamed actual owner. Validate the full/reduced/none targets independently from zero recipe time;
  a held full-mode press at zero time must not be mistaken for the none presentation.

- Reconcile recipe/mode/token support in `registry/cadence/lib/motion.ts`, the provider, CSS token
  exports and theme registry item. Introduce target recipe names only with their execution contract.
- Pending runtime migration: update `scripts/motion-manifest.mjs`, `scripts/motion-docs.mjs`, `scripts/check-registry.mjs`,
  `scripts/catalog-intensity.mjs`, scaffold/template checks and corresponding fixtures for the new
  recipe forms and temporary tier/budget semantics. Preserve source/metadata/docs equality.
- Shared colour/loop policy has executed-hook observer/helper/reporter support, including rejected
  disconnected refs, missing capability evidence and legacy loop drift. Finite shared owners cancel
  restrictions and capture positive clocks; physics owners retime. Individual component adoption
  and text/number enforcement remain pending; the total v2 marker remains fail-closed.
- Internal content.switch/content.month and persistent selection projection have scoped integrations
  in Tabs and Calendar. One finite content phase derives opacity/travel across actual month slots;
  one list-local marker owns its transform, with immediate unsafe/filled placement. These integrations
  keep native sizes. A separate desktop offcanvas adapter projects layout.sidebar from one actual
  gap-size scalar; icon gap/container widths and safe plain-label destination layout now share that
  owner with completion-gated opacity reveal. Unsupported label layouts stay immediate. Neither
  integration establishes coordinated trigger reflow, text/number/colour adoption or full
  component-v2 conformance. An internal captured-origin coordinator supplies one-use capture,
  aggregate shell/paint preflight and immediate cancellation without destination replay. Select
  adopts it only for bounded disjoint plain ASCII labels; retained/shaped/rich labels remain native
  until the changed-run renderer can supply exact eligibility. Invalid mapping exposes the current
  destination rather than tracking the retired source. These scoped forms do not establish full
  Select migration. The remaining dependencies and global budget gates stay pending.
- Existing engine adapters preserve native geometry, direct gestures and ref/event ownership while
  cancelling their autonomous work. Embla retains actual effective option precedence; Recharts retains
  per-series action progress across native handle recreation; Calendar and Toc retain their distinct
  cancellation clocks. Initial chart presentation is terminal; later series/data changes retain native
  interpolation. This shared support does not migrate their complete component contracts,
  annotation/content capabilities or the remaining popup/geometry work.
- Target reference metadata explicitly records `migration: "legacy"`; absent/unknown state fails.
  Registry checking and the runtime reporter reject `v2` until strict enforcement support exists.
  Legacy items still prove their documented baseline. Next, enable shared target assertion support,
  then migrate individual items with stricter helper/observer evidence, source and public docs together.
  Remove transitional exceptions only with those changes; a marker cannot promote legacy evidence.
- Keep legacy runtime differences explicit while a component remains unmigrated. Do not update
  generated metadata or public claims to describe pending behaviour.

Gate: targeted resolver/parser/helper tests prove both valid integrations and rejected drift; existing
parity and source budget rules still work. No check is removed merely because migration exposes a
failure. Measure real shared runtime/consumer reachability and complete pilot-route costs against
unchanged limits before pilots begin; global performance failures remain open under the section 5
acceptance distinction. The design and installed behaviour remain distinguishable.

### Phase 2: Shared capabilities and primitive contracts

The internal measured-geometry scope has an initial CodeBlock fold adapter. It uses explicit committed revisions, one outer owner per compound axis and natural-layout destinations, with temporary replace effects over native sizing. This limited integration does not migrate CodeBlock's other capabilities or the remaining disclosure, surface and control adapters. Component-level motion v2 markers remain gated by their complete contracts.

Each internal geometry scope coordinates one cause; independent lifetimes use separate scopes and may share the transaction for aggregate budgets. React adapters bind physical cleanup through `useMotionHostRef`. Imperative adapters must dispose their registration/scope from their actual native lifecycle and register a fresh baseline on reconnection; there is no general DOM-removal scanner. A natural-region observer also rejects unavailable boxes defensively, without treating their missing layout as a zero-size destination.

Depends on Phase 1. Implement the workstreams in section 3 and settle the minimal public primitive
APIs, registry dependencies and examples. Separate pure diff/number algorithms from DOM controllers;
measure only the nodes that own content-driven geometry. Reuse existing motion/engine integration
instead of creating a second rendering runtime.

Internal text planning in `registry/cadence/lib/text-diff.ts` provides bounded grapheme segmentation,
ordered retained identities, changed-run offsets and pure aggregate preflight. Its shaping gate requires
an adapter's actual boundary proof; segmentation alone never authorizes splitting text. An internal
plain-string DOM controller and React adapter now consume that planning with actual-font raster and
native Range proof, bounded pixel-only opacity paint, native selection/editing exclusions, transaction
budgets and live cancellation. The semantic value remains one native Text node; no inline splitting
or typography override is used. Unknown scripts/features, highlights, layout or clipping stay immediate.
Existing captured-origin support composes only a complete single-unit destination; partial strings
remain changed-only local replacements. The original 59 component owners do not yet import these
text modules. AnimatedText exposes this controller as a standalone string renderer with its own registry
item and changed-runs declaration. Original catalogue slot adoption, the other public renderers and
the overall v2 schema/evidence marker remain separate migration work. Unsupported correspondence
remains native immediate, including the rejected DPR2 raster mapping.

Internal pure numeric planning in `registry/cadence/lib/number-plan.ts` preserves raw numeric
output or an explicit native Intl formatter, retains decimal-place identities and preflights
two-cell/one-cell-height candidate lanes against the 12-column display/known-transaction bound.
Original number/BigInt values supply trend without conversion; format/scale revisions, unsupported
digits/parts, nonfinite values and ineligible accepted readout causes stay exact and immediate.
The conservative existing text-input ceiling also bounds decomposition without truncating output.
This is not an installable numeric helper or a reel renderer: native editing/layout eligibility,
live offsets/velocity, shared geometry/semantic transactions, modes and the public AnimatedNumber
API/distribution still require the subsequent renderer implementation and browser evidence.

Pending semantic-cause acceptance must distinguish requested values from accepted commits and actual
presentation changes, following [the shared cause contract](animation-system.md#coordinating-one-committed-change).
Prove rejected requests, equal-target rerenders during a legal flight, batched versus committed
A → B → A, delayed controlled pointer/keyboard echoes, and accepted versus cancelled native resets
in all three modes. Unknown direct-input correspondence takes the immediate native path without
blocking later independent actions. Motion never rejects caller-committed data as a network-race
policy or synthesizes reset/change/completion callbacks. Include these cases in the affected control
and readout migrations; this design review does not claim their execution or introduce a public API.

Implement bounded segmentation/diff and reel work at both the owned slot and known coordinated
revision scope. Prove overflow fallback, mixed text/numeric transactions, formatter-only changes,
direction reversal and hidden-owner cancellation without queuing old states. Geometry acceptance
includes destination-width readability, focused editor stability, hidden measurement recovery and
parent/child constraint cycles; native input must win over any preset or live mode change.

Text/readout acceptance includes inherited editable hosts and live changes into/out of editing, not
only Input/Textarea. Preserve the actual editing tree, selection, undo and exact output in all modes;
returning to display establishes a baseline without replay. Query/filter-derived counts remain
immediate through delayed accepted updates, while independently identified quantities retain their
ordinary eligibility. Verify DataTable alongside Command/Combobox and direct chart/slider readouts.

Also prove content baselines when an existing shared tooltip/preview host changes semantic trigger
or record. Same-host/same-type values cannot create a cross-entity reel or text history; same-entity
edits retain their ordinary eligibility, and ref churn or passive anchor movement is not an identity
change. Use already available identity boundaries and immediate fallback for unknown correspondence,
without adding a public identity API or changing the explicit Select handoff cause.

Presence and geometry adoption must prove that decorative retention and destination measurement do
not mount a second caller content tree. Include DataTable/Item exits, Tabs panel switches, Card sizing
and Avatar/Attachment/preview replacement with named controls, id-linked labels, refs/effects and
stateful media. Verify unique live ids, unchanged native form submission/reset participation and no
extra component/resource lifetime. Preserve native original keep-mounted policies; unsafe visual
copies or unavailable natural measurements use their local immediate fallback before allocation.
The collection count bound is additional to these eligibility checks, not a cloning allowance.

Palette acceptance covers different owner clocks and immediate focus/invalid paint, not only matching
full-mode colour tweens. For Tabs, ToggleGroup and Pagination, inspect intermediate selected-plate
travel behind labels. If the rendered combinations cannot stay readable, prove immediate placement
and safe paint without duplicated/faded unchanged labels, a second owner or delayed selection.
CodeBlock tab-label/reorder geometry with unchanged selection must rebase its marker immediately;
it does not acquire a selection clock merely because the marker rectangle changed.

Exercise overlapping revisions that each fit the per-revision budget but would exceed the live
moving-set limit together. Count retained active work, release obsolete decorative copies and prove
immediate latest-content fallback without waiting for capacity. Also prove that this cleanup leaves
caller-persisted panels, unchanged text identity and independent list-item lifecycles intact.

Adopt the internal transaction identity bound and preflight from presets §5.2 in each collection adapter before
per-member measurement or retained-visual allocation. Exercise the exact bound and overflow,
including measured/projected retained siblings, earlier active revisions and outgoing visuals;
an oversized identity set must reject decoration before reading all member boxes. Prove that a
whole-group envelope is counted once, actual month grids are not confused with date cells, and
chart samples/native scrolling retain their separate limits. Manual/paginated/virtualized adapters
need an explicit bounded working set and independent performance evidence, not an automatic waiver.
Count participating shells/markers too: a transaction with 49 row visuals and one sizing shell is
already at the target bound; an additional distinct outgoing visual must take the immediate fallback.
Multiple bindings on the same member visual do not multiply that participant or its allowance.

Extend the internal known-popup presence and colour composition to each applicable component with one transition-family
composition and disjoint property ownership. Default library presence must not cause colour to
yield as though it were an unknown caller family. Cover immediate whole-palette focus/invalid paint,
entry interaction with an independent backdrop, three distinct modes, live cancellation, native
completion and unknown caller overrides. Component adoption remains pending until source, declarations,
public docs and executed evidence agree.

Prove ordinary layout/colour classes and supported class/style/render callbacks retain default
presence plus disjoint colour feedback. Compare them with actual caller transition/animation families,
including a caller curve or delay that differs while duration and property names match. Verify local
fractional token overrides through browser-normalized CSS values and the actual binding's entry/exit
form, rather than an unrelated recipe with a coincidentally equal duration. Exercise initial none,
same-target zero, live mode changes and close/reopen without cancelling caller/native handles or
changing callback/ref semantics. Removing an override establishes the current baseline without an
entrance replay. These acceptance cases do not grant arbitrary stylesheet-origin inference.

Separate external ref registration from visual-owner identity in these fixtures. A new inline ref
on the same host/entity/target must hand off registration without settling or restarting an eligible
animation; actual node/entity replacement must revoke retired write authority. Prove both the
continuity case and late-cleanup/replacement case, including ordinary callback/render rerenders.
For retained native popups, distinguish visual completion, a connected closed host and actual unmount
under the primitive's existing policy. Preserve caller handles on the same surviving host, allow
native removal to end them, and never use an infinite caller loop as an added Cadence exit hold.

Review inherited parameter assignments at their actual dependency owner. DatePicker's inherited
compact size binding must match Popover's actual compact binding and execute at that single host,
without running a second Calendar size writer. Chart interpolation preflight must include
still-active series from earlier revisions before per-sample animation allocation; final data rendering
is mandatory even when decoration exceeds the bound. These remain implementation acceptance gates.

Gate: meaningful algorithm, lifecycle and browser fixtures cover repeated characters, Unicode,
multiline shaping fallback, numeric formatting, rapid retargeting, hidden/zero-size measurement,
SSR/hydration, nested modes, live downgrades and clean unmount. Do not require per-frame React state
updates or a persistent observer for a static component without measured content.

Include deterministic string/number/identity dispatch, formatter-only and cross-zero/negative-zero
changes, unchanged formatted output and compact/exponent scale changes. Prove current disabled/caller
opacity survives presence/loop cleanup, focused entering controls remain visible, custom render keeps
refs/direct-child structure, and effect replay/abandoned renders create no duplicate owners. Exercise
forced-colours, print, document hiding/restoration and nested/portalled contexts. These are pending
shared gates, not evidence supplied by the design files.
Include positive-to-positive clock changes, then zero and live downgrade on the same target: captured
finite tween clocks versus retimed physics/scroll controllers must follow the preset policy. Prove
exact opacity-only surface forms, chevron versus copy-glyph targets, native input foreground versus
display helpers, and hover/focus/collapse arbitration for accessory controls. Colour checks cover
fixed shadow topology, immediate focus geometry, pseudo-elements and final cascade restoration;
none of these design statements establish an implemented capability.

Prove built-in numeric integration preserves the pre-helper display path: raw numeric children such
as 1000, 1.234567, negative zero and exponent notation must not acquire Intl defaults. Existing format
APIs remain authoritative; unsafe exact decomposition stays immediate. Exercise falsy/placeholder and
return-null branches, including FieldError precedence and FieldSeparator content. Text fixtures retain
white-space/newlines/tabs, text-transform, spacing, font features and inline flow; numeric fixtures
retain proportional-digit metrics unless the existing style already opts into tabular digits.

Keep default autofocus at its existing lifecycle point while settling only conflicting entry
envelopes; independent backdrop paint may continue. Geometry fixtures cover non-default box-sizing,
padding/borders/scrollbars and scaled ancestors, with safe coordinate conversion or immediate native
fallback. Stagger fixtures apply positive clock changes without exceeding the final delay/concurrency
ceilings; these are still pending browser and algorithm acceptance.

Progress fixtures distinguish monotonic presentation phase from business percentage: interrupt a
fill currently at 60 when the committed value changes from 100 to 80, and cover unsafe two-cell reel
retargets. The latest readout becomes immediate when coordination is invalid; fill may retarget
independently without invented values or a second owner. Verify that Carousel track navigation,
Calendar's actual table and Toc's reading indicator retain their engine ownership while independent
root presence or content-driven outer-host geometry follows the separate target component contracts.

### Phase 3: Five pilots

Depends on Phase 2. Migrate Button and Badge first to validate shared content/geometry. Use Card to
prove nested ownership, then Tabs and Select to prove retained selection, popup lifecycle and
multiple coordinated writers on distinct parts. For each pilot, update source, actual recipes,
MDX frontmatter/Motion contract, preview and component/browser fixtures in the same change.

Gate: unchanged upstream usage works; all applicable baseline capabilities are visible in meaningful
examples; unchanged text retains identity; no doubled geometry, stretched text, lost focus or stale
exit callback occurs. Check all modes and both themes, and measure real consumer/page costs before
using pilots as the pattern for catalogue rollout. Missing measurements or failed behavioral,
compatibility, source-budget or layout-stability checks block this gate. Apply the section 5 cost
policy to measured growth; unresolved global JS-budget and real-device requirements remain explicit
in the performance task and Phase 5, not a pilot pass claim.

### Phase 4: Catalogue rollout by ownership family

Depends on accepted pilots. Migrate remaining inline/surface/action parts, then field/selection
compositions, disclosure/popups/navigation, and finally engine/data/AI/layout families. Dependencies
precede their compositions: installed controls must pass before Data Table and Date Picker claim
their inherited behaviour. Treat the matrix as a coverage checklist and record implementation in
Git history, not a growing delivery log in this document.

Gate: each current id has an audited applicability/ownership decision for all six capabilities and
tests for its actual parts. Every animated suite executes the shared contract for full, reduced and
none. No family is accepted by testing only a generic wrapper or copying an unrelated assertion.

Review the individual file against implementation for every action, not just the six summary rows:
actual part/slot, parameter binding, geometry owner, text reflow, interruption and workload fallback
must agree. Exercise close/reopen, live modes, unchanged targets, input takeover and removal of queued
writes as applicable. Preserve CodeBlock retained-text identity, Bubble's bounded streaming policy,
immediate DataTable filter semantics and the caller's Tabs mount policy.

### Phase 5: Distribution, full-route and performance acceptance

Depends on the changed components and their dependencies passing their gates. Rebuild registry
payloads, guides and generated AI text from actual implementation. Verify copied consumer installs,
dedicated dependencies, routes and source provenance; retain immutable snapshots unchanged.
Final performance acceptance and the final audit also explicitly depend on closing the existing
performance task; accepted development gates cannot substitute for that closure.

Gate: required commands and relevant real browser/engine paths pass; complete-route measurements
meet the unchanged budgets below. Full catalogue adoption remains incomplete if a requirement is
unmeasured or fails, even if unit tests and registry builds pass.

## 6. Acceptance and unchanged budgets

The acceptance matrix includes full/reduced/none against both system preferences, live mode/clock
changes, nested providers, content changes during exit, rapid reversal, pointer/keyboard paths,
SSR/no-JS/hydration and relevant route departure. Geometry, text and number tests observe actual
properties and retained identity; a `data-motion` attribute alone is insufficient. Accessibility
checks cover readable names, duplicate outgoing text, selection/copy, native editing, focus and
errors. Test light and dark themes and realistic narrow/wide layouts.

Keep the current source gzip ceiling of each item during migration. The separate production budgets
remain initial Motion at most 48000 bytes gzip, component addition at most 8000 bytes gzip excluding
the declared shared runtime, complete-page initial JS at most 120000 bytes gzip, CLS below 0.02,
and at least 55 presented fps on a real midrange mobile device. Preserve the animation system's
concurrency/stagger limits and measurement protocol. Neither colour transitions nor CSS execution
make paint/layout work free.

Performance remains unresolved as described in [parity-plan.md](parity-plan.md#8-next-work). Measure
consumer dependencies and complete routes, including automatically requested scripts; separate cold
layout and interaction windows. Historical measurements do not certify new shared helpers or new
component code. Continue scoped remediation and affected remeasurement during development; all
required performance evidence must pass at final delivery. No framework change, relaxed budget or
dependency exemption is part of this plan.

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
metadata or content changes, then the affected browser/runtime and performance checks. Documentation
design work alone does not regenerate payloads or claim runtime conformance. Keep regression inputs
in `tests/fixtures/`, audit output in `.cache/`, and delivered provenance in Git and retained registry
snapshots.
