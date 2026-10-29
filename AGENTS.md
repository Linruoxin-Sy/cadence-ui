# AGENTS.md

Working notes for coding agents in this repository.

Cadence UI is an animation-first React component library for shadcn. Components are not published as a
package: they are distributed as shadcn registry items and copied into the consumer's project, so the code
under `registry/cadence/**` ships as-is and is constrained accordingly.

The library is a **superset of shadcn's catalogue**: same ids, same exports, same props, same `data-slot`
values, plus a motion contract. The build order, tiers, and scope live in
[docs/parity-plan.md](docs/parity-plan.md).

## Read the design record first

The `docs/` directory is the design record — reasoning for contributors and maintainers, not site content.

| Document                                                                                   | Read it before                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [docs/parity-plan.md](docs/parity-plan.md)                                                 | Adding a component, choosing a motion tier, or changing the batch order.                                                                                                          |
| [docs/overall-design.md](docs/overall-design.md)                                           | Changing the repo layout, registry model, install paths, theming, component API, or build pipeline.                                                                               |
| [docs/animation-system.md](docs/animation-system.md)                                       | Writing or editing any animation: tokens, recipes, Base UI popup integration, reduced-motion strategy, performance budgets, motion tests.                                         |
| [docs/documentation-site-and-distribution.md](docs/documentation-site-and-distribution.md) | Touching the docs site, the `public/r` endpoints, `llms.txt`, MCP, versioning, or the contribution flow.                                                                          |
| [docs/adr.md](docs/adr.md)                                                                 | Revisiting an architectural choice (registry-first, Base UI, Tailwind v4, Motion + optional GSAP, mirrored source tree, docs-as-data). Append a new ADR instead of rewriting one. |

Supporting material outside `docs/`:

- `content/docs/*.mdx` and `content/components/*.mdx` — user-facing documentation, rendered by the site and injected into registry payloads.
- `CONTRIBUTING.md` — what a component needs before a PR is ready.
- `README.md` — install commands, component list, repository map.

## Rules that are easy to break

These follow from the documents above; the documents are authoritative if they disagree.

- **No `@/` aliases in shipped source.** Files under `registry/cadence/**` use relative imports only (`../lib/motion`), because the source tree mirrors the install tree. `@/` is fine in site code.
- **Shared code lives in `registry/cadence/lib/`.** Never reach for a host path such as `@/lib/utils`.
- **Never hard-code motion values.** Use the presets in `registry/cadence/lib/motion.ts` and the recipes listed in the animation system document; a new recipe means editing that document first.
- **Keep the reduced branch.** Every animated component must keep `useCadenceMotion().reduced` and `data-motion`; `data-motion="none"` must fully disable motion.
- **Animate `transform`, `opacity`, or `filter` only.** No `transition: all`, no `setTimeout`-driven animation, no reading layout during render.
- **Base UI `render`, not `asChild`.** Use `data-slot` on every part and merge classes with `cn()` (user classes last).
- **UI only, no validation (P11).** Never import `zod`, `react-hook-form`, `@hookform/resolvers`, `yup`, `valibot`, `joi`, or `superstruct`; never add `schema` / `resolver` / `validate` props. Render invalid state from `aria-invalid` / `data-invalid` only. `registry:check` enforces this.
- **Match upstream.** Exports and `data-slot` values are copied from shadcn; additions are allowed, renames and removals are not (`meta.upstream` records the pinned style).
- **Intra-registry dependencies are namespaced.** Use `@cadence/<id>` in `registryDependencies`; a bare name resolves against the default shadcn registry and installs the wrong file.
- **Docs are data.** `content/components/<id>.mdx` frontmatter must match `registry.json` (title, description, deps, registryDeps, motion, intensity, complexity, since, tier); the build fails when docs or metadata are missing.

## Commands

```bash
pnpm install
pnpm dev              # docs site
pnpm lint             # biome check: lint + formatting + import order
pnpm lint:fix         # biome check --write
pnpm format           # biome format --write
pnpm registry:build   # rebuild public/r from registry.json + content
pnpm registry:check   # targets, payload freshness, docs coverage, exports, tier budgets, P11
pnpm test             # unit tests
pnpm check            # typecheck + lint + registry:check + tests
node scripts/new-item.mjs --name <id> --tier <T0..T5> --title "Title" --description "Sentence."
```

Run `pnpm registry:build` before `pnpm check` whenever `registry.json`, `content/`, or shipped source changed —
the check compares payloads against source and fails on stale artifacts.

## Adding a component

1. Scaffold it: `node scripts/new-item.mjs --name tooltip --tier T2 --title "Tooltip" --description "…"`.
2. Put the source in `registry/cadence/<id>/<id>.tsx` (relative imports only, `data-slot` on every part).
3. Keep the item in `registry.json` with `files[].target` of `@components/cadence/<id>/<id>.tsx`, plus
   `meta.tier`, `meta.motion`, `meta.intensity`, `meta.complexity`, and `meta.upstream`.
4. Write `content/components/<id>.mdx` with matching frontmatter: compact (9 sections) for T0–T1,
   standard (12 sections) for T2+; input components also get a "Validation and data ownership" section.
5. Add `components/site/previews/<id>.tsx` and register it in `components/site/previews/index.tsx`.
6. Add `tests/components/<id>.test.tsx`: render, `data-slot`, keyboard path, reduced branch.
7. Rebuild payloads, run `pnpm check`, and paste dual-theme screenshots in the PR.
