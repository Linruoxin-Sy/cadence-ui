# Architecture decisions

These are the current decisions and their enduring rationale, not a delivery log. Keep ADR identifiers
stable. A future reversal adds a new decision with an explicit supersession; implementation outcomes
and open work belong in the plan and test suite, not appended experiment histories.

[ADR-026](#adr-026--v2-performance-budgets-what-is-gated-what-is-monitored-what-is-retired) is current
authority for Motion v2 budgets and enforcement; [ADR-023](#adr-023--effects-first-migration-performance-governance-afterwards)
remains the record of why they were advisory during migration.
[ADR-027](#adr-027--route-remainder-exceptions-the-six-pages-whose-remainder-is-their-own-item) is the
disposition of the six `route-remainder` exceedances under that authority. Earlier ADR text remains
historical; conflicting numerical budget/performance-stage requirements do not gate migration.

## ADR-001 · Distribute registry-first

Accepted. Consumers own copied MIT source. Distribute registry items and embedded docs; do not publish a runtime UI package or add runtime licensing.

## ADR-002 · Base UI primitives

Accepted. Use Base UI for accessibility, state, focus and controlled/uncontrolled semantics. Motion decorates those primitives rather than replacing their ownership.

## ADR-003 · Tailwind v4 and semantic tokens

Accepted. Use Tailwind v4 and shadcn semantic variables. Do not add CSS Modules or a parallel styling system to shipped components.

## ADR-004 · Motion first, optional GSAP

Accepted. Use Motion for regular UI and existing CSS/engine adapters where specified. A timeline/narrative feature may declare optional GSAP explicitly; never load it globally. No actual GSAP writer currently needs certification.

## ADR-005 · Mirror the install tree

Accepted, with entry filenames specified by ADR-014. Keep the relative relationships of registry/cadence source and consumer components/cadence files identical. No AST rewriting or host-alias imports.

## ADR-006 · Docs as data

Accepted. One MDX component body feeds the rendered page, registry docs and generated llms content. Frontmatter and registry metadata must agree.

## ADR-007 · Contract and matrix testing

Accepted. Unit tests execute the motion contract in all three modes; real browser tests cover relevant preference, interaction, first-paint, cancellation and engine paths. Visual review complements these checks rather than replacing them. Do not infer universal caller coverage from a finite matrix.

## ADR-008 · Free MIT scope

Accepted. No paid tier, account, billing, licence enforcement or telemetry is part of the current scope. Future monetisation needs an explicit decision; meta.tier denotes motion complexity, not payment.

## ADR-009 · Single Next App Router product

Accepted. Keep one repository and one Next App Router product. Isolated hydration/framework research does not adopt a replacement or authorize deployment. Revisit the product architecture only with a concrete full-route result and an explicit decision.

## ADR-010 · Base render instead of asChild

Accepted. Forward Base UI render, class/style callbacks, native events and React refs according to the real primitive API. Do not introduce an asChild compatibility layer.

## ADR-011 · API-compatible shadcn superset

Accepted. Match pinned upstream ids, exports, props/defaults and data-slot. Additive variants/props require documentation. Record justified prop/default deviations in meta.parity.props; missing and obsolete records fail parity. Applications retain validation/data ownership.

## ADR-012 · Physics-defined interruptible springs

Accepted. Author visualDuration/bounce tokens; only continuity recipes convert to stiffness/damping/mass after timeScale. The conversion uses the motion module's settle factor and must be checked on Motion upgrades. Keep small-range springs time-defined; zero clocks resolve before division or spring generation.

## ADR-013 · Measured geometry and cross-tree handoff recipes

Accepted. geometry.resize and handoff own measurement, clamping, origin fallback and mode semantics. Interpolated width/height is T3+ and clamped; reduced geometry jumps, reduced handoff cross-fades, none is immediate. Use layout.shared for a persistent identity. A flight requires a real visible origin; keyboard/external changes use the documented fallback.

## ADR-014 · Directory index entry points

Accepted. registry/cadence/<id>/index.tsx installs to @components/cadence/<id>/index.tsx; consumers import @/components/cadence/<id>. Keep actual filenames on multi-file helpers. Docs imports must resolve to installed files, with no duplicated id or explicit /index segment.

## ADR-015 · Instant measured layout is not motion

Accepted. An observed size applied immediately is layout at any tier; it needs no motion recipe/provider. Observe content and size a separate shell to avoid feedback loops. Ignore zero hidden/mount measurements until a real size exists. Interpolation still follows ADR-013.

## ADR-016 · Full-route proof before framework adoption

Investigation; ADR-009 remains accepted. Research retains all content, site controls, SSR/noJS, focus/accessibility, real preview behaviour and required Motion features. Count every automatic script with the unchanged performance protocol; a reduced fixture cannot prove a full route. No compatibility-layer React substitution, global domAnimation downgrade, hidden application payload or observation-window deferral. Product migration, changed budgets/dependency exemptions and broader rollout each require an explicit decision. Current unresolved work is in parity-plan.md, not an experiment diary.

## ADR-017 · Revalidated aliases and immutable retained snapshots

Accepted. Latest /r aliases revalidate with exact-byte SHA-256 ETags and GET/HEAD/304; errors are no-store. A production beforeFiles rewrite owns public/r requests. Explicit freeze-registry creates tracked tree-hash directories and per-file manifests; normal builds verify and preserve every snapshot and the retention inventory. Never rewrite/delete distributed snapshots. Pin the @cadence namespace to the snapshot URL so transitive dependencies are pinned; package lockfiles still own package versions. Static/CDN hosting needs equivalent security/cache/conditional rules and separate validation.

## ADR-018 · Explicit origin for Cadence originals

Accepted for the requested Toc addition. A source-distributed original without a counterpart in the pinned
shadcn catalogue records `meta.upstream` with registry `cadence`, style `native`, version equal to `since`,
and a nonempty origin reason. Registry validation still enforces the same docs, source, dependency,
budget and applicable motion rules. Parity reports only actual shadcn comparisons; it rejects reclassifying
a pinned shadcn item as an original. Upstream sync and manifest writing omit original components rather
than inventing external sources. Future catalogue expansion still requires explicit scope.

## ADR-019 · Component routes own their preview import

Accepted. Keep a small static Next entry per component URL, importing that component's preview
and calling one shared server page template. Use the same reference for top and named MDX specimens;
the client frame receives children and owns mode exposure and instant measurement. Scaffolding and
registry checks keep entries aligned with the catalogue. Shared navigation disables automatic
destination prefetching to avoid loading other preview graphs before navigation. All current-page
specimens retain immediate SSR and hydration. This preserves ADR-009 and does not certify performance
budgets; complete-route requests and functional checks remain required.

## ADR-020 · Capability-based animation system v2

Accepted as the target design, with implementation governed by
[animation-system.md](animation-system.md) and the [rollout plan](animation-system-plan.md).
This decision does not claim that the current runtime, registry schema, validators, catalogue or
public documentation have migrated.

Give every component a reviewed contract for its applicable changes, including appearance/removal,
geometry, surface/text colour, text replacement, numeric updates and its own interactions. Describe
each capability as default, inherited, composed or not applicable with a reason. Structural parts
are eligible for these capabilities; they do not acquire gratuitous effects or duplicate the writer
of an owning parent. Tier remains a compatibility field for the current schema, source budgets and
documentation profiles, not a capability gate. Existing budget limits are unchanged. Target authored
intensity is an explicit judgement about implemented behaviour, not a recipe-prefix inference or a
runtime multiplier. The matrix and intensity tooling still require migration.

Partially supersedes ADR-004's positioning of Motion as the general default writer: CSS owns ordinary
state-colour feedback, Motion owns the geometry/content work assigned to it, and Base UI/native or
third-party engines retain their existing ownership through policy adapters. There is one writer per
property, coordinated by shared tokens, causes, modes and cancellation. Optional GSAP remains an
explicit dependency for a justified feature; it is neither loaded globally nor newly certified.

Partially supersedes ADR-013's T3+ permission restriction on interpolated geometry. Capability and
measured performance justify its use at any tier; measurement, clamping, origin fallback, single
ownership and immediate reduced/none geometry remain required. ADR-015's distinction between instant
measurement and interpolation remains valid. Any inference from ADR-015 that structural components
must remain static is superseded; instant layout still needs no invented motion recipe or provider.

The target none mode stops every Cadence-authored transition, including colour, border and shadow
feedback, and settles an active writer before paint. The target reduced mode removes autonomous
continuous animation and preserves the same state through static text, icons or progress. Existing
reduced spinner/opacity loops and colour transitions outside the current motion gate are migration
baselines, not permanent exceptions. Direct manipulation and semantic state remain available;
animation must not delay input, validation, focus, accessibility updates or completion of an action.

Adopt shared text-difference and number-roller primitives rather than rewriting arbitrary child
trees. Preserve native editing and upstream ids, exports, props/defaults, render/ref/event behaviour
and data-slot values. Capability coverage must compose without duplicate size or transform writers,
and updates must interrupt from the current presentation. New recipes and APIs require implemented
mode branches, cancellation and performance evidence before they enter registry metadata or public
MDX. Keep the source/declared/documented contract equal throughout staged delivery; target-only APIs
belong in the internal design and rollout, not generated consumer documentation.

## ADR-021 · Individual component choreography with shared execution rules

Accepted as the target authoring model, extending ADR-020 without claiming implementation.

Design each component's animation independently at the level of real parts, semantic causes and
coordinated actions. Global animation style provides guidance about causality, rhythm, readability
and restraint. It does not prescribe one identical entrance, duration or interaction for the catalogue.
Each component may select reviewed visual presets appropriate to its role. Shared mode behavior,
native semantics, upstream compatibility, SSR visibility, retained text identity, ownership,
interruption and performance budgets remain mandatory and cannot be overridden by a local design.

Store the designs in one discoverable directory, split into one maintained Markdown file per current
UI/block id: `docs/motion/components/<id>.md`. Keep compound parts together so their property and
lifecycle ownership can be reviewed as a composition. `docs/motion/README.md` owns conventions and
the complete index; `docs/motion/presets.md` owns parameter assignments and binding precedence.
This avoids both a monolithic per-action catalogue and scattered design notes alongside implementation.
These are durable design records, not generated audits or completion logs.

Every individual contract assesses six baseline capabilities, names the responsible parts and
default/inherited/composed/not-applicable relationships, describes each action in full/reduced/none,
and specifies rapid updates, reversal/reopen, close/unmount, parameter bindings, geometry constraints
and workload boundaries. Relevant extra effects are designed individually rather than copied across
families. Single-active-item indicators and multiple-selection feedback are distinct compositions.

Distinguish tokens, recipes, presets and component bindings. Numeric values and physical constants
remain authored once in `registry/cadence/lib/motion.ts`; CSS and other executors derive from that
source. A component binding such as `button.label.replace` selects a documented preset/recipe but
does not become a Recipe union member, metadata entry or public prop. Compact/panel parameter
refinements are permitted through reviewed shared presets. This refines the system's default timing
assignments without weakening the tokens-only rule, introducing a parallel per-component parameter
database or requiring a whole-catalogue runtime configuration import.

Internal component files own target choreography; the animation system owns shared contracts; the
rollout plan owns implementation dependencies. Public MDX, metadata and shipped source continue to
describe implemented behavior. Add preset resolution, capability/reference validation, scaffold
support and actual component integration through the pending rollout, with corresponding tests and
distribution changes. Updating these design documents alone changes no runtime or installation claim.

## ADR-022 · Continuous performance work with final hard gates

Accepted as an implementation sequencing decision within the authorized Motion v2 scope. Separate
the known complete-route performance baseline from the technical dependencies of shared capabilities
and component migration. Shared runtime development may follow contract/tooling alignment without
first closing the existing performance task. That task remains pending until its required evidence
passes, and must close before final performance acceptance and the final audit.

Known complete Button and Data Table routes exceed the page budget; actual initial Motion, independent
copied-consumer costs and real-device frame evidence are not all accepted. These failures and missing
measurements remain explicit and bound to their measured source. A compatible local optimization or
an accepted development stage does not certify global performance or complete the Motion v2 goal.

Performance work continues throughout implementation. Preserve each item's source ceiling, mandatory
checks and affected real browser/engine and performance measurements. Shared work and all five pilots
require real consumer and complete-page measurements before their patterns guide further migration.
Compare affected costs with their recorded baselines. Before propagating a pattern, fix behavior,
compatibility, source-budget or layout-stability regressions and unexplained or unbounded cost growth.
Quantified costs of authorized capabilities require a named remediation owner/task and plan, tracked
against unchanged limits in the unresolved performance task and final acceptance. Development does
not require zero byte growth in every build; changing a baseline cannot turn a failed budget into a
pass. The final gate is not permission to accumulate unbounded cost.

Development gates accept their own behavior, compatibility, source-budget and regression evidence;
required stage evidence must pass or, for measurement, be collected with its actual result. Existing
global JS-budget failures and missing real-device proof remain unresolved in the performance task
and final acceptance. Keep performance assertions unchanged and report failures as failures. Missing
stage measurements or failed behavior, compatibility, source budgets or layout stability still block
that development gate. Neither shared nor pilot stage completion may be presented as performance
acceptance.

This changes acceptance timing, not target scope, budget numbers, measurement coverage or runtime
conformance requirements. All 59 components and four planned public primitives remain required;
source, metadata, public documentation and tests must agree on implemented capabilities. Final
delivery cannot pass with any failed or unmeasured requirement. ADR-009 and ADR-016 retain their
framework and product-adoption constraints; this decision authorizes no framework replacement,
budget relaxation, dependency exemption or publication of planned capabilities.

## ADR-023 · Effects-first migration, performance governance afterwards

Accepted by explicit user instruction: “放宽限制，先把效果做出来，新的动画系统完全迁移后再考虑这件事，把这个写进约定”.

Prioritize complete intended new animation effects, shared functionality and every component's
functional migration. During migration, tier source ceilings, component 8 KB, Motion 48 KB, page
120 KB, FPS/CLS and other numerical performance budgets are advisory records. They cannot block a
component, shared phase or overall functional migration completion, reduce required effects or
require premature optimization. Retain old values, source-bound failures and missing measurements
truthfully; advisory/deferred does not mean passed or performance-accepted.

Numerical workload limits, including concurrency, text/digit/sample counts, stagger and drawing
areas, are adjustable settings rather than fixed effect permissions. Effect tasks may revise shared
source/presets and relevant tests with finite-work reasoning and behavior/visual evidence. Preserve
bounded work, no infinite backlog, latest-target convergence and cancellation. This decision changes
no runtime constants by itself and removes no invalid-input/native-safety fallback.

After full-library functional migration, separately assess performance, justify suitable v2 budgets,
optimize and accept performance. Old limits do not automatically return as immutable final standards.
Functional migration completion and performance governance completion are separate statuses. Retain
existing records; migration no longer requires a budget-only build, complete-page cost matrix or
real-device performance acceptance per change. Use behavioral/browser/visual checks appropriate to
the task; this policy task launches no new full-library cost/performance audit.

API/native interaction/accessibility, full/reduced/none, cancellation/interruption, one property
owner, genuine source/action evidence, declaration = implementation = documentation, compatibility
and correctness checks remain mandatory. Actual functional evidence still gates v2 markers; this
policy promotes no unfinished component or overall v2 claim. F02 native behavior issues remain open.
S02/F03 retain IDs and historical evidence as post-functional-migration performance governance,
not component/shared/functional completion prerequisites.

Supersedes ADR-022's continuous optimization, mandatory stage measurements, source/CLS hard gates
and final unchanged-budget coupling. Partially supersedes numerical budget/performance acceptance
requirements in ADR-013, ADR-016, ADR-018, ADR-019, ADR-020 and ADR-021 and corresponding active design,
preset, component-contract, contributor and queue wording. Those decisions' API, architecture/framework
adoption, provenance, native behavior, bounded engineering and correctness requirements remain.
Historical measurement protocols remain available whenever explicitly run. A future explicit
performance decision establishes redesigned budgets and enforcement; migration completion cannot
silently restore old thresholds or certify prior exceedances.

## ADR-024 · An inactive continuous owner releases the CSS family

`useContinuousMotion` used to pin `animation: none` on the host while it was inactive
(`active = false`) and still report an allowed ownership. That kept one property claimed by a
writer that was not running, so a component whose status feedback is phase-based could not hand the
same property to its own entrance/exit channel: the joint-evidence and v2 action gates correctly
report two writers of `opacity` on one physical host even when only one of them ever paints.

Decision: inactivity that comes from the owner's own intent (`active = false`) **releases** the
animation family and leaves no ownership behind. The environment pauses stay as they are — an
offscreen, hidden or downgraded owner still owns the family and writes the static equivalent
(`animation: none`), so "pause, do not abandon" is unchanged. A released owner certifies nothing:
joint and contract evidence skip it, so a loop receipt always means a live, executing owner.

This is what lets a single host sequence its opacity work: an entrance/exit channel owns `opacity`
while it runs, and the status loop takes the property only after the same owner releases it. It
grants no component a v2 marker by itself; each migrated component still needs its own executed
mode/action evidence.

Supersedes the "inactive owner still owns `animation: none`" expectation in the shared runtime
suite, the joint-evidence helper and the browser policy pilot; ADR-020's loop policy and ADR-021's
ownership rules stay in force.

## ADR-025 · Payloads carry their own content hash; llms output is not committed

`build-registry.mjs` stamped `git rev-parse --short HEAD` into every item's `meta.sourceSha` and wrote
a tracked 2.3 MB `public/llms-full.txt`. Both are whole-artifact writes on every commit: one component
change rewrote all 63 payloads plus `catalog.json` and the entire llms file, so two people migrating
different components always conflicted and a reviewer could not see the real diff.

Decision, in four parts.

**`meta.sourceSha` is the item's own content hash.** It is 8 hex characters of SHA-256 over the item's
`files` (path, install target and content digest, sorted by path), its expanded `docs` body and its
metadata without `sourceSha` (keys sorted at every depth). `scripts/payload-hash.mjs` owns that
definition, so the build and any future freshness comparison cannot disagree about what "the same
content" means. Identical input produces identical bytes; editing component A changes A's payload and
nothing else. The hash is traceability, not a release identifier: it says which content a consumer
received, not which commit produced it, and it does not replace `meta.since` or the frozen snapshots
of ADR-017.

**The shared index omits it.** `public/r/registry.json` and `public/r/catalog.json` are the one file
every component edit touches. Carrying a per-item hash there would restore the original problem at
index scale, so the index and catalog publish item metadata without `sourceSha`. The per-item payload
is the traceability surface; a client that needs the hash reads `/r/<id>.json`.

**Generated llms output leaves Git.** `public/llms.txt` and `public/llms-full.txt` are ignored and
untracked. `pnpm registry:build` writes them, CI's `prepare` job builds and uploads them as the
`registry-payloads` artifact that every downstream job downloads, and `pnpm build` regenerates them for
deployment. `registry:check` still compares the full file against every expanded docs body; when the
file is missing it fails with the command that produces it instead of skipping the comparison.

**`items` are written in registry id order.** The same reasoning applies one level up. `registry.json`
grew only at the bottom, so every component appended 40–50 lines in the same region and two open
pull requests conflicted there by construction; the resolution ("take both and rerun the build") was
folklore. The build now writes `items` sorted by `name` — ascending code-unit order, not
`localeCompare`, because ICU collation would make a committed artifact depend on the machine — and
reorders the source file when a merge left it out of order, so the rebuild _is_ the resolution.
`scripts/new-item.mjs` inserts a scaffold at that position, and `registry:check` fails when the
committed file disagrees or repeats an id, which also makes "take both sides" unable to hide a double
add of one component. The contributor-facing rule lives in the distribution guide §3.4.

The reorder moves whole entries and nothing else: `registry.json` is Biome-formatted, and re-serialising
it would expand every inline array and bury the conflict resolution in formatting noise. Reordering
the existing 80 items was therefore its own one-time commit. Ordering alone changes no payload byte:
the per-item `public/r/<id>.json` and `.md` files are untouched, and install sections keep their
dependency order because `installationPlan` walks `registryDependencies`, not the `items` array.
`public/r/registry.json` and `public/r/catalog.json` follow the source order because the build derives
them from it, and `registry:check` compares the published order directly. The side effect worth
stating: registry order is also the catalogue's reading order, so entries within a batch are now
alphabetical.

Ownership follows from that: the build is the only writer of `public/r/**` and the llms files; nobody
hand-edits them, and a conflict is resolved by rebuilding on top of the merge result rather than by
choosing a side. A pull request touching one component commits that component's payload, and a
whole-tree payload diff means the build itself changed and must be reviewed as such. `public/r/snapshots/**`
keeps ADR-017's frozen distribution and is never regenerated by this rule.

Does not change the semantics of a frozen snapshot or the HTTP/ETag contract of `/r`. Item ordering,
out of scope in the original decision, is decided by the part above. The "载荷随仓库提交" reading of
the distribution guide is superseded for the llms files only; per-component payloads stay committed
and reviewed.

## ADR-026 · v2 performance budgets: what is gated, what is monitored, what is retired

Accepted by S02 (#83), slice S02-B (#172), on the measurement S02-A recorded (#171). The decision
covers the library's own cost and the site that documents it; it does not re-open any effect, API or
compatibility claim. The evidence base is the S02-A matrix: 63 registry ids, 73 production routes,
two viewports, commit `bff69e6c`, one `next build`, one `next start`. Every number below is a cell in
that matrix; `.cache/s02-a/` is its raw form and is not committed.

ADR-023 made the old numbers advisory so the migration could finish. That phase is over, so each number
has to become either a decision or a retirement. This ADR does not restore them: four survive on a basis
the matrix supports, one was never met, and one measured something other than what it named.

### What the historical numbers measured, and what happened to each

**Complete-page initial JS ≤ 120,000 B — replaced.** The limit was introduced on 2026-11-02 with the
audit that recorded it as already red: the complete Button route was 221,511 B at source `4fe1a51`,
1.85× the limit, and no candidate in that investigation came near it. It has never been met, by any
route, at any commit. The reason is now measurable rather than speculative: 366,100 B of every
component route is a 19-chunk shell that all 63 component routes load, so the whole catalogue sits
between 367,600 B and 503,400 B and the ten shared documentation routes sit at 352,800 B. No component
author can move that number, and applying it per route means 63 permanent red cells that no pull
request can turn green — the same failure mode ADR-023 had to legislate away.

**Per-component added JS ≤ 8,000 B, shared runtime excluded — kept, with the basis corrected.** The
number was right and the measurement was wrong. `consumer-bundle-budget.mjs` applied it to the
reference-graph addition, a basis that subtracts the shared runtime but still charges the component for
every dedicated dependency it wraps: Recharts for `chart` (120,936 B), DayPicker for `date-picker`
(91,690 B), the highlighter for `code-block` (201,238 B). That is not the component's addition; it is
the dependency's cost, and the component exists in order to have it. 39 of 63 ids exceeded the bar and
none of them could have been fixed by editing the component — `button-group` lost by 28 B. On the basis
the words actually describe — the item's own entry compiled with every other module external — the
population is 0.2 KB to 6.8 KB, median 2.8 KB, and 63 of 63 pass. 6,800 of 8,000 B (85%) is consumed by
`code-block`, so the limit still binds. Same number, same intent, a basis on which a violation is
something an author can act on.

**Initial Motion ≤ 48,000 B — kept unchanged.** It holds and it binds: the production compilation of
the union the registry really imports is 44,207 B, 44,450 B with the site's `useInView`, and 46,533 B
for the unshipped `domMax` candidate. 92% of the budget is consumed by the shipped union, so any new
Motion export has to be argued. No basis change: the collector compiles the actual import list, and
the import list is asserted against the source tree, so it cannot drift silently.

**Tier source gzip 4/6/10/12/14/12 KB — retired as a budget.** Two separate defects. First, the ladder
is keyed on tier, and tier is motion complexity, not size: ADR-021 and parity §6.3 already say a tier
is not an animation allowance, and a T0 item is now routinely larger than a T4 one (T0 max 24.0 KB,
T4 max 10.7 KB). Second, and decisively, the basis includes the shared helpers an item copies:
`registry/cadence/lib/inline-entrance.ts` (2,164 B gzip) plus `label-layout.ts` (3,814 B) already
exceed T0's 4,096 B before the component contains a line, because `item.files` lists those helpers.
16 of 20 T0 items therefore "violate" a rule they cannot satisfy, and 23 of 63 overall. The measurement
itself is not wrong — a consumer does receive those files — it just answers a different question
("what does this item's file list weigh") from the one the budget was believed to answer. The number
stays reported per item; no comparison is made and the ladder is no longer a target. The cost that
mattered is bounded twice by the two budgets above, which do not double-count the shared helpers.

**CLS < 0.02 — kept unchanged.** Measured maximum 0.00055 (`pagination` at 390×844, one shift), 0.00000
on all fourteen interaction windows, four route-viewport cells with a single shift each. The limit is
36× the worst observation: it is a catastrophe detector, not a tuning target, and Web Vitals' own
"good" bound (0.1) is five times looser. Keeping it costs nothing and removes a layout-shift regression
from ever being arguable.

**≥ 55 fps on a mid-range mobile device — kept as the device criterion, with a desktop proxy added.**
It was never measured: no physical device was ever available, so the matrix has no cell for it and this
ADR does not pretend otherwise. Retiring it would let F03 skip the only measurement that speaks to
smoothness on the devices consumers hold; keeping it alone would leave every regression until then
invisible. So the device criterion is unchanged and F03 owns it, and the host that does exist gets a
proxy the matrix can actually produce: the 2-second rAF window's p95 frame interval, the share of
frames over 25 ms, and the longest long-animation-frame entry. Measured today: p95 6.10–6.20 ms on a
165 Hz host, 0.33% (1280) and 0.48% (390) of frames over 25 ms, longest block 133.9 ms. That is
main-thread cadence on this host, not presented frames on a phone, and it is labelled that way wherever
it is recorded.

### The budgets

Nine entries, one classification each. "Hard gate" means a failing comparison fails the run that
measures it and must be fixed or the budget amended by a new ADR. "Monitored" means the value is
recorded and compared, a breach is reported and tracked, and the run does not fail. "Retired" means no
comparison is made. A measurement that is invalid — missing responses, page errors, a body that was
not captured, a graph the accounting cannot explain — is a **correctness failure under every class**,
including monitored and retired; it is never downgraded to "no result".

| id                     | limit                                            | class     | protects                              | measured today                   |
| ---------------------- | ------------------------------------------------ | --------- | ------------------------------------- | -------------------------------- |
| `component-local-code` | ≤ 8,000 B gzip per id                            | hard gate | one component's authored code         | 0.2–6.8 KB, max 85% consumed     |
| `component-addition`   | ≤ recorded per id + 1,024 B; new ids ≤ 224,000 B | hard gate | one component's install cost          | 0.3–201.2 KB, median 14.9 KB     |
| `motion-union`         | ≤ 48,000 B gzip                                  | hard gate | the runtime union all ids import      | 44,207 / 44,450 / 46,533 B       |
| `cls`                  | < 0.02 session maximum, cold and interaction     | hard gate | interaction and first-paint stability | max 0.00055                      |
| `route-remainder`      | ≤ 40,000 B gzip per route                        | monitored | the first-load cost a route adds      | 1.4–137.3 KB, p50 10.0, p90 38.3 |
| `page-total`           | ≤ 550,000 B gzip per route                       | monitored | first load as the user pays it        | 367.6–503.4 KB, shell 366.1 KB   |
| `frame-share`          | ≤ 1% of frames over 25 ms                        | monitored | interaction smoothness on this host   | 0.33% / 0.48%                    |
| `frame-block`          | ≤ 150 ms longest long-animation-frame entry      | monitored | no visible main-thread stall          | 133.9 ms                         |
| `tier-source`          | none (reported, not compared)                    | retired   | —                                     | 0.5–24.0 KB per item             |

Why these numbers, where they are new:

- **`component-addition` is a ratchet, not a bar.** The population spans 0.3 KB (`reveal-group`) to
  201.2 KB (`code-block`), and the spread is not sloppiness: it is which engine the component wraps. A
  flat ceiling either blesses `code-block` (anything above 201 KB) or condemns `chart` (anything below
  120 KB), and both are decisions about scope, not about cost. What is actionable is _change_: an item
  may not grow by more than 1,024 B without the growth appearing in the diff, and a new item may not
  enter above 224,000 B — the current maximum plus 11%, roughly one dependency. The recorded values
  live in `tests/fixtures/performance/consumer-addition.json` with their source commit, so a change is
  a reviewed number rather than an invisible one, exactly as `registry-snapshots.json` already works.
- **`route-remainder` is the 90th percentile of the population.** Nine routes in ten add ≤ 38,300 B, so
  40,000 B is where the outliers are named instead of blessed. Six routes exceed it today (`chart`
  137,300, `code-block` 87,600, `date-picker` 57,400, `data-table` 54,100, `sidebar` 47,300,
  `command` 41,700) and all six are dedicated-engine routes; they are recorded as exceedances and
  filed, not silently tolerated. `chart` alone is 137,000 B of Recharts in one chunk.
- **`page-total` is a drift ceiling, not a quality claim.** 503,400 B (the worst route today) plus 9.3%,
  about one large chunk. It is the number that catches "someone added 40 KB to the shared layout", and
  it is emphatically not a statement that 503 KB is good; see "What this does not claim".
- **The device criterion is separate from the proxy.** ≥ 55 fps on a real mid-range device is unchanged and
  is F03's to measure; it has no entry in the table because no collector in this repository can produce
  it. The two desktop proxies stand in between measurements.
- **The 25 ms / 150 ms / 1% proxy** comes from what 55 fps means on a 60 Hz device: an 18.2 ms frame
  period, so a frame over 25 ms has already missed a vsync and a 150 ms block has dropped eight. Measured
  margin is 2× on the share and 12% on the longest block, so a regression shows up before a person
  would call the page slow.

`installed` (the real copy-install minus an empty React app: 6.1–279.1 KB, median 78.9 KB) is measured
and recorded but **not budgeted**: it is the reference-graph addition plus the Motion runtime that
budget subtracts, so gating it would gate one cost twice, and its harness needs a networked `pnpm
install` that `pnpm check` cannot promise.

### Measurement

Every metric keeps the protocol it was measured with; nothing was redefined to look better. The one
addition is an attribution, not a re-measurement: `route-remainder` is `page-total` minus the gzip of
the chunk set present on all 63 component routes, computed from the same sweep and reported beside it,
so the total is still recorded and still compared.

| metric                                                       | command                                                                                                                                         | environment                                                                                                                                                              |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `component-local-code`, `component-addition`, `motion-union` | `node scripts/audit-w3-bundles.mjs .cache/audits/<dir>`                                                                                         | local `node_modules` from the lockfile; esbuild version recorded in the report                                                                                           |
| `cls`, `page-total`, `route-remainder`                       | `pnpm build && pnpm start --port 3100`, then `node scripts/measure-routes.mjs page --base http://127.0.0.1:3100 --width 1280` and `--width 390` | production build, fresh context per route, CDP cache disabled, load + networkidle + 10 s + networkidle, no interaction, `deviceScaleFactor` 1                            |
| `frame-share`, `frame-block`                                 | `node scripts/measure-routes.mjs frames --base http://127.0.0.1:3100 --width 1280` and `--width 390`                                            | as above, plus a 2 s window after a scripted interaction or a 240 px scroll; the display refresh rate must be recorded because absolute fps is a property of the display |
| `cls` (interaction)                                          | `pnpm exec playwright test tests/e2e/document-interaction-layout.spec.ts tests/e2e/data-table-layout.spec.ts`                                   | the browser matrix already defined there                                                                                                                                 |

Bundles are gzip level 6 on each separately served or separately emitted entity, decimal KB. CLS is the
maximum session window (gap < 1 s, span < 5 s) excluding recent-input shifts. Frame cells are a single
2-second window: repeated runs differ by < 1.5% in fps and ±1 long frame, which is the tolerance this
instrument has — a breach of the 25 ms share by less than a tenth of a point is noise, and the ADR
says so rather than inventing precision. The path `tests/fixtures/performance/` holds the executable
inputs; audit output stays in ignored `.cache/`.

### Enforcement

`scripts/performance-policy.mjs` carries the decision: `PERFORMANCE_POLICY` moves from
`functional-migration` / `advisory` / `deferred` to `performance-governance` / `budgeted` /
`pending-f03`, and `PERFORMANCE_BUDGETS` is the table above. `assessBudget` refuses a metric that is not
in that table, so a collector cannot introduce a gate the ADR does not justify, and it refuses a retired
one outright. `reportBudget` labels a monitored breach with its class; `requireBudgets` is what makes the
hard gates real, and every collector that measures one calls it after writing its raw report, so a
failure exits non-zero with all breaches listed. The tier ladder's comparison is removed from
`registry:check`, which keeps reporting the per-item figure.

`pnpm check` is the only required status, so a hard gate is only real if it runs there. `audit-w3-bundles`
measures the three bundle metrics in about four seconds from local `node_modules`, and
`tests/lib/performance-budgets.test.tsx` runs it as a gate. `cls` is a hard gate enforced by the suites
that measure it — `tests/e2e/site-js-budget.spec.ts`, `tests/e2e/document-interaction-layout.spec.ts`
and `tests/e2e/data-table-layout.spec.ts` — which run in `pnpm test:e2e` and in CI's evidence job, not in
required CI. `page-total` and `route-remainder` need a production build and a 15-minute browser sweep,
which required CI deliberately does not run, so they are monitored; the sweep is what F03 must record.
That split is the honest consequence of where the measurements can run, and it is why F03 — not a pull
request — accepts the page metrics.

An amendment is a new ADR. Editing `tests/fixtures/performance/consumer-addition.json` is not one: it
records what was measured, and a pull request that raises a number must say why in its body. A compiler
or lockfile upgrade is a budget event — re-record in that pull request and attach the report.

### What this does not claim

- **Not a performance acceptance.** Nothing here certifies the current cost as good. The library is
  inside every bar this ADR sets, and the _site_ is 3.1× to 4.2× the historical page bar because of a
  shared shell nobody has attributed yet. That is filed as its own issue with these numbers.
- **No component is accepted.** Per-component device and interaction evidence is still missing for
  almost every id; ADR-023's separation of functional completion from performance governance stands,
  and F03 owns the second half.
- **No effect was reduced.** No animation, recipe, mode, clamp or fallback changed. The only source
  touched by S02-B is measurement and policy code.
- **Silence is not a pass.** The two monitored page metrics have never been green against a bar that
  anyone can meet; they are recorded so that F03 argues with data instead of impressions.

### What F03 accepts against

F03 (#84) records, on one commit, in one report:

1. `node scripts/audit-w3-bundles.mjs` green on all three bundle metrics, including the ratchet.
2. Both `measure-routes.mjs page` sweeps and both `frames` sweeps, with environment metadata (CPU, RAM,
   OS, browser build, refresh rate, headless or not) and the production `BUILD_ID`.
3. A **real mid-range Android device** — a 2023–2024 mid-tier phone, 60 Hz, unthrottled, cold cache,
   production build over the network, screen recorded or traced with presented-frame timestamps — for
   the ≥ 55 fps criterion. Desktop emulation, rAF cadence and DevTools CPU throttling are not
   substitutes; they are the proxy in this table, nothing more.
4. `tests/e2e/document-interaction-layout.spec.ts` and `tests/e2e/data-table-layout.spec.ts` green for
   the interaction CLS windows they cover.

Acceptance requires every hard gate green and every monitored metric at or under its limit on that
commit, or an ADR naming the exception with the measurement that justifies it. The two issues S02-B
filed must be closed or explicitly dispositioned in that decision, because they are the reason the page
metrics sit where they do: [#177](https://github.com/Linruoxin-Sy/cadence-ui/issues/177) attributes the
366 142 B shared shell, and
[#178](https://github.com/Linruoxin-Sy/cadence-ui/issues/178) decides the six routes above
`route-remainder`.

## ADR-027 · `route-remainder` exceptions: the six pages whose remainder is their own item

Accepted by S03 (#178), on a sweep taken for that decision. [ADR-026](#adr-026--v2-performance-budgets-what-is-gated-what-is-monitored-what-is-retired)
keeps `route-remainder` at ≤ 40 000 B per route, monitored, and keeps its collector; this ADR is the
"naming the exception with the measurement that justifies it" clause of ADR-026's acceptance, applied to
the six routes S02-A recorded and F03 reproduced. No limit, class, collector, category or threshold
changes, `scripts/performance-policy.mjs` is untouched, and no byte of shipped source moved.

### The measurement

`7990eba2`, production `pnpm build` (`BUILD_ID=Yh1A_wCTVzxZi2CcN7TUr`), `next start --port 3103`, then
`node scripts/measure-routes.mjs page --base http://127.0.0.1:3103 --width 1280|390 --out .cache/s03-b/before`
over the whole site: 73 routes, 63 of them component routes. The protocol is ADR-026's, unchanged: a fresh
page per route in one context, cache disabled, load + networkidle + 10 s + networkidle, no interaction,
JS total = gzip6 of every JavaScript HTTP entity the page fetched, prefetch and async included, remainder
= total minus the shell. The shell is the union of URLs present on all 63 component routes: **19 chunks,
366 142 B**. Population, both widths, identical: 1 411 B minimum, 9 996 B median, **38 312 B p90** (still
under the bar), 137 253 B maximum, and exactly these six above 40 000 B — so the bar still separates an
outlier from the catalogue, and this decision names the six rather than moving the bar under them. No
route row carried a page error, a console error, an HTTP error or a missing response, and cold CLS was
0.00000 everywhere except `input-otp` and `pagination` (0.00009 / 0.00022 at 1280, 0.00038 / 0.00055 at
390). Host: AMD Ryzen 7 5800H, 16 threads, 34 204 610 560 B RAM, Windows_NT 10.0.22621, headless Edge
158.0.4370.45, Node v22.23.2, `deviceScaleFactor` 1.

The tree this ADR ships differs from the tree under measurement in `docs/*.md` only: no shipped source,
no MDX and no registry metadata changed, all of which are inputs to the page build, and `.next` was not
rebuilt between the two widths. Before and after are therefore the same build, and a repeated sweep of it
is a reproducibility check rather than an after measurement.

| route         | page total | remainder | share of the route |
| ------------- | ---------: | --------: | -----------------: |
| `chart`       |    503 395 |   137 253 |              27.3% |
| `code-block`  |    453 768 |    87 626 |              19.3% |
| `date-picker` |    423 534 |    57 392 |              13.6% |
| `data-table`  |    420 244 |    54 102 |              12.9% |
| `sidebar`     |    413 472 |    47 330 |              11.4% |
| `command`     |    407 817 |    41 675 |              10.2% |

Both widths served the same entity set and produced the same numbers to the byte, no console or HTTP
error, no missing response, and CLS 0.00000 on all twelve cells. Read by CDP initiator, five of the six
remainders are requested by the document's parser; `code-block` splits 3 651 B from the document and
83 975 B fetched by the Turbopack runtime after parse. The collector's own declared/fetched split cannot
show that, and this ADR does not rely on it: a Turbopack build fetches a lazy chunk by appending a
`<script>` element, so by the end of the window every entity looks declared.

### What the number is measuring

A component route is one item's documentation page: the item, its examples, and the registry items those
examples compose. Its remainder is the **closure of what the page mounts**. The sweep attributes each
chunk by a signature only its owner emits — a package marker (`recharts`, Shiki's `scopeName` /
`tokenColors`, date-fns' French locale) or the item's own narrow `data-slot` literals — and nothing is
apportioned: a chunk with no signature is reported with its size and left unnamed.

| route         | remainder composition (gzip B)                                                                                                                                                            |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chart`       | 137 039 one chunk: Recharts plus the item's container/tooltip/legend · 214 runtime shim                                                                                                   |
| `code-block`  | 3 651 the page's preview module · 83 975 the highlighter: core 53 469, grammars 16 606 + 6 189 + 867, two themes 3 121 + 3 186, loader 537                                                |
| `date-picker` | 27 295 DayPicker + date-fns + the calendar item · 11 070 date-picker + calendar + popover · 9 477 popover + input · 9 336 field + label + separator · 214                                 |
| `data-table`  | 20 811 one chunk carrying the item (TanStack Table features, `DataTableDemo`, its table and toggle parts) · 18 327 dropdown-menu · 7 585 checkbox + table + input · 7 165 separator · 214 |
| `sidebar`     | 17 573 the item · 11 365 skeleton · 9 490 sheet · 8 688 tooltip · 214                                                                                                                     |
| `command`     | 22 319 cmdk + the item · 9 750 dialog · 9 245 input-group + textarea · 361                                                                                                                |

Every route in the table could be brought under the bar by deleting documentation; the question this ADR
answers is whether any of those deletions is a composition decision with no reader cost. Two findings
say no, and both were measured rather than argued:

1. **On four of the six, deleting every example would not remove a byte.** `chart`, `data-table`,
   `sidebar` and `command` reach their remainder through the _item's own static imports_ — Recharts;
   TanStack Table with Dropdown Menu, Checkbox, Input and Table; Sheet, Tooltip and Skeleton; cmdk,
   Dialog and InputGroup. Those imports are the item's documented surface, and a consumer installing the
   item pays them too. The preview and the installed component are not the same surface in principle —
   the page shows eight chart specimens, nine table states, fourteen sidebar states — but the surface is
   not what sets the cost, so a composition decision has no bytes to decide.
2. **On the two routes where the page does decide the load, the page is the feature.** `code-block`
   fetches 95.8% of its remainder after parse: specimens carry `language`, the item's
   `useHighlightedCode` does `import("./highlight")`, and the runtime pulls Shiki. The boundary is
   genuine — outside the document's script set, not merely outside an observation window — and the
   collector charges it anyway, because the protocol counts every entity the page fetches while it is
   observed. Passing that route means shipping a code-block page that does not show colouring, at
   3 651 B — an eleven-fold margin under the bar bought by not documenting the item's headline feature.
   `date-picker` is the same shape, smaller: its `date-input` and `time` examples mount Field and Input,
   9 336 B that the installed item never imports, and its `locale` example asks date-fns for a French
   locale inside the 27 295 B chunk. That is a real preview-versus-install difference, it is measured,
   and together it is under 12 000 B against a 17 392 B gap.

Nothing was deleted to reach this decision, so this ADR records no reader-visible loss: the documentation
on these six pages is exactly what it was before it.

### What the bar would cost, route by route

| route         | gap to 40 000 | what would have to go                                                                                | reader loses                                                                                                    |
| ------------- | ------------: | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `chart`       |        97 253 | Recharts. Its body is 137 039 B and its reference graph is 120 936 B (ADR-026's recorded addition)   | the line, area, pie, legend, tooltip, live-data and later-insertion sections: the page stops being a chart page |
| `code-block`  |        47 626 | Shiki. The core alone is 53 469 B, more than the whole bar, and the family is 83 975 B               | colour on every specimen, and the `Highlighting` section that documents `language`                              |
| `date-picker` |        17 392 | DayPicker + date-fns (38 365 B), or every example-only body (≈11 300 B) and still 6 000 B short      | the picker itself; or the date-input, time and locale sections                                                  |
| `data-table`  |        14 102 | the Columns control's Dropdown Menu (18 327 B), which the item imports and the page does not compose | column visibility, a documented part of the item and of upstream parity                                         |
| `sidebar`     |         7 330 | one of Sheet, Tooltip or Skeleton — the smallest body (8 688 B) already exceeds the gap              | the mobile sheet, collapsed-mode tooltips, or the loading skeleton: each is a documented part of the item       |
| `command`     |         1 675 | Dialog or InputGroup — the smallest body (9 245 B) is API, not an example                            | the dialog palette, or the input-group input                                                                    |

Deleting a documented section to make a monitored bar green is the trade ADR-026 refuses in its own words:
40 000 B is where outliers are "named instead of blessed", not a bar that authorises removing what the
catalogue renders. This ADR therefore takes the other branch ADR-026 allows, and the six names are the
record: a sweep keeps reporting them, and the bar keeps governing the next route that approaches it.

### What this does not claim

- **Not a pass.** The six remain exceedances, recorded on every sweep; monitored never means passed, and
  this decision changes no reported number. F03's and S03-A's sweeps keep their own commits and values.
- **No growth licence.** The values above are the accepted ones for this composition at `7990eba2`. A
  named route that grows further is a new question, and a seventh route over the bar is not covered.
- **No engine verdict.** Replacing Recharts, Shiki, DayPicker, TanStack Table, Base UI's sheet and menu,
  or cmdk is an engine decision with its own ADR; none is proposed here, and none is implied.
- **Not a device or interaction result.** Frame share, frame block and the ≥ 55 fps device criterion are
  #180 and the unmeasured criterion, untouched by this decision.
- **Not a preview reform.** The site keeps every example it had: the documentation is unchanged, so no
  reader lost anything to reach this conclusion.

### Reopening

A route leaves this exception when the thing that puts it over stops being on the route: a first-load
boundary that defers the engine past the _fetch_ rather than past paint, an engine replaced under its own
ADR, or a documented example deliberately withdrawn with its reader cost recorded in the issue that does
it. Until one of those happens the number is reported, not re-argued.
