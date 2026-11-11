# Card motion contract

Status: functionally migrated; numerical performance governance remains deferred under ADR-023.

Card coordinates content changes as one stable surface. A plain Card is not an interactive control and gains no automatic hover lift. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "regions": {
    "rich": ["card-title", "card-description", "card-content"],
    "root": ["card"],
    "text": ["card-text"],
    "value": ["card-number"],
    "surface": ["card-header", "card-footer"],
    "foreground": ["card-title", "card-description", "card-content"]
  },
  "axes": { "root": ["width", "height"] },
  "parts": {
    "rich": ["card#CardTitle", "card#CardDescription", "card#CardContent"],
    "root": ["card#Card"],
    "text": ["card#CardTitle", "card#CardDescription", "card#CardContent"],
    "value": ["card#CardTitle", "card#CardDescription", "card#CardContent"],
    "surface": ["card#CardHeader", "card#CardFooter"],
    "foreground": ["card#CardTitle", "card#CardDescription", "card#CardContent"]
  }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                                                                                                                        | References                                            |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Appearance      | default: card owns one dynamic surface entrance including initial header/content/footer; inherited when a larger parent owns that cause.                                                                  | default: `card.root.enter`, `card.root.exit`          |
| Size            | default: card owns content-driven block geometry; fit=content also owns intrinsic inline geometry through its existing card-flow arrangement; constrained axes remain inherited.                          | default: `card.root.resize`                           |
| Surface colour  | default: card background/border/shadow and independently styled header/footer surfaces on authored variant/theme changes.                                                                                 | default: `card.root.colour`, `card.surface.colour`    |
| Text colour     | default: card foreground and title/description overrides; composed descendants retain explicit colour owners.                                                                                             | default: `card.root.colour`, `card.foreground.colour` |
| Changed text    | default: plain CardTitle and CardDescription; plain display content directly owned by CardContent is eligible; composed rich body/action/footer content is not recursively rewritten.                     | default: `card.text.replace`; composed: `@rich`       |
| Changed numbers | default: supported direct numbers in Title, Description and Content use quantity presentation without changing their existing output; title/identifier strings remain text and rich metrics are composed. | default: `card.value.roll`; composed: `@rich`         |

## Choreography and modes

The presence.exit bindings below select the exit.fade recipe, not a popup ending phase.

| Trigger / owner                                              | full                                                                                               | reduced                                                              | none       | Binding → preset → recipe/form                                                                                                     |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Dynamic insertion/removal / card                             | Coherent surface opacity entrance and retained exit, without child cascades.                       | Short opacity.                                                       | Immediate. | `card.root.enter` → `presence.surface` → `enter.pop/opacity`; `card.root.exit` → `presence.exit` → `exit.fade/opacity`             |
| Content/header/footer or explicit size change / card         | Retarget measured owned dimensions with final spacing/typography; stable content remains unscaled. | Final geometry immediately.                                          | Immediate. | `card.root.resize` → `geometry.content` → `geometry.resize/measured`                                                               |
| Display revision / title, description or known plain content | Changed-only text with stagger:none or quantity reels, coordinated with card geometry.             | Short changed-text opacity; final quantity and geometry immediately. | Immediate. | `card.text.replace` → `text.replace` → `text.change/changed-runs`; `card.value.roll` → `number.roll` → `number.roll/reels`         |
| Root palette target changes / card                           | Scoped, readable background/foreground/border/shadow feedback.                                     | Short colour.                                                        | Immediate. | `card.root.colour` → `state.color` → `state.color/surface-foreground`                                                              |
| Surface/foreground target changes / relevant owner           | Scoped colour/shadow transition.                                                                   | Short colour.                                                        | Immediate. | `card.surface.colour` → `state.color` → `state.color/surface`; `card.foreground.colour` → `state.color` → `state.color/foreground` |

The `text`/`value` regions address only the named plain display parts. `foreground` coordinates paint on the declared hosts; an inherited colour runs at its ancestor owner once, while an explicitly overridden foreground has its own disjoint controller. Structural/media children are not added to the text renderer merely because they inherit that paint.

