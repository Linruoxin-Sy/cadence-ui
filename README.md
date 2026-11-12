# Cadence UI

Animation-first React components for [shadcn](https://ui.shadcn.com): Base UI for behaviour, Tailwind CSS v4 for styling, Motion for animation. Every component mirrors shadcn's API, ships its source, and documents a motion contract with a reduced-motion branch.

```bash
npx shadcn@latest add @cadence/button
```

> Scope and future work: [the plan](docs/parity-plan.md). Performance acceptance remains open.

The [motion v2 design](docs/animation-system.md) defines applicable appearance, size, colour, text,
number and interaction animation capabilities for every component, with explicit ownership instead of
tier-based animation limits. Its [implementation plan](docs/animation-system-plan.md) is pending work:
the runtime, registry metadata, MDX and test helpers still describe the current compatibility surface.
Planned `state.color`, `text.change`, revised numeric rolling and public helpers are not yet installable
features. The v2 targets of stopping every continuous loop under `reduced` (including Spinner) and
disabling colour transitions under `none` also require runtime and test migration.

The [individual motion catalogue](docs/motion/README.md) gives every component its own target animation
design. Global style guides its choreography; shared modes, semantics, ownership and budgets remain
mandatory. [Preset assignments](docs/motion/presets.md) centralise parameters without making every
component use an identical effect. These are design documents, not additional shipped features.

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

The table records currently shipped recipe declarations and compatibility tiers, not v2 completion or
limits on which capabilities a component may acquire.

| Component                             | Tier | Motion                                                              |
| ------------------------------------- | ---- | ------------------------------------------------------------------- |
| `animated-number` — quantities        | T1   | `number.roll`                                                       |
| `animated-text` — changed text        | T1   | `text.change`                                                       |
| `button` — action trigger             | T1   | [7 recipes](content/components/button.mdx#motion-contract)          |
| `badge` — status label                | T0   | [6 recipes](content/components/badge.mdx#motion-contract)           |
| `kbd` — key or shortcut hint          | T0   | [6 recipes](content/components/kbd.mdx#motion-contract)             |
| `separator` — group boundary          | T0   | [4 recipes](content/components/separator.mdx#motion-contract)       |
| `label` — control name                | T0   | [5 recipes](content/components/label.mdx#motion-contract)           |
| `input` — single-line field           | T0   | none                                                                |
| `textarea` — multi-line field         | T0   | none                                                                |
| `card` — grouped surface              | T0   | [6 recipes](content/components/card.mdx#motion-contract)            |
| `toc` — document section navigation   | T3   | `layout.shared`, `scroll.navigate`                                  |
| `aspect-ratio` — reserved media box   | T0   | none                                                                |
| `avatar` — image with fallback        | T0   | none                                                                |
| `skeleton` — loading placeholder      | T4   | `data.transition`                                                   |
| `dialog` — modal window               | T2   | `popup.anchored`, `exit.fade`                                       |
| `alert-dialog` — confirmation         | T2   | `popup.anchored`, `exit.fade`                                       |
| `popover` — anchored panel            | T2   | `popup.anchored`, `exit.fade`                                       |
| `tooltip` — hint on hover             | T2   | `popup.anchored`, `exit.fade`                                       |
| `hover-card` — preview panel          | T2   | `popup.anchored`, `exit.fade`                                       |
| `sheet` — edge panel                  | T2   | `popup.anchored`, `exit.fade`                                       |
| `drawer` — bottom sheet               | T2   | `popup.anchored`, `exit.fade`                                       |
| `select` — single choice              | T3   | [8 recipes](content/components/select.mdx#motion-contract)          |
| `combobox` — searchable choice        | T2   | [3 recipes](content/components/combobox.mdx#motion-contract)        |
| `dropdown-menu` — actions menu        | T2   | [3 recipes](content/components/dropdown-menu.mdx#motion-contract)   |
| `context-menu` — right-click menu     | T2   | [3 recipes](content/components/context-menu.mdx#motion-contract)    |
| `menubar` — application menu          | T2   | [3 recipes](content/components/menubar.mdx#motion-contract)         |
| `command` - searchable actions        | T2   | `popup.anchored`, `exit.fade`                                       |
| `alert` — state message               | T0   | [7 recipes](content/components/alert.mdx#motion-contract)           |
| `empty` — resting state               | T0   | none                                                                |
| `item` — list row                     | T0   | none                                                                |
| `field` — labelled control            | T0   | none                                                                |
| `button-group` — joined controls      | T0   | [7 recipes](content/components/button-group.mdx#motion-contract)    |
| `input-group` — framed field          | T0   | none                                                                |
| `breadcrumb` — trail                  | T0   | none                                                                |
| `pagination` — page navigation        | T0   | none                                                                |
| `spinner` — indeterminate wait        | T4   | `data.transition`                                                   |
| `checkbox` — binary choice            | T1   | `state.morph`                                                       |
| `radio-group` — exclusive choice      | T1   | `state.morph`                                                       |
| `switch` — on/off control             | T1   | `state.morph`                                                       |
| `slider` — range control              | T1   | `feedback.press`                                                    |
| `toggle` — pressed state              | T1   | [6 recipes](content/components/toggle.mdx#motion-contract)          |
| `toggle-group` — toolbar and segments | T3   | [8 recipes](content/components/toggle-group.mdx#motion-contract)    |
| `input-otp` — one-time code           | T1   | `state.morph`                                                       |
| `progress` — determinate completion   | T4   | `data.transition`                                                   |
| `code-block` — code surface           | T5   | [4 recipes](content/components/code-block.mdx#motion-contract)      |
| `chart` — data visualisation          | T4   | `data.transition`                                                   |
| `calendar` — date selection           | T4   | `data.transition`                                                   |
| `resizable` — adjustable split panels | T0   | none                                                                |
| `sidebar` — workspace navigation      | T3   | [3 recipes](content/components/sidebar.mdx#motion-contract)         |
| `data-table` — payments composition   | T2   | [4 recipes](content/components/data-table.mdx#motion-contract)      |
| `date-picker` — calendar composition  | T2   | [4 recipes](content/components/date-picker.mdx#motion-contract)     |
| `navigation-menu` — site navigation   | T3   | [3 recipes](content/components/navigation-menu.mdx#motion-contract) |

Component scope, batches, compatibility tiers and future work are listed in
[docs/parity-plan.md](docs/parity-plan.md).

## Rules

- **Same API as shadcn.** Exports, props, and `data-slot` values match upstream; additions are allowed, renames are not.
- **UI only.** Components render invalid state from `aria-invalid`; they never validate a value, own a schema, or hold form state. See [Field](content/components/field.mdx).
- **Motion has a contract.** Assess each component's applicable capabilities, preserve semantic behaviour,
  and give every animated property one owner. Shipped recipes must match their implementation and user docs.
- **Reduced motion is a branch, not a patch.** Preserve full/reduced/none behaviour and test live mode
  changes; the [v2 implementation plan](docs/animation-system-plan.md) tracks the stricter colour and loop guarantees.

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
- Design record: [overall design](docs/overall-design.md), [animation system](docs/animation-system.md), [motion implementation plan](docs/animation-system-plan.md), [documentation site and distribution](docs/documentation-site-and-distribution.md), [parity plan](docs/parity-plan.md), [ADRs](docs/adr.md).
- Contributing: [CONTRIBUTING.md](CONTRIBUTING.md); agent notes: [AGENTS.md](AGENTS.md).

## License

MIT. See [LICENSE](LICENSE).

### Registry distribution

Current `/r` resources revalidate with exact-byte ETags. Explicit retained content snapshots
provide immutable installs; see [Registry](content/docs/registry.mdx) for local hosting,
namespace pinning and the freeze command. Snapshot paths are content identities, not releases.
See [Accessibility](content/docs/accessibility.mdx), [AI usage](content/docs/ai.mdx) and
[Unreleased changes](content/docs/changelog.mdx) for current responsibilities and boundaries.
