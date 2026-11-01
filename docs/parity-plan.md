# Parity plan: shipping every shadcn component

> Status: **B0–B9 implementations shipped (2026-11-01); B1–B3 and B6–B9 batch gates complete.
> Historical B4–B5 visual gates and §8 remain open; B4 is next.**
> This document is the build record for the "parity" effort: replace the eight original motion components
> with an API-compatible, motion-enhanced
> superset of shadcn's component catalogue. It is the authority for scope, batching, and the contracts
> every new component must satisfy. Architecture details remain in [overall-design.md](overall-design.md);
> motion details remain in [animation-system.md](animation-system.md).
>
> **Working rule — see §7.0:** when a batch or a component finishes, mark it complete **in this file**, in the
> same change. A batch whose row still says `next` is not done, whatever the branch contains.

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
| `registry:ui` components      | 56     | Batch B1–B7, B9                                                     |
| `registry:block` compositions | 2      | Data Table, Date Picker (docs treat them as guides, not primitives) |
| **Total in scope**            | **58** | Ships by `0.5.0`                                                    |
| Backlog: AI components        | 25     | Not scheduled; prerequisites in §7                                  |
| Backlog: `direction`          | 1      | Explicitly deferred                                                 |
| Explicitly not shipping       | 3      | `form`, `native-select`, `sonner`                                   |

The inventory is 58 documented components (56 UI + 2 blocks). The former 57-item
headline omitted `code-block` when it moved out of the AI backlog into B9 (§7.5).
B9 therefore counts all three shipped items; the historical effort estimate stays
102 person-days rather than inventing a new estimate for work already delivered.

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

- Target: `@components/cadence/<id>/index.tsx` — a parallel tree next to `components/ui`. It never
  overwrites a shadcn file, so both can coexist while a project migrates.
- IDs: identical to shadcn (`accordion`, `button`, `dialog`, …). Docs URLs therefore line up with
  upstream, which matters for humans and for LLM retrieval.
- Exports: identical to upstream (`Button`, `buttonVariants`, `DialogContent`, …). Additive props
  are allowed (`motion`, `loading` on `button`); renames are not.
- Shared runtime stays in `registry/cadence/lib/` and is pulled in through `registryDependencies`.

## 5. Removing the old components (B0) — ✅ complete

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

## 6. Architecture for 58 components

### 6.1 Layout

```
registry/cadence/
  lib/{cn.ts,motion.ts,provider.tsx,hooks/use-mobile.ts,hooks/use-highlighted-code.ts}
  button/button.tsx
  dialog/dialog.tsx
  ...
content/components/<id>.mdx
content/docs/{installation,theming,motion,motion-modes}.mdx
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
  "batch": "B4",
  "motion": ["popup.anchored", "exit.fade"],
  "intensity": "medium",
  "complexity": "L",
  "upstream": { "registry": "shadcn", "style": "base-ui", "version": "2026-10" }
}
```

`tier` drives the size budget, the docs template, and how deep the tests go. Categories are
`layout`, `form`, `navigation`, `overlay`, `feedback`, `data`, `ai`, `utility`.

One optional key sits next to `upstream`: `parity`, a list of the differences from upstream that the
visual style forces, each with the path and the reason.

```jsonc
"parity": {
  "props": [
    { "path": "ToggleGroup.spacing", "reason": "base defaults to 2, new-york-v4 to 0" }
  ]
}
```

`parity:check` fails on a difference that is not recorded and on a record that no longer describes one,
so the list stays a statement about the current code rather than a history of it (§7.6).

### 6.3 Motion tiers

| Tier | Definition                  | Examples                                                   | Allowed recipes                                                   |
| ---- | --------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------- |
| T0   | Structural, no animation    | input, textarea, label, kbd, table, separator, card, badge | none (colour/focus transitions only)                              |
| T1   | Micro-interaction           | button, toggle, switch, checkbox, slider, input-otp        | `feedback.press`, `state.morph`                                   |
| T2   | Overlay enter/exit          | dialog, popover, tooltip, menu, select, toast              | `enter.pop`, `exit.fade`, `popup.anchored`                        |
| T3   | Continuity / shared element | tabs, accordion, collapsible, sidebar, navigation-menu     | `layout.shared`, `layout.move`, `list.stagger`, `geometry.resize` |
| T4   | Data and feedback           | progress, chart, skeleton, spinner, carousel, calendar     | `number.roll`, `scroll.progress`, `data.transition`               |
| T5   | AI / composite              | attachment, bubble (later message, trace)                  | reuse T1–T4                                                       |

Disclosure height uses the measured, clamped `geometry.resize` recipe (including its documented
Base UI CSS form); there is no separate `disclosure.height` recipe. `data.transition` is also
defined in [animation-system.md](animation-system.md).

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

1. Source at `registry/cadence/<id>/index.tsx`, relative imports only, `data-slot` on every part.
2. Exports and props match upstream (parity check), additive props documented.
3. Registry item with `meta.tier`, `meta.batch`, `motion`, `intensity`, `complexity`, `upstream`.
4. MDX at `content/components/<id>.mdx`: the sections of
   [documentation-site-and-distribution.md](documentation-site-and-distribution.md) §2, in that order —
   `Installation` and `Usage` first, every other section flat `##`, one `##` per example. The **set** is the
   contract, not the count: examples run 2–6 and are named for what they show, `Keyboard interactions` /
   `Responsive behavior` / `Performance` appear from T1 up, `Validation and data ownership` on anything that
   takes input, and every item carries the motion contract. The frontmatter `description` is the subtitle
   and follows §6.6. A doc that omits a required section is incomplete; a doc with an extra example is not.
5. Preview module at `components/site/previews/<id>.tsx`.
6. Unit test: render, `data-slot`, keyboard path, reduced branch.
7. Payload rebuilt, `pnpm check` green, dual-theme screenshot in the PR.

### 6.6 Documentation subtitles

The subtitle is the `description` in `content/components/<id>.mdx` — mirrored in `registry.json`, rendered
under the title on the component page, and repeated on `/components` and in `llms.txt`. It is a use-case
line, not a pruned summary of the component.

**It answers one question: where would I use this?** Name the screens, tasks, or content the component
belongs to. Leave appearance, behaviour, animation, and API surface to the preview, the Motion contract,
and the API table.

| Rule              | Write                                                  | Not                                                             |
| ----------------- | ------------------------------------------------------ | --------------------------------------------------------------- |
| Name a situation  | `Destructive actions that need confirmation.`          | `A modal confirmation that interrupts the flow.`                |
| Leave motion out  | `Focused tasks such as renaming or inviting.`          | `A modal that fades and settles in.`                            |
| One short line    | `Statuses, counts, and categories.`                    | `A compact status label that animates with the page around it.` |
| No prop inventory | `Login codes, email verification, and device pairing.` | `A one-time password field with slot and caret props.`          |
| No marketing tone | `Errors, warnings, and page-level status messages.`    | `A beautiful, powerful way to show alerts.`                     |

One short sentence or fragment, ideally ≤ 12 words. Plain words, one idea: the subtitle is the reader's
next task, not a spec.

- Do not repeat the title: the reader is already on the `Button` page, so no `A button that…`.
- If the sentence would fit three different components, it is too vague; if it describes how the
  component looks or moves, it is the wrong sentence.
- The subtitle is one string in two places. Change the MDX frontmatter and `registry.json` together,
  or `registry:check` fails.
- Quality is reviewed, not automatically scored: `registry:check` compares the copies, not the tone.

## 7. Batches

Ordering is by dependency: atoms → structure → form controls → overlays → menus → disclosure →
heavy data → compositions → AI.

Each item records its batch in `meta.batch` (`B1`–`B9`), so the batch table below is the single
source for both the build order and the documentation sidebar: the site groups components one level
deep by batch and drops batches that have not shipped yet, which means a new component appears under
the right heading as soon as its registry item declares one. `registry:check` requires the field, and
`scripts/new-item.mjs --batch` writes it.

| Batch | Theme                      | Items  | Depends on | Person-days | Version | Status                         |
| ----- | -------------------------- | ------ | ---------- | ----------- | ------- | ------------------------------ |
| B0    | Removal + pilot            | —      | —          | 3           | 0.1.x   | ✅ done                        |
| B1    | Atoms                      | 11     | B0         | 9.5         | 0.2.0   | complete (§7.27)               |
| B2    | Structure and feedback     | 9      | B1         | 9           | 0.2.0   | ✅ gate complete (§7.28)       |
| B3    | Form controls              | 8      | B1         | 11.5        | 0.3.0   | ✅ gate complete (§7.29)       |
| B4    | Overlays                   | 7      | B1         | 15          | 0.3.0   | implementation done; gate open |
| B5    | Menus and selection        | 7      | B4         | 17.5        | 0.4.0   | gate open                      |
| B6    | Disclosure and collections | 6      | B1, B4     | 11.5        | 0.4.0   | complete                       |
| B7    | Heavy data and navigation  | 5      | B1, B4, B5 | 17          | 0.5.0   | ✅ done                        |
| B8    | Compositions (blocks)      | 2      | B3–B7      | 4.5         | 0.5.0   | ✅ done                        |
| B9    | AI first                   | 3      | B1         | 3.5         | 0.5.0   | ✅ done                        |
|       | **Total**                  | **58** |            | **102**     |         |                                |

### 7.0 Status discipline

A batch is the unit of completion, and this document is the only place that records it. **When a task
finishes, mark it complete here in the same change** — not in a follow-up, not in a commit message, not
only in the daily log:

1. The batch's row in the table above becomes `✅ done`. Only the batch being worked on may say `next`.
2. A verification subsection appears under §7 (`### 7.x B<n> — ✅ complete (date)`) listing what shipped,
   the commands that were run and their real result, every deviation from this plan, and what is still
   open.
3. The status line at the top of this document names the last completed batch and the next one.

A batch whose row still says `next` is not done. The plan is data, not a diary: the docs site groups the
sidebar by `meta.batch`, the release notes read §7, and the next contributor decides where to start from
these rows. Work that landed without updating them is a process defect, and the batch is not closed.

Implementation record (batch gate status is tracked separately): **B0** — eight components removed and archived, the tier/P11 checks, the scaffold, the
validation guide, and the `button` + `dialog` pilots are in place; `pnpm check` and the docs build are
green, and a real `shadcn add` install was verified (see §5.1). **B1**, **B2**, **B3** and **B4** — see
§7.1, §7.2, §7.3 and §7.4. **B5 is open**: `select` reached main on 2026-10-30 without being recorded
here, which §7.0 treats as a process defect; it is recorded in §7.6 together with the three menus and
`combobox` and `command` that followed. `toast` completes the implementation in §7.8; the earlier
components’ visual gate remains open. **B9 is complete** (§7.26): `code-block` landed ahead of the
batch (§7.5), followed by `attachment` (§7.24) and `bubble` (§7.25).

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

All six shipped: `accordion`, `collapsible`, `tabs`, `table`, `carousel`, `scroll-area`
(§7.9–7.14). Batch gate reviewed and complete (§7.14); B7 chart shipped (§7.15).

### B7 — heavy data and navigation (5)

Chart, Calendar, Navigation Menu, Resizable and Sidebar shipped (§7.15–7.19).
Batch gate complete (§7.20); B8 blocks and their joint gate are complete (§7.22–7.23).

### B8 — compositions (2, `registry:block`)

`data-table` ✅ shipped (§7.21); `date-picker` ✅ shipped (§7.22). B8 batch gate complete (§7.23).

### B9 — AI first (2 + 1 early)

`attachment` ✅ shipped (§7.24); `bubble` ✅ shipped (§7.25); joint gate closed (§7.26). `marker` and `message` moved to the backlog. `code-block` shipped ahead of the
batch (§7.5): it is the one AI component whose upstream source is already pinned, so it needed no new
prerequisite to clear.

### Batch gate

Every batch must pass: `pnpm check`, `parity:check`, manual `data-motion` full/reduced/none,
axe with zero violations, size budget, and dual-theme screenshots.

### 7.1 B1 — implementation complete (2026-10-29); gate closed in §7.27

- **Scope shipped:** `badge`, `kbd`, `separator`, `label`, `input`, `textarea`, `card`, `aspect-ratio`,
  `avatar`, `skeleton`, joining the `button` pilot. 12 components, 17 registry items, 12 docs, 12 previews.
- **Tooling:** `scripts/sync-upstream.mjs` pins shadcn's `base` (Base UI) source at a commit —
  `96da9cc` for this batch, `2026-10` — and `scripts/parity.mjs` compares exports and `data-slot`
  values against the committed `upstream/manifest.json`, so `parity:check` runs offline and is part of
  `pnpm check`. Additive exports and slots are reported, never failed (P8).
- **Checks:** `pnpm check` green — typecheck, Biome, `registry:check` (targets, payload freshness, tier
  budgets, P11), `parity:check`, 41 tests across 12 files. Every component page renders 200 from the dev
  server; `--card-spacing`, `aspect-ratio: var(--ratio)`, `animate-pulse` and `animate-none` are present
  in the compiled CSS, and the skeleton page serves `data-motion="full"` and `"none"` branches.
- **Deviations recorded, not silent:**
  - **T0 atoms carry no motion runtime.** Nine of the eleven have no animation, so they do not import
    `useCadenceMotion`, do not set `data-motion`, and depend only on `@cadence/cadence-utils`. The
    `data-motion` rule in overall-design §8.3 applies to _animated_ components; adding a provider
    dependency to a `separator` would be a runtime cost with nothing to switch off.
  - **`skeleton` is the one T4 atom** and uses the new `data.transition` recipe in its **continuous**
    form: CSS `animate-pulse`, gated to `animate-none` under `data-motion="none"`, kept under `reduced`
    because it is opacity-only. Recipe added to [animation-system.md](animation-system.md) §3 + §3.2 and
    to `lib/motion.ts` before use, as §6.3 requires.
  - **`separator` gains an additive `decorative` prop** (Base UI has no equivalent). It sets
    `role="none"` and `aria-hidden` for markup migrated from the Radix style.
  - **`card` gains upstream's `size` prop** and a single `--card-spacing` custom property, so `sm` tightens
    every part without a `group` variant per child.
  - **Visual classes follow `new-york-v4`, API follows `base`.** shadcn's Base UI sources use `cn-*` theme
    classes that only exist in its own style sheets; shipping them would make a Cadence component depend on
    a theme file the consumer does not have. Exports, props, and `data-slot` values come from `base`; the
    Tailwind utilities come from `new-york-v4`.
- **Not yet done:** dual-theme screenshots. The headless browser in this environment could not write
  screenshots, so the visual half of the batch gate is still open; everything else is verified.

