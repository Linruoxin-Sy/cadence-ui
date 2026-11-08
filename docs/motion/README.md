# Individual component motion contracts

Status: target design; implementation and verification pending.

Every component receives an individually authored animation design. The global visual style provides
direction: clear causes, readable content, restrained travel, responsive controls and coherent rhythm.
It does not prescribe one universal entrance, one duration for every component, or identical effects
on every part. The global execution contract remains mandatory: semantics, modes, ownership,
interruption, accessibility, compatibility and performance cannot be weakened by a local design.

The [animation system](../animation-system.md) owns those common rules. This directory owns individual
target choreography; [presets.md](presets.md) owns parameter assignments; the
[rollout plan](../animation-system-plan.md) owns implementation dependencies. ADR-021 records this
division. These files are current design specifications, not generated reports or proof of delivery.

## 1. Storage and authority

Use a central directory with separate files for separate components:

```text
docs/
  animation-system.md          shared visual guidance and mandatory execution contract
  animation-system-plan.md     pending migration and acceptance dependencies
  motion/
    README.md                 conventions and complete catalogue index
    presets.md                shared parameter assignments and override rules
    components/
      button.md               Button's target part-level choreography
      tabs.md                 Tabs' target part-level choreography
      ...                     exactly one file for each current registry UI/block id
```

Separate files make a component review local, keep ownership clear and avoid a single growing table
of thousands of action rows. Central discovery and one shared preset catalogue prevent scattered
design notes and duplicated constants. Do not create one file per animation phase or per part:
compound parts need to be reviewed together. Registry blocks also have their own file because they
coordinate inherited component effects. The index follows current registry ids; families aid navigation
only and never become another animation tier.

| Location                                  | Authoritative content                                                   | Must not claim                                     |
| ----------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------- |
| `docs/animation-system.md`                | Shared execution rules, recipe contracts and visual guidance            | Every component must look identical                |
| `docs/motion/presets.md`                  | Target token assignments, preset scope and override precedence          | New runtime exports already exist                  |
| `docs/motion/components/<id>.md`          | Target parts, six capabilities, actions, modes, interruption and bounds | A planned effect is already installed              |
| `docs/animation-system-plan.md`           | Implementation sequence and unresolved acceptance                       | Design approval is runtime completion              |
| `content/components/<id>.mdx`             | Actually shipped usage and Motion contract                              | Pending design as current user capability          |
| `registry.json`, shipped source and tests | Implemented declarations and evidence                                   | A design binding is a new recipe or metadata field |

Keep one source for each decision. A component may refine global visual defaults through a documented
preset, but may not override the mandatory execution contract. If a local design requires a new
property, engine or exception, revise the owning shared contract explicitly before implementation.
The baseline engine notes in the animation system describe delivered behavior, not a second target
that forbids an individually documented v2 capability. Existing engine/API ownership still applies.

## 2. Required structure of each component file

Each file names actual exported parts or internal visual regions of those parts. An internal
`<id>.<part>.<phase>` binding is a design identifier, not a newly exported component, prop or data-slot.
The current source/manifest establishes the public surface. A proposed helper or visual region is
identified as internal and cannot change `render`, refs, event semantics or DOM validity.

1. **Intent and scope:** describe the component's characteristic motion and the actual parts it owns.
2. **Capability ownership:** assess all six baseline capabilities individually, including the cause,
   responsible part and relationship. Split a row when different parts have different relationships.
3. **Choreography and modes:** for each action, identify its trigger/owner, full/reduced/none outcomes,
   and a binding to a named preset and recipe/form. Do not leave reduced/none to an unspecified default.
4. **Interruption and lifecycle:** cover rapid revisions, reversals/reopen, close/unmount, direct input,
   live modes and zero clock, including the relevant engine's cancellation responsibility.
5. **Geometry and performance:** state animated axes, measured natural content, geometry constraints,
   text reflow policy, clipping scope and bounded work specific to the component.
