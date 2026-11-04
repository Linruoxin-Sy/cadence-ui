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
  /docs/motion-modes           Full / reduced / none: resolution, usage, test matrix
  /docs/accessibility          Accessibility commitments and checklist
  /docs/registry               Self-hosted registry / private distribution
  /docs/ai                     llms.txt / MCP / Skill
  /docs/changelog              Release notes
/components                    Catalog: category + motion tier + search
  /components/button
  /components/dialog
  ...
```

**Catalogue filters**: search title/id/description and every actual `registry.json` `categories`
entry (including secondary memberships), authored motion intensity (animation-system §2.1), and
complexity S/M/L. Category labels are human-readable versions of the existing taxonomy; never
infer a parent's category from a nested specimen. Registry order is retained. URL keys are `q`,
`category`, `intensity`, `complexity`; selections compose by AND, search words by AND. Unknown
filter values fall back to All with a visible status and preserve the URL until the next change.
Search submits with Enter or Search; selects apply immediately; Clear removes only these four keys.
SSR and no-JS show the complete default directory, with a no-JS explanation. Hydration reads URL,
back/forward restores controls/results, unrelated query/hash/history state survive. Hidden results
remain mounted and cannot receive focus; history that hides a focused result restores search focus.
Dependencies remain a future catalogue dimension; no optional GSAP entries currently ship.

---

## 2. Component page templates (tier-specific membership)

Every component page renders from MDX. The table describes content areas, not a total heading count:

| #   | Section                             | Content requirements                                                                                                  |
| --- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1   | Title + use-case sentence           | Matches the registry `description`; see [parity-plan.md](parity-plan.md) §6.6                                         |
| 2   | Preview                             | Component-only specimen; compact range or common usage, without demo configuration controls                           |
| 3   | Installation                        | CLI (pnpm, npm and yarn) + manual (file list)                                                                         |
| 4   | Usage                               | Smallest runnable code                                                                                                |
| 5   | Examples                            | Flat named sections after Usage; each explains a state, variant or feature with a live preview card and matching code |
| 6   | When to use                         | 3–5 concrete scenarios                                                                                                |
| 7   | When not to use                     | Point to the alternative component (prevents misuse)                                                                  |
| 8   | API                                 | Props table: type, default, description                                                                               |
| 9   | **Motion contract**                 | Enter/exit/interaction/reduced, itemised (see below)                                                                  |
| 10  | Keyboard and accessibility          | Key table + screen-reader behaviour + focus strategy                                                                  |
| 11  | Responsiveness and performance      | Breakpoint behaviour, size, SSR caveats                                                                               |
| 12  | AI usage notes + related components | Trade-off advice for agents + cross-links                                                                             |

The two sections a reader arrives for come first: `## Installation` opens every body, `## Usage`
follows it. Someone who lands on the page to install the component never scrolls past a rationale
to find the command.

**Sections are flat.** Every section is a `##`; there is no `## Examples` wrapper holding `###`
children. Each example is its own sibling section — `## Controlled`, `## Sizes`, `## Diff` — so the
page reads as one even list and every example can be linked, searched, and skimmed on its own. Two
levels appear only inside `## API`, where a component with distinct parts groups its props under
`### \`PartName\``. Frontmatter is the only other structure.

### Required body membership and order

Title/description and Preview are site chrome, not MDX headings. Required body membership depends
on tier and item type, not a fixed total heading count. Examples vary in number.

All tiers require, in order: Installation, Usage, flat named examples (as needed under §2.2),
When to use, When not to use, API, Motion contract, accessibility/keyboard coverage,
responsiveness/performance coverage, and AI advice. Related components may follow.
Each required section appears once and has content. No `Examples` wrapper is allowed.
Headings use ATX Markdown (`##`), not Setext or HTML. Only API permits `###` headings, naming one or more parts in inline code; no other
nested headings or body `#` headings are allowed. Fenced code and comments do not
contribute headings. Additional examples belong between Usage and When to use.
Examples may be omitted only when there is no additional state, variant, composition or feature to
explain beyond Usage. A compact top preview does not replace the explanation of those differences.

- **Compact T0–T1:** `Accessibility` may include the native keyboard/focus story;
  a separate `Keyboard interactions` is optional. Both responsiveness and performance
  are required, as either `Responsiveness and performance` or the ordered pair
  `Responsive behavior`, `Performance`.
