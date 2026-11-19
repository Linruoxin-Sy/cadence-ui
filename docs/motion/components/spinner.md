# Spinner motion contract

Status: functionally migrated; numerical performance governance remains deferred under ADR-023.

Spinner communicates indeterminate activity through rotation in full mode and a visible, named static symbol in reduced and none. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "parts": {
    "root": ["spinner#Spinner"],
    "glyph": ["spinner#Spinner"]
  },
  "axes": { "root": ["width", "height"] }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                                                 | References                                         |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Appearance      | default: spinner for independent insertion; inherited when Button or a status region owns the same entrance/replacement.           | default: `spinner.root.enter`, `spinner.root.exit` |
| Size            | default for an explicit owned icon-size change; inherited for the parent's reserved icon slot; no size work is caused by rotation. | default: `spinner.root.resize`                     |
| Surface colour  | not applicable to the transparent SVG's default surface; a containing badge/button owns its background.                            | not-applicable: `@root`                            |
| Text colour     | default: SVG currentColor/stroke target transitions; inherited when the parent already owns the foreground transition.             | default: `spinner.glyph.colour`                    |
| Changed text    | not applicable to the SVG; aria-label updates are semantic and immediate; visible status copy is composed.                         | not-applicable: `@root`                            |
| Changed numbers | not applicable: Spinner has no determinate value; a displayed progress quantity is a separate composition.                         | not-applicable: `@root`                            |

## Choreography and modes

The presence.exit bindings below select the exit.fade recipe, not a popup ending phase.

The entrance is the stationary opacity form of `presence.surface` (`enter.pop/opacity`), not the
inline preset's `data.transition/opacity`, because the installed declaration permits one form per
recipe and the same `data.transition` recipe carries the rotation's continuous form here. The
preset's optional scale envelope is not used: this glyph fades in place.

| Trigger / owner                                                     | full                                                                           | reduced                                   | none                       | Binding → preset → recipe/form                                                                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Independent insertion/removal / spinner or retained icon-slot owner | Opacity entrance/exit without delaying status availability.                    | Short opacity with a static glyph.        | Immediate.                 | `spinner.root.enter` → `presence.surface` → `enter.pop/opacity`; `spinner.root.exit` → `presence.exit` → `exit.fade/opacity`               |
| Visible indeterminate activity / SVG transform                      | Continuous rotation.                                                           | Static glyph, no rotation.                | Static glyph, no rotation. | `spinner.glyph.busy` → `status.loop` → `data.transition/continuous`                                                                        |
| Authored colour/size changes / SVG or parent slot                   | Scoped stroke colour; bounded owned size change if not controlled by a parent. | Colour may transition; size is immediate. | Immediate.                 | `spinner.glyph.colour` → `state.color` → `state.color/foreground`; `spinner.root.resize` → `geometry.compact` → `geometry.resize/measured` |

## Interruption and lifecycle

Rotation does not encode completion and never chooses a success icon. Caller removal stops rotation before a retained fade; reinsertion uses the latest loading state with no artificial wait. Hidden/offscreen rotation is paused. Live reduced stops rotation and settles any owned size change immediately, while permitted presence opacity and eligible foreground colour reconcile under their reduced contracts. None also cancels those one-shot paint clocks and reaches the current static target immediately. A zero recipe clock settles one-shot work only and does not replace the separate continuous theme clock policy. Unmount releases all animation references, and the status name remains meaningful in every mode.

The SVG's rotation writer never owns entry/exit opacity or slot positioning. Hidden/full-mode activity resumes only if it is still current and visible, using a fresh theme clock; reduced/none exposes the static rest orientation immediately. Returning to full may restart that continuous activity without replaying presence or historical updates; stale presence completion cannot restart a removed spinner. Parent closure cancels local presence and removes obsolete status semantics from any retained decorative visual.

## Geometry and performance

Use the existing reserved icon box, square by default, and no per-frame measurement. Do not normalize caller width/height or override the SVG's aspect-ratio policy to manufacture a square. Do not use the rotation transform for simultaneous layout movement; a parent may position the slot. Avoid attaching a layout observer merely because an SVG exists. Parent Button label/width changes share a cause without restarting the spinner entrance. Accessible names are never passed through animated text layers.

An explicit owned icon-size revision uses the final native width/height destination, independent of rotation; a parent-reserved slot owns the size instead when present. No extra measurement is needed for token-resolved dimensions. Keep stroke and clipping consistent with the SVG viewBox and caller overflow; do not use a second scale transform for sizing. Bound active rotation to visible current spinners using shared visibility ownership where available. Any stricter composed loop limit must identify its scope and bound; exceeding it shows the same named static glyph without delaying activity state, and does not silently reinterpret the collection or stagger limit as a global spinner count.

Implemented: the glyph reads its own resolved `width`/`height` once per committed caller revision (`geometry.compact` → `geometry.resize/measured`) and writes no resting declaration, so a caller's `size-*`, `width`/`height` attributes and overflow policy still decide the box. Passive resize, viewport changes and font loading settle without a second animation, and a hidden or parent-consumed spinner commits the native destination immediately. The rotation writer owns `transform` only; the entrance owns `opacity` only; the colour clock owns `color` only.

## Acceptance scenarios

Executed in `tests/components/spinner.test.tsx` for full, reduced and none: a later insertion opacity entrance, a retained removal that releases rotation first, an explicit icon-size revision on the same live SVG, a caller foreground-colour revision, removal stopping the loop, one unchanged `data-motion`/status name across the sequence, disposal on unmount, and the Surface colour/Changed text/Changed numbers native boundaries on the real part.

Also executed: unequal native `width`/`height` attributes and a caller `size-*` class keep the SVG's own box and aspect policy; neither rotation nor cleanup squares or rescales it.

Remaining browser-owned scenarios (the 3 modes × 2 OS preferences matrix and theme-clock downgrade) live in `tests/e2e/b2.spec.ts` and `tests/e2e/css-runtime.spec.ts`; they run against a production build and were not re-run in this session. Their assertions are updated to the migrated semantics: full rotates, reduced and none are static, and a live downgrade drops the animation family rather than pinning `animate-none`.

Also pending: a parent-slot-owned icon box, parent exit while rotation is paused, and a Button-composed label revision during rotation.
