# Command motion contract

Status: functionally migrated to v2. Browser matrix, a production build and performance governance remain
deferred under ADR-023.

The search input responds natively while the current command set changes immediately. Motion helps the palette
arrive and its supplied paint settle; it never postpones filtering, scoring, selection or executing a command.
This contract inherits the [common contract](../README.md) and [presets](../presets.md); bindings are design
references, not recipe IDs or public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "parts": {
    "root": ["command#Command"],
    "surface": ["command#Command", "command#CommandInput", "command#CommandSeparator"],
    "empty-surface": ["command#CommandEmpty"],
    "item": ["command#CommandItem", "command#CommandShortcut"],
    "label": ["command#CommandItem", "command#CommandShortcut"],
    "empty-label": ["command#CommandEmpty"],
    "input": ["command#CommandInput"],
    "list": ["command#CommandList"],
    "empty": ["command#CommandEmpty"],
    "dialog": ["dialog#DialogContent"],
    "dialog-title": ["dialog#DialogTitle"],
    "dialog-title-text": ["dialog#DialogTitle"],
    "input-frame": ["input-group#InputGroup"]
  },
  "regions": {
    "root": ["command"],
    "surface": ["command", "command-input-wrapper", "command-separator"],
    "empty-surface": ["command-empty"],
    "item": ["command-item", "command-shortcut"],
    "label": ["command-item-text", "command-shortcut-text"],
    "empty-label": ["command-empty-text"],
    "input": ["command-input"],
    "list": ["command-list"],
    "empty": ["command-empty"],
    "dialog": ["dialog-content"],
    "dialog-title": ["dialog-title"],
    "dialog-title-text": ["dialog-title-text"],
    "input-frame": ["input-group"]
  }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                                                                                                                                                                                      | References                                                                                                                                                 |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Appearance      | Default: the inline `command` root owns one independent later-insertion opacity. `CommandDialog` inherits Dialog presence for the panel and backdrop, including its command children; Command adds no second popup entrance. The composed Input Group frame keeps its own insertion inside `CommandInput`. | default: `command.root.enter`; inherited: `command.dialog.enter`, `command.dialog.exit`, `command.input-frame.enter`                                       |
| Size            | Not applicable locally: cmdk owns the list as the native scroll container, so the `max-height` clamp, the natural result height, active-item scrolling and final layout commit through native layout. No shell measures or interpolates that extent, and no per-row visual is registered.                  | inherited: `command.list.scroll`                                                                                                                           |
| Surface colour  | Default: the root, the empty state, the input wrapper's divider and the separator rule each own their supplied background, border and scoped shadow paint. The composed Input Group frame and the Dialog panel keep their own migrated surface owners instead of receiving a second writer.                | default: `command.surface.colour`, `command.empty-surface.colour`, `command.item.colour`; inherited: `command.dialog.colour`, `command.input-frame.colour` |
| Text colour     | Default: each item and shortcut owns its own foreground together with its surface, so the merged hover/selected/disabled palette has one writer. The Dialog title keeps its own foreground owner; the native editor's text is the browser's own paint.                                                     | default: `command.item.colour`; inherited: `command.dialog-title.colour`                                                                                   |
| Changed text    | Default for owned primitive item/empty/shortcut strings: changed runs only, no stagger. The screen-reader-only Dialog title keeps Dialog's own changed-run owner; the native `CommandInput` value is never split or replaced.                                                                              | default: `command.label.replace`, `command.empty-label.replace`; inherited: `command.dialog-title-text.replace`; not-applicable: `@input`                  |
| Changed numbers | Not applicable: command names, shortcut glyphs and the query are identities, `Command` renders no numeric display of its own and no count prop is added. Numeric-looking item, empty and shortcut strings stay text rather than gaining an invented reel.                                                  | not-applicable: `@input`, `@empty`                                                                                                                         |

`item.colour` alone merges hover, selected, disabled and theme paint for each CommandItem and CommandShortcut.
`surface.colour` owns the root chrome, the empty state background, the input wrapper's divider and the separator
rule; it never claims a foreground, so no node receives two colour families. The composed Input Group frame keeps
its own border, background and shadow owner and the Dialog panel keeps its own surface owner. In the default input
branch the editor's foreground is the browser's native paint; a caller-provided `asChild` element keeps its own
owners and Command injects none.

