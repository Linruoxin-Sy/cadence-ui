# Documentation site and distribution

> For an open-source component library, documentation is not an accessory — it **is the distribution channel**. This document defines the documentation information architecture, page templates, data flow, registry endpoints, AI channels, versioning strategy, and the contribution process.

---

## 1. Information architecture (IA)

```
/                              Home: 3 flagship demos + install command + features
/docs
  /docs/installation           Installation (Next / Vite / manual)
  /docs/theming                Theming and tokens
  /docs/motion                 Motion system (the public version of the Animation system document)
  /docs/accessibility          Accessibility commitments and checklist
  /docs/registry               Self-hosted registry / private distribution
  /docs/ai                     llms.txt / MCP / Skill
  /docs/changelog              Release notes
/components                    Catalog: category + motion tier + search
  /components/button
  /components/dialog
  ...
/blocks                        Composed examples (from v0.2)
/lab                           Experimental components (no stability promise)
```

**Filter dimensions** (catalog page): category (text/feedback/navigation/overlay/gesture/collection/scroll/theme), motion intensity (subtle/medium/expressive), complexity (S/M/L), dependencies (motion baseline / GSAP optional).

---

## 2. Component page template (12 sections)

Every component page renders from the same MDX, in a fixed order:

| #   | Section                             | Content requirements                                               |
| --- | ----------------------------------- | ------------------------------------------------------------------ |
| 1   | Title + one sentence                | Matches the registry `description`                                 |
| 2   | Preview                             | Interactive; with "slow motion 0.25×" and "reduced motion" toggles |
| 3   | When to use                         | 3–5 concrete scenarios                                             |
| 4   | When not to use                     | Point to the alternative component (prevents misuse)               |
| 5   | Installation                        | CLI (4 package managers) + manual (file list)                      |
| 6   | Basic usage                         | Smallest runnable code                                             |
| 7   | Variants and examples               | 3–6 examples, each with code                                       |
| 8   | API                                 | Props table: type, default, description                            |
| 9   | **Motion contract**                 | Enter/exit/interaction/reduced, itemised (see below)               |
| 10  | Keyboard and accessibility          | Key table + screen-reader behaviour + focus strategy               |
| 11  | Responsiveness and performance      | Breakpoint behaviour, size, SSR caveats                            |
| 12  | AI usage notes + related components | Trade-off advice for agents + cross-links                          |

### 2.1 The Motion contract section (this project's signature content)

```md
### Motion contract

| Phase       | Properties                | Token                    | Interruptible |
| ----------- | ------------------------- | ------------------------ | ------------- |
| enter       | opacity 0→1, y 8→0        | duration.base / ease.out | yes           |
| exit        | opacity 1→0, scale 1→0.98 | duration.fast / ease.in  | yes           |
| interaction | whileTap scale 0.97       | spring.press             | —             |
| reduced     | opacity only, 100ms       | duration.instant         | —             |
```

Tests read this section too (see the Animation system document, §9.3), so it must stay in sync with the code.

### 2.2 Preview capabilities

| Capability             | Implementation                                                                                                                  | Value                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Variant switching      | `?variant=` + client state                                                                                                      | One component, several shapes                                                |
| Slow motion 0.25×      | `CadenceProvider timeScale={4}` around the preview only, never globally                                                         | Lets people see the details                                                  |
| Reduced-motion preview | One switch in the site header (`full` / `reduced` / `none`), mirrored in `?motion=`; the preview only reports the resolved mode | A mode is a setting; 29 copies of the switch would be 29 chances to disagree |
| Theme switching        | `data-theme` / `class="dark"`                                                                                                   | Both themes                                                                  |
| Code copy              | Reads the registry `content`, never hand-written snippets                                                                       | Docs and source never drift                                                  |
| Install copy           | `npx shadcn add @cadence/<id>`                                                                                                  | Lowers the conversion barrier                                                |

> The preview's code block comes straight from `public/r/<id>.json`'s `content`, not from a hand-copied duplicate in the MDX — that is the key to preventing "stale docs code".

