# Overall design

> This document defines "what we are building": repository layout, install model, registry data model, theming, component API, build pipeline, and quality gates. Motion details live in [Animation system](animation-system.md).

---

## 1. Design principles

| #   | Principle                             | Meaning                                                                                                                           | Cost when violated                                              |
| --- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| P1  | **Source ownership**                  | After install, a component is an ordinary file in the user's project: editable, deletable; no runtime package, no injected styles | Users are locked in, which clashes with the shadcn mental model |
| P2  | **No alias assumptions**              | Components use only relative paths + bare package names internally; `@/` appears only in documentation examples                   | Monorepos, `src/` layouts, and custom aliases break             |
| P3  | **Motion has a contract**             | Every component exposes four branches — enter, exit, interaction, reduced — and can be disabled                                   | Motion becomes unmaintainable magic                             |
| P4  | **Accessibility parity**              | Keyboard, screen readers, and reduced motion matter as much as visual motion, and are enforced in CI                              | The library can only be a demo, never ship in a product         |
| P5  | **Docs as data**                      | One MDX file → site page / registry `docs` / llms / MCP                                                                           | Docs drift from code                                            |
| P6  | **Light by default, heavy on demand** | Only `motion` by default; GSAP / Canvas components declare extra dependencies explicitly                                          | Bundle size scares users away                                   |
| P7  | **Predictable versions**              | tag + `meta.since` + `sourceSha`; every item is traceable                                                                         | Users cannot judge compatibility                                |

---

## 2. Architecture overview

```
┌──────────────────────────────────────────────────────────────┐
│ Authoring layer (this repo)                                  │
│  registry/cadence/** ← component source (typechecked and     │
│                        referenced by the docs)               │
│  content/**          ← MDX docs (frontmatter is one source   │
│                        of truth for metadata)                │
│  registry.json       ← install metadata (files / target /    │
│                        deps)                                 │
└───────────────┬──────────────────────────────────────────────┘
                │ 1. shadcn build (embeds content)
                │ 2. finalize (injects docs / meta / sourceSha)
                │ 3. check (consistency / coverage / size / export names)
                ▼
┌──────────────────────────────────────────────────────────────┐
│ Artifact layer                                               │
│  public/r/<id>.json  ← installable item (source + target +   │
│                        deps)                                 │
│  public/r/registry.json / catalog.json                       │
│  public/llms.txt / llms-full.txt / llms-small.txt            │
│  public/r/<id>.md    ← per-component markdown                │
└────────┬──────────────────────┬───────────────────────┬──────┘
         │                      │                       │
         ▼                      ▼                       ▼
    shadcn CLI          Docs site (Next)           AI channel
   @cadence/<id>        /components/<id>    llms.txt / MCP / Skill
```

**Key point**: the build only does deterministic work — "embed + merge metadata". Component source, docs, and metadata are already co-located in the authoring layer, which avoids "generators writing business logic".

---

## 3. Repository layout

```
cadence-ui/
├── app/                          # Next.js 16 App Router (docs site + registry routes)
│   ├── (docs)/docs/...           # installation, theming, motion, a11y, registry guides
│   ├── components/[id]/page.tsx  # component detail page (reads content/components/<id>.mdx)
│   ├── components/page.tsx       # catalog (category + motion intensity filter + search)
│   ├── r/[...path]/route.ts      # serves JSON/MD from public/r (with caching and CORS)
│   ├── llms.txt/route.ts         # generated llms text
│   └── api/mcp/route.ts          # MCP (v0.2)
├── components/                   # the docs site's own UI (not distributed components)
├── registry/
│   └── cadence/
│       ├── lib/                  # shared runtime installed alongside components
│       │   ├── motion.ts         # motion presets (TS)
│       │   ├── cn.ts             # className merging
│       │   └── provider.tsx      # MotionConfig + intensity switch (optional provider)
│       ├── button/               # one directory per shadcn id
│       │   └── button.tsx
│       ├── dialog/
│       └── ...                   # 57 components in total (55 ui + 2 blocks)
├── content/
│   ├── components/<id>.mdx       # component docs (with frontmatter)
│   ├── docs/*.mdx                # guides
│   └── meta.json                 # navigation and categories
├── public/r/                     # build artifacts (committed so a CDN can serve them directly)
├── scripts/
│   ├── build-registry.mjs        # shadcn build + finalize + validation
│   ├── check-registry.mjs        # consistency / coverage / export names / size
│   ├── build-llms.mjs            # llms.txt / llms-full / catalog
│   └── new-item.mjs              # scaffolding: directory + item entry + MDX template
├── tests/
│   ├── unit/                     # Vitest + RTL
│   └── e2e/                      # Playwright (motion matrix / a11y / SSR)
├── registry.json                 # install metadata (single source of truth)
├── next.config.ts / tsconfig.json / biome.json
├── package.json                  # scripts: dev/build/check/test/registry
└── README.md / CHANGELOG.md / LICENSE
```

