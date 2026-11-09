# Overall design

Cadence UI is an animation-first React component library distributed as shadcn registry source.
Installed files belong to the consumer. The documentation site uses the same source that is copied
into a consumer project. [Animation](animation-system.md), [site/distribution](documentation-site-and-distribution.md)
and [scope/future work](parity-plan.md) define their respective contracts.

The animation system's v2 design is the accepted target; [its rollout plan](animation-system-plan.md)
separates that target from delivered behaviour. A design decision does not install new recipes,
primitives or metadata fields. Source, public MDX and executable checks remain an explicit migration
baseline until each implementation slice lands with its tests and distribution updates.

## 1. Design principles

| Principle                 | Contract                                                                                           |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| P1 Source ownership       | Ordinary editable source files, no runtime UI package or injected licensing                        |
| P2 No alias assumptions   | Relative imports and bare package names inside shipped source                                      |
| P3 Motion contract        | Every component has an individual design; every action names cause, recipe, modes and cancellation |
| P4 Accessibility parity   | Preserve native semantics, keyboard/focus, screen-reader state and reduced motion                  |
| P5 Docs as data           | One component MDX body feeds the site, registry docs and generated AI text                         |
| P6 Light by default       | Declare dependencies explicitly; heavy optional engines never load incidentally                    |
| P7 Traceability           | Item metadata and sourceSha identify distributed source; snapshots identify exact bytes            |
| P8 Superset               | Same upstream ids, exports, props/defaults and data-slot; additions are documented                 |
| P9 Motion follows meaning | Cover applicable changes with coordinated motion; each property has one owner and cause            |
| P10 Pinned upstream       | upstream/manifest.json is authoritative; parity is checked against its pin                         |
| P11 UI only               | Consumers own data, form state and validation                                                      |

## 2. Architecture

`registry/cadence/**` + `registry.json` + `content/**` → registry build → `public/r/**` and
generated llms text. The Next App Router site imports registry source directly and renders MDX.
Build steps embed content, merge metadata and verify contracts; they do not rewrite component logic.
Each component has a small static Next route entry that imports its own preview and invokes the
shared server page template. The template binds that reference into MDX examples and supplies
specimens as children to the client measurement frame. The scaffold creates the entries and
registry checks verify them; no client-side catalogue chooses among all component modules.
MCP and a distributed agent skill are not implemented product channels.

## 3. Repository and install layout

