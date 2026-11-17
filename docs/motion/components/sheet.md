# Sheet motion contract

Status: functionally migrated to v2. Browser matrix, a production build and performance governance remain
deferred under ADR-023.

A sheet enters from its configured edge as one panel. Edge travel explains its placement; content changes use bounded
geometry without adding a drag interaction. This contract inherits the [common contract](../README.md) and
[presets](../presets.md); bindings are design references, not recipe IDs or public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "parts": {
    "content": ["sheet#SheetContent"],
    "overlay": ["sheet#SheetOverlay"],
    "surface": ["sheet#SheetContent"],
    "foreground": ["sheet#SheetTitle", "sheet#SheetDescription"],
    "title": ["sheet#SheetTitle"],
    "description": ["sheet#SheetDescription"],
    "quantity": ["sheet#SheetTitle", "sheet#SheetDescription"],
    "body": ["sheet#SheetContent"],
    "built-in-close": ["sheet#SheetContent"],
    "close-presence": ["button#Button"],
    "close-size": ["button#Button"],
    "close-colour": ["button#Button"],
    "close-label": ["button#Button"],
    "close-number": ["button#Button"],
    "close-press": ["button#Button"]
  },
  "regions": {
    "content": ["sheet-content"],
    "overlay": ["sheet-overlay"],
    "surface": ["sheet-content"],
    "foreground": ["sheet-title", "sheet-description"],
    "title": ["sheet-title-text"],
    "description": ["sheet-description-text"],
    "quantity": ["sheet-title-number", "sheet-description-number"],
    "body": ["sheet-content"],
    "built-in-close": ["sheet-close"],
    "close-presence": ["sheet-footer-close"],
    "close-size": ["sheet-footer-close"],
    "close-colour": ["sheet-footer-close"],
    "close-label": ["button-text"],
    "close-number": ["button-number"],
    "close-press": ["button-feedback"]
  },
  "axes": { "content": ["height"], "close-size": ["width", "height"] }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                                                                                                                                                                                                                                        | References                                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Appearance      | Default: `sheet-content` owns the panel edge flight and `sheet-overlay` owns backdrop opacity, each as its own physical writer. Header, footer and initial descendants inherit the panel entrance. The optional Button-backed footer close keeps that Button's own retained exit instead of a second sheet owner.                                            | default: `sheet.content.enter`, `sheet.content.exit`, `sheet.overlay.enter`, `sheet.overlay.exit`; inherited: `sheet.close-presence.exit`               |
| Size            | Default: a top or bottom panel owns a clamped measured block size over its natural content within the viewport; a side panel keeps its full height and caller/viewport-owned width, so only the block axis is measured and no inline size is interpolated. The optional footer close keeps Button's measured compact box.                                    | default: `sheet.content.resize`; inherited: `sheet.close-size.resize`                                                                                   |
| Surface colour  | Default: content and overlay own their supplied background, border and scoped shadow paint. The footer close action is a Button and keeps that component's variant paint instead of receiving a second writer.                                                                                                                                               | default: `sheet.surface.colour`, `sheet.overlay.colour`; inherited: `sheet.close-colour.colour`                                                         |
| Text colour     | Default: `sheet-title` and `sheet-description` own foreground changes. The footer close action follows its inherited Button foreground owner.                                                                                                                                                                                                                | default: `sheet.foreground.colour`; inherited: `sheet.close-colour.colour`                                                                              |
| Changed text    | Default for primitive title/description: retain unchanged graphemes and replace changed runs without stagger. Rich body content keeps its composed owners; the footer close label keeps Button's own changed-run owner, and the built-in icon close's accessibility text and glyph are fixed.                                                                | default: `sheet.title.change`, `sheet.description.change`; composed: `@body`; inherited: `sheet.close-label.replace`; not-applicable: `@built-in-close` |
| Changed numbers | Default for a directly supplied supported numeric quantity in Title/Description: the owned display slot uses compact reels. Strings remain text; codes, dates and numeric identities are not parsed. Composed for body quantities inside rich children; a numeric footer close label keeps Button's reel owner, and the built-in icon close has no quantity. | default: `sheet.quantity.change`; composed: `@body`; inherited: `sheet.close-number.roll`; not-applicable: `@built-in-close`                            |

`surface.colour` addresses the panel and the backdrop separately; `foreground.colour` addresses title and
description. Actual DOM focus/focus-within or a region's own invalid state cancels that region's colour clock and
settles its declared paint immediately, while an independent region keeps its own clock. Any colour interpolation
additionally requires a verified readable palette. This does not cancel the disjoint presence, text or geometry
owners.

