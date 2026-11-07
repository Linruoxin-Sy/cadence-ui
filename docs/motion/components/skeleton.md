# Skeleton motion contract

Status: target design; implementation and verification pending.

Skeleton reserves a loading shape and uses one restrained opacity pulse while work is pending. Its parent owns the decision to replace it with content. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "root": ["skeleton#Skeleton"]
  }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                                                                            | References                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Appearance      | default: skeleton for independent insertion; inherited for a coherent placeholder-region entrance and parent-owned content handoff.                           | default: `skeleton.root.enter`, `skeleton.root.exit` |
| Size            | default for explicit owned placeholder dimension changes; inherited for final-content reservation and parent handoff; passive responsive sizing is immediate. | default: `skeleton.root.resize`                      |
| Surface colour  | default: skeleton background on authored theme/state target changes; opacity pulse is a separate property owner.                                              | default: `skeleton.root.colour`                      |
| Text colour     | not applicable: Skeleton has no textual display part.                                                                                                         | not-applicable: `@root`                              |
| Changed text    | not applicable: placeholder shapes do not own the eventual text.                                                                                              | not-applicable: `@root`                              |
| Changed numbers | not applicable: Skeleton represents unknown content, not progress or a numeric value.                                                                         | not-applicable: `@root`                              |

## Choreography and modes

The presence.exit bindings below select the exit.fade recipe, not a popup ending phase.

| Trigger / owner                                  | full                                                                                                                                             | reduced                                                                           | none                           | Binding → preset → recipe/form                                                                                                           |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Independent placeholder insertion / root         | Opacity entrance hands the same property to the pulse after completion, with no competing writers. Initial SSR/hydration has no hidden entrance. | Short opacity for a later independent insertion, then static visible placeholder. | Visible immediately.           | `skeleton.root.enter` → `presence.inline` → `data.transition/opacity`                                                                    |
| Visible ongoing placeholder / root opacity       | Gentle repeating opacity pulse.                                                                                                                  | Static final opacity; no loop.                                                    | Static final opacity; no loop. | `skeleton.root.busy` → `status.loop` → `data.transition/continuous`                                                                      |
| Parent handoff / retained placeholder owner      | Stop the pulse before fading the placeholder out.                                                                                                | Short fade only.                                                                  | Immediate removal.             | `skeleton.root.exit` → `presence.exit` → `exit.fade/opacity`                                                                             |
| Explicit dimension/surface target changes / root | Bounded owned geometry and background-colour transition.                                                                                         | Geometry immediate; short colour.                                                 | Immediate.                     | `skeleton.root.resize` → `geometry.compact` → `geometry.resize/measured`; `skeleton.root.colour` → `state.color` → `state.color/surface` |

## Interruption and lifecycle

Pulse starts only when full mode and the placeholder is visibly active. Pause offscreen/hidden loops; returning does not replay the whole region entrance. A cancelled handoff resumes only the current placeholder state. Unmount cancels the loop and observation. Live reduced/none cancels rather than merely slowing the loop and retains an informative static shape. A zero recipe clock settles one-shot work only; the continuous theme clock has its separate policy. No minimum loading duration is introduced.

One current opacity phase owns the root: entrance, active pulse, exit or static. A phase completion may hand ownership onward only if its revision, presence and mode still match. Exiting stops the pulse at its current opacity before the exit writer takes over; none settles opacity immediately, while a zero recipe clock can still leave an eligible full-mode pulse running. A late entrance completion cannot restart the pulse after parent closure or a downgrade.

## Geometry and performance

Reserve the intended dimensions before hydration. The parent owns differences between placeholder and real content; Skeleton does not inspect or measure an absent destination. Avoid a separate observer for every decorative line when the region owns its size. Keep the pulse opacity-only with a single writer; multiple placeholders may share a clock without a compulsory travelling shimmer.

For an explicit placeholder size revision, resolve final width/height under caller constraints and let one box writer interpolate; there is no text reflow to animate. Do not clip the subsequently revealed content to the outgoing placeholder shape. Region-level visibility observation can pause all child pulses; large placeholder sets use one coherent region pulse or static shapes instead of an unbounded set of independent observers/controllers. This changes only decoration, never loading state or reservation.

## Acceptance scenarios

Target acceptance; not executed: initial reserved layout; parent content handoff; aborted handoff; explicit shape changes; offscreen/hidden pause; nested placeholder region; full/reduced/none and zero clock during pulse with no stale animation.

Also pending: close or reduce during the entrance-to-pulse handoff and restore full mode; no obsolete completion restarts the pulse or entrance. Independently verify zero recipe clock settles the fade while a permitted theme-clock pulse remains governed by its own policy.
