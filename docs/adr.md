# Architecture decision records (ADR)

> Each ADR records: context → decision → consequences → rejected alternatives. Append new decisions with the next number; never rewrite history.

---

## ADR-001 · Distribute registry-first, do not publish a runtime npm package

**Context**: the target audience is developers in the shadcn ecosystem, who expect to "copy the source and own it". Arc distributes 143 items through a registry, which validated this path.

**Decision**: ship components as shadcn registry items (`registry.json` + `public/r/*.json`); users install them into their own project with `npx shadcn add @cadence/<id>`. Do not publish a runtime package such as `@cadence/ui`.

**Consequences**:

- ✅ No peerDependency hell; users can modify anything; AI/CLI installs work out of the box.
- ✅ The same upgrade path as shadcn (themes, primitives).
- ❌ Cannot fix bugs centrally (users must reinstall); no runtime license checks; versions can only be "advisory".
- ❌ npm download counts cannot measure adoption, so registry access statistics must be built in-house.

**Alternatives**:

- An npm package (like MUI): central upgrades, but it clashes with the "source ownership" mental model and requires maintaining build artifacts.
- Both at once (package + registry): double maintenance, not for the MVP.

---

## ADR-002 · Use Base UI as the primitive layer, not Radix

**Context**: on 2026-07-02 shadcn made Base UI the default for new projects ([announcement](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/content/docs/changelog/2026-07-base-ui-default.mdx)). Base UI 1.0 shipped on 2025-12-11 under the package name `@base-ui/react`; version 1.6 sees 6M+ weekly downloads.

**Decision**: all compound components are built on `@base-ui/react`. No Radix (and no dual implementation).

**Consequences**:

- ✅ Consistent with new shadcn projects; `render` replaces `asChild`, which composes more flexibly.
- ✅ Popup capabilities (`data-starting-style` / `data-ending-style` / `keepMounted` / `actionsRef`) standardise interruptible animation.
- ❌ Less ecosystem material than Radix; 1.x may still break in small ways.
- ❌ Users of older (Radix) projects must migrate their shadcn components first; the docs must say so clearly.

**Alternatives**:

- Radix: more mature, but shadcn's default has moved, so long-term dual maintenance is unrealistic.
- In-house headless: too much work and too much a11y risk.

**Mitigation**: pin minor versions; keep the wrapper layer thin; run visual regression and type checks before upgrading.

---

## ADR-003 · Style with Tailwind v4 + shadcn tokens, drop CSS Modules

**Context**: Arc uses CSS Modules with hand-written tokens and explicitly "does not need Tailwind". But shadcn users already have Tailwind and theme variables in their projects; adding a second styling system creates friction.

**Decision**: components use Tailwind utilities + shadcn semantic tokens (`bg-background`, `text-muted-foreground`, `border-border`…); the theme is injected via `@theme inline` and `cssVars`; custom motion tokens are provided twice, as CSS variables and as TS presets.

**Consequences**:

- ✅ Zero divergence from shadcn projects; changing the theme changes component appearance; user class names can be merged and overridden by `cn()`.
- ✅ The docs site can reuse the same styles directly.
- ❌ Gives up the "no Tailwind" selling point; class strings are long; no CSS Modules local scoping (use `data-slot` + convention instead).
- ❌ Tailwind v3 projects are unsupported (they must upgrade first).

**Alternatives**:

- CSS Modules (the Arc route): more centralised theming, but detached from the shadcn ecosystem.
- Dual mode: too much maintenance.

---

## ADR-004 · Motion first, GSAP only as an optional dependency

**Context**: Motion covers declarative animation, variants, exit, layout/shared elements, gestures, and scroll mapping; GSAP excels at timelines, ScrollTrigger, SplitText, and SVG morph. Since 2025-04-29 all GSAP plugins are free, including commercial use.

**Decision**: the only default dependency is `motion`. Components that need complex timelines, scroll narratives, or SVG morph (only `scroll-story` at launch) declare `gsap` + `@gsap/react` as **optional peers**, and the docs state the behaviour when they are absent: degrade to static.

**Consequences**:

