# Skeleton motion contract

Status: implemented and verified (full, reduced, none). Browser matrix and performance governance remain
deferred under [ADR-023](../adr.md#adr-023--effects-first-migration-performance-governance-afterwards).

Skeleton reserves a loading shape and keeps one restrained opacity pulse while work is pending. Its parent owns
the decision to replace it with content; the placeholder never animates in or out, so a handoff is a native
removal rather than a second opacity writer competing with the pulse. Inherit the [shared contract](../README.md)
and [preset catalogue](../presets.md); bindings are internal design names.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "parts": {
    "root": ["skeleton#Skeleton"]
  },
  "regions": {
    "root": ["skeleton"]
  },
  "axes": { "root": ["width", "height"] }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                                                                            | References                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Appearance      | not applicable: the placeholder is a reserved shape whose insertion and removal are native; a parent handoff never fades it, so no appearance writer exists.  | not-applicable: `@root`         |
| Size            | default for explicit owned placeholder dimension changes; inherited for final-content reservation and parent handoff; passive responsive sizing is immediate. | default: `skeleton.root.resize` |
| Surface colour  | default: skeleton background on authored theme/state target changes; the opacity pulse is a separate property owner.                                          | default: `skeleton.root.colour` |
| Text colour     | not applicable: Skeleton has no textual display part.                                                                                                         | not-applicable: `@root`         |
| Changed text    | not applicable: placeholder shapes do not own the eventual text.                                                                                              | not-applicable: `@root`         |
| Changed numbers | not applicable: Skeleton represents unknown content, not progress or a numeric value.                                                                         | not-applicable: `@root`         |

## Choreography and modes

| Trigger / owner                                  | full                                                     | reduced                           | none                           | Binding → preset → recipe/form                                                                                                           |
| ------------------------------------------------ | -------------------------------------------------------- | --------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Visible ongoing placeholder / root opacity       | Gentle repeating opacity pulse on the theme clock.       | Static final opacity; no loop.    | Static final opacity; no loop. | `skeleton.root.busy` → `status.loop` → `data.transition/continuous`                                                                      |
| Explicit dimension/surface target changes / root | Bounded owned geometry and background-colour transition. | Geometry immediate; short colour. | Immediate.                     | `skeleton.root.resize` → `geometry.compact` → `geometry.resize/measured`; `skeleton.root.colour` → `state.color` → `state.color/surface` |

## Interruption and lifecycle

The pulse runs only while the region reports itself busy and the placeholder is visibly active. Pause
offscreen/hidden loops; returning does not replay a region entrance, because there is none. `busy={false}`
releases the animation family instead of pinning a static animation, so the host carries no opacity writer while
the shape waits for native removal (ADR-024). Live reduced/none cancels the loop rather than merely slowing it and
keeps an informative static shape. The continuous theme clock has its own policy; provider `timeScale` does not
change it. No minimum loading duration is introduced.

## Geometry and performance

Reserve the intended dimensions before hydration. The parent owns differences between placeholder and real
content; Skeleton does not inspect or measure an absent destination. Avoid a separate observer for every decorative
line when the region owns its size. Keep the pulse opacity-only with a single writer; multiple placeholders may
share a clock without a compulsory travelling shimmer.

Suspense or caller readiness owns whether the placeholder exists. Completion of its pulse must never resolve a
loading state, delay real content, or retain an interactive fallback subtree. If no region survives the replacement,
removal is immediate; a surviving region may coordinate safe placeholder paint and current content once. A later
retry is a new real loading state, not a resumed obsolete pulse.

For an explicit placeholder size revision, resolve final width/height under caller constraints and let one box
writer interpolate; there is no text reflow to animate. Do not clip the subsequently revealed content to the
outgoing placeholder shape. Region-level visibility observation can pause all child pulses; large placeholder sets
use one coherent region pulse or static shapes instead of an unbounded set of independent observers/controllers.
This changes only decoration, never loading state or reservation.

## Acceptance scenarios

- Busy to idle on one host: the pulse releases its family, no static animation is pinned, and the shape keeps its
  reserved box until the parent removes it.
- Explicit shape revision: one measured box writer interpolates, while a passive reflow stays native.
- Theme target change: the surface clock runs on the placeholder's own colours only.
- Offscreen/hidden: the pulse pauses and resumes without replaying anything.

Target acceptance; not executed in a browser: the above under full/reduced/none with a live mode change, SSR and
hydration, and a production build.
