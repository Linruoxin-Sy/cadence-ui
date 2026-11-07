# AGENTS.md

Working notes for coding agents in this repository.

Cadence UI is an animation-first React component library for shadcn. Components are not published as a
package: they are distributed as shadcn registry items and copied into the consumer's project, so the code
under `registry/cadence/**` ships as-is and is constrained accordingly.

The library is a **superset of shadcn's catalogue**: same ids, same exports, same props, same `data-slot`
values, plus a motion contract. The batch conventions, compatibility tiers, scope and future work live in
[docs/parity-plan.md](docs/parity-plan.md).

The motion v2 target is capability-based: every component is assessed for applicable appearance, geometry,
colour, text, number and interaction changes, with one owner for each animated property. A tier is not an
animation allowance. [docs/animation-system.md](docs/animation-system.md) defines that target;
[docs/animation-system-plan.md](docs/animation-system-plan.md) tracks its implementation. The current runtime,
registry metadata, MDX and test helpers remain the compatibility surface until migrated together; this design
update does not make v2 complete or make planned recipes and public helpers installable.

## Read the design record first

The `docs/` directory contains current concepts, contracts and future work for contributors, not site content. Start at [docs/README.md](docs/README.md). Completed work and handoffs belong in Git history; generated reports go to `.cache/`, and executable regression inputs go to `tests/fixtures/`.