6. **Acceptance scenarios:** record meaningful behavior to prove during implementation. These are
   intended checks, not assertions that tests have run or performance has passed.

Review the connection between those sections, not just their presence. Every default capability
must resolve to an action row and binding; an inherited/composed capability names its actual owner
and the reference contract, without claiming a second local implementation. Conversely, every action
must have a semantic cause, permitted properties, a preset/recipe form and all three mode outcomes.
A binding anchor must cover every public part named in its action, including internal regions
hosted by that part. A prose mention alone does not connect an omitted label, badge, submenu or
backdrop to its controller. Grouped colour bindings name distinct regions or one shared controller:
two bindings on the same item's colour property are not made safe by choosing the same preset.
Structural roots/providers/portals and pass-through compositions may delegate, but their painted
accessories still need an explicit owner. Inherited bindings keep the dependency's exact preset/form
unless the local contract declares an override at that same owner.

Optional geometry needs a concrete safe/immediate fallback; "animate if possible" without a rule is
not a complete design. Bindings with multiple possible recipe forms must select the one actually
designed for that part. Do not treat an index/filename check as a semantic conformance review.

Every action table spells out `binding -> preset -> recipe/form`, including inherited actions and
named native engines. Multiple bindings in a cell are distinct part/property responsibilities, not
permission to combine alternative recipes on the same writer. Repeated references to one binding
must keep the same preset/form. A local action may narrow a preset's optional properties; it cannot
quietly widen them. In particular, an opacity-only `presence.surface` action never implies scale.

The six rows are Appearance, Size, Surface colour, Text colour, Changed text and Changed numbers.
An action such as selected-indicator movement, chart interpolation or a direct gesture can add rows
in the choreography table; it does not substitute for evaluating the six baseline capabilities.

| Relationship   | Meaning in these target contracts                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Default        | An applicable ordinary API/content change receives the effect after migration without extra animation wiring              |
| Inherited      | A named parent/part/dependency already coordinates the same event; this part supplies no duplicate writer                 |
| Composed       | Caller-authored rich content or an explicit additional effect uses a documented helper/composition; identify the boundary |
| Not applicable | This part lacks that semantic event, or the animation would violate native operation; state why                           |

Do not turn every built-in label into composed behavior. Known owned plain strings and supported direct
numeric display values integrate the shared helpers by default. Mixed JSX, rich content, links, render
callbacks and external labels retain their structure and opt into explicit composition. Numeric-looking
strings, dates, code, identifiers and OTP characters are not counters. A genuinely absent numeric part
does not justify inventing one or exempting the rest of the component.

### 2.1 Internal reference schema

Each file has a `## Contract references` section with one `json motion-contract` fenced block.
Its JSON object records `schema: 1`, `target: "motion-v2"`, `migration: "legacy"` and `parts`.
`parts` maps each binding's middle segment to one or more `component-id#Export` anchors. These anchors
identify actual public parts containing the designed internal region, not new exports or wrappers.
External anchors must be declared registry dependencies and have their own catalogue contract.
For example, Button's `feedback` and `label` regions both anchor to `button#Button`; the inherited
Button Group separator anchors to `separator#Separator`.

The capability table's References column uses semicolon-separated `default:`, `inherited:`,
`composed:` and `not-applicable:` clauses. Effect references name action bindings. `@part` identifies
a native/inherited/composed boundary at a real exported part; it does not assert a local animation.
Default effects must reference an action, while not-applicable cases reference parts and explain why
in the ownership column. A default effect needs a local integration anchor; a foreign-only owner
cannot be relabelled default. Mixed responsibilities stay separate: ButtonGroupText's surface is default,
Separator's rule colour is inherited, and that rule never satisfies the Text colour row. Rich-child
boundaries supplement built-in text/number defaults rather than replacing them. Prose retains the
specific cause, conditional parent ownership, property subset, caller boundary and immediate fallback.

