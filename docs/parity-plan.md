# Scope and next work

This is the authority for component scope, compatibility/batch conventions and unresolved work. Keep it current
by replacing resolved tasks. Do not append batch completion logs, test-run counts, commit tables,
cleanup reports or handoffs. Concepts and contracts live in the other [design documents](README.md).

## 1. Product objective

Provide a source-distributed, API-compatible superset of shadcn with purposeful motion. A consumer
can retain upstream JSX and gain the documented full/reduced/none contract without losing native
semantics, accessibility, controlled state or source ownership.

The target animation system gives every component its applicable baseline capabilities rather than
granting them by tier. Its contract is in [animation-system.md](animation-system.md); the delivered
migration, its open items and the performance work still open against the budget decision are in
[animation-system-plan.md](animation-system-plan.md). Source, registry metadata and public component
documentation now carry that migrated surface; §8 records what is still unresolved.

Every component also has an [individual target motion contract](motion/README.md#5-catalogue).
Shared style is guidance; common execution requirements remain binding. Per-component files own
parts, choreography and mode/interruption behavior, and the shared preset catalogue owns parameters.

## 2. Scope

The formal catalogue is 59 components: 57 registry:ui and two registry:block compositions
(Data Table and Date Picker). registry.json is the item inventory; upstream/manifest.json pins the
comparison surface. This scope does not imply every future upstream or AI component is scheduled.
Toc is a Cadence original, explicitly requested for document navigation. Its origin metadata is
`meta.upstream: { registry: "cadence", style: "native", version: <since>, reason: <why original> }`.
It has no fabricated upstream surface; the other 58 items retain their pinned shadcn parity requirements.

## 3. Compatibility and ownership

Follow overall-design P1–P11. Keep upstream ids/exports/slots/props/defaults; document additive APIs
and justified meta.parity.props differences. UI renders invalid state; consumers own validation,
stable data ids and application state. Base render and React 19.0 ref/event semantics are contracts.

## 4. Installation

Items install to @components/cadence/<id>/index.tsx beside the consumer's components/ui tree.
Relative shared imports survive verbatim. Dependencies use @cadence namespaces. No consumer CLI
scaffolding belongs in this registry authoring repository.

## 5. Work boundaries

Work only on the chosen requirement and regressions actually affected by it. Do not reopen arbitrary
caller/API combinations or start a new compatibility effort merely because a finite proof has limits.
Normal reversible fixes and measurements proceed within scope. Framework adoption, changed budgets,
functionality removal, dependency exemptions, publication/deployment and catalogue expansion need
explicit decisions. Keep one implementation session when following a serial task; avoid unbounded
candidate experiments. Test fixtures retain regression inputs, not previous reports.

## 6. Component conventions

### 6.1 Source and documentation

Source, registry metadata, MDX and preview use the same id. Follow CONTRIBUTING.md for the scaffold,
checks and PR contract. Registry payloads follow actual source changes, not every internal-doc edit.

Maintain `docs/motion/components/<id>.md` and its central index entry for each UI/block component.
This internal target file is distinct from the public MDX's delivered Motion contract. Compound parts
remain in one component file; shared token values are referenced rather than copied into it.

### 6.2 Metadata

Each component declares meta.tier, batch, motion, intensity, complexity, since and upstream. MDX
frontmatter matches registry metadata. Categories: layout/form/navigation/overlay/feedback/data/ai/utility.
Existing tier fields temporarily continue to select source budgets and doc membership while the
schema/tools migrate. They do not grant or prohibit an animation capability. Complexity is S/M/L;
intensity describes authored behaviour independently of runtime mode. Recipes declare implemented
behaviour, not the pending target. Follow animation-system.md and its implementation plan.

### 6.3 Capability coverage and transitional tiers

Every component is evaluated for appearance, content-driven size, surface colour, text colour,
changed-text animation and numeric rolling. Applicable behaviour is integrated by default after
migration, with ownership at the relevant part or composition. Native editing, arbitrary rich
children and passive layout changes retain their documented boundaries. Viewport reveal, shared
selection, gestures and other additional effects follow their own causes and contracts.

T0–T5 remain legacy schema values during migration because the current registry checks, templates
and source budget mapping use them. They are not motion levels or recipe allowlists in the target
design. Do not promote a component to a higher tier to enable text, colour or geometry, and do not
raise a tier merely to obtain a larger budget. Each item's historical source ceiling remains traceable
reported per item under ADR-026 but no longer compared, and no longer a target.

Disclosure height uses the measured, clamped `geometry.resize` recipe (including its documented
Base UI CSS form); there is no separate `disclosure.height` recipe. `data.transition` is also
defined in [animation-system.md](animation-system.md). Measured geometry applicability depends on
ownership, semantic cause and its mode/performance contract, not a T3 threshold.

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

This is a historical mapping, not a v2 budget. ADR-026 retired it as a comparison: `item.files`
includes the shared `registry/cadence/lib/**` helpers an item copies, so two of them exceed a T0
ceiling before the component contains a line, and 23 of 63 items sit above their tier today. The per-item
figure is still reported by `registry:check`; the compiled, runtime and page budgets in §8 are what is
gated or monitored. `meta.budget` is also historical — no item declares it. A tier is motion complexity,
never permission to animate or an allowance to spend.

### 6.5 Acceptance

Preserve upstream/API/native semantics and the documented recipe contract. Required unit checks,
applicable actual browser/engine paths, SSR/noJS, keyboard/focus/axe and dual-theme visual review must
support the change. Source-tier checks do not prove the separate compiled/runtime/page budgets.
Behavioral/correctness failures and missing functional evidence block functional acceptance.
Numerical performance follows ADR-026: a hard-gate failure blocks its run, a monitored breach is
recorded and tracked in §8, and an invalid measurement blocks regardless of class.

For preview-route or provider-boundary changes, exercise actual client navigation and browser history
with a pending timer, an active portal and an exercised engine. The bounded regression in
`tests/e2e/component-route-lifecycle.spec.ts` checks departed-node writes, modal ownership cleanup,
new-page input focus and shared layout/settings continuity; it does not certify heap use or every
component lifecycle.
It also leaves a real resize gesture through browser history while the pointer remains held:
the departed group must release its global cursor before pointer release, ignore later pointer
movement, leave the new page editable, and support keyboard resizing after forward navigation.

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

meta.batch groups sidebar items in dependency order; these are catalogue categories, not a completion
diary. Keep ids stable so scaffolding and the sidebar agree.

| Batch | Group                      |
| ----- | -------------------------- |
| B1    | Atoms                      |
| B2    | Structure and feedback     |
| B3    | Form controls              |
| B4    | Overlays                   |
| B5    | Menus and selection        |
| B6    | Disclosure and collections |
| B7    | Heavy data and navigation  |
| B8    | Compositions               |
| B9    | AI first                   |

### 7.2 Pagination semantics

Pagination renders real anchors styled with buttonVariants, preserving link semantics, aria-current
and the upstream slots/variant/size attributes. Do not wrap navigation links in a primitive that
changes their role to button. Current parity exceptions otherwise live in registry metadata.

## 8. Next work

The dependency-ordered rollout is delivered. Contract-to-tooling alignment, the shared capabilities
and the four primitives, the five pilots and the catalogue rollout are closed by F04 (#106); F01
(#82) rebuilt distribution from the implemented catalogue. Each of the 63 motion ids has a target
contract, registry metadata, public MDX and executed evidence — see
[where the rollout plan lives](animation-system-plan.md) for how that is judged and what it does not
cover.

The three non-performance items this section used to carry are closed and count as delivered: #168
(Navigation Menu did not run its declared shell size writer for a content revision inside one open
panel) in #175; #165 (the hover-card matrix probe asserted a pose and a CSS family its v2 recipe does not
own) and #169 (44 `motion-matrix` cells across ten blocks read the presence fade out of the colour
family, or matched two `data-motion` spans) in #174, with #165 closed as a subset of #169.

The last functional defect this section carried — #173, the drawer's declared edge flight on opening
never running because the presence controller yielded to the primitive's own swipe family — is fixed
in #185. The controller is composed on the popup, the live swipe state keeps the drag channel the only
`transform` writer, and `tests/e2e/motion-matrix.spec.ts` now asserts that cell against
`CLOCKS.sheet[mode]` instead of recording the gap. The target in
[drawer.md](motion/components/drawer.md) was not changed by the fix. F02's audited defects #155, #156
and #158 are closed; the F02 browser passes remain the record of what those audit slices exercised.

[ADR-023](adr.md#adr-023--effects-first-migration-performance-governance-afterwards) put effects first
and made the old numbers advisory so the migration could finish; it stays the record of that decision.
[ADR-026](adr.md#adr-026--v2-performance-budgets-what-is-gated-what-is-monitored-what-is-retired) now
decides the v2 budgets on the S02-A matrix and classifies each metric. This section is the open work
against that decision, in the order the old list recorded it — it does not restate the numbers, and
neither document holds a second copy of them: `scripts/performance-policy.mjs` carries the table and
`tests/lib/performance-budgets.test.tsx` fails when a hard gate is exceeded.

Gated inside `pnpm check`: own compiled code ≤ 8 000 B per id, install addition ≤ its recorded value per
id (a ratchet; new ids ≤ 224 000 B), the Motion runtime union ≤ 48 000 B, and CLS < 0.02 wherever a suite
measures it. Monitored, because their collector needs a production build and a 15-minute browser sweep
that required CI does not run: page total ≤ 550 000 B and route remainder ≤ 40 000 B per route, plus the
desktop frame share and longest block. Retired: the per-item tier source ladder, still reported by
`registry:check` and no longer compared. An invalid measurement is a correctness failure under every
class; monitored never means "not measured", and deployment never turns an exceedance into a pass.

1. **First load.** ADR-026 replaced the 120 000 B page bar with a monitored 550 000 B drift ceiling and a
   40 000 B route remainder, and does not claim the current cost is good: every component route costs
   367 600–503 400 B, of which 366 142 B is a 19-chunk shell all 63 routes load. The historical complete
   Button baseline of 221 511 B at source `4fe1a51` stays recorded as what the site cost before the
   catalogue grew; it is not a target and it authorizes no runtime adoption. The F03 run reproduced the shell
   at 366 142 B and recorded it in [performance-acceptance.md](performance-acceptance.md);
   [#177](https://github.com/Linruoxin-Sy/cadence-ui/issues/177) then attributed it chunk by chunk, and the
   split accounts for every byte: 135 115 B is framework baseline (React 18 / React DOM, the Next client
   router and hydration, the Turbopack runtime and the build manifest's `rootMainFiles`), 209 610 B is
   registry runtime (the shared Motion engine — `framer-motion` plus the `registry/cadence/lib/` executors —
   the components the site chrome mounts on every page — Select in the header, Tabs, ToggleGroup/Toggle,
   code-block, Breadcrumb, Toc — and the Base UI and `tailwind-merge` code those import), 6 361 B is the
   site's own chrome (16 569 B uncompressed: sidebar 10 670, header motion-mode controls 3 453,
   package-manager context 2 360), 1 876 B is chunk scaffolding and 13 180 B is the gzip dictionary those
   bodies share, which is a property of the container rather than a fifth category. Documentation-only code
   measures 0 B in the shell. Nothing in that list was removable: every body is rendered by every component
   route, the shell holds 8 `lucide` icon definitions rather than the library, its only duplicated bodies are
   three 37 B re-export shims, and build-time highlighting ships no client highlighter. The 209 610 B
   therefore stands as irreducible without removing a feature the catalogue renders, and the split describes
   the cost rather than approving it.
   Keep the permanent `tests/e2e/site-js-budget.spec.ts` collector with its automatic-request, served-root
   hash, example-count, cold-layout and error assertions.
2. **Six routes above the route remainder — decided, not waived.** `chart` 137 300, `code-block` 87 600,
   `date-picker` 57 400, `data-table` 54 100, `sidebar` 47 300 and `command` 41 700 B stay recorded as
   exceedances, and
   [ADR-027](adr.md#adr-027--route-remainder-exceptions-the-six-pages-whose-remainder-is-their-own-item)
   names each one an exception with its own measurement at `7990eba2`: the remainder is the closure of what
   the page mounts, and on four of the six that closure is the item's own static imports, so no example was
   worth deleting. The bar, its class and the collector are unchanged, so every sweep keeps reporting the
   six — the F03 run measured the same six and did not treat the page metrics as passed, and this decision
   does not either.
3. **Motion runtime union.** Kept at 48 000 B as a gate, not a reference: the shipped union compiles to
   44 207 B, 44 450 B with the site's `useInView`, and the import list is asserted against the source tree
   so the measurement cannot drift silently. A registry-only reference compilation still cannot certify
   bytes inside a mixed Next chunk; that separation is unchanged.
4. **Install addition.** Kept at 8 000 B for the item's own compiled code, where the population is
   0.2–6.8 KB and the limit binds at 85%, and moved to a per-id ratchet for the dependency-inclusive
   addition, where the population spans 0.3–201.2 KB because it is the wrapped engines. Dedicated
   dependencies stay counted. Use the audit's emitted import paths and source composition to locate a
   counted cost; source `bytesInOutput` explains a mixed file and cannot allocate its gzip to a package.
   A dependency-level fix must reach consumers through a supported release; an authoring-only
   `node_modules` patch or compiler override is diagnostic and certifies nothing.
5. **CLS.** Kept at 0.02, cold and interaction windows distinct, and now a hard gate wherever a suite
   measures it. `tests/e2e/document-interaction-layout.spec.ts` covers Button's
   composition/source/install/Toc path and Data Table filtering, pagination, selection, column visibility
   and record updates at two widths in all three modes. Extend coverage when a changed layout introduces
   another relevant window; retain raw entries and action times, including recent-input shifts. The
   measured worst cell is 0.000 55, and these bounded scenarios still do not certify other routes, themes,
   clocks or lifetime behaviour.
6. **Frames.** The ≥ 55 fps mid-range device criterion is unchanged and has no local collector, so it belongs
   to the acceptance run, which had no device and recorded it as **unmeasured**, not as failed. That run records
   environment and refresh metadata and main-thread cadence instead of presented frames; the desktop proxies —
   p95 interval, share of frames over 25 ms and the longest long-animation-frame entry — are labelled that way
   and never presented as frames. [#180](https://github.com/Linruoxin-Sy/cadence-ui/issues/180) attributed the two
   recorded exceedances instead of removing them. Re-measured on `c9e24430` (build `WlrzJ1Xt5BkqDAYYQMyoL`, 164 Hz
   idle cadence, three windows per width), `select` at 390 still crosses the block limit in two of three windows
   (152.8 and 158.7 ms against 150) and `dialog`'s frame share straddles its own: 0.69%, 0.92% and 1.15% at 390,
   0.69%, 1.15% and 0.92% at 1280 — three to five long frames around a limit of 4.3 in a settled window, which is
   the instrument's own ±1 tolerance and not a width effect. Neither is the entrance: the same 60–120 ms tasks run
   under `?motion=none` and `?motion=reduced`, with style and layout accounting for 1–8 ms of each. They are the
   shared derivation cascade a popup's mount perturbs — one mutation-observer delivery per text-presentation host on
   the route (113 deliveries inside a single `dialog` task, on a route that rests at 97 text parts), each re-reading
   its ancestor chain, plus the token-scope publish a route's first colour-owner probe triggers — so no `dialog` or
   `select` change moves either figure. Both
   proxies are still at or over their limits on this host, this entry records an attribution and not an acceptance,
   and the device criterion remains unmeasured. Desktop emulation and rAF frequency cannot close that requirement.
   [ADR-028](adr.md#adr-028--the-two-frame-proxies-and-the-device-criterion-no-exception-no-waiver) is the
   disposition ADR-026 requires, and it names **no exception**: the cause is a removable runtime cost, so both
   windows stay recorded as failures and [#189](https://github.com/Linruoxin-Sy/cadence-ui/issues/189) owns the
   work; it also fixes `frame-share` as the worst single route cell rather than a pooled share, and dispositions
   the device criterion as unmeasured and unwaived. Acceptance was not granted by F03 and this decision does not
   grant it.

   **The text half of that fan-out is measured, not argued.** The first slice of #189 replaced the per-host
   ancestor observers with one bus per document: a single delivery shares each node's computed-style read across
   every host that reacts to it, the host keeps its own observer for its subtree, and a stop that actually
   changes the document still invalidates the delivery. On 390, computed-style reads in the `dialog`/`select`
   click window fall from 2 348 to 884 and from 16 991 to 15 326; the remaining select reads are the token-scope
   publish below, which this slice does not touch. Same host, same protocol, two windows per width, baseline
   `152ef723` (build `7pjdp7ggYTI1jKAwvCP8v`) against `1d5f1239` (build `svc-i-N4YNx5pCX4k14Fy`): `select`'s
   longest block moves from 145.0/158.2 ms to 124.6/124.5 ms at 390 and from 130.2/126.4 ms to 122.9/122.0 ms at
   1280, and `dialog`'s share stays inside the instrument's ±1-frame band at 0.69–0.93% on both. Every window in
   that pair sits inside both limits, which is a measurement and not an acceptance: ADR-028's reopening clause
   expects a new ADR to record it. The token-scope slice and the shared `transitionrun` capture have landed
   since, but neither carries a recorded sweep of its own, so no number in this entry moved and it keeps
   reporting both proxies on every sweep.

Before adoption, reconcile the implementation with API/motion/SSR/accessibility/docs/distribution
contracts, current payloads and frozen snapshots. Reuse still-applicable tests; verify actual changed
paths, stop task-owned services and remove unused generated artifacts. Do not infer performance
acceptance from a successful build or unit suite.

## 9. Unscheduled and excluded work

AI expansion is unscheduled. First agree streaming ownership/state/cancel/retry, obtain and pin the
actual upstream sources and confirm the @shadcn/react install path. Candidate ids include Chat,
Prompt Input, Message Scroller, Message, Marker, Model Selector, Reasoning, Chain of Thought, Tool,
Task, Queue, Sources, Inline Citation, Plan, Confirmation, Checkpoint, Subagent, Terminal, Test Results,
Context, File Tree, Suggestion, Trace, Stack Trace and Questionnaire. This list is not a scheduled batch.

direction remains deferred. form is excluded because consumers own validation/state; native-select
is excluded in favour of Select; sonner is excluded in favour of Toast. MCP, a distributed agent skill,
additional AI-text endpoints, release automation and hosting are future decisions, not current tasks.
