# Parity plan: shipping every shadcn component

> Status: approved plan, v4 (2026-10). This document is the build record for the "parity" effort:
> replace the eight original motion components with an API-compatible, motion-enhanced superset of
> shadcn's component catalogue. It is the authority for scope, batching, and the contracts every
> new component must satisfy. Architecture details remain in [overall-design.md](overall-design.md);
> motion details remain in [animation-system.md](animation-system.md).

---

## 1. Why this plan exists

The first eight components (`fade-in`, `text-reveal`, `number-flow`, `morph-button`,
`animated-tabs`, `motion-accordion`, `scroll-progress`, `motion-dialog`) shared one problem: their
APIs were invented. `MotionDialog` took `trigger`/`title`/`children`; shadcn's `Dialog` is compound
(`Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, …). A user could not swap one for the
other, so the library could never be "shadcn with better motion".

The parity effort changes the unit of work from "a motion component" to "a shadcn component with a
motion contract". Success means: for any component id in the list below, a user can install
`@cadence/<id>`, keep their existing JSX almost unchanged, and get better motion plus a documented
reduced-motion branch.

## 2. Scope

| Bucket                        | Count  | Notes                                                               |
| ----------------------------- | ------ | ------------------------------------------------------------------- |
| `registry:ui` components      | 55     | Batch B1–B7, B9                                                     |
| `registry:block` compositions | 2      | Data Table, Date Picker (docs treat them as guides, not primitives) |
| **Total in scope**            | **57** | Ships by `0.5.0`                                                    |
| Backlog: AI components        | 26     | Not scheduled; prerequisites in §7                                  |
| Backlog: `direction`          | 1      | Explicitly deferred                                                 |
| Explicitly not shipping       | 3      | `form`, `native-select`, `sonner`                                   |

`form` and `native-select` are excluded because the library does not own validation or form state
(§4). `sonner` is excluded because notifications ship through `toast`.

## 3. Principles added for parity

P1–P7 stay as written in [overall-design.md](overall-design.md).

| #   | Principle                    | Meaning                                                                                                     | Cost when violated                                  |
| --- | ---------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| P8  | **Superset, never subset**   | Only additive props and variants. No renamed exports, no removed exports, `data-slot` values match upstream | Users cannot swap `ui/x` for `cadence/x`            |
| P9  | **One animation, one cause** | Every animation must explain a state change in one sentence, or the component is T0 and stays static        | Motion becomes decoration and a performance tax     |
| P10 | **Upstream is traceable**    | Every item records `meta.upstream`; CI compares exports and `data-slot` values against a pinned manifest    | Upstream API drift goes unnoticed                   |
| P11 | **UI only, no validation**   | Components render invalid state; they never decide what is invalid                                          | Two owners for one concern; users fight the library |

### 3.1 P11 in detail

| The component does                                             | The user does                                                 |
| -------------------------------------------------------------- | ------------------------------------------------------------- |
| Styles driven by `aria-invalid="true"` / `data-invalid`        | Deciding whether a value is valid                             |
| Renders an error slot it is given (`FieldError`, `error` text) | Validation rules (required, format, length, async uniqueness) |
| Wires `aria-describedby` / `aria-errormessage` ids             | Schemas and resolvers (zod, yup, valibot)                     |
| Passes through `disabled`, `required`, `readOnly`              | Form state (react-hook-form, TanStack Form)                   |
| Keeps focus visible and keyboard reachable                     | Submit, retry, error mapping, focus-jump policy               |

Hard rules:

1. No validation library imports in `registry/cadence/**`.
2. No `validate`, `schema`, `resolver`, or `rules` props.
3. Invalid styling must be attribute-driven, never internal `hasError` state.
4. An error may animate in, but animation is never the only signal: text and `aria-invalid` must
   carry the state on their own.
5. Async feedback (`button` loading, `toast`) accepts state from the caller; it never orchestrates
   requests. `toast.promise` is out of scope.

`scripts/check-registry.mjs` enforces rules 1–2 as a dependency and import ban.

## 4. Installation model

- Target: `@components/cadence/<id>/<id>.tsx` — a parallel tree next to `components/ui`. It never
  overwrites a shadcn file, so both can coexist while a project migrates.
- IDs: identical to shadcn (`accordion`, `button`, `dialog`, …). Docs URLs therefore line up with
  upstream, which matters for humans and for LLM retrieval.
- Exports: identical to upstream (`Button`, `buttonVariants`, `DialogContent`, …). Additive props
  are allowed (`motion`, `loading` on `button`); renames are not.
- Shared runtime stays in `registry/cadence/lib/` and is pulled in through `registryDependencies`.

## 5. Removing the old components (B0)

```bash
git tag v0.1.0-mvp
git branch archive/mvp-8
# then one commit on main deletes the eight components
```

| Removed                                                                      | Count   |
| ---------------------------------------------------------------------------- | ------- |
| `registry/cadence/<eight ids>/`                                              | 8       |
| `content/components/<eight ids>.mdx`                                         | 8       |
| `public/r/<id>.{json,md}`                                                    | 16      |
| `registry.json` items                                                        | 8       |
| `preview.tsx` cases, `tests/components.test.tsx` describes                   | 2 files |
| `app/layout.tsx` (`ScrollProgress`), `app/page.tsx` (`FadeIn`, `TextReveal`) | 2 files |
| README, `docs/*.md`, `content/docs/*.mdx` references                         | 8 files |

Kept: `lib/{cn,motion,provider}`, `cadence-base`, `cadence-theme`, `scripts/`, site shell, test
setup. Capability that survives:

| Old                                                        | New home                                     |
| ---------------------------------------------------------- | -------------------------------------------- |
| `morph-button`                                             | `button` loading/label state                 |
| `animated-tabs`                                            | `tabs` shared indicator                      |
| `motion-accordion`                                         | `accordion` height animation                 |
| `motion-dialog`                                            | `dialog` anchored entrance                   |
| `fade-in`, `text-reveal`, `number-flow`, `scroll-progress` | recipes kept; return as `extras/*` after 1.0 |

B0 is done when `pnpm registry:build && pnpm check` is green with only the foundation items plus
the two pilot components.

### 5.1 B0 verification (2026-10-29)

- `pnpm check` green: 7 items, 2 components, 2 previews, tier budgets met, P11 clean.
- A throwaway consumer project configured with
  `"registries": { "@cadence": "http://127.0.0.1:4173/r/{name}.json" }` installed `@cadence/dialog`
  with shadcn CLI 4.23. It wrote `components/cadence/{button,dialog}/`, pulled
  `components/cadence/lib/{cn,motion,provider}`, installed `@base-ui/react`,
  `class-variance-authority`, `motion`, and `lucide-react`, and kept every relative import intact.
- The probe confirmed why dependencies must be namespaced: a bare `button` resolves against the
  default shadcn registry. `registry:check` now rejects un-namespaced dependencies.

## 6. Architecture for 57 components

### 6.1 Layout

```
registry/cadence/
  lib/{cn.ts,motion.ts,provider.tsx,hooks/use-mobile.ts,hooks/use-highlighted-code.ts}
  button/button.tsx
  dialog/dialog.tsx
  ...
content/components/<id>.mdx
content/docs/{installation,theming,motion,validation}.mdx
components/site/previews/<id>.tsx
tests/components/<id>.test.tsx
upstream/manifest.json        # pinned upstream API surface
.cache/shadcn/                # fetched upstream source (gitignored)
```

### 6.2 Item metadata

```jsonc
"meta": {
  "since": "0.2.0",
  "tier": "T2",
  "motion": ["popup.anchored", "exit.fade"],
  "intensity": "medium",
  "complexity": "L",
  "upstream": { "registry": "shadcn", "style": "base-ui", "version": "2026-10" }
}
```

`tier` drives the size budget, the docs template, and how deep the tests go. Categories are
`layout`, `form`, `navigation`, `overlay`, `feedback`, `data`, `ai`, `utility`.

### 6.3 Motion tiers

| Tier | Definition                  | Examples                                                   | Allowed recipes                                     |
| ---- | --------------------------- | ---------------------------------------------------------- | --------------------------------------------------- |
| T0   | Structural, no animation    | input, textarea, label, kbd, table, separator, card, badge | none (colour/focus transitions only)                |
| T1   | Micro-interaction           | button, toggle, switch, checkbox, slider, input-otp        | `feedback.press`, `state.morph`                     |
| T2   | Overlay enter/exit          | dialog, popover, tooltip, menu, select, toast              | `enter.pop`, `exit.fade`, `popup.anchored`          |
| T3   | Continuity / shared element | tabs, accordion, collapsible, sidebar, navigation-menu     | `layout.shared`, `layout.move`, `list.stagger`      |
| T4   | Data and feedback           | progress, chart, skeleton, spinner, carousel, calendar     | `number.roll`, `scroll.progress`, `data.transition` |
| T5   | AI / composite              | attachment, bubble (later message, trace)                  | reuse T1–T4                                         |

Two recipes are added before they are used: `disclosure.height` (height is allowed for disclosures)
and `data.transition`. Both must land in [animation-system.md](animation-system.md) first.

### 6.4 Budgets

| Tier      | gzip ceiling                                                  |
| --------- | ------------------------------------------------------------- |
| T0        | 4 KB                                                          |
| T1        | 6 KB                                                          |
| T2        | 10 KB                                                         |
| T3        | 12 KB                                                         |
| T4        | 14 KB                                                         |
| T5        | 12 KB                                                         |
| Exception | `meta.budget` with a written reason (sidebar, chart, command) |

### 6.5 Definition of done (per component)

1. Source at `registry/cadence/<id>/<id>.tsx`, relative imports only, `data-slot` on every part.
2. Exports and props match upstream (parity check), additive props documented.
3. Registry item with `meta.tier`, `motion`, `intensity`, `complexity`, `upstream`.
4. MDX: compact (9 sections) for T0–T1, standard (12) for T2+, including the motion contract and,
   for input components, the "Validation and data ownership" section.
5. Preview module at `components/site/previews/<id>.tsx`.
6. Unit test: render, `data-slot`, keyboard path, reduced branch.
7. Payload rebuilt, `pnpm check` green, dual-theme screenshot in the PR.

## 7. Batches

Ordering is by dependency: atoms → structure → form controls → overlays → menus → disclosure →
heavy data → compositions → AI.

| Batch | Theme                      | Items  | Depends on | Person-days | Version |
| ----- | -------------------------- | ------ | ---------- | ----------- | ------- |
| B0    | Removal + pilot            | —      | —          | 3           | 0.1.x   |
| B1    | Atoms                      | 11     | B0         | 9.5         | 0.2.0   |
| B2    | Structure and feedback     | 9      | B1         | 9           | 0.2.0   |
| B3    | Form controls              | 8      | B1         | 11.5        | 0.3.0   |
| B4    | Overlays                   | 7      | B1         | 15          | 0.3.0   |
| B5    | Menus and selection        | 7      | B4         | 17.5        | 0.4.0   |
| B6    | Disclosure and collections | 6      | B1, B4     | 11.5        | 0.4.0   |
| B7    | Heavy data and navigation  | 5      | B1, B4, B5 | 17          | 0.5.0   |
| B8    | Compositions (blocks)      | 2      | B3–B7      | 4.5         | 0.5.0   |
| B9    | AI first                   | 2      | B1         | 3.5         | 0.5.0   |
|       | **Total**                  | **57** |            | **102**     |         |

### B1 — atoms (11)

`button`, `badge`, `kbd`, `separator`, `label`, `input`, `textarea`, `card`, `aspect-ratio`,
`avatar`, `skeleton`.

### B2 — structure and feedback (9)

`alert`, `empty`, `item`, `field`, `button-group`, `input-group`, `breadcrumb`, `pagination`,
`spinner`.

### B3 — form controls (8)

`checkbox`, `radio-group`, `switch`, `slider`, `toggle`, `toggle-group`, `input-otp`, `progress`.

### B4 — overlays (7)

`dialog`, `alert-dialog`, `sheet`, `drawer`, `popover`, `tooltip`, `hover-card`.

### B5 — menus and selection (7)

`dropdown-menu`, `context-menu`, `menubar`, `select`, `combobox`, `command`, `toast`.

### B6 — disclosure and collections (6)

`accordion`, `collapsible`, `tabs`, `table`, `carousel`, `scroll-area`.

### B7 — heavy data and navigation (5)

`chart`, `calendar`, `navigation-menu`, `resizable`, `sidebar`.

### B8 — compositions (2, `registry:block`)

`data-table`, `date-picker`.

### B9 — AI first (2)

`attachment`, `bubble`. `marker` and `message` moved to the backlog.

### Batch gate

Every batch must pass: `pnpm check`, `parity:check`, manual `data-motion` full/reduced/none,
axe with zero violations, size budget, and dual-theme screenshots.

## 8. Backlog

### AI components (26, unscheduled)

Chat, Prompt Input, Message Scroller, Message, Marker, Model Selector, Reasoning, Chain of Thought,
Tool, Task, Queue, Sources, Inline Citation, Plan, Confirmation, Checkpoint, Subagent, Terminal,
Test Results, Context, File Tree, Suggestion, Code Block, Trace, Stack Trace, Questionnaire.

Prerequisites before any AI batch is scheduled:

1. `@shadcn/react` pinned and its install path confirmed.
2. A streaming message model agreed (chunking, state machine, cancel, retry).
3. Upstream source obtained: most of these ids are not in shadcn's registry index, so parity
   checking has nothing to compare against until they are.

### Deferred and excluded

| Item            | Decision                                                         |
| --------------- | ---------------------------------------------------------------- |
| `direction`     | Deferred                                                         |
| `form`          | Not shipping: validation and form state belong to the user (P11) |
| `native-select` | Not shipping: `select` covers the capability                     |
| `sonner`        | Not shipping: notifications go through `toast`                   |

## 9. Tooling

| Script                           | Change                                                                                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------- |
| `scripts/new-item.mjs`           | New. Scaffolds source, docs, preview, test, registry item from a tier-specific template        |
| `scripts/check-registry.mjs`     | Tier budgets, banned validation deps, required `meta.tier`/`meta.upstream`, block type support |
| `scripts/parity.mjs` (B1)        | Generates `upstream/manifest.json` and compares exports + `data-slot` values                   |
| `scripts/sync-upstream.mjs` (B1) | Fetches upstream source into `.cache/shadcn` for diffing                                       |

## 10. Schedule

| Version | Scope      | Person-days | One developer | Two developers |
| ------- | ---------- | ----------- | ------------- | -------------- |
| 0.2.0   | B0–B2 (20) | 21.5        | 4.5 weeks     | 2.5 weeks      |
| 0.3.0   | B3–B4 (15) | 48          | 9.5 weeks     | 5.5 weeks      |
| 0.4.0   | B5–B6 (13) | 77          | 15.5 weeks    | 8.5 weeks      |
| 0.5.0   | B7–B9 (9)  | 102         | 20.5 weeks    | 12 weeks       |

With a 15% buffer: about 23–24 weeks for one developer, 12–13 weeks for two.

## 11. Risks

| Risk                                               | Mitigation                                                     |
| -------------------------------------------------- | -------------------------------------------------------------- |
| Upstream API drift across 57 hand-maintained files | Pinned manifest, parity check, quarterly sync, `meta.upstream` |
| Size budget unrealistic for upstream source        | Tier budgets plus `meta.budget` exceptions with reasons        |
| Every component animating                          | T0 is a real tier; "one cause" review rejects decoration       |
| Data Table / Date Picker written as primitives     | They are `registry:block` with a guide template                |
| AI upstream instability                            | Backlog until prerequisites are met                            |
| Documentation load (57 × 9–12 sections)            | `new-item.mjs` scaffolding plus three templates                |
| Existing users of the eight components             | Tagged release, migration note (import path only)              |
