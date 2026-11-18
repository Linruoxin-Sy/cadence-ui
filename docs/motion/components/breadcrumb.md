# Breadcrumb motion contract

Status: functionally migrated to v2. Browser matrix, a production build and performance governance remain
deferred under ADR-023.

Breadcrumb retains ancestor identity while a route adds, removes or renames the current path segment. It does not add a router or automatic overflow menu. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "parts": {
    "list": ["breadcrumb#BreadcrumbList"],
    "item": ["breadcrumb#BreadcrumbItem", "breadcrumb#BreadcrumbSeparator", "breadcrumb#BreadcrumbEllipsis"],
    "label": ["breadcrumb#BreadcrumbLink", "breadcrumb#BreadcrumbPage"],
    "text": [
      "breadcrumb#BreadcrumbLink",
      "breadcrumb#BreadcrumbPage",
      "breadcrumb#BreadcrumbSeparator",
      "breadcrumb#BreadcrumbEllipsis"
    ]
  },
  "regions": {
    "list": ["breadcrumb-list"],
    "item": ["breadcrumb-item", "breadcrumb-separator", "breadcrumb-ellipsis"],
    "label": ["breadcrumb-link-text", "breadcrumb-page-text"],
    "text": ["breadcrumb-link", "breadcrumb-page", "breadcrumb-separator", "breadcrumb-ellipsis"]
  },
  "axes": { "list": ["height"] }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                                                          | References                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Appearance      | default: breadcrumb-list owns dynamic list entry and later changed items; inherited when the navigation region enters as a unit.            | default: `breadcrumb.list.enter`, `breadcrumb.item.enter`, `breadcrumb.item.exit` |
| Size            | default: breadcrumb-list owns explicit path/content-driven geometry and retained item positions; passive viewport wrapping is immediate.    | default: `breadcrumb.list.resize`                                                 |
| Surface colour  | not applicable to the default transparent navigation/link surface; composed custom interactive overflow controls retain their own surfaces. | not-applicable: `@list`; composed: `@list`                                        |
| Text colour     | default: BreadcrumbLink, BreadcrumbPage and inherited separator/ellipsis foreground on current/hover/theme changes.                         | default: `breadcrumb.text.colour`                                                 |
| Changed text    | default: plain link/page labels retain unchanged graphemes; composed rich breadcrumb labels.                                                | default: `breadcrumb.label.replace`; composed: `@label`                           |
| Changed numbers | not applicable to path segment numbers, which identify destinations rather than quantities; an explicit quantity badge is composed.         | not-applicable: `@list`; composed: `@list`                                        |

## Choreography and modes

The presence.exit bindings below select the exit.fade recipe, not a popup ending phase.

| Trigger / owner                                         | full                                                                                              | reduced                            | none                        | Binding → preset → recipe/form                                                                                                                                                                                                                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Independent list insertion / breadcrumb-list            | One opacity entrance.                                                                             | Short opacity.                     | Immediate.                  | `breadcrumb.list.enter` → `presence.inline` → `data.transition/opacity`                                                                                                                                                                                                                 |
| Caller changes path membership / items and list         | Fade changed items/separators; retained ancestors reflow toward the final path.                   | Geometry immediate; short opacity. | Immediate.                  | `breadcrumb.item.enter` → `presence.inline` → `data.transition/opacity`; `breadcrumb.item.exit` → `presence.exit` → `exit.fade/opacity`; `breadcrumb.item.move` → `layout.compact` → `layout.move/position`; `breadcrumb.list.resize` → `geometry.compact` → `geometry.resize/measured` |
| Same destination renamed / link/page label              | Changed-only text replacement with stagger:none.                                                  | Short changed-text opacity only.   | Latest text immediately.    | `breadcrumb.label.replace` → `text.replace` → `text.change/changed-runs`                                                                                                                                                                                                                |
| Rename changes the visible path box / list layout owner | Consume the final renamed label layout once; adjust owned host size and retained crumb positions. | Final geometry immediately.        | Final geometry immediately. | `breadcrumb.list.resize` → `geometry.compact` → `geometry.resize/measured`; `breadcrumb.item.move` → `layout.compact` → `layout.move/position`                                                                                                                                          |
| Current/hover/theme state / text owners                 | Scoped foreground transition.                                                                     | Short colour.                      | Immediate.                  | `breadcrumb.text.colour` → `state.color` → `state.color/foreground`                                                                                                                                                                                                                     |

