# Card motion contract

Status: target design; implementation and verification pending.

Card coordinates content changes as one stable surface. A plain Card is not an interactive control and gains no automatic hover lift. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "root": ["card#Card"],
    "text": ["card#CardTitle", "card#CardDescription", "card#CardContent"],
    "value": ["card#CardTitle", "card#CardDescription", "card#CardContent"],
    "surface": ["card#Card", "card#CardHeader", "card#CardFooter"],
    "foreground": ["card#Card", "card#CardTitle", "card#CardDescription", "card#CardContent"]
  }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                                                                                                    | References                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Appearance      | default: card owns one dynamic surface entrance including initial header/content/footer; inherited when a larger parent owns that cause.                                              | default: `card.root.enter`, `card.root.exit`    |
| Size            | default: card owns content-driven block geometry; fit=content also owns intrinsic inline geometry through its existing card-flow arrangement; constrained axes remain inherited.      | default: `card.root.resize`                     |
| Surface colour  | default: card background/border/shadow and independently styled header/footer surfaces on authored variant/theme changes.                                                             | default: `card.surface.colour`                  |
| Text colour     | default: card foreground and title/description overrides; composed descendants retain explicit colour owners.                                                                         | default: `card.foreground.colour`                     |
| Changed text    | default: plain CardTitle and CardDescription; plain display content directly owned by CardContent is eligible; composed rich body/action/footer content is not recursively rewritten. | default: `card.text.replace`; composed: `@text` |
| Changed numbers | default: supported direct numbers in Title, Description and Content use quantity presentation without changing their existing output; title/identifier strings remain text and rich metrics are composed.                                                          | default: `card.value.roll`; composed: `@value`  |

## Choreography and modes

The presence.exit bindings below select the exit.fade recipe, not a popup ending phase.

| Trigger / owner                                              | full                                                                                               | reduced                                                              | none       | Binding → preset → recipe/form                                                                                               |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Dynamic insertion/removal / card                             | Coherent surface opacity entrance and retained exit, without child cascades.                       | Short opacity.                                                       | Immediate. | `card.root.enter` → `presence.surface` → `enter.pop/opacity`; `card.root.exit` → `presence.exit` → `exit.fade/opacity`       |
| Content/header/footer or explicit size change / card         | Retarget measured owned dimensions with final spacing/typography; stable content remains unscaled. | Final geometry immediately.                                          | Immediate. | `card.root.resize` → `geometry.content` → `geometry.resize/measured`                                                         |
| Display revision / title, description or known plain content | Changed-only text with stagger:none or quantity reels, coordinated with card geometry.             | Short changed-text opacity; final quantity and geometry immediately. | Immediate. | `card.text.replace` → `text.replace` → `text.change/changed-runs`; `card.value.roll` → `number.roll` → `number.roll/reels`   |
| Surface/foreground target changes / relevant owner           | Scoped colour/shadow transition.                                                                   | Short colour.                                                        | Immediate. | `card.surface.colour` → `state.color` → `state.color/surface`; `card.foreground.colour` → `state.color` → `state.color/foreground` |

The `text`/`value` regions address only the named plain display parts. `foreground` coordinates paint on the declared hosts; an inherited colour runs at its ancestor owner once, while an explicitly overridden foreground has its own disjoint controller. Structural/media children are not added to the text renderer merely because they inherit that paint.

## Interruption and lifecycle

Rapid content changes retarget the current card dimensions, not queued old heights. Reopened/reinserted content keeps stable identity when its parent retains lifecycle. Closing/removing the Card is owned by a surviving parent; visual retention cannot keep removed actions focusable. Live reduced cancels geometry and reels; none or zero clock also finishes surface/text fades and colours. The fit observer and animation must not both write height independently.

## Geometry and performance

Observe committed content, using card-flow where it exists and the equivalent owned content box otherwise. First lay out wrapping content at the destination available width, then animate the host's block size; a fit=content inline-size transition does not continuously rewrap the measured content. Clamp dimensions to external min/max constraints; do not animate a fill-parent axis or passive responsive reflow. Crop only a noninteractive measurement/reveal region when required, never focus rings or popups. One card-size transaction covers simultaneous title, action and body changes; unchanged text never replays.

The existing fit observer supplies destinations to the new shell owner instead of retaining its independent imperative height writer. A child already animating geometry either delegates the shared cause to Card or supplies its final destination once; Card does not follow its intermediate boxes. Explicit `size` changes use final padding/typography before measurement, not animated padding. Hidden zero measurements retain intrinsic layout until a valid target exists; reappearance does not grow from zero.

Destination layout does not authorize new content cropping: if an intermediate shell would conceal required body copy, content needed for the current action, an active editor/action or focus ring beyond the existing overflow rules, settle that axis immediately. Focused editor content boxes/scroll extents remain native. One card-flow measurement and bounded owned title/description/plain-content transactions are sufficient; large/rich body updates keep their own identities and fall back to immediate affected presentation, not recursive text traversal. Media decoding without an intentional content revision is passive reflow.

## Acceptance scenarios

Target acceptance; not executed: content expansion with header/footer; fit=content width changes; fixed-height and responsive cards; rich forms in content; numeric/plain title updates; nested card/parent entrance; rapid changes, live modes and zero clock with no competing observer writer.

Also pending: nested child resize plus a Card size change, hidden-to-visible fit measurement, an idle focused textarea in a shrinking card, and late image decoding; no double height writer, transient text loss, editor scroll reset or false zero-size entrance.