**Built today:** slow motion, the single `full` / `reduced` / `none` switch with `?motion=`, theme switching,
and per-page dynamic loading of previews. Variant switching, the code block, and install copy are **not**
built yet — `components/site/copy-command.tsx` exists but is mounted nowhere. The gap between this table and
the site is tracked in [parity-plan.md](parity-plan.md) §8, not here; this section describes the target.

### 2.3 Body typography

The MDX body is styled by [shadcn/typeset](https://ui.shadcn.com/docs/typeset), not by a typography layer of
ours. `app/typeset.css` is a verbatim copy of the upstream file (imported right after Tailwind in
`app/globals.css` and excluded from Biome so it stays diffable against upstream); `Mdx` wraps the rendered
markdown in `typeset typeset-docs`, and `.typeset-docs` in `app/globals.css` only sets the documented
controls — three rhythm values, the font families, and the `--color-*` aliases, because `@theme inline` does
not emit those custom properties.

| Rule                                                                          | Why                                                                       |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Style a markdown element in `app/typeset.css`, never in a preset or a page.   | The element rules come from upstream; a local rule forks the system.      |
| A preset sets `--typeset-size` / `--typeset-leading` / `--typeset-flow` only. | Everything else (heading scale, list indents, margins) derives from them. |
| Re-vendor the file wholesale when upstream changes; do not patch it.          | A patched copy means the next update is a merge, not a copy.              |

Tables keep typeset's "wrap to fit" behaviour and get a plain `overflow-x-auto` wrapper from the renderer;
`typeset-scroll` is not used because it sets `width: max-content`, which would stop the props table from
wrapping on desktop.

### 2.4 Document entrance

Each page makes its content `<article class="max-w-3xl py-12">` the entrance via
`DocumentEntrance as="article"`, a site-only client component (`components/site/document-entrance.tsx`). The
`.typeset` container inside it is untouched; the entrance belongs to the outer article, not to the markdown
elements. On a guide page the article is the title, description, and body; on a component page it is the
breadcrumb, header, preview, and body. The article rises 24px, fades from 0, clears a 4px blur, and opens a
`clip-path` from zero height at the same time. The wipe runs on `duration.slow` with `ease.inOut` — quicker
than the body's `duration.page` — so the edge leads and the content's rise, fade, and blur are still in
progress as it uncovers them. The clip keeps the element's full box, so the entrance does not reflow the page.

The server paints the hidden state. The root layout's `<noscript>` rule and the `@media print` rule in
`app/globals.css` restore the body when the entrance cannot run. The component stays outside
`registry/cadence/**`: a whole-body blur and a clip wipe exceed the shipped motion contract. Its timings still
come from `lib/motion.ts`, and the `reduced` branch keeps opacity only while `none` resolves every duration to
zero.

---

## 3. Data flow: one MDX drives every output

```
content/components/<id>.mdx  ─┐
registry.json (install meta)  ├─→ scripts/build-registry.mjs
registry/cadence/<id>/*.tsx  ─┘        │
                                       ├─→ public/r/<id>.json   (content + docs + meta)
                                       ├─→ public/r/<id>.md     (plain markdown)
                                       ├─→ public/r/catalog.json
                                       ├─→ public/llms.txt / llms-full.txt / llms-small.txt
                                       └─→ component pages statically rendered at build time
```

### 3.1 Frontmatter conventions

```yaml
---
title: Morph button
description: A button whose label and width morph between states on a spring.
category: feedback
motion: [state.morph, feedback.press]
intensity: medium
complexity: M
since: 0.1.0
deps: [motion]
registryDeps: [cadence-motion, cadence-utils]
---
```

Validation rules:

- `title` / `description` / `category` / `deps` must match `registry.json` exactly;
- every recipe in `motion` must exist in the recipe table of the Animation system document;
- `since` must be a released version;
- the body must contain the 12 section headings (a missing one fails the build).

### 3.2 Injecting the `docs` field

```js
// scripts/build-registry.mjs (excerpt)
const mdx = await readFile(`content/components/${id}.mdx`, "utf8");
const body = mdx.replace(/^---[\s\S]*?---\n/, "").trim();
item.docs = body; // goes into the payload; AI/CLI get it in one request
item.meta.since ??= since;
item.meta.sourceSha = commitSha;
```

> Difference from Arc: Arc's payload only carries a `meta.docs` URL; we put the body itself in the payload, so MCP needs no second fetch and docs are readable offline.

---

## 4. Registry endpoints

| Endpoint                     | Content                                                       | Caching           |
| ---------------------------- | ------------------------------------------------------------- | ----------------- |
| `/r/registry.json`           | Full index (name/type/title/description/categories/meta)      | 1h, with ETag     |
| `/r/<id>.json`               | A single item (content + target + deps + docs + meta)         | 1 year, immutable |
| `/r/<id>.md`                 | Per-component markdown (for AI/curl)                          | 1 year            |
| `/r/catalog.json`            | Machine-readable catalog (category, motion, intensity, since) | 1h                |
| `/r/registry-<version>.json` | Version snapshot per tag                                      | permanent         |

Implementation (Next Route Handler):

```ts
// app/r/[...path]/route.ts
export async function GET(_: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const file = path.join(process.cwd(), "public/r", ...(await params).path);
  if (!file.startsWith(path.join(process.cwd(), "public/r"))) return new Response("Not found", { status: 404 });
  const body = await readFile(file);
  return new Response(body, {
    headers: {
      "content-type": file.endsWith(".md") ? "text/markdown; charset=utf-8" : "application/json",
      "cache-control": "public, max-age=31536000, immutable",
      "access-control-allow-origin": "*",
    },
  });
}
```

> Security: only files under `public/r` can be read, which blocks directory traversal.

---

## 5. AI channels

### 5.1 `llms.txt`

```md
# Cadence UI

> Animation-first React components for shadcn. Base UI + Tailwind v4 + Motion.
> Install with `npx shadcn@latest add @cadence/<id>`.

## Install

- Registry: https://cadence.dev/r/{name}.json
- Namespace: `"registries": { "@cadence": "https://cadence.dev/r/{name}.json" }`

## Rules for agents

- Prefer an existing Cadence component; do not re-implement motion by hand.
- Read the component's Motion contract before changing animation code.
- Keep the reduced-motion branch; never remove `data-motion`.
- Motion presets live in `components/cadence/lib/motion.ts`.

## Components

- [Button](https://cadence.dev/r/button.md): Press feedback with a reduced branch. (form, T1)
- [Dialog](https://cadence.dev/r/dialog.md): Modal that fades and settles. (overlay, T2)
  ...
```

### 5.2 Other endpoints

| Endpoint          | Purpose                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| `/llms-full.txt`  | All component markdown inlined (~200–400 KB)                                                        |
| `/llms-small.txt` | Overview + one line per component (< 20 KB)                                                         |
| `/r/catalog.json` | Structured catalog (name, category, deps, motion, since)                                            |
| `/api/mcp`        | MCP: `list_components` / `search` / `get_component` / `get_install_command` / `get_motion_contract` |

### 5.3 MCP tool definitions (v0.2)

| Tool                  | Input                     | Output                        |
| --------------------- | ------------------------- | ----------------------------- |
| `list_components`     | `category?`, `intensity?` | id/name/description           |
| `search_components`   | `query`                   | Ranked matches + snippets     |
| `get_component`       | `id`                      | Source + docs + deps + target |
| `get_install_command` | `id`                      | `npx shadcn add …`            |
| `get_motion_contract` | `id`                      | Contract table (JSON)         |

> Compared with Arc's MCP, there is one extra tool, `get_motion_contract`: when an agent edits animation code it gets the allowed properties and durations directly.

### 5.4 Agent Skill (v0.3)

Package "how to choose a component, how to change motion, how to keep a11y" as `SKILL.md` + 3 rule files, distributed to `~/.claude/skills/cadence/` through a `registry:file` item.

---

## 6. Versions, changes, and deprecation

| Item                | Rule                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------- |
| Version numbers     | `v0.x.y`, semver (0.x may break, but it must be flagged in the CHANGELOG)                   |
| Tags                | Tag every release; `/r/registry-<version>.json` snapshot                                    |
| Item-level versions | `meta.since` (first appearance); breaking changes add `meta.changedIn`                      |
| CHANGELOG           | Generated from conventional commits, grouped Added/Changed/Fixed/Removed                    |
| Deprecation         | Mark `meta.deprecated: "0.4.0"` + a note at the top of the docs, keep for at least 2 minors |
| Migration           | Every breaking change ships a codemod or a "replacement snippet" doc                        |

**Why no npm package**: under the copy-the-source model, versions only answer "which version did I install"; no dependency resolution is needed. If a pure utility package such as `@cadence/motion` appears later, publish it to npm separately.

---

## 7. Contribution flow

### 7.1 Entry points

- Issue templates: `New component` (including job, motion, references), `Bug`, `Docs`.
- A component proposal must answer: what problem it solves, what causality the motion explains, how the reduced branch works, and how it differs from existing components.

### 7.2 PR checklist

- [ ] `pnpm check` passes (typecheck + lint + registry + unit)
- [ ] `pnpm test:e2e` passes (including the reduced-motion matrix)
- [ ] The component page has all 12 sections and an interactive preview
- [ ] Registry `docs` / `meta.motion` / `meta.intensity` are complete
- [ ] Within the size budget (computed by `registry:check`)
- [ ] Dual-theme screenshots (pasted in the PR)
- [ ] No `@/`, no `process.env`, no direct `window` reads

### 7.3 Review flow

1. Automated: CI + Vercel Preview (one deployment per PR, directly clickable).
2. Human: motion review (per §11 of the Animation system document) + API review (naming/control/passthrough).
3. Merge: squash merge, commit messages following conventional commits.
4. Release: maintainer runs `pnpm release` locally (bump + changelog + tag + push); Vercel deploys automatically.

---

## 8. Metrics

| Metric               | Collection                              | Target (3 months)         |
| -------------------- | --------------------------------------- | ------------------------- |
| Registry downloads   | `/r/*.json` access logs (de-duplicated) | ≥ 1,000                   |
| Component page views | Privacy-friendly analytics (Plausible)  | ≥ 5,000 PV                |
| Install conversion   | Docs page → CLI copy event              | ≥ 8%                      |
| GitHub stars         | Periodic API fetch                      | ≥ 300                     |
| Docs coverage        | CI check                                | 100%                      |
| a11y                 | axe                                     | 0 violations              |
| Performance          | Lighthouse CI                           | Component page LCP < 2.5s |
| Community            | First issue response                    | < 72h                     |

---

## 9. Launch acceptance: one user's complete journey

It must be possible, in a clean environment and without help outside the docs, to complete:

```bash
npx create-next-app@latest my-app --ts --tailwind --app
cd my-app
npx shadcn@latest init            # choose Base UI
# add the @cadence registry to components.json
npx shadcn@latest add @cadence/button
# import and use it in page.tsx
pnpm dev                          # see the motion; toggle system reduced motion to see the downgrade
```

Any step that requires "reading the source to figure it out" counts as a documentation defect.

---

## 10. Comparison with Arc's documentation system

| Dimension         | Arc                                                  | Cadence                                                  |
| ----------------- | ---------------------------------------------------- | -------------------------------------------------------- |
| README            | Generated, 119-component table + per-category counts | Generated, but only flagships + links (avoids 700 lines) |
| Component body    | On the site, payload only carries a URL              | Payload embeds `docs`                                    |
| Markdown endpoint | Yes                                                  | Yes (`/r/<id>.md`)                                       |
| llms              | Three files (txt/full/small)                         | Three files + catalog                                    |
| MCP               | Yes (list/search/get/install/skill)                  | Yes + `get_motion_contract`                              |
| Versions          | None                                                 | tag + `meta.since` + snapshot                            |
| Tests             | None                                                 | unit + E2E + axe + visual                                |
| Preview           | Private to the site                                  | Public, with slow-motion/reduced toggles                 |
