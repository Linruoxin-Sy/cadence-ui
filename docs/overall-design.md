# Overall design

Cadence UI is an animation-first React component library distributed as shadcn registry source.
Installed files belong to the consumer. The documentation site uses the same source that is copied
into a consumer project. [Animation](animation-system.md), [site/distribution](documentation-site-and-distribution.md)
and [scope/future work](parity-plan.md) define their respective contracts.

## 1. Design principles

| Principle                   | Contract                                                                                |
| --------------------------- | --------------------------------------------------------------------------------------- |
| P1 Source ownership         | Ordinary editable source files, no runtime UI package or injected licensing             |
| P2 No alias assumptions     | Relative imports and bare package names inside shipped source                           |
| P3 Motion contract          | Every authored animation names its cause, recipe, modes and cancellation behaviour      |
| P4 Accessibility parity     | Preserve native semantics, keyboard/focus, screen-reader state and reduced motion       |
| P5 Docs as data             | One component MDX body feeds the site, registry docs and generated AI text              |
| P6 Light by default         | Declare dependencies explicitly; heavy optional engines never load incidentally         |
| P7 Traceability             | Item metadata and sourceSha identify distributed source; snapshots identify exact bytes |
| P8 Superset                 | Same upstream ids, exports, props/defaults and data-slot; additions are documented      |
| P9 One animation, one cause | State transitions justify motion; structural UI remains static                          |
| P10 Pinned upstream         | upstream/manifest.json is authoritative; parity is checked against its pin              |
| P11 UI only                 | Consumers own data, form state and validation                                           |

## 2. Architecture

`registry/cadence/**` + `registry.json` + `content/**` → registry build → `public/r/**` and
generated llms text. The Next App Router site imports registry source directly and renders MDX.
Build steps embed content, merge metadata and verify contracts; they do not rewrite component logic.
MCP and a distributed agent skill are not implemented product channels.

## 3. Repository and install layout

| Path                                                       | Owner                                                               |
| ---------------------------------------------------------- | ------------------------------------------------------------------- |
| registry/cadence/<id>/index.tsx                            | Component source and public exports                                 |
| registry/cadence/lib/                                      | Shared helpers, providers and motion tokens                         |
| registry.json                                              | Item types, targets, dependencies, tiers and batches                |
| upstream/manifest.json                                     | Pinned upstream API surface and visual style                        |
| content/components/*.mdx                                   | User-facing component content and metadata                          |
| content/docs/*.mdx                                         | User-facing guides                                                  |
| app/, components/site/, lib/                               | Next site, content loading and registry HTTP handling               |
| public/r/                                                  | Generated aliases and tracked immutable snapshots                   |
| scripts/                                                   | Registry, parity and reusable development tools                     |
| tests/components/, tests/site/, tests/e2e/, tests/runtime/ | Behaviour, contracts and browser/runtime checks                     |
| tests/fixtures/                                            | Minimal executable test inputs, including negative source specimens |
| .cache/                                                    | Ignored generated audit output and experimental builds              |

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
The MDX frontmatter matches registry metadata; the body is injected into registry payloads.
Categories are layout/form/navigation/overlay/feedback/data/ai/utility. Recipe, intensity and
complexity describe different things; intensity is authored behaviour, not a runtime multiplier.
`meta.parity.props` records justified upstream prop/default deviations; stale or missing records
fail parity. Public export/slot/default changes cannot be hidden in documentation cleanup.
Description/subtitle and template conventions are in the scope and site documents.

## 7. Theming

Reuse shadcn semantic variables and Tailwind v4 `@theme`; add semantic extensions only when needed.
Motion tokens live in the shared motion module and cadence-theme CSS. No component-local hardcoded
colours or motion values. Consumer classes win after `cn()` merging. Site brand styling stays in
site chrome and must not leak into installed components or previews. Sidebar semantic colours use
their sidebar tokens. Theme changes preserve contrast and readable focus states in both themes.

## 8. Component API and ownership

Match upstream compound parts, props, defaults and data-slot. Use Base UI `render`, evaluate its
class/style callbacks correctly, merge user values last and preserve element/function render forms.
Support controlled and uncontrolled state without resetting caller values, refs, focus or node identity.
React 19 refs are props and may return cleanup functions. Native event cancellation and primary-pointer
ownership must survive wrapper composition; do not let synthetic Motion events cancel unrelated controls.

Render invalid state from aria-invalid/data-invalid and associate descriptions/errors accessibly.
Do not import validation/form-state libraries or introduce schema/resolver/validate APIs. Applications
own stable data ids, loading, filtering, retries and validation. T0 structural components do not acquire
motion providers or data-motion just to satisfy an animated-component convention.

## 9. Shared runtime

All installable shared code lives in registry/cadence/lib and is referenced through registry items.
CadenceProvider is optional: standalone components still follow system preference. A provider adds
inherited mode/clock; a local full override cannot bypass an OS reduced-motion preference.
Every actual writer owns recipe timing and observes the mode/clock changes needed by its contract.
MotionConfig is not a promise to control arbitrary caller-authored animations. LazyMotion/m is only
an optimisation when required features, first paint and interactions remain intact; no blanket
domAnimation replacement for layout/drag users. See the animation system for the complete lifecycle.

## 10. Build and validation

- `pnpm registry:build`: shadcn build using the explicit registry, then docs/meta/sourceSha finalisation.
- `pnpm registry:check`: targets, imports, metadata, recipes, docs, payload freshness, tier budgets,
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
Required checks, current payloads, dual-theme visual review and declared performance budgets must
agree. An unmeasured or failed requirement remains open even when unit tests pass. CONTRIBUTING.md
owns the PR checklist; [scope and future work](parity-plan.md) owns remaining tasks.

## 12. Security and scope

Components are MIT source with no runtime licence checks or telemetry. Keep arbitrary HTML/input
ownership explicit, handle clipboard failures visibly, and avoid exposing host environment secrets.
Publication, deployment, release tags, paid tiers and new external services require separate scope.
