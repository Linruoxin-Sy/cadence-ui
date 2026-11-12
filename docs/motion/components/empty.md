# Empty motion contract

Status: functionally migrated; numerical performance governance remains deferred under ADR-023.

Empty introduces an empty-state explanation calmly and keeps its recovery action immediately usable. It does not infer loading, filtering or failure from application data. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "regions": {
    "root": ["empty"],
    "text": ["empty-text"],
    "value": ["empty-number"],
    "media": ["empty-icon"],
    "surface": ["empty", "empty-icon"],
    "foreground": ["empty-title", "empty-description", "empty-content"],
    "rich": ["empty-title", "empty-description", "empty-content"]
  },
  "axes": { "root": ["height"] },
  "parts": {
    "root": ["empty#Empty"],
    "rich": ["empty#EmptyTitle", "empty#EmptyDescription", "empty#EmptyContent"],
    "text": ["empty#EmptyTitle", "empty#EmptyDescription", "empty#EmptyContent"],
    "value": ["empty#EmptyTitle", "empty#EmptyDescription", "empty#EmptyContent"],
    "media": ["empty#EmptyMedia"],
    "surface": ["empty#Empty", "empty#EmptyMedia"],
    "foreground": ["empty#EmptyTitle", "empty#EmptyDescription", "empty#EmptyContent"]
  }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                                                                              | References                                                 |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Appearance      | default: empty owns one entrance including EmptyHeader, EmptyMedia, title, description and initial content; inherited for a parent-owned state-region entrance. | default: `empty.root.enter`, `empty.root.exit`             |
| Size            | default: empty owns later copy/media/content-driven dimensions; inherited when the parent owns the empty/content region exchange.                               | default: `empty.root.resize`                               |
| Surface colour  | default: EmptyMedia's actual empty-icon surface and any authored root surface; composed actions retain their own surface owners.                                | default: `empty.surface.colour`                            |
| Text colour     | default: title, description and media foreground on authored visual changes.                                                                                    | default: `empty.surface.colour`, `empty.foreground.colour` |
| Changed text    | default: plain EmptyTitle/EmptyDescription and directly owned plain display content; composed rich EmptyContent and descriptions.                               | default: `empty.text.replace`; composed: `@rich`           |
| Changed numbers | default: direct quantity displays in known text parts; composed rich counts; identifiers in examples or instructions remain textual.                            | default: `empty.value.roll`; composed: `@rich`             |

## Choreography and modes

The presence.exit bindings below select the exit.fade recipe, not a popup ending phase.

| Trigger / owner                                                               | full                                                                                                  | reduced                                                        | none                      | Binding → preset → recipe/form                                                                                                                                                                         |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Empty region appears / root or parent region                                  | One surface opacity entrance, with action available immediately.                                      | Short opacity.                                                 | Immediate.                | `empty.root.enter` → `presence.surface` → `enter.pop/opacity`                                                                                                                                          |
| Caller replaces empty region / retained parent                                | Fade the old empty region; the parent owns the destination layout.                                    | Short opacity.                                                 | Immediate replacement.    | `empty.root.exit` → `presence.exit` → `exit.fade/opacity`                                                                                                                                              |
| Copy/media/action content changes / empty                                     | Changed-only text with stagger:none or quantity reels; measured content dimensions retarget together. | Short changed-text opacity; quantity and dimensions immediate. | Immediate.                | `empty.text.replace` → `text.replace` → `text.change/changed-runs`; `empty.value.roll` → `number.compact` → `number.roll/reels`; `empty.root.resize` → `geometry.content` → `geometry.resize/measured` |
| Explicit media replacement within a retained empty state / media visual owner | Local opacity replacement for the changed supplied visual; existing title/action do not re-enter.     | Short opacity.                                                 | Final visual immediately. | `empty.media.replace` → `data.update` → `data.transition/opacity`                                                                                                                                      |
| Surface/foreground targets change / actual display owner                      | Scoped colour transition.                                                                             | Short colour.                                                  | Immediate.                | `empty.surface.colour` → `state.color` → `state.color/surface-foreground`; `empty.foreground.colour` → `state.color` → `state.color/foreground`                                                        |

The `text`/`value` regions address only the named plain display parts. `foreground` coordinates paint on the declared hosts; an inherited colour runs at its ancestor owner once, while an explicitly overridden foreground has its own disjoint controller. Structural/media children are not added to the text renderer merely because they inherit that paint.

The combined surface binding owns root and media background/border/shadow plus their inherited foreground once. The foreground binding owns explicit Title/Description/Content colour targets; inherited foreground follows its ancestor without a second writer. Media replacement fades the current supplied visual on the stable EmptyMedia host; direct child type, key or image src identifies an explicit replacement. It creates no outgoing artwork clone, does not invoke or recursively inspect caller artwork, and never waits for image readiness. Child edits with unchanged identity remain native.

## Interruption and lifecycle

The existing [changed-text raster policy](../../animation-system.md#36-changed-text) requires stable foreground ink. A concurrent known state.color foreground change retains its colour owner and settles text/number raster layers to the latest native readout; it is not an unknown-source exemption. Background/border-only text coordination remains permitted. Preserve the same-frame copy/foreground scenario in acceptance, including colour middle paint, readout cancellation, native identity and final semantics.

Quick empty/populated/empty changes target the newest caller state without a minimum display time. Retained empty content can reverse its opacity, but controls and semantic content follow the committed state immediately. Remove observers and pending visual layers on unmount. Live reduced finishes geometry/reels; none or zero clock finishes all remaining transitions. An action's request state is owned by the application, not by Empty.

The parent state-region boundary cancels local copy/media/geometry effects when it closes. A retained outgoing empty state is decorative: it has no duplicate action, accessible description or click target. Late media readiness belongs to the current caller media identity and cannot restore an old empty state. Without a surviving parent/local visual owner, removal/replacement is immediate.

## Geometry and performance

Observe the owned content box after commitment; do not animate both the Empty root and parent state-region height. Lay out changed copy at destination width before animating the host height; responsive wrapping follows layout directly. EmptyMedia uses the actual empty-icon slot and arbitrary supplied artwork: no automatic path drawing or perpetual bobbing is added. Only revised copy participates in text work; recovery controls keep native focus geometry.

Choose either Empty's measured shell or the parent state-region as the size owner for one cause; share a final destination if another child already owns intrinsic geometry. Preserve default centered/wrapping layout and caller artwork dimensions. If an intermediate box would hide final-visible recovery copy/actions or move a focused editor, apply the affected geometry immediately. One content measurement, one bounded title/description transaction and at most one decorative outgoing media visual are sufficient; rich artwork is never recursively inspected and shared-budget overflow uses immediate affected presentation.

## Acceptance scenarios

Required acceptance: first empty result and rapid result reversal; different media variants; localized copy; direct display quantities; rich descriptions with links; action focus; parent-coordinated region size; all modes and zero clock during replacement.

Also required: change only the artwork, then populate the region before it becomes ready; no title replay, stale artwork, duplicate recovery action or hidden final copy may remain.
