# Popover motion contract

Status: functionally migrated to v2. Browser matrix, a production build and performance governance remain
deferred under ADR-023.

The panel appears to belong to its anchor, then grows only when its owned content changes. Collision correction
remains immediate and authoritative. This contract inherits the [common contract](../README.md) and
[presets](../presets.md); bindings are design references, not recipe IDs or public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "parts": {
    "content": ["popover#PopoverContent"],
    "position": ["popover#PopoverContent"],
    "title": ["popover#PopoverTitle"],
    "description": ["popover#PopoverDescription"],
    "surface": ["popover#PopoverContent"],
    "foreground": ["popover#PopoverTitle", "popover#PopoverDescription"],
    "quantity": ["popover#PopoverTitle", "popover#PopoverDescription"],
    "body": ["popover#PopoverContent"]
  },
  "regions": {
    "content": ["popover-content"],
    "position": ["popover-positioner"],
    "title": ["popover-title-text"],
    "description": ["popover-description-text"],
    "surface": ["popover-content"],
    "foreground": ["popover-title", "popover-description"],
    "quantity": ["popover-title-number", "popover-description-number"],
    "body": ["popover-content"]
  },
  "axes": { "content": ["width", "height"] }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                                                                                                                                                    | References                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Appearance      | Default: `popover-content` owns anchor-relative presence on its own visual layer; header/title/description and initial children inherit it. Base UI still owns mounting, positioning, focus and unmount completion.                                                      | default: `popover.content.enter`, `popover.content.exit`                         |
| Size            | Default: content shell owns natural width/height changes within positioning and viewport constraints. Base UI retains anchor placement.                                                                                                                                  | default: `popover.content.resize`                                                |
| Surface colour  | Default: content owns background/border tokens and its scoped shadow; composed controls own their own state surfaces.                                                                                                                                                    | default: `popover.surface.colour`                                                |
| Text colour     | Default: `popover-title`/`popover-description` own foreground changes; body children keep explicit owners.                                                                                                                                                               | default: `popover.foreground.colour`                                             |
| Changed text    | Default for primitive title/description: replace changed runs only. Rich content is composed, not recursively split.                                                                                                                                                     | default: `popover.title.change`, `popover.description.change`; composed: `@body` |
| Changed numbers | Default for a directly supplied supported numeric quantity in Title/Description: the owned display slot uses compact reels. Strings remain text; codes, dates and numeric identities are not parsed. Composed for body quantities inside rich children/render functions. | default: `popover.quantity.change`; composed: `@body`                            |

`surface.colour` addresses the content shell and `foreground.colour` addresses title and description as separate
regions: one physical writer each, never a combined writer that paints a region it does not own. Actual DOM
focus/focus-within or a region's own invalid state cancels that region's colour clock and settles its declared paint
immediately; an independent region retains its own clock. Other colour interpolation requires a verified readable
palette. This does not cancel disjoint presence, text or geometry owners.

## Choreography and modes

| Trigger / owner                                                | Full                                                                                                                                                                           | Reduced                                                      | None                            | Binding → preset → recipe/form                                                                                                                   |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Open / content visual layer                                    | Opacity and `distance.xs` approach along resolved side, using the anchor origin. Entry is subject to the actual-focus gate below.                                              | Short opacity only. Entry obeys the same focus gate.         | Final open surface immediately. | `popover.content.enter` → `presence.popup` → `popup.anchored/presence`                                                                           |
| Close / same visual layer                                      | Opacity exit only, without moving the anchor.                                                                                                                                  | Short opacity only.                                          | Closed target immediately.      | `popover.content.exit` → `presence.exit` → `exit.fade/opacity`                                                                                   |
| Intentional content change / shell                             | Measured, clamped natural width/height transition.                                                                                                                             | Final geometry immediately.                                  | Final geometry immediately.     | `popover.content.resize` → `geometry.compact` → `geometry.resize/measured`                                                                       |
| Collision flip/anchor movement / positioner                    | Placement corrects immediately; cancel obsolete approach direction.                                                                                                            | Immediate.                                                   | Immediate.                      | `popover.position.place` → `engine.native` → `native/base-ui-popover`                                                                            |
| Title/description change / text owner                          | Retain unchanged graphemes; `stagger: none`.                                                                                                                                   | Changed-run opacity only.                                    | Final text immediately.         | `popover.title.change` → `text.replace` → `text.change/changed-runs`; `popover.description.change` → `text.replace` → `text.change/changed-runs` |
| Supplied tokens / surface and foreground parts                 | Scoped background/border/shadow transition on the panel and foreground transition on title/description. Colour eligibility and immediate-owner priority follow the rule below. | Short colour feedback. Colour obeys the same owner priority. | Final colours immediately.      | `popover.surface.colour` → `state.color` → `state.color/surface`; `popover.foreground.colour` → `state.color` → `state.color/foreground`         |
| Direct numeric Title/Description revision / owned display slot | Roll changed places only; the same slot never also runs text replacement on its formatted digits.                                                                              | Final number immediately.                                    | Final number immediately.       | `popover.quantity.change` → `number.compact` → `number.roll/reels`                                                                               |