### 3.1 Why the source tree mirrors the install tree

The install target is `@components/cadence/<id>/<id>.tsx` (`@components` is resolved by the user's `components.json`). If the source also lives at `registry/cadence/<id>/<id>.tsx`, then the relative relationship between `registry/cadence/lib/motion.ts` and `registry/cadence/<id>/<id>.tsx` is **exactly the same** as the relationship between `components/cadence/lib/motion.ts` and `components/cadence/<id>/<id>.tsx` after install.

Conclusions:

- A component can write `import { duration } from "../lib/motion"` and it still resolves after install;
- **No AST rewriting** is needed (unlike Arc), and `shadcn build` works as-is;
- The trade-off: every shared file must live inside the `cadence/` subtree (no host paths such as `@/lib/utils`).

> Relative imports such as `../lib/motion` and `../lib/cn` survive the build verbatim and still resolve after install; that property was checked before the pipeline was built.
>
> The docs site itself references source through `@/registry/cadence/...` (`tsconfig` maps `@/*` to the repo root). That does not conflict with "no aliases inside components": aliases only appear in docs-site code.

### 3.2 Rules for sharing across items

| Situation                                              | Approach                                                                                                                                                  |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Component A uses component B (e.g. dialog uses button) | List B's files in A's `files[]` (target unchanged) and add `registryDependencies: ["button"]`; the CLI de-duplicates by target                            |
| Shared utilities (`cn`, `motion`, provider)            | Separate `registry:lib` items referenced by every component's `registryDependencies`                                                                      |
| Theme tokens                                           | `cadence-theme` (`registry:theme`, `cssVars` + `css`), installed once                                                                                     |
| A block composing several components                   | The block's `files[]` contains only its own files; dependencies go through `registryDependencies`, so installation shares a single copy of each component |

> Difference from Arc: Arc **inlines a full copy** of each dependency's source into every block payload, so `button.tsx` shows up 17 times. We do not copy; we use "same target + `registryDependencies`", which keeps payloads small and drift-free. The trade-off is that installation must reach the registry (offline installs excepted).

---

## 4. Technology stack

| Layer                | Choice               | Version baseline           | Notes                                                                 |
| -------------------- | -------------------- | -------------------------- | --------------------------------------------------------------------- |
| Framework            | Next.js (App Router) | 16.x                       | Docs site and registry routes; RSC by default                         |
| UI                   | React                | 19.x                       | ref-as-prop, Actions, `use`                                           |
| Primitives           | Base UI              | `@base-ui/react` 1.6+      | shadcn 2026 default; `render` replaces `asChild`                      |
| Styling              | Tailwind CSS         | v4.x                       | CSS-first `@theme`; `tw-animate-css`                                  |
| Theming              | shadcn tokens        | `@theme inline` + CSS vars | Zero divergence from shadcn projects                                  |
| Animation            | Motion               | `motion` 13.x              | `motion/react` (default); `LazyMotion` + `m` as optional optimisation |
| Animation (optional) | GSAP                 | 3.13+                      | Only for timeline / scroll-narrative / SVG morph components           |
| Icons                | lucide-react         | latest                     | shadcn default                                                        |
| Build                | shadcn CLI           | 4.22+                      | `shadcn build` produces payloads                                      |
| Types                | TypeScript           | 5.9+ strict                | `noUncheckedIndexedAccess`, `verbatimModuleSyntax`                    |
| Unit tests           | Vitest + RTL         | latest                     | API, state, reduced-motion branches                                   |
| E2E                  | Playwright           | latest                     | interaction, motion matrix, axe, screenshots                          |
| Lint + format        | Biome                | 2.x                        | one fast pass for lint, formatting, and import order                  |
| Package manager      | pnpm                 | 10+                        | single package, no workspace (MVP stage)                              |

> One repository, one Next app, no monorepo/Turborepo: 57 components still fit one build. Split later, once the docs site and registry need independent deploys (reserved by ADR-009).

---

## 5. Distribution model

### 5.1 Installing on the user side

```jsonc
// components.json
{
  "registries": {
    "@cadence": "https://cadence.dev/r/{name}.json"
  }
}
```

```bash
npx shadcn@latest add @cadence/button
# or
npx shadcn@latest add https://cadence.dev/r/button.json
```

Install result:

```
components/cadence/
├── lib/{cn.ts,motion.ts,provider.tsx}   # dependencies pulled in automatically
├── button/button.tsx
└── ...
```

If the user's `components` alias is `src/components`, files land in `src/components/cadence/...`; the same holds for monorepo package aliases. **Components contain no `@/` references**, so no `tsconfig` change is needed.

### 5.2 Versions and pinning

- Every payload carries `meta.since` (first released version) and `meta.sourceSha` (build commit);
- The site exposes `https://cadence.dev/r/registry.json` and `https://cadence.dev/r/<id>.json?ref=v0.3.0` (static snapshots built per tag);
- No runtime license checks; free items are MIT.

### 5.3 registry:base

We ship a `cadence-base` (`registry:base`) item that pins the consumer's shadcn setup to **Base UI + lucide + neutral**, avoiding "I followed the Radix docs but got Base UI code".

```jsonc
{
  "name": "cadence-base",
  "type": "registry:base",
  "style": "base-ui",
  "iconLibrary": "lucide",
  "baseColor": "neutral",
  "theme": "neutral"
}
```

> Field names follow the 2026 schema; the exact `style` values must be confirmed against the shadcn docs in the first implementation week (see Gate 0).

---

## 6. The registry.json data model

### 6.1 Example item

```jsonc
{
  "name": "button",
  "type": "registry:ui",
  "title": "Button",
  "description": "Triggers an action, with press feedback that collapses under reduced motion.",
  "categories": ["form", "feedback"],
  "dependencies": ["@base-ui/react", "class-variance-authority", "motion"],
  "registryDependencies": ["@cadence/cadence-motion", "@cadence/cadence-utils", "@cadence/cadence-provider"],
  "files": [
    {
      "path": "registry/cadence/button/button.tsx",
      "type": "registry:ui",
      "target": "@components/cadence/button/button.tsx"
    }
  ],
  "docs": "…markdown injected from content/components/button.mdx…",
  "meta": {
    "since": "0.2.0",
    "tier": "T1",
    "motion": ["feedback.press"],
    "intensity": "subtle",
    "complexity": "S",
    "upstream": { "registry": "shadcn", "style": "base-ui", "version": "2026-10" },
    "sourceSha": "abc1234"
  }
}
```

### 6.2 Naming and categorisation

| Field             | Rule                                                                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `name`            | kebab-case, verb/noun phrase; matches the directory name; globally unique (including export names)                                      |
| `type`            | components `registry:ui`; pure utilities `registry:lib`; composed blocks `registry:block`; theme `registry:theme`; base `registry:base` |
| `categories`      | fixed enum: `text`, `feedback`, `navigation`, `overlay`, `gesture`, `collection`, `scroll`, `theme`                                     |
| `meta.motion`     | array of recipe names (see the Animation system doc), used for docs filtering and "motion search"                                       |
| `meta.batch`      | `B1`–`B9`, the parity batch that shipped the component; the docs sidebar nests items by it                                              |
| `meta.intensity`  | `subtle` / `medium` / `expressive`, used for the intensity filter                                                                       |
| `meta.complexity` | `S` / `M` / `L`, used for contributor estimates                                                                                         |
| `meta.since`      | first released version, injected automatically                                                                                          |

### 6.3 Docs injection

The frontmatter of `content/components/<id>.mdx` must match the metadata in `registry.json` (title/description/categories/deps); `check:registry` enforces this. At build time the body (frontmatter stripped) is written into the item's `docs` field.

Benefit: an MCP/CLI client that fetches `button.json` gets source and docs together, with no second request to the site.

---

## 7. Theming and tokens

### 7.1 Layers

```
shadcn base tokens (--background / --foreground / --primary / …)
        ↓ reused, never redefined
Cadence semantic extensions (--surface / --border-subtle / --success / …, added only when necessary)
        ↓
Motion tokens (--motion-duration-* / --motion-ease-* / --motion-distance-*)
        ↓
Exposed through Tailwind @theme (--ease-cadence-*, --animate-*)
```

### 7.2 Installing the theme

`cadence-theme` injects via the registry's `cssVars` (theme/light/dark), so users never hand-edit CSS:

```jsonc
{
  "name": "cadence-theme",
  "type": "registry:theme",
  "cssVars": {
    "theme": { "--radius-control": "0.75rem" },
    "light": { "--motion-intensity": "1" },
    "dark": { "--motion-intensity": "1" }
  },
  "css": {
    "@layer base": {
      "[data-motion='reduced']": { "--motion-intensity": "0.5" },
      "[data-motion='none']": { "--motion-intensity": "0" }
    }
  }
}
```

### 7.3 Intensity switch

| Attribute                               | Behaviour                                                  | Implementation                                                  |
| --------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------- |
| system `prefers-reduced-motion: reduce` | disable transform/layout motion, keep opacity              | `MotionConfig reducedMotion="user"` + CSS media query           |
| `data-motion="full"` (default)          | all motion                                                 | —                                                               |
| `data-motion="reduced"`                 | halve distance/scale, duration ×0.6, keep fades            | `useCadenceMotion()` reads the CSS variables and scales presets |
| `data-motion="none"`                    | every animation duration 0, jump straight to the end state | CSS variables zeroed + Motion `transition={{duration:0}}`       |

> Semantics: the system preference beats the product switch; `none` is a forced downgrade for screen recordings, low-end devices, and tests.

---

## 8. Component API rules

### 8.1 Shape

1. **Compound components**: `Root / Trigger / Content / Item / …`, matching Base UI / shadcn;
2. **`render` passthrough**: Base UI uses `render`, not `asChild`;
3. **Controlled + uncontrolled**: `value`/`defaultValue`, `open`/`defaultOpen` + `onXChange`;
4. **`data-slot`**: every part carries `data-slot="dialog-content"` so users can target it with CSS;
5. **`className` merging**: always through `cn()`, with user classes last;
6. **refs**: React 19 `ref` prop directly (no `forwardRef`).

### 8.2 Skeleton

```tsx
"use client";

import { motion } from "motion/react";
import { cn } from "../lib/cn";
import { useCadenceMotion } from "../lib/provider";

export interface PanelProps extends React.ComponentPropsWithoutRef<"div"> {
  open: boolean;
}

export function Panel({ open, className, ...props }: PanelProps) {
  const cm = useCadenceMotion();

  return (
    <motion.div
      data-slot="panel"
      data-motion={cm.mode}
      className={cn("rounded-lg border border-border", className)}
      initial={false}
      animate={open ? { opacity: 1, y: 0 } : { opacity: 0, y: cm.reduced ? 0 : 8 }}
      transition={cm.transition("enter.pop")}
      {...props}
    />
  );
}
```

### 8.3 Hard rules

| Rule                                                     | Reason                                                    |
| -------------------------------------------------------- | --------------------------------------------------------- |
| No `@/` aliases                                          | P2, aliases are irrelevant                                |
| No global CSS / no modifying `html`/`body`               | The user's project is outside our control                 |
| No styling system other than Tailwind                    | Consistency with shadcn                                   |
| No hard-coded colours, semantic tokens only              | Themes must be swappable                                  |
| No reading `window`/`matchMedia` during render           | SSR safety; use `useReducedMotion`/`useSyncExternalStore` |
| `initial={false}` for above-the-fold elements            | Avoid post-hydration flicker and CLS                      |
| Animations only touch `transform` / `opacity` / `filter` | Performance budget                                        |
| Every motion needs a reduced branch                      | P4                                                        |
| Every component has `data-motion` and `aria-*`           | Testable, degradable                                      |

---

## 9. Shared runtime

`registry/cadence/lib/` is a minimal runtime (~150 lines) installed alongside components:

```tsx
// provider.tsx (excerpt)
"use client";
import { MotionConfig } from "motion/react";
import { createContext, useContext, useMemo } from "react";

type Mode = "full" | "reduced" | "none";

const Ctx = createContext<{ mode: Mode; transition: (recipe: string, o?: object) => object } | null>(null);

export function CadenceProvider({ mode = "full", children }: { mode?: Mode; children: React.ReactNode }) {
  const transition = useMemo(() => recipeTable(mode), [mode]);
  return (
    <Ctx.Provider value={{ mode, transition }}>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.24 }}>
        <div data-motion={mode} className="contents">
          {children}
        </div>
      </MotionConfig>
    </Ctx.Provider>
  );
}

/** Without a provider, returns full + the system preference; components work standalone. */
export function useCadenceMotion() {
  const ctx = useContext(Ctx);
  return ctx ?? fallbackMotion;
}
```

Key points:

- **The provider is never required**: components use `motion` components directly; the provider only centralises `MotionConfig` and the intensity switch. Without it components still work, they just cannot be downgraded globally.
- For a smaller initial bundle, `LazyMotion` + `m` is optional (~5 KB initial + 24 KB feature bundle), but then every `motion.*` inside components must become `m.*` and a provider must wrap the app; the library does not do this by default, to avoid a mandatory provider.
- `data-motion` sits on the wrapper, so CSS variables and JS read the same source.

---

## 10. Build and validation pipeline

### 10.1 Commands

```jsonc
{
  "scripts": {
    "dev": "next dev",
    "build": "pnpm registry:build && next build",
    "registry:build": "node scripts/build-registry.mjs",
    "registry:check": "node scripts/check-registry.mjs",
    "llms:build": "node scripts/build-llms.mjs",
    "typecheck": "tsc --noEmit",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "format:check": "biome format .",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "check": "pnpm typecheck && pnpm lint && pnpm registry:check && pnpm test"
  }
}
```

`lint` is `biome check`: a single pass that lints, verifies formatting, and sorts imports, so `pnpm check`
gates both style and formatting. `format` rewrites files, `lint:fix` also applies safe lint fixes. The
configuration in `biome.json` enables Biome's `next` and `react` domains (the successor to the Next.js ESLint
config), keeps double quotes, semicolons, and a 120-column width, and parses Tailwind's at-rules in
`app/globals.css`. Generated artifacts (`public/r/**`, `llms.txt`) and MDX content are excluded because the
build owns their formatting.

