# Cadence UI

Animation-first React components for [shadcn](https://ui.shadcn.com): Base UI for behaviour, Tailwind CSS v4 for styling, Motion for animation. Every component mirrors shadcn's API, ships its source, and documents a motion contract with a reduced-motion branch.

```bash
npx shadcn@latest add @cadence/button
```

> Status: **B0–B8 implementations shipped; B6, B7 and B8 batch gates complete.**
> Historical B1–B5 visual gates, B9 attachment/bubble and carried site/tooling
> gates remain open. B9 is next. See [the parity plan](docs/parity-plan.md).

## Install

Register the registry once in `components.json`:

```json
{
  "registries": {
    "@cadence": "https://cadence.dev/r/{name}.json"
  }
}
```

Install the theme once, then any component:

```bash
npx shadcn@latest add @cadence/cadence-theme
npx shadcn@latest add @cadence/button
```

Files land in `components/cadence/` (`src/components/cadence/` in a `src/` project) and use relative imports, so no `tsconfig` change is needed. Wrapping the app in `CadenceProvider` is optional and gives one place to switch motion mode:

```tsx
import { CadenceProvider } from "@/components/cadence/lib/provider";

<CadenceProvider mode="full">{children}</CadenceProvider>;
```

## Components

| Component                             | Tier | Motion                                                               |
| ------------------------------------- | ---- | -------------------------------------------------------------------- |
| `button` — action trigger             | T1   | `feedback.press`                                                     |
| `badge` — status label                | T0   | none                                                                 |
| `kbd` — key or shortcut hint          | T0   | none                                                                 |
| `separator` — group boundary          | T0   | none                                                                 |
| `label` — control name                | T0   | none                                                                 |
| `input` — single-line field           | T0   | none                                                                 |
| `textarea` — multi-line field         | T0   | none                                                                 |
| `card` — grouped surface              | T0   | none                                                                 |
| `aspect-ratio` — reserved media box   | T0   | none                                                                 |
| `avatar` — image with fallback        | T0   | none                                                                 |
| `skeleton` — loading placeholder      | T4   | `data.transition`                                                    |
| `dialog` — modal window               | T2   | `popup.anchored`, `exit.fade`                                        |
| `alert-dialog` — confirmation         | T2   | `popup.anchored`, `exit.fade`                                        |
| `popover` — anchored panel            | T2   | `popup.anchored`, `exit.fade`                                        |
| `tooltip` — hint on hover             | T2   | `popup.anchored`, `exit.fade`                                        |
| `hover-card` — preview panel          | T2   | `popup.anchored`, `exit.fade`                                        |
| `sheet` — edge panel                  | T2   | `popup.anchored`, `exit.fade`                                        |
| `drawer` — bottom sheet               | T2   | `popup.anchored`, `exit.fade`                                        |
| `select` — single choice              | T3   | `popup.anchored`, `geometry.resize`, `handoff`, `state.morph`        |
| `combobox` — searchable choice        | T2   | `popup.anchored`, `exit.fade`, `state.morph`                         |
| `dropdown-menu` — actions menu        | T2   | `popup.anchored`, `exit.fade`, `state.morph`                         |
| `context-menu` — right-click menu     | T2   | `popup.anchored`, `exit.fade`, `state.morph`                         |
| `menubar` — application menu          | T2   | `popup.anchored`, `exit.fade`, `state.morph`                         |
| `command` - searchable actions        | T2   | `popup.anchored`, `exit.fade`                                        |
| `alert` — state message               | T0   | none                                                                 |
| `empty` — resting state               | T0   | none                                                                 |
| `item` — list row                     | T0   | none                                                                 |
| `field` — labelled control            | T0   | none                                                                 |
| `button-group` — joined controls      | T0   | none                                                                 |
| `input-group` — framed field          | T0   | none                                                                 |
| `breadcrumb` — trail                  | T0   | none                                                                 |
| `pagination` — page navigation        | T0   | none                                                                 |
| `spinner` — indeterminate wait        | T4   | `data.transition`                                                    |
| `checkbox` — binary choice            | T1   | `state.morph`                                                        |
| `radio-group` — exclusive choice      | T1   | `state.morph`                                                        |
| `switch` — on/off control             | T1   | `state.morph`                                                        |
| `slider` — range control              | T1   | `feedback.press`                                                     |
| `toggle` — pressed state              | T1   | `feedback.press`                                                     |
| `toggle-group` — toolbar and segments | T3   | `feedback.press`, `layout.shared`, `state.morph`                     |
| `input-otp` — one-time code           | T1   | `state.morph`                                                        |
| `progress` — determinate completion   | T4   | `data.transition`                                                    |
| `code-block` — code surface           | T5   | `geometry.resize`, `state.morph`, `data.transition`, `layout.shared` |
| `chart` — data visualisation          | T4   | `data.transition`                                                    |
| `calendar` — date selection           | T4   | `data.transition`                                                    |
| `resizable` — adjustable split panels | T0   | none                                                                 |
| `sidebar` — workspace navigation      | T3   | `layout.move`                                                        |
| `data-table` — payments composition   | T2   | `feedback.press`, `state.morph`, `popup.anchored`, `exit.fade`       |
| `date-picker` — calendar composition  | T2   | `feedback.press`, `popup.anchored`, `exit.fade`, `data.transition`   |
| `navigation-menu` — site navigation   | T3   | `popup.anchored`, `exit.fade`, `geometry.resize`                     |

The remaining scheduled components, their batches, and the motion tier for each are listed in
[docs/parity-plan.md](docs/parity-plan.md).

## Rules

- **Same API as shadcn.** Exports, props, and `data-slot` values match upstream; additions are allowed, renames are not.
- **UI only.** Components render invalid state from `aria-invalid`; they never validate a value, own a schema, or hold form state. See [Field](content/components/field.mdx).
- **Motion has a contract.** Every animation explains a state change; components that do not need motion stay still.
- **Reduced motion is a branch, not a patch.** `data-motion="none"` turns everything off.

## Development

```bash
pnpm install
pnpm dev              # docs site at http://localhost:3000
pnpm lint             # Biome: lint + formatting + import order
pnpm format           # rewrite files with Biome
pnpm registry:build   # rebuild public/r from registry.json + content
pnpm upstream:sync    # re-pin shadcn's source and refresh upstream/manifest.json
pnpm parity:check     # compare exports and data-slot values with that pin
pnpm check            # typecheck + lint + registry check + parity + tests
node scripts/new-item.mjs --name tooltip --tier T2   # scaffold a component
```

Run `pnpm registry:build` before `pnpm check` after touching `registry.json`, `content/`, or shipped source. Requires Node 20+ and pnpm 10 (a standalone pnpm binary, no corepack; `packageManager` pins 10.34.5).

Upstream source is fetched into `.cache/shadcn/` (gitignored) and summarised in the committed `upstream/manifest.json`, so `parity:check` runs offline. Re-pin deliberately with `pnpm upstream:sync --latest`, then bump every `meta.upstream.version` and rebuild.

## Documentation

- Site: `/docs/installation`, `/docs/theming`, `/docs/motion`, `/docs/motion-modes`, plus a page per component.
- Machine-readable: `/llms.txt`, `/llms-full.txt`, `/r/registry.json`, `/r/catalog.json`, `/r/<id>.md`.
- Design record: [overall design](docs/overall-design.md), [animation system](docs/animation-system.md), [documentation site and distribution](docs/documentation-site-and-distribution.md), [parity plan](docs/parity-plan.md), [ADRs](docs/adr.md).
- Contributing: [CONTRIBUTING.md](CONTRIBUTING.md); agent notes: [AGENTS.md](AGENTS.md).

## License

MIT. See [LICENSE](LICENSE).

### Registry distribution

Current `/r` resources revalidate with exact-byte ETags. Explicit retained content snapshots
provide immutable installs; see [Registry](content/docs/registry.mdx) for local hosting,
namespace pinning and the freeze command. Snapshot paths are content identities, not releases.
See [Accessibility](content/docs/accessibility.mdx), [AI usage](content/docs/ai.mdx) and
[Unreleased changes](content/docs/changelog.mdx) for current responsibilities and boundaries.
