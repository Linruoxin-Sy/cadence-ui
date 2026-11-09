# Reveal motion contract

One explicit viewport enhancement scope, with visible native content as the baseline. Inherit the
[shared contract](../README.md) and [presets](../presets.md). The catalogue migration marker stays legacy.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "target": ["reveal#Reveal"]
  }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                           | References                     |
| --------------- | -------------------------------------------------------------------------------------------- | ------------------------------ |
| Appearance      | One native host owns decorative opacity and transform only after successful offscreen setup. | default: `reveal.target.enter` |
| Size            | Native layout remains authoritative; a separate child shell can own measured geometry.       | inherited: `@target`           |
| Surface colour  | Introduces no state palette or background animation.                                         | not-applicable: `@target`      |
| Text colour     | Caller foreground is unchanged and remains authoritative.                                    | inherited: `@target`           |
| Changed text    | Children remain the same native tree; no replacement text animation.                         | not-applicable: `@target`      |
| Changed numbers | No numeric values or reel renderer are introduced.                                           | not-applicable: `@target`      |

## Choreography and modes

| Trigger / owner                   | full                                                                        | reduced                                    | none                                         | Binding → preset → recipe/form                                |
| --------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------- | ------------------------------------------------------------- |
| Offscreen viewport entry / target | Token opacity and vertical translation; optional bounded stable-slot cycle. | Visible, bypass hidden state and observer. | Visible immediately, no transition or delay. | `reveal.target.enter` → `viewport.reveal` → `reveal/viewport` |

First-screen, SSR, hydration and no-JS content stay visible. Nested Reveal consumes the same containing
entrance; later independent child mounts remain eligible. Native focus/hash/print cannot wait for animation.
Base useRender merges render-element props/events/refs onto one real ref-capable host, default div. Callers own semantic tags, input and state.

## Interruption and lifecycle

Restrictive mode/zero/hidden/failure cancels actual handles and consumes the entrance; restoring full
cannot re-hide it. Positive clocks keep their captured finite flight. Group/root/policy revisions consume
all mounted targets immediately; new mounts use the new policy. Same policy and keyed reorder preserve
current flight and stable slots. Ref handoff preserves the native node; replacement gets a fresh lifetime.
Repeat resets immediately only after the separate leave threshold, never with native focus inside.
Pending/entering pointer activation is blocked; focus first restores visibility before native interaction.
Each registration releases observer, print and environment resources; Strict Mode re-registration is safe.

## Geometry and performance

Only opacity/transform on the entrance host; reserve both through shared transaction ownership.
Caller transforms, transitions, animations and editable hosts fall back to native paint. Put press/layout/
measured geometry on a separate child host. No duplicate semantic tree, width owner or render-time read.
Matching observers share root/options/threshold and root-height pixel margins; huge targets are reachable.
Keep 20 active hosts and 400ms aggregate delay including outstanding work. Overflow is immediately visible.
Default no stagger; cycle uses mounted slots modulo three and the shared stagger.reveal token.

## Acceptance scenarios

Actual public and installed source: visible SSR/noJS/hydration/print, native CSS initial keyframes and
intermediate entrance samples; full/reduced/none and OS policy, live downgrade/zero/restore, once/repeat,
focus/hash/keyboard/activation/input and React render/ref/events, nested consumption, root/policy changes,
keyed reorder/insert/unmount, disjoint press/layout/geometry owners and cleanup. Measure provider,
dedicated installed primitive and complete production page separately; global device/budget gates remain open.