### 10.2 build-registry steps

```
1. Read registry.json and validate the schema (zod)
2. Read content/components/*.mdx, inject docs, sync meta.since
3. Call shadcn build (or reuse its output) → public/r/*.json
4. finalize: add $schema, meta.sourceSha, generate registry.json / catalog.json
5. Call check-registry (see 10.3)
```

> If `shadcn build` changes behaviour in a future version (e.g. stops embedding content), step 3 can be replaced by an in-house builder; the interface stays the same.

### 10.3 check-registry (CI gate)

| Check                                                                                                             | Failure example                                              |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Every item's `files[].path` exists                                                                                | Renamed a file but forgot to update registry.json            |
| `target` must equal `@components/cadence/<path minus the registry/cadence/ prefix>`                               | Hand-written target drifts                                   |
| Payload content matches source (rebuild produces an empty diff)                                                   | Forgot `registry:build`                                      |
| Every item has `docs` of at least 200 characters                                                                  | Documentation missing                                        |
| Every item has `meta.motion` and `intensity`                                                                      | Incomplete metadata                                          |
| Export names unique across the library (sharing within a directory is allowed)                                    | Two components both export `Content`, so `export *` collides |
| `dependencies` may only be npm package names; `registryDependencies` exist in this library                        | Misspelled package / circular dependency                     |
| Each item's gzipped source is ≤ 8 KB (dependencies excluded)                                                      | Component bloat                                              |
| Source must not contain `@/`, `process.env`, or direct `window` reads                                             | Violates P2 / SSR rules                                      |
| reduced-motion: every file containing `motion`/`animate` must also contain `useReducedMotion` or `motion-reduce:` | Missing downgrade                                            |

