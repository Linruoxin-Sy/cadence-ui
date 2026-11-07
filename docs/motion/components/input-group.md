# Input Group motion contract

Status: target design; implementation and verification pending.

InputGroup presents a single stable frame while addons, display text and actions change around a native editor. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names. InputGroupText currently has no dedicated data-slot, and InputGroupButton renders Button; these names identify actual parts rather than invented slots.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "root": ["input-group#InputGroup"],
    "addon": ["input-group#InputGroupAddon", "input-group#InputGroupButton"],
    "text": ["input-group#InputGroupText", "input-group#InputGroupAddon"],
    "control": ["input-group#InputGroupInput", "input-group#InputGroupTextarea"],
    "button": ["input-group#InputGroupButton", "button#Button"]
  }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                                                                                                                                                                  | References                                                                                               |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Appearance      | default: input-group owns one insertion; later addon/action insertion has its own cause; inherited for an enclosing parent entrance.                                                                                                                | default: `input-group.root.enter`, `input-group.addon.enter`, `input-group.addon.exit`                   |
| Size            | default: frame owns eligible addon/content-driven outer geometry; controls own native editing growth and direct resizing. Any revision affecting a focused editor's box/scroll extent is immediate; parent-constrained dimensions remain inherited. | default: `input-group.root.resize`; inherited: `@control`                                                |
| Surface colour  | default: input-group owns focus/invalid frame chrome; composed InputGroupButton retains Button feedback; controls do not duplicate frame chrome.                                                                                                    | default: `input-group.root.colour`; inherited: `@button`                                                 |
| Text colour     | default: InputGroupText/addon foreground and native control foreground; composed buttons retain their owner.                                                                                                                                        | default: `input-group.text.colour`, `input-group.control.colour`; inherited: `@button`                   |
| Changed text    | default: direct display strings in InputGroupText and addons; composed rich display children; editable input/textarea values remain native.                                                                                                         | default: `input-group.text.replace`; composed: `@text`; inherited: `@button`; not-applicable: `@control` |
| Changed numbers | default: direct display quantities in InputGroupText/addons; composed rich counters; editable numbers and identifier-like affixes do not roll.                                                                                                      | default: `input-group.text.roll`; composed: `@text`; inherited: `@button`; not-applicable: `@control`    |

## Choreography and modes

The presence.exit bindings below select the exit.fade recipe, not a popup ending phase.

| Trigger / owner                                       | full                                                                                                                                                                                             | reduced                                                  | none                                 | Binding → preset → recipe/form                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Group insertion / frame                               | One opacity entrance for frame and initial parts.                                                                                                                                                | Short opacity.                                           | Immediate.                           | `input-group.root.enter` → `presence.inline` → `data.transition/opacity`                                                                                                                                                                                                                       |
| Addon/action membership change / frame                | Fade changed addon; adjust bounded outer size and retained segment positions only when the editor is unfocused and no selection/resize gesture is active. Otherwise commit geometry immediately. | Size/position immediate, opacity only.                   | Immediate.                           | `input-group.addon.enter` → `presence.inline` → `data.transition/opacity`; `input-group.addon.exit` → `presence.exit` → `exit.fade/opacity`; `input-group.root.resize` → `geometry.compact` → `geometry.resize/measured`; `input-group.addon.move` → `layout.compact` → `layout.move/position` |
| Focus/invalid/state change / frame and display owners | Scoped colour/shadow transitions; focus is immediately visible.                                                                                                                                  | Short colour.                                            | Immediate.                           | `input-group.root.colour` → `state.color` → `state.color/surface`; `input-group.text.colour` → `state.color` → `state.color/foreground`; `input-group.control.colour` → `state.color` → `state.color/foreground`                                                                               |
| Display content revision / InputGroupText or addon    | Changed-only text with stagger:none; quantity reels share the frame's geometry transaction; its destination/measurement runs only when actual displayed content geometry changes.                | Short changed-text opacity; quantity/geometry immediate. | Immediate.                           | `input-group.text.replace` → `text.replace` → `text.change/changed-runs`; `input-group.text.roll` → `number.compact` → `number.roll/reels`                                                                                                                                                     |
| Editor changes / input-group-control                  | Native editing and direct geometry.                                                                                                                                                              | Same.                                                    | Same.                                | `input-group.control.edit` → `engine.native` → `native/input` (native Input/Textarea editing (no recipe))                                                                                                                                                                                      |
| InputGroupButton activation / inherited Button owner  | Use Button feedback once on its supported inner layer, without moving the editor or adding a frame press writer.                                                                                 | Inherited no-scale feedback.                             | Native activation without animation. | `input-group.button.press` → `feedback.press` → `feedback.press/scale` (inherited Button)                                                                                                                                                                                                      |

The `text` bindings own only display Text/Addon regions. The `control.colour` binding owns native
InputGroupInput/InputGroupTextarea foreground and placeholder paint only; it never receives a text
diff or reel renderer. InputGroupButton inherits [Button](button.md) once, including its label/quantity and colour behavior; `button.press` aliases that existing owner. Group-frame colour replaces conflicting
control-frame chrome at the composition boundary, while native editing remains the control's owner.

`control.colour` is the composition binding at the existing [Input](input.md)/[Textarea](textarea.md) colour owner, narrowed to foreground/placeholder paint. It replaces that owner's combined chrome binding for this composition; it does not install another foreground transition on the same native node. The group frame owns surface/shadow colours and each control still owns native editing.

## Interruption and lifecycle

Rapid addon changes keep the latest structure without replaying the editor. Clicking an addon preserves the existing native focus path. During composition, selection or pointer resize, frame geometry yields to editor stability. Removed actions retain no duplicate tab stop. Live mode changes cancel the corresponding frame/text owners; none or a zero clock also cancels colours, fades and delays. Parent removal consumes descendant exits.

The focus event itself cancels geometry that affects the native editor before paint; idle focus is not permission to animate its content box. Display text/colour may still update, but native value, caret and scroll extents remain immediate. Blur never replays suppressed addon motion. A button/addon that transfers focus uses the native target first, and removal releases its press/measurement registration before any decorative exit.

## Geometry and performance

Measure changed addons and the frame after commitment, on the axis implied by inline/block alignment. Inline adornments retain their existing line/truncation policy; multiline block addons lay out at destination width before frame-height interpolation. Never measure or animate the input value itself. Clamp available editor width; do not clip caret or focus rings. A Button press writes only its own transform, never the frame. Passive responsive layout and textarea typing growth remain immediate.

One frame transaction consumes final addon boxes; child Button dimensions are either delegated for that cause or supply their final destination once. Do not observe a child's interpolated width or let group displacement overwrite its press transform. If the final-visible affix, action or editor would be newly clipped by an intermediate frame, commit that axis immediately. Measure only changed visible addons in one pass; shared text/reel limits or unavailable identity yield immediate affected display/layout, never editor mirroring.

## Acceptance scenarios

Target acceptance; not executed: prefix/suffix and block addons; changing display count; editor IME while addon changes; invalid focus frame; InputGroupButton press; no invented Text slot; constrained width, rapid changes, all modes and zero clock.

Also pending: focus before typing during a suffix resize, update a quantity while selecting text, and remove a block action while a textarea is scrolled; native selection/scroll survive and blur does not start deferred movement.
