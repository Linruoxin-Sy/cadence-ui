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

/** Forms a recipe can take in a component. */
export const MOTION_FORMS = ["one-shot", "continuous", "css-transition"];

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
  const called = source.includes(`transition("${recipe}")`) || source.includes(`transition('${recipe}')`);

  if (form === "continuous") {
    const loop = /\banimate-(?!none\b)[a-z][a-z-]*\b/.test(source);
    const gated = /\banimate-none\b/.test(source);
    return loop && gated ? "continuous" : null;
  }

  if (called) return "one-shot";

  if (CSS_POPUP_RECIPES.has(recipe)) {
    const hasPopupState = /data-(?:starting|ending)-style/.test(source);
    const hasTransition = /\b(?:transition-|duration-\()/.test(source);
    if (hasPopupState && hasTransition) return "css-transition";
  }

  return null;
}

/** Every `cm.transition("<recipe>")` call in a source file. */
export function calledRecipes(source) {
  return [...source.matchAll(/transition\(\s*["']([a-z][a-z.]*)["']/g)].map((match) => match[1]);
}
