/** Installed ownership is deliberately smaller than the six-capability target.
 * No target action, tier or available helper supplies installed evidence.
 */
import { motionForms } from "./motion-manifest.mjs";

export const MOTION_RELATIONSHIPS = ["default", "inherited", "composed", "not-applicable"];
export const meaningfulMotionReason = (value) =>
  typeof value === "string" && value.trim().length >= 20 && !/\b(?:TODO|TBD|FIXME)\b/i.test(value);
const object = (value) => value && typeof value === "object" && !Array.isArray(value);

/** Strict additive schema; old recipe strings/objects retain their original meaning. */
export function motionCoverageProblems(item) {
  const problems = [];
  const coverage = item.meta?.motionCoverage;
  if (!object(coverage) || coverage.schema !== 1 || !object(coverage.effects))
    return ["motionCoverage requires schema: 1 and an explicit effects map (empty for no declared effects)"];
  if (Object.keys(coverage).some((key) => !["schema", "effects"].includes(key)))
    problems.push("unknown motionCoverage field");
  const declared = new Set(motionForms(item.meta?.motion));
  for (const form of declared)
    if (!Object.hasOwn(coverage.effects, form)) problems.push(`${form}: missing installed ownership`);
  for (const [form, effects] of Object.entries(coverage.effects)) {
    if (!declared.has(form)) problems.push(`${form}: ownership without a declared recipe/form`);
    if (!Array.isArray(effects) || !effects.length) {
      problems.push(`${form}: nonempty integration ownership list required`);
      continue;
    }
    const owners = new Set();
    for (const effect of effects) {
      if (!object(effect)) {
        problems.push(`${form}: ownership must be an object`);
        continue;
      }
      if (Object.keys(effect).some((key) => !["relationship", "owner", "reason"].includes(key)))
        problems.push(`${form}: unknown ownership field`);
      if (!MOTION_RELATIONSHIPS.slice(0, 3).includes(effect.relationship))
        problems.push(
          `${form}: installed effect requires default, inherited or composed (not-applicable cannot declare motion)`,
        );
      if (typeof effect.owner !== "string" || !/^[a-z][\w-]*$/.test(effect.owner))
        problems.push(`${form}: explicit integration owner id required`);
      if (!meaningfulMotionReason(effect.reason))
        problems.push(`${form}: substantive ownership/boundary reason required`);
      if (effect.relationship === "default" && effect.owner !== item.name)
        problems.push(`${form}: default requires the local integration owner`);
      if (effect.relationship === "inherited" && effect.owner === item.name)
        problems.push(`${form}: inherited requires another actual integration owner`);
      if (effect.owner !== item.name && !item.registryDependencies?.includes(`@cadence/${effect.owner}`))
        problems.push(`${form}: foreign owner must be an explicit component dependency`);
      if (owners.has(effect.owner)) problems.push(`${form}: duplicate/conflicting integration owner ${effect.owner}`);
      owners.add(effect.owner);
    }
  }
  return problems;
}

/** The nearest component adapter before a shared executor owns integration.
 * This uses S15A's selected, live installed value-import path, never a dependency list.
 */
export function implementationOwner(reference) {
  return [...(reference.via ?? []), reference.file]
    .reverse()
    .map((file) => file?.match(/^registry\/cadence\/([^/]+)\/index\.tsx(?:#|$)/)?.[1])
    .find(Boolean);
}

export function checkMotionCoverage(registry, implementations) {
  const problems = [];
  for (const item of registry.items.filter((item) => ["registry:ui", "registry:block"].includes(item.type))) {
    const local = motionCoverageProblems(item);
    if (!local.length && implementations) {
      for (const [form, effects] of Object.entries(item.meta.motionCoverage.effects)) {
        const reached = new Set(
          (implementations.references[item.name] ?? [])
            .filter((ref) => `${ref.recipe}/${ref.form}` === form)
            .map(implementationOwner),
        );
        for (const effect of effects)
          if (!reached.has(effect.owner))
            local.push(`${form}: owner ${effect.owner} is not the reached installed integration`);
        for (const owner of reached)
          if (!effects.some((effect) => effect.owner === owner))
            local.push(`${form}: reached integration ${owner} missing ownership`);
      }
    }
    problems.push(...local.map((problem) => `${item.name}: ${problem}`));
  }
  return problems;
}

/** Public frontmatter mirrors installed facts only; targets never fill missing fields. */
export function motionMetadataProblems(item, frontmatter, surface = "docs") {
  const problems = [];
  const canonical = (value) => {
    if (Array.isArray(value)) return value.map(canonical);
    if (object(value))
      return Object.fromEntries(
        Object.keys(value)
          .sort()
          .map((key) => [key, canonical(value[key])]),
      );
    return value;
  };
  for (const field of ["motionCoverage", "motionProfile"])
    if (JSON.stringify(canonical(item.meta?.[field])) !== JSON.stringify(canonical(frontmatter?.[field])))
      problems.push(`${item.name}: ${surface} ${field} differs from installed metadata`);
  return problems;
}
