# Input Group motion contract

Status: frame, display-text and inherited-member actions migrated; browser matrix and performance governance remain deferred under ADR-023.

InputGroup presents a single stable frame while addons, display text and actions change around a native editor. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names. InputGroupText now carries `data-slot="input-group-text"` and its plain content owns the changed-run hosts; InputGroupButton renders Button itself, so the composed action keeps Button's own slot and owners. These names identify actual parts rather than invented slots.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "parts": {
    "root": ["input-group#InputGroup"],
    "addon": ["input-group#InputGroupAddon"],
    "text": ["input-group#InputGroupText"],
    "label": ["input-group#InputGroupText", "input-group#InputGroupAddon"],
    "quantity": ["input-group#InputGroupText", "input-group#InputGroupAddon"],
    "input": ["input-group#InputGroupInput"],
    "textarea": ["input-group#InputGroupTextarea"],
    "member": ["input#Input", "textarea#Textarea", "button#Button"],
    "field": ["input#Input"],
    "multiline": ["textarea#Textarea"],
    "button": ["button#Button"],
    "button-feedback": ["button#Button"],
    "button-label": ["button#Button"],
    "button-quantity": ["button#Button"]
  },
  "regions": {
    "root": ["input-group"],
    "addon": ["input-group-addon"],
    "text": ["input-group-text"],
    "label": ["input-group-label"],
    "quantity": ["input-group-number"],
    "input": ["input-group-control"],
    "textarea": ["input-group-control"],
    "member": ["input-group-control", "button"],
    "field": ["input-group-control"],
    "multiline": ["input-group-control"],
    "button": ["button"],
    "button-feedback": ["button-feedback"],
    "button-label": ["button-text"],
    "button-quantity": ["button-number"]
  },
  "axes": { "root": ["height"], "field": ["width", "height"], "multiline": ["height"], "button": ["width", "height"] }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                                                                                                                                        | References                                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Appearance      | default: the frame owns one insertion and an addon owns its own later-insertion and retained-exit opacity; inherited: a composed member keeps its own entrance in this context.                                           | default: `input-group.root.enter`, `input-group.addon.enter`, `input-group.addon.exit`; inherited: `input-group.member.enter`                                    |
| Size            | default: the frame owns its committed block extent; inherited: Input, Textarea and Button keep their own measured boxes, and native editing stays theirs.                                                                 | default: `input-group.root.resize`; inherited: `input-group.field.resize`, `input-group.multiline.resize`, `input-group.button.resize`, `input-group.input.edit` |
| Surface colour  | default: the frame owns its border, background and shadow; inherited: composed members keep their own surface and foreground owners rather than receiving a second frame writer.                                          | default: `input-group.root.colour`; inherited: `input-group.member.colour`                                                                                       |
| Text colour     | default: InputGroupText owns its display foreground; inherited: the native control and a composed Button keep their own foreground owners.                                                                                | default: `input-group.text.colour`; inherited: `input-group.member.colour`                                                                                       |
| Changed text    | default: plain strings in InputGroupText or an addon change runs in place; composed: rich children follow their own owners; inherited: a composed Button keeps its label owner; not-applicable: the native control value. | default: `input-group.label.replace`; composed: `@text`; inherited: `input-group.button-label.replace`; not-applicable: `@input`, `@textarea`                    |
| Changed numbers | default: a direct display quantity in InputGroupText or an addon reels; composed: rich counters follow their own owners; inherited: a composed Button keeps its quantity owner; not-applicable: editable numeric values.  | default: `input-group.quantity.roll`; composed: `@text`; inherited: `input-group.button-quantity.roll`; not-applicable: `@input`, `@textarea`                    |

## Choreography and modes

The presence.exit bindings below select the exit.fade recipe, not a popup ending phase.

