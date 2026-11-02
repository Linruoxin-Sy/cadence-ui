# Complete Button route prototype contract

2026-11-02. W3 route A, investigation under ADR-016; ADR-009 remains accepted.

Candidate: direct React SSR, resolve server components into a serializable element tree, hydrate the
original client boundaries in one React root. No component forks, Motion substitutions, lazy feature
deferral, new dependencies or product configuration changes. The original server route/layout/MDX,
source readers and highlighting produce the tree. Original CSS is compiled with installed PostCSS.

Inventory from app/layout.tsx, app/(site)/layout.tsx, app/(site)/components/[id]/page.tsx and imports:

- Root: theme first-paint bootstrap, skip link, header, theme toggle, full/reduced/none settings,
  speed Select and storage/URL precedence, shared MotionModeProvider and PackageManagerProvider,
  main landmark and footer links. Test persistence, keyboard and resolved OS modes.
- Shared layout: responsive Sidebar, desktop/mobile copies, group disclosures, active links and
  measured panels. Test mobile navigation, focus and real destinations; persistent shell is required.
- Button: breadcrumb, title/description, original PreviewFrame and all 16 buttons, six variants,
  eight sizes, icon/disabled examples, variant URL/history/focus, nested motion selector.
- Original source details and every highlighted source fence/copy control; original MDX body,
  all h2/h3 anchors and TOC, installation with the three actual package managers (pnpm/npm/yarn) and shared remembered selection,
  usage/example/API/motion/accessibility/performance content, Edit and previous/next navigation.
- Search/category/intensity/complexity filters exist on /components (not in the Button header).
  They must remain reachable with original behavior, rather than adding invented search controls.
- The current Button page has no preview/code toggle: source is a native details disclosure;
  docs fences and package-manager tabs are the existing content controls.

Acceptance: strict initial-JS sampler (cache disabled, no interception/scroll/interaction,
load + networkidle +10s +networkidle, decoded response bodies gzip6 per unique URL, all automatic
scripts), exact <=120000 threshold, raw requests/hashes/errors and build graph. Independently test
SSR/noJS full content, cold interactions/clipboard/storage/history, modes/speed, focus and stable
nodes/live cancellation, desktop/mobile light/dark screenshots inspected against product, axe and
bounded CLS. Device FPS is not inferred from viewport emulation. Report actual failures and gaps.

Reproduction and final evidence will be appended when measured; this is not migration acceptance.


## Runnable candidate and limits

Implementation is `scripts/prototype-button-route.mjs`; independent interactions live in
`scripts/verify-button-prototype.mjs`. The former writes the complete reproducible implementation,
browser graph, server bundle, HTML, serialized server tree, CSS, raw measurements and screenshots to
`.cache/button-route-prototype`. There are no registry forks or new dependencies. `next/link` and
`next/navigation` are replaced only inside the experiment with a small history/route-tree adapter;
original shared providers and Sidebar stay mounted across the exercised docs/catalog/component
navigation. The original explicit preview manifest loads the requested real preview before commit.
All initial automatic chunks count, including imports induced by the full preview manifest.

To reproduce in PowerShell, first ensure 3183 is free, then start the retained product baseline:

```powershell
$env:CADENCE_DIST_DIR='.next-motion-runtime'
$env:NODE_OPTIONS='--max-old-space-size=768'
$env:RAYON_NUM_THREADS='2'
pnpm exec next start -p 3183
```

In a second terminal use the same heap/thread settings and run:

```powershell
$env:PLAYWRIGHT_CHANNEL='msedge'
node scripts/prototype-button-route.mjs
```

The prototype picks a free OS port and closes its browser/server in finally. `--serve` leaves it
running for manual inspection; stop that terminal afterwards. `PROTOTYPE_BASELINE` may point to a
different verified product server. Non-document destinations (registry/llms/assets) proxy to that
baseline, preserving real reachable behavior; this is not a standalone hosting migration. The
baseline build is W2 `19Ek7XDFoWB78EgcZRqpJ`, runtime f60e7fe, not a new product build.
A build from source is reproducible; this does not claim byte-identical output on another OS/path.

The serializable tree carries markup/data and named client references, never executable application
strings/eval. The existing theme bootstrap runs before paint. Server-only MDX/highlighting never
become browser code. All original Button client boundaries hydrate immediately after initial
imports/tree retrieval; there is no measurement-window timer or interaction-delayed essential control.
A single root preserves context/layoutId behavior and the complete Motion engine is retained.

This small adapter is a research runtime, not a replacement production router: concurrent SSR request
isolation, error/not-found handling, metadata completeness on every destination, caching, streaming,
CSP and standalone registry hosting would need migration design and review. Only Button and the
explicit navigation/search paths exercised by the audit are validated, not 69-page acceptance.
The installed React 19.3.1 runtime is used; existing React19.0 consumer proofs apply to unchanged
registry source, not new certification of this experimental router.

## Measured outcome

See [complete evidence](evidence/button-route-prototype.md) and
[machine results](evidence/button-route-prototype.json). The full candidate is runnable, but fails
initial JS (221511 >120000) and the bounded mobile interaction CLS window (0.040203, also present on
the original baseline). No migration is accepted. Budget/functionality/dependency contracts stay fixed.
