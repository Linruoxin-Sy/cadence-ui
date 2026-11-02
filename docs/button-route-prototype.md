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
  all h2/h3 anchors and TOC, installation with four package managers and shared remembered selection,
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
