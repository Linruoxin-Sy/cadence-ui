# Empty motion contract

Status: target design; implementation and verification pending.

Empty introduces an empty-state explanation calmly and keeps its recovery action immediately usable. It does not infer loading, filtering or failure from application data. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names.

## Capability ownership

| Capability | Coverage and owner |
| --- | --- |
| Appearance | default: empty owns one entrance including EmptyHeader, EmptyMedia, title, description and initial content; inherited for a parent-owned state-region entrance. |
| Size | default: empty owns later copy/media/content-driven dimensions; inherited when the parent owns the empty/content region exchange. |
| Surface colour | default: EmptyMedia's actual empty-icon surface and any authored root surface; composed actions retain their own surface owners. |
| Text colour | default: title, description and media foreground on authored visual changes. |
| Changed text | default: plain EmptyTitle/EmptyDescription and directly owned plain display content; composed rich EmptyContent and descriptions. |
| Changed numbers | default: direct quantity displays in known text parts; composed rich counts; identifiers in examples or instructions remain textual. |

## Choreography and modes

The presence.exit bindings below select the exit.fade recipe, not a popup ending phase.

| Trigger / owner | full | reduced | none | Binding → preset → recipe/form |
| --- | --- | --- | --- | --- |
| Empty region appears / root or parent region | One surface opacity entrance, with action available immediately. | Short opacity. | Immediate. | `empty.root.enter` → `presence.surface` → opacity-only `enter.pop` |
| Caller replaces empty region / retained parent | Fade the old empty region; the parent owns the destination layout. | Short opacity. | Immediate replacement. | `empty.root.exit` → `presence.exit` → `exit.fade` |
| Copy/media/action content changes / empty | Changed-only text with stagger:none or quantity reels; measured content dimensions retarget together. | Short changed-text opacity; quantity and dimensions immediate. | Immediate. | `empty.text.replace` → `text.replace` → target `text.change`; `empty.value.roll` → `number.compact` → revised `number.roll`; `empty.root.resize` → `geometry.content` → `geometry.resize` |
| Explicit media replacement within a retained empty state / media visual owner | Local opacity replacement for the changed supplied visual; existing title/action do not re-enter. | Short opacity. | Final visual immediately. | `empty.media.replace` → `data.update` → local opacity `data.transition` |
| Surface/foreground targets change / actual display owner | Scoped colour transition. | Short colour. | Immediate. | `empty.surface.colour` → `state.color` → target `state.color`; `empty.text.colour` → `state.color` → target `state.color` |

## Interruption and lifecycle

Quick empty/populated/empty changes target the newest caller state without a minimum display time. Retained empty content can reverse its opacity, but controls and semantic content follow the committed state immediately. Remove observers and pending visual layers on unmount. Live reduced finishes geometry/reels; none or zero clock finishes all remaining transitions. An action's request state is owned by the application, not by Empty.

The parent state-region boundary cancels local copy/media/geometry effects when it closes. A retained outgoing empty state is decorative: it has no duplicate action, accessible description or click target. Late media readiness belongs to the current caller media identity and cannot restore an old empty state. Without a surviving parent/local visual owner, removal/replacement is immediate.

## Geometry and performance

Observe the owned content box after commitment; do not animate both the Empty root and parent state-region height. Lay out changed copy at destination width before animating the host height; responsive wrapping follows layout directly. EmptyMedia uses the actual empty-icon slot and arbitrary supplied artwork: no automatic path drawing or perpetual bobbing is added. Only revised copy participates in text work; recovery controls keep native focus geometry.

Choose either Empty's measured shell or the parent state-region as the size owner for one cause; share a final destination if another child already owns intrinsic geometry. Preserve default centered/wrapping layout and caller artwork dimensions. If an intermediate box would hide final-visible recovery copy/actions or move a focused editor, apply the affected geometry immediately. One content measurement, one bounded title/description transaction and at most one decorative outgoing media visual are sufficient; rich artwork is never recursively inspected and shared-budget overflow uses immediate affected presentation.

## Acceptance scenarios

Target acceptance; not executed: first empty result and rapid result reversal; different media variants; localized copy; direct display quantities; rich descriptions with links; action focus; parent-coordinated region size; all modes and zero clock during replacement.

Also pending: change only the artwork, then populate the region before it becomes ready; no title replay, stale artwork, duplicate recovery action or hidden final copy may remain.
