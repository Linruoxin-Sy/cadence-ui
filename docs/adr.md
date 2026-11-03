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
