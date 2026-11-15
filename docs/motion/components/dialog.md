# Dialog motion contract

Status: functionally migrated to v2. Browser matrix, a production build and performance governance remain
deferred under ADR-023.

The modal surface arrives as one readable unit, then accommodates intentional content changes without moving focus or
bouncing the reading plane. This contract inherits the [common contract](../README.md) and
[presets](../presets.md); bindings are design references, not recipe IDs or public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "parts": {
    "content": ["dialog#DialogContent"],
    "overlay": ["dialog#DialogOverlay"],
    "surface": ["dialog#DialogContent"],
    "foreground": ["dialog#DialogTitle", "dialog#DialogDescription"],
    "title": ["dialog#DialogTitle"],
    "title-shell": ["dialog#DialogTitle"],
    "description": ["dialog#DialogDescription"],
    "description-shell": ["dialog#DialogDescription"],
    "quantity": ["dialog#DialogTitle", "dialog#DialogDescription"],
    "body": ["dialog#DialogContent"],
    "built-in-close": ["dialog#DialogContent", "dialog#DialogFooter"]
  },
  "regions": {
    "content": ["dialog-content"],
    "overlay": ["dialog-overlay"],
    "surface": ["dialog-content"],
    "foreground": ["dialog-title", "dialog-description"],
    "title": ["dialog-title-text"],
    "title-shell": ["dialog-title"],
    "description": ["dialog-description-text"],
    "description-shell": ["dialog-description"],
    "quantity": ["dialog-title-number", "dialog-description-number"],
    "body": ["dialog-content"],
    "built-in-close": ["dialog-close"]
  },
  "axes": { "content": ["height"] }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                                                                                                                                                    | References                                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Appearance      | Default: `dialog-content` owns panel presence and `dialog-overlay` owns backdrop opacity, each as its own physical writer. Header, footer and initial children inherit that entrance.                                                                                    | default: `dialog.content.enter`, `dialog.content.exit`, `dialog.overlay.enter`, `dialog.overlay.exit`                                                   |
| Size            | Default: the content shell owns a measured block-size revision over its natural content within the existing viewport and `max-width` constraints. Its inline size is caller/viewport-owned (`w-full`), so only the block axis is measured.                               | default: `dialog.content.resize`; not-applicable: `@built-in-close`                                                                                     |
| Surface colour  | Default: content and overlay own their supplied background, border and scoped shadow paint. The built-in close controls are native buttons styled by Button's variant classes; they carry no separate Cadence owner here.                                                | default: `dialog.surface.colour`, `dialog.overlay.colour`; not-applicable: `@built-in-close`                                                            |
| Text colour     | Default: `dialog-title` and `dialog-description` own foreground changes; arbitrary body children inherit or retain component ownership. The built-in close controls keep their static native paint.                                                                      | default: `dialog.foreground.colour`; not-applicable: `@built-in-close`                                                                                  |
| Changed text    | Default for primitive title/description content: changed runs only, no stagger. Rich body/title children use composed ownership.                                                                                                                                         | default: `dialog.title.change`, `dialog.description.change`; composed: `@title-shell`, `@description-shell`, `@body`; not-applicable: `@built-in-close` |
| Changed numbers | Default for a directly supplied supported numeric quantity in Title/Description: the owned display slot uses compact reels. Strings remain text; codes, dates and numeric identities are not parsed. Composed for body quantities inside rich children/render functions. | default: `dialog.quantity.change`; composed: `@title-shell`, `@description-shell`, `@body`; not-applicable: `@built-in-close`                           |

## Choreography and modes