## Choreography and modes

| Trigger / owner                                                | Full                                                                                                                                                                           | Reduced                                                                        | None                                                    | Binding → preset → recipe/form                                                                                                                                                                                                                                                       |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Open / content                                                 | Translate by the panel's own extent from `side`, plus opacity; no spring bounce. Entry is subject to the actual-focus gate below.                                              | Short opacity only. Entry obeys the same focus gate.                           | Open geometry immediately.                              | `sheet.content.enter` → `presence.sheet` → `popup.anchored/edge`                                                                                                                                                                                                                     |
| Close / content                                                | Reverse edge travel with the shorter sheet-exit clock.                                                                                                                         | Short opacity only.                                                            | Closed target immediately.                              | `sheet.content.exit` → `presence.sheet-exit` → `popup.anchored/edge-exit`                                                                                                                                                                                                            |
| Open/close / overlay                                           | Coordinated opacity, independent of panel translation.                                                                                                                         | Short opacity.                                                                 | Target opacity immediately.                             | `sheet.overlay.enter` → `presence.surface` → `enter.pop/opacity`; `sheet.overlay.exit` → `presence.exit` → `exit.fade/opacity`                                                                                                                                                       |
| Intentional content/owned size change / shell                  | Clamped measured natural block axis; full-height side sheets keep their fixed-height layout and existing overflow policy.                                                      | Final geometry immediately.                                                    | Final geometry immediately.                             | `sheet.content.resize` → `geometry.panel` → `geometry.resize/measured`                                                                                                                                                                                                               |
| Primitive title/description / text owner                       | Changed-run replacement, `stagger: none`.                                                                                                                                      | Changed-run opacity only.                                                      | Final text immediately.                                 | `sheet.title.change` → `text.replace` → `text.change/changed-runs`; `sheet.description.change` → `text.replace` → `text.change/changed-runs`                                                                                                                                         |
| Supplied tokens / relevant parts                               | Scoped colour transition on the panel, backdrop, title and description. Colour eligibility and immediate-owner priority follow the rule above.                                 | Short colour feedback. Colour obeys the same owner priority.                   | Final colours immediately.                              | `sheet.surface.colour` → `state.color` → `state.color/surface`; `sheet.overlay.colour` → `state.color` → `state.color/surface`; `sheet.foreground.colour` → `state.color` → `state.color/foreground`; `sheet.close-colour.colour` → `state.color` → `state.color/surface-foreground` |
| Direct numeric Title/Description revision / owned display slot | Roll changed places only; the same slot never also runs text replacement on its formatted digits.                                                                              | Final number immediately.                                                      | Final number immediately.                               | `sheet.quantity.change` → `number.compact` → `number.roll/reels`                                                                                                                                                                                                                     |
| Press/release / inherited Button feedback layer                | Inherit Button press on its safe visual layer; omit scale when that layer is unavailable. Native activation and existing close semantics remain immediate; no second executor. | No scale; colour follows the same Button owner and its focus/invalid priority. | Native activation/close immediately, without animation. | `sheet.close-press.press` → `feedback.press` → `feedback.press/scale`                                                                                                                                                                                                                |
| Close presence / inherited Button owner                        | Button keeps its own retained removal envelope when its membership ends; the sheet never adds a second exit.                                                                   | Short opacity.                                                                 | Removed immediately.                                    | `sheet.close-presence.exit` → `presence.exit` → `exit.fade/opacity`                                                                                                                                                                                                                  |
| Close box or label revision / inherited Button owners          | Button keeps one measured box, one changed-run label owner and one compact reel; the sheet writes none of them.                                                                | Final box and text immediately.                                                | Final geometry and text immediately.                    | `sheet.close-size.resize` → `geometry.compact` → `geometry.resize/measured`; `sheet.close-label.replace` → `text.replace` → `text.change/changed-runs`; `sheet.close-number.roll` → `number.compact` → `number.roll/reels`                                                           |

The panel and the backdrop are separate presence controllers, so the edge flight and the backdrop opacity never
share a writer. The `close-*` bindings name the inherited Button owners of the close action: `SheetFooter`'s
optional `showCloseButton` renders a real Button (as `DialogFooter` does), so its press, paint, box, label, quantity
and retained removal stay that component's owners and the sheet writes none of them. `closeLabel` only replaces the
visible wording. The built-in icon close in `SheetContent` is also a Button, but it shares the panel's initial
presence as a descendant and installs no separately planned action; its own paint and box remain Button's, and its
`X` plus screen-reader label are fixed content. The exported bare `SheetClose` stays a pass-through composition and
acquires Button behavior only when its actual caller render uses Button.

