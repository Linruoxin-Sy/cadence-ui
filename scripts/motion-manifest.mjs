/**
 * Shared parser for the motion metadata, so `build-registry` and `check-registry`
 * agree on what a declaration means.
 *
 * A registry item declares its recipes in `meta.motion`. An entry is either a bare
 * recipe name (the default: a one-shot Motion transition) or an object that names
 * the form the component implements it in:
 *
 *   "motion": ["feedback.press"]
 *   "motion": [{ "recipe": "data.transition", "form": "continuous" }]
 *
 * The docs keep the bare names (`motion: [feedback.press]`) because they are read by
 * humans; `normaliseMotion()` folds both shapes down to `{ recipe, form }` so the two
 * sides can be compared.
 */

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let compiler;

/** Installed forms only. docs/motion target recipe/form references do not extend this list. */
export const MOTION_FORMS = [
  "one-shot",
  "continuous",
  "css-transition",
  "selection",
  "directional-content",
  "month-grid",
  "size-linked",
  "measured",
];

/**
 * Recipes that a popup may implement in pure CSS. Base UI runs the enter/exit by
 * toggling `data-starting-style` / `data-ending-style`, so there is no
 * `cm.transition()` call to find — the transition itself is the implementation.
 */
const CSS_POPUP_RECIPES = new Set(["popup.anchored", "exit.fade", "exit.shrink"]);

/** Read the `Recipe` union out of `lib/motion.ts`, so the catalogue cannot drift. */
export function recipeCatalogue(source) {
  const union = source.match(/export type Recipe\s*=([\s\S]*?);/);
  if (!union) throw new Error("cannot find `export type Recipe` in registry/cadence/lib/motion.ts");
  return [...union[1].matchAll(/"([a-z][a-z.]*)"/g)].map((match) => match[1]);
}

/**
 * Read the `Recipe` union out of §5 of the animation system document.
 *
 * This is the drift that survived a review: `theme.reveal` was listed in the docs,
 * absent from `lib/motion.ts`, and nothing compared the two. The doc is the
 * contract readers plan against, so a recipe that exists only there is a defect.
 */
export function documentedRecipes(markdown) {
  const section = markdown.split("## 5. Composition-layer API")[1];
  if (!section) throw new Error("docs/animation-system.md: cannot find `## 5. Composition-layer API`");
  const union = section.match(/export type Recipe\s*=([\s\S]*?);/);
  if (!union) throw new Error("docs/animation-system.md §5: cannot find the `Recipe` union");
  return [...union[1].matchAll(/"([a-z][a-z.]*)"/g)].map((match) => match[1]);
}

/** Read the recipe names out of the §3 catalogue table (one row per recipe). */
export function cataloguedRecipes(markdown) {
  const section = markdown.split("## 3. Recipe catalogue")[1]?.split("### 3.1")[0];
  if (!section) throw new Error("docs/animation-system.md: cannot find `## 3. Recipe catalogue`");
  return [...section.matchAll(/^\|\s*`([a-z][a-z.]*)`/gm)].map((match) => match[1]);
}

/** Fold a declaration into `{ recipe, form }`. */
export function normaliseMotion(entries = []) {
  return entries.map((entry) =>
    typeof entry === "string"
      ? { recipe: entry, form: "one-shot" }
      : { recipe: entry.recipe, form: entry.form ?? "one-shot" },
  );
}

/** Recipe names only — the shape the docs frontmatter uses. */
export function motionRecipes(entries = []) {
  return normaliseMotion(entries).map((entry) => entry.recipe);
}

/**
 * Which form (if any) the source implements for a declared recipe.
 * Returns `null` when the declaration has no implementation behind it.
 */