### 7.2 B2 — implementation complete (2026-10-30); historical gate open

- **Scope shipped:** `alert`, `empty`, `item`, `field`, `button-group`, `input-group`, `breadcrumb`,
  `pagination`, `spinner`. 21 components, 26 registry items, 21 docs, 21 previews.
- **Tiers:** eight T0 (structure) and one T4 (`spinner`). Nothing in this batch needed a new recipe: the
  spinner reuses `data.transition` in its continuous form, exactly like `skeleton`, so
  [animation-system.md](animation-system.md) is unchanged.
- **Checks:** `pnpm check` green — typecheck, Biome, `registry:check` (targets, payload freshness, tier
  budgets, P11), `parity:check` against `96da9cc`, 79 tests across 21 files. All nine component pages
  return 200 from the dev server, each mounts its preview, and the sidebar renders the new "Structure and
  feedback" group from `meta.batch` alone.
- **Upstream pin:** `upstream/manifest.json` regenerated with `node scripts/parity.mjs --write` so the nine
  new ids carry a pinned surface (`base` API, `new-york-v4` visuals, `2026-10`).
- **Deviations recorded, not silent:**
  - **`pagination` renders anchors, not `Button`.** Upstream's Base UI source wraps an `<a>` in `Button`
    with `nativeButton={false}`, and Base UI then puts `role="button"` and `tabIndex={0}` on the anchor:
    page navigation would be announced as a row of buttons. Cadence applies `buttonVariants()` to the
    anchor instead, so the control stays a link and keeps `data-slot`, `data-variant`, `data-size`, and
    `aria-current`. This is the one place where the DOM differs from upstream on purpose.
  - **Four files suppress one Biome rule each** (`useSemanticElements`, plus `useFocusableInteractive` on
    `breadcrumb` and `useKeyWithClickEvents` on `input-group`). The roles are upstream's and they are
    deliberate: `role="group"` on the item group so a row can be an anchor through `render`, `role="group"` on the
    field/button/input wrappers, `role="link"` + `aria-current` on the current crumb. The rule and the
    reason live above the `"use client"` directive, because Biome only honours `biome-ignore-all` on the
    first line.
  - **`item` adds the `xs` size** (upstream `base` has three sizes, `new-york-v4` two) and writes
    `data-slot` / `data-variant` / `data-size` through Base UI `state`, which is how upstream emits them.
  - **Additive exports** follow B1's pattern: every part has an exported `…Props` interface, and the
    `cva` variants (`alertVariants`, `itemVariants`, `fieldVariants`, `buttonGroupVariants`,
    `inputGroupAddonVariants`, `inputGroupButtonVariants`, `emptyMediaVariants`, `itemMediaVariants`) are
    exported so a consumer can build a custom part without forking the file. `parity:check` reports them
    as additive, never as failures (P8).
  - **T0 components carry no motion runtime,** as in B1: no `useCadenceMotion`, no `data-motion`, and a
    `cadence-utils`-only dependency chain. `spinner` is the only component in the batch with
    `data-motion` and the three-mode branch.
- **Not yet done:** dual-theme screenshots, same environment limitation as B1. The visual half of the
  batch gate stays open for both batches; everything else is verified.

### 7.3 B3 — implementation complete (2026-10-30); gate closed in §7.29

- **Scope shipped:** `checkbox`, `radio-group`, `switch`, `slider`, `toggle`, `toggle-group`,
  `input-otp`, `progress`. 29 components, 34 registry items, 29 docs, 29 previews.
- **Tiers and recipes:** seven T1 and one T4. `state.morph` ×4 (`checkbox`, `radio-group`, `switch`,
  `input-otp`), `feedback.press` ×3 (`slider`, `toggle`, `toggle-group`), `data.transition` ×1
  (`progress`). No new recipe was needed, but `state.morph`'s documented scope was widened from
  "width/height/label" to "a control's own indicator", with a code example for the Base UI
  render-state pattern — added to [animation-system.md](animation-system.md) §3 and §3.1 **before** the
  components used it.
- **Checks:** `pnpm check` green — typecheck, Biome, `registry:check` (targets, payload freshness, tier
  budgets, P11), `parity:check` against `96da9cc` (29 components, additive surface reported only), 114
  tests across 29 files. All eight component pages return 200 from the dev server, each mounts its
  preview, the SSR HTML carries `data-motion="full"`, and the sidebar renders the "Form controls" group
  from `meta.batch` alone.
- **CSS proof:** the compiled stylesheet contains the Base UI state variants these components depend on
  (`data-checked`, `data-unchecked`, `data-pressed`, `data-spacing="0"`, `data-size="default"`), the
  `gap: calc(var(--spacing) * var(--gap))` rule for `toggle-group`, and both `animate-pulse` and
  `animate-none` for the indeterminate bar.
- **Upstream pin:** `upstream/manifest.json` regenerated with `node scripts/sync-upstream.mjs`, so all
  eight ids carry a pinned surface (`base` API, `new-york-v4` visuals, `2026-10`).