### 10.4 CI

```yaml
name: ci
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm registry:build && pnpm registry:check
      - run: pnpm test
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e
```

---

## 11. Quality gate (Definition of Done)

Before a component can be merged it must satisfy:

- [ ] No contrast problems in either theme (light/dark) or under a custom `--primary`
- [ ] All three `data-motion="full|reduced|none"` levels work
- [ ] Every operation is keyboard-reachable; focus is visible; `aria-*` present
- [ ] No SSR first-paint flicker; no hydration warnings
- [ ] Unit tests cover the API and the reduced branch; Playwright covers the main interaction
- [ ] axe: 0 violations
- [ ] Size: component source gzip ≤ 8 KB; initial page JS ≤ 120 KB
- [ ] Docs: MDX completes the 12-section template; examples run
- [ ] Registry: `docs`, `meta.motion`, `meta.intensity` all present
- [ ] Visual regression screenshots (3 states × 2 themes)

---

## 12. Compatibility and constraints

| Dimension         | Support                                    | Notes                                                              |
| ----------------- | ------------------------------------------ | ------------------------------------------------------------------ |
| React             | 19.x                                       | 18 is not supported; drop ref-as-prop if you need it               |
| Next.js           | 15/16 App Router                           | The docs site uses 16; components are framework-agnostic           |
| Vite              | Supported                                  | No Next dependency; `next/image`-style components are not provided |
| Tailwind          | v4 only                                    | v3 is not supported (shadcn v4 theme system)                       |
| Browsers          | modern evergreen                           | `oklch`, `:has`, `color-mix`; fall back to static colours          |
| RSC               | all components are client (`"use client"`) | Used across a `"use client"` boundary; server pages are unaffected |
| pnpm/npm/yarn/bun | all                                        | affects only the install command, not the artifacts                |

