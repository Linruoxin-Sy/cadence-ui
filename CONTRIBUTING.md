# Contributing to Cadence

Thanks for helping. Cadence mirrors shadcn's component API and adds a motion contract. Motion has to
explain cause and effect, every animation needs a reduced-motion branch, and the library never owns
validation.

## Before you start

- Read the [parity plan](docs/parity-plan.md) for scope, batches, compatibility metadata and budgets.
- Read the [motion v2 design](docs/animation-system.md), its [implementation plan](docs/animation-system-plan.md),
  and the [architecture overview](docs/overall-design.md). The [user motion guide](content/docs/motion.mdx)
  describes the currently shipped surface.
- Read the component's individual target contract in [the motion catalogue](docs/motion/README.md)
  and the [preset assignments](docs/motion/presets.md). Design every component's choreography separately;
  global style guides visual choices while the common execution contract stays mandatory.
- Check `content/components/` and the open issues to see whether the component already exists; recipes
  are listed in the [animation system](docs/animation-system.md).
- Search existing issues before opening a new one.

Motion v2 assesses every component for applicable capabilities and assigns one owner to each animated
property; tiers do not grant or prohibit animation. The current runtime, registry schema, metadata, MDX,
and test helpers retain compatibility while migration continues. Shared `state.color` and CSS loop
executors have support; each component must still adopt the real owner, declare its implemented forms
and prove the corresponding policies in all three modes. The overall v2 marker remains gated.
Planned `text.change`, numeric rolling changes and public primitives are not installable APIs merely
because they appear in the design. Keep source, declarations and user-facing documentation in sync
for each migrated component, and leave outstanding implementation work explicit in the plan.

## Local setup

```bash
pnpm install
pnpm dev
```

The docs site renders every component from `registry/cadence/**`, so you can iterate on a component and
its preview in one place.

## Scaffold a component

```bash
node scripts/new-item.mjs --name tooltip --tier T2 --batch B4 --title "Tooltip" \
  --description "A short label shown on hover or focus." --motion popup.anchored
```

The script writes the source, docs, preview, and test, registers the preview, and appends the registry
item. Use `--input` for new input/data-owning APIs to include Validation and data ownership.
Then replace the stub body and TODO prose with the upstream API and source-backed documentation.

Also author `docs/motion/components/<id>.md` and its catalogue index entry before implementing motion.
The current scaffold does not generate these files. Assess six capability owners, each action's three
modes, rapid update/reversal/close behavior, preset bindings and geometry/performance constraints.
Keep target design in that file and actual delivered claims in public MDX; parameter values belong
in the shared catalogue/source, not component-local constants.

## What a component needs

A pull request is ready when the component has:

1. **Source** in `registry/cadence/<id>/index.tsx`, relative imports only (`../lib/motion`), `data-slot`
   on every part, and the same exports and props as shadcn.