| Trigger / owner                                               | full                                                                                                                                                                                                           | reduced                                                | none                                  | Binding → preset → recipe/form                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Group insertion / frame                                       | One opacity entrance for frame and initial parts.                                                                                                                                                              | Short opacity.                                         | Immediate.                            | `input-group.root.enter` → `presence.inline` → `data.transition/opacity`                                                                                                                                                                                                                       |
| Addon/action membership change / frame and addon              | Fade the changed addon; adjust the bounded frame extent and retained addon positions only when the editor is unfocused and no pointer or composition gesture is active, otherwise commit geometry immediately. | Size and position immediate, opacity only.             | Immediate.                            | `input-group.addon.enter` → `presence.inline` → `data.transition/opacity`; `input-group.addon.exit` → `presence.exit` → `exit.fade/opacity`; `input-group.addon.move` → `layout.compact` → `layout.move/position`; `input-group.root.resize` → `geometry.compact` → `geometry.resize/measured` |
| Focus/invalid/state change / frame and display text           | An owner with DOM focus-within or invalid state settles all its declared paint immediately; other eligible owners transition independently.                                                                    | Same immediate owner priority, otherwise short colour. | Immediate.                            | `input-group.root.colour` → `state.color` → `state.color/surface`; `input-group.text.colour` → `state.color` → `state.color/foreground`                                                                                                                                                        |
| Display content revision / InputGroupText or addon            | Changed-only text with stagger:none; a quantity reels and shares the frame's geometry transaction only when the displayed content actually changes.                                                            | Short changed-text opacity; quantity immediate.        | Immediate.                            | `input-group.label.replace` → `text.replace` → `text.change/changed-runs`; `input-group.quantity.roll` → `number.compact` → `number.roll/reels`                                                                                                                                                |
| Editor changes / InputGroupInput                              | Native editing and direct geometry.                                                                                                                                                                            | Same.                                                  | Same.                                 | `input-group.input.edit` → `engine.native` → `native/input` (native Input editing (no recipe))                                                                                                                                                                                                 |
| Composed member insertion / inherited Input, Textarea, Button | The member keeps its own independent entrance in the group's context; the group neither replays nor suppresses it.                                                                                             | Short opacity.                                         | Immediate.                            | `input-group.member.enter` → `presence.inline` → `data.transition/opacity`                                                                                                                                                                                                                     |
| Composed member paint / inherited Input, Textarea, Button     | Each member keeps its own surface and foreground owner with immediate focus/invalid priority; the frame installs no competing writer on the same node.                                                         | Same immediate priority, otherwise short colour.       | Immediate.                            | `input-group.member.colour` → `state.color` → `state.color/surface-foreground`                                                                                                                                                                                                                 |
| Composed member box / inherited Input and Button              | The member interpolates its own authored box; a focused editor or a caller clock settles it immediately.                                                                                                       | Immediate size.                                        | Immediate size.                       | `input-group.field.resize` → `geometry.compact` → `geometry.resize/measured`; `input-group.button.resize` → `geometry.compact` → `geometry.resize/measured`                                                                                                                                    |
| Composed textarea box / inherited Textarea                    | The textarea interpolates only an explicit `rows` or authored block revision while unfocused.                                                                                                                  | Immediate block size.                                  | Immediate block size.                 | `input-group.multiline.resize` → `geometry.content` → `geometry.resize/measured`                                                                                                                                                                                                               |
| InputGroupButton lifecycle / inherited Button                 | Button keeps one press visual on its own inner layer and one exit when its membership ends.                                                                                                                    | Inherited no-scale feedback, opacity-only exit.        | Native activation, immediate removal. | `input-group.button.exit` → `presence.exit` → `exit.fade/opacity`; `input-group.button-feedback.press` → `feedback.press` → `feedback.press/scale`                                                                                                                                             |
| InputGroupButton labels / inherited Button                    | Button replaces its own changed label runs and reels its own quantity once; the group adds no second text writer.                                                                                              | Short changed-text opacity; quantity immediate.        | Immediate.                            | `input-group.button-label.replace` → `text.replace` → `text.change/changed-runs`; `input-group.button-quantity.roll` → `number.compact` → `number.roll/reels`                                                                                                                                  |

