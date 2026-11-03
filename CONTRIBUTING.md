# Contributing to Cadence

Thanks for helping. Cadence mirrors shadcn's component API and adds a motion contract. Motion has to
explain cause and effect, every animation needs a reduced-motion branch, and the library never owns
validation.

## Before you start

- Read the [parity plan](docs/parity-plan.md) for the scope, the batch you are contributing to, and the
  motion tier of your component.
- Read the [motion system](content/docs/motion.mdx) and the [architecture overview](docs/overall-design.md).
- Check `content/components/` and the open issues to see whether the component already exists; recipes
  are listed in the [animation system](docs/animation-system.md).
- Search existing issues before opening a new one.

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

## What a component needs

A pull request is ready when the component has:

1. **Source** in `registry/cadence/<id>/index.tsx`, relative imports only (`../lib/motion`), `data-slot`
   on every part, and the same exports and props as shadcn.
2. **Registry metadata**: `meta.tier`, `meta.batch` (the parity batch from
   [the plan](docs/parity-plan.md#7-batches)), `meta.motion`, `meta.intensity`, `meta.complexity`, and
   `meta.upstream`. Intra-registry dependencies are namespaced (`@cadence/button`).
3. **Docs** in `content/components/<id>.mdx` with frontmatter that matches `registry.json`
   (title, description, deps, registryDeps, motion, intensity, complexity, since, tier). Follow the [tier-specific template](docs/documentation-site-and-distribution.md#2-component-page-templates-tier-specific-membership):
   required membership/order, responsiveness/performance at every tier, a motion contract table,
   and input data ownership. Follow the [preview authoring contract](docs/documentation-site-and-distribution.md#22-preview-capabilities):
   keep the top card focused on the component itself, with no demo configuration controls; show a compact
   range or its common usage. Explain states, variants and features in flat sections after Usage, each
   with a live preview card and matching runnable code. Extra flat examples do not change template validity.
4. **UI only**: no validation imports and no `schema` / `resolver` / `validate` props. Invalid state
   comes from `aria-invalid` / `data-invalid`. See [API and data ownership](docs/overall-design.md#8-component-api-and-ownership).
5. **Motion conformance**: the recipes declared in `meta.motion`, the MDX frontmatter, and the Motion contract
   table match what the source actually runs. `full` plays the recipe, `reduced` keeps opacity and drops
   transform/scale/layout, `none` is instant, and the branch is driven by `useCadenceMotion().reduced` plus
   `data-motion`. Run the [motion conformance check](AGENTS.md#motion-conformance-check) before the PR.
6. **Accessibility**: roles, keyboard, focus, and a screen-reader story.
7. **Tests** in `tests/components/<id>.test.tsx` covering the API, the slot, the keyboard path, the `reduced`
   branch, and the `none` mode. Animated suites must execute `expectMotionContract(mode)` from
   `tests/motion-contract.tsx` after rendering/exercising the real parts in all three modes. Vitest's
   mandatory reporter requires successful runtime evidence; importing the helper or skipping its tests
   fails. Keep behavior assertions for engine/native WAAPI writers and existing interactions. T0
   structural components need neither a provider nor this helper. See animation-system §9.3 for
   supported carriers, instant positional geometry and browser-proof limits.
8. **A preview** in `components/site/previews/<id>.tsx`, registered in `previews/index.tsx`.

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
- Animate transform, opacity, or filter. Height is allowed for disclosures.
- Use `data-slot` on each part so consumers can target it.
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
