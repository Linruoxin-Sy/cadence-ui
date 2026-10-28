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