Every action chain ends with one exact `recipe/form` reference from the preset table's Target forms
column. Those are internal target forms, **not** `meta.motion` objects or the installed `MOTION_FORMS`.
Colour forms distinguish surface, foreground and their coordinated combination; native forms name
the actual engine. The mode columns remain Full, Reduced and None; zero recipe time is a separate
clock decision governed by the shared contract, never an alias for None.

`scripts/motion-targets.mjs` parses real Markdown tables, validates inventory/index against current
registry UI/block items, checks value-export anchors, capability/action edges, exact preset forms,
duplicate bindings and required modes/lifecycle/bounds/scenarios. It rejects unfinished scaffold
placeholders. This proves reference closure, not that prose is true, properties have one live writer,
measurements are safe or an animation passes runtime/performance acceptance. Review every part and
conditional relationship manually; a matching recipe alone does not establish semantic applicability.

Migration is explicit and fail-closed. `legacy` keeps all installed manifest, MDX, intensity, source
budget and successful runtime-helper gates. Missing/unknown markers fail; `v2` currently fails because
the stricter runtime observer, public docs and intensity enforcement have not landed. The marker is
internal to this design file, is never copied into registry payloads, and cannot waive existing checks.
Later shared support must enable stricter evidence before any item changes to `v2`; per-item source,
metadata, user docs and tests must then migrate together. Inventory comes from the registry, so adding
the planned primitives will require contracts without changing a hard-coded count.

## 3. Common execution obligations

These obligations are inherited by every file; local action tables make their concrete outcome clear.

- **Presentation:** SSR, hydration and no-JS content starts readable. Ordinary initial rendering does
  not replay a hidden entrance. Later insertion/opening can animate. Parent presence consumes the same
  entrance cause, not later child updates. Decorative viewport reveal is explicitly composed and follows
  its own once/repeat contract; no component secretly scans descendants or re-hides the first screen.
  Focus, activation and find reveal also settle an ordinary entrance when it would conceal or displace
  the active target. Default autofocus keeps its original timing; only conflicting entry envelopes
  settle, while an independent backdrop may continue. Preserve semantic resting opacity rather than
  resetting every root to opacity 1.
- **Modes:** full plays the designed action. Reduced keeps permitted short opacity/colour feedback,
  removes travel/scale/layout/reels/stagger and loops, and shows final geometry/numbers immediately.
  None settles every property, delay and loop immediately. Direct operation and semantic state remain
  available in every mode; required placement transforms are not decorative animation.
- **Content identity:** only changed graphemes or safe shaping runs receive replacement effects;
  unchanged content survives and may move to make room. If safe diff/shaping or bounded work fails,
  update affected content immediately. A single changed character never licenses a whole-label replay.
  Final accessible/copyable text is current immediately; outgoing visuals do not duplicate semantics.
- **Ownership:** one writer per animated property and one measured owner per size axis. An ancestor
  does not chase a child's interpolated size. Parent/child geometry either shares a committed destination
  or delegates that cause to one host. Press/reveal/layout cannot independently overwrite one transform.
  Known compound parts share an internal semantic revision/owner scope; they do not infer causality
  from resize timing or scan arbitrary descendants. Unknown caller layout falls back to native layout.
- **Input:** native editing, IME, caret, selection, undo, autofill, pointer and keyboard semantics stay
  immediate. Loading, validation, selection, focus, disabled/error/success and accessible names do not
  wait for animation. Do not invent minimum status intervals, auto-dismissal, inertia or application data.
  Keep native intent/lifetime timers separate from presentation clocks: none/zero removes animation
  delay, not Tooltip intent delay or Toast lifetime/pause behavior. Do not multiply either by timeScale.