- **Deviations recorded, not silent:**
  - **`progress` exports all five Base UI parts**, not ny's single `Progress`, and `value` is required
    (`null` for indeterminate) because that is the `base` surface. It also overrides Base UI's inline
    `width: <value>%` with `width: 100%` + `scaleX`: a width transition would relayout the track on
    every frame, which the performance rules forbid.
  - **State comes from Base UI, not from props.** `checkbox`, `radio-group`, `switch`, `slider` and
    `progress` animate through the primitive's `render` callback, because the indicator is unmounted
    when unchecked and because uncontrolled state is invisible to the wrapper. Indicators are
    `keepMounted` so they can animate out.
  - **`switch` measures the thumb travel** (`track.clientWidth - thumb.offsetWidth`, refreshed from a
    `ResizeObserver`) rather than upstream's `translate-x-[calc(100%-2px)]`, which hard-codes the track
    border. Under `reduced` the thumb still ends in the right place and moves with `{ duration: 0 }`:
    position is state, the animation is not.
  - **`slider` forwards `aria-label` / `aria-labelledby` to every thumb's native range input.** Upstream
    leaves that input unnamed; without the forwarding the control has no accessible name, which the axe
    pass would flag in B4.
  - **`input-otp`'s caret does not blink.** Upstream's `animate-caret-blink` is a continuous loop, and
    T1 has no `data.transition` allocation in §6.3. The active slot's ring plus a static caret carry the
    same information, and the component keeps `state.morph` only. The npm dependency `input-otp`
    (1.5.0) is new to the repo.
  - **`toggle` and `toggle-group` declare `feedback.press` only.** Their pressed fill is a colour
    transition — state feedback, not motion — so declaring `state.morph` would have been a
    declared-but-unused recipe. The group has no shared indicator in upstream's markup, and a sliding
    one would move the neighbours the user is aiming at (that is `layout.move`, a T3 concern).
  - **`separator` rolls are suppressed in two files**: `useSemanticElements` on
    `input-otp`'s separator (`<hr>` is void and cannot hold the dash glyph) and `noArrayIndexKey` on the
    slider thumb (a thumb's only identity is its index in the value array). Reasons sit above the line.
  - **Test infrastructure gained two jsdom polyfills** in `tests/setup.ts`: `PointerEvent` (Base UI
    replays a pointer event after every click on checkbox/radio/switch/toggle) and
    `document.elementFromPoint` (`input-otp` probes it for the caret). Without them the suite throws
    rather than fails, which hides real regressions.
- **Not yet done:** dual-theme screenshots, same environment limitation as B1 and B2. The three motion
  modes are proven per component by unit tests (`data-motion` plus the reduced/`none` branch), and the
  browser pass covered `full` — the site has no mode switcher, so the manual reduced/none pass is the
  one gate item still open, for all three batches.

### 7.4 B4 — implementation complete (2026-10-30); historical gate open

- **Why it started as "in progress":** `dialog` shipped as the B0 pilot but declares `meta.batch: "B4"`, so
  one item of this batch was already live. Marking the row `next` would have made §7.0's rule ("a batch
  whose row still says `next` is not done") hide a shipped component.
- **Shipped:** `dialog`, `alert-dialog`, `popover`, `tooltip`, `hover-card`, `sheet`, `drawer` — all seven.
  35 components, 40 registry items, 35 docs, 35 previews, 172 tests.
- **Sheet (2026-10-30):** 10 exports and 10 `data-slot` values; the upstream manifest lists 8 exports
  because its extractor skips the two wrapper re-exports, and `parity:check` reports the two extra as
  additive.
  - **The slide is the panel's own size.** Upstream translates by a fixed `2.5rem` per side; Cadence uses
    `translate-*-full`, so the panel leaves from its own edge at every width without a distance token per
    side. The transitioned property is `translate`, not `transform`, because Tailwind v4's `translate-*`
    utilities write it individually — the same reason the dialogs transition `scale`. The e2e proves the
    panel lands flush with its edge in all three modes.
  - **Placement, close control, and footer geometry follow `new-york-v4`;** the durations are
    `duration.base` for the panel and `duration.fast` for the backdrop, not upstream's `150ms`.
- **Drawer (2026-10-30):** 11 exports and 13 `data-slot` values, on Base UI's own `Drawer`.
  - **Re-implemented, not transliterated.** Upstream's file is mostly `cn-*` theme classes plus nested-drawer
    stacking (`--stack-*`, bleed, peek). Cadence replaces the theme classes with its own utilities, keeps
    snap points (`data-snap-points`, height from `--drawer-height`), and **skips the stacking chrome**:
    nested drawers are not in the parity scope, and half a stacking implementation is worse than none.
  - **The swipe is Base UI's, so `gesture.drag` is not declared.** The sheet follows
    `--drawer-swipe-movement-*` in CSS and the backdrop fades on `--drawer-swipe-progress`; that is the
    framework's gesture engine, not a recipe Cadence authors. `registry:check` caught the declaration as
    unimplemented, which is the check doing its job. The rule now sits in
    [animation-system.md](animation-system.md) §3: a gesture the primitive owns is not a recipe.
  - **Release duration is a token.** Upstream scales the exit by velocity
    (`calc(var(--drawer-swipe-strength) * 400ms)`); Cadence uses `duration.slow`. The swipe decides _where_
    it settles; the token decides how long settling takes.
  - **Reduced:** the closed-state slide is dropped, so the sheet appears and disappears in place — but the
    drag still follows the finger, because that movement is the user's own. The unit test pins the class
    branch for exactly this case.
- **Tooltip (2026-10-30):** 33 components, 38 registry items, 33 docs, 33 previews, 158 tests. Upstream's
  four exports and four `data-slot` values exactly.
  - **The a11y gap in upstream, closed additively.** Base UI's tooltip wires neither `role="tooltip"` nor
    `aria-describedby` (a grep of the package finds no reference), so a screen reader got no announcement.
    Cadence shares one `useId()` between trigger and popup through a small context: the popup carries the
    id and `role="tooltip"`, and the trigger points at it **only while open** — a closed popup leaves the
    reference dangling, which axe reports as an invalid IDREF. Exports and slots are unchanged.
  - **The label is a description, not a name.** The trigger keeps its own `aria-label`; the docs and the
    unit test both say so, and the test asserts `toHaveAccessibleDescription`.
- **Hover card (2026-10-30):** 3 exports and 4 slots (the portal is a slot upstream), built on Base UI's
  `PreviewCard`.
  - **No role, no description, on purpose.** A card that may hold paragraphs and a button is neither the
    trigger's name nor its description; Radix's hover card does not wire it either, and reading a whole
    panel on every focus is noise. What makes it usable instead is that Base UI keeps the card open while
    focus is inside it: the test tabs from the trigger into the card's `Follow` button and asserts the
    panel is still there.
  - **Placement follows upstream:** `side` defaults to `bottom`, `alignOffset` to `4` — the opposite of
    the tooltip's `top`, because the card is a surface rather than a pointer.
- **Popover (2026-10-30):** the first anchored panel. 31 components, 36 registry items, 31 docs,
  31 previews, 146 tests. Upstream's six exports and six `data-slot` values exactly — there is no
  `PopoverAnchor` because Base UI anchors to the trigger and has no anchor part, so adding one would have
  been surface with nothing behind it.
  - **Anchored scale, and one token comes back.** The panel grows out of `--transform-origin`, which Base
    UI writes from the positioner, from `--motion-scale-in` (0.96 = `scale.in`). That token was deleted
    when nothing read it and is now read by four files, so it rejoined the three token copies;
    `registry:check` compares them, so the copies cannot drift. `dialog` and `alert-dialog` migrated from
    the literal `scale-95` to the same token, which removes the last literal scale in a shipped class list
    (AGENTS.md's "tokens only" rule).
  - **No slide, on purpose.** `new-york-v4` slides each panel in from its side (`slide-in-from-top-2` and
    three more). Cadence does not: a slide needs a distance token and one class per side, and it moves the
    edge the positioner just lined up away from the trigger. §3.1 of the animation system now shows this
    implementation instead of leaving the recipe to prose.
  - **E2E:** a `popover` block in the matrix (3 modes × 2 preferences + the reduced-only settle) and
    `/components/popover` in the axe list, both in both themes. 67 tests, green.
- **Scaffold fix (2026-10-30):** `new-item.mjs` appended `previewKey: ComponentPreview` to
  `previews/index.tsx`, a bare identifier the map does not define — the first two scaffolds each needed a
  manual repair. It now appends the `dynamic()` entry the map is built from.
- **Two test-infrastructure fixes (2026-10-30):**
  - `openComponent()` now waits for network idle after the mode assertion. In the `full` + no-preference
    cell the server HTML already says `full`, so the attribute wait could pass before React had attached
    a handler and the following click became a no-op — which is exactly how one popover cell failed.
  - `<pre>` is focusable in the MDX renderer. A usage block with a long import line scrolls
    horizontally, and axe's `scrollable-region-focusable` flags a scroll region with no
    keyboard-reachable content; the tooltip's usage example was the first block long enough to trigger
    it. Biome's `noNoninteractiveTabindex` is suppressed on that one line, with the reason inline.
- **Alert dialog (2026-10-30):** the second B4 item, built on the repaired dialog pattern. Same
  declarations (`popup.anchored` + `exit.fade`, `form: "css-transition"`), so the durations, the
  `data-starting-style` / `data-ending-style` classes and the three-mode assertions are the dialog's,
  `data-slot` for `data-slot`.
  - **`AlertDialogAction` and `AlertDialogCancel` both render Base UI's `Close`.** Upstream's Base UI port
    leaves `AlertDialogAction` as a plain `Button`, so the default usage would confirm nothing and leave the
    dialog open. Exports, `data-slot` values and props are unchanged — only the primitive behind the button
    is — and `parity:check` still reports the surface as matching.
  - **Upstream's other props are kept:** `size="default" | "sm"` on the popup, the `AlertDialogMedia` slot
    (12th export), and `variant` / `size` on both buttons. Visuals are `new-york-v4`'s, including the
    `group/alert-dialog-content` layout that the header, footer and media read.
  - **E2E:** the matrix gained an `alert-dialog` block (3 modes × 2 preferences + the reduced-only settle
    test) and the axe page list gained `/components/alert-dialog`, both in both themes. A second overlay in
    the matrix on purpose: it shares the popup CSS with `dialog` but not the markup, so a token regression
    would otherwise show up in only one file.
  - **Focus, verified rather than assumed:** focus lands on the cancel control — Base UI focuses the first
    tabbable element — not on the destructive action, so a stray Enter cancels. The unit test asserts it and
    the docs say it; the first draft claimed the popup itself took focus, and the test disproved it.
- **Contract repair (2026-10-30):** the dialog's durations moved from the literals `duration-200` / `duration-100`
  onto `--motion-duration-base` / `--motion-duration-fast`, and `data-motion="none"` now resolves those
  variables to `0ms` instead of falling into the `reduced` branch. `popup.anchored` and `exit.fade` are
  declared with `form: "css-transition"`, and `registry:check` now fails when a declared recipe has no
  implementation — which is how the gap was found.
- **Browser proof (2026-10-30):** the Playwright matrix now exists. `tests/e2e/motion-matrix.spec.ts` runs
  `button`, `dialog`, `alert-dialog`, `popover`, `tooltip`, `hover-card`, `sheet`, `drawer`, `switch` and
  `progress` across 3 modes × 2 system preferences and asserts `getComputedStyle` from a production build;
  `tests/e2e/a11y.spec.ts` runs axe in both themes. 101 tests, green.
- **Still open:** dual-theme screenshots for B1–B4. With a production build running in CI this is now a
  screenshot script, not an environment limitation.
- **Batch gate:** `pnpm check`, `parity:check`, the Playwright matrix and axe are green; dual-theme
  screenshots are the one gate item still open, for B1–B4. Batch B5 (menus and selection) is next — see the
  table in §7.
- **What the batch left behind for B5:** the popup formula B4 established — `data-starting-style` /
  `data-ending-style`, `--motion-duration-*`, `--motion-scale-in`, and a JSX branch on
  `useCadenceMotion().reduced` — is what the menu stack needs too, so B5 starts from it rather than from a
  blank file.

#### Contract drift closed (2026-10-30)

§8 carried six drifts as "fix before B4, in one change", because the six remaining overlays copy the
`dialog` pattern and would otherwise have carried the disagreement into seven files. All six are closed:

| Drift                                                                 | Resolution                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `theme.reveal` in §3 / §5 but not in `lib/motion.ts`                  | **Removed from the catalogue.** A view transition is a document-level operation with no Motion `Transition` behind it, and the only would-be consumer was the docs site's own chrome. §3 now says so in one sentence; `theme-toggle.tsx` is unchanged.                                                                                         |
| `variants(recipe)` documented, absent from the provider               | **Removed from §5 and §3.** No shipped component calls it, and a public method with no consumer is a compatibility promise with nothing behind it. `transition()`, `distance`, `spring`, and the two mode flags are the API, and §5's snippet now matches `provider.tsx`.                                                                      |
| Three copies of the motion tokens, all different                      | **One parsed contract.** `app/globals.css`, the `cadence-theme` item, and §2.3 declare the same five scopes: `theme` (`--ease-cadence-*`), `root`, `reduced`, `none`, and `system-reduced` (durations only). `scripts/motion-tokens.mjs` parses all three; `registry:check` fails on a missing variable, an extra scope, or a different value. |
| `--motion-distance-*` / `--motion-intensity` shipped, read by nothing | **Removed, not wired.** Wiring them meant a second source of truth next to `lib/motion.ts` plus a DOM read in the provider to resolve them; the JS distances stay constants, and the CSS side keeps only what a CSS-only popup actually reads.                                                                                                 |
| `spinner`'s `animate-spin` is a transform loop §3.2 did not allow     | **§3.2 gained the single-element rotation exception**, with five conditions (one element, rotation only, the rotation _is_ the information, still gated by `data-motion`, nothing larger than a glyph). Anything that moves content — a marquee, a sliding shimmer — stays rejected.                                                           |
| `button` dropped upstream's `group/button` and `select-none`          | **Both restored** with a comment naming upstream, and a unit test asserts them: `parity:check` compares exports and `data-slot` only, so a dropped class is invisible to it.                                                                                                                                                                   |

Two more phantoms surfaced while making the copies comparable, and are gone: §2.2 listed an
`ease.spring` tuple that `lib/motion.ts` never had, and §2.3 listed `--motion-scale-in` and
`--animate-shimmer`, which no file declared. The `prefers-reduced-motion` block now mirrors the
`reduced` durations instead of zeroing a distance token nothing read, so a CSS-only popup in an app
with no provider honours the OS setting.

- **Checks:** `pnpm check` green — typecheck, Biome, `registry:check`, `parity:check` against
  `96da9cc`, 132 tests across 31 files. `registry:check` also compares the §3 catalogue table, the §5
  `Recipe` union, and `lib/motion.ts` (17 recipes each), and the three token copies (5 scopes each),
  so both drift classes that survived a review are now caught by CI. Both comparisons were
  negative-tested by hand: a changed value and a deleted variable each fail the check.
- **Deviation from the plan's wording:** "byte-for-byte equivalent" became "the same parsed
  `scope → variable → value` map". Three formats (CSS file, registry JSON, markdown fence) cannot be
  textually identical, and a byte comparison would have to normalise them first anyway.
- **Found and recorded, not fixed:** a `data-motion="full"` element nested inside a `reduced` or `none`
  subtree inherits the parent's shortened or zeroed durations, because CSS variables cascade and no
  `[data-motion="full"]` block restates the authored clock. JS transitions are unaffected —
  `transitionFor()` reads the mode, not the variables — so only a CSS-only popup inside an
  opted-back-in preview would look wrong. Fixing it needs a `full` block in all three copies that still
  defers to the OS media query. The anchored panels did not need a shared module after all — the popup
  formula is repeated per file, like `dialog` and `alert-dialog` — so this stays open as a token-layer
  decision, not a popup one.
- **Browser proof, re-run 2026-10-30 (numbers as of that change):** `pnpm build` produced all 40 pages and the compiled stylesheet
  carries `[data-motion=reduced]`, `[data-motion=none]` and the reduced-duration media query, with no
  `--motion-distance-*` or `--motion-intensity` left anywhere. `playwright test` was 49/49. This
  environment has no Playwright-downloaded Chromium, so the run used `PLAYWRIGHT_CHANNEL=msedge`, the
  fallback the config documents; the suite is not Chromium-specific.
- **E2E defect found by that run:** `openComponent()` asserted the mode the URL _asked for_ rather than
  the mode the provider _resolves_, so the `?motion=full` cell under `prefers-reduced-motion: reduce`
  could never pass — the one cell where the two differ. The helper now takes the resolved mode, and
  every matrix call site passes it. The 49-green claim in the bullet above is only true because of
  that fix.

### 7.5 `code-block` — B9, shipped early (2026-10-31)

Not a batch: one item of B9, landed ahead of `attachment` and `bubble` because it is the only AI component
whose upstream source is already in the pin (`apps/v4/registry/bases/base/ui/code-block.tsx`, 8 exports,
10 `data-slot` values) and it needs no streaming model to be correct.

- **Surface:** upstream's eight exports (`CodeBlock`, `CodeBlockActions`, `CodeBlockContent`,
  `CodeBlockCopyButton`, `CodeBlockFooter`, `CodeBlockHeader`, `CodeBlockLine`, `CodeBlockTitle`) and ten
  slots exactly, plus four additive exports — the fold control `CodeBlockExpandButton` and the switcher
  `CodeBlockTabs` / `CodeBlockTab` / `CodeBlockPanel`. Additive props: `language` / `maxLines` on the block,
  `defaultTab` / `tab` / `onTabChange` for the selection, and `values` on the copy button. Additive slots:
  `code-block-viewport`, `code-block-tabs`, `code-block-tab`, `code-block-tab-indicator`, `code-block-panel`,
  `code-block-expand-button`. 37 components, 43 registry items (the highlighter is the 43rd), 37 docs,
  37 previews.
- **Highlighting shipped after the surface** (2026-10-31, same item): upstream splits it into a
  `useHighlightedCode` hook backed by Shiki, and so does this item — `code-highlight` is a `registry:lib`
  dependency holding `highlight.tsx` (the engine) and `use-highlighted-code.tsx` (the hook). Three
  decisions made it a separate item rather than three files in `code-block`:
  - **The dependency is the unit.** A consumer who only wants the surface still installs the adapter (the
    registry has no optional dependencies), but the _runtime_ cost stays opt-in: the hook imports the
    engine with a dynamic `import()`, so a block with no `language` never loads Shiki. `registry:check`'s
    per-file `data-slot` rule also pushed the split — the engine renders no markup and owns no slot.
  - **The JavaScript regex engine, not WASM.** A copied registry item cannot ship a `.wasm` asset and a
    runtime path to it without breaking somewhere; `createJavaScriptRegexEngine({ forgiving: true })` gives
    up a little speed and removes the asset question entirely.
  - **Two themes, colour as a CSS variable.** `defaultColor: false` makes tokens carry `--shiki-light` /
    `--shiki-dark`, and the span's class reads whichever the page sets. Dark mode re-colours without
    re-tokenizing, and nothing new was added to the theme item: the palette is Shiki's, swappable in one
    file rather than spread over `globals.css`.
  - **Streaming.** The hook keeps the grammar state after the last complete line and tokenizes only what
    arrived, so a chunk costs one line, not the file. `tests/components/code-highlight.test.tsx` proves it
    by identity: a finished line's node object survives the next chunk.
  - **First paint is plain.** The highlighter is a chunk, so SSR HTML and the first client frame are
    uncoloured; `highlightCode()` is exported for a Server Component that would rather not flash.
- **The fold is `geometry.resize`, measured, and cut on a line boundary.** `maxLines` + `overflowing` are
  computed in a `ResizeObserver` from `scrollHeight` and the computed `line-height`, so wrapped lines and a
  retuned `leading-*` both move the fold. Two details are worth recording because the first draft got them
  wrong:
  - The first measurement is written to the node before Motion takes the property over (`height.jump()` +
    an inline write). Motion applies a motion value on the _next_ frame, so without it a folded block
    paints at full height once, which is a layout shift the reader sees.
  - The fold height is `paddingTop + floor(lineHeight × maxLines)` — **no bottom padding**. Including it
    showed the top sliver of the next line instead of ending on a line boundary; the light-theme screenshot
    is what caught it.
- **Floating actions are `data.transition`, and a touch screen is not a hover.** With no header,
  `CodeBlockActions` floats and fades in on hover or focus. `(hover: hover)` is read through
  `useSyncExternalStore` (server snapshot `true`), so a device that cannot hover keeps the actions visible
  instead of hiding a control it cannot summon. This is the only place the component re-renders on pointer
  movement, which is why the reveal lives in its own context: the code subtree does not re-render with it.
- **Copy and chevron are `state.morph`.** The copy glyph is two stacked spans, so the state change cannot
  resize the button mid-press; under `reduced` the cross-fade stays and the scale is dropped; the chevron
  flips with `{ duration: 0 }` under `reduced` because its direction is state, not decoration.
- **`wrap` had to relax `min-w-max`.** Upstream keeps the code box `min-w-max` so a non-wrapping block
  scrolls; with `wrap` that same class prevents wrapping and the output clips at the right edge. Found in
  the tool-output example of the preview.
- **The switcher is a fifth recipe, `layout.shared`, and one pill.** `CodeBlockTabs` / `CodeBlockTab` /
  `CodeBlockPanel` answer the case upstream leaves to the consumer: one snippet in several right forms — an
  install per package manager, a source file and its output. Three decisions are worth recording:
  - **The selection lives on `CodeBlock`, not on the tab list.** The header's copy button has to follow it,
    and a control outside the tab list cannot reach its state. `CodeBlockCopyButton` therefore takes
    `values` (one string per tab) as well as `value`, and copies whichever variant is showing.
  - **Only the selected tab renders a pill, with a shared `layoutId`.** Motion matches the two, so the pill
    travels to the pressed tab and retargets mid-flight instead of a second pill cross-fading. Under
    `reduced` the `layoutId` is dropped entirely: which tab is current is information, the travel is not.
  - **Panels are hidden, not unmounted.** A tab switch is a look at what is already there, so it cannot
    lose the reader's scroll position, and `hidden` takes the inactive source out of the tab order. The
    height changes instantly rather than animating — the size of the block is information, and the only
    layout animation here stays the fold.
  - **One `pre` per panel, and one id per `pre`.** The block's `contentId` cannot be reused inside three
    panels, so `partIds()` builds `…-tab` / `…-panel` / `…-content` from it in one place;
    `CodeBlockExpandButton` points `aria-controls` at the shown panel when the block has tabs.
- **Docs-site install fences became the switcher, without touching the markdown's meaning.**
  `content/components/*.mdx` marks its Installation fence ` ```install ` instead of ` ```bash `; the command
  inside is still the runnable `npx shadcn@latest add …`, so the `/r/<id>.md` payload an agent reads is
  unchanged in substance. `components/site/package-manager.ts` reads the registry spec out of it and restates it for
  pnpm / npm / yarn (`pnpm dlx`, `npx`, `yarn dlx`), keeping whatever pin the fence wrote; a fence that does
  not parse falls back to a terminal block. `tests/site/package-manager.test.tsx` holds the content invariant that
  every component doc uses the `install` fence. (The module later widened to `package-manager` fences and one
  remembered selection; see §2.3 of the docs-site document.)
- **Checks:** `pnpm check` green — typecheck, Biome, `registry:check` (targets, payload freshness, T5 budget,
  P11), `parity:check` against `96da9cc7f1aa`, 242 unit tests. `playwright test` with
  `PLAYWRIGHT_CHANNEL=msedge` cover a `code-block` block in the motion matrix (3 modes × 2 preferences, fold
  and tab pill) and `/components/code-block` in the axe list, both themes, zero violations. `next build`
  produced 48 pages.
- **Dev-server note for the next contributor:** `next dev` in this sandbox cannot hydrate (its HMR socket is
  rejected, one client chunk 404s, and the document entrance stays at `opacity: 0`), so the component looked
  broken while the production build was correct. Verify against `next build` + `next start`, which is what
  the e2e config already does.
- **Still open:** `attachment`, `bubble`; ANSI colours for terminal output (Shiki ships no ANSI grammar —
  escape codes render as text); streaming-specific motion (new code fading in place) — none of it blocks the
  item.

### 7.6 B5 — in progress (2026-10-31, updated 2026-11-01)

Historical checkpoint before toast: six of seven items shipped. §7.8 supersedes this checkpoint;
the batch row now says `gate open` because the earlier components still lack visual evidence.

- **Scope shipped:** `select` (2026-10-30), `dropdown-menu`, `context-menu`, `menubar` (2026-10-31),
  `combobox` (2026-11-01). 41 components, 47 registry items, 41 docs, 42 previews, 290 unit tests,
  154 browser tests.
- **`select` was shipped unrecorded.** It reached `main` on 2026-10-30 with `meta.batch: "B5"`, and
  neither this table nor §7 mentioned it — the exact failure §7.0 describes, caught while choosing the
  next batch. It is included in the counts above and in the batch's verification, so the row now matches
  the branch.
- **Tiers and recipes:** four T2 menus plus `select` (T3) and `combobox` (T2). No new recipe was needed: a
  menu is the popover's panel anchored to a trigger (or to a pointer), a check mark scaling in is
  `state.morph` — which B3 already widened to "a control's own indicator" — and `combobox` reuses the same
  three on a field.
- **Checks:** `pnpm check` green — typecheck, Biome, `registry:check` (targets, payload freshness, tier
  budgets, P11), `parity:check` against `96da9cc`, 290 unit tests across 48 files. `playwright test`
  (154 tests, `PLAYWRIGHT_CHANNEL=msedge --workers=3`) green against a production build: the motion matrix
  gained `dropdown-menu`, `context-menu`, `menubar` and `combobox` blocks (3 modes × 2 preferences, plus the
  reduced-only settle for the dropdown and the combobox), and the axe page list gained all four pages in
  both themes. **The worker count is not incidental:** at the default 8 workers Edge crashes
  (`code=3221226505`) and 12 tests fail on timeouts and lost pages; the same suite is 154/154 at 3. A
  failure list full of `Target page, context or browser has been closed` is the harness, not a component.
- **Tooling, the prerequisite §8 named for this batch:**
  - **The props surface is compared now.** `extractProps()` in `scripts/upstream-surface.mjs` reads each
    part's destructured props and their literal defaults; `upstream/manifest.json` carries them per item;
    `parity:check` fails on a prop upstream declares and we do not, and on a default that moved. Extra
    props are reported as additive, like extra exports. Both failure paths were negative-tested by hand
    (a changed `sideOffset` default, and a recorded deviation that no longer differs).
  - **`meta.parity.props` records a deliberate difference.** The check found one real conflict on its
    first run: `base` defaults `ToggleGroup.spacing` to `2`, `new-york-v4` to `0`, and Cadence follows
    the visuals. The entry names the prop and carries the reason; `parity:check` fails when a recorded
    deviation stops being true, so the list cannot rot into fiction.
  - **`registry:check` follows `registryDependencies` for the implementation half of the motion
    contract.** `menubar` declares the three recipes and implements none of them — the panel and the
    check mark are `dropdown-menu`'s code, installed through a dependency. Declaration and the
    undeclared-call search stay per item; only "is there an implementation" looks one level down.
  - **A build can run beside a dev server again.** `next.config.ts` reads `CADENCE_DIST_DIR`, because a
    build deletes the `.next` a running `next dev` is serving; `.next-*` is gitignored and ignored by
    Biome. This is what made the browser pass possible in this environment.
  - **The scaffold writes the path the registry points at (2026-11-01).** `new-item.mjs` created
    `registry/cadence/<id>/<id>.tsx` while its registry item pointed at `<id>/index.tsx`, so every scaffold
    needed a manual rename before `registry:build` would pass. It now writes `index.tsx`, proved by
    scaffolding a throwaway item and deleting it. Two side effects of the same change are worth knowing:
    a `CADENCE_DIST_DIR` build appends `.next-*/types` to `tsconfig.json`'s `include` (revert that file
    before committing), and `biome check --write` must run after any script that rewrites JSON.