The panel's own visual layer writes opacity and one short transform; Base UI's positioner keeps its x/y coordinates,
`--transform-origin` and the available width/height it measures. `sideOffset`/`alignOffset` are never interpolated, so
no Cadence action competes with native placement.

## Interruption and lifecycle

The existing Base UI default normally focuses a tabbable child or the popup itself. When that actual focus target would
be faded or displaced, settle the popup's entrance before presenting focus; a default open may therefore omit
decorative panel entry. Do not change `initialFocus` or defer focus to force motion. An existing caller policy that
keeps focus elsewhere can retain entry until an interaction reaches this surface.

- Base UI owns open state, positioning and focus. Typing/selection inside the popover is immediate; no child entrance delays readiness.
- Reopen reverses the existing boundary. During close, cancel local resize/text work and let only presence finish; new content is semantically current without a second entrance.
- If the anchor disappears, follow Base UI lifecycle rather than retaining a floating orphan. Repositioning during resize cancels obsolete geometry targets where they violate available space, and a resolved-side change cancels the obsolete approach direction instead of travelling across the flip.
- Live reduced cancels spatial/size changes; none and zero clock settle placement, dimensions and content and complete the current exit through Base UI's actual protocol, without an animation timer hold or premature focus/modality release. Unmount releases observer and presence resources. Native input remains operable in every mode.
- Async content received while closed is current on the next open without replaying hidden updates. Collision flips, anchor removal or a new open revision invalidate obsolete direction/size/exit completions; caller `render`, refs and positioning defaults remain authoritative.

Dispatch a direct Title/Description string to the text owner and a supported direct numeric quantity to the numeric
owner; changing renderer type establishes an immediate baseline. Rich Title/Description children and formatting
callbacks retain their composed owners; the separately anchored body boundary delegates to its actual child display
components rather than running the title controller over body content. Screen-reader-only content updates
immediately. Use one slot transaction under the popup's existing size owner and aggregate text/reel limits; no new
counter prop, parser, countdown or inferred application state is added.

## Geometry and performance

- Separate Base UI positioner coordinates from panel visual transform and measured shell size. Never animate `sideOffset`/`alignOffset` or interpolate across a collision flip.
- One natural-content observer and shell writer. Clip only the size-changing interior; focus rings and descendant portals remain usable.
- Lay text at final target width, measure its natural height, then animate the shell around that final layout; no continuous rewrapping through intermediate widths. Passive font/viewport reflow settles immediately.
- One surface and bounded text transactions per open popover; nested controls inherit entrance and retain their own interaction owners.
- Observe the panel's own natural region and clamp each rendered dimension to valid non-negative intrinsic/closed/available bounds; Base UI's measured available width and height are the upper bound, and the natural box is never narrowed below itself. Nested content and the panel choose one owner for the same size cause; the panel never observes a child's interpolated box as a fresh target.
- A destination-layout size animation must not newly crop required text, an active descendant or a focused control. Use existing legal scroll/overflow to keep them immediately reachable; otherwise settle that axis before paint. Do not add temporary truncation or hide required content to make the shell animate.

A focused native editor also takes priority when geometry would move its caret/content box or change its scroll
position, even if no text would be clipped. Settle the affected decorative size axis; unrelated paint may continue. A
child size change that leaves the editor's geometry and scroll stable can retain its existing single owner.

The anchored positioner's CSS coordinates/origin and the content approach are one reviewed coordinate composition:
the approach is a second visual transform on the panel, never a rewritten positioner coordinate. Size completion
releases temporary constraints to the current available-space and caller sizing rules; an old completion cannot
restore an earlier anchor transform or measured width.

## Acceptance scenarios

- Caller individual `translate`/`scale` styles are retained: the panel yields its approach instead of overwriting
  them, changes the anchor during entry and resizes the available viewport after a content resize. Native placement
  and responsive sizing remain correct; the fallback never removes caller transforms or freezes the old width.
- Change only an external callback ref while Content remains the same host and is entering, then genuinely replace
  the render host. The first transfers ref registration without stopping the valid animation; the second establishes
  a current baseline and rejects retired writes. Repeat with native retained mounting, actual unmount and
  close/reopen, checking native completion instead of assuming that every visual exit disconnects its node.
- Resize content near each viewport edge while scrolling/moving the anchor; placement remains valid without diagonal
  fly-through, because the resolved side settles the approach instead of animating across the flip.
- Type into a composed input, close mid-update and reopen; focus/value stay native and only one panel is present.
- Verify controlled/default open, all modes, live downgrade, zero clock and anchor removal cleanup.
- Place a focused input and a separately resizing child in a small popover, then grow content and close/reopen with
  async data; no temporary label crop, double size spring or stale completion occurs.
- Update a direct numeric Title/Description value, a numeric-looking string and rich quantity content separately;
  switch string/number types while open and close mid-roll. Verify one display owner, exact accessible/copyable
  output and no inferred numeric origin.
- Open using mouse/touch/keyboard and the existing initial-focus policy; any actual in-panel focus is immediately
  visible, while a supported outside-focus path can retain entry.
