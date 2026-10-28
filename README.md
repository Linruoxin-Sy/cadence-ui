# Cadence UI

Animation-first React components for [shadcn](https://ui.shadcn.com): Base UI for behaviour, Tailwind CSS v4 for styling, Motion for animation. Every component ships its source, a documented motion contract, and a reduced-motion branch.

```bash
npx shadcn@latest add @cadence/fade-in
```

> Status: MVP in progress — 8 of 15 planned components shipped, with the registry pipeline, docs site, and tests green.

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
npx shadcn@latest add @cadence/morph-button
```

Files land in `components/cadence/` (`src/components/cadence/` in a `src/` project) and use relative imports, so no `tsconfig` change is needed. Wrapping the app in `CadenceProvider` is optional and gives one place to control motion intensity:

```tsx
import { CadenceProvider } from "@/components/cadence/lib/provider";

<CadenceProvider mode="full">{children}</CadenceProvider>;
```

## Components

| Component                                  | Motion                          |
| ------------------------------------------ | ------------------------------- |
| `fade-in` — reveal on scroll               | `reveal`                        |
| `text-reveal` — word-by-word heading       | `text.reveal`                   |
| `number-flow` — rolling number             | `number.roll`                   |
| `morph-button` — label and width morph     | `state.morph`, `feedback.press` |
| `animated-tabs` — shared-element indicator | `layout.shared`, `reveal`       |
| `motion-accordion` — spring panels         | `state.morph`                   |
| `scroll-progress` — reading progress bar   | `scroll.progress`               |
| `motion-dialog` — interruptible dialog     | `popup.anchored`, `exit.fade`   |

Seven more are planned (`toast-stack`, `theme-toggle`, `command-palette`, `motion-sheet`, `carousel`, `reorderable-list`, `scroll-story`); their recipes are defined in the [animation system](docs/animation-system.md).

## Development

```bash
pnpm install
pnpm dev              # docs site at http://localhost:3000
pnpm lint             # Biome: lint + formatting + import order
pnpm format           # rewrite files with Biome
pnpm registry:build   # rebuild public/r from registry.json + content
pnpm check            # typecheck + lint + registry checks + tests
```

Run `pnpm registry:build` before `pnpm check` after touching `registry.json`, `content/`, or shipped source. Requires Node 20+ and pnpm 10 (a standalone pnpm binary, no corepack; `packageManager` pins 10.34.5).

## Documentation

- Site: `/docs/installation`, `/docs/theming`, `/docs/motion`, plus a page per component.
- Machine-readable: `/llms.txt`, `/llms-full.txt`, `/r/registry.json`, `/r/catalog.json`, `/r/<id>.md`.
- Design record: [overall design](docs/overall-design.md), [animation system](docs/animation-system.md), [documentation site and distribution](docs/documentation-site-and-distribution.md), [ADRs](docs/adr.md).
- Contributing: [CONTRIBUTING.md](CONTRIBUTING.md); agent notes: [AGENTS.md](AGENTS.md).

## License

MIT. See [LICENSE](LICENSE).