export function implementedForm(source, recipe, form = "one-shot") {
  if ((recipe === "layout.move" && form === "size-linked") || (recipe === "geometry.resize" && form === "measured"))
    return source.includes("./size-linked-geometry") &&
      source.includes("createSizeLinkedGeometry(") &&
      source.includes("projection.prepare(") &&
      source.includes("projection.commit(") &&
      source.includes("geometry.resize/measured") &&
      source.includes("layout.move/size-linked")
      ? form
      : null;
  if (recipe === "layout.shared" && form === "selection")
    return source.includes("./selection-projection") &&
      source.includes("createSelectionProjection(") &&
      source.includes("projection.commit(") &&
      source.includes("layout.shared/selection")
      ? form
      : null;
  if (recipe === "data.transition" && form === "directional-content")
    return source.includes("./content-transition") &&
      source.includes("paint.commit(") &&
      source.includes("TabsPanelSurface")
      ? form
      : null;
  if (recipe === "data.transition" && form === "month-grid")
    return source.includes("../lib/content-transition") &&
      source.includes("createContentTransition(") &&
      source.includes("paint.commit(") &&
      source.includes("calendar-month-grid")
      ? form
      : null;
  if (recipe === "state.color")
    return form === "css-transition" && cssPolicyImplementation(source, "useStateColor") ? "css-transition" : null;
  const called = source.includes(`transition("${recipe}")`) || source.includes(`transition('${recipe}')`);

  if (form === "continuous") {
    if (recipe === "data.transition" && cssPolicyImplementation(source, "useContinuousMotion")) return "continuous";
    const loop = /\banimate-(?!none\b)[a-z][a-z-]*\b/.test(source);
    const gated = /\banimate-none\b/.test(source);
    return loop && gated ? "continuous" : null;
  }

  if (called) return "one-shot";

  if (recipe === "geometry.resize" && form === "css-transition") {
    // Navigation Menu delegates measurement/retargeting to Base UI's shared popup engine.
    const sharedPopup =
      source.includes("NavigationMenuPrimitive.Popup") &&
      source.includes("NavigationMenuPrimitive.Viewport") &&
      source.includes("--popup-width") &&
      source.includes("--popup-height") &&
      source.includes("min-h-0 min-w-0 max-h-(--available-height) max-w-(--available-width)") &&
      source.includes("transition-[opacity,scale,width,height]") &&
      source.includes("--motion-duration-slow") &&
      source.includes("ease-cadence-out") &&
      /cm\.reduced\s*\?\s*"transition-opacity"/.test(source) &&
      source.includes("data-motion={cm.mode}");
    if (sharedPopup) return "css-transition";

    const states = source.includes("data-[starting-style]:h-0") && source.includes("data-[ending-style]:h-0");
    const measured =
      source.includes("ResizeObserver") && source.includes("getBoundingClientRect") && source.includes("Math.max(0,");
    const transition =
      source.includes("transition-[height]") &&
      source.includes("--motion-duration-slow") &&
      source.includes("ease-cadence-out");
    const modes = source.includes("cm.reduced") && source.includes("duration-0");
    return states && measured && transition && modes ? "css-transition" : null;
  }

  if (CSS_POPUP_RECIPES.has(recipe)) {
    const hasPopupState = /data-(?:starting|ending)-style/.test(source);
    const hasTransition = /\b(?:transition-|duration-\()/.test(source);
    if (hasPopupState && hasTransition) return "css-transition";
  }

  return null;
}

/** Every `cm.transition("<recipe>")` call in a source file. */
export function calledRecipes(source) {
  return [...source.matchAll(/transition\(\s*["']([a-z][a-z.]*)["']/g)]
    .map((match) => match[1])
    .concat(
      cssPolicyImplementation(source, "useStateColor") ? ["state.color"] : [],
      cssPolicyImplementation(source, "useContinuousMotion") ? ["data.transition"] : [],
    );
}

export function cssPolicyCapabilities(source) {
  return [
    ...(cssPolicyImplementation(source, "useStateColor") ? ["color"] : []),
    ...(cssPolicyImplementation(source, "useContinuousMotion") ? ["loop"] : []),
  ];
}

/** Structural local adoption only; successful runtime evidence remains mandatory. */
function cssPolicyImplementation(source, helper) {
  if (!source.includes("css-motion")) return false;
  compiler ??= require("typescript");
  const ts = compiler;
  const tree = ts.createSourceFile("component.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const imports = new Map();
  for (const statement of tree.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      !/(?:^|\/)css-motion$/.test(statement.moduleSpecifier.text) ||
      !statement.moduleSpecifier.text.startsWith(".")
    )
      continue;
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings))
      for (const item of bindings.elements) {
        const kind = item.propertyName?.text ?? item.name.text;
        if (["useStateColor", "useContinuousMotion"].includes(kind) && !item.isTypeOnly)
          imports.set(item.name.text, kind);
      }
  }
  const owners = new Map();
  const colors = new Set([
    "background-color",
    "color",
    "border-top-color",
    "border-right-color",
    "border-bottom-color",
    "border-left-color",
    "fill",
    "stroke",
    "text-decoration-color",
    "box-shadow",
    "text-shadow",
  ]);
  const walk = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      ts.isIdentifier(node.initializer.expression) &&
      imports.has(node.initializer.expression.text)
    ) {
      const kind = imports.get(node.initializer.expression.text);
      const selected = node.initializer.arguments[2];
      const valid =
        kind === "useStateColor"
          ? selected &&
            ts.isArrayLiteralExpression(selected) &&
            selected.elements.length &&
            selected.elements.every((value) => ts.isStringLiteral(value) && colors.has(value.text)) &&
            new Set(selected.elements.map((value) => value.text)).size === selected.elements.length
          : selected && ts.isStringLiteral(selected) && ["spin", "pulse"].includes(selected.text);
      const external = node.initializer.arguments[0];
      const parent =
        external &&
        ts.isPropertyAccessExpression(external) &&
        external.name.text === "ref" &&
        ts.isIdentifier(external.expression)
          ? external.expression.text
          : null;
      if (valid) owners.set(node.name.text, { kind, parent });
    }
    ts.forEachChild(node, walk);
  };
  walk(tree);
  let used = false;
  const jsx = (node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node))
      for (const owner of owners.keys()) {
        const attrs = node.attributes.properties;
        const spread = attrs.findIndex(
          (attr) => ts.isJsxSpreadAttribute(attr) && ts.isIdentifier(attr.expression) && attr.expression.text === owner,
        );
        if (spread < 0) continue;
        const override = attrs
          .slice(spread + 1)
          .some(
            (attr) =>
              ts.isJsxSpreadAttribute(attr) ||
              (ts.isJsxAttribute(attr) &&
                attr.name.getText(tree) === "ref" &&
                attr.initializer?.getText(tree) !== `{${owner}.ref}`),
          );
        if (override) continue;
        const visited = new Set();
        let current = owner;
        while (current && owners.has(current) && !visited.has(current)) {
          visited.add(current);
          const entry = owners.get(current);
          if (entry.kind === helper) used = true;
          current = entry.parent;
        }
      }
    ts.forEachChild(node, jsx);
  };
  jsx(tree);
  return used;
}
