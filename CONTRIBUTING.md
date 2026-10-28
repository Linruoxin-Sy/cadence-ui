# Contributing to Cadence

Thanks for helping. Cadence is a small, opinionated component library: motion has to explain cause
and effect, and every animation needs a reduced-motion branch.

## Before you start

- Read [the motion system](content/docs/motion.mdx) and the [architecture overview](docs/overall-design.md).
- For a new component, open an issue first. Check `content/components/` and the open issues to see whether
  it is already planned; the motion recipes it may use are listed in the
  [animation system](docs/animation-system.md).
- Search existing issues before opening a new one.

## Local setup

```bash
pnpm install
pnpm dev
```

The docs site renders every component from `registry/cadence/**`, so you can iterate on a component and
its preview in one place.

## What a component needs

A pull request is ready when the component has:

1. **Source** in `registry/cadence/<id>/<id>.tsx`, using relative imports (`../lib/motion`).
2. **Docs** in `content/components/<id>.mdx` with frontmatter that matches `registry.json`
   (title, description, deps, registryDeps, motion, intensity, complexity, since).
3. **A motion contract** section in the docs: enter, exit, interaction, reduced, none.
4. **A reduced branch** driven by `useCadenceMotion().reduced` (tests will fail otherwise).
5. **Accessibility**: roles, keyboard, focus, and a screen-reader story.
6. **Tests** in `tests/` covering the API and the reduced branch.
7. **A preview** in `components/site/preview.tsx`.

Then run:

```bash
pnpm check
```

which runs typecheck, Biome (lint, formatting, and import order), the registry checks (targets, payload
freshness, docs, export names, size budget), and the unit tests. Rebuild the payloads with
`pnpm registry:build` before checking.

## Style

- Formatting, import order, and lint rules are Biome's. Run `pnpm format` (or `pnpm lint:fix`) instead of
  hand-formatting; `pnpm lint` fails when a file is not formatted.
- Tailwind v4 utilities and shadcn semantic tokens only. No raw colors.
- Motion presets from `registry/cadence/lib/motion.ts`. No ad-hoc durations.
- Animate transform, opacity, or filter. Height is allowed for disclosures.
- Use `data-slot` on each part so consumers can target it.
- Sentence case in UI copy.

## Licensing

By contributing, you agree that your contribution is licensed under the MIT License.
