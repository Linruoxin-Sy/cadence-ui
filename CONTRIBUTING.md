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
node scripts/new-item.mjs --name tooltip --tier T2 --title "Tooltip" \
  --description "A short label shown on hover or focus." --motion popup.anchored
```

The script writes the source, docs, preview, and test, registers the preview, and appends the registry
item. Then replace the stub body with the upstream API.

## What a component needs

A pull request is ready when the component has:

1. **Source** in `registry/cadence/<id>/index.tsx`, relative imports only (`../lib/motion`), `data-slot`
   on every part, and the same exports and props as shadcn.
2. **Registry metadata**: `meta.tier`, `meta.batch` (the parity batch from
   [the plan](docs/parity-plan.md#7-batches)), `meta.motion`, `meta.intensity`, `meta.complexity`, and
   `meta.upstream`. Intra-registry dependencies are namespaced (`@cadence/button`).
3. **Docs** in `content/components/<id>.mdx` with frontmatter that matches `registry.json`
   (title, description, deps, registryDeps, motion, intensity, complexity, since, tier). Compact
   (9 sections) for T0–T1, standard (12) for T2+, plus a motion contract table.
4. **UI only**: no validation imports and no `schema` / `resolver` / `validate` props. Invalid state
   comes from `aria-invalid` / `data-invalid`. See [validation](content/docs/validation.mdx).
5. **Motion conformance**: the recipes declared in `meta.motion`, the MDX frontmatter, and the Motion contract
   table match what the source actually runs. `full` plays the recipe, `reduced` keeps opacity and drops
   transform/scale/layout, `none` is instant, and the branch is driven by `useCadenceMotion().reduced` plus
   `data-motion`. Run the [motion conformance check](AGENTS.md#motion-conformance-check) before the PR.
6. **Accessibility**: roles, keyboard, focus, and a screen-reader story.
7. **Tests** in `tests/components/<id>.test.tsx` covering the API, the slot, the keyboard path, the `reduced`
   branch, and the `none` mode.
8. **A preview** in `components/site/previews/<id>.tsx`, registered in `previews/index.tsx`.

Then run:

```bash
pnpm registry:build && pnpm check
```

which runs typecheck, Biome (lint, formatting, and import order), the registry checks (targets, payload
freshness, docs, export names, tier budgets, P11), and the unit tests. `registry:check` does not verify the
motion contract, so the conformance check above is a review step, not an optional one.

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