The [shared raster policy](../../animation-system.md#36-changed-text) permits changed text during
known ancestor background, border-colour and box-shadow transitions. Foreground, opacity, geometry
or unknown transitions keep exact current native text and cancel active raster replacement.
Quantity reels retain the stricter stable-ancestor-paint boundary: any such ancestor transition
uses native digits or cancels a current reel. None of these safety paths cancels the independently
owned Card paint. Verify concurrent semantics and retained Text identity, plus each eligible writer.

## Interruption and lifecycle

A known plain Content/Title/Description slot inside an actual editable context follows the
[native text boundary](../../animation-system.md#36-changed-text), even when editing is inherited
from an ancestor rather than supplied on Card. It receives no split text, reel or outgoing copy in
any mode. Preserve the existing editor tree/selection/undo ownership; entering editing retires only
conflicting decoration, and returning to display retains the native-edited buffer as its baseline without replay, until a changed caller display value resumes output. Card
geometry still yields when it would move the editor's caret, content box or scroll position.

Rapid content changes retarget the current card dimensions, not queued old heights. Reopened/reinserted content keeps stable identity when its parent retains lifecycle. Closing/removing the Card is owned by a surviving parent; visual retention cannot keep removed actions focusable. Live reduced cancels geometry and reels; none or zero clock also finishes surface/text fades and colours. The fit observer and animation must not both write height independently.

## Geometry and performance

The separate natural region is Card's existing real content tree. Measuring its destination must
not mount a second hidden copy of caller forms, editors or rich children. Where the actual fit/caller
layout cannot expose a safe natural destination, use immediate native geometry for that axis under
the [shared measurement rule](../../animation-system.md#34-measured-size-and-position), preserving
children's refs, effects and resource lifetime. A skipped/unmeasurable region is not an empty card.

Observe committed content, using card-flow where it exists and the equivalent owned content box otherwise. First lay out wrapping content at the destination available width, then animate the host's block size; a fit=content inline-size transition does not continuously rewrap the measured content. Clamp dimensions to external min/max constraints; do not animate a fill-parent axis or passive responsive reflow. Crop only a noninteractive measurement/reveal region when required, never focus rings or popups. One card-size transaction covers simultaneous title, action and body changes; unchanged text never replays. Nested Card commits coalesce at the surviving geometry owner, using that owner’s mode and clock. Equal semantic content/constraints and ref-only rerenders retain an in-flight handle.

The fit flow supplies destinations to the one shared shell owner, with no independent imperative height writer. Its header releases inline-size containment so title/description participate in intrinsic fit width. During an eligible nonwrapping width flight, the same executor temporarily holds the real flow at its destination width; completion, cancellation and retargeting release that effect to current CSS. A child already animating geometry either delegates the shared cause to Card or supplies its final destination once; Card does not follow its intermediate boxes. Explicit `size` changes use final padding/typography before measurement, not animated padding. Hidden zero measurements retain intrinsic layout until a valid target exists; reappearance does not grow from zero.

Destination layout does not authorize new content cropping: if an intermediate shell would conceal required body copy, content needed for the current action, an active editor/action or focus ring beyond the existing overflow rules, settle that axis immediately. Focused editor content boxes/scroll extents remain native. One card-flow measurement and bounded owned title/description/plain-content transactions are sufficient; large/rich body updates keep their own identities and fall back to immediate affected presentation, not recursive text traversal. Media decoding without an intentional content revision is passive reflow.

The size owner releases temporary pixel locks back to Card's current fit/caller layout after settling.
It must not restore an earlier width, overflow or min/max declaration after a caller revision. A
measurable empty body uses its actual final box, including remaining header/footer/padding; a hidden
body's unavailable measurement does not collapse the card. Ancestor presence and nested mode scopes
remain separate owners: a child in none does not cancel the card's envelope or counter-scale itself.

Fit retains its existing content-height semantics over a stretching `h-full` class through native `height: fit-content`, rather than a permanent measured pixel lock. Fixed block sizes use the ordinary Card; external min/max constraints still clamp fit.

## Acceptance scenarios

- Verify: resize a card containing named inputs, id-linked labels and a stateful child, then repeat
  with an unavailable natural region. Measurement adds no DOM ids, form entries, ref/effect calls or
  hidden child instances; the unavailable case keeps native geometry and later establishes a baseline.

Verify: render plain and numeric CardContent inside inherited editable and plaintext-only
contexts, change editability during a display transition, then return to display. Native content,
selection, undo and caller control remain intact in all modes, with no split editor or replayed edit;
a separate noneditable display uses its own safe boundary rather than disabling the whole Card.

Acceptance scenarios: content expansion with header/footer; fit=content width changes; fixed-height and responsive cards; rich forms in content; numeric/plain title updates; nested card/parent entrance; rapid changes, live modes and zero clock with no competing observer writer.

Verify: nested child resize plus a Card size change, hidden-to-visible fit measurement, an idle focused textarea in a shrinking card, and late image decoding; no double height writer, transient text loss, editor scroll reset or false zero-size entrance.

Verify: finish/cancel a fit resize, then change parent width without changing content; natural
layout remains responsive with no retained pixel lock. Change caller min-height/overflow during a
flight and deliver old cleanup. Compare a genuinely emptied body with a hidden body, and a none-mode
child inside a full-mode card; only current owners affect their own constraints and animation.