Colour eligibility is per actual root, item or display region. DOM focus/focus-within or that region's own invalid
state cancels its colour clock and settles all its declared paint immediately, while an independent region keeps
its own clock; cmdk's `aria-activedescendant` highlight is not DOM focus. Other colour interpolation requires a
verified readable palette, so an unknown caller palette settles at its target.

The group heading is rendered by cmdk itself, so it keeps the primitive's static heading text and paint; Command
installs no second text or colour writer inside `[cmdk-group-heading]`. `CommandItem`'s generated check glyph keeps
immediate visibility from the caller-provided `data-checked` state and shortcut suppression; motion never infers a
checked state from cmdk selection and adds no toggle action.

## Choreography and modes

| Trigger / owner                                           | Full                                                                                                                                                                            | Reduced                                                                          | None                              | Binding → preset → recipe/form                                                                                                                    |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inline insertion / root                                   | Opacity entrance only when no parent owns it. Entry is subject to the actual-focus gate below.                                                                                  | Short opacity. Entry obeys the same focus gate.                                  | Final content immediately.        | `command.root.enter` → `presence.inline` → `data.transition/opacity`                                                                              |
| CommandDialog open/close / inherited Dialog owner         | Dialog's surface presence once; Command adds no extra popup layer. Entry is subject to the actual-focus gate below.                                                             | Inherited short opacity. Entry obeys the same focus gate.                        | Final semantic state immediately. | `command.dialog.enter` → `presence.surface` → `enter.pop/surface`; `command.dialog.exit` → `presence.exit` → `exit.fade/opacity`                  |
| Editing/filtering/navigation / cmdk and native input      | Query/results/current selection commit immediately; no per-result entrance stagger or delayed action.                                                                           | Same immediate behavior.                                                         | Same immediate behavior.          | `command.list.scroll` → `engine.native` → `native/cmdk` (cmdk native result scrolling (no new recipe))                                            |
| Result set/empty state change / list viewport             | Latest result height, active item, scroll position and final layout commit immediately through cmdk's own scroller; no height tween.                                            | Final height immediately.                                                        | Final height immediately.         | `command.input.edit` → `engine.native` → `native/cmdk` (cmdk/native input and selection (no new recipe))                                          |
| Pointer selection/state / item                            | Scoped surface/foreground transition; keyboard selected highlight appears immediately. Colour eligibility and immediate-owner priority follow the rule above.                   | Short colour feedback; keyboard immediate. Colour obeys the same owner priority. | Final state immediately.          | `command.item.colour` → `state.color` → `state.color/surface-foreground`                                                                          |
| Supplied tokens/disabled state / root, divider and rule   | Scoped surface colour, respecting the inherited Dialog and Input Group owners and immediate caret/focus. Colour eligibility and immediate-owner priority follow the rule above. | Short colour. Colour obeys the same owner priority.                              | Final colours immediately.        | `command.surface.colour` → `state.color` → `state.color/surface`                                                                                  |
| Empty state paint / empty state                           | The visible empty region labels its own supplied background; the primitive keeps cmdk's zero-result visibility.                                                                 | Short colour.                                                                    | Final colour immediately.         | `command.empty-surface.colour` → `state.color` → `state.color/surface`                                                                            |
| Primitive display update / item and shortcut owner        | Changed-run replacement with `stagger: none`; unchanged keyed rows stay still.                                                                                                  | Changed-run opacity only.                                                        | Final text immediately.           | `command.label.replace` → `text.replace` → `text.change/changed-runs`                                                                             |
| Empty message update / empty state                        | The visible empty message replaces only its changed runs; hiding it cancels the work.                                                                                           | Changed-run opacity only.                                                        | Final text immediately.           | `command.empty-label.replace` → `text.replace` → `text.change/changed-runs`                                                                       |
| Composed Dialog chrome / inherited Dialog owners          | The panel keeps its own supplied surface paint and the title its own foreground; they settle under the same focus/invalid priority rather than receiving a command writer.      | Short colour under the same owner priority.                                      | Final colours immediately.        | `command.dialog.colour` → `state.color` → `state.color/surface`; `command.dialog-title.colour` → `state.color` → `state.color/foreground`         |
| Composed Dialog title text / inherited Dialog owner       | The screen-reader-only title keeps Dialog's changed-run owner; the rename is a label, not a command result.                                                                     | Changed-run opacity only.                                                        | Final text immediately.           | `command.dialog-title-text.replace` → `text.replace` → `text.change/changed-runs`                                                                 |
| Composed Input Group frame / inherited Input Group owners | The frame keeps its own insertion opacity and its own surface paint inside `CommandInput`; Command writes neither.                                                              | Short opacity and colour under the same owner priority.                          | Final frame immediately.          | `command.input-frame.enter` → `presence.inline` → `data.transition/opacity`; `command.input-frame.colour` → `state.color` → `state.color/surface` |

