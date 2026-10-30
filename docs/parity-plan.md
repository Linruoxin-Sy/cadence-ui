# Parity plan: shipping every shadcn component

> Status: **B0, B1, B2 and B3 complete (2026-10-30); B4 in progress (`dialog` shipped as the B0 pilot).**
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
  "batch": "B4",
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
3. Registry item with `meta.tier`, `meta.batch`, `motion`, `intensity`, `complexity`, `upstream`.
4. MDX: compact (9 sections) for T0–T1, standard (12) for T2+, including the motion contract and,
   for input components, the "Validation and data ownership" section.
5. Preview module at `components/site/previews/<id>.tsx`.
6. Unit test: render, `data-slot`, keyboard path, reduced branch.
7. Payload rebuilt, `pnpm check` green, dual-theme screenshot in the PR.

## 7. Batches

Ordering is by dependency: atoms → structure → form controls → overlays → menus → disclosure →
heavy data → compositions → AI.

Each item records its batch in `meta.batch` (`B1`–`B9`), so the batch table below is the single
source for both the build order and the documentation sidebar: the site groups components one level
deep by batch and drops batches that have not shipped yet, which means a new component appears under
the right heading as soon as its registry item declares one. `registry:check` requires the field, and
`scripts/new-item.mjs --batch` writes it.

| Batch | Theme                      | Items  | Depends on | Person-days | Version | Status                            |
| ----- | -------------------------- | ------ | ---------- | ----------- | ------- | --------------------------------- |
| B0    | Removal + pilot            | —      | —          | 3           | 0.1.x   | ✅ done                           |
| B1    | Atoms                      | 11     | B0         | 9.5         | 0.2.0   | ✅ done                           |
| B2    | Structure and feedback     | 9      | B1         | 9           | 0.2.0   | ✅ done                           |
| B3    | Form controls              | 8      | B1         | 11.5        | 0.3.0   | ✅ done                           |
| B4    | Overlays                   | 7      | B1         | 15          | 0.3.0   | 🔶 in progress (`dialog` shipped) |
| B5    | Menus and selection        | 7      | B4         | 17.5        | 0.4.0   | planned                           |
| B6    | Disclosure and collections | 6      | B1, B4     | 11.5        | 0.4.0   | planned                           |
| B7    | Heavy data and navigation  | 5      | B1, B4, B5 | 17          | 0.5.0   | planned                           |
| B8    | Compositions (blocks)      | 2      | B3–B7      | 4.5         | 0.5.0   | planned                           |
| B9    | AI first                   | 2      | B1         | 3.5         | 0.5.0   | planned                           |
|       | **Total**                  | **57** |            | **102**     |         |                                   |

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

Completed: **B0** — eight components removed and archived, the tier/P11 checks, the scaffold, the
validation guide, and the `button` + `dialog` pilots are in place; `pnpm check` and the docs build are
green, and a real `shadcn add` install was verified (see §5.1). **B1**, **B2** and **B3** — see §7.1,
§7.2 and §7.3.

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

### 7.1 B1 — ✅ complete (2026-10-29)

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

### 7.2 B2 — ✅ complete (2026-10-30)

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
    deliberate: `role="list"` on a div so a row can be an anchor through `render`, `role="group"` on the
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

### 7.3 B3 — ✅ complete (2026-10-30)

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

### 7.4 B4 — 🔶 in progress (2026-10-30)

- **Why not `next`:** `dialog` shipped as the B0 pilot but declares `meta.batch: "B4"`, so one item of this
  batch is already live. Marking the row `next` would have made §7.0's rule ("a batch whose row still says
  `next` is not done") hide a shipped component.
- **Shipped:** `dialog` only. Remaining: `alert-dialog`, `sheet`, `drawer`, `popover`, `tooltip`, `hover-card`.
- **Contract repair (2026-10-30):** the dialog's durations moved from the literals `duration-200` / `duration-100`
  onto `--motion-duration-base` / `--motion-duration-fast`, and `data-motion="none"` now resolves those
  variables to `0ms` instead of falling into the `reduced` branch. `popup.anchored` and `exit.fade` are
  declared with `form: "css-transition"`, and `registry:check` now fails when a declared recipe has no
  implementation — which is how the gap was found.