- **Deviations recorded, not silent:**
  - **`DropdownMenuLabel` / `ContextMenuLabel` are not always a `GroupLabel`.** Base UI 1.9 throws
    (`MenuGroupContext is missing`) when `Menu.GroupLabel` renders outside `Menu.Group`, and shadcn's
    Base UI source renders the label at the top level of a menu. The label therefore reads a small
    context the `Group` wrapper provides: inside a group it is the group's own label (and its
    `aria-labelledby`), outside one it is a plain caption element with the same slot — which is what
    `new-york-v4` renders. Exports and slots are unchanged.
  - **`DropdownMenuSub` renders no element.** It is `Menu.SubmenuRoot`, a context provider, so
    `data-slot="dropdown-menu-sub"` exists in the source (and in `parity:check`) but never in the DOM.
    Upstream has the same shape; the unit test says so where it would otherwise look like a missing slot.
  - **The menubar owns no motion of its own.** Its root carries `data-motion` and no transition: moving
    between open menus replaces one panel with another, and there is no shared element to animate, so a
    sliding highlight on the bar would be decoration (P9).
  - **Item classes are duplicated across the three menus, on purpose.** A shared `lib/menu-parts` item
    would add a registry dependency to three components and drift from upstream's one-file-per-menu
    layout; the e2e matrix therefore asserts the context menu's panel separately, so a token regression
    in its copy cannot hide behind the dropdown's.
  - **`dropdown-menu` items run on `onClick`.** Base UI's menu item has no `onSelect`, so the docs say
    `onClick` and the "does the handler fire" test pins it.
  - **`breadcrumb` gained `className`.** The new prop comparison found the root spreading props without
    naming `className`; the class is now merged with `cn()` like every other part. No visual change.
  - **`toggle-group` is the first recorded deviation** (see the tooling bullet): `spacing` defaults to
    `0`, not the `2` the Base UI API declares, because the visual style is `new-york-v4`.
  - **Two pre-existing e2e failures repaired.** The `button` block located a button named "Button" and
    the `switch` block a switch named "Deploy alerts", neither of which the current previews render —
    both had been failing since the previews were rewritten. They now address the specimen by slot, so a
    copy change cannot break the matrix again.
  - **`combobox` is upstream's file, minus the theme classes.** `ComboboxPrimitive.Value` is a pass-through,
    and `ComboboxClear` stays internal: upstream defines it and does not export it, so the undo affordance
    belongs to `ComboboxInput`'s layout rather than to the public surface. All 16 upstream exports and all
    16 upstream slots are present; `parity:check` reports exactly one addition, the
    `combobox-item-indicator` slot that carries the tick's spring.
  - **The addon's chevron reports `input-group-button`, not `combobox-trigger`.** The button is composed the
    way upstream composes it — the input-group frame supplies the chrome through `render`, the trigger
    supplies the behaviour — and Base UI's prop merge keeps the wrapper's `data-slot`. Both names exist in
    the source (so `parity:check` sees both), a hand-placed `ComboboxTrigger` reports its own slot in the
    DOM, and the unit test pins both facts instead of assuming one.
  - **Both icon-only buttons gained a default `aria-label`.** Base UI names neither the trigger nor the
    clear control, and an icon-only button with no accessible name is a `button-name` violation — the axe
    pass would have failed on the page. `ComboboxChip` gives its remove button `Remove <chip>` when the chip
    is a string. The labels sit before `{...props}`, so a caller can rename them; nothing was renamed or
    removed.
  - **The filter does not animate.** Typing replaces the list on every keystroke; `list.stagger` or
    `layout.move` there would move rows under a moving caret, which is decoration rather than causality (P9).
    The component declares the panel's two recipes and the tick, and nothing else.
  - **The popup is a flex column.** Upstream sizes the panel and the list separately; here the panel caps at
    `--available-height` and the list takes the rest (`min-h-0 flex-1 overflow-y-auto`), so the empty state
    is a sibling of the list rather than a replacement for the whole panel and a long list scrolls inside
    the panel instead of past it.
  - **The visual classes are `new-york-v4`'s.** The Base UI source styles the family with `cn-combobox-*`
    theme classes that only exist in shadcn's own style sheet; shipping them would make the component depend
    on a file the consumer does not have. Same rule as B1: API and slots from `base`, utilities from
    `new-york-v4`.
  - **The clear glyph was 24px until a screenshot caught it.** `inputGroupButtonVariants({ size: "icon-xs" })`
    sizes the box but not the glyph, and the clear control is not a `Button`, so it inherited no `[&_svg]`
    size: a 24px X in a 24px box. Both icon controls now declare the glyph size themselves, which is also
    what makes a hand-placed `ComboboxTrigger` render correctly without a `Button` behind it. jsdom and axe
    both pass either way — this is the class the browser pass exists to catch, and it did.
- **At this checkpoint:** `toast` remained (`command` completed in §7.7; toast now completes in §7.8).
  Comprehensive dual-theme screenshots for B1–B5 were still not generated: the browser pass now runs here,
  but nothing writes the images, so the visual half
  of the batch gate remains a script that does not exist. `combobox` was checked by hand in both themes
  while it was written (closed and open, light and dark), which is how the clear glyph above was found;
  those images live in `.cache`, not in the repo.

### 7.7 `command` — B5 component complete (2026-11-01)

- **Shipped:** nine upstream exports and nine slots, pinned to `96da9cc7f1aa` without moving the
  upstream ref. `cmdk` 1.1.1 provides search, ranking, highlight, disabled rows, and keyboard selection;
  Base UI `Dialog` supplies the portal, focus trap, and dismissal. The palette keeps an explicit
  `Command` child, matching the pinned Base UI source, and `showCloseButton` defaults to `false`.
  42 components, 48 registry items, 42 docs, 43 previews.
- **Motion conformance:** declares only `popup.anchored` and `exit.fade`, CSS-transition form,
  implemented by the direct `@cadence/dialog` dependency. Full mode fades and scales the panel;
  reduced retains opacity and removes the scale classes; none resolves panel and backdrop durations
  to zero. The inline command, filtering, and highlight have no motion. No new recipe or token.
- **Intentional implementation details:** the hidden title/description are inside `DialogContent`,
  where the portalled dialog can reference them. `CommandInput` composes cmdk's native `asChild`
  escape hatch with `InputGroupInput`; Base UI parts retain `render`. Native and custom input
  composition, class merging, filtering by keywords, empty recovery, and disabled keyboard skipping
  have unit coverage. cmdk's `data-checked` glyph is retained separately from its highlight.
- **Accessibility repair:** axe found cmdk's `role="separator"` inside the listbox as a forbidden
  child. The divider now defaults to `aria-hidden="true"` (decoration), retaining its slot, styling,
  and forwarded props. No axe rules were disabled. Both inline and open dialog scans pass in both themes.
- **Verification:** `pnpm registry:build`, `pnpm check` (313 tests across 51 files), and production
  `pnpm build` (53 static pages) pass. The isolated build uses `CADENCE_DIST_DIR=.next-command`;
  its generated tsconfig includes are reverted. `tests/e2e/command.spec.ts` passes 8/8 on installed
  Edge (`PLAYWRIGHT_CHANNEL=msedge`, port 3111, two workers): 3 modes × 2 system preferences,
  real computed panel/backdrop durations and sampled scale, input focus, empty filtering, Escape
  focus restoration, keyboard selection, and axe in light/dark. Four screenshots (inline/dialog ×
  light/dark) are generated under `test-results/command-command-*/` and visually inspected.
- **Next at this checkpoint:** `toast` (now §7.8), then B6 onward in the batch table.
  Older batches' missing screenshots remain open; this component's screenshot test does not close that historical gate.

### 7.8 `toast` — B5 implementation complete, visual gate open (2026-11-01)

- **Shipped:** all 13 pinned upstream exports and nine slots, including compound parts, `Toaster`,
  shared `toast`, `createToastManager`, and `useToastManager`. No upstream pin change or new dependency.
  43 components, 49 registry items, 43 docs, 44 previews. Pinned Base UI source exists;
  `new-york-v4/toast.tsx` is a cached 404, so semantic popover tokens and Button chrome are used.
- **Motion conformance:** `popup.anchored` + `exit.fade`, CSS transition form. Full fades and scales
  from the shared scale token, reduced keeps opacity and removes scale/swipe transforms, none resolves
  to zero duration. Base UI owns the swipe variables and lifecycle, as with Drawer. No new recipe.
  Stack bottom offsets and natural content heights update instantly: T2 never animates geometry.
  Notifications stay expanded rather than reproducing upstream's collapsed height/scale animation.
  The loading glyph stays static; no rotation or continuous recipe is introduced.
- **Ownership and API:** manager exports remain Base UI aliases for parity. Cadence adds no promise
  orchestration, request handling, or validation; docs and preview use caller-owned add/update/close.
  Provider defaults and Button render defaults remain pinned. Action activation preserves the toast
  unless the caller closes it; title/description announce via Base UI's notification region.
- **Verification:** `pnpm registry:build` and `pnpm check` pass (318 tests in 52 files), including
  registry/parity checks, mode branches, slot coverage, updates, manager isolation, action keyboard
  activation, explicit close, and removal callbacks. Production build passes with 54 static pages
  using `CADENCE_DIST_DIR=.next-toast`; generated tsconfig changes are reverted.
  Toast browser tests pass 8/8 on installed Edge, port 3112, two workers: 3 modes × 2 preferences,
  computed duration and sampled scale, no reduced transform or geometry transition, arrival focus,
  F6/Escape, stack bounds, action state, dismissal, and light/dark axe with no disabled rules.
  Both screenshots are generated and visually inspected, preserved locally at `.cache/toast-proof/`.
  The complete existing browser suite also passes: 170/170 in 2.6 minutes with the same isolated build
  and two-worker Edge configuration. This includes existing menus, command, overlays, site navigation,
  and the motion matrix; it does not invent coverage for untested historical visual states.
- **Batch status:** all seven B5 implementations are complete. B5 stays `gate open` because the older
  select/menu visual evidence described in §7.6 has not been regenerated or reviewed here. This
  toast proof does not close historical B1–B5 visual gates. B6 starts with `accordion`; B7–B9 and
  §8 carried open work remain scheduled/open. No claim of overall parity completion.

### 7.9 B6 accordion shipped (2026-11-01)

