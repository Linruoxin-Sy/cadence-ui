# Cadence UI

Animation-first React components for [shadcn](https://ui.shadcn.com): Base UI for behaviour, Tailwind CSS v4 for styling, Motion for animation. Every component mirrors shadcn's API, ships its source, and documents a motion contract with a reduced-motion branch.

```bash
npx shadcn@latest add @cadence/button
```

> Status: **B0 complete.** The eight original motion components were removed and archived; the parity foundation (motion tiers, P11 checks, the `new-item` scaffold, and the `button`/`dialog` pilots) is in place. B1 (11 atoms) is next — see [the parity plan](docs/parity-plan.md).

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

| Component                 | Tier | Motion                        |
| ------------------------- | ---- | ----------------------------- |
| `button` — action trigger | T1   | `feedback.press`              |
| `dialog` — modal window   | T2   | `popup.anchored`, `exit.fade` |

The remaining 55 components, their batches, and the motion tier for each are listed in [docs/parity-plan.md](docs/parity-plan.md).

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
pnpm check            # typecheck + lint + registry checks + tests
node scripts/new-item.mjs --name tooltip --tier T2   # scaffold a component
```

Run `pnpm registry:build` before `pnpm check` after touching `registry.json`, `content/`, or shipped source. Requires Node 20+ and pnpm 10 (a standalone pnpm binary, no corepack; `packageManager` pins 10.34.5).

## Documentation

- Site: `/docs/installation`, `/docs/theming`, `/docs/motion`, `/docs/validation`, plus a page per component.
- Machine-readable: `/llms.txt`, `/llms-full.txt`, `/r/registry.json`, `/r/catalog.json`, `/r/<id>.md`.
- Design record: [overall design](docs/overall-design.md), [animation system](docs/animation-system.md), [documentation site and distribution](docs/documentation-site-and-distribution.md), [parity plan](docs/parity-plan.md), [ADRs](docs/adr.md).
- Contributing: [CONTRIBUTING.md](CONTRIBUTING.md); agent notes: [AGENTS.md](AGENTS.md).

## License

MIT. See [LICENSE](LICENSE).
