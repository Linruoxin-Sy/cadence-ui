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
 * MDX uses the same shapes. A bare name means one-shot in both places; other
 * forms are explicit. Target preset names never enter this declaration.
 */

import { createRequire } from "node:module";
import { motionSource, transitionCalls, transitionUsedByWriter } from "./motion-source.mjs";

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
  "changed-runs",
  "reels",
  "viewport",
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

/** Recipe names only, for catalogue labels and the guide's recipe union. */
export function motionRecipes(entries = []) {
  return normaliseMotion(entries).map((entry) => entry.recipe);
}

export function motionForms(entries = []) {
  return normaliseMotion(entries).map(({ recipe, form }) => `${recipe}/${form}`);
}

/** Actual CSS-bearing component exports, retained after the import-path scan. */
export function cssImplementationExports(source, recipe) {
  compiler ??= require("typescript");
  const ts = compiler;
  const tree = ts.createSourceFile("component.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  return tree.statements
    .filter(
      (node) =>
        ts.isFunctionDeclaration(node) &&
        node.body &&
        node.name &&
        /^[A-Z]/.test(node.name.text) &&
        /data-(?:\[(?:starting|ending)-style\]|(?:starting|ending)-style)/.test(node.getText(tree)) &&
        node.getText(tree).includes("data-motion") &&
        /transition-/.test(node.getText(tree)) &&
        (recipe !== "geometry.resize" || /transition-\[[^\]]*(?:height|width)/.test(node.getText(tree))),
    )
    .map((node) => node.name.text);
}

/**
 * Which form (if any) the source implements for a declared recipe.
 * Returns `null` when the declaration has no implementation behind it.
 */
export function implementedForm(source, recipe, form = "one-shot") {
  const scanned = motionSource(source);
  source = scanned.source;
  const imports = (name, module) =>
    scanned.imports.some((entry) => entry.name === name && entry.path.endsWith(`/${module}`));
  if (form === "one-shot" && parameterWriterForms(source).some((target) => target.startsWith(`${recipe}/`)))
    return form;
  if (recipe === "reveal" && form === "viewport")
    return source.includes("function createViewportReveal(") &&
      source.includes("observeReveal(node, options, deliver") &&
      source.includes('transition("reveal")') &&
      source.includes("target.handles = handles")
      ? "viewport"
      : null;
  if (recipe === "number.roll")
    return form === "reels" && stringAdapterImplementation(source, "number") ? "reels" : null;
  if (recipe === "text.change") return form === "changed-runs" && textImplementation(source) ? "changed-runs" : null;
  // Structural adoption only; actual completion/cancellation is browser evidence.
  if (recipe === "data.transition" && form === "one-shot" && imports("prepareSidebarLabels", "sidebar-labels"))
    return source.includes("prepareSidebarLabels(labels, transaction, revision)") &&
      source.includes("labelGate.start()") &&
      source.includes("labelGate?.complete()") &&
      source.includes("projection.commit(")
      ? "one-shot"
      : null;
  if ((recipe === "layout.move" && form === "size-linked") || (recipe === "geometry.resize" && form === "measured"))
    return (recipe === "geometry.resize" &&
      imports("createMeasuredGeometry", "measured-geometry") &&
      source.includes("createMeasuredGeometry(") &&
      source.includes(".register(") &&
      source.includes(".commit(") &&
      source.includes("geometry.resize/measured")) ||
      (imports("createSizeLinkedGeometry", "size-linked-geometry") &&
        source.includes("createSizeLinkedGeometry(") &&
        source.includes("projection.prepare(") &&
        source.includes("projection.commit(") &&
        source.includes("geometry.resize/measured") &&
        source.includes("layout.move/size-linked"))
      ? form
      : null;
  if (recipe === "layout.shared" && form === "selection")
    return imports("createSelectionProjection", "selection-projection") &&
      source.includes("createSelectionProjection(") &&
      source.includes("projection.commit(") &&
      source.includes("layout.shared/selection")
      ? form
      : null;
  if (recipe === "data.transition" && form === "directional-content")
    return imports("createContentTransition", "content-transition") &&
      source.includes("paint.commit(") &&
      source.includes("TabsPanelSurface")
      ? form
      : null;
  if (recipe === "data.transition" && form === "month-grid")
    return imports("createContentTransition", "content-transition") &&
      source.includes("createContentTransition(") &&
      source.includes("paint.commit(") &&
      source.includes("calendar-month-grid")
      ? form
      : null;
  if (recipe === "state.color")
    return form === "css-transition" && cssPolicyImplementation(source, "useStateColor") ? "css-transition" : null;
  const called = transitionCalls(source).includes(recipe);

  if (form === "continuous") {
    if (recipe === "data.transition" && cssPolicyImplementation(source, "useContinuousMotion")) return "continuous";
    const loop = /\banimate-(?!none\b)[a-z][a-z-]*\b/.test(source);
    const gated = /\banimate-none\b/.test(source);
    return recipe === "data.transition" && loop && gated ? "continuous" : null;
  }

  if (called && form === "one-shot" && transitionUsedByWriter(source, recipe)) return "one-shot";

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

  if (form === "css-transition" && CSS_POPUP_RECIPES.has(recipe)) {
    const hasPopupState = /data-(?:\[(?:starting|ending)-style\]|(?:starting|ending)-style)/.test(source);
    const hasTransition = /\b(?:transition-|duration-\()/.test(source);
    if (hasPopupState && hasTransition && source.includes("data-motion={cm.mode}")) return "css-transition";
  }

  return null;
}

/** Every `cm.transition("<recipe>")` call in a source file. */
export function calledRecipes(source) {
  source = motionSource(source).source;
  return transitionCalls(source).concat(
    parameterWriterForms(source).map((form) => form.split("/")[0]),
    cssPolicyImplementation(source, "useStateColor") ? ["state.color"] : [],
    cssPolicyImplementation(source, "useContinuousMotion") ? ["data.transition"] : [],
    textImplementation(source) ? ["text.change"] : [],
    stringAdapterImplementation(source, "number") ? ["number.roll"] : [],
  );
}

/** Parameter-backed shared controls retain their exact property form. The
 * binding must reach a rendered shared controller's real transition prop. */
export function parameterWriterForms(source) {
  return [...new Set(parameterWriterBindings(source).map((binding) => binding.form))];
}

export function parameterWriterBindings(source) {
  // Most installed sources use other executors. Avoid re-parsing the entire
  // legacy installation graph for a recogniser whose required imports are absent.
  if (!source.includes("bindMotionParameters") || !source.includes("control-animation")) return [];
  const selected = motionSource(source);
  const bind = selected.imports
    .filter((entry) => entry.name === "bindMotionParameters" && entry.path.endsWith("/motion"))
    .map((entry) => entry.local);
  const controls = selected.imports
    .filter(
      (entry) =>
        ["ControlSpan", "ControlDiv", "NativeControlDiv"].includes(entry.name) &&
        entry.path.endsWith("/control-animation"),
    )
    .map((entry) => entry.local);
  if (!bind.length || !controls.length) return [];
  compiler ??= require("typescript");
  const ts = compiler;
  const tree = ts.createSourceFile("component.tsx", selected.source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX),
    bindings = [];
  const visit = (node, inherited) => {
    const policies = ts.isFunctionLike(node) || ts.isBlock(node) ? new Map(inherited) : inherited;
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      ts.isPropertyAccessExpression(node.initializer.expression) &&
      node.initializer.expression.name.text === "parameters"
    ) {
      const binding = node.initializer.arguments[0];
      if (
        binding &&
        ts.isCallExpression(binding) &&
        ts.isIdentifier(binding.expression) &&
        bind.includes(binding.expression.text) &&
        binding.arguments[1] &&
        ts.isStringLiteral(binding.arguments[1])
      )
        policies.set(node.name.text, binding.arguments[1].text);
    }
    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      controls.includes(node.tagName.getText(tree))
    ) {
      const transition = node.attributes.properties.find(
        (attr) => ts.isJsxAttribute(attr) && attr.name.getText(tree) === "transition",
      );
      const expression =
        transition?.initializer && ts.isJsxExpression(transition.initializer)
          ? transition.initializer.expression
          : undefined;
      const forms = [];
      if (
        expression &&
        ts.isPropertyAccessExpression(expression) &&
        ts.isIdentifier(expression.expression) &&
        policies.has(expression.expression.text)
      )
        forms.push(policies.get(expression.expression.text));
      if (expression && ts.isObjectLiteralExpression(expression)) {
        const selected = new Set();
        const collect = (child) => {
          if (
            ts.isPropertyAccessExpression(child) &&
            ts.isIdentifier(child.expression) &&
            policies.has(child.expression.text)
          )
            selected.add(policies.get(child.expression.text));
          ts.forEachChild(child, collect);
        };
        collect(expression);
        if (selected.size === 1) forms.push([...selected][0]);
      }
      const slot = node.attributes.properties.find(
        (attr) => ts.isJsxAttribute(attr) && attr.name.getText(tree) === "data-slot",
      );
      const target = node.attributes.properties.find(
        (attr) => ts.isJsxAttribute(attr) && attr.name.getText(tree) === "target",
      );
      const value =
        target?.initializer && ts.isJsxExpression(target.initializer) ? target.initializer.expression : undefined;
      const keys =
        value &&
        ts.isObjectLiteralExpression(value) &&
        value.properties.every(
          (property) =>
            ts.isPropertyAssignment(property) && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)),
        )
          ? value.properties.map((property) => property.name.text)
          : null;
      const properties =
        keys &&
        [
          ...new Set(
            keys.map((key) =>
              /^(?:transform|[xyz]|translate[XYZ]|rotate[XYZ]?|scale[XY]?|skew[XY]?)$/.test(key)
                ? "transform"
                : key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`),
            ),
          ),
        ].sort();
      for (const form of forms)
        bindings.push({
          form,
          properties,
          slot: slot?.initializer && ts.isStringLiteral(slot.initializer) ? slot.initializer.text : null,
          offset: node.getStart(tree),
        });
    }
    ts.forEachChild(node, (child) => visit(child, policies));
  };
  visit(tree, new Map());
  return bindings;
}

/** A connected string adapter, not comments, an unused import or an unmounted call. */
function textImplementation(source) {
  return stringAdapterImplementation(source, "text");
}

function stringAdapterImplementation(source, kind) {
  if (!source.includes(`use-${kind}-presentation`)) return false;
  compiler ??= require("typescript");
  const ts = compiler;
  const tree = ts.createSourceFile("component.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const adapters = new Set();
  for (const statement of tree.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      !new RegExp(`^\\.\\.?/.*use-${kind}-presentation$`).test(statement.moduleSpecifier.text) ||
      statement.importClause?.isTypeOnly
    )
      continue;
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings))
      for (const item of bindings.elements)
        if (
          !item.isTypeOnly &&
          (item.propertyName?.text ?? item.name.text) ===
            (kind === "text" ? "useTextPresentation" : "useNumberPresentation")
        )
          adapters.add(item.name.text);
  }
  let found = false;
  const visit = (node) => {
    if (ts.isFunctionDeclaration(node) && node.body) {
      const calls = new Map();
      const hosts = new Map();
      const collect = (child) => {
        if (
          ts.isVariableDeclaration(child) &&
          ts.isObjectBindingPattern(child.name) &&
          child.initializer &&
          ts.isCallExpression(child.initializer) &&
          /useMotionHostRef/.test(child.initializer.expression.getText(tree))
        ) {
          const names = new Map(
            child.name.elements.map((binding) => [
              (binding.propertyName ?? binding.name).getText(tree),
              binding.name.getText(tree),
            ]),
          );
          if (names.has("node") && names.has("ref")) hosts.set(names.get("node"), names.get("ref"));
        }
        if (
          ts.isVariableDeclaration(child) &&
          ts.isIdentifier(child.name) &&
          child.initializer &&
          ts.isCallExpression(child.initializer) &&
          ts.isIdentifier(child.initializer.expression) &&
          adapters.has(child.initializer.expression.text) &&
          child.initializer.arguments.length >= 4
        )
          calls.set(child.name.text, {
            host: child.initializer.arguments[0].getText(tree),
            mode: child.initializer.arguments[2].getText(tree),
          });
        ts.forEachChild(child, collect);
      };
      collect(node.body);
      const mounted = (child) => {
        if (
          ts.isJsxElement(child) &&
          child.children.some(
            (item) =>
              ts.isJsxExpression(item) &&
              item.expression &&
              ts.isIdentifier(item.expression) &&
              calls.has(item.expression.text) &&
              (() => {
                const call = calls.get(item.expression.text);
                const attrs = child.openingElement.attributes.properties;
                const attr = (name) =>
                  attrs
                    .find((entry) => ts.isJsxAttribute(entry) && entry.name.getText(tree) === name)
                    ?.initializer?.getText(tree);
                return (
                  attr("ref") === `{${hosts.get(call.host) ?? call.host}}` &&
                  attr("data-motion") === `{${call.mode}.mode}` &&
                  Boolean(attr("data-slot"))
                );
              })(),
          )
        )
          found = true;
        ts.forEachChild(child, mounted);
      };
      mounted(node.body);
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return found;
}

export function cssPolicyCapabilities(source) {
  source = motionSource(source).source;
  return [
    ...(cssPolicyImplementation(source, "useStateColor") ? ["color"] : []),
    ...(cssPolicyImplementation(source, "useContinuousMotion") ? ["loop"] : []),
  ];
}

/** Structural local adoption only; successful runtime evidence remains mandatory. */
function cssPolicyImplementation(source, helper) {
  return cssPolicyBindings(source).some((binding) => binding.kind === helper);
}

/** Connected literal policy inputs, not a union of unrelated hooks/properties. */
export function cssPolicyBindings(source) {
  if (!source.includes("css-motion")) return [];
  source = motionSource(source).source;
  compiler ??= require("typescript");
  const ts = compiler;
  const tree = ts.createSourceFile("component.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const imports = new Map();
  for (const statement of tree.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      !/(?:^|\/)css-motion$/.test(statement.moduleSpecifier.text) ||
      statement.importClause?.isTypeOnly ||
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
      let scope = node.parent;
      while (scope && !ts.isFunctionDeclaration(scope) && !ts.isArrowFunction(scope) && !ts.isFunctionExpression(scope))
        scope = scope.parent;
      if (valid)
        owners.set(node.name.text, {
          kind,
          parent,
          scope,
          properties: kind === "useStateColor" ? selected.elements.map((value) => value.text) : [],
          loop: kind === "useContinuousMotion" ? selected.text : undefined,
        });
    }
    ts.forEachChild(node, walk);
  };
  walk(tree);
  const used = [];
  const jsx = (node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node))
      for (const owner of owners.keys()) {
        let ancestor = node.parent;
        while (ancestor && ancestor !== owners.get(owner).scope) ancestor = ancestor.parent;
        if (!ancestor) continue;
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
          const slot = attrs.find((attr) => ts.isJsxAttribute(attr) && attr.name.getText(tree) === "data-slot");
          used.push({
            kind: entry.kind,
            properties: entry.properties,
            loop: entry.loop,
            slot: slot?.initializer && ts.isStringLiteral(slot.initializer) ? slot.initializer.text : null,
          });
          current = entry.parent;
        }
      }
    ts.forEachChild(node, jsx);
  };
  jsx(tree);
  return used;
}
