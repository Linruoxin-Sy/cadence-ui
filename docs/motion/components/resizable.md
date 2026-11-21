# Resizable motion contract

Status: implemented contract; functional evidence is required by the per-item v2 gate.

Resizable communicates which separator can be manipulated while leaving panel geometry directly under `react-resizable-panels`. The current parts are `ResizablePanelGroup`, `ResizablePanel` and `ResizableHandle`, with the optional grip enabled by `withHandle`. Motion never makes the divider trail the pointer or invents momentum, overshoot or a reset command.

Use the [shared contract](../README.md) and [preset definitions](../presets.md). The existing Group/Panel/Separator props and callbacks remain the API.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "parts": {
    "panels": ["resizable#ResizablePanelGroup", "resizable#ResizablePanel"],
    "handle": ["resizable#ResizableHandle"],
    "grip": ["resizable#ResizableHandle"]
  },
  "regions": {
    "panels": ["resizable-panel-group", "resizable-panel"],
    "handle": ["resizable-handle-rule"],
    "grip": ["resizable-handle-grip"]
  }
}
```

## Capability ownership

| Capability      | Applicability and owner                                                                                                                                                                                                                   | References                                                                      |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Appearance      | Default: a genuinely inserted handle, and a grip inserted after its handle exists, receive one local opacity entrance. Panel roots inherit insertion from their parent composition and add no second envelope.                            | default: `resizable.handle.enter`, `resizable.grip.enter`; inherited: `@panels` |
| Size            | Inherited/native: the panel library owns sizing, constraints and direct pointer/keyboard updates. Programmatic layouts resolve through the same authority; this contract adds no second width/height tween.                               | inherited: `resizable.panels.direct`, `resizable.panels.layout`                 |
| Surface colour  | Default: the handle rule's own declared surface and foreground, including library `data-separator` hover/active states and theme changes. Focus within the rule or its own invalid state settles all of that paint immediately.           | default: `resizable.handle.colour`                                              |
| Text colour     | Default: the rule's scoped foreground, inherited by the grip's `currentColor` glyph, transitions with that same owner. Panel children are caller content with their own text owners, and panel sizes or ids are never painted as a label. | default: `resizable.handle.colour`                                              |
| Changed text    | Not applicable: a plain or rich panel child is exact caller content rendered through the library's content element. This wrapper adds no display host, so it never rewrites, splits or re-lays out a panel's text.                        | not-applicable: `@panels`                                                       |
| Changed numbers | Not applicable: panel content quantities belong to the caller or their composed owners; sizes, ids and scroll readouts are geometry or identity, never an animated percentage label of this wrapper.                                      | not-applicable: `@panels`                                                       |

## Choreography and modes

| Trigger and owner                                               | Full                                                                                                                                                                                                                         | Reduced                                                                                   | None                      | Binding → preset → recipe                                                                                                       |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Pointer/keyboard resizing; panel library                        | One-to-one divider movement with native constraints and actual panel reflow.                                                                                                                                                 | Same direct operation.                                                                    | Same direct operation.    | `resizable.panels.direct` → `engine.native` → `native/resizable-panels` (react-resizable-panels Group/Panel/Separator geometry) |
| Programmatic layout or constraint change                        | Use the same library destination immediately; no independent geometry animation.                                                                                                                                             | Immediate native target.                                                                  | Immediate native target.  | `resizable.panels.layout` → `engine.native` → `native/resizable-panels` (react-resizable-panels layout ownership)               |
| Handle/grip hover, active, foreground or defined disabled state | Verified noncritical colour feedback keeps the separator hit area unchanged. DOM focus within or an owner's own invalid state cancels its colour clock and settles all its declared paint immediately; no panel press scale. | Focus/invalid-gated owner paint is immediate; other verified colour feedback stays short. | Final colour immediately. | `resizable.handle.colour` → `state.color` → `state.color/surface-foreground`                                                    |
| Independent optional grip insertion after the handle exists     | Opacity only on the decorative grip, without changing panel layout or replaying handle entry.                                                                                                                                | Short opacity.                                                                            | Visible immediately.      | `resizable.grip.enter` → `presence.inline` → `data.transition/opacity`                                                          |
| New separator insertion / handle paint                          | One opacity entrance of the rule and its initial optional grip; native hit region and focus outline remain immediately usable.                                                                                               | Short opacity.                                                                            | Visible immediately.      | `resizable.handle.enter` → `presence.inline` → `data.transition/opacity`                                                        |

## Interruption and lifecycle

- Pointer-down immediately owns resize; repeated programmatic updates and keyboard input follow the panel library's existing rules. Do not add a second interpolation queue or delay layout callbacks.
- Preserve the real minimum/maximum/collapse constraints and separator keyboard semantics. A future smooth programmatic-layout extension requires one documented native adapter and its own cancellation proof; it is not implied by this contract.
- Mode changes never break an active direct resize or jump back to a stored layout. Live reduction settles permitted paint through the reduced clock; none or a zero recipe clock settles authored grip/rule work. A pointer resize, keyboard resizing sequence or IME gesture changes nothing about this wrapper's display work, because it owns no display host: panel content stays exact caller content.
- Parent presence consumes a same-cause handle entrance, and handle entry consumes its initial grip entrance. Focus, pointer capture or keyboard resize settles any envelope that would obscure the separator before direct operation; later withHandle insertion can use the independent grip action.
- Parent closure/unmount releases the native gesture/listener lifecycle and local paint writers. Reopening uses the actual persisted/caller layout without replaying a synthetic expansion.

The implementation keeps one opacity owner per host (`createInlinePresence`) and one scoped colour owner on the rule (`useStateColor`). Vertical group and panel roots stay with the library, and the wrapper adds no text, number or geometry controller.

## Geometry and performance

The library's selected orientation determines the sizing axis. Native layout continuously reflows panel contents during direct manipulation because content must reflect the pointer's actual current allocation; this is a deliberate direct-operation policy, not a decorative size animation. No extra measurement host, per-panel ResizeObserver loop or text scaling is added. Existing native sizing work remains proportional to the affected group; the animation layer adds no per-frame child reads, hidden content clones or nested group listeners. Keep hit regions and focus outlines stable. Nested groups retain separate native constraint systems and must not be wrapped in independent springs that chase each other.

Panel children keep their exact element tree, so caller layout, refs, editing and scroll containers are untouched. Percentage constraints and the library's own hit-target expansion stay native.

## Acceptance scenarios

- Drag and use keyboard resizing in both orientations, nested groups and collapse/min/max configurations; the divider tracks input immediately and no authored geometry writer appears.
- Change constraints or programmatic layout during a gesture and verify existing callbacks and controlled layout remain authoritative.
- Toggle `withHandle`, insert a handle with and without the grip, focus it during entry, and interact with editors in panels. Parent/handle/grip presence runs once per cause; focus and hit regions remain usable immediately.
- Verify all modes, live downgrade, zero clock, parent close/reopen and unmount during a gesture without stuck drag state or retained writers.
- Replace or revise direct panel content during an active drag and after release, select text across it, swap rich editors, and replace a nested group mid-gesture: content commits immediately with no authored writer, and no display effect competes with the native allocation or gesture lifecycle.
- Focus a separator during hover paint, including focus on a descendant in a supported custom render. All paint declared by that focused owner settles immediately; independently owned verified grip/handle paint retains its own policy without changing keyboard resize or capture.
- Check single-handle and nested instances under one provider: reversing, closing or reducing one owner cannot retarget the other.

## Bounds

Direct size output, constraint solving and separator hit expansion remain finite library work. Panel content is never measured, cloned or re-laid out by this wrapper, so its own per-frame work stays constant regardless of how much text a panel holds. No numeric budget is claimed as satisfied here: [ADR-023](../../adr.md#adr-023--effects-first-migration-performance-governance-afterwards) keeps measurement advisory during functional migration.
