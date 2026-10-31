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
- **Animate `transform`, `opacity`, or `filter` only.** Measured width/height goes through the `geometry.resize` recipe (clamped, T3+, never T0–T2), and disclosure height follows the same rule. No `transition: all`, no `setTimeout`-driven animation, no reading layout during render.
- **Audit the animation before calling a component done.** After writing or editing a component, run the [motion conformance check](#motion-conformance-check): the declared recipes, the implementation, and the docs must agree, and all three modes must be proven. `registry:check` only proves that a reduced branch exists, not that it conforms.
- **Base UI `render`, not `asChild`.** Use `data-slot` on every part and merge classes with `cn()` (user classes last).
- **UI only, no validation (P11).** Never import `zod`, `react-hook-form`, `@hookform/resolvers`, `yup`, `valibot`, `joi`, or `superstruct`; never add `schema` / `resolver` / `validate` props. Render invalid state from `aria-invalid` / `data-invalid` only. `registry:check` enforces this.
- **Match upstream.** Exports and `data-slot` values are copied from shadcn; additions are allowed, renames and removals are not (`meta.upstream` records the pinned style).
- **Intra-registry dependencies are namespaced.** Use `@cadence/<id>` in `registryDependencies`; a bare name resolves against the default shadcn registry and installs the wrong file.
- **Docs are data.** `content/components/<id>.mdx` frontmatter must match `registry.json` (title, description, deps, registryDeps, motion, intensity, complexity, since, tier); the build fails when docs or metadata are missing.
- **Docs have a fixed section order, not a fixed section count.** `## Installation` then `## Usage` open every body; everything after them is a flat `##` — one section per example, no `## Examples` wrapper (only `## API` may group props under `### \`Part\``). Order and membership come from §2 of [docs/documentation-site-and-distribution.md](docs/documentation-site-and-distribution.md); how many examples you write is yours. `scripts/new-item.mjs` scaffolds this order.
- **Docs code blocks are the `code-block` item.** `components/site/mdx.tsx` maps `pre` to `components/site/code-fence.tsx`, which highlights at build time; never hand-roll a `<pre>` in site chrome, and add a new fenced language to `code-highlight/highlight.tsx` (`tests/site/fence.test.tsx` fails otherwise).

## Motion conformance check

Rendering is not the finish line. After writing or editing a component, audit the animation against
[docs/animation-system.md](docs/animation-system.md) (§3 recipes, §6 modes, §7 budgets, §11 review) before
`pnpm check`, and fix the source — or the scheme — before opening the PR.

1. **Declared = implemented = documented.** The recipe names in `registry.json` (`meta.motion`), in the
   `motion:` frontmatter of `content/components/<id>.mdx`, in that file's Motion contract table, and in the
   source (`cm.transition("<recipe>")`, or the CSS `data-starting-style` / `data-ending-style` transitions of a
   CSS-only popup, or the `animate-*` loop of a continuous recipe — see animation-system §3.2) must be the same
   set. A declared-but-unused recipe, or an animated transition with no recipe behind it, is a defect.
2. **Tokens only.** No literal duration, easing tuple, distance, scale, or spring values under
   `registry/cadence/**` outside `lib/motion.ts` itself. Motion-driven parts use `cm.transition()`,
   `cm.distance`, `cm.spring`; CSS-only popups use token-backed `duration-*` and `ease-cadence-out` /
   `ease-cadence-in-out`; continuous loops use the framework's `animate-*` opacity utility, which a project
   retunes through its `--animate-*` theme token.
3. **Three modes, three behaviours.** `full` plays the recipe; `reduced` keeps opacity and drops
   transform/scale/layout; `none` resolves to zero duration (`duration-0`, `{ duration: 0 }`, or no transition
   at all). Mapping `none` onto the `reduced` branch is a failure, not a shortcut.
4. **The branch is in the tree.** Every animated part has `data-motion={cm.mode}` and reads
   `useCadenceMotion().reduced`; the reduced path is a JSX/class branch, not a media query alone. Under `none`
   no motion property (transform/opacity/filter) keeps a non-zero transition.
5. **Properties stay in budget.** Motion touches `transform`, `opacity`, `filter`, plus measured
   width/height through `geometry.resize` (clamped, T3+, instant under `reduced`/`none`). Colour, border,
   and shadow transitions are allowed as state feedback, never as motion, and never through
   `transition: all` or a `setTimeout`.
6. **Tests prove the modes.** `tests/components/<id>.test.tsx` asserts the `data-motion` value for each mode and
   that the reduced (and `none`) render drops the transform. `registry:check` only proves a reduced branch
   exists; it does not prove any of the above.

This applies to a new component and to any component you touch — do not copy an existing component's
deviation. If a check fails, fix the component. If the scheme itself is wrong, edit
[docs/animation-system.md](docs/animation-system.md) first and call the deviation out in the PR. Source and
scheme must never disagree silently.

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

1. Scaffold it: `node scripts/new-item.mjs --name tooltip --tier T2 --batch B4 --title "Tooltip" --description "…"`.
2. Put the source in `registry/cadence/<id>/index.tsx` (relative imports only, `data-slot` on every part).
3. Keep the item in `registry.json` with `files[].target` of `@components/cadence/<id>/index.tsx`, plus
   `meta.tier`, `meta.batch`, `meta.motion`, `meta.intensity`, `meta.complexity`, and `meta.upstream`.
4. Write `content/components/<id>.mdx` with matching frontmatter: compact (9 sections) for T0–T1,
   standard (12 sections) for T2+; input components also get a "Validation and data ownership" section.
5. Add `components/site/previews/<id>.tsx` and register it in `components/site/previews/index.tsx`.
6. Add `tests/components/<id>.test.tsx`: render, `data-slot`, keyboard path, `reduced` and `none` modes.
7. Run the [motion conformance check](#motion-conformance-check) above and fix every failed item.
8. Rebuild payloads, run `pnpm check`, and paste dual-theme screenshots in the PR.