| Path                                                       | Owner                                                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------ |
| registry/cadence/<id>/index.tsx                            | Component source and public exports                                            |
| registry/cadence/lib/                                      | Shared helpers, providers and motion tokens                                    |
| docs/motion/README.md, docs/motion/presets.md              | Individual-design index, shared target parameter assignments and binding rules |
| docs/motion/components/<id>.md                             | One target part-level animation contract per UI/block id                       |
| registry.json                                              | Item types, targets, dependencies, tiers and batches                           |
| upstream/manifest.json                                     | Pinned upstream API surface and visual style                                   |
| content/components/*.mdx                                   | User-facing component content and metadata                                     |
| content/docs/*.mdx                                         | User-facing guides                                                             |
| app/, components/site/, lib/                               | Next site, content loading and registry HTTP handling                          |
| public/r/                                                  | Generated aliases and tracked immutable snapshots                              |
| scripts/                                                   | Registry, parity and reusable development tools                                |
| tests/components/, tests/site/, tests/e2e/, tests/runtime/ | Behaviour, contracts and browser/runtime checks                                |
| tests/fixtures/                                            | Minimal executable test inputs, including negative source specimens            |
| .cache/                                                    | Ignored generated audit output and experimental builds                         |

Source `registry/cadence/<id>/index.tsx` installs to
`@components/cadence/<id>/index.tsx`. Consumers import `@/components/cadence/<id>`.
Shared helpers install at the same relative depth, so `../lib/motion` and `../button` survive
verbatim. No AST/import rewriting, extra consumer copy or host `@/lib/utils` dependency is allowed.
Site-only code may use `@/`. The shared `(site)` layout keeps sidebar/provider identity across
guides and catalogue navigation.

## 4. Technology and compatibility

The product uses Next App Router, React 19, Base UI, Tailwind v4, Motion, TypeScript, pnpm,
Vitest/RTL, Playwright and Biome. Exact installed ranges and resolution belong to `package.json`
and `pnpm-lock.yaml`; upstream style/pin belong to the manifest, not a consumer CLI preset.
Shipped source supports React 19.0, including cleanup refs; do not require later APIs such as
useEffectEvent. Third-party engine integrations must be reviewed on dependency upgrades.
GSAP is optional architecture, not a currently installed writer or an automatic new audit scope.

## 5. Registry and distribution

Components are `registry:ui`, compositions `registry:block`, helpers `registry:lib`; base/theme
items provide setup and tokens. An item includes only its own files. Use namespaced
`registryDependencies` such as `@cadence/button`; never duplicate dependency files or use a bare id
that resolves to shadcn's default registry. Packages go in `dependencies`.

Current aliases revalidate, while explicit tree-hash snapshots retain immutable exact bytes. See
[site/distribution §4](documentation-site-and-distribution.md#4-registry-endpoints) and ADR-017.
Neither sourceSha nor meta.since is a release announcement. Keep captured snapshots during every
build/deployment; never regenerate or delete distributed snapshots during normal work.

## 6. Metadata and docs

Every component records tier, batch, recipes, intensity, complexity, since and pinned upstream.
An explicitly scoped Cadence original instead records `meta.upstream.registry: "cadence"`,
`style: "native"`, its `since` as version, and an origin reason (ADR-018). It cannot replace a pinned item.
The MDX frontmatter matches registry metadata; the body is injected into registry payloads.
Categories are layout/form/navigation/overlay/feedback/data/ai/utility. Recipe, intensity and
complexity describe different things; intensity is authored behaviour, not a runtime multiplier.

For the v2 target, tier remains a compatibility field for the current schema, source budget and
documentation profile; it is not permission to use or deny an animation capability. Keep historical
budget values traceable as advisory comparisons under ADR-023 (animation-system §7). Complete v2
effects and functional migration before separate performance assessment, budget redesign, optimization
and acceptance; old values are not immutable final v2 standards. Any obsolete tier-to-recipe checks must migrate explicitly with the corresponding
implementation, rather than be bypassed by relabelling components.

The target capability matrix records whether each applicable behaviour is provided by default,
inherited from an owning part, available through documented composition, or not applicable with a
reason. These are distinct delivery relationships, not interchangeable claims of automatic support.
The internal reference schema in `docs/motion/README.md` checks target edges and explicit migration
state; these are not registry fields or runtime evidence. Its minimal installed counterpart,
`meta.motionCoverage`, lists every reached integration owner per declared recipe/form, with a
relationship and reason. It does not copy the six planned capabilities into installed claims.
`meta.motionProfile` describes actual extent, travel and coordination for authored intensity;
recipe names alone do not classify it. Public metadata/frontmatter and visible explanations agree.
Complete per-item v2 enforcement and the remaining shared-stage gates stay in the rollout plan.

`meta.parity.props` records justified upstream prop/default deviations; stale or missing records
fail parity. Public export/slot/default changes cannot be hidden in documentation cleanup.
Description/subtitle and template conventions are in the scope and site documents.

## 7. Theming

Reuse shadcn semantic variables and Tailwind v4 `@theme`; add semantic extensions only when needed.
Motion tokens live in the shared motion module and cadence-theme CSS. No component-local hardcoded
colours or motion values. Consumer classes win after `cn()` merging. Site brand styling stays in
site chrome and must not leak into installed components or previews. Sidebar semantic colours use
their sidebar tokens. Theme changes preserve contrast and readable focus states in both themes.

Global animation style guides causality, rhythm and restraint; individual component contracts own
their choreography. Their bindings select shared presets, including reviewed component-specific
timing refinements. [The preset catalogue](motion/presets.md) defines the single authored parameter
source, CSS/Motion output and override order. A new preset does not bypass modes, geometry clamping,
native semantics or finite-work protections, and does not introduce a consumer-facing configuration object.

## 8. Component API and ownership

Match upstream compound parts, props, defaults and data-slot. Use Base UI `render`, evaluate its
class/style callbacks correctly, merge user values last and preserve element/function render forms.
Support controlled and uncontrolled state without resetting caller values, refs, focus or node identity.
React 19 refs are props and may return cleanup functions. Native event cancellation and primary-pointer
ownership must survive wrapper composition; do not let synthetic Motion events cancel unrelated controls.

Render invalid state from aria-invalid/data-invalid and associate descriptions/errors accessibly.
Do not import validation/form-state libraries or introduce schema/resolver/validate APIs. Applications
own stable data ids, loading, filtering, retries and validation. Structural components can own
applicable animation capabilities under v2; T0 does not prohibit them. A truly static part still needs
no provider or data-motion solely to satisfy a naming convention. Add those contracts where a writer
exists, preserve upstream semantics, and account for its dependencies and source budget. Native
editable content remains immediate; animated text and number presentation must not take over input,
selection or composition state.

## 9. Shared runtime

All installable shared code lives in registry/cadence/lib and is referenced through registry items.
CadenceProvider is optional: standalone components still follow system preference. A provider adds
inherited mode/clock; a local full override cannot bypass an OS reduced-motion preference.
Every actual writer owns recipe timing and observes the mode/clock changes needed by its contract.
The v2 target coordinates CSS state feedback, Motion geometry/content work and existing native or
third-party engine adapters through the same policy; it does not require a Motion wrapper on every
DOM node. The target makes none stop all Cadence-authored transitions, including colour feedback,
and makes reduced stop autonomous continuous motion while preserving a readable static state.
Existing colour transitions and reduced loops are migration baselines, not permanent exemptions;
the animation system and rollout plan define their replacement and verification.

MotionConfig is not a promise to control arbitrary caller-authored animations. LazyMotion/m is only
an optimisation when required features, first paint and interactions remain intact; no blanket
domAnimation replacement for layout/drag users. See the animation system for the complete lifecycle.

## 10. Build and validation

- `pnpm registry:build`: shadcn build using the explicit registry, then docs/meta/sourceSha finalisation.
- `pnpm registry:check`: targets, imports, metadata, recipes, docs, payload freshness, advisory tier budgets,
  P11 and snapshot integrity.
- `pnpm parity:check`: pinned upstream exports/slots/props/defaults and declared deviations.
- `pnpm check`: typecheck, lint, registry, parity and unit tests in sequence.
- `pnpm test:e2e`: production build and browser behaviour/accessibility checks.
- `node scripts/new-item.mjs --name <id> --tier <T0..T5> --batch <B1..B9> …`: scaffold authoring files.

Rebuild registry payloads before check when registry metadata, content or shipped source changes.
Pure internal docs/tool changes do not mechanically refresh payload provenance. Keep necessary builds
and checks serial; verify a free port and stop services started by the task. Audit output belongs in
ignored .cache/audits, not docs. Build freshness is not a runtime or performance certificate.

Upstream tooling is read-only: use the pinned manifest or `shadcn docs <id>`. Never run
init/add/apply/create/preset in this authoring repository. shadcn build inside the registry pipeline
is allowed. No components.json or second components/ui tree belongs here.

## 11. Definition of done

A component requires source, matching metadata/MDX, a registered preview, meaningful API/keyboard/
accessibility tests and motion conformance where applicable. Verify actual full/reduced/none behaviour,
same-node cancellation and relevant browser paths, not only helper imports or data attributes.
Required correctness checks, current payloads and dual-theme visual review must
agree. Missing or failed functional evidence remains open even when unit tests pass. Numeric
performance comparisons/missing performance evidence are deferred under ADR-023; functional completion
does not certify performance governance. CONTRIBUTING.md
owns the PR checklist; [scope and future work](parity-plan.md) owns remaining tasks.

## 12. Security and scope

Components are MIT source with no runtime licence checks or telemetry. Keep arbitrary HTML/input
ownership explicit, handle clipboard failures visibly, and avoid exposing host environment secrets.
Publication, deployment, release tags, paid tiers and new external services require separate scope.