- ✅ `motion` is used in full by default (~43 KB gzip); the optional `LazyMotion` + `m` path (~5 KB initial + 24 KB feature bundle) is available for smaller budgets.
- ✅ GSAP users can opt into stronger choreography.
- ❌ Two animation mental models; boundaries must be explicit (one element must never be driven by both).
- ❌ Optional dependencies create runtime branches where "the component is installed but GSAP is not", which must be covered by tests.

**Boundary rules**:

| Scenario                                                             | Use                                                        |
| -------------------------------------------------------------------- | ---------------------------------------------------------- |
| Enter/exit, layout, shared elements, gestures, scroll progress       | Motion                                                     |
| Multi-segment timelines, pinning, per-character SplitText, SVG morph | GSAP                                                       |
| The same element                                                     | Only one; once GSAP takes over, do not also use `motion.*` |

**Alternatives**: GSAP only (large bundle and costly React integration); CSS only (not expressive enough).

---

## ADR-005 · The source tree mirrors the install tree, zero AST rewriting

**Context**: to keep installed files free of host aliases, Arc built its own TypeScript AST rewriting (turning `@/lib/...` into relative paths). That adds build complexity and Windows path problems (see the Arc analysis report, §6.1).

**Decision**: source lives in `registry/cadence/<id>/` and installs to `@components/cadence/<id>/`; the internal structure is identical, so components only need relative paths (`../lib/motion`), which resolve in both places. Shared files live in `registry/cadence/lib/`. The build uses `shadcn build` directly (tested to preserve `target` and `content`).

**Consequences**:

- ✅ No in-house builder, no path rewriting, no platform differences; `shadcn build` suffices.
- ✅ Components depend on no `@/`, so monorepos / `src/` / custom aliases all work.
- ❌ Shared code must live inside the `cadence/` subtree and cannot use the host's `@/lib/utils` (we ship our own `cn`).
- ❌ If `cadence/` ever needs to map elsewhere, one rewrite pass is still required (an optional rewrite step could be added later).

**Alternatives**: Arc-style AST rewriting (complex, error-prone); requiring users to configure a `@/cadence` alias (adds install friction).

---

## ADR-006 · Docs as data: the body goes into the registry payload

**Context**: Arc's payload only carries URLs for `meta.docs` / `meta.markdown`, so AI needs a second fetch; separating the doc body from the source invites drift.

**Decision**: `content/components/<id>.mdx` is the single source of truth for component documentation; at build time the body is written into the registry item's `docs` field; the same data generates the site page, `/r/<id>.md`, `llms.txt`, `catalog.json`, and MCP results.

**Consequences**:

- ✅ AI/CLI receive "source + docs + dependencies + motion contract" in one request.
- ✅ Missing docs fail the build (100% coverage).
- ❌ Payloads grow (+2–6 KB per item); caching and gzip are needed.
- ❌ MDX and registry metadata need consistency validation (title/deps etc.).

