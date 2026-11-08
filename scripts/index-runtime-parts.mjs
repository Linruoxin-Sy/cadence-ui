/** Read-only source inventory. Evidence status is deliberately separate from syntax. */
import { createHash } from "node:crypto";
import { mkdirSync as ensureAuditDirectory, readdirSync, readFileSync, writeFileSync } from "node:fs";
import ts from "typescript";

ensureAuditDirectory(".cache/audits", { recursive: true });

const delegates = {
  combobox: [
    "ComboboxInput showTrigger -> InputGroupButton -> Button render ComboboxTrigger; standalone Trigger/Clear use static variants",
  ],
  "button-group": ["ButtonGroupText -> Button when rendered by caller"],
  "input-group": ["InputGroupButton -> Button"],
  pagination: ["PaginationLink/Previous/Next -> buttonVariants CSS only (no press engine)"],
  field: ["FieldLabel -> Label; no autonomous motion"],
  item: ["Item -> native useRender; no authored list stagger"],
  command: ["CommandDialog -> DialogContent/Overlay"],
  menubar: ["Content/SubContent -> DropdownMenuContent", "CheckboxItem/RadioItem -> DropdownMenu control indicator"],
  sidebar: [
    "mobile -> SheetContent/Overlay",
    "MenuButton tooltip -> TooltipContent",
    "MenuSkeleton -> Skeleton",
    "Trigger -> Button",
  ],
  "data-table": ["Button", "Checkbox indicator", "DropdownMenuContent/SubContent and control indicators"],
  "date-picker": ["Button", "PopoverContent", "CalendarMonthGrid native WAAPI"],
  attachment: ["AttachmentAction -> Button", "caller-composed Spinner"],
  collapsible: ["caller render Button owns separate press"],
  calendar: ["CalendarDayButton/navigation -> native button + static buttonVariants; no PressButton engine"],
  carousel: ["Previous/Next -> Button"],
  "alert-dialog": ["Action/Cancel -> Button"],
};
// Explicit runtime targets, including unslotted surfaces and engine-generated descendants.
const parts = {
  button: ["PressButton actual button | native pointer/Enter lifecycle + Motion committed controls | feedback.press"],
  skeleton: ["skeleton | CSS animation pulse | data.transition"],
  spinner: ["spinner SVG | CSS animation spin (single glyph reduced exception) | data.transition"],
  checkbox: ["checkbox-indicator ControlSpan | Motion controls | state.morph"],
  "radio-group": ["radio-group-indicator ControlSpan | Motion controls | state.morph"],
  switch: ["switch-thumb ControlSpan positional target | Motion controls | state.morph"],
  slider: ["slider-thumb ControlDiv | Base dragging + Motion committed controls | feedback.press"],
  toggle: ["toggle PressButton | native pointer/Enter lifecycle + Motion committed controls | feedback.press"],
  "toggle-group": [
    "toggle-group-item PressButton | native pointer/Enter lifecycle + Motion committed controls | feedback.press",
  ],
  "input-otp": ["input-otp-slot > unslotted character motion.span | Motion controls | state.morph"],
  progress: [
    "progress-indicator NativeControlDiv determinate scaleX | Motion controls | data.transition",
    "same indicator indeterminate pulse | CSS animation | data.transition",
  ],
  dialog: ["dialog-content popup + dialog-overlay backdrop | CSS transition | popup.anchored, exit.fade"],
  "alert-dialog": [
    "alert-dialog-content popup + alert-dialog-overlay backdrop | CSS transition | popup.anchored, exit.fade",
  ],
  sheet: ["sheet-content popup + sheet-overlay backdrop | CSS transition | popup.anchored, exit.fade"],
  drawer: [
    "drawer-popup + drawer-overlay | CSS transition | popup.anchored, exit.fade",
    "drawer swipe transform custom properties | Base UI direct gesture + native settling (not Motion) | primitive-owned",
  ],
  popover: ["popover-content | CSS transition | popup.anchored, exit.fade"],
  tooltip: ["tooltip-content | CSS transition | popup.anchored, exit.fade"],
  "hover-card": ["hover-card-content | CSS transition | popup.anchored, exit.fade"],
  select: [
    "select-content | CSS transition | popup.anchored",
    "select-value motion.span width | Motion imperative motion value | geometry.resize",
    "select-trigger portal flying label motion.span | Motion declarative | handoff",
    "select-item-indicator ControlSpan | Motion controls | state.morph",
  ],
  combobox: [
    "combobox-content | CSS transition | popup.anchored, exit.fade",
    "combobox-item-indicator ControlSpan | Motion controls | state.morph",
  ],
  "dropdown-menu": [
    "dropdown-menu-content + dropdown-menu-sub-content (same writer) | CSS transition | popup.anchored, exit.fade",
    "checkbox/radio item > indicator ControlSpan (unslotted) | Motion controls | state.morph",
  ],
  "context-menu": [
    "context-menu-content + context-menu-sub-content (same writer) | CSS transition | popup.anchored, exit.fade",
    "checkbox/radio item > indicator ControlSpan (unslotted) | Motion controls | state.morph",
  ],
  toast: [
    "toast root (stack top/height update instantly) | CSS transition | popup.anchored, exit.fade",
    "swipe variables | Base UI direct gesture | primitive-owned",
  ],
  accordion: ["accordion-content measured panel (inner is measurement only) | CSS height transition | geometry.resize"],
  collapsible: [
    "collapsible-content measured panel (inner is measurement only) | CSS height transition | geometry.resize",
  ],
  tabs: ["tabs-trigger > unslotted motion.span shared indicator | Motion layoutId | layout.shared"],
  carousel: ["carousel-content inner Embla track; loop slide relocations | Embla rAF engine | data.transition"],
  chart: [
    "chart > Recharts generated area/line/bar/pie/radar/radial descendants | Recharts AnimationControllerProvider (JS engine) | data.transition",
    "ChartTooltip isAnimationActive=false | Recharts positioning only | no tooltip entrance",
  ],
  calendar: ["calendar-month-grid table | native element.animate WAAPI | data.transition"],
  "navigation-menu": [
    "navigation-menu-popup scale/opacity + width/height | CSS transitions + Base UI measurement | popup.anchored, exit.fade, geometry.resize",
    "navigation-menu-content cross-fade | CSS transition | popup.anchored, exit.fade",
    "positioner/viewport | Base UI instant position/static clipping | no separate writer",
    "indicator arrow rotate-45 | static orientation | no autonomous motion",
  ],
  sidebar: [
    "sidebar-gap/sidebar-container desktop coupled width and size-linked translation | one physical size scalar with native replace effects | geometry.resize + layout.move",
  ],
  attachment: ["attachment-title processing/uploading pulse | CSS animation | data.transition"],
  bubble: [
    "bubble root @starting-style fade | CSS transition | data.transition",
    "bubble-reactions translate-y-3/4 | static placement | no autonomous motion",
  ],
  "code-block": [
    "code-block-tab-indicator | Motion declarative shared geometry | layout.shared",
    "code-block-actions floating opacity | Motion declarative | data.transition",
    "code-block-copy-button > two unslotted glyph motion.spans | Motion declarative | state.morph",
    "code-block-viewport measured height | Motion imperative motion value | geometry.resize",
    "code-block-expand-button > unslotted motion.svg orientation | Motion declarative | state.morph",
  ],
};
function scan(path) {
  const source = readFileSync(path, "utf8");
  const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const slots = [];
  const signals = [];
  function visit(node, owner = "module") {
    if (ts.isFunctionDeclaration(node) && node.name) owner = node.name.text;
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) owner = node.name.text;
    if (ts.isJsxAttribute(node) && node.name.getText(ast) === "data-slot")
      slots.push({
        owner,
        line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1,
        value: node.initializer?.getText(ast),
      });
    if (
      ts.isStringLiteralLike(node) ||
      ts.isTemplateExpression(node) ||
      ts.isJsxOpeningElement(node) ||
      ts.isJsxSelfClosingElement(node) ||
      ts.isCallExpression(node)
    ) {
      const text = node.getText(ast);
      const signal =
        ts.isStringLiteralLike(node) || ts.isTemplateExpression(node)
          ? /animate-|transition-|starting:|data-starting-style/.test(text)
          : ts.isCallExpression(node)
            ? /^(animate|.*\.animate|.*\.start|.*\.transition)\(/.test(text)
            : /^(motion\.|Motion|Control|NativeControl)/.test(node.tagName.getText(ast));
      if (signal)
        signals.push({
          owner,
          line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1,
          text: text.slice(0, 550),
        });
    }
    ts.forEachChild(node, (child) => visit(child, owner));
  }
  visit(ast);
  return { path, sha256: createHash("sha256").update(source).digest("hex"), slots, signals };
}
const registry = JSON.parse(readFileSync("registry.json", "utf8"));
const items = registry.items
  .filter((i) => ["registry:ui", "registry:block"].includes(i.type))
  .map((i) => ({
    id: i.name,
    recipes: i.meta.motion,
    tier: i.meta.tier,
    targets: parts[i.name] ?? [],
    delegates: delegates[i.name] ?? [],
    disposition:
      parts[i.name] || delegates[i.name]
        ? "See per-part evidence/gaps in engine-runtime.md (basic controls: basic-controls-runtime.json); CSS proof stays in css-lifecycle.md. Not a global runtime pass"
        : "Source reviewed: structural/state colour-border-shadow feedback only; no autonomous writer",
    source: scan(`registry/cadence/${i.name}/index.tsx`),
  }));