- **Interruption:** latest committed revision wins; do not queue intermediate updates. Retarget from
  the current presentation and preserve velocity only for reviewed continuity recipes. Reopen invalidates
  the previous exit completion. Unmount cancels handles, observers, listeners and queued writes. Live
  reduction settles disallowed spatial/layout/reel work before paint; none cancels every authored
  effect. A zero recipe clock settles recipe work, not the separate continuous theme clock. These
  rules apply even when the semantic target did not change; returning to full does not replay consumed
  transitions. Reduced and none stop continuous loops regardless of that theme clock.
  Mode/clock changes do not end a live native gesture or discard its pointer capture. During direct
  operation the input owns the current target; after release, permitted settling follows the mode.
  Zero timeScale changes timing, not the mode's target: a held full-mode press snaps to its press
  scale and releases instantly; reduced/none have no decorative press scale. Do not clear the native
  held state merely because its presentation clock becomes zero.
- **Exit semantics:** a surviving owner may retain an outgoing visual, never an obsolete actionable
  item. Base UI retains modal/focus/portal lifecycle ownership until its native exit protocol completes;
  do not release modality early or resurrect a closed surface from a stale callback. Removal outside a
  surviving owner may be immediate; animation does not require changing the public unmount contract.
- **Geometry:** only known content/expansion/explicit size revisions interpolate. Passive viewport/font
  reflow and unknown resize causes resolve immediately. Native dragging is 1:1. Observe natural content,
  size a separate host, clamp rendered values, keep text unscaled and remove temporary clipping after
  settling. Preserve focus outlines, portals, upstream sizing defaults and caller overrides.
  Destination-width layout must not introduce extra cropping of a required label, caret or active
  control while the shell is smaller. Use valid existing overflow or settle that axis immediately.
  Explicit disclosure body reveal remains allowed; focus into clipped content forces it visible.
