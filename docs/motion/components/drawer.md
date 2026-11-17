# Drawer motion contract

Status: functionally migrated to v2. Browser matrix, a production build and performance governance remain
deferred under ADR-023.

The drawer remains attached to Base UI's swipe and snap model. Authored entry, release and content feedback extend
that model through its existing owner instead of adding another transform engine. This contract inherits the
[common contract](../README.md) and [presets](../presets.md); bindings are design references, not recipe IDs or
public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "parts": {
    "popup": ["drawer#DrawerContent"],
    "overlay": ["drawer#DrawerOverlay"],
    "title": ["drawer#DrawerTitle"],
    "title-shell": ["drawer#DrawerTitle"],
    "description": ["drawer#DrawerDescription"],
    "description-shell": ["drawer#DrawerDescription"],
    "foreground": ["drawer#DrawerTitle", "drawer#DrawerDescription"],
    "quantity": ["drawer#DrawerTitle", "drawer#DrawerDescription"],
    "body": ["drawer#DrawerContent"],
    "handle": ["drawer#DrawerSwipeHandle"]
  },
  "regions": {
    "popup": ["drawer-popup"],
    "overlay": ["drawer-overlay"],
    "title": ["drawer-title-text"],
    "title-shell": ["drawer-title"],
    "description": ["drawer-description-text"],
    "description-shell": ["drawer-description"],
    "foreground": ["drawer-title", "drawer-description"],
    "quantity": ["drawer-title-number", "drawer-description-number"],
    "body": ["drawer-content"],
    "handle": ["drawer-swipe-handle"]
  },
  "axes": { "popup": ["height"] }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                                                                                                                                                                                                                                            | References                                                                                                           |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Appearance      | Default: `drawer-popup` owns edge presence through the Base UI adapter and `drawer-overlay` owns backdrop opacity on its own host. Initial `drawer-content` children inherit the panel entrance and never install a second writer. The optional swipe handle is decorative paint inside that entrance.                                                           | default: `drawer.popup.enter`, `drawer.popup.exit`, `drawer.overlay.enter`, `drawer.overlay.exit`                    |
| Size            | Default through the native owner: popup placement, snap geometry and `--drawer-height` come from Base UI. `drawer-popup` additionally owns one measured natural block size, which is the sole writer only while no native snap height is active; a snap-point drawer settles that revision through the native snap transaction instead of a second shell writer. | default: `drawer.popup.resize`; inherited: `drawer.popup.snap`, `drawer.popup.configure`                             |
| Surface colour  | Default: `drawer-overlay` owns its supplied background on its own physical region. `drawer-popup` and the optional swipe handle settle their supplied paint immediately: the popup host carries exactly one transition family and it is the primitive's own swipe/release channel, so an authored colour clock there would have to displace that native release. | default: `drawer.overlay.colour`; not-applicable: `@popup`, `@handle`                                                |
| Text colour     | Default: `drawer-title` and `drawer-description` own their foreground paint. The popup's inherited `text-foreground` remains the resting value for arbitrary children and is not a second writer.                                                                                                                                                                | default: `drawer.foreground.colour`                                                                                  |
| Changed text    | Default for primitive title/description: changed runs only, no stagger. Rich title/description children keep their shell's composed ownership and arbitrary body content keeps its child display owners; the popup never runs the title controller over body content.                                                                                            | default: `drawer.title.change`, `drawer.description.change`; composed: `@title-shell`, `@description-shell`, `@body` |
| Changed numbers | Default for a directly supplied supported numeric quantity in Title/Description: the owned display slot uses compact reels. Strings remain text; codes, dates and numeric identities are not parsed. Composed for body quantities inside rich children/render functions.                                                                                         | default: `drawer.quantity.change`; composed: `@title-shell`, `@description-shell`, `@body`                           |

`overlay.colour` addresses the backdrop; `foreground.colour` addresses the title and description. The popup's own
supplied paint settles immediately because its single transition family belongs to Base UI's swipe and release
channel, which this contract keeps native. Actual DOM focus/focus-within or a region's own invalid state cancels that
region's colour clock and settles its declared paint immediately, while an independent region keeps its own clock.
Any colour interpolation additionally requires a verified readable palette. This does not cancel the disjoint
presence, text or geometry owners, and it never cancels the native swipe channel.

## Choreography and modes