## Interruption and lifecycle

cmdk retains filtering, scoring, selection, loop/vim bindings and pointer-selection settings. Enter/click executes
immediately; motion adds no business command or artificial loading phase. Async results delivered while the palette
is closed become current data without a hidden interpolation or a replay of old filtering transitions.

CommandDialog inherits Dialog's actual-focus gate as well as its preset. Its native initial focus commonly lands in
`CommandInput`, so the panel entry may settle immediately while Dialog's separate backdrop still fades. Inline
Command likewise settles a root entrance that would hide its focused editor. Autofocus, native editing, caret,
selection, IME composition and command execution are never delayed to finish an entrance.

- Fast input replaces the accepted query without debouncing results or waiting for typing to stop. Rows that
  filtering removes cease to be actionable immediately; no exit keeps an active descendant alive.
- Closing CommandDialog cancels remaining authored clocks; Dialog alone owns exit, modality and focus restoration.
  Reopening shows the current query and results without replaying old transitions.
- Live reduced keeps only permitted opacity and colour and settles geometry immediately. None or a zero recipe
  clock settles the effective mode's target and cancels the running writer, so Base UI's own completion protocol
  still releases modality and focus. Native editing, scrolling, selection and execution remain available.
- Unmount releases the root entrance, the colour families and every text controller; the inherited Dialog and
  Input Group resources are disposed by their own owners, without a duplicate cancellation wrapper.
- A plain string item, empty or shortcut label goes to its own text owner; changing the renderer type or supplying
  rich children establishes an immediate baseline and keeps the composed owners. The shortcut string is never
  parsed as a quantity.

## Geometry and performance

The result list is cmdk's own scroll container: its `max-height` clamp, natural result height, active-item scroll
and final layout are native, committed in the same frame as the accepted query. Command registers no measured shell
over the list, so a large result set introduces no per-row animation measurement, no FLIP animation and no
observer per filtered row.

Only the root, the callable surfaces and the bounded changed-text set animate per palette; the composed Dialog panel
and Input Group frame keep their own separate owners. Text work stays bounded by the shared aggregate limits, and
required command labels, shortcut glyphs and focus rings are never temporarily truncated or hidden for an effect.

## Acceptance scenarios

Executed in `tests/components/command.test.tsx`: the inline root entrance, the composed Dialog panel entrance and
exit, the composed Input Group frame entrance, the composed Dialog title replacement, surface and foreground colour
owners for the root, empty state, input divider, separator, item, shortcut and composed Dialog regions, and the
item/empty/shortcut changed-run replacement. Each action runs in full, reduced and none with a zero clock, and the
native editor and list are verified as non-animated boundaries.

Also pending browser verification: 3 modes × 2 OS preferences, live same-target mode/clock cancellation in a real
browser, nested palettes and portals, SSR/no-JS/hydration probes, keyboard focus and return focus, `asChild` editor
composition, and light/dark × narrow/wide screenshot review.

Delegation gaps are recorded rather than hidden: cmdk owns filtering, selection, the native editor and the list's
scroll container; Base UI Dialog owns mounting, modality, focus and the native unmount protocol; the composed Input
Group frame and Dialog panel keep their own migrated owners instead of receiving a command writer; the group heading
stays cmdk's own static text; and no performance, CLS, interaction-cost or real-device FPS measurement was taken
(ADR-023 defers performance governance).