| Trigger / owner                                                | Full                                                                                                                                                                                | Reduced                                                                                      | None                                                                         | Binding → preset → recipe/form                                                                                                                                                                          |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Open / panel and backdrop                                      | Panel opacity with a bounded `scale.in` envelope; backdrop opacity follows the same open transaction with its own property owner. Entry is subject to the actual-focus gate below.  | Panel and backdrop opacity only; the panel drops the scale. Entry obeys the same focus gate. | Open target immediately, with no authored animation.                         | `dialog.content.enter` → `presence.surface` → `enter.pop/surface`; `dialog.overlay.enter` → `presence.surface` → `enter.pop/opacity`                                                                    |
| Close / panel and backdrop                                     | Opacity exit only on each owned region; no delayed child exits and no scale-out.                                                                                                    | Short opacity exit.                                                                          | Closed target immediately; a retained native close hides on the first frame. | `dialog.content.exit` → `presence.exit` → `exit.fade/opacity`; `dialog.overlay.exit` → `presence.exit` → `exit.fade/opacity`                                                                            |
| Intentional body/size change / content shell                   | Measure the final natural block size after the shell releases its own writer, then animate a clamped height without bounce; the width stays laid out at its destination.            | Final block geometry immediately.                                                            | Final geometry immediately.                                                  | `dialog.content.resize` → `geometry.panel` → `geometry.resize/measured`                                                                                                                                 |
| Plain title/description update / respective text owner         | Stable-grapheme replacement, `stagger: none`; initial text inherits the panel entrance.                                                                                             | Changed-run opacity only.                                                                    | Final text immediately.                                                      | `dialog.title.change` → `text.replace` → `text.change/changed-runs`; `dialog.description.change` → `text.replace` → `text.change/changed-runs`                                                          |
| Supplied colour token change / relevant parts                  | Scoped surface paint on the content and overlay, and foreground paint on the title/description. Focus-within or that region's invalid state settles its declared paint immediately. | Short colour feedback under the same owner priority.                                         | Final colours immediately.                                                   | `dialog.surface.colour` → `state.color` → `state.color/surface`; `dialog.overlay.colour` → `state.color` → `state.color/surface`; `dialog.foreground.colour` → `state.color` → `state.color/foreground` |
| Direct numeric Title/Description revision / owned display slot | Roll changed places only; the same slot never also runs text replacement on its formatted digits.                                                                                   | Final number immediately.                                                                    | Final number immediately.                                                    | `dialog.quantity.change` → `number.compact` → `number.roll/reels`                                                                                                                                       |

The content and overlay controllers are separate instances, so opacity and the optional scale envelope never share a
writer and no two engines claim the same property. The built-in close controls in `DialogContent` and
`DialogFooter` are native buttons that reuse Button's variant classes; native activation, focus and the closing
transition stay theirs, so the dialog installs no second Button presence, press, paint or display owner on them. The
exported bare `DialogClose` remains a pass-through composition and acquires Button behavior only when its actual
caller render uses Button.

## Interruption and lifecycle

Preserve Base UI's actual initial-focus timing and target. Its ordinary default focuses a tabbable child or the popup
itself; when that focus lands inside an entering panel, the panel settles its opacity and scale envelope immediately
while the separately owned backdrop may finish its own fade. Never delay or disable autofocus to guarantee a scale
animation. A caller's existing focus policy may leave the surface eligible for entry until a real focus, pointer or
key activation reaches it.

Base UI owns open state, modal behavior, focus trapping, dismissal, portal retention and return focus. Semantic state
and input never wait for panel, title or geometry completion. Rapid close/reopen reverses the same presence boundary
from its current visual state; a content update during close commits semantic content but does not start a second
entrance or resize. Closing settles the panel's measured block-size owner while the exit owner keeps its zero-opacity
envelope until Base UI permits removal, including `preventUnmountOnClose`. A live reduced downgrade cancels the scale
envelope before paint; none and a zero recipe clock settle the semantic target immediately and cancel the running
animation, so Base UI's own completion protocol still releases modality and focus. Title, description, quantity and
colour controllers are retired with the panel's unmount. Unmount removes measurements and all writers.

## Geometry and performance

One measured block-size owner registers on the content shell itself; it reads its natural height only after releasing
its own size overlay, so a child's interpolated box is never reused as a fresh target. The destination is clamped to
a non-negative minimum and to at least the natural extent, so required text, the close control and focus rings are
never newly cropped and no scroll policy is invented. The inline size is not interpolated: the panel lays out at its
destination width once, and only the block axis is measured. Passive font, viewport or caller class changes settle
immediately instead of manufacturing a revision. At most one panel, one overlay and the bounded changed-text set
animate per dialog; no per-child entrances or resize feedback are added.

## Acceptance scenarios

Executed in `tests/components/dialog.test.tsx`: the panel and backdrop entrance/exit, the measured content revision,
changed title and description strings, changed direct quantities, the content and overlay surface colour owners and
the title/description foreground owner. Each runs in full, reduced and none with a zero clock, and the native
built-in close regions are verified as non-animated boundaries.

Also pending browser verification: 3 modes × 2 OS preferences, live same-target mode/clock cancellation in a real
browser, nested dialogs and portals, SSR/no-JS/hydration probes, keyboard focus and return focus, `preventUnmountOnClose`
retention, a focused native editor during a content resize, and light/dark × narrow/wide screenshot review. jsdom has
no layout engine, so the real block-size interpolation and Base UI's focus settlement are proven here by their
committed revision, source and property policy rather than by rendered geometry.

Delegation gaps are recorded rather than hidden: Base UI owns mounting, modality, focus and the native unmount
protocol; the measured owner animates only the block axis and only a known content revision while the panel is open;
the built-in close controls are native buttons with Button's variant classes instead of composed Button instances, so
they add no inherited Cadence press/paint/display owner inside this component; and no performance, CLS,
interaction-cost or real-device FPS measurement was taken (ADR-023 defers performance governance).