| Trigger / owner                                                | Full                                                                                                                                                                                  | Reduced                                                              | None                                         | Binding → preset → recipe/form                                                                                                                                                                                           |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Programmatic open/close / native popup adapter                 | Edge travel by the popup's own extent on `transform`, plus opacity, on the popup's own edge clock; native placement and swipe offset are preserved. Entry obeys the focus gate below. | Opacity only for authored presence. Entry obeys the same focus gate. | Final semantic geometry immediately.         | `drawer.popup.enter` → `presence.sheet` → `popup.anchored/edge`; `drawer.popup.exit` → `presence.sheet-exit` → `popup.anchored/edge-exit`                                                                                |
| Programmatic open/close / native overlay channel               | Opacity entry/exit on the backdrop's own host without an independent swipe clock; direct swipe takes over that same opacity channel.                                                  | Short opacity.                                                       | Target opacity immediately.                  | `drawer.overlay.enter` → `presence.inline` → `data.transition/opacity`; `drawer.overlay.exit` → `presence.exit` → `exit.fade/opacity`                                                                                    |
| Active swipe / Base UI popup and overlay                       | Follow native movement and progress 1:1 with no interpolation, including the snap-point movement channel.                                                                             | Same direct manipulation.                                            | Same direct manipulation; no authored tween. | `drawer.popup.swipe` → `engine.native` → `native/base-ui-drawer` (Base UI Drawer swipe/snap owner, no new recipe); `drawer.overlay.swipe` → `engine.native` → `native/base-ui-drawer` (same native owner, no new recipe) |
| Release/snap / Base UI geometry owner                          | Native snap and release trajectory on the primitive's own clock; no additional spring and no second transform writer.                                                                 | Accepted snap target immediately; no authored post-release travel.   | Accepted snap target immediately.            | `drawer.popup.snap` → `engine.native` → `native/base-ui-drawer` (Base UI Drawer release/snap owner, no new recipe)                                                                                                       |
| Intentional content size revision / native geometry owner      | One measured natural block destination on a clamped panel clock while idle; during direct swipe recompute immediately instead of interpolating.                                       | Final measured geometry immediately.                                 | Final measured geometry immediately.         | `drawer.popup.resize` → `geometry.panel` → `geometry.resize/measured`                                                                                                                                                    |
| Explicit snap configuration change / native snap owner         | Resolve the latest valid active snap and destination through the native snap transaction without another size spring.                                                                 | Final snap geometry immediately.                                     | Final snap geometry immediately.             | `drawer.popup.configure` → `engine.native` → `native/base-ui-drawer` (Base UI Drawer snap owner, no new recipe)                                                                                                          |
| Primitive title/description / text owner                       | Stable-grapheme replacement, `stagger: none`; no presence replay.                                                                                                                     | Changed-run opacity only.                                            | Final text immediately.                      | `drawer.title.change` → `text.replace` → `text.change/changed-runs`; `drawer.description.change` → `text.replace` → `text.change/changed-runs`                                                                           |
| Supplied tokens / backdrop                                     | Scoped surface paint on the backdrop, independent of the swipe opacity channel. Colour eligibility and immediate-owner priority follow the rule above.                                | Short colour feedback under the same owner priority.                 | Final colours immediately.                   | `drawer.overlay.colour` → `state.color` → `state.color/surface`                                                                                                                                                          |
| Supplied tokens / title and description                        | Scoped foreground paint on the owned display regions; focus or invalid state settles them immediately.                                                                                | Short colour feedback under the same owner priority.                 | Final colours immediately.                   | `drawer.foreground.colour` → `state.color` → `state.color/foreground`                                                                                                                                                    |
| Direct numeric Title/Description revision / owned display slot | Roll changed places only; the same slot never also runs text replacement on its formatted digits.                                                                                     | Final number immediately.                                            | Final number immediately.                    | `drawer.quantity.change` → `number.compact` → `number.roll/reels`                                                                                                                                                        |

The popup and the backdrop are separate presence controllers, so the edge flight and the backdrop opacity never
share a writer. `drawer.popup.swipe`, `drawer.popup.snap`, `drawer.popup.configure` and `drawer.overlay.swipe` name
the actual Base UI owner: the drag, the snap configuration and the release trajectory stay that engine's, and no
Cadence clock is layered over them. Placement lives on the popup's `translate` (the native snap offset), the drag
and the authored entrance share `transform` but never at the same time: pointer input settles the authored envelope
first, and the release glide retargets the properties from their current paint. The optional
`drawer-swipe-handle` is static decorative paint inside the panel's own entrance; it opens no colour clock.

## Interruption and lifecycle

The current native Drawer normally targets its popup for initial focus. If that actual focus arrives during entry,
only the decorative opening envelope settles before focus is presented; native snap placement and any live
direct-input offset are preserved. The independent backdrop may still fade. Autofocus is never deferred and the
edge slide is never required before focus, and this entrance rule never resets an active swipe.