---

## 13. Security and licensing

- Free items are MIT; `LICENSE` at the repo root, no mandatory copyright header in files (same as shadcn).
- No runtime that requires accounts or telemetry; site analytics use a privacy-friendly option (Plausible/Umami).
- GSAP has been free for commercial use since 2025-04, but stays an optional dependency to keep the default bundle small.
- Supply chain: `pnpm-lock.yaml` is committed; Dependabot/Renovate updates weekly; `pnpm audit` before releases.

---

## 14. Structural comparison with Arc

| Dimension          | Arc                                                 | Cadence                                          |
| ------------------ | --------------------------------------------------- | ------------------------------------------------ |
| Source tree        | `registry/components/<id>` + `registry/blocks/<id>` | `registry/cadence/<id>` (single subtree)         |
| Install target     | everything under `arc/`                             | everything under `cadence/`                      |
| Import rewriting   | in-house AST rewrite                                | source mirrors the install tree, zero rewriting  |
| Dependency sharing | blocks inline-copy component source                 | `registryDependencies` + same target, no copying |
| Styling            | CSS Modules                                         | Tailwind v4 + shadcn tokens                      |
| Primitives         | Radix                                               | Base UI                                          |
| Docs               | site body only, payload holds a URL                 | payload carries the `docs` body                  |
| Build              | in-house scripts + prebuild                         | `shadcn build` + finalize                        |
| Versions           | none                                                | tag + `meta.since` + `sourceSha`                 |
| Tests              | none (visual acceptance on the site)                | Vitest + Playwright + axe + size budget          |
