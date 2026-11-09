/** Authored perceptual extent; never a runtime multiplier or capability allowance. */
import { meaningfulMotionReason } from "./motion-coverage.mjs";
import { motionRecipes } from "./motion-manifest.mjs";

const SCOPES = ["static", "local", "surface", "collection"];
const TRAVEL = ["none", "compact", "extended"];
const COORDINATION = ["independent", "group", "identity"];

export function motionProfileProblems(item) {
  const profile = item.meta?.motionProfile;
  if (!profile || typeof profile !== "object" || Array.isArray(profile))
    return ["explicit authored motionProfile required"];
  const problems = [];
  if (Object.keys(profile).some((key) => !["scope", "travel", "coordination", "reason"].includes(key)))
    problems.push("unknown motionProfile field");
  if (
    !SCOPES.includes(profile.scope) ||
    !TRAVEL.includes(profile.travel) ||
    !COORDINATION.includes(profile.coordination)
  )
    problems.push("motionProfile requires known scope, travel and coordination (no inferred defaults)");
  if (!meaningfulMotionReason(profile.reason)) problems.push("motionProfile requires an authored behaviour reason");
  if (
    profile.scope === "static" &&
    (profile.travel !== "none" || profile.coordination !== "independent" || item.meta?.motion?.length)
  )
    problems.push("static motionProfile cannot claim travel, coordination or declared effects");
  if (!item.meta?.motion?.length && profile.scope !== "static")
    problems.push("animated motionProfile requires declared implemented effects");
  if (profile.coordination === "identity" && profile.scope === "local")
    problems.push("identity transfer requires a surface/collection boundary");
  if (motionRecipes(item.meta?.motion).includes("handoff") && profile.coordination !== "identity")
    problems.push("handoff's cross-surface ownership transfer requires identity coordination");
  return problems;
}

export function catalogIntensity(item) {
  if (motionProfileProblems(item).length) return null;
  const { scope, travel, coordination } = item.meta.motionProfile;
  if (coordination === "identity") return "expressive";
  if (["surface", "collection"].includes(scope) || travel === "extended" || coordination === "group") return "medium";
  return "subtle";
}

export function checkCatalogIntensity(registry) {
  return registry.items
    .filter((item) => ["registry:ui", "registry:block"].includes(item.type))
    .flatMap((item) => {
      const problems = motionProfileProblems(item).map((problem) => `${item.name}: ${problem}`);
      const expected = catalogIntensity(item);
      if (expected && item.meta?.intensity !== expected)
        problems.push(`${item.name}: authored intensity must be ${expected} (animation-system §2.1)`);
      return problems;
    });
}