- **Standard T2–T5 UI and registry:block:** both `Accessibility` and `Keyboard interactions`
  are required (either order), or the combined `Keyboard and accessibility`. The same
  combined/split responsiveness and performance alternatives apply. Blocks do not
  require separate keyboard/performance headings when the combined headings cover them.
- AI advice is `Notes for AI` or `AI usage notes`; `Related components` is optional.
- Input/data-owning compositions require `Validation and data ownership`: input,
  textarea, field, input-group, checkbox, radio-group, switch, slider, toggle,
  toggle-group, input-otp, select, combobox, calendar, data-table, date-picker, attachment.
  It goes after accessibility and before performance, or before When to use as an
  example of caller-owned data (the existing block convention). New input scaffolds
  use `--input`; authors must apply this requirement to any new input API.

T0 coverage explains actual parent sizing, overflow and breakpoint responsibility,
SSR/native behavior and runtime limits. T0 means no authored animation runtime or
interpolation, not zero JavaScript: Base UI interaction, react-resizable-panels and
Card's optional ResizeObserver still need client code. Composed children retain their
own motion contracts. Performance claims refer to actual APIs and the existing source
budget (T0: at most 4 KiB gzip per item's own shipped sources, excluding dependencies),
never a zero-byte bundle or a cross-library certification. SSR markup does not imply
hydrated interactions work without JavaScript. T1 describes its real motion costs.

`scripts/doc-template.mjs` enforces this membership/order through both registry:build
and registry:check (therefore pnpm check); new-item validates its generated body with
that same gate. This checks structure and nonempty coverage, not prose truth or live
performance. Contributors must review the claims against source.

### 2.1 The Motion contract section (this project's signature content)

Every component has one flat `## Motion contract` section and a Markdown table. Recipe names
are inline code in the table's `Token`, `Recipe`, or `Recipe / cause`, or `Recipe / tokens` column. Token cells may
also explain timing with `duration.*`, `ease.*`, `spring.*`, and `distance.*`; these are tokens,
not recipes. Multiple phases may repeat a recipe, but a cell must not repeat it. Prose, examples,
and API tables are not declarations. A static component may use an empty Token column or a
`Mode | Authored motion` (or `Mode | Animated properties`) table with no recipes. Composition tables name the recipes explicitly
reused from installed dependencies; they do not invent transition calls in the wrapper.

```md
## Motion contract

| Phase          | Properties               | Token                             | Interruptible |
| -------------- | ------------------------ | --------------------------------- | ------------- |
| press          | scale while pressed      | `feedback.press` / `spring.press` | yes           |
| reduced / none | immediate state feedback | —                                 | —             |
```

`registry:check` compares the table's recipe set with `meta.motion` and frontmatter `motion`,
and checks the `## Recipes` table in `content/docs/motion.mdx` against the runtime catalogue.
Missing sections/tables, unknown or extra recipes, missing recipes and duplicate declarations
fail the check. Free prose and phase descriptions remain editorial content. This static gate
complements the implementation checks and three-mode tests; it does not prove live animation.

### 2.2 Preview capabilities

#### Top preview: the component itself

The first preview card is a concise specimen, not a configuration playground. Its body contains only
the documented component, its meaningful content, and the minimum composition needed to use it
(such as an input label, an overlay trigger, or content separated by a Separator). Do not place demo
configuration buttons, selects, switches, sliders or toolbars in this card, including controls for
variant, size, orientation, placement, invalid/disabled state, sample data, locale, or motion mode.
Do not move the same playground toolbar immediately outside the card to preserve the old structure.
Explanations and example headings belong in the MDX body, not inside the top specimen.

The component's own interactions remain usable: Select selects a value, Tabs changes panels, a
Dialog trigger opens its dialog, and Carousel's previous/next controls move its slides. A button
labelled “Toggle orientation” changes demo configuration; a TabsTrigger changes component state.
Judge the control by its purpose, not by whether it happens to be a Button or Select. Similarly,
CodeBlock's own content tabs are part of CodeBlock, not a generic demo variant selector.

Show as much of the component's range directly as remains clear and compact. A small set of shapes
can sit side by side or in wrapping rows without a selector. When the component has many states,
variants, sizes, placements or compositions, show its most common usage in the top card and explain
the remaining range after Usage. Do not render a Cartesian product of every prop, or force an
exhaustive matrix into a tall, crowded card. Review both desktop and narrow screens when making
this editorial choice; a finite set of representative shapes is not every possible content value.

Global motion mode, playback speed and theme stay in the site header. Top specimens and ordinary
body examples inherit those settings; they do not silently force a local mode. A specifically named
motion-mode example may use an explicit provider and must describe that override outside its card.

#### After Usage: explain each difference with its own specimen

Use flat named `##` sections between `## Usage` and `## When to use`, for example `## Sizes`,
`## Disabled`, `## Controlled`, or `## Vertical`. Each example section contains:

1. A short explanation of the specific state, variant, composition or feature and when it matters.
2. A live component preview card showing that exact form, with a fixed configuration where possible.
3. Matching runnable example code, with imports and caller-owned state when needed, rendered through
   the existing code-fence system. Registry implementation source is not a substitute for example code.

Closely related forms may share one section/card when the comparison remains clear (for example
all sizes in a row); independent features get separate sibling sections. Reuse and improve existing
named sections before adding new ones. Do not introduce an `## Examples` wrapper or a fixed count.
All meaningful states, variants and features need coverage here, including forms omitted from the
top card. Coverage follows the real component API and documented compositions, not a nested
component's unrelated variant API.

State/variant comparisons show the forms directly rather than hiding them exclusively behind a
selector. A focused behavioral example may include the action needed to exercise its named feature,
such as an external value update in Controlled or appending text in Updating text. Explain such
actions in the section; do not recreate an all-purpose playground in every example. Give repeated
examples independent state and unique IDs so labels, focus, portals and ARIA references stay correct.

Preview cards use the shared site frame and the actual registry components. Keep per-component
loading boundaries, server-rendered specimens, keyboard access, responsive containment and
full/reduced/none behavior. No-JS must retain readable specimens, explanations and code; hydrated
component interactions still require JavaScript. Custom MDX preview references must not make
registry `docs`, `/r/<id>.md` or llms output depend on a site runtime to understand an example:
keep the explanation and runnable code in the distributed body.

#### Shared site capabilities

Author body specimens as a standalone `<ComponentExample name="example-id" />` in their named
section. Register the page's complete set in `components/site/previews/examples.json`; its existing
per-page preview module accepts an optional `example` prop and renders the fixed named specimen.
The document binds the component id, so references cannot select another page or an arbitrary module.
The shared frame keeps the original top-level `data-preview` marker separate from body
`data-component-example="component/example-id"` markers, and opts specimens out of prose typography.
The explanation and runnable code stay beside the reference in MDX, including in distributed docs.

During migration, registration opts the entire page into the example-card gate. `registry:build` and
`registry:check` reject unknown/malformed references, missing or duplicate registered specimens,
examples outside the example region, and named sections without a card, explanation or TSX code
with imports. Unregistered legacy pages retain the existing section gate until migrated; passing
that gate does not certify the new preview contract. Code/example equivalence and the distinction
between real interactions and configuration controls still require source and browser review.

| Capability             | Implementation                                                                                                                                                                             | Value                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Named example previews | Fixed specimens in the top card and flat example sections after Usage; section anchors identify examples                                                                                   | Differences are visible and explained without configuring a playground                    |
| Playback speed gear    | One `Select` in the site header (`2×` / `1×` / `0.5×` / `0.25×`); `CadenceProvider timeScale={1 / speed}`, never a token edit                                                              | Lets people see the details                                                               |
| Reduced-motion preview | One switch in the site header (`full` / `reduced` / `none`), mirrored in `?motion=`; the provider resolves it once for the whole site                                                      | A mode is a setting; 29 copies of the switch would be 29 chances to disagree              |
| Theme switching        | `data-theme` / `class="dark"`                                                                                                                                                              | Both themes                                                                               |
| Component source copy  | Reads the registry `content`; separate from the runnable code accompanying each example                                                                                                    | Installable source stays current; example code explains usage                             |
| Install copy           | `npx shadcn add @cadence/<id>`                                                                                                                                                             | Lowers the conversion barrier                                                             |
| Loading transition     | `components/site/measured-height.tsx` applies the measured height in the frame it changed (ADR-015); the specimen itself lands with a CSS `@starting-style` reveal in `previews/shell.tsx` | The card is always the size of its example, and the content arrives without moving layout |

The former `?variant=` playground is superseded by the specimen/section structure above. During
migration, its existing hook, applicability fixture and tests describe the old implementation,
not the new authoring contract. Retire the selector and migrate its shape coverage to the named
examples together; do not discard behavioral, focus or motion assertions merely to remove controls.
Legacy `?variant=` links must still render a valid page without a selector or URL-driven specimen
filtering. Leave unrelated query parameters, history state and hashes intact; use section anchors
for new example links. No registry component acquires a generic variant prop.

The source view is a native disclosure next to the live preview, so opening code does not replace
or reset an example. Every file is read on the server from the built registry payload and rendered
through `CodeFence` with build-time highlighting and the registry copy control. The MDX Usage
section remains the runnable example. TOC anchors are assigned from the compiled heading tree;
prev/next follows `listComponents()` registry order, and editing targets the component MDX on main.
Tables retain readable minimum column widths and native keyboard horizontal scrolling on phones.

The Component source disclosure reads `public/r/<id>.json`'s `content`. Usage and named example
sections carry their own runnable usage code; they explain how to compose the component rather
than duplicating its implementation source.

The preview body is the one place the _site_ owns geometry. The route awaits its lazy preview so
SSR/no-JS retains a visible specimen rather than a hidden streamed segment. `MeasuredHeight`
keeps that height explicit — written in the frame the content changed, from a `ResizeObserver` on the content
rather than on the wrapper — so the card around a preview is always the size of its example and never lags
behind it.

A hash targeting content inside `DocumentEntrance` also triggers its entrance. A cold deep link
must not leave a long document behind its initial clip while waiting for an intersection delivery.

It does not tween, and that is a correction rather than a simplification. The first version animated the
measurement with `geometry.resize`, and the trace showed why that could not work: the content it watches is
itself animated (the code block folds on the same recipe), so the target changed on every delivery — about 95
a second — and each delivery started a new spring. A restart discards the progress of the last one, so the
spring never accelerated: it crept at a near-constant rate until the content stopped, then ran one real spring
for the remaining three quarters of the distance. The reader sees an easing curve, not their example growing.
Applying the measurement at once is the distinction in [ADR-015](adr.md): measured geometry is layout, not
motion, so there is no recipe here, no token, and nothing for `reduced` / `none` to disable — all three modes
render the same box.

What the old version could not smooth is unchanged: a `Suspense` boundary whose fallback is in the HTML and
whose content arrives in a later chunk is patched before hydration, with no JavaScript running to measure it —
on a prerendered page that patch happens during parse, before the first paint. There is nothing to animate
there in either version, and covering it would mean giving up SSR for the previews
(`dynamic(..., { ssr: false })`); a preview that is already in the HTML before first paint is worth more than
an animation nobody sees.

The one thing the frame does animate is not geometry. `previews/shell.tsx` gives every specimen a
`@starting-style` landing — 4px up plus a fade, on the `--motion-duration-base` clock with
`ease-cadence-out` — so a preview arrives instead of appearing, and nothing in layout moves: the height is
still the measured one, applied at once. `@starting-style` rather than Motion is the whole point: the preview
usually arrives either as a node inserted during parse or as a route change, and by the time JavaScript could
run the element is already painted at its final state, so a JS entrance would first have to snap it back to
`opacity: 0` — the flash it exists to prevent. The duration is a custom property, so `data-motion="none"`
collapses the landing to zero. PreviewStack resolves its local mode/timeScale clock; reduced keeps only
opacity, and none removes the starting state and transition. A complementary system media rule
removes travel before hydration can resolve the effective React mode. One limit is
worth knowing: on a cold load with `?motion=none` in the URL, the mode is only resolved after hydration, so
that first landing still plays once — the frame cannot know a client preference before the client runs.

This section defines the authoring target. Migrating the existing component pages, shared preview
infrastructure and regression coverage is separate implementation work; changing this definition
alone does not establish that the live site conforms.

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

A fenced block is an exception to "style the element": `Mdx` maps `pre` to
`components/site/code-fence.tsx`, which renders the registry's `code-block` item, so all 224 fences under
`content/**` and the install commands on the home page are the component the docs document. Typeset already
excludes `[data-slot]` subtrees from its element rules, so a block is never restyled by the `pre` rule; the
one thing it takes back is the flow margin, from the `.typeset-docs` rule in `app/globals.css`. Highlighting
runs at build time — the pages are static, so Shiki tokenizes the fence while the page renders and the browser
downloads no grammar — and the header carries the language and the copy control, because a floating copy
action is invisible until hover and most fences on this site are commands to copy. A fence in a language the
item does not bundle renders as plain text, which is the whole source either way.

Two info strings are not languages. ` ```install ` marks the one command a component page opens
with — `npx shadcn@latest add @cadence/<id>` — and ` ```package-manager ` marks any fence whose
commands depend on the tool: create a project, `init`, add packages — `content/docs/installation.mdx`
is made of them. Both render through `components/site/package-manager-fence.tsx`, which restates
the source for pnpm (`pnpm dlx` / `pnpm add`), npm (`npx` / `npm install`) and yarn (`yarn dlx` /
`yarn add`) with `components/site/package-manager.ts`, keeping whatever pin the fence wrote and
leaving lines such as `cd` alone. A fence that does not parse falls back to a terminal block.

The switcher is the registry's tab block with `tab` / `onTabChange` wired to
`components/site/package-manager-preference.tsx`: one selection for the whole site, persisted under
`cadence-package-manager`, so a click in one fence moves every other fence on the page and the next
visit starts on the same manager. The command stays in the markdown, so the payload an agent reads
at `/r/<id>.md` is still something it can run. Every `content/components/*.mdx` uses the `install`
fence for its Installation section, and every package-manager fence in the installation guide
parses, which `tests/site/package-manager.test.tsx` enforces; the shared, remembered selection is
proven in `tests/site/package-manager-block.test.tsx` and, after hydration in a real browser, in
`tests/e2e/package-manager.spec.ts`.

### 2.4 Document entrance

Each page makes its content `<article class="max-w-3xl py-12">` the entrance via
`DocumentEntrance as="article"`, a site-only client component (`components/site/document-entrance.tsx`). The
`.typeset` container inside it is untouched; the entrance belongs to the outer article, not to the markdown
elements. On a guide page the article is the title, description, and body; on a component page it is the
breadcrumb, header, preview, and body. The article rises 24px, fades from 0, clears a 4px blur, and opens a
`clip-path` from zero height at the same time. The wipe runs on `duration.slow` with `ease.inOut` — quicker
than the body's `duration.page` — so the edge leads and the content's rise, fade, and blur are still in
progress as it uncovers them. The clip keeps the element's full box, so the entrance does not reflow the page.
An unanimated outer box owns the intersection observer and occupies the article's layout slot. The
article keeps its classes and semantic element. Observing this box lets a cold load, restored scroll or
fast deep scroll trigger the entrance even when the article's initial zero-height clip is above the
viewport; the animated clip must never gate its own visibility trigger.

The server paints the hidden state. The root layout's `<noscript>` rule and the `@media print` rule in
`app/globals.css` restore the body when the entrance cannot run. The component stays outside
`registry/cadence/**`: a whole-body blur and a clip wipe exceed the shipped motion contract. Its timings still
come from `lib/motion.ts`, and the `reduced` branch keeps opacity only while `none` resolves every duration to
zero.

The entrance uses the committed control adapter so mode/clock changes stop an existing
writer before paint even when its target is unchanged. Explicit none renders RESTING
in server HTML; other modes retain the hidden SSR state and no-script/print restoration.

### 2.5 Site width and alignment

The header's inner row, documentation shell (sidebar and content), home page, and footer's
inner row share a centred `max-w-site` container. Its site-only `--container-site` token in
`app/globals.css` is 1500px, including horizontal padding: 16px below `md`, 24px from `md`
upwards. Header and footer backgrounds and separators still span the viewport.

The documentation sidebar remains 224px wide on desktop with a 32px column gap. Articles
and the component catalogue retain their independent `max-w-3xl` (48rem) reading measure,
centred in the remaining content area. Below `md`, the existing Browse disclosure replaces
the sidebar and the content uses the available width within the shared padding.

Component pages add an independent 224px Toc sidebar at `xl`, matching the left navigation's
width. The page fills the remaining documentation shell rather than centring a bounded article/Toc
group. A 32px grid gap separates the right sidebar from the reading region; the article retains its
own centred `max-w-3xl` measure inside that region. The Toc's right edge aligns with the site
container's inner right edge, including on wide screens. Guide pages retain their existing measure.
The rail starts at the document's upper right and sticks 80px below the viewport top. Its list
scrolls independently when longer than the available viewport. Below `xl`, a native disclosure
aligned to the right below the title exposes the same links, including without JavaScript.
Its list is an absolutely positioned panel, so expanding it does not move the document or
invalidate the browser's restored fragment position when the disclosure closes on reload.
The Toc sits outside DocumentEntrance on desktop so the article's transform and clip do not
affect its sticky position. Heading text, nesting depth and collision-safe ids come from the
same MDX compilation that renders the body; there is no second Markdown heading parser.
The site imports the registry's T3 `toc` directly. Scroll tracking enhances native anchors and
marks the current section with `aria-current="location"`. One persistent `layout.shared` indicator
slides and scales along the rail in full; reduced/none place it immediately. Section link activation
uses the token-backed `scroll.navigate` recipe in full; reduced/none navigate immediately.
Fragment history, focus and no-JS navigation remain available.

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
- the body must contain the §2 sections (a missing one fails the build), in that order, starting with
  `## Installation`; every section is a `##`, and the Examples slot expands to one `##` per example, so the
  count grows with the examples while the order does not.

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

| Endpoint                       | Content                              | Caching                            |
| ------------------------------ | ------------------------------------ | ---------------------------------- |
| `/r/registry.json`             | Current install index                | Revalidate every use, SHA-256 ETag |
| `/r/<id>.json`                 | Current installable item             | Revalidate every use, SHA-256 ETag |
| `/r/<id>.md`                   | Current component markdown           | Revalidate every use, SHA-256 ETag |
| `/r/catalog.json`              | Current machine catalog              | Revalidate every use, SHA-256 ETag |
| `/r/snapshots/<sha256>/<file>` | Explicitly frozen distribution files | One year, immutable, SHA-256 ETag  |

ADR-017 supersedes the former immutable latest example and tag-index-only snapshot promise.
`beforeFiles` rewrites `/r` to `app/registry-files/[...path]/route.ts` before public static files.
GET and HEAD share exact bytes/ETag and weak/list/wildcard If-None-Match handling (304).
Missing or invalid resource paths return 404/no-store. Only a single lowercase JSON/MD filename,
or snapshots + a 64-hex identity + that filename, is accepted; no filesystem path prefix guessing.
Normal builds preserve and verify every tracked snapshot. `node scripts/freeze-registry.mjs`
explicitly freezes the current built output. Commit its entire directory; deployment needs public/r,
not git history or a local cache. Never edit/delete previously distributed snapshot directories.
See the registry guide for namespace pinning and self-hosting; a frozen index alone cannot pin deps.

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

| Endpoint                     | Purpose                                                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------------------- |
| `/llms-full.txt`             | All component markdown inlined (~200–400 KB)                                                        |
| `/llms-small.txt` (planned)  | Overview + one line per component (< 20 KB)                                                         |
| `/r/catalog.json`            | Structured catalog (name, category, deps, motion, since)                                            |
| `/api/mcp` (planned, absent) | MCP: `list_components` / `search` / `get_component` / `get_install_command` / `get_motion_contract` |

MCP, additional llms endpoints and a distributed skill are unscheduled extensions; see the plan.

## 6. Versions, changes, and deprecation

| Item                | Rule                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------- |
| Version numbers     | `v0.x.y`, semver (0.x may break, but it must be flagged in the CHANGELOG)                     |
| Tags                | Future releases may map tags to retained content snapshots; no release tags are claimed today |
| Item-level versions | `meta.since` (first appearance); breaking changes add `meta.changedIn`                        |
| CHANGELOG           | Generated from conventional commits, grouped Added/Changed/Fixed/Removed                      |
| Deprecation         | Mark `meta.deprecated: "0.4.0"` + a note at the top of the docs, keep for at least 2 minors   |
| Migration           | Every breaking change ships a codemod or a "replacement snippet" doc                          |

**Why no npm package**: under the copy-the-source model, versions only answer "which version did I install"; no dependency resolution is needed. If a pure utility package such as `@cadence/motion` appears later, publish it to npm separately.

---

## 7. Contribution flow

CONTRIBUTING.md owns the scaffold and PR checklist. A proposal names its user task, upstream surface,
motion cause, reduced/none behaviour and data ownership before implementation. Required checks,
appropriate production interaction/keyboard/focus/axe tests, payload freshness and dual-theme visual
review support approval. Rendering alone is insufficient. Follow the motion review checklist and
retain caller API/event/ref semantics. Hosting, publication, release automation and release tags
require separate authorization; do not assume a configured CDN or a release command exists.

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