- **Scope:** `accordion` is the first of six B6 items. All four pinned exports and five slots are
  preserved, plus header and content-inner slots. 44 components, 50 items, 44 docs, 45 previews.
  The upstream pin stays `96da9cc7f1aa`; only accordion's fixed surface is added to the manifest.
- **Motion conformance:** `geometry.resize` in the explicitly documented CSS transition form,
  measured from natural inner content by layout effect and ResizeObserver, clamped to zero.
  Full uses `duration.slow` / `ease.out`; native reversal preserves current position rather than
  spring velocity. Reduced and none both remove height transitions. Icons swap without motion.
  Base UI owns mount/unmount, `keepMounted`, custom `render`/refs, and hidden-until-found behavior.
  The motion manifest checker now recognises this form only with measured/clamped height, lifecycle
  selectors, token timing, and the instant mode branch; six regression assertions cover that gate.
- **API and keyboard:** Base UI 1.6 keeps array values, single/multiple selection, disabled state,
  cancellation details, and native Tab/Shift+Tab plus Enter/Space. Its `orientation` and `loopFocus`
  props are deprecated and no longer move focus; Cadence forwards them without inventing navigation.
- **Verification:** `pnpm check` passes: 331 tests in 54 files, typecheck, lint (only the existing
  item preview image warning), registry/parity checks, tier budgets, and P11. Accordion has seven
  unit tests. Production build passes with 55 static pages in isolated `.next-accordion`; generated
  tsconfig changes are reverted. Eight accordion Edge browser tests pass: three modes × two system
  preferences, computed height duration and absent transform, content resize, both mid-flight
  reversals, final unmount, keyboard/focus, narrow viewport, light/dark axe and inspected screenshots.
  The full Edge browser suite also passes 178/178 in 3.0 minutes with two workers on port 3113.
  Screenshots are preserved locally in `.cache/accordion-proof/`; these prove accordion only.
- **Remaining:** B6 is 1/6 shipped; `collapsible` is next, followed by tabs, table, carousel, scroll-area.
  Historical B1–B5 visual gates remain open as already recorded. B7–B9 and §8 carried work remain
  scheduled; this is not overall parity completion.

### 7.10 B6 collapsible shipped (2026-11-01)

- **Scope:** all three pinned exports and three slots, plus a structural content-inner slot.
  45 components, 51 registry items, 45 docs, 46 previews. Only collapsible's surface is added to
  the fixed manifest; upstream pin remains `96da9cc7f1aa`. No new dependency or shared runtime change.
  Both upstream layers are unstyled; the preview composes Button and caller-owned boolean state.
- **Motion conformance:** declared, implemented and documented `geometry.resize` CSS form from §3.1.
  Natural inner height is measured after commit and through ResizeObserver, clamped at zero; full
  transitions height with `duration.slow` / `ease.out`. Both reversal directions retain current
  position, without claiming spring velocity. Reduced and none remove height transitions and have
  no transform. Every animated panel reads the reduced branch and emits `data-motion`.
- **API:** Root and Trigger pass through primitive props; Content classes (including state callbacks),
  styles, custom render and ref stay on the outer panel. Base UI owns lifecycle, cancellation,
  disabled state, keepMounted and hiddenUntilFound. Outer padding/borders are supported, with the
  native CSS minimum during closing until the panel hides/unmounts. No renamed props, defaults or
  validation ownership.
- **Verification:** `pnpm check` passes (338 tests in 55 files), including seven collapsible unit tests,
  typecheck, lint (only existing item image warning), registry/parity, budgets and P11. Production
  build passes with 56 pages in `.next-collapsible`; generated tsconfig changes are reverted.
  Targeted Edge browser tests pass 8/8 on port 3114 with two workers: three modes × two system
  preferences, computed duration/transform, measured growth, close/open/close reversal and continuous
  position, unmount, keyboard/focus, responsive width, and axe in both themes without disabled rules.
  The first browser run caught a label-dependent test locator; the stable slot locator passes.
  Both final theme screenshots were inspected and preserved in `.cache/collapsible-proof/`.
  No shared code changed, so the full browser suite was not repeated for this component.
- **Box-model follow-up (2026-11-01):** isolated Edge reproduced 34px of clipped natural content
  with outer `p-4 border` under Preflight border-box (138px target omitted 32px padding + 2px borders).
  Content-box was unaffected. Corrected border-box targets include computed outer vertical edges;
  content-box targets retain inner natural height. Inner border-box ResizeObserver plus outer attribute
  and viewport listeners remeasure without observing animated size or animating decoration. Scheme
  and consumer docs now record the native closing floor; an asymmetric 62px padding/border case
  reaches that floor, then Base UI unmounts normally. Preview exercises real outer `className`.
  Eleven Edge tests pass on isolated `.next-collapsible-box`, port 3116, two workers: all previous
  mode/preference, interruption, accessibility/theme checks plus natural auto-height comparisons,
  both box models, vertical-only inline changes, dynamic content, wrapping and close/reopen lifecycle.
  Final `pnpm check` passes 339 tests in 55 files (eight collapsible tests); the added test preserves
  state-callback classes/styles on a persistent outer panel. Dual-theme screenshots were inspected
  and preserved in `.cache/collapsible-box-proof/`. No shared runtime changes or upstream pin movement.
- **Remaining:** B6 is 2/6 shipped; tabs, table, carousel and scroll-area remain in order.
  Historical B1–B5 visual gates, B7–B9, and §8 carried work stay open. This completes only collapsible.

### 7.11 B6 tabs — shipped (2026-11-01)

- **Surface:** five fixed exports (including `tabsListVariants`), four upstream slots, plus decorative
  `tabs-indicator`. Base UI API and new-york-v4 default/line styling remain pinned at `96da9cc7f1aa`.
  The root forwards orientation to the primitive, including vertical keyboard semantics. All primitive
  props, manual activation defaults, state callback classes/styles, render and refs are preserved.
- **Ownership:** Base UI owns controlled/uncontrolled values, null selection, cancellation, disabled
  fallback, roving focus and panel lifecycle. Disabled tabs remain arrow-focusable without activation,
  as in Base UI 1.6.0. Panel keepMounted retains state; no panel height or entrance animation is added.
- **Motion audit:** declared = implemented = documented `layout.shared`. Each List has a unique
  LayoutGroup; the active span uses FLIP and the token's physics-defined spring with velocity continuity.
  Reduced and none render a static aria-hidden span with no layoutId, transform or animation. Every
  animated indicator reads the reduced branch and emits data-motion. No motion literals, timers,
  shared runtime changes or new dependencies. The scheme clarifies list isolation and static fallback.
- **Proof:** isolated `.next-tabs` production build passed (57 pages). Full `pnpm check` passed;
  tabs has ten unit tests covering all parts' render/ref, callbacks, controlled requests/cancellation,
  null, uncontrolled disabled fallback, persistence/unmount, manual/automatic activation, both axes,
  RTL, no-loop focus and three mode branches. Edge targeted suite passed 8/8 on port 3117, two workers:
  three modes × two system preferences, both orientations and variants, interrupted reversals,
  final alignment, parent-only resize, controlled external selection, disabled focus, keyboard and
  independent lists. Dual-theme axe has zero violations with no disabled rules; responsive overflow
  and six screenshots (initial/selected/vertical × light/dark) passed visual inspection. First browser
  run exposed a test's missing transparent-border inset in line alignment; corrected assertion passed.
- **Remaining:** B6 is 3/6 shipped. Next table, then carousel and scroll-area. B7/B8/B9 and §8 remain
  scheduled/open. Historical B1–B5 visual gates (including earlier B5 selection/menu evidence) remain
  open. This component proof does not close those gates or establish overall parity completion.

### 7.12 B6 table — shipped (2026-11-01)

- **Surface:** eight fixed exports and nine slots from the Base UI source at `96da9cc7f1aa`;
  new-york-v4 utility classes retained, including row hover/selection/expanded feedback and checkbox
  alignment. Only table was appended to the manifest using the surface extractors; the pin is unchanged.
  Native table/caption/thead/tbody/tfoot/tr/th/td props and refs pass through. Table className/ref target
  the table, with the fixed upstream `relative w-full overflow-x-auto` container outside it.
- **Motion audit:** T0, declared = implemented = documented empty recipe set. No Motion, Base UI or
  Provider dependency, no hook, mode attribute, layout measurement, entrance or reorder animation.
  Full/reduced/none share static markup. Upstream colour feedback and static checkbox alignment are
  retained; neither is authored motion. No animation-system scheme change was needed.
- **Proof:** `pnpm check` passes 355 tests across 57 files (six table tests), typecheck, lint,
  registry freshness/budgets/P11 and pinned parity. Tests cover all eight refs, native tags/props,
  caller classes/styles, events, caller selection, Tab/Shift+Tab through native controls, and all modes.
  Isolated `.next-table` production build passes (58 pages). Edge targeted suite passes 8/8 on port
  3118 with two workers: three modes × two system preferences, native semantics and computed styles,
  no page errors, desktop/390px overflow, caller-sized wide table, actual arrow-key scrolling, and
  dual-theme full-page axe (WCAG2A/2AA/2.1AA) with zero violations and no disabled rules.
  Six screenshots (desktop/natural narrow/scrolled wide table × light/dark) were inspected and saved
  under `.cache/table-proof/`.
- **Browser findings fixed:** the preview Grid's intrinsic minimum width initially clipped the table
  outside its own scroll container; the table preview root now uses `min-w-0`. Narrow-screen axe
  exposed missing keyboard access to the specimen's scroll area; the preview and Usage example use
  native table `tabIndex={0}` plus a visible focus ring, with browser-proven ancestor scrolling.
  API and static motion tables use two columns so docs remain readable without inaccessible overflow.
  These are caller/preview/docs choices; no upstream component API or wrapper behaviour changed.
- **Remaining:** B6 is 4/6 shipped; carousel is next, then scroll-area. B7/B8/B9 and §8 carried work
  remain scheduled/open. Historical B1–B5 visual gates, including earlier B5 select/menu evidence,
  remain open. This closes table only and does not establish overall parity completion.

### 7.13 B6 carousel — shipped (2026-11-01)

- **Surface:** seven fixed exports (including CarouselApi and useCarousel), five upstream slots.
  Exact Base and new-york-v4 sources cached at the unchanged `96da9cc7f1aa` pin; only carousel
  appended with the shared upstream surface extractors. Native refs/styles/classes, Button render
  and event overrides, opts, plugins and setApi remain available. Base icon-sm default retained
  with the visual source's round size-8 controls. Content props/ref still target the inner track,
  while its fixed outer viewport owns the carousel-content slot/ref. ArrowLeft/Right navigate on
  both axes, preserving the pinned behaviour. Caller capture/onClick overrides remain upstream-owned.
- **Dependency:** exact embla-carousel-react 8.6.0, committed separately; its engine internals are
  deliberately version-bound. No pin movement, pipeline change or consumer scaffolding.
- **Motion audit:** declared = implemented = documented data.transition, with the Embla engine form
  documented in animation-system §3.1.1 before implementation. Shared carouselClock calibration
  maps duration.base to 22 engine attraction units; timeScale scales the default, explicit full-mode
  opts.duration/breakpoints remain caller-owned. Pointer release uses the effective base token clock.
  A private lifecycle plugin clamps every fresh engine's useDuration to zero for reduced/none,
  including drag and explicit API/plugin requests. Mode changes preserve engine/selection and settle
  in-flight targets. Full retargeting keeps location and native velocity. Track/loop translate is
  required state positioning; reduced/none retain it and direct dragging while removing autonomous
  interpolation. Composed Button owns feedback.press; no duplicate declaration. No new recipe,
  CSS transform writer, layout animation, timers or render-time measurement. Independent plugin
  animation/autoplay remains caller-owned and documented; user plugins are not silently removed.
- **Proof:** full pnpm check passes 363 tests in 58 files, including eight Carousel tests for refs,
  parts/slots, native props, API/options/plugins, caller render/events, axis/keyboard, subscription
  cleanup, mode clocks and stable mode-change identity. Isolated .next-carousel production build
  passes (59 pages). Edge on port 3119, two workers: nine targeted tests pass. Three requested modes
  × two OS preferences prove actual frame interpolation or immediate correct position, API jump=false,
  drag/release, loop, dynamic slides, horizontal/vertical axes, keyboard and parent/viewport resize.
  Additional proof covers live in-flight downgrade, RTL, dragFree, caller watchDrag=false and a narrow
  duration breakpoint that cannot bypass none. Full reverse navigation is sampled mid-flight to
  prove continuous position and correct final alignment. Dual-theme desktop/390px full-page axe has
  zero WCAG2A/2AA/2.1AA violations with no rules disabled. Six screenshots (selected/narrow/vertical
  × light/dark) were inspected and preserved in .cache/carousel-proof/.
- **Findings:** initial alignment assertions incorrectly included upstream's 16px slide gutter;
  corrected tests compare visible card edges, including RTL. Narrow axe exposed over-wide API
  labels; shortened the first column without changing the API. Existing item img lint and occasional
  Slider act warnings remain. The only shared runtime edit adds an inert clock token, so the full
  browser suite was not repeated. Next-generated tsconfig additions/formatting were inspected/restored.
- **Scroll Area handoff:** B6 is 5/6 shipped. This session stops after Carousel; coordinator confirms
  completed/idle and clean commits before starting Scroll Area. Scroll Area must read actual pinned
  sources and choose motion from their behaviour. Its completion must review B6's batch gate;
  do not infer that Carousel evidence closes sibling or historical visual gates. Historical B1–B5
  gates (including earlier B5 select/menu evidence), B7/B8/B9 and §8 carried work all remain open.
  This does not establish overall parity completion.

### 7.14 B6 scroll-area shipped; batch gate complete (2026-11-01)

- **Surface:** both fixed exports and all four slots from Base UI at unchanged pin `96da9cc7f1aa`.
  new-york-v4 scrollbar sizes, borders and rounded thumb retained. Default orientation is vertical;
  root ref/classes/styles/render/native events stay on the root, viewport is internal. ScrollBar
  forwards its ref/render/styles/events/keepMounted to the track. State callback classes merge last.
  Only scroll-area was appended to the pinned manifest using shared extractors.
  49 components, 55 registry items, 49 docs, 50 previews.
- **Motion audit:** T0, declared = implemented = documented empty recipe set. Native scrolling and
  primitive thumb sizing/translation represent position, not authored animation. All modes retain
  wheel, keyboard and pointer scrolling with no interpolation added. No motion/provider dependency,
  hook, mode attribute, timing literal or shared runtime change. Colour/focus feedback stays upstream.
