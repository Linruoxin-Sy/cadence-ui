# Cadence UI

Animation-first React components for [shadcn](https://ui.shadcn.com): Base UI for behaviour, Tailwind CSS v4 for styling, Motion for animation. Every component mirrors shadcn's API, ships its source, and documents a motion contract with a reduced-motion branch.

```bash
npx shadcn@latest add @cadence/button
```

> Status: **B2 complete.** B0 removed the eight original motion components and shipped the parity foundation;
> B1 added the eleven atoms (button, badge, kbd, separator, label, input, textarea, card, aspect-ratio, avatar,
> skeleton) plus the upstream parity check; B2 added the nine structure-and-feedback components (alert, empty,
> item, field, button-group, input-group, breadcrumb, pagination, spinner). B3 (form controls) is next — see
> [the parity plan](docs/parity-plan.md).

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

Files land in `components/cadence/` (`src/components/cadence/` in a `src/` project) and use relative imports, so no `tsconfig` change is needed. Wrapping the app in `CadenceProvider` is optional and gives one place to control motion intensity:

```tsx
import { CadenceProvider } from "@/components/cadence/lib/provider";

<CadenceProvider mode="full">{children}</CadenceProvider>;
```

## Components

| Component                           | Tier | Motion                        |
| ----------------------------------- | ---- | ----------------------------- |
| `button` — action trigger           | T1   | `feedback.press`              |
| `badge` — status label              | T0   | none                          |
| `kbd` — key or shortcut hint        | T0   | none                          |
| `separator` — group boundary        | T0   | none                          |
| `label` — control name              | T0   | none                          |
| `input` — single-line field         | T0   | none                          |
| `textarea` — multi-line field       | T0   | none                          |
| `card` — grouped surface            | T0   | none                          |
| `aspect-ratio` — reserved media box | T0   | none                          |
| `avatar` — image with fallback      | T0   | none                          |
| `skeleton` — loading placeholder    | T4   | `data.transition`             |
| `dialog` — modal window             | T2   | `popup.anchored`, `exit.fade` |
| `alert` — state message             | T0   | none                          |
| `empty` — resting state             | T0   | none                          |
| `item` — list row                   | T0   | none                          |
| `field` — labelled control          | T0   | none                          |
| `button-group` — joined controls    | T0   | none                          |
| `input-group` — framed field        | T0   | none                          |
| `breadcrumb` — trail                | T0   | none                          |
| `pagination` — page navigation      | T0   | none                          |
| `spinner` — indeterminate wait      | T4   | `data.transition`             |

The remaining 36 components, their batches, and the motion tier for each are listed in
[docs/parity-plan.md](docs/parity-plan.md).

## Rules

- **Same API as shadcn.** Exports, props, and `data-slot` values match upstream; additions are allowed, renames are not.
- **UI only.** Components render invalid state from `aria-invalid`; they never validate a value, own a schema, or hold form state. See [validation](content/docs/validation.mdx).
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

- Site: `/docs/installation`, `/docs/theming`, `/docs/motion`, `/docs/validation`, plus a page per component.
- Machine-readable: `/llms.txt`, `/llms-full.txt`, `/r/registry.json`, `/r/catalog.json`, `/r/<id>.md`.
- Design record: [overall design](docs/overall-design.md), [animation system](docs/animation-system.md), [documentation site and distribution](docs/documentation-site-and-distribution.md), [parity plan](docs/parity-plan.md), [ADRs](docs/adr.md).
- Contributing: [CONTRIBUTING.md](CONTRIBUTING.md); agent notes: [AGENTS.md](AGENTS.md).

## License

MIT. See [LICENSE](LICENSE).
