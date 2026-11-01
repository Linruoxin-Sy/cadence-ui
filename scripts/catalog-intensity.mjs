/** Authored scope, not a runtime multiplier. See animation-system §2.1. */
export function catalogIntensity(item) {
  const recipes = (item.meta?.motion ?? []).map((entry) => (typeof entry === "string" ? entry : entry.recipe));
  if (recipes.includes("handoff")) return "expressive";
  if (
    recipes.some((recipe) => /^(popup\.|exit\.|layout\.|geometry\.|gesture\.|scroll\.|text\.|number\.)/.test(recipe)) ||
    ["carousel", "chart"].includes(item.name)
  )
    return "medium";
  return "subtle";
}

export function checkCatalogIntensity(registry) {
  return registry.items
    .filter((item) => ["registry:ui", "registry:block"].includes(item.type))
    .flatMap((item) => {
      const expected = catalogIntensity(item);
      return item.meta?.intensity === expected
        ? []
        : [`${item.name}: authored intensity must be ${expected} (animation-system §2.1)`];
    });
}
