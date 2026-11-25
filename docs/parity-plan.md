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
migration, its open items and the deferred performance work are in
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
but advisory under ADR-023; reassess appropriate v2 budgets after functional migration.

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

This historical source-budget mapping is advisory during migration under ADR-023, not an animation
permission table or immutable final v2 standard. It remains separate from compiled component, runtime
and complete-page budgets.

### 6.5 Acceptance

Preserve upstream/API/native semantics and the documented recipe contract. Required unit checks,
applicable actual browser/engine paths, SSR/noJS, keyboard/focus/axe and dual-theme visual review must
support the change. Source-tier checks do not prove the separate compiled/runtime/page budgets.
Behavioral/correctness failures and missing functional evidence block functional acceptance.
Numerical performance failures and missing performance measurements remain deferred governance work.

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

Three non-performance items stay open and are **not** delivered: #168 (Navigation Menu does not run its
declared shell size writer for a content revision inside one open panel), #165 (the hover-card matrix
probe asserts a pose and a CSS family its v2 recipe does not own, while the component matches its
declaration) and #169 (44 `motion-matrix` cells across ten blocks read the presence fade out of the
colour family, or match two `data-motion` spans; popover is evidenced as a probe mismatch and the other
blocks are counted, not yet adjudicated). F02's audited defects #155, #156 and #158 are closed; the F02
browser passes remain the record of what those audit slices exercised.

Follow [ADR-023](adr.md#adr-023--effects-first-migration-performance-governance-afterwards): effects
and full-library functional migration came first. Numeric source/compiled/runtime/page, FPS/CLS and
workload budgets stay advisory, not functional completion gates. Do not trim effects or require
repeated budget-only builds, page cost matrices or device performance acceptance. Preserve
correctness, native/API/accessibility, mode/cancellation/ownership and genuine source/action
evidence. The functional migration is complete apart from the three open items above; those stay open
until they are fixed or explicitly dispositioned.

S02/F03 follow full functional migration: assess the migrated system, justify suitable v2 budgets,
optimize and accept performance separately. References below and prior failed/missing results remain
source-bound inputs, not automatic final standards or passing evidence. Explicitly run collectors
retain raw values and protocols. Workload settings may change with finite-work and behavior/visual
evidence; keep no unbounded work/queues and exact semantic convergence.

1. **Historical complete-page initial JS ≤120000 bytes (advisory).** Resolve the remaining full-route cost with specifically
   scoped, measured work before final performance acceptance. This is not a prerequisite for shared
   capability development. The complete Button research baseline at source
   4fe1a51 was 221511 bytes; it does not authorize adopting that runtime or rolling out other routes.
   Keep all site functions, SSR/noJS and required Motion features. Repeat full-route measurement and
   functional/visual/a11y validation before asking for a product migration decision.
   Keep the permanent `tests/e2e/site-js-budget.spec.ts` collector and advisory comparison on complete Button and Data Table routes
   at desktop and narrow widths. Preserve automatic requests, exact served root hashes, complete
   example counts, cold-layout entries and browser/resource errors when evaluating a candidate.
2. **Historical initial Motion ≤48000 bytes (advisory).** Establish the actual required production runtime scope, including
   site-exclusive APIs. A registry-only reference compilation or proportional mixed-chunk estimate
   cannot certify the page metric.
3. **Historical compiled component addition ≤8000 bytes, shared runtime excluded (advisory).** Revalidate dedicated
   dependency and async boundaries with a declared baseline; local-only code passing is insufficient.
   Dedicated dependencies remain counted unless the budget contract is explicitly revised.
   Use the consumer audit's emitted import paths and source composition to locate counted costs.
   Retain static initial paths and reachable async output separately; source `bytesInOutput`
   explains a mixed file's contents and cannot allocate its gzip to individual packages.
   A dependency-level fix must reach consumers through a supported package release. An authoring-only
   `node_modules` patch or compiler override is diagnostic and cannot certify copied registry source.
4. **Historical CLS <0.02 (advisory).** Keep cold-load and interaction windows distinct. The complete-route regression in
   `tests/e2e/document-interaction-layout.spec.ts` covers Button's composition/source/install/Toc path
   and Data Table filtering, pagination, selection, column visibility and record updates at two widths
   in all three modes. Extend coverage when a changed layout introduces another relevant window;
   retain raw entries and action times, including recent-input shifts. These bounded scenarios do
   not certify other routes, themes, clocks or lifetime behaviour, and historical negatives retain
   their original source binding.
5. **Historical real midrange mobile ≥55 fps (advisory).** Obtain a debuggable device and environment metadata, collect real
   presented-frame traces through meaningful motion windows and retain reduced/none behaviour.
   Desktop emulation and rAF frequency cannot close this requirement.

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