The `text` binding owns only the InputGroupText foreground host; `label` and `quantity` own the plain display runs inside InputGroupText and an addon. The frame's `root.colour` claims surface paint only, so the control and the display text keep their own foreground owners and no node receives two colour families. InputGroupButton inherits [Button](button.md) once, including its press, colour, label, quantity, exit and box behavior; the `button.*` bindings alias that existing owner and add no second writer. `input.edit` delegates to the actual Input editor, whose native element this composition names explicitly. The textarea control keeps Textarea's own module and slot instead of rendering a caller-supplied element, so its editing ownership is recorded through `multiline.resize` and the editable-part boundaries rather than a local native row: a composed native element cannot carry Textarea's own instrumented host.

## Interruption and lifecycle

Rapid addon changes keep the latest structure without replaying the editor. Clicking an addon preserves the existing native focus path. During composition, selection or a pointer gesture the frame geometry yields to editor stability, and blur does not replay a suppressed change. Removed actions retain no duplicate tab stop: a retained addon is inert and aria-hidden while its opacity exits, and its completion removes it. Only keyed children are retained; an unkeyed membership change commits immediately instead of inventing an identity.

Live reduced settles frame and addon geometry and quantity reels while permitted addon/changed-run opacity and eligible colour reconcile under their reduced contracts. None or a zero recipe clock settles one-shot work to the effective mode's current target. Each inherited Button/Input/Textarea owner uses its actually resolved context; a group mode does not override an explicit nested provider. Parent removal still invalidates descendant lifecycle work, and restoring full does not replay cancelled structure or content changes.

The focus event itself cancels geometry that affects the native editor before paint; idle focus is not permission to animate its content box. Display text and colour may still update, but the native value, caret and scroll extents remain immediate. A button or addon that transfers focus uses the native target first, and its removal releases the press and measurement registration before any decorative exit.

## Geometry and performance

Measure the frame and the changed addon after commitment. The frame claims only its block axis: `w-full` makes the inline size parent-owned, so width is never interpolated here. Inline adornments retain their existing line and truncation policy; a block addon lays out at destination width before the frame height is interpolated. Never measure or animate the input value itself, and never clip a caret or focus ring.

One frame transaction consumes the final visible addon boxes; the frame and the addon projection never chase an interpolated child size. The projection writes only `transform` on retained addons, so a Button press transform and the frame's box stay separate owners. A shrink that would clip a final-visible affix, action or editor commits that axis immediately. Measure only the visible tracked addons in one pass, bounded by the shared collection limit; unavailable identity or an over-budget set commits affected presence and layout immediately.

## Acceptance scenarios

Executed: frame insertion, surface colour and block resize; addon insertion, retained exit and retained-addon positions; display text replacement, quantity reel and foreground colour on both InputGroupText and an addon; inherited member entrance, colour and boxes for the composed Input, Textarea and Button; Button exit, press and label/quantity ownership; native input and textarea boundaries. Each runs in full, reduced and none with a zero clock.

Also pending browser verification: prefix/suffix and block addons; changing display counts; editor IME while an addon changes; an invalid focus frame; a constrained width with rapid structural changes; focus before typing during a suffix resize; updating a quantity while text is selected; removing a block action while a textarea is scrolled, with native selection and scroll surviving.

Also pending: an explicit nested provider on the composed Button or control during a live downgrade, and a real pointer gesture during frame geometry; the group must not override the nested mode or replay a consumed change.

Delegation gaps are recorded rather than hidden: the composition does not accept a non-native editor replacement for the control, the frame block size is only interpolated when `min-height` and `max-height` admit the destination, and an unkeyed addon removal has no exit animation.