- Base UI retains swipe threshold, direction, snap points, dismissal, scroll arbitration and focus behavior.
  `showSwipeHandle` remains its existing presentation option; no new drag API is introduced.
- Pointer manipulation takes ownership immediately from the authored presence: the presence channel settles on
  `pointerdown` and Base UI's own inline transform then owns the gesture. Reopen or a new snap state retargets the
  native transaction, preserving the live offset rather than resetting it to zero.
- Close cancels resize, text and reel work; viewport, popup and scroll content are never duplicated. `modal=false`
  keeps its existing absence of the backdrop.
- Live reduced cancels the authored travel and every size interpolation without detaching direct manipulation.
  While a pointer is active its native offset and capture survive; the accepted target is reached without authored
  travel only when the native gesture ends or an actual dismissal supersedes it. None and a zero clock cancel the
  authored one-shot work on the same boundary and let Base UI's actual lifecycle complete.
- Close/reopen and async content revisions invalidate obsolete exit and size completions. Content received while
  closed establishes the next view without hidden interpolation. A no-motion close still completes through Base
  UI's lifecycle before focus and modality are released; native unmount releases capture, observers and callbacks.

A direct Title/Description string is dispatched to the text owner and a supported direct numeric quantity to the
numeric owner; changing the renderer type establishes an immediate baseline. Rich Title/Description children and
formatting callbacks keep their composed owners, and the separately anchored body boundary delegates to its actual
child display components rather than running the title controller over body content. Screen-reader-only content
updates immediately. One slot transaction sits under the popup's existing size owner with the aggregate text and
reel limits; no counter prop, parser, countdown or inferred application state is added.

## Geometry and performance

The popup owns three separate things: a native placement offset (`translate`, the snap offset), the gesture and
authored `transform`, and the measured block size. They never share a property, so a resize cannot reset a live
pointer offset and a release cannot cancel a content revision.

- Positioning, translation and the measured content axis have separate owners. `swipeDirection` changes placement
  classes and settles the obsolete envelope; it never becomes a translation input or a stale trajectory.
- One measured block-size owner registers on the popup host and reads its natural height only after releasing its
  own size overlay, so a child's interpolated box is never reused as a fresh target. The destination is clamped to
  a non-negative minimum and to at least the natural extent, so required text and focus rings are not newly
  cropped and no scroll policy is invented; `drawer-content` keeps its existing `overflow-y` ownership.
- A snap-point drawer's shell height is `--drawer-height` and belongs to the native snap transaction. The authored
  owner declares that revision unavailable and settles natively rather than writing a second height beside it;
  this is the recorded fallback, not an animated result.
- Reflow happens once at the final bounded width; only the block axis is measured. Passive font, viewport or caller
  class changes settle immediately instead of manufacturing a revision, and a live resize recomputes immediately
  during direct swipe instead of interpolating beside the pointer.
- At most one popup, one backdrop and the bounded changed-text set animate per drawer. A focused native editor keeps
  priority: geometry that would move its caret or scroll position settles the decorative axis instead.

## Acceptance scenarios

Executed in `tests/components/drawer.test.tsx`: the popup edge entrance and exit, the independently owned backdrop
entrance and exit on the same channel as the native swipe progress, the measured content revision, changed title and
description strings, changed direct quantities, the backdrop surface colour owner, the title and description
foreground owner, and the native swipe, snap and configure boundaries plus the static popup, title-shell,
description-shell, body and handle boundaries of the installed Base UI engine. Each action runs in full, reduced and
none, and every not-applicable region is verified as a static boundary that holds no live writer.

Also pending browser verification: 3 modes × 2 OS preferences, live same-target mode/clock cancellation in a real
browser, every supported swipe direction with snap points and the optional handle, modal and non-modal behavior,
grab-mid-resize and content changes during a swipe, reopen mid-exit, nested drawers and portals, SSR/no-JS/hydration
probes, keyboard focus and return focus, soft-keyboard and passive viewport resize around a focused field, and
light/dark × narrow/wide screenshot review. jsdom has no layout engine and no pointer geometry, so the real edge
interpolation, the measured block size and the native release are proven here by their committed revision, source
and property policy rather than by rendered geometry.

Delegation gaps are recorded rather than hidden: Base UI owns mounting, modality, focus, the swipe/snap gesture and
the native unmount protocol; the measured owner animates only the block axis and only a known content revision while
the drawer is open and no snap height is active; a snap-point drawer's explicit height change settles through the
native transaction instead of a tween; and no performance, CLS, interaction-cost or real-device FPS measurement was
taken (ADR-023 defers performance governance).