## Interruption and lifecycle

Sheet retains Dialog's native initial-focus policy. If focus reaches the entering panel or a child, settle the
decorative edge/opacity envelope before presenting focus; the independent overlay can continue. Default opening may
therefore begin directly at the open edge rather than finish a slide. Autofocus and modal semantics are never
delayed or disabled to preserve a decorative entrance.

- Base UI Dialog retains modal, dismissal, focus trap and return-focus behavior. `side` selects placement; motion
  does not add swipe handles or drag gestures.
- Reopen reverses the current edge travel; the reversal starts from the transform actually on screen. An explicit
  side change while open settles the obsolete envelope and places the new edge immediately, so no transition flies
  across the viewport toward a stale edge.
- Close cancels resize/text work and exits one stable surface. Semantic changes and button actions never wait for
  the sheet to settle.
- Live reduced cancels travel and resize; none and a zero clock cancel authored clocks and complete the current
  boundary through Base UI's actual exit protocol, without a timer hold or premature focus/modality release.
  Unmount releases measurement, presence and local presentation resources. Native inputs and scrolling stay
  available in every mode.
- Async content received while closed supplies the next semantic view without offscreen size work. Reopen
  invalidates the old exit completion.

A direct Title/Description string goes to the text owner and a supported direct numeric quantity to the numeric
owner; changing the renderer type establishes an immediate baseline. Rich Title/Description children and formatting
callbacks keep their composed owners, and the separately anchored body boundary delegates to its actual child
display components rather than running the title controller over body content. Screen-reader-only content updates
immediately. One slot transaction sits under the popup's existing size owner with the aggregate text/reel limits; no
counter prop, parser, countdown or inferred application state is added.

## Geometry and performance

An edge flight's distance is the physical extent of its current panel, not a separately cached text or viewport
dimension: the transform endpoints are percentages of the panel's own border box, so every side and size travels
exactly its own width or height. A caller transform keeps its own family, and the panel then runs opacity only
instead of double-writing the property. The travel endpoints are retired when the flight is cancelled, so a stale
pixel offset can never accumulate across a reopen.

- Positioning, translation and the measured content axis have separate owners and properties. `side` changes
  placement classes; it never becomes a translation input.
- One measured block-size owner registers on the content shell itself and reads its natural height only after
  releasing its own size overlay, so a child's interpolated box is never reused as a fresh target. The destination
  is clamped to a non-negative minimum and to at least the natural extent, so required text, the close control and
  focus rings are not newly cropped and no scroll policy is invented.
- A side sheet's inline size is caller/viewport-owned (`w-3/4` plus `sm:max-w-sm`) and its height is the full
  viewport, so a content revision produces no block-size delta there and nothing is interpolated. The documented
  gap is recorded below rather than replaced by a width tween that would rewrap text on every frame.
- Reflow happens once at the final bounded width; only the applicable shell axis is measured. Passive font,
  viewport or caller class changes settle immediately instead of manufacturing a revision.
- At most one panel, one overlay and the bounded changed-text set animate per sheet; the built-in close is a Button
  and keeps that component's own compact box, paint and press layer.

## Acceptance scenarios

Executed in `tests/components/sheet.test.tsx`: the panel edge entrance and exit from every side, the independently
owned backdrop entrance and exit, the measured content revision, changed title and description strings, changed
direct quantities, the panel and overlay surface colour owners, the title/description foreground owner, and the
inherited Button press layer of a caller-rendered close. Each action runs in full, reduced and none with a zero
clock, and the built-in close region is verified as a non-animated native boundary.

Also pending browser verification: 3 modes × 2 OS preferences, live same-target mode/clock cancellation in a real
browser, a side change while open, reopen mid-exit, nested sheets and portals, SSR/no-JS/hydration probes, keyboard
focus and return focus, `preventUnmountOnClose` retention, soft-keyboard and passive viewport resize around a
focused field, and light/dark × narrow/wide screenshot review. jsdom has no layout engine, so the real edge
interpolation and the measured block size are proven here by their committed revision, source and property policy
rather than by rendered geometry.

Delegation gaps are recorded rather than hidden: Base UI owns mounting, modality, focus and the native unmount
protocol; the measured owner animates only the block axis of a content-driven panel and only a known content
revision while the sheet is open; a side panel's explicit width change settles through native layout instead of a
width tween, and a caller transform falls back to opacity-only presence; and no performance, CLS, interaction-cost
or real-device FPS measurement was taken (ADR-023 defers performance governance).