const siteTargets = {
  "document-entrance": [
    "actual article/div/section motion element | Motion committed controls/useInView | site-only reveal + documented clipPath exception; SSR hidden, noscript/print restore",
  ],
  reveal: [
    "data-site-reveal row div | native CSS transition + IntersectionObserver trigger | reveal opacity/transform/filter",
  ],
  sidebar: [
    "data-site-panel Disclosure div | native CSS measured height/opacity | geometry.resize + reveal",
    "DisclosureChevron span wrapping SVG | native CSS transform | state.morph orientation",
    "mobile Browse summary text span | native CSS rotate | state.morph orientation",
  ],
  "previews/shell": [
    "data-preview-stack div | native CSS @starting-style transition | site-only reveal opacity/translate",
  ],
  "measured-height": [
    "data-preview-body shell | ResizeObserver instantaneous height | layout only, no autonomous animation",
  ],
  "theme-toggle": ["native button | instant theme class switch + colour feedback | no view transition"],
};
const site = Object.entries(siteTargets).map(([id, targets]) => ({ ...scan(`components/site/${id}.tsx`), targets }));
const shared = readdirSync("registry/cadence/lib")
  .filter((p) => /\.(ts|tsx)$/.test(p))
  .map((p) => scan(`registry/cadence/lib/${p}`));
writeFileSync(
  ".cache/audits/runtime-parts.json",
  `${JSON.stringify({ schema: 1, date: "2026-11-02 Asia/Shanghai", pin: "96da9cc7f1aa10580a3741664e2a77c721206c00", scope: "58 items, source slot/signal index plus explicit actual engine targets; syntax signals include static feedback and are not proof of playback. API ledger remains separate.", obligations: ["3 modes x 2 OS; insertion/reopen first paint; live same-target cancellation; inherited and explicit clock; nested full inside none; entry/exit/reversal/resize/lifecycle/focus as applicable", "CSS theme clocks are not recipe timeScale; native CSS transition clock changes use browser retargeting semantics, not a promised controller restart", "Motion WAAPI acceleration remains Motion-owned; getAnimations alone cannot classify engine"], items, site, shared }, null, 2)}\n`,
);
console.log(`Indexed ${items.length} items, ${site.length} site surfaces, ${shared.length} shared sources.`);