2. **Registry metadata**: `meta.tier`, `meta.batch` (the parity batch from
   [the plan](docs/parity-plan.md#7-batches)), `meta.motion`, `meta.intensity`, `meta.complexity`, and
   `meta.upstream`. These compatibility fields remain required. Add exact installed ownership in
   `meta.motionCoverage` and review authored extent/travel/coordination in `meta.motionProfile`;
   neither promotes a legacy target or replaces runtime evidence. Declare only implemented recipes.
   Intra-registry dependencies are namespaced (`@cadence/button`).
3. **Docs** in `content/components/<id>.mdx` with frontmatter that matches `registry.json`
   (title, description, deps, registryDeps, motion, motionCoverage, motionProfile, intensity, complexity, since, tier). Follow the [tier-specific template](docs/documentation-site-and-distribution.md#2-component-page-templates-tier-specific-membership):
   required membership/order, responsiveness/performance at every tier, a motion contract table,
   and input data ownership. Follow the [preview authoring contract](docs/documentation-site-and-distribution.md#22-preview-capabilities):
   keep the top card focused on the component itself, with no demo configuration controls; show a compact
   range or its common usage. Explain states, variants and features in flat sections after Usage, each
   with a live preview card and matching runnable code. Extra flat examples do not change template validity.
4. **UI only**: no validation imports and no `schema` / `resolver` / `validate` props. Invalid state
   comes from `aria-invalid` / `data-invalid`. See [API and data ownership](docs/overall-design.md#8-component-api-and-ownership).
5. **Motion conformance**: the recipes declared in `meta.motion`, the MDX frontmatter, and the Motion contract
   table match what the source actually runs. Audit capability applicability and property ownership, with
   explicit branches driven by `useCadenceMotion().reduced` and `data-motion`. The v2 target preserves
   applicable short opacity/colour feedback under `reduced`, removes travel/layout/rolling/stagger and stops
   all continuous loops, including Spinner. Reveal stays visible without hidden-state enhancement.
   `none` cancels every animation, transition and delay, including colour. These are migration requirements,
   not guarantees of the unchanged runtime. Run the [motion conformance check](AGENTS.md#motion-conformance-check)
   and the checks for the implemented migration step before the PR.
6. **Accessibility**: roles, keyboard, focus, and a screen-reader story.
7. **Tests** in `tests/components/<id>.test.tsx` covering the API, the slot, the keyboard path, the `reduced`
   branch, and the `none` mode. Animated suites must execute `expectMotionContract(mode)` from
   `tests/motion-contract.tsx` after rendering/exercising the real parts in all three modes. Vitest's
   mandatory reporter requires successful runtime evidence; importing the helper or skipping its tests
   fails. Keep behavior assertions for engine/native WAAPI writers and existing interactions. A component
   with no implemented animated capability needs no provider/helper solely because of a tier label.
   The current helper's legacy exceptions, including reduced-mode Spinner rotation, remain until the
   implementation plan migrates them. Passing it does not certify v2 colour, loop or reveal behaviour;
   retain the design's browser evidence requirements.
8. **A preview** in `components/site/previews/<id>.tsx`, with its own generated
   `app/(site)/components/<id>/page.tsx` entry. The scaffold writes the entry;
   `registry:check` verifies its single preview import and shared page template.

Then run:

```bash
pnpm registry:build && pnpm check
```

which runs typecheck, Biome (lint, formatting, and import order), the registry checks (targets, payload
freshness, docs, export names, tier budgets, P11), and the unit tests. `registry:check` verifies recipe
declarations and requires animated test files; the test reporter
requires three-mode helper adoption. Neither replaces the animation review or browser evidence for
running cancellation, first paint, nested providers and measured geometry.

## Style

- Formatting, import order, and lint rules are Biome's. Run `pnpm format` (or `pnpm lint:fix`) instead of
  hand-formatting; `pnpm lint` fails when a file is not formatted.
- Tailwind v4 utilities and shadcn semantic tokens only. No raw colors, no `transition-all`.
- Motion presets from `registry/cadence/lib/motion.ts`. No ad-hoc durations.
- Animate transform, opacity, or bounded filter; use measured, clamped `geometry.resize` for applicable
  content-driven width/height, instant under reduced/none. Scope colour feedback to explicit properties.
  Assign one writer per property and preserve native editing, direct manipulation and performance budgets.
- Use Base UI `render`, `data-slot` on each part, and `cn()` with user classes last.
- Sentence case in UI copy.

## Licensing

By contributing, you agree that your contribution is licensed under the MIT License.

### Retained registry snapshots

Normal `registry:build` preserves and verifies `public/r/snapshots/**`. Never edit or delete a
previously distributed snapshot. To prepare an explicit snapshot, build/check current aliases,
run `node scripts/freeze-registry.mjs`, review and commit its entire new hash directory separately.
Do not freeze for ordinary docs/handoff commits. Verify production GET/HEAD/ETag/304/cache headers
when changing distribution; static file existence is not HTTP evidence. See ADR-017 and the registry guide.


## Internal documentation

Read docs/README.md for the current design contracts and future work. Keep completed-task records
and handoffs in Git history. Reusable tests read minimal inputs from tests/fixtures; generated
audit output, traces and screenshots belong in ignored .cache/audits. Do not make tests depend on
previous measurement reports or add generated report directories under docs.