- **Proof:** full `pnpm check` passes 369 tests in 59 files (six new tests), typecheck, Biome,
  registry freshness/budgets/P11 and pinned parity. Isolated `.next-scroll-area` production build
  passes with 60 pages; Next-generated tsconfig additions/formatting inspected and restored.
  Edge port 3120, two workers, eight targeted browser tests pass: three modes × two system
  preferences, computed no authored motion, keyboard on both axes, wheel and actual thumb dragging,
  content growth followed by native scroll remeasurement, parent-only height resize, no page errors.
  Full-page desktop/390px axe has zero WCAG2A/2AA/2.1AA violations with no disabled rules.
  Four dual-theme screenshots inspected and saved in `.cache/scroll-area-proof/`.
- **Findings:** Base UI removes non-overflowing viewport from the Tab order; unit assertions now
  preserve that behaviour. jsdom lacks getAnimations; this file supplies an empty API shim, while
  actual computed animation is checked in Edge. Installed Base UI resolves to 1.9.0 under the existing
  ^1.6.0 range, without a dependency change. Its viewport observes its own size, not content-only
  growth: thumb updates on subsequent native scrolling or viewport resize. Docs explicitly record
  this limitation rather than adding an unpinned Content wrapper or an extra observer.
  A final browser rerun exposed a wheel-test focus/dispatch race after horizontal keyboard scrolling;
  the test now refocuses the vertical viewport and polls real wheel input. Final eight tests pass.
- **B6 gate review:** the six per-component proofs cover modes, keyboard, zero axe violations,
  size budget and inspected dual-theme screenshots. Existing evidence is still present locally:
  accordion 8 Edge tests / `.cache/accordion-proof/` (2 images); collapsible final box-model proof
  11 / `.cache/collapsible-box-proof/` (2); tabs 8 / `.cache/tabs-proof/` (6); table 8 /
  `.cache/table-proof/` (6); carousel 9 / `.cache/carousel-proof/` (6); scroll-area 8 /
  `.cache/scroll-area-proof/` (4). Earlier findings and final reruns are detailed in §7.9–7.13.
  Current aggregate check covers all siblings; no shared runtime changed, so their browser runs
  were not repeated. This closes B6 only. Historical B1–B5 visual gates remain open.
- **Next:** B7 `chart`, then calendar, navigation-menu, resizable, sidebar. B8 data-table/date-picker,
  B9 attachment/bubble, and §8 carried work remain scheduled/open. No overall parity completion claim.

### 7.15 B7 chart shipped (2026-11-01)

- **Surface:** pinned Base/new-york-v4 source at unchanged 96da9cc; seven exports including ChartConfig,
  one upstream chart slot; actual Recharts content prop types, defaults, formatting, theme maps and
  outer div ref/styles retained. Only chart appended to the manifest. 50 components / 56 items /
  50 docs / 51 previews. Recharts 3.10.1 is pinned in a separate dependency commit.
- **Motion decision first:** animation-system §3.1.2 explicitly defines the T4 data.transition engine
  form. SVG data geometry is a deliberate property-budget exception, never DOM layout. The public
  AnimationControllerProvider drives numeric progress on duration.base/ease.out and provider timeScale;
  caller series delay/duration/easing cannot extend it, false still opts out. Reduced/none finish
  geometry immediately, including an in-flight downgrade, without erasing positional SVG transforms
  or remounting. Tooltip position animation is always disabled, documented as a Cadence constraint.
  Caller custom shapes / independent animation controllers retain responsibility for their motion.
- **Implementation discovery:** Recharts complete() calls onAnimationEnd only after active; the
  controller enters the public state machine before ticking and completion. Unit proof covers the
  actual handle, eased midpoint, downgrade and one completion callback. Eight Chart unit tests.
- **Browser proof:** isolated .next-chart, Edge port 3121, workers=2, tests/e2e/chart.spec.ts: 8 passing.
  All three modes × both system preferences test Bar/Line/Area/Pie updates against actual SVG paths,
  full intermediate frames, reduced/none stable geometry, explicit 5-second caller clocks, keyboard
  tooltip, mode downgrade, responsive resize, exact data table and no pageerror. rAF sampling spans
  50 frames because this host may refresh faster than 60Hz. No mock geometry in browser proof.
- **Accessibility and visuals:** both themes at 1280/390, full-page axe WCAG2A/2AA/2.1AA with no
  disabled rules and zero violations; screenshots in .cache/chart-proof inspected. Narrow preview
  originally exceeded its centred frame; w-full fixes actual clipping. Wide MDX API tables exposed
  keyboard scrolling without a focus target; site MDX tables now receive tabIndex=0 (matching the
  existing Table preview approach). No axe rules were suppressed. Biome permits the intentional table tab stop with a local rationale.
- **Checks:** registry:build + pnpm check (377 tests / 60 files), 50 pinned parity surfaces, budgets/P11
  and freshness; isolated Next production build (61 static pages). Browser and screenshot evidence
  closes Chart only. B7 remains 1/5; calendar is next. B1–B5 visual gates and §8 remain open.

### 7.16 B7 calendar shipped (2026-11-01)

- **Pinned surface:** both official Calendar sources at 96da9cc7f1aa were read. Preserves Calendar,
  CalendarDayButton, the calendar slot, complete DayPicker discriminated props/defaults, locale,
  classes/styles, formatters, components, selection callbacks, native day buttons and focus behavior.
  DayPicker 9.13.2 and date-fns 4.1.0 are exact dependencies, committed separately. Only calendar
  was appended to the upstream manifest; the pin is unchanged.
- **Motion decision:** T4 data.transition on the actual changed month grid (§3.1.3). Stable parts
  and a date context preserve the month tree. Full uses signed distance.sm plus opacity on the
  recipe clock; reduced is opacity only; none starts no animation. Native WAAPI cancellation
  synchronously removes the effect on live mode/clock/style changes. No remount, duplicate grid,
  selection decoration, height tween or layout read. Caller components/styles remain authoritative.
- **Actual findings:** Motion DOM cancellation could reapply a cached intermediate transform;
  native cancellable effects fixed it. DayPicker max in multiple mode resets selection to the
  newly clicked date; excludeDisabled resets a crossing range to its clicked start. Locale alone
  leaves default navigation labels in English. Pinned Intl dropdown formatting uses the host
  locale if none is passed: Chinese Node versus English browser caused a real hydration error.
  Preview now passes enUS/fr explicitly; docs explain the SSR requirement without changing defaults.
- **Proof:** 8 component tests cover all modes, stable grid/day nodes, caller rerender focus,
  keyboard, controlled month changes, disabled/selected days, required/min/max multiple selection,
  excluded-disabled ranges, locale/week start/week numbers, two months, custom parts and styles.
  Isolated `.next-calendar` production build generated 62 static pages. Edge browser suite: 8/8,
  three modes × two system preferences, actual single/multiple/range selection, outside day,
  arrows/Home/End/PageUp/PageDown, dropdown months, controlled update, rapid reverse/update,
  active animation cancellation (positive running count → zero, same node), and system downgrade.
  Both themes at 1280/390 pass full-page axe WCAG2A/2AA/2.1AA with no rules disabled, no horizontal
  overflow and verified two-month row/stack geometry. Four screenshots were visually reviewed
  and preserved locally in `.cache/calendar-proof/` (not committed).
- **Conformance:** declared = implemented = documented data.transition; only transform/opacity,
  token timing/easing/distance, no persistent will-change or measurements; reduced drops transform,
  none has zero active effects, live downgrade cancels, grid height updates immediately.
  `pnpm registry:build` precedes `pnpm check`; source and generated payloads are separate commits.
- **Remaining:** closes Calendar only. B7 is 2/5; navigation-menu, resizable and sidebar follow.
  Historical B1–B5 visual gates, B8/B9 and all unclosed §8 carried work remain open; B6 stays closed.

### 7.17 B7 navigation-menu shipped (2026-11-01)

- **Pinned surface:** read Base and new-york-v4 sources at 96da9cc7f1aa. All nine Base
  exports, slots, declared props/defaults and native Base UI Root/List/Item/Trigger/Content/Link/Icon/
  Positioner props remain available, including render, refs, state callback classes/styles,
  controlled changes, actions, keepMounted and collision positioning. No new dependency or pin move.
- **Motion:** T3 popup.anchored + exit.fade + geometry.resize (explicit CSS form). Base UI retains
  its shared popup/viewport, measured targets, cancellation and auto-size reset. Native CSS full
  scales/fades the anchored popup, cross-fades content, and transitions bounded width/height on
  the slow token clock. Reduced drops scale and geometry transitions; none also omits starting/
  ending opacity states. Positioning coordinates update instantly. Popup/content own token clocks
  for nested modes and timeScale. Caller classes/styles remain last; no second geometry engine.
- **Findings:** Base UI ArrowDown opens but keeps trigger focus; Tab enters content. Horizontal
  arrows move top-level focus and ArrowDown opens the next item. Content keepMounted preserves
  state while the portal remains mounted; the default portal unmounts on a complete close.
  Controlled value-only changes can adopt natural geometry immediately; trigger activation and
  in-panel content mutations drive Base UI's measured resize clock. External controls may dismiss
  the popup by normal outside/focus-out semantics. Tests distinguish these paths.
- **Accessibility repair:** Base UI 1.6's tabbable focus guards carried aria-hidden=true, causing
  full-page axe aria-hidden-focus failures. Two menu-scoped child-list observers remove that
  attribute from these empty generic spans only, preserving tabindex, focus handlers and refs
  (including callback cleanup). No dependency patch, global mutation or disabled axe rule.
- **Proof:** production `.next-navigation-menu` build, Edge 8/8 matrix (three modes × two system
  preferences plus light/dark visual cases), actual sampled popup scale/opacity, pointer cross-item
  switching, keyboard arrows/Tab/Escape, outside dismissal, controlled rapid reverse, same popup
  identity, in-panel content update, active resize → none with a positive running count → zero,
  system downgrade and 390px resize. Whole-page axe WCAG2A/2AA/2.1AA zero violations in both themes,
  no horizontal overflow at 1280/390. Four screenshots reviewed in `.cache/navigation-menu-proof/`.
  Unit coverage includes modes, disabled semantics, render/refs/callback styles/classes, cancellation,
  retained content and ref cleanup; registry verifier also checks the explicit shared-popup CSS form.
- **Conformance:** declared = implemented = documented; transform/opacity plus bounded T3 measured
  geometry only, no top/left tween or animation timer. Full/reduced/none differ in computed browser
  behavior; mode changes keep the same popup. Payloads rebuilt before check and from final source
  commit, with source and generated artifacts in separate commits.
- **Remaining:** closes Navigation Menu only. B7 is 3/5; resizable then sidebar. Historical B1–B5
  visual gates, B8/B9 and all unclosed §8 carried work remain open. B6 stays closed.
- **Coordinator conformance review:** extracted the duplicated reduced-duration multiplier into
  `lib/motion.ts`'s `reducedDurationScale` token. Both `transitionFor()` and the local popup clock
  read it. Timing and browser behavior are unchanged; the full 398-test check passes again.

### 7.18 B7 Resizable — completed (2026-11-01)

- **Surface:** pinned Base API plus new-york-v4 styling, all three exports and slots, no parity
  exceptions. Exact dependency `react-resizable-panels@4.16.0` uses Group/Panel/Separator types;
  numeric panel sizes are pixels, percentage strings are explicit. DOM elementRef and imperative
  groupRef/panelRef, callbacks, constraints, collapse/expand, disabled state and caller styles survive.
- **Motion audit:** T0, empty recipe set. The primitive owns direct manipulation and immediate layout;
  no spring, opacity reveal, geometry tween, motion hook/provider or data-motion is shipped.
  Pointer, keyboard and imperative resizing stay functional and immediate in all modes. No shared
  runtime or design recipe changes are needed. Keep input identity across mode/orientation changes.
- **Evidence:** five unit tests cover actual primitive rendering, defaults, orientation, disabled state,
  refs/cleanup, callback passthrough, styles and static modes. Full `pnpm check`: 403 tests / 63 files,
  53 pinned parity items, typecheck, lint and registry freshness/budgets/P11 pass. Isolated
  `.next-resizable` production build: 64 pages. Edge: 8/8 cases (three modes × two system preferences,
  plus two visual cases), real pointer reversal and limits/collapse, live mode downgrade during drag,
  both axes, keyboard limits/Enter, double-click reset, imperative resize/collapse/expand/setLayout,
  locked keyboard, rapid external updates and retained input/node identity. No authored animations
  or transitions in any mode. Full-page axe WCAG2A/2AA/2.1AA zero violations in light/dark at
  1280/390, both orientations, no document overflow, four screenshots reviewed in `.cache/resizable-proof`.
  Source and payloads are committed separately, rebuilt from final source before the final check.
- **Remaining:** B7 is 4/5; Sidebar follows. B1–B5 historical visual gates, B8/B9 and all open §8 work
  remain open. B6 stays closed. Nested CSS popup clocks remain part of the historical conformance work.

### 7.19 B7 Sidebar — completed (2026-11-01)

- **Surface:** pinned Base API (24 exports and all slots/defaults) with new-york-v4 classes. All
  left/right, sidebar/floating/inset and offcanvas/icon/none modes retained; controlled/uncontrolled
  desktop state, separate mobile Sheet state, seven-day write-only cookie and Ctrl/Cmd+B preserved.
  Native events, render callbacks, refs including React 19 cleanup and caller classes/styles survive.
  Shared `use-mobile` hook ships as a namespaced registry:hook under lib/hooks; no npm dependency added.
- **Motion:** T3 `layout.move`, desktop offcanvas own-width transform on a persistent native div.
  A persistent MotionValue retains retarget velocity; cleanup stops the spring. Reduced/none use
  immediate static edge positioning and no transform animation. Gap/icon widths and label layout
  update immediately in every mode; no measured geometry, height/width/left/right tween or timer.
  SSR collapsed placement is explicit. Caller transform owns that property and suppresses the spring.
  Offcanvas content is inert while closed. Breakpoint changes retain upstream's separate trees.
- **Dependency repairs:** Sheet popup/backdrop resolve local token clocks (including nested full
  inside none), preserve callback class/style merging and remove hidden start/end opacity in none.
  Sidebar tooltip roots are disabled whenever the final tooltip hidden prop is true: otherwise a
  visually hidden tooltip consumed Escape before the mobile Sheet. Explicit hidden=false overrides
  still work. Stable skeleton width avoids SSR random mismatch. Sidebar semantic colors now have
  card/primary/accent/border/ring fallbacks in site and cadence-theme; screenshot review found that
  missing aliases made the mobile panel transparent. No shared motion/provider runtime changed.
