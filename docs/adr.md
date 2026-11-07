# Architecture decisions

These are the current decisions and their enduring rationale, not a delivery log. Keep ADR identifiers
stable. A future reversal adds a new decision with an explicit supersession; implementation outcomes
and open work belong in the plan and test suite, not appended experiment histories.

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