**Alternatives**: docs only on the site (Arc's status quo, needs a second fetch); docs only in the README (not searchable, not paginated).

---

## ADR-007 · Test animation with "contract + matrix", not frame-by-frame comparison

**Context**: animations are hard to assert "looks right". Frame-by-frame screenshots fail en masse because of font/GPU differences; pure eyeballing cannot prevent regressions.

**Decision**:

1. Every component declares a Motion Contract (properties, tokens, interruptibility);
2. Playwright runs the `reducedMotion × data-motion` matrix and asserts **end states** (opacity=1, transform=none) and **interactivity**, not intermediate frames;
3. Key states get screenshot comparisons (3 states × 2 themes), threshold 1%;
4. axe: 0 violations on every component page;
5. Unit tests cover the API and the reduced branch.

**Consequences**:

- ✅ Regressions are caught, without frequent false positives from rendering details.
- ✅ The contract becomes the shared language of docs, tests, and review.
- ❌ Cannot verify "whether the animation looks good" — that still needs human review.
- ❌ Contracts must be maintained (changing motion requires changing the contract; CI checks it).

**Alternatives**: visual regression only (high false-positive rate); human review only (unsustainable).

---

## ADR-008 · v0.1 ships only the free MIT tier, no Pro/billing

**Context**: Arc uses a "free + Pro token-gated registry" model, which requires accounts, billing, authorisation, and content tiering.

**Decision**: `v0.1.0` releases MIT-licensed free components only; Pro is an option after v1.0, and only once free-tier adoption is proven.

**Consequences**:

- ✅ Focus on quality and docs; no licensing system to carry.
- ✅ High community trust (MIT, no telemetry).
- ❌ No direct revenue; needs sponsorship or another means of support.
- ❌ Adding Pro later requires restructuring registry tiers (reserve a `meta.tier` field).

**Alternatives**: go dual-track from day one (+30% cost, and easy to please nobody).

---

## ADR-009 · A single Next app repository, no monorepo yet

**Context**: the docs site, registry, and component source live in one repository; 15 components do not need multi-package orchestration.

**Decision**: a single `package.json` + Next App Router; `registry/` and `content/` are same-repo directories; no Turborepo/Nx.

**Consequences**:

- ✅ Minimal configuration, short build chain, fast onboarding for contributors.
- ✅ typecheck/lint cover all source in one pass.
- ❌ The docs site and the registry cannot be deployed or versioned independently.
- ❌ Future splits (e.g. a registry on its own CDN) would carry migration cost.

**Conditions that trigger the split** (written down to avoid premature optimisation): more than 60 components, a docs build over 5 minutes, or a need to deploy the registry independently or gate it for Pro.

---

## ADR-010 · No `asChild`; use Base UI's `render` uniformly

**Context**: the Radix ecosystem is used to `asChild`; Base UI uses a `render` prop (element or function). Supporting both would muddy the API.

**Decision**: every composition/passthrough uses `render`; docs only show `render` examples; no `asChild` compatibility layer.

**Consequences**:

- ✅ Consistent with Base UI / shadcn 2026 defaults; `render` receives component state (`state.open`) for conditional rendering.
- ❌ Radix users must change how they write this (a mapping table is provided in the migration docs).
- ❌ Some users will file issues asking for `asChild`; the docs must explain this upfront.

**Alternatives**: support both (doubles the API surface and raises test costs).

---

## ADR-011 · Rebuild as an API-compatible superset of shadcn's catalogue

**Context**: the first eight components (`fade-in`, `text-reveal`, `number-flow`, `morph-button`,
`animated-tabs`, `motion-accordion`, `scroll-progress`, `motion-dialog`) each invented their own API.
`MotionDialog` took `trigger`/`title`/`children`; shadcn's `Dialog` is compound. The components could
not replace their shadcn counterparts, so "shadcn with better motion" was impossible. The catalogue
target is now shadcn's 65 registry items, with 57 in the first scope (55 `registry:ui` + 2
`registry:block`).

**Decision**:

1. The eight original components are archived (`v0.1.0-mvp`, `archive/mvp-8`) and removed. Their motion
   capability is folded into the corresponding shadcn components; four become `extras/*` after 1.0.
2. Every component keeps shadcn's id, exports, props, and `data-slot` values. Additions are allowed;
   renames and removals are not (P8). `meta.upstream` records the pinned upstream style.
3. Files install to `@components/cadence/<id>/` — a parallel tree next to `components/ui` — so a project
   can migrate component by component without overwriting shadcn files.
4. Motion is tiered T0–T5 (P9). T0 components stay static; each tier has its own gzip budget.
5. The library is UI only (P11): components render invalid state from `aria-invalid`, never validate.
   `form`, `native-select`, and `sonner` are therefore out of scope; `toast` is the notification surface.
6. Intra-registry dependencies are namespaced (`@cadence/<id>`); a bare name resolves against the default
   shadcn registry and would install the wrong file.

**Consequences**:

- ✅ A user can swap `@/components/ui/x` for `@/components/cadence/x` with only an import change.
- ✅ shadcn and Cadence coexist during migration; no overwrite risk.
- ✅ Scope, tier, and budget are explicit, so 57 components stay reviewable.
- ❌ We copy upstream markup and must track drift; the parity manifest and quarterly sync are mandatory.
- ❌ T0 components gain nothing but a new import path; the value is the motion-tiered rest and one
  consistent API.