- **Proof:** 8 Sidebar unit tests and 9 Sheet tests cover modes, cancellation, controlled state,
  cookie/shortcut, native events, render refs/cleanup, variants, input identity and nested clocks.
  Full check: 412 tests / 64 files; 54 pinned parity items, registry freshness/budgets/P11, typecheck
  and lint pass. Isolated `.next-sidebar` production build: 65 static pages. Final Sidebar browser
  suite plus the preserved docs-sidebar continuity regression: 9/9. Three modes × two system
  preferences sample actual desktop transform and mobile translate/opacity; both sides, icon,
  offcanvas, static, all surface variants, controlled external toggles, rapid reversal, live downgrade,
  resize, keyboard/Tab/Escape/outside and focus return pass. Full-page axe WCAG2A/2AA/2.1AA zero
  violations, no document overflow at 1280/390. Four final screenshots individually reviewed in
  `.cache/sidebar-proof/`. Source and rebuilt payloads are committed separately.

### 7.20 B7 — ✅ complete (2026-11-01)

All five implementations and their batch gate are complete. The joint Edge production matrix for
Chart, Calendar, Navigation Menu, Resizable and Sidebar passes 40/40, including each component's
full/reduced/none × system preferences, full-page axe with no disabled rules, responsive overflow
checks and light/dark screenshots. Earlier B7 source-specific screenshots were reviewed in their
own steps; Sidebar's final four images were also reviewed. The final preview-only refinement and
extra variant/static checks pass Sidebar plus the existing site-sidebar regression again (9/9).
Full repository check proves all tier size budgets and pinned parity. Logs live under
`.cache/sidebar-{build,b7-e2e,e2e-final,final-check}.log`; screenshot folders remain local evidence.

This closes B7 only. B1–B5 historical visual gates (especially older select/menu), B8 blocks,
B9 attachment/bubble and all open §8 carried work remain open. B6 remains closed. Sheet's local clock
repair does not close the historical nested CSS-popup conformance gate for other components.
Next: B8 `data-table`, followed by `date-picker`, then B9 and the historical/§8 audits in dependency order.

### 7.21 Data Table — ✅ shipped (2026-11-01)

- **Composition:** first `registry:block`, with the pinned Base example at
  `apps/v4/examples/base/data-table-demo.tsx` and guide at
  `apps/v4/content/docs/components/base/data-table.mdx`, not an invented `ui/data-table.tsx`.
  `Payment`, `columns`, `DataTableDemo` remain the upstream exports. Upstream sync and parity write
  retain real block source/guide paths; parity checks both paths offline. The pin is unchanged.
- **Dependency:** exact `@tanstack/react-table@9.3.1` (v9 feature registration / row models), committed
  independently. No validation, fetch ownership, shared motion runtime or build config change.
- **Behaviour:** email sorting/filtering, page selection, column visibility, pagination, working
  copy-ID and mailto actions. Stable payment IDs key rows and selection; table/filter nodes survive
  sort/filter/mode changes. Every state slice can be internally owned or paired with a caller
  setter. Preview uses external controlled state, 23 records, page size, reset and live data updates.
  Native table semantics, named checkboxes, header scopes and aria-sort remain; empty rows span
  visible columns. Inline-flex on composed checkboxes ensures their 16px boxes in table cells.
- **Motion:** T2 composed `feedback.press`, `state.morph`, `popup.anchored`, `exit.fade` only.
  Row/data/geometry changes stay instant. Dropdown Menu now resolves a local portal clock,
  callback classes/styles last, none first-frame opacity, and immediate transition cancellation.
  The browser caught an active CSS scale continuing after duration became zero: `transition-none`
  now cancels none, and reduced uses `transition-opacity` so scale is dropped immediately.
  This does not close the other historical popup or B1–B5 gates.
- **Evidence:** complete repository check (420 tests / 65 files), 55 pinned surfaces and all tier budgets; isolated
  `.next-data-table` production build (66 pages); Edge production three modes × two OS preferences,
  sorting/filtering/paging/selection/visibility, external reset/data updates, keyboard/focus,
  preserved nodes, nested full inside none and live portal downgrade/system reduce. Full-page
  WCAG2A/2AA/2.1AA axe in both themes at 1280/390 has zero violations without disabled rules;
  table scrolls with keyboard on mobile and document does not overflow. Edge Data Table plus
  Dropdown Menu/Menubar regression matrix passes 23/23, including real clipboard ID and mailto checks. Four full-page screenshots
  are reviewed under `.cache/data-table-proof/`. Logs: `.cache/data-table-{build,e2e-final,final-check}.log`.
  Source and final-source-stamped payloads are separate commits.
- **Remaining:** B8 Date Picker next, then B9 attachment/bubble, historical B1–B5 visual gates and
  every unclosed §8 carried item. B6/B7 stay closed. B8 batch gate is not closed by this one block.

### 7.22 Date Picker — ✅ shipped (2026-11-01)

- **Source:** real pinned Base `apps/v4/examples/base/date-picker-demo.tsx` and
  `apps/v4/content/docs/components/base/date-picker.mdx`, with new-york-v4's icon
  treatment. `DatePickerDemo` remains the named export. It is a registry:block,
  not a date primitive. Pin unchanged; no new npm dependency (existing date-fns
  4.1.0 and DayPicker 9.13.2). No shared motion runtime or build configuration change.
- **Behaviour:** initially empty optional single selection; additive typed range,
  value/defaultValue/onValueChange, controlled open, disabled trigger/days, locale,
  Calendar overrides and caller presets. Present value=undefined clears controlled
  state. Native div/ref cleanup and Button/Popup callbacks/classes/styles survive.
  Calendar focuses the selected day, arrows move days, selection stays open,
  Escape returns focus. Input parsing, time, validation, persistence and time-zone
  conversion remain application-owned; the guide states the single/range scope.
  Explicit TZDate plus timeZone preserves civil fields and trigger formatting.
- **Motion:** T2 composes feedback.press, popup.anchored, exit.fade, data.transition.
  No label/layout animation or selection-keyed remount. Popover now resolves its
  portal clock locally (timeScale/reducedDurationScale), evaluates callback classes
  and styles last, uses transition-opacity in reduced and transition-none/duration-0
  without hidden starting/ending opacity in none. Button className state callbacks
  now execute. Other historical wrappers still require their own compatibility audit.
- **Proof:** 431 unit tests / 66 files, 56 pinned surfaces; typecheck/Biome/registry
  freshness/tier budgets/P11/parity pass. Isolated .next-date-picker production build:
  67 static pages. Edge full/reduced/none × both OS preferences samples real popup
  opacity/scale and month-grid transform/opacity. None is visible first frame;
  nested full under outer none restores its local clock, live none cancels CSS/WAAPI,
  OS reduce removes scale, popup/day/grid identity and focus persist. Rapid month
  reversal, interrupted popup close/reopen, single/range selection, external clear,
  preset/update, French formatting, disabled state and resize pass. Final B8 plus
  Button/Popover/Dropdown Menu/Menubar regression: 51/51; final document/axe and
  interruption refinement: 3/3. Full-page WCAG2A/2AA/2.1AA axe, open and closed,
  light/dark × 1280/390: zero violations, no disabled rules or document overflow.
  Four final full-page screenshots individually reviewed; open range and preview
  screenshots also reviewed under .cache/date-picker-proof. The review caught and
  corrected Markdown table pipes; browser assertions now require both rendered tables.

### 7.23 B8 — ✅ complete (2026-11-01)

Both blocks and their joint gate pass. Data Table's full production suite ran with
Date Picker against the same final implementation build; sorting/filtering/selection,
pagination, column visibility, clipboard/mailto, keyboard/mobile scroll and live
portal downgrade remain green. Date Picker's joint evidence is recorded above.
Both pages have dual-theme desktop/mobile full-page axe, overflow and screenshots;
all size budgets and pinned parity pass. Logs: .cache/date-picker-{build,b8-e2e-final,
visual-final,final-registry,final-check}.log. Source and final-source-stamped public
payloads are separate commits.

This closes B8 only. B9 attachment/bubble comes next (code-block already shipped).
B1–B5 historical visual gates and every unclosed §8 item remain open; B6/B7 stay closed.
Popover's local clock repair does not prove other historical popups. Base UI
className state callbacks need a final compatibility audit across older wrappers;
Button/Popover/Sheet/Dropdown local fixes do not prove full-library compatibility.

### 7.24 Attachment — ✅ shipped (2026-11-01)

The fixed pin has `apps/v4/registry/bases/base/ui/attachment.tsx`, the Base guide
`apps/v4/content/docs/components/base/attachment.mdx` and Base example
`apps/v4/examples/base/attachment-demo.tsx`. Visual classes come from
`apps/v4/registry/new-york-v4/ui/attachment.tsx`. The nine-export source imports
Base UI mergeProps/useRender and Button; it does **not** import `@shadcn/react`.
Existing installed dependencies suffice; no package or pin change is needed.
The unscheduled AI prerequisites below remain applicable to future components
that actually need that runtime or streaming ownership; they do not require
adding an unused runtime to this presentational file component.

