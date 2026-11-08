# Button motion contract

Status: target design; implementation and verification pending.

Button gives immediate press feedback while keeping its label and hit target stable through content changes. It adds no loading, success or request state. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings below are internal design names, not public APIs or recipe IDs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "root": ["button#Button"],
    "feedback": ["button#Button"],
    "label": ["button#Button"]
  }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                                                                                                         | References                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| Appearance      | default: button root for independent dynamic insertion; inherited when a parent consumes the same entrance cause.                                                                          | default: `button.root.enter`, `button.root.exit`    |
| Size            | default: button root owns intrinsic label/icon-driven width and explicit size-variant dimensions; externally constrained axes and passive reflow follow the parent.                        | default: `button.root.resize`                       |
| Surface colour  | default: button background, border and scoped shadow respond to variant, hover, press, focus and disabled state.                                                                           | default: `button.root.colour`                       |
| Text colour     | default: button foreground; inherited by text and currentColor icons unless explicitly overridden.                                                                                         | default: `button.root.colour`                       |
| Changed text    | default: direct plain-text label retains unchanged graphemes; composed for rich children without a known display slot.                                                                     | default: `button.label.replace`; composed: `@label` |
| Changed numbers | default: a supported direct numeric child is the quantity signal and uses compact reels without changing its existing output; identifier strings remain text and rich content is composed. | default: `button.label.roll`; composed: `@label`    |

## Choreography and modes

The presence.exit bindings below select the exit.fade recipe, not a popup ending phase.

| Trigger / owner                                                  | full                                                                                                                                        | reduced                                                                 | none                            | Binding → preset → recipe/form                                                                                                                                                                             |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dynamic insertion / button                                       | Opacity entry; parent-owned removal retains a fade.                                                                                         | Short opacity only.                                                     | Visible or removed immediately. | `button.root.enter` → `presence.inline` → `data.transition/opacity`; `button.root.exit` → `presence.exit` → `exit.fade/opacity`                                                                            |
| Native press and release / internal feedback visual              | scale.press toward the active state, then settle; native root hit geometry and semantics remain immediate.                                  | No scale.                                                               | No animation.                   | `button.feedback.press` → `feedback.press` → `feedback.press/scale`                                                                                                                                        |
| State change / button                                            | All declared paint is immediate while the root has DOM focus-within or invalid state; other eligible surface/foreground changes transition. | Same immediate owner priority; otherwise short colour feedback.         | Target colours immediately.     | `button.root.colour` → `state.color` → `state.color/surface-foreground`                                                                                                                                    |
| Label or quantity revision / label region                        | Changed graphemes replace with stagger:none; quantities roll by semantic direction; root width retargets concurrently.                      | Changed text uses short opacity only; quantity and width are immediate. | All targets immediate.          | `button.label.replace` → `text.replace` → `text.change/changed-runs`; `button.label.roll` → `number.compact` → `number.roll/reels`; `button.root.resize` → `geometry.compact` → `geometry.resize/measured` |
| Explicit size variant or icon-slot occupancy change / root shell | Final typography/spacing commits once; interpolate only owned bounded dimensions.                                                           | Final dimensions immediately.                                           | Final dimensions immediately.   | `button.root.resize` → `geometry.compact` → `geometry.resize/measured`                                                                                                                                     |

## Interruption and lifecycle

Pointer cancellation, lost capture, blur and disabled changes release the press owner. Repeated label revisions target the newest content without queuing earlier words. Removal requires a surviving parent presence owner; reintroduction reverses from the current visual state. Live reduction cancels scale, reels and width work; none or a zero clock also cancels colour/presence and clears delayed callbacks. An anchored trigger keeps its positioning geometry stable.

A retained exit is decorative and cannot activate or expose an obsolete name. A caller key or native target revision cancels any obsolete label/press transaction even if the visible label matches; Button does not infer business identity from callback internals. Parent close cancels local text/size work; its completion cannot restart press or restore a removed label.

## Geometry and performance

Measure intrinsic inline size after commitment, clamp it to available space, and never stretch the label with root scale-based layout correction. Preserve the existing single-line label policy; changes resolve final truncation before interpolating the host width, rather than rewrapping during travel. Fixed-width buttons skip width measurement. Keep keyboard focus and pointer hit testing available throughout. A composed Spinner owns its rotation; Button does not rotate or replay unchanged label characters.

One natural-content measurement supplies both width and any explicit height destination. If an intermediate shell would additionally hide the final visible label, icon or focus affordance, commit that axis immediately rather than introduce temporary truncation. Parent layout consumes this final destination once, never the changing shell bounds. Bound work to one owned label transaction and one direct quantity group; unsafe shaping or shared work-limit overflow applies affected content immediately. A numeric string is not parsed; mixed quantity/affix JSX uses explicit composition.

A custom `render` must preserve the native ref/event target, direct-child icon selectors and existing layout. Press decoration requires a safe internal visual layer separate from hit/focus/anchor geometry; if none exists, use the declared colour feedback and omit press scale rather than inserting incompatible wrappers. The same rule applies to icon-only buttons and composed triggers. At full-mode zero timeScale, an accepted held press reaches `scale.press` immediately and release reaches rest immediately; a none/reduced branch remains unscaled. Presence completion restores current disabled/caller opacity, not a hard-coded fully opaque button.

## Acceptance scenarios

Target acceptance; not executed: pointer and keyboard press cancellation; repeated Save/Saving/Saved label changes; a quantity crossing a digit boundary; icon-only and constrained-width buttons; rich children; parent insertion without double entrance; live full/reduced/none and zero-clock changes during press and resize.

Also pending: replace an action while its DOM node is retained, change size during press, and grow a localized label inside a narrow clipped parent; no stale activation/name or transient unreadable label is permitted.

Also pending: use a custom anchor render with direct SVG children, set timeScale to zero while holding a press, and disable during entry; refs/selectors, native activation, correct static scale and disabled opacity survive. Focus or mark the root invalid during a colour transition: all its declared paint settles immediately, not only the focus ring.
