# Resizable motion contract

Status: target design; implementation and verification pending.

Resizable communicates which separator can be manipulated while leaving panel geometry directly under `react-resizable-panels`. The current parts are `ResizablePanelGroup`, `ResizablePanel` and `ResizableHandle`, with the optional grip enabled by `withHandle`. Motion never makes the divider trail the pointer or invents momentum, overshoot or a reset command.

Use the [shared contract](../README.md) and [preset definitions](../presets.md). The existing Group/Panel/Separator props and callbacks remain the API.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "panels": ["resizable#ResizablePanelGroup", "resizable#ResizablePanel"],
    "handle": ["resizable#ResizableHandle"],
    "grip": ["resizable#ResizableHandle"],
    "text": ["resizable#ResizablePanel"],
    "value": ["resizable#ResizablePanel"]
  }
}
```

## Capability ownership

| Capability      | Applicability and owner                                                                                                                                                                                            | References                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| Appearance      | Default: a genuinely inserted handle/grip may receive local opacity when parent presence does not already own insertion. Panel contents inherit/combine their own presence.                                        | default: `resizable.handle.enter`, `resizable.grip.enter`       |
| Size            | Inherited/native: the panel library owns sizing, constraints and direct pointer/keyboard updates. Ordinary programmatic layouts resolve through the same authority; this target adds no second width/height tween. | inherited: `resizable.panels.direct`, `resizable.panels.layout` |
| Surface colour  | Default: handle/grip hover and active-state surface/border colours. DOM focus within or an owner's own invalid state settles all paint declared by that owner immediately, including focus-visible paint.          | default: `resizable.handle.colour`                              |
| Text colour     | Inherited from panel content; default scoped feedback for an explicitly changing handle/grip foreground. The separator adds no label text state.                                                                   | default: `resizable.handle.colour`; inherited: `@text`          |
| Changed text    | Default for a direct plain ResizablePanel display string; composed for rich panel children. Neither path rewrites editor text or scans arbitrary descendant nodes.                                                 | default: `resizable.text.replace`; composed: `@text`            |
| Changed numbers | Default for a supported direct Panel display quantity; composed for rich numeric displays. Panel sizes/ids are geometry or identity, not newly introduced animated percentage labels.                              | default: `resizable.value.change`; composed: `@value`           |

## Choreography and modes

| Trigger and owner                                               | Full                                                                                                                                                                                                                         | Reduced                                                                                   | None                       | Binding → preset → recipe                                                                                                                 |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Pointer/keyboard resizing; panel library                        | One-to-one divider movement with native constraints and actual panel reflow.                                                                                                                                                 | Same direct operation.                                                                    | Same direct operation.     | `resizable.panels.direct` → `engine.native` → `native/resizable-panels` (react-resizable-panels Group/Panel/Separator geometry)           |
| Programmatic layout or constraint change                        | Use the same library destination immediately; no independent geometry animation.                                                                                                                                             | Immediate native target.                                                                  | Immediate native target.   | `resizable.panels.layout` → `engine.native` → `native/resizable-panels` (react-resizable-panels layout ownership)                         |
| Handle/grip hover, active, foreground or defined disabled state | Verified noncritical colour feedback keeps the separator hit area unchanged. DOM focus within or an owner's own invalid state cancels its colour clock and settles all its declared paint immediately; no panel press scale. | Focus/invalid-gated owner paint is immediate; other verified colour feedback stays short. | Final colour immediately.  | `resizable.handle.colour` → `state.color` → `state.color/surface-foreground`                                                              |
| Independent optional grip insertion after the handle exists     | Opacity only on the decorative grip, without changing panel layout or replaying handle entry.                                                                                                                                | Short opacity.                                                                            | Visible immediately.       | `resizable.grip.enter` → `presence.inline` → `data.transition/opacity`                                                                    |
| New separator insertion / handle paint                          | One opacity entrance of the rule and its initial optional grip; native hit region and focus outline remain immediately usable.                                                                                               | Short opacity.                                                                            | Visible immediately.       | `resizable.handle.enter` → `presence.inline` → `data.transition/opacity`                                                                  |
| Direct plain Panel display revision                             | Changed text runs without stagger or changed quantity reels, only while no direct resize/selection owns that display geometry.                                                                                               | Short changed-text opacity; quantity immediately.                                         | Final content immediately. | `resizable.text.replace` → `text.replace` → `text.change/changed-runs`; `resizable.value.change` → `number.compact` → `number.roll/reels` |

## Interruption and lifecycle

- Pointer-down immediately owns resize; repeated programmatic updates and keyboard input follow the panel library's existing rules. Do not add a second interpolation queue or delay layout callbacks.
- Preserve the real minimum/maximum/collapse constraints and separator keyboard semantics. A future smooth programmatic-layout extension requires one documented native adapter and its own cancellation proof; it is not implied by this contract.
- Mode changes never break an active direct resize or jump back to a stored layout. Live reduction cancels reels and resolves permitted paint through the reduced clock; none or zero recipe clock settles authored content/grip/colour work. A pointer resize, keyboard resizing sequence, IME or intersecting native text selection suppresses replacement work in the affected display scope, without delaying its actual content.
- Parent presence consumes a same-cause handle entrance, and handle entry consumes its initial grip entrance. Focus, pointer capture or keyboard resize settles any envelope that would obscure the separator before direct operation; later withHandle insertion can use the independent grip action.
- Parent closure/unmount releases the native gesture/listener lifecycle and local paint writers. Reopening uses the actual persisted/caller layout without replaying a synthetic expansion.

## Geometry and performance

The library's selected orientation determines the sizing axis. Native layout continuously reflows panel contents during direct manipulation because content must reflect the pointer's actual current allocation; this is a deliberate direct-operation policy, not a decorative size animation. No extra measurement host, per-panel ResizeObserver loop or text scaling is added. Outside direct operation, changed plain content lays out at the panel's actual final allocation and uses only bounded local paint/reels; it does not animate intrinsic size back into the panel solver. Apply aggregate text/reel limits across panels updated in one transaction. Existing native sizing work remains proportional to the affected group; the animation layer adds no per-frame child reads, hidden content clones or nested group listeners. Keep hit regions and focus outlines stable. Nested groups retain separate native constraint systems and must not be wrapped in independent springs that chase each other.

## Acceptance scenarios

- Pending: drag and use keyboard resizing in both orientations, nested groups and collapse/min/max configurations; the divider tracks input immediately.
- Pending: change constraints or programmatic layout during a gesture and verify existing callbacks and controlled layout remain authoritative.
- Pending: toggle `withHandle`, insert a handle with and without the grip, focus it during entry, and interact with editors in panels. Parent/handle/grip presence runs once per cause; focus and hit regions remain usable immediately.
- Pending: verify all modes, live downgrade, zero clock, parent close/reopen and unmount during a gesture without stuck drag state or retained writers.
- Pending: update a direct plain Panel string/quantity during active drag and after release; select text across that content, swap rich editors, and replace a nested group mid-gesture. No display effect competes with the native allocation, selection or gesture lifecycle.

- Pending: focus a separator during hover paint, including focus on a descendant in a supported custom render. All paint declared by that focused owner settles immediately; independently owned verified grip/handle paint retains its own policy without changing keyboard resize or capture.