Attachment's caller owns File objects, object URLs and their revocation, file input
accept/multiple/name/required semantics, upload requests, progress, cancellation,
retry and validation. Its state prop only renders idle/uploading/processing/error/done.
No streaming model is needed here. T5 composes existing data.transition (busy title:
opacity pulse, replacing upstream shimmer's background travel) and feedback.press
(Button actions). Layout, media state and removal update immediately. No reveal,
layout/geometry animation or presence delay is added. Full/reduced retain the
opacity-only busy loop; none disables it. Bubble and the joint B9 gate remain open.

**Implementation and proof:** all nine pinned Base exports/slots/defaults are retained,
with new-york-v4 visual classes. Native div/span props, useRender element/function,
event merging and React 19 ref cleanup survive. AttachmentAction preserves Button
className/style state callbacks and caller-last merging; trigger/actions stay on
separate layers, with an explicit overlay focus ring. Native image composition,
long names, three sizes, both orientations and keyboard-scrollable groups are shown.
The preview's native file input updates only the displayed name; no request is sent.
No new npm dependency, shared runtime, build/test config or upstream pin change.

Full repository check: 439 tests / 67 files, 57 pinned surfaces, registry freshness,
all gzip tier budgets, P11, types and Biome pass. Isolated `.next-b9` production build:
68 static pages. Edge workers=2, port3133: full/reduced/none × both system preferences,
per-frame title opacity/no-transform, actual action press scale, live none cancellation,
restored nested full under outer none, system reduce, stable title across state/size/
orientation/resize, file selection, Enter/Space/Tab, independent pointer actions,
link activation and keyboard group scroll. Full-page WCAG2A/2AA/2.1AA axe has zero
violations without disabled rules in light/dark at 1280/390, both orientations;
no document overflow at any size. Eight browser cases pass. Four full-page and
four preview screenshots are individually reviewed in `.cache/attachment-proof/`.
Logs: `.cache/attachment-{build,e2e,final-registry,final-check}.log`.

Initial unconstrained concurrent verification exhausted host memory; final checks
run sequentially, Vitest through VITEST_MAX_FORKS=2/VITEST_MIN_FORKS=1, build with
RAYON_NUM_THREADS=2 and NODE_OPTIONS=--max-old-space-size=768. No checks disabled.
Next's generated tsconfig additions were restored. Source and final-source-stamped
public payloads are committed separately. Bubble, code-block joint regression and
the B9 batch gate remain open, as do historical B1–B5 gates and all carried §8 work.
B6/B7/B8 remain closed; no global popup/wrapper compatibility conclusion is implied.


### 7.25 Bubble — ✅ shipped (2026-11-01)

Pinned source: `apps/v4/registry/bases/base/ui/bubble.tsx`, guide
`apps/v4/content/docs/components/base/bubble.mdx`, demo
`apps/v4/examples/base/bubble-demo.tsx`, visual
`apps/v4/registry/new-york-v4/ui/bubble.tsx`, all at
`96da9cc7f1aa10580a3741664e2a77c721206c00`. CLI docs returned no links;
real fixed resources and installed Base UI useRender/mergeProps types were read.
The four-part API needs no new package and no @shadcn/react or streaming runtime.
The remaining unscheduled AI prerequisites stay open.

Preserves Bubble/Group/Content/Reactions exports and slots, seven variants, start/end,
reaction top/bottom + start/end, all defaults, native props/styles/events/refs and
Base UI render element/function merging with React 19 ref cleanup. Interactive content
has native button/link keyboard semantics and visible focus. Destructive foreground
text plus destructive border/background replaces the pinned red text: real axe caught
insufficient contrast in both themes (dark 4.37:1); no API/default deviation.

T5 one-shot `data.transition` uses CSS @starting-style opacity and the local
cm.transition clock, including timeScale. Full/reduced fade only; none first frame
is opaque with zero duration, and live none cancels on the same node. Nested full
restores the clock inside outer none (preview 0.88s; OS/reduced 0.528s). No streaming,
layout, entry translation, exit delay, timer or forced node remount. Text chunks,
variant/alignment/reaction updates and resize are immediate; stable message IDs in
preview preserve nodes. The app owns messages, network, cancellation, retry and scroll.
The existing recipe is clarified in animation-system §3.0.1; no runtime/token changes.

Seven unit tests plus real Edge evidence cover defaults, slots, merged events/styles/
classes/ref cleanup, render state, links/buttons, all modes and stable updates.
The inventory is now 65 registry items, 58 components (56 UI + 2 blocks), 58 docs,
59 previews, 58 pinned surfaces. The old 57 total omitted the early Code Block;
counts in the scope/batch/schedule/risk tables are corrected without dropping work.

### 7.26 B9 — ✅ complete (2026-11-01)

Attachment + Bubble + the early Code Block jointly verified. Complete repository
check passes 446 tests / 68 files, typecheck, Biome, registry freshness, parity,
all gzip tier budgets and P11. Only the existing Item img lint warning remains.
Isolated `.next-b9` production build passes with 69 static pages. No package,
shared runtime, build/test configuration or upstream pin changes.

Edge, port3133, workers2:
`node node_modules/@playwright/test/cli.js test tests/e2e/bubble.spec.ts tests/e2e/attachment.spec.ts tests/e2e/motion-matrix.spec.ts --grep 'bubble|attachment|code-block' --workers=2`
passes **31/31 (1.0m)**, `.cache/bubble-b9-e2e.log`. Bubble and Attachment run
full/reduced/none × both OS preferences, native pointer/keyboard actions, live none,
state/text updates and node continuity; Code Block retains its six-mode fold/tab and
mid-flight pill layering regressions. Bubble tests observe actual first-frame opacity,
duration and animation count, not only attributes. No console errors in new mode tests.

All three pages: light/dark ×1280/390, complete-page axe WCAG2A/2AA/2.1AA zero violations,
no disabled rules, no document overflow. Bubble covers seven variants and every reaction
side/alignment. Full-page + preview images in `.cache/bubble-proof/` and
`.cache/attachment-proof/` individually reviewed. Edge's >20k-pixel mobile Code Block
full capture repeated pixels, so overlapping 5000px viewport tiles cover the complete
page; all twelve tiles reviewed through the footer. Additional visual-only Code Block
run **2/2 (10.0s)**, `.cache/bubble-code-tiles.log`, re-runs two existing visual tests,
not two extra unique tests. Cached screenshots/logs are not committed.

This closes B9 only. Historical B1–B5 visual gates and every unclosed §8 item remain
open; B6/B7/B8 remain closed. Next is a bounded historical-gate audit, then §8, with
full handoff and coordinator verification before another implementation session.


## 8. Backlog

### AI components (25, unscheduled)

Chat, Prompt Input, Message Scroller, Message, Marker, Model Selector, Reasoning, Chain of Thought,
Tool, Task, Queue, Sources, Inline Citation, Plan, Confirmation, Checkpoint, Subagent, Terminal,
Test Results, Context, File Tree, Suggestion, Trace, Stack Trace, Questionnaire.

`code-block` left this list in 0.5.0 and is tracked in B9 instead (§7.5).

Prerequisites before any AI batch is scheduled:

1. `@shadcn/react` pinned and its install path confirmed.
2. A streaming message model agreed (chunking, state machine, cancel, retry).
3. Upstream source obtained: most of these ids are not in shadcn's registry index, so parity
   checking has nothing to compare against until they are.

### Carried open work (2026-10-30 review)

Everything the 2026-10-30 review proposed. It is recorded here, in the plan of record, so it does not
depend on anyone remembering a separate document. The contract drift this section opened with was
closed before the remaining B4 overlays were started, as the order required.

**Contract drift — closed 2026-10-30 (see §7.4)**

The six drifts this section opened with — `theme.reveal`, `variants()`, the three token copies, the
unread `--motion-*` variables, the spinner's rotation, and the two missing `button` classes — are
fixed, and both drift classes now have a CI check behind them. Nothing in that table is still open.

**Tooling**

- **`parity` props surface — done 2026-10-31 (see §7.6).** `parity:check` now compares each part's prop
  names and declared defaults against the pinned upstream source, and `meta.parity.props` records a
  difference the visual style forces. What it still cannot see: the class lists themselves (a dropped
  utility is invisible to every check — the B4 review found two by hand), and type-level requiredness,
  because most props come from a Base UI type no regex can resolve.
- **Docs-side recipe validation (half done).** `registry:check` now compares the §3 catalogue table and
  the §5 `Recipe` union against `lib/motion.ts`, and fails on a recipe that exists in only one of them —
  the drift that let `theme.reveal` survive. Still open: the per-component motion tables in
  `content/components/<id>.mdx` and the recipe table in `content/docs/motion.mdx`, which are prose and
  remain unchecked.
- **`expectMotionContract()` helper.** The three-mode assertion is hand-written per component, and the two
  components missing it were the two that were broken. One shared helper that a new component must call.
- **Site initial JS budget.** `next build` now produces a route-size report; measure `/components/button`
  against the ≤120 KB gzip budget in [animation-system.md](animation-system.md) §7 and record the number.

**Documentation site** — see
[documentation-site-and-distribution.md](documentation-site-and-distribution.md) §2.2 for the promise these
items close: preview variant switching and code view, install-command copy (the component exists at
`components/site/copy-command.tsx` and is imported nowhere), search and category/intensity/complexity filters
on the index, TOC / prev-next / "Edit this page" on component pages, `/r/[...path]` with immutable caching,
the missing guide entries, and the sidebar's landmark / `aria-controls` / height-animation problems.

**Metadata**

- `meta.intensity` is `subtle` on 28 of 29 components, so the filter the site does not have yet would have no
  discriminating power when it lands. Decide what the dimension means or drop it from the docs table.
- T0 component docs omit the "Responsiveness and performance" section that the 12-section template promises,
  and nothing enforces the template. Either the template is tier-specific or the section is written.

### Deferred and excluded

| Item            | Decision                                                         |
| --------------- | ---------------------------------------------------------------- |
| `direction`     | Deferred                                                         |
| `form`          | Not shipping: validation and form state belong to the user (P11) |
| `native-select` | Not shipping: `select` covers the capability                     |
| `sonner`        | Not shipping: notifications go through `toast`                   |

## 9. Tooling

| Script                         | Change                                                                                                            |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `scripts/new-item.mjs`         | New. Scaffolds source, docs, preview, test, registry item from a tier-specific template                           |
| `scripts/check-registry.mjs`   | Tier budgets, banned validation deps, required `meta.tier`/`meta.upstream`, block type support                    |
| `scripts/parity.mjs`           | ✅ Compares exports, `data-slot` values and part props against `upstream/manifest.json`; `--write` regenerates it |
| `scripts/sync-upstream.mjs`    | ✅ Fetches upstream `base` source into `.cache/shadcn` at a pinned commit, writes the manifest                    |
| `scripts/upstream-surface.mjs` | ✅ Shared export/`data-slot`/prop extraction, so both sides of the comparison use one parser                      |

## 10. Schedule

| Version | Scope      | Person-days | One developer | Two developers |
| ------- | ---------- | ----------- | ------------- | -------------- |
| 0.2.0   | B0–B2 (20) | 21.5        | 4.5 weeks     | 2.5 weeks      |
| 0.3.0   | B3–B4 (15) | 48          | 9.5 weeks     | 5.5 weeks      |
| 0.4.0   | B5–B6 (13) | 77          | 15.5 weeks    | 8.5 weeks      |
| 0.5.0   | B7–B9 (10) | 102         | 20.5 weeks    | 12 weeks       |

With a 15% buffer: about 23–24 weeks for one developer, 12–13 weeks for two.

## 11. Risks

| Risk                                                 | Mitigation                                                     |
| ---------------------------------------------------- | -------------------------------------------------------------- |
| Upstream API drift across 58 hand-maintained files   | Pinned manifest, parity check, quarterly sync, `meta.upstream` |
| Size budget unrealistic for upstream source          | Tier budgets plus `meta.budget` exceptions with reasons        |
| Every component animating                            | T0 is a real tier; "one cause" review rejects decoration       |
| Data Table / Date Picker written as primitives       | They are `registry:block` with a guide template                |
| AI upstream instability                              | Backlog until prerequisites are met                            |
| Documentation load (58 pages, 12 section slots each) | `new-item.mjs` scaffolding plus the §2 template                |
| Existing users of the eight components               | Tagged release, migration note (import path only)              |

### 7.27 Historical B1 gate — complete (2026-11-02)

- Scope: eleven B1 atoms, preserving the nine static T0 parts without a provider runtime.
- Repair Base UI state callback classes on Input, Separator and Avatar Root/Image/Fallback;
  preserve caller-last classes, state styles, render, native events and React 19 cleanup refs.
- Card fit content now composes caller refs with its measurement ref; supplying a ref must not
  silently disable ResizeObserver measurement. This remains immediate layout, not motion.
- Skeleton explicitly keeps the reduced transform-free branch; its sole recipe remains the CSS
  opacity-only continuous data.transition, kept in reduced and stopped in none.
- Responsive input/card grids and separator row; Button/Skeleton local mode controls allow real
  same-node downgrade and explicit full restoration inside an outer none scope.
- KbdGroup retains the pinned native div prop surface even though upstream renders a kbd element.
- Validation: `pnpm check` passed 450 tests / 69 files, registry freshness/P11/tier gzip budgets
  and parity for all 58 surfaces. Production build `.next-b1-gate` passed (69 pages).
- Edge, workers=2: `tests/e2e/b1.spec.ts` **40/40 passed (2.0m)**. Twelve animated mode/OS
  cases prove real Button press/release and held-pointer downgrade, and Skeleton opacity over a
  complete CSS cycle, none cancellation, nested full restoration and live OS change. Six native
  mode/OS cases exercise typing/selection/file input, label focus/toggle, linked badge, semantic
  separators, avatar fallback, ratio geometry, static keys, Card content/rapid toggle/resize/focus.
- Eleven pages × light/dark × 1280/390: full-page axe WCAG2A/2AA/2.1AA zero violations,
  no disabled rules, no document overflow or page errors. All 44 full-page and 44 preview captures
  reviewed; updated six pages reviewed again after docs/preview fixes. Deterministic avatar image
  response plus independent actual broken-image fallback avoids external network flakiness.
- Evidence: `.cache/b1-gate-e2e.log`, `.cache/b1-gate-build.log`, `.cache/b1-review-check.log`,
  `.cache/b1-proof/<id>-<light|dark>-<1280|390>[-preview].png` (untracked).
- Review caught invisible vertical separators and wrong disabled-label peer order; preview uses
  an orientation-qualified height override and disabled group, with a real positive-height assertion.
  Pulse sampling uses the computed CSS duration, not a fixed frame count tied to display Hz.
- No recipes, motion tokens, runtime, dependencies, upstream pin or checking configuration changed.
  B2–B5 and every §8 carried item, including global callback/popup audits, remain open.


### 7.28 Historical B2 gate — complete (2026-11-02)

- Nine items: alert, empty, item, field, button-group, input-group, breadcrumb,
  pagination, spinner. Eight static T0 wrappers keep their existing provider-free contract.
- Compared all nine pinned Base source files and installed Base/useRender types. Fix inherited
  state class callbacks in ItemSeparator, ButtonGroupSeparator and InputGroupButton; state styles,
  caller-last classes, render, events and React 19 cleanup refs remain supported. Native useRender
  parts retain string/object props. PaginationPrevious/Next again accept upstream's size prop.
- Alert destructive description now uses the full destructive token: the former /90 failed axe
  contrast at 4.23 light / 4.41 dark. Action occupies a third column, without covering message text.
- Empty/Item previews stack on mobile; Field demonstrates responsive direction and caller-supplied
  invalid changes with stable input values. Counts in Alert/Item previews reflect 58 components.
- Spinner retains the documented single-glyph rotation exception: CSS data.transition in full/reduced,
  static in none. Real rAF samples prove rotation, initial-none stillness, live cancellation, nested
  full restoration and OS preference change; no new recipes, timings, runtime or dependencies.
- Edge production gate `.next-b2-gate`, workers=2: B2 suite 30/30 (1.9m). Six mode/OS animation
  cases and six mode/OS native interaction cases, plus nine pages in two themes. Full-page axe
  WCAG2A/2AA/2.1AA zero violations at 1280/390, no disabled rules, document overflow or page errors.
  All 36 full-page and 36 preview captures reviewed. Additional four existing visual cases passed
  (15.9s) with real Alert no-overlap and ButtonGroupSeparator positive-height geometry assertions;
  these are reruns, not 34 distinct cases. Initial run 28/30 failed Alert contrast, fixed in source.
- Production build succeeds (69 pages). Initial full check passes 453 tests / 70 files, including
  three new compatibility tests; final-source registry rebuild/check and commits recorded in
  `docs/handoffs/b2-gate.md`. Pin remains 96da9cc7f1aa10580a3741664e2a77c721206c00.
- Evidence: `.cache/b2-review-e2e.log`, `.cache/b2-geometry-e2e.log`, `.cache/b2-review-build.log`,
  `.cache/b2-proof/<id>-<light|dark>-<1280|390>[-preview].png` (untracked).
- B3–B5 gates, all §8 tooling/site/metadata, and the cross-library callback/popup audit remain open.
  Next is only B3; B1/B2/B6–B9 stay closed unless new concrete evidence warrants a bounded repair.

### 7.29 Historical B3 gate — complete (2026-11-02)

- Reviewed all eight pinned Base sources and installed APIs. Base className callbacks now evaluate
  against real state before caller-last cn; ProgressIndicator style callbacks and ToggleGroup style
  callbacks/objects preserve internal defaults and caller overrides. ToggleGroup passes orientation
  to Base for vertical keyboard navigation. Mixed Checkbox shows its indicator; numeric Slider values
  render one thumb; InputOTP restores the pinned spellCheck=false default.
- Browser sampling exposed continuing opacity/translate under a live none downgrade. The documented
  control adapter stops and retargets existing animation controls on value/clock changes, including an
  unchanged target; zero-duration targets commit immediately. Its shared source ships with the existing
  cadence-provider item. Checkbox/Radio/Switch/Slider/Progress retain the same DOM nodes and recipes.
  OTP also retains its character span, animates only changed characters, and cancels mode changes.
  No new dependencies, public props, recipe, or parity deviation. Caller owns values and validation.
- Added four compatibility tests covering all Base callback surfaces, render forms, native events,
  React19 cleanup, external controlled updates and OTP identity/focus. All old tests remain.
  Full check: 457 tests /71 files, all tier budgets, P11, registry freshness, parity58 surfaces.
  An intermediate CodeBlock asynchronous highlight timeout was retried without changing source,
  test timeout or configuration; final verification is recorded in the handoff.
- Production `.next-b3-gate` built69pages. Edge workers2, port3136: final B3 suite64/64 (2.1m),
  `.cache/b3-final-review-e2e.log`. Eight recipes/components ×three modes ×two OS settings prove actual
  per-frame scale/translate/opacity, initial none, running cancellation even during held pointer,
  nested full recovery, stable nodes, keyboard/focus, drag, native clipboard paste/selection,
  rapid changes and mobile resize. Tests wait for the mode commit before sampling none.
- Sixteen visual cases cover eight pages in both themes at1280/390: full-page axe zero violations
  without disabled rules, no document overflow or pageerror. All32 full-page and32 preview images
  reviewed individually; code/tables scroll internally. `.cache/b3-proof/` contains the PNGs and
  four-image review sheets. Docs match callback and scalar-value APIs; Progress composition explicitly
  retains its upstream default track. No screenshot/cache/build artifacts are committed.
- Source, final-source payload and handoff are separate commits. Evidence/logs and the complete next
  B4 onward work are in `docs/handoffs/b3-gate.md`. Fixed pin remains96da9cc7f1aa10580a3741664e2a77c721206c00.
  B4/B5 gates, every open §8 item, and global callback/popup/running-mode audits remain open.
  B1/B2/B6–B9 stay closed; this closes only B3, not the overall goal.