- **Browser proof (2026-10-30):** the Playwright matrix now exists. `tests/e2e/motion-matrix.spec.ts` runs
  `button`, `dialog`, `switch` and `progress` across 3 modes × 2 system preferences and asserts
  `getComputedStyle` from a production build; `tests/e2e/a11y.spec.ts` runs axe in both themes. 49 tests,
  green. That closes the "Playwright mode matrix" half of the B1–B4 gate.
- **Still open:** dual-theme screenshots for B1–B4. With a production build running in CI this is now a
  screenshot script, not an environment limitation.
- **Order for the remaining six:** `alert-dialog` (reuses `dialog`), then `popover` / `tooltip` / `hover-card`
  (one `popup.anchored` implementation), then `sheet` / `drawer` (new side/bottom variants). Each keeps the
  `form: "css-transition"` declaration and the three-mode assertions that `dialog` set.

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
  defers to the OS media query, which is a token-layer decision better made together with the single
  shared popup CSS that `popover` / `tooltip` / `hover-card` will establish below.
- **Browser proof, re-run 2026-10-30:** `pnpm build` produces all 40 pages and the compiled stylesheet
  carries `[data-motion=reduced]`, `[data-motion=none]` and the reduced-duration media query, with no
  `--motion-distance-*` or `--motion-intensity` left anywhere. `playwright test` is 49/49. This
  environment has no Playwright-downloaded Chromium, so the run used `PLAYWRIGHT_CHANNEL=msedge`, the
  fallback the config documents; the suite is not Chromium-specific.
- **E2E defect found by that run:** `openComponent()` asserted the mode the URL _asked for_ rather than
  the mode the provider _resolves_, so the `?motion=full` cell under `prefers-reduced-motion: reduce`
  could never pass — the one cell where the two differ. The helper now takes the resolved mode, and
  every matrix call site passes it. The 49-green claim in the bullet above is only true because of
  that fix.

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

### Carried open work (2026-10-30 review)

Everything the 2026-10-30 review proposed. It is recorded here, in the plan of record, so it does not
depend on anyone remembering a separate document. The contract drift this section opened with was
closed before the remaining B4 overlays were started, as the order required.

**Contract drift — closed 2026-10-30 (see §7.4)**

The six drifts this section opened with — `theme.reveal`, `variants()`, the three token copies, the
unread `--motion-*` variables, the spinner's rotation, and the two missing `button` classes — are
fixed, and both drift classes now have a CI check behind them. Nothing in that table is still open.

**Tooling**

- **`parity` props surface.** Compare prop names, requiredness, and defaults against the pinned upstream
  source (AST or a generated `.d.ts`). Exports and `data-slot` catch renames; they cannot catch a missing
  class, a changed default, or a prop that upstream added. Target: before B5, whose menu components are the
  most prop-heavy in the catalogue.
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

| Script                         | Change                                                                                              |
| ------------------------------ | --------------------------------------------------------------------------------------------------- |
| `scripts/new-item.mjs`         | New. Scaffolds source, docs, preview, test, registry item from a tier-specific template             |
| `scripts/check-registry.mjs`   | Tier budgets, banned validation deps, required `meta.tier`/`meta.upstream`, block type support      |
| `scripts/parity.mjs`           | ✅ Compares exports + `data-slot` values against `upstream/manifest.json`; `--write` regenerates it |
| `scripts/sync-upstream.mjs`    | ✅ Fetches upstream `base` source into `.cache/shadcn` at a pinned commit, writes the manifest      |
| `scripts/upstream-surface.mjs` | ✅ Shared export/`data-slot` extraction, so both sides of the comparison use one parser             |

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