| Document                                                                                   | Read it before                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [docs/parity-plan.md](docs/parity-plan.md)                                                 | Adding a component, choosing compatibility metadata/a batch, or selecting future work.                                                                                            |
| [docs/overall-design.md](docs/overall-design.md)                                           | Changing the repo layout, registry model, install paths, theming, component API, or build pipeline.                                                                               |
| [docs/animation-system.md](docs/animation-system.md)                                       | Writing or editing any animation: tokens, recipes, Base UI popup integration, reduced-motion strategy, performance budgets, motion tests.                                         |
| [docs/motion/README.md](docs/motion/README.md) and [presets](docs/motion/presets.md)          | Designing a component's own choreography, reading its `components/<id>.md` contract, or choosing/refining parameter bindings.                                                      |
| [docs/animation-system-plan.md](docs/animation-system-plan.md)                             | Implementing motion v2, checking migration dependencies, or claiming a capability is available.                                                                                   |
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
- **Design each component individually.** Maintain its target contract in `docs/motion/components/<id>.md`: six-capability ownership, actions in all modes, interruption, bindings and geometry/performance bounds. Global style guides visual choices; shared execution rules remain mandatory. Parameter assignments belong in `docs/motion/presets.md` and the future shared runtime source, not duplicated component constants. These target files do not declare shipped capabilities.
- **Keep explicit mode branches.** Every animated component must keep `useCadenceMotion().reduced` and `data-motion`. The v2 target stops continuous loops, including Spinner, under `reduced`, and disables every transition, delay and loop, including colour, under `none`. These are migration requirements, not claims about the unchanged runtime.
- **Choose capabilities by applicability and ownership.** Use `transform`, `opacity`, or bounded `filter` for visual motion; measured width/height uses clamped `geometry.resize` wherever the component owns content-driven geometry. Disclosures follow the same rule. State colours belong to the planned `state.color` contract. Preserve native editing and direct manipulation, keep one writer per property, and retain the performance budgets. No `transition: all`, no `setTimeout`-driven animation, no reading layout during render.
- **Do not publish plans as capabilities.** `state.color`, `text.change`, the revised numeric rolling behaviour and public motion helpers require implementation, registry entries where applicable, docs and tests before use in install instructions or component metadata. Keep existing schema fields and recipe declarations until their migration is implemented.
- **Audit the animation before calling a component done.** After writing or editing a component, run the [motion conformance check](#motion-conformance-check): the declared recipes, the implementation, and the docs must agree, and all three modes must be proven. `registry:check` validates declarations and structural evidence; it does not prove runtime conformance.
- **Base UI `render`, not `asChild`.** Use `data-slot` on every part and merge classes with `cn()` (user classes last).
- **UI only, no validation (P11).** Never import `zod`, `react-hook-form`, `@hookform/resolvers`, `yup`, `valibot`, `joi`, or `superstruct`; never add `schema` / `resolver` / `validate` props. Render invalid state from `aria-invalid` / `data-invalid` only. `registry:check` enforces this.
- **Match upstream.** Exports, `data-slot` values, props, and their defaults are copied from shadcn; additions are allowed, renames, removals, and silent default changes are not (`meta.upstream` records the pinned style). A difference the visual style forces is recorded in `meta.parity.props` with a reason — `parity:check` fails on an unrecorded difference and on a record that no longer applies.
- **Upstream tooling is the CLI's `build`, never the skill's `add`.** Cadence authors a registry; it is not a shadcn consumer. There is no `components.json`, and the source tree is a hand-written mirror on purpose. Read upstream from `upstream/manifest.json` or `npx shadcn@latest docs <id>`; never run `shadcn init` / `add` / `apply` here. See [shadcn tooling boundary](#shadcn-tooling-boundary).
- **Intra-registry dependencies are namespaced.** Use `@cadence/<id>` in `registryDependencies`; a bare name resolves against the default shadcn registry and installs the wrong file.
- **Docs are data.** `content/components/<id>.mdx` frontmatter must match `registry.json` (title, description, deps, registryDeps, motion, intensity, complexity, since, tier); the build fails when docs or metadata are missing.
- **Docs have a fixed section order, not a fixed section count.** `## Installation` then `## Usage` open every body; everything after them is a flat `##` — one section per example, no `## Examples` wrapper (only `## API` may group props under `### \`Part\``). Order and membership come from §2 of [docs/documentation-site-and-distribution.md](docs/documentation-site-and-distribution.md); how many examples you write is yours. `scripts/new-item.mjs` scaffolds this order.
- **Docs code blocks are the `code-block` item.** `components/site/mdx.tsx` maps `pre` to `components/site/code-fence.tsx`, which highlights at build time; never hand-roll a `<pre>` in site chrome, and add a new fenced language to `code-highlight/highlight.tsx` (`tests/site/fence.test.tsx` fails otherwise).

## Motion conformance check

Rendering is not the finish line. After writing or editing a component, audit the animation against
[docs/animation-system.md](docs/animation-system.md) and its applicable migration step in
[docs/animation-system-plan.md](docs/animation-system-plan.md) before `pnpm check`. Keep the shipped contract
accurate while implementing the target; a passing legacy check alone does not establish v2 conformance.

1. **Declared = implemented = documented.** The recipe names in `registry.json` (`meta.motion`), in the
   `motion:` frontmatter of `content/components/<id>.mdx`, in that file's Motion contract table, and in the
   source (`cm.transition("<recipe>")`, or the CSS `data-starting-style` / `data-ending-style` transitions of a
   CSS-only popup, or the `animate-*` loop of a continuous recipe) must be the same
   set. A declared-but-unused recipe, or an animated transition with no recipe behind it, is a defect.
2. **Tokens only.** No literal duration, easing tuple, distance, scale, or spring values under
   `registry/cadence/**` outside `lib/motion.ts` itself. Motion-driven parts use `cm.transition()`,
   `cm.distance`, `cm.spring`; CSS-only popups use token-backed `duration-*` and `ease-cadence-out` /
   `ease-cadence-in-out`; existing continuous loops use the framework's `animate-*` utility, which a project
   retunes through its `--animate-*` theme token.
3. **Three modes, explicit capability behaviour.** In v2, `full` plays applicable recipes; `reduced` drops
   travel/scale/layout, text and number rolling, stagger and continuous loops, while retaining applicable
   short opacity/colour feedback. Reveal enhancement stays visible without entering its hidden state machine.
   `none` reaches the semantic target immediately with zero duration and delay for every property, including
   colour, and no loops. Mapping `none` onto the `reduced` branch is a failure. Existing differences remain
   explicit migration work until the runtime, declarations, user docs and tests change together.
4. **The branch is in the tree.** Every animated part has `data-motion={cm.mode}` and reads
   `useCadenceMotion().reduced`; the reduced path is a JSX/class branch, not a media query alone. Under `none`
   no animated property may keep a non-zero transition in the v2 contract. A live downgrade must cancel
   the existing writer as well as change its next target.
5. **Properties stay in budget.** Visual motion uses `transform`, `opacity`, bounded `filter`, and measured
   width/height through `geometry.resize` (clamped, instant under `reduced`/`none`). Applicable colour,
   border and shadow feedback must use scoped properties and the v2 mode contract when migrated. Capabilities
   do not remove source/runtime/page budgets or permit two engines to own the same property.
6. **Tests prove the modes.** Every animated `tests/components/<id>.test.tsx` must execute the shared
   `expectMotionContract(mode)` after rendering/exercising the actual parts in full, reduced and none.
   The mandatory Vitest reporter counts successful runtime calls, never imports, dead calls or skipped
   tests; `registry:check` requires the test file. Keep meaningful interactions and engine/native WAAPI
   behavior assertions. The current helper still reflects legacy behaviour, including Spinner's reduced-mode
   rotation exception; revising it belongs to the implementation plan, not a documentation-only change.
   A component with no implemented animated capability needs no helper/provider solely for its tier label.
   Adding an animated capability requires mode evidence. Unit adoption does not prove browser first paint,
   per-frame cancellation, v2 colour/loop guarantees or the cross-library live audit.

This applies to a new component and to any component you touch — do not copy an existing component's
deviation. Fix implementation failures; keep remaining v2 work explicit in the implementation plan rather
than changing user docs to claim unimplemented behaviour. If the scheme itself needs a change, edit
[docs/animation-system.md](docs/animation-system.md) first and explain it in the PR.

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
   Before motion implementation, author `docs/motion/components/<id>.md`, add its index entry and resolve
   preset bindings. The current scaffold does not yet create these design files; its extension is planned.
3. Keep the item in `registry.json` with `files[].target` of `@components/cadence/<id>/index.tsx`, plus
   the current compatibility fields `meta.tier`, `meta.batch`, `meta.motion`, `meta.intensity`,
   `meta.complexity`, and `meta.upstream`. Declare implemented recipes only; assess v2 capabilities by
   applicability and ownership, not tier.
4. Write `content/components/<id>.mdx` with matching frontmatter: tier-specific membership and order from documentation-site-and-distribution §2,
   including responsiveness/performance at every tier and input data ownership; no fixed heading count.
5. Add `components/site/previews/<id>.tsx`; the scaffold creates `app/(site)/components/<id>/page.tsx` with its single preview import. Keep that generated entry in sync with `scripts/component-routes.mjs`.
6. Add `tests/components/<id>.test.tsx`: render, `data-slot`, keyboard path, `reduced` and `none` modes.
7. Run the [motion conformance check](#motion-conformance-check) above and fix every failed item.
8. Rebuild payloads, run `pnpm check`, and paste dual-theme screenshots in the PR.

## shadcn tooling boundary

The repository installs `shadcn` as a devDependency and vendors shadcn's own agent skill at
`.agents/skills/shadcn/` (pinned by `skills-lock.json`, excluded from Biome). Both are useful in exactly one
direction: reading. The skill is `user-invocable: false` and its description auto-triggers on "shadcn/ui" and
"component registries", which is every component task in this repo — so this section is the guard, not advice.

**Allowed**

- `npx shadcn@latest docs <id>` — the live API and examples for the upstream component, when
  `upstream/manifest.json` gives you the surface but not the intent.
- `pnpm registry:build` — `scripts/build-registry.mjs` shells out to `shadcn build` to emit `public/r/*.json`.
  That is the only shadcn invocation in the pipeline, and it takes an explicit registry path, not a project.
- `.agents/skills/shadcn/registry.md` — the registry schema (item types, `include`, dependency rules), which
  applies to this repo.

**Forbidden**

- `shadcn init` / `add` / `apply` / `create` — they scaffold a consumer project: `components.json`,
  `components/ui/**`, rewritten import aliases. That would put a second, unparitied copy of a component next to
  the mirrored one, and no check would notice.
- `--preset` codes — the visual style is pinned in `upstream/manifest.json` (`visualStyle`, `pin.ref`). Moving it
  is a `pnpm upstream:sync --ref <sha>` decision recorded in the manifest, never a preset.
- Trusting the skill's injected project context — it runs `shadcn info` in a repo without `components.json`, so
  its `aliases`, `resolvedPaths`, `style`, and `base` fields are empty or wrong. `base-ui` here comes from
  `meta.upstream.style` in `registry.json`.

When parity is the question, the answer comes from `upstream/manifest.json` plus `pnpm parity:check` — not from
the CLI, and not from the skill.
