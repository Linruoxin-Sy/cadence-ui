# Command motion contract

Status: target design; implementation and verification pending.

The search input responds natively while the current command set changes immediately. Motion helps the results viewport and committed display labels settle; it never postpones filtering or executing a command. This contract inherits the [common contract](../README.md) and [presets](../presets.md); bindings are design references, not recipe IDs or public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "root": ["command#Command"],
    "dialog": ["command#CommandDialog", "dialog#DialogContent"],
    "input": ["command#CommandInput"],
    "list": ["command#CommandList"],
    "item": ["command#CommandItem"],
    "surface": [
      "command#Command",
      "command#CommandGroup",
      "command#CommandEmpty",
      "command#CommandShortcut",
      "command#CommandInput",
      "command#CommandSeparator"
    ],
    "label": ["command#CommandItem", "command#CommandGroup", "command#CommandEmpty", "command#CommandShortcut"],
    "quantity": ["command#CommandItem", "command#CommandEmpty"],
    "input-frame": ["input-group#InputGroup"],
    "input-control": ["command#CommandInput", "input-group#InputGroupInput"]
  }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                                                                                            | References                                                                                                |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Appearance      | Default: inline `command` can own one independent entrance. `CommandDialog` inherits Dialog presence, including its command children; no second popup entrance.                                                  | default: `command.root.enter`; inherited: `command.dialog.enter`, `command.dialog.exit`                   |
| Size            | Default: `command-list` owns intentional result-height changes within its existing max height; CommandDialog delegates the same cause to that host instead of chasing it with another panel spring.              | default: `command.list.resize`                                                                            |
| Surface colour  | Default: command/item surfaces, CommandInput's outer wrapper border and CommandSeparator's rule own their supplied paint; the composed Input Group frame retains its existing owner.                             | default: `command.item.colour`, `command.surface.colour`; inherited: `@input-frame`                       |
| Text colour     | Default: item, group heading, empty state and shortcut foreground changes. The default input inherits InputGroupInput; an `asChild` replacement delegates foreground to its actual caller input owner.           | default: `command.item.colour`, `command.surface.colour`; inherited: `@input-control`; composed: `@input` |
| Changed text    | Default for owned primitive item/heading/empty/shortcut strings. Native `CommandInput` edits stay immediate; rich labels use composed ownership. Screen-reader-only dialog title/description update immediately. | default: `command.label.change`; composed: `@label`                                                       |
| Changed numbers | Composed: an explicit result count or quantity may roll; there is no built-in count slot, and shortcuts/command IDs are not counters.                                                                            | composed: `command.quantity.change`                                                                       |

## Choreography and modes

| Trigger / owner                                                        | Full                                                                                                                                                                                  | Reduced                                                                          | None                              | Binding → preset → recipe/form                                                                                                   |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Inline insertion / root                                                | Opacity entrance only when no parent owns it. Entry is subject to the actual-focus gate below.                                                                                        | Short opacity. Entry obeys the same focus gate.                                  | Final content immediately.        | `command.root.enter` → `presence.inline` → `data.transition/opacity`                                                             |
| CommandDialog open/close / inherited Dialog owner                      | Dialog's surface presence once; Command adds no extra popup layer. Entry is subject to the actual-focus gate below.                                                                   | Inherited short opacity. Entry obeys the same focus gate.                        | Final semantic state immediately. | `command.dialog.enter` → `presence.surface` → `enter.pop/surface`; `command.dialog.exit` → `presence.exit` → `exit.fade/opacity` |
| Editing/filtering/navigation / cmdk and native input                   | Query/results/current selection commit immediately; no per-result entrance stagger or delayed action.                                                                                 | Same immediate behavior.                                                         | Same immediate behavior.          | `command.input.edit` → `engine.native` → `native/cmdk` (cmdk/native input and selection (no new recipe))                         |
| Result set/empty state change / list viewport                          | Measure latest result-region height; clamp to max height and preserve scroll/active item.                                                                                             | Final height immediately.                                                        | Final height immediately.         | `command.list.resize` → `geometry.compact` → `geometry.resize/measured`                                                          |
| Pointer selection/state / item                                         | Scoped surface/foreground transition; keyboard selected highlight appears immediately. Colour eligibility and immediate-owner priority follow the rule below.                         | Short colour feedback; keyboard immediate. Colour obeys the same owner priority. | Final state immediately.          | `command.item.colour` → `state.color` → `state.color/surface-foreground`                                                         |
| Supplied tokens/disabled state / root and non-item display-text owners | Scoped surface/border/foreground colour, respecting the inherited Input Group owner and immediate caret/focus. Colour eligibility and immediate-owner priority follow the rule below. | Short colour. Colour obeys the same owner priority.                              | Final colours immediately.        | `command.surface.colour` → `state.color` → `state.color/surface-foreground`                                                      |
| Primitive display update / text owner                                  | Changed-run replacement with `stagger: none`; unchanged keyed rows stay still.                                                                                                        | Changed-run opacity only.                                                        | Final text immediately.           | `command.label.change` → `text.replace` → `text.change/changed-runs`                                                             |
| Explicit composed quantity / quantity owner                            | Roll changed numeric places; never animate shortcut digits as a quantity.                                                                                                             | Final number immediately.                                                        | Final number immediately.         | `command.quantity.change` → `number.compact` → `number.roll/reels`                                                               |