- ❌ `meta.tier` now means the motion tier. ADR-008 reserved "tier" for a future Pro split; if that
  happens it must use a different field (for example `meta.plan`).

**Alternatives**: overwrite `@components/ui` (true drop-in, but collides with the user's shadcn files and
with shadcn's own registry dependencies); keep inventing components (the current dead end); wrap shadcn
without shipping source (contradicts ADR-001 and ADR-005).

---

## ADR-012 · Physics-defined springs for interruptible layout recipes

**Context**: The motion contract promises that layout and shared-element animations are interruptible
and re-entrant (M4): clicking a tab indicator or reordering a list mid-flight must reverse smoothly,
not restart from rest. Motion's `visualDuration + bounce` springs are **time-defined**; in
`motion-dom` 13.5.1 the spring generator resolves them and then deliberately zeroes inherited velocity
(`inheritVelocity()` returns `0` for time-defined springs), because carried velocity oscillates
small-range animations. So the contract was only true for tween recipes, while `layout.move` and
`layout.shared` — the recipes whose whole purpose is mid-flight retargeting — were the ones losing
their velocity.

A blanket conversion of every spring to physics would fix the layout case and break the small ones:
press scales by 3%, a checkbox tick by 4%, a popup by 4%. Motion's guard exists for exactly those.

**Decision**:

1. Keep authoring springs as `visualDuration + bounce`; `stiffness`/`damping` are **not** tokens.
2. Add `physicalSpring(visualDuration, bounce)` to `lib/motion.ts`. It mirrors Motion's conversion:
   `ω = 2π / (1.2·T)`, `stiffness = ω²`, `damping = 2(1-bounce)·ω`, `mass = 1`. The `1.2` is the
   visual-settle factor from `motion-dom` 13.5.1's `spring.ts`; it makes `T` the point where the
   spring is ~97% of the way there.
3. Only recipes marked `continuity: "velocity"` expand. Initially that is `layout.move` and
   `layout.shared`; every other spring stays time-defined.
4. Expansion happens inside `transitionFor()` **after** `timeScale`, so the docs site's 4× preview
   scales the physics exactly; `reduced` still collapses to a short tween and `none` still returns
   `{ duration: 0 }`.
5. The divergence is fixed at one seam: a component that wants continuity asks for the recipe, not
   for a spring object.

**Consequences**:

- ✅ M4 becomes true for the recipes that advertise it, with no visual change at rest and no token
  change.
- ✅ `timeScale`, `reduced`, and `none` keep their existing semantics; only the full-mode spring shape
  changes, and only after an interruption.
- ✅ Small-range springs keep Motion's oscillation guard.
- ❌ `VISUAL_SETTLE = 1.2` is a copy of library internals; a Motion upgrade must re-check
  `spring.ts`, and a test pins the derived constants.
- ❌ Physical springs ignore `duration` overrides (already documented as tween-only).
- ❌ The benefit is dormant until `tabs`/reorder land; `state.morph` (check, dot, thumb) intentionally
  stays time-defined until a measured-geometry recipe gives it a large-travel path.

**Rejected**:

- Convert every spring globally: risks oscillation on press, checkbox, radio, switch thumb, and
  popups, which are precisely the small-range cases Motion protects.
- Store `stiffness`/`damping` as authored tokens: loses the single authored timing, the 4× preview,
  and the ability to retune a token without re-deriving two numbers.
- Precompute transitions at module scope (as a single component can): cannot react to `timeScale` or
  a nested provider.

---

## ADR-013 · Measured geometry and origin handoff are recipes, not component code

**Status**: accepted; the recipes and geometry math landed first, and `select` pilots them in B5.

**Context**: B5 needs three motions that do not exist as primitives: a trigger that resizes to its
value, a label that flies from the option to the trigger, and a directional value swap for keyboard
changes. Writing each one inside `select` would repeat the same measurement, clamping, reduced-motion,
and origin-fallback decisions across `combobox`, `command`, `tabs`, and `accordion` — the exact
per-component improvisation ADR-011 exists to stop.

**Decision**:

1. Add `geometry.resize` (measured width/height) and `handoff` (cross-tree origin flight) to the
   recipe catalogue before any component uses them, with their reduced behaviour documented:
   `geometry.resize` jumps under reduced, `handoff` cross-fades at the destination, `none` is instant.
2. Measured geometry is clamped to its closed size; `bounce: 0` alone is not a no-overshoot guarantee
   once velocity is inherited.
3. `handoff` is pointer-only unless the component can name a visible source; keyboard and external
   value changes fall back to the directional swap. The fallback is part of the recipe, not a
   component branch.
4. `layout.shared` remains the recipe for a persistent node (`layoutId`); `handoff` is for a source
   that unmounts and a destination that mounts elsewhere.
5. Width/height animation is allowed only on the continuity tier (T3+), inside an isolated host; it is
   never the default for T0–T2.

**Consequences**:

- ✅ One implementation of measurement/clamping/origin for all selection surfaces.
- ✅ Reduced and none behaviour is decided once, not per component.
- ❌ The property budget in §7 gains an explicit "measured geometry" exception; this ADR must be
  reflected there before implementation.
- ❌ The measured host can reflow siblings; components must either isolate it or document the reflow.

**Rejected**: implement the select first and extract later (guarantees drift across B5/B6); use
`layoutId` for the label (the source unmounts, fonts and sizes differ, and `AnimatePresence` makes the
handoff unreliable).

---

## ADR-014 · Install a directory index, so a component imports as `@/components/cadence/<id>`

**Status**: accepted; amends ADR-005 (the mirror invariant survives, the file name changes).

**Context**: ADR-005 gave every component the install target `@components/cadence/<id>/<id>.tsx`, which
makes the documented import `import { Button } from "@/components/cadence/button/button"`. The repeated
`button/button` segment is noise on every line of every page, and it diverges from the shape the same user
already types for a shadcn component (`@/components/ui/button`). The obvious fix — pointing `target` at the
directory — does not work: `resolveFilePath` in `@shadcn/registry` concatenates an `@alias/...` target
verbatim and never supplies a file name, so `@components/cadence/button` writes a file literally named
`button`, which no bundler resolves.

**Decision**:

1. The source and the install target both become `registry/cadence/<id>/index.tsx` →
   `@components/cadence/<id>/index.tsx`; the documented import is `@/components/cadence/<id>`.
2. Everything ADR-005 depends on is unchanged: same depth, same relative relationships, so `../lib/motion`
   and `../button` still resolve in both trees, and the build stays plain `shadcn build` with no rewriting.
   `check-registry` keeps its derived `target = path minus the registry/cadence/ prefix` guard, so a
   hand-written target still fails the gate.
3. Multi-file items keep their named files and add an `index.tsx` entry point only when they have one
   (`code-highlight` stays `highlight.tsx` + `use-highlighted-code.tsx`; it is a lib, not an entry point).
4. Docs are the distribution channel, so the gate now proves the docs: `check-registry` parses every
   `@/components/cadence/...` specifier in `content/**/*.mdx` and fails on a repeated id segment, an
   explicit `/index`, or a specifier that resolves to no installed file.

**Consequences**:

- ✅ One import form, identical in shape to shadcn's, on every page and in every payload.
- ✅ The directory-index resolution this relies on is a normal TS `bundler` / Next / Vite feature; the
  alternative (flat `components/cadence/button.tsx`) would have dropped the per-component folder that
  multi-file components need.
- ❌ Consumers on 0.1 installs keep a stale `button/button.tsx` after re-adding; the old import keeps
  working against a file that will never be updated. Pre-1.0, so this ships as a documented migration
  (rewrite `@/components/cadence/<id>/<id>` → `@/components/cadence/<id>`, delete the old file).
- ❌ File-name searches for `button.tsx` no longer find a component; editors show `index.tsx`.

**Rejected**: a directory `target` (writes an extensionless file, per the context above); a barrel
`index.ts` per component (37 extra forwarding files for no behaviour); flat `components/cadence/<id>.tsx`
(loses the folder multi-file components need, and mixes them with the `lib/` subtree).