- **Bounds:** preserve existing item source ceilings, compiled component/runtime/page limits, CLS and
  real-device frame-rate requirements. Stagger scenarios allow at most 20 concurrent moving elements
  and 400 ms total delay after timeScale; character stagger also has a final 120 ms delay ceiling after
  timeScale. Automatic collection presence/layout uses the
  [participant bound](presets.md#52-shared-work-limits), determined before per-member measurement or
  copy allocation; retained moving siblings and still-active earlier revisions count. A whole-group
  envelope does not count every descendant. Oversized sets use immediate native presentation; a
  manual/paginated/virtualized composition needs its own bounded adapter and evidence, not an exemption.
  Bound glyph/reel work and drop visual work on overload, never data.
  The [renderer limits](presets.md#52-shared-work-limits) apply across one known
  coordinated content revision as well as per slot. Many tiny children cannot bypass the moving-set
  budget. A hidden owner cancels visual work and resumes at current content, not a queued backlog.

### 3.1 Cancellation, environments and renderer ownership

The shared colour/loop hooks provide staged execution support. Their managed ref must reach the
actual HTML/SVG owner, including delayed portals and render replacements. Colour palettes require
verified intermediate readability or immediate fallback; focus/invalid paint is immediate. Shared
policy evidence does not enable a component `v2` marker while text/number and per-item gates remain
pending. See [colour adoption](../animation-system.md#35-colour-feedback).

These rules cover every catalogue file and belong to the shared executor acceptance, not 59 private
implementations. Each controller is scoped to its actual part and committed semantic revision. Only
committed changes start work: discarded/concurrent React renders and development effect replay must
not create entrances, duplicate observers or consume a reveal. Cleanup is idempotent and restores only
the styles/listeners/engine hooks owned by that controller; never cancel every animation on a node or
erase caller/native transforms. An old completion can release only its own handles, not the new writer.

Async fallback/recovery uses the [committed-change contract](../animation-system.md#coordinating-one-committed-change):
readiness is not a synthetic origin or a reason to replay hydration. A surviving region may own the
actual content replacement, while newly available child displays start from their exact current value.
Measured targets also inherit the [constraint validity rules](../animation-system.md#34-measured-size-and-position);
scrollbar or responsive-constraint changes invalidate the affected destination without creating another
content revision. Component acceptance must exercise these conditions where it hosts asynchronous or
wrapping content, rather than certifying only a fixed-size synchronous fixture.

Invalidate the owner lifetime before disconnecting observers or invoking disposal that can call back
into the component. Queued observer deliveries, animation frames, microtasks, image completions and
native-engine callbacks must check both their registration lifetime and the applicable committed
revision before writing or cancelling anything. Disconnecting a resource alone is not evidence that
an already queued callback cannot run. A shared ref pointing at a new node does not transfer the old
callback's authority; reusing the same node for another semantic entity does not preserve it either.
Distinguish that visual lifetime from a caller's ref registration. A new callback/object ref on the
same actual node, with the same semantic identity and target, only hands off the external registration:
release the old ref according to its supported cleanup contract and attach the new ref exactly once.
It does not restart presence, settle a legal flight, reset velocity or consume a new content revision.
An ordinary inline ref can change on every render. Old registration cleanup must not detach the new
registration or cancel the continuing visual owner. Actual node replacement or an explicit semantic
identity change does revoke the old visual authority and establishes the new owner's current baseline.
Do not infer that identity change from ref, event-handler or render-function identity alone.
Content helpers also apply the [semantic slot boundary](../animation-system.md#36-changed-text):
reusing a popup/display node for a different known trigger or record establishes a new baseline,
while an ordinary same-entity edit retains its changed units. Host continuity alone cannot authorize
a reel between unrelated quantities; the component's declared cause remains authoritative.
Recheck authority after a caller/native callback that can synchronously close, replace or unmount the
owner. This guards decorative work, not permission to suppress the primitive's required semantic
callbacks. Acceptance must include a retired delivery after replacement and after close/reopen,
with the new owner's current animation and native interaction still intact.

For the affected property, teardown or an accepted close invalidates subordinate work; direct input
and focus take precedence over decorative geometry; a passive environment change invalidates stale
measurements; only then may a current content/value revision animate. Mode and clock restrictions
apply to the surviving owner. This is property-level arbitration, not a global serial queue or a rule
to swallow a native input event. Ongoing retained exits still complete through the actual primitive.

Cancellation follows the affected surface/property, not every part of a compound component. Closing
a popup cancels its subordinate content work and starts its owned exit; a still-mounted, visible
trigger keeps its independent label, quantity and colour revision. Likewise, an activated native
navigation has the connected destination/scroll-host lifetime specified by its adapter, rather than
the visibility of the control that originally triggered it. Unmount or an actual enclosing close
still invalidates work owned by that boundary. Local contracts must distinguish these cases instead
of using an unqualified "close cancels all" rule.

Forced-colours and print use the current semantic paint/layout without decorative interpolation;
do not set forced-color-adjust:none to preserve a designed colour tween. Native focus/selection and
closed-state visibility remain intact. Printing does not open closed popups/disclosures. Document
visibility loss or page suspension cancels one-shot work and pauses eligible loops; restoration,
including a persisted page, establishes current layout before any new revision and never replays
missed changes. A currently active full-mode status loop may resume under its existing visibility
policy with a fresh theme-clock phase, not an old paused phase or an entrance replay. Share these
environment signals rather than installing document listeners per component.

User render/class/style overrides keep their compatibility contract. If a custom layer, table/SVG
structure or caller animation makes a safe property owner unavailable, keep exact native content and
settle the conflicting effect immediately; record the composed boundary. Do not silently insert a
wrapper that breaks direct-child selectors, refs, form/label semantics or event propagation. A nested
explicit provider and portalled part use their resolved context; cancellation must not leak across
those ownership boundaries. Shared renderer selection follows the deterministic type/identity rules
in [changed text](../animation-system.md#36-changed-text): preserve existing content/placeholder/falsy
branches and typography before selecting helpers for actual display slots. Built-in numeric helpers
preserve the existing display format, with exact immediate output when safe decomposition fails;
see [numeric formatting decisions](presets.md#51-numeric-identity-and-formatting-decisions).

Retained native presence is distinct from a decorative copy. A primitive's supported keep-mounted or
prevent-unmount policy may leave its original closed subtree connected after its visual exit; preserve
that policy's visibility, focus and completion semantics. Do not force removal, synthesize a completion
at an assumed deadline or require a callback that the native policy defers until actual unmount.
Any additional visual copy follows the [paint-only retention contract](../animation-system.md#33-presence-and-composition),
including DOM ids, form participation and resource/effect lifetime, not only focus and accessibility.
Natural-size measurement follows the [single real content-tree rule](../animation-system.md#34-measured-size-and-position).
If safe paint retention or an exact natural destination is unavailable, omit only that effect; never
duplicate a caller subtree or alter its mount policy to make a design binding executable.
When comparing caller-owned animation handles, require continuity only while the same actual host
survives. Native removal legitimately ends that host's animations; reopening on a new node establishes
new handles. An infinite caller animation is not an extra Cadence exit hold, and must not be cancelled
merely to manufacture completion. The existing primitive decides which native work its lifecycle awaits.

Ordinary caller layout, colour and typography customisation does not by itself make an animation
owner unavailable. The same rule applies when an existing `className`, `style` or `render` callback
supplies that customisation. Resolve the actual part and its evaluated properties; a nonempty class
name or a function-valued prop is not evidence of a conflicting animation. Keep eligible default
presence and other disjoint effects. Yield only the conflicting property or indivisible CSS family
when safe composition is unavailable, without disabling the entire component or changing caller
callbacks, refs or invocation semantics. None and zero cancel library work; they do not license an
inline `transition: none` or blanket cancellation that destroys an independent caller/native writer.
The [preset binding rules](presets.md#4-selection-overrides-and-effective-clocks) define the exact
clock/property comparison boundary; unresolved ownership is a local fallback, not a global opt-out.

Direction, writing mode, zoom and font/viewport changes are environment revisions, not navigation.
Invalidate old rectangles/approach direction and establish current valid placement before another
content action; preserve any live native input. A logical-axis or shaping layout the adapter cannot
support uses immediate geometry/text instead of assuming horizontal Latin layout. Existing explicit
orientation/size state actions keep their individual contracts, with passive reflow taking precedence
when the old coordinate frame becomes invalid.

The [position coordinate contract](../animation-system.md#34-measured-size-and-position) distinguishes
common-ancestor scrolling from a changed source/destination mapping. Review local selection markers,
projected rows and portalled handoffs separately: a valid local path need not stop when the page scrolls,
but stale cross-space endpoints cannot keep flying. No correction may seize native scroll control or
replay a consumed label update. The [retained-paint contract](../animation-system.md#33-presence-and-composition)
also excludes decoration from scroll extent, anchoring and snap targets, not just natural sizing.
Measure the real scroll range during replacement/exit and after cleanup; an accessibility-hidden,
absolutely positioned copy is not automatically layout-safe.

Geometry acceptance includes the resting layout after an animation releases its temporary constraints,
not only the last animated frame. Follow the [size and transform ownership rules](../animation-system.md#34-measured-size-and-position)
for natural versus unknown zero dimensions, current caller sizing and CSS individual transform channels.
Check cancellation after a caller changes its dimensions or placement as well as ordinary completion;
old cleanup must not restore obsolete styles. A nested mode controls that child's own writers, not
an ancestor envelope. The [scope rule](../animation-system.md#6-three-layer-strategy-for-reducing-motion)
applies to inherited entrances and coordinated parent/child layout throughout the catalogue.

### 3.2 Instance isolation and terminal paths

All catalogue actions inherit the system's
[runtime identity and terminal-presentation contract](../animation-system.md#runtime-identity-and-terminal-presentation).
A binding is reusable design vocabulary, not a global live animation id. Review at least two sibling
instances and a nested independent instance using equal values/labels under one provider, including
portalled parts. Reversing, closing, replacing or reducing one owner cannot retarget or finish another.
Known parent/child coordination and aggregate work limits remain shared for their actual transaction;
isolation does not permit one moving-set allowance per child.

For every presence/indicator/geometry action, include a terminal path with no actual interpolating
property and a cancellation before its first frame. A positive preset clock alone does not ensure an
end event. Current native visibility, focus, mount policy and dimensions must resolve without an
animation-only wait. Deliver a retired completion and a child's unrelated transition event afterwards:
neither may release the current owner or change semantics. This extends each component's acceptance
scenarios; it does not require changing its chosen preset or adding a public completion callback.

## 4. Parameter and choreography review

The system's timing table is a default vocabulary. A Tooltip can select a faster popup preset than a
Dialog, and an inline label can select a different size spring than a panel. That choice belongs in the
component binding and the shared [preset catalogue](presets.md), not in a component-local literal.
Changing a shared preset requires reviewing its consumers; changing one component binding need not
change other components. Keep direction, identity and measured targets contextual; do not encode an
application's business state in a preset.

Read a mode cell as the outcome after the shared state/environment constraints, not a guarantee that
its preset always runs. In particular, a row grouping hover, focus, invalid and theme changes must
distinguish the immediate focus/invalid owner from eligible colour transitions. Apply the
[colour-owner precedence](presets.md#31-effective-modes-and-clock-ownership) to the actual part;
sharing one preset across parts does not make them one owner. Acceptance must include gaining focus
or becoming invalid during an existing colour flight, as well as an unrelated owner that may keep
animating. A complete reference table cannot prove either behavior.

For text over an independently painted or moving selection surface, review the actual intermediate
combination, including immediate focused foreground against a still-moving plate or background.
The [rendered-colour rule](../animation-system.md#35-colour-feedback) may require immediate placement
without cancelling unrelated feedback. Check display applicability as well as child type: inherited
editable contexts stay native, and filter/scrub-derived readouts stay immediate even when accepted
later. Their rules live in [changed text](../animation-system.md#36-changed-text) and
[changed numbers](../animation-system.md#37-changed-numbers); component tables refine those gates.

Review live mode changes against the action's mode cells as well as its initial render. Reduction
cancels spatial/layout/reel work and loops, then resolves any still-applicable short opacity/colour
feedback through the reduced policy. It is not a blanket None branch. A same-target zero clock must
cancel recipe work, while a positive-to-positive clock change follows the
[executor clock policy](presets.md#31-effective-modes-and-clock-ownership), not an invented semantic
revision. Add an interruption scenario wherever a local cancellation rule could otherwise erase
these distinctions. First appearance of a display slot establishes its exact content baseline;
numeric replacement applies only to later applicable value revisions, not an invented count from zero.

Review request/commit correspondence under the
[shared cause rules](../animation-system.md#coordinating-one-committed-change). Include a rejected
request, an equal-value rerender during a flight, batched versus separately committed A → B → A,
and delayed controlled direct-input echoes where relevant. Compare accepted native reset/restoration
with a cancelled reset; neither may create a synthetic change/completion callback. An ordinary
unrelated update must still animate when eligible. Missing provenance uses the declared immediate
fallback, not a guessed timeout, a permanent suppression flag or a motion-owned application queue.

Check external ref handoff separately from node/entity replacement: the former preserves an eligible
in-flight animation, while the latter rejects retired writes. Check inherited bindings against the
dependency's actual part, preset and property subset, not just against the global list of valid names.
A deliberate composition override must state the original assignment, replacement, cause and same
owner; the structural reference checker alone cannot distinguish that override from accidental drift.

Review sequencing with independently overridden preset clocks, not just factory durations. A promise
such as "fade before clipping" needs a geometry-based eligibility/fallback rule; a faster nominal fade
is not synchronization. Check opening while content changes size, a reversal before that fade finishes,
and a zero or reduced clock while paint waits for usable space. No pending reveal may expose a now
closed region. Follow the system's physical/logical dimension rule when reviewing ratio, orientation
and writing-mode changes. Treat vague frequency or list-limit language through the exact
[shared work limits](presets.md#52-shared-work-limits), without turning a one-shell measurement into
an all-row measurement requirement or assigning an undocumented numeric cutoff.

Local contracts may coordinate outgoing visuals, incoming visuals and geometry without delaying the
semantic commit. Distinguish visual sequencing from delaying an actual action. In particular, replacement
labels do not wait for a success animation, filter results do not wait for old rows to fade, and a
closed/reopened panel keeps the actual current focus owner. Single-active-item indicators may be shared;
multi-select controls retain independent selected states rather than forcing a single moving pill.

## 5. Catalogue

The following 59 files cover the current 57 UI items and two blocks exactly once. All describe the
target, with implementation and verification still pending. The four planned animation primitives
are specified in the system/rollout documents and are not added to this existing-catalogue count.

| Family                        | Individual contracts                                                                                                                                                                                                                                                                                     |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actions and groups            | [Button](components/button.md), [Button Group](components/button-group.md), [Toggle](components/toggle.md), [Toggle Group](components/toggle-group.md)                                                                                                                                                   |
| Inline structure              | [Badge](components/badge.md), [Kbd](components/kbd.md), [Label](components/label.md), [Separator](components/separator.md)                                                                                                                                                                               |
| Editing and fields            | [Input](components/input.md), [Textarea](components/textarea.md), [Input OTP](components/input-otp.md), [Input Group](components/input-group.md), [Field](components/field.md)                                                                                                                           |
| Surfaces and identity         | [Card](components/card.md), [Aspect Ratio](components/aspect-ratio.md), [Avatar](components/avatar.md), [Item](components/item.md), [Empty](components/empty.md), [Alert](components/alert.md)                                                                                                           |
| Selection and progress        | [Checkbox](components/checkbox.md), [Radio Group](components/radio-group.md), [Switch](components/switch.md), [Slider](components/slider.md), [Progress](components/progress.md)                                                                                                                         |
| Ongoing feedback              | [Skeleton](components/skeleton.md), [Spinner](components/spinner.md)                                                                                                                                                                                                                                     |
| Overlays                      | [Dialog](components/dialog.md), [Alert Dialog](components/alert-dialog.md), [Popover](components/popover.md), [Tooltip](components/tooltip.md), [Hover Card](components/hover-card.md), [Sheet](components/sheet.md), [Drawer](components/drawer.md), [Toast](components/toast.md)                       |
| Menus and search              | [Select](components/select.md), [Combobox](components/combobox.md), [Dropdown Menu](components/dropdown-menu.md), [Context Menu](components/context-menu.md), [Menubar](components/menubar.md), [Command](components/command.md)                                                                         |
| Disclosure and navigation     | [Accordion](components/accordion.md), [Collapsible](components/collapsible.md), [Tabs](components/tabs.md), [Navigation Menu](components/navigation-menu.md), [Sidebar](components/sidebar.md), [Toc](components/toc.md), [Breadcrumb](components/breadcrumb.md), [Pagination](components/pagination.md) |
| Data and dates                | [Table](components/table.md), [Data Table](components/data-table.md), [Calendar](components/calendar.md), [Date Picker](components/date-picker.md), [Chart](components/chart.md)                                                                                                                         |
| Viewports and manipulation    | [Carousel](components/carousel.md), [Scroll Area](components/scroll-area.md), [Resizable](components/resizable.md)                                                                                                                                                                                       |
| Files, conversations and code | [Attachment](components/attachment.md), [Bubble](components/bubble.md), [Code Block](components/code-block.md)                                                                                                                                                                                           |

## 6. Maintenance and migration

Read the component file before changing its animation. Update target decisions here first, then use
the rollout phase to implement the shared dependency and actual parts. At delivery, update registry
declarations, public MDX, previews and evidence together. Keep the internal contract as the maintained
design; use Git history for completion records, not a second delivery log in this directory.

A new catalogue component needs its own file and index entry before motion implementation. A new
exported part is assessed within its component file. Do not silently rename a file independently of
its registry id. The scaffold and target checker enforce the internal references described in §2.1;
runtime implementation, semantic review and performance acceptance remain separate obligations.
Temporary review reports belong in `.cache/`, not in this directory.