`item.colour` alone merges hover, selected, disabled and theme paint for each CommandItem.
`surface.colour` owns root, group heading, empty state, shortcut and Separator rule regions, plus
CommandInput's outer border wrapper; it does not run on the same item properties or native input.
The inner Input Group frame stays with InputGroup. In the default input branch, native foreground
inherits InputGroupInput's `control.colour`. When `asChild` replaces that input, foreground belongs
to the actual caller input owner; Command does not inject another writer. A caller-provided
InputGroupInput retains its normal inherited contract. The frame is not a second command-owned
surface, and no text controller touches the native input value.
CommandItem's generated check glyph keeps immediate visibility from the existing caller-provided
`data-checked` state and Shortcut suppression; colour inherits the one item owner. Motion does not
infer a checked state from cmdk selection or add a new toggle action.

Colour eligibility is per actual root, item or display region. DOM focus/focus-within or that region's own invalid state cancels its colour clock and settles all its declared paint immediately. Thus input focus settles the containing Command root and inherited input-frame/control owners, not every result item's palette. cmdk selection/active-descendant is not DOM focus; the immediate keyboard highlight above is an explicit selection policy. Other colour interpolation requires a verified readable palette.

## Interruption and lifecycle

CommandDialog inherits Dialog's actual-focus gate as well as its preset. Its native initial focus commonly lands in CommandInput, so the panel entry may settle immediately while Dialog's separate backdrop still fades. Inline Command likewise settles a root entrance that would hide its focused editor. Do not delay autofocus, native editing or command execution to finish a palette entrance.

- cmdk retains filtering, scoring, selection, loop/vim bindings and pointer-selection settings. Enter/click executes immediately; motion adds no business command or artificial loading phase.
- Fast input coalesces height targets; overload uses immediate geometry, not a backlog. Rows disappearing from filtering cease to be actionable immediately and cannot retain active descendant references through an exit.
- Closing CommandDialog cancels list/text/number work; Dialog alone owns exit and focus restoration. Reopening shows current query/results without replaying old filtering transitions.
- Live reduced cancels layout/reels; none/zero clock cancels remaining authored clocks and lets the inherited Dialog finish through Base UI's actual native completion protocol. Native editing, scrolling, selection and execution remain available. Unmount releases measurement and inherited dialog resources without duplicate cancellation wrappers.
- Async result updates received while closed become current data without hidden interpolation or reopening. A new accepted query/open revision invalidates stale height/exit callbacks; returning to full does not replay filtered-out results. Preserve controlled query/selection semantics rather than optimistically accepting callbacks.

## Geometry and performance

- Lay result text at final available width, then measure the natural result region and size one list viewport. Keep the existing max-height/scroll contract; passive font/viewport reflow is immediate.
- In CommandDialog, list-height changes update the panel's natural layout; the panel does not separately animate or observe the same interpolated cause. Other explicit dialog changes still use the Dialog contract.
- One list measurement, stable item identities, no observer or FLIP animation per filtered row. Above the visible-list budget, skip blanket measurement/animation and keep native filtering/scrolling.
- Clip only the scroll/result region; preserve input caret/focus rings, group structure, cmdk semantics and descendant portals. No rolling or text splitting in the native editor.
- Natural result content and its sizing viewport are separate regions; clamp the rendered height to valid non-negative bounds. Keep the active command immediately visible through the existing scroll contract, otherwise settle the viewport's height. Required command labels/shortcuts cannot gain temporary truncation or hidden focus targets for a geometry effect. Do not add a new virtualizer or search for offscreen rows to decorate.

List-height animation below the editor may continue only while that editor's content box, caret and scroll stay stable. The stock CommandDialog's fixed top placement can satisfy that condition; a caller's centering/wrapping layout that would move the editor must settle the affected dependent axis. Do not freeze native typing or replay the suppressed resize on blur.

## Acceptance scenarios

- Pending: fast typing/IME, scoring changes, empty results, disabled commands, keyboard/vim navigation and Enter selection remain immediate.
- Pending: changing partial labels and explicit counts preserves stable rows; shortcut digits and screen-reader-only dialog names never roll.
- Pending: inline versus CommandDialog composition, result-height changes while closing, all modes, live downgrade and zero clock have exactly one presence/geometry owner.
- Pending: move active selection into newly added results while the viewport changes size, deliver async results after close and reject a controlled query update; native current state and readable commands win over stale animation targets.
- Pending: Autofocus CommandInput as CommandDialog opens, then type while results resize; the input never waits for surface entry and geometry only animates while its caret/content box stays stable.