## Interruption and lifecycle

Rapid navigation uses the newest caller-provided path; animation cannot delay navigation, aria-current or focus. Stable destination identities survive rename/reorder. A removed item can retain only a noninteractive visual under a surviving list owner; a stale exit cannot remove a restored ancestor. Parent removal consumes descendant exits. Live reduced settles path geometry; none or zero clock also settles fades/foreground and clears delayed completions.

Do not infer identity from label text or array position. Caller keys/destination identity define retained crumbs; without stable correspondence, commit the changed path immediately rather than morph one destination into another. A link-to-current-page structural change follows native semantics immediately; preserve identity only where the actual retained node permits it. Unmount releases list measurements and decorative exits.

## Geometry and performance

At a known path revision, lay out labels at the final available width, then animate the owned host height and retained positions; do not continuously rewrap words during interpolation. Passive width changes wrap immediately. Preserve the existing ol/li/navigation structure, separator presentation semantics and link focus outlines. Bound work to the visible path; an ellipsis does not imply a built-in expansion interaction. Unchanged ancestor labels do not replay.

One committed layout pass owns path geometry; individual label helpers supply content, not independent widths. Keep final-visible crumb names and the currently focused link usable throughout. If a smaller host, wrapped-row movement or active pointer target cannot remain safe under existing overflow, commit that affected layout immediately. Oversized paths and unknown identities skip blanket FLIP/measurement and use immediate layout plus bounded changed-text feedback; do not render hidden measurement crumbs or add list-invalid wrapper elements.

The shipped adapter follows that rule as follows: the list commits `geometry.resize/measured` on its own `height` once per committed revision; each retained crumb projects its own previous box through `layout.compact`, and the list never writes a crumb transform. A revision that moves a retained crumb between wrapped rows, a passive viewport/font reflow, a clipped or oversized path, or a retained node whose destination changed settles positions instead of interpolating. A decorative ellipsis nested inside its item follows that item and writes no second transform; only a crumb that is a direct child of the list projects.

## Acceptance scenarios

Executed in the component suite (`tests/components/breadcrumb.test.tsx`), for full, reduced and none through one
bounded scene with exactly one host per owned slot:

- List insertion runs `breadcrumb.list.enter` only; a later crumb insertion or removal runs the item causes on
  each retained host and keeps the existing DOM nodes.
- A committed rename of a link and a page label runs `breadcrumb.item.move`, `breadcrumb.list.resize` and
  `breadcrumb.label.replace` on the same instances, and the final accessible text is exact.
- Each of the four text owners runs its own `breadcrumb.text.colour` clock; an unprovable caller palette
  settles that region immediately.
- A presence revision keeps the crumb's host and its native `ol`/`li` structure, marks the retained visual
  `aria-hidden`/`inert` while leaving, and restores it on re-entry.
- A live mode downgrade keeps one `data-motion` on every owned host, leaves no CSS size clock and starts no
  animation.
- The `Surface colour/@list` and `Changed numbers/@list` rows are verified as native boundaries; the
  `Changed text/@label` boundary is verified on both breadcrumb exports.
- A caller-owned path that inserts crumbs and then renames an ancestor keeps the surviving anchor nodes,
  their `href` and their text identity.

Deferred under ADR-023: the browser matrix (three modes × two OS preferences), a production build, real-device
frame rate and CLS, RTL and wrapped-path screenshots, light/dark review, SSR/no-JS hydration in a browser and any
performance acceptance. `geometry.resize/measured` and `layout.move/position` are proven here through their
parameter form, revision and committed-target evidence; jsdom has no layout, so their rendered interpolation is
browser work that remains unmeasured.
