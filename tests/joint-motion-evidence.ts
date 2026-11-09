// Test-only provenance. A record is built from one committed execution, one
// actual ref host and one connected controller, never independent tag sets.
import { expect } from "vitest";
import { type Execution, executionHost } from "./component-execution";
import { cssPolicySamples, presentationSamples } from "./motion-observer";

type Mode = "full" | "reduced" | "none";
export type JointMotionRecord = {
  owner: { item: string; exports: string[]; instance: number };
  host: { item: string; exports: string[]; instance: number; physical: number; site: string; slot: string };
  controller: number;
  form: string;
  properties: string[];
  mode: Mode;
  connection: "local" | "registered-scope";
  evidence: "executed-policy" | "registered-target";
  activity?: "running" | "static";
};
export type JointMotionRequirement = {
  owner: string;
  anchor: string;
  slot: string;
  form: string;
  properties: string[];
  connection?: JointMotionRecord["connection"];
  evidence?: JointMotionRecord["evidence"];
  activity?: JointMotionRecord["activity"];
};

const surface = new Set([
  "background-color",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "box-shadow",
]);
const foreground = new Set(["color", "fill", "stroke", "text-decoration-color", "text-shadow"]);
const ids = new WeakMap<object, number>();
let serial = 0;
const identify = (object: object) => {
  if (!ids.has(object)) ids.set(object, ++serial);
  return ids.get(object) as number;
};
const anchor = (execution: Execution) => execution.exports.map((part) => `${execution.item}#${part}`);

function record(
  origin: Execution | undefined,
  owner: Execution | undefined,
  node: HTMLElement | SVGElement,
  controller: object,
  mode: string,
  form: string,
  properties: readonly string[],
  connection: JointMotionRecord["connection"],
): JointMotionRecord {
  const site = executionHost(origin, node);
  expect(site, `${form}: actual host must belong to the invoking export instance`).toBeTruthy();
  expect(owner?.committed, `${form}: controller owner must be a committed export instance`).toBe(true);
  expect(node.dataset.motion, `${form}: host effective mode`).toBe(mode);
  if (!origin || !owner || !site) throw new Error("missing joint execution provenance");
  return {
    owner: { item: owner.item, exports: anchor(owner), instance: identify(owner) },
    host: {
      item: origin.item,
      exports: anchor(origin),
      instance: identify(origin),
      physical: identify(node),
      site,
      slot: node.dataset.slot ?? "",
    },
    controller: identify(controller),
    mode: mode as Mode,
    form,
    properties: [...properties].sort(),
    connection,
    evidence: form === "reveal/viewport" ? "registered-target" : "executed-policy",
  };
}

/** Only these observed policies are supported here. This does not infer target
 * applicability/N/A, other presentation properties, live cancellation or v2. */
export function expectJointMotionEvidence(mode: Mode, root: ParentNode, requirements: JointMotionRequirement[]) {
  const records: JointMotionRecord[] = [];
  const contains = (node: Element) => node.isConnected && (root === node || root.contains(node));
  const properties = new Map<Element, Set<string>>();
  const own = (node: Element, keys: readonly string[]) => {
    const set = properties.get(node) ?? new Set<string>();
    for (const property of keys) {
      expect(set.has(property), `joint duplicate ${property} writer on one physical host`).toBe(false);
      set.add(property);
    }
    properties.set(node, set);
  };
  for (const sample of cssPolicySamples.values()) {
    const node = sample.ref.current;
    if (!node || !contains(node)) continue;
    const controller = sample.controller();
    expect(controller?.node, "joint policy actual connection").toBe(node);
    expect(controller?.allowed, "joint policy must execute; yielded/caller CSS is not adoption").toBe(true);
    expect(sample.mode, "joint policy current mode").toBe(mode);
    if (!controller) throw new Error("missing policy controller");
    const style = getComputedStyle(node);
    let form: string;
    if (sample.kind === "color") {
      expect(sample.properties.length).toBeGreaterThan(0);
      expect(
        sample.properties.every((property) => surface.has(property) || foreground.has(property)),
        "only actual colour properties can certify state.color",
      ).toBe(true);
      expect(style.transitionProperty.split(/,\s*/), "joint explicit colour properties").toEqual(sample.properties);
      expect(style.transitionDelay, "joint colour delay").toBe("0s");
      const immediate =
        node === node.ownerDocument.activeElement ||
        node.contains(node.ownerDocument.activeElement) ||
        node.matches('[aria-invalid="true"], [data-invalid]:not([data-invalid="false"])');
      expect(
        style.transitionDuration
          .split(/,\s*/)
          .every((value) => parseFloat(value) === (mode === "none" || immediate ? 0 : sample.seconds)),
        "joint colour clock",
      ).toBe(true);
      const a = sample.properties.some((property) => surface.has(property));
      const b = sample.properties.some((property) => foreground.has(property));
      form = `state.color/${a && b ? "surface-foreground" : a ? "surface" : "foreground"}`;
      own(node, sample.properties);
    } else {
      expect(sample.properties).toHaveLength(1);
      expect(["spin", "pulse"]).toContain(sample.properties[0]);
      if (mode !== "full") {
        expect(node.style.animation, "joint downgraded loop must stop").toBe("none");
        expect((node.getAnimations?.() ?? []).filter((animation) => "animationName" in animation)).toHaveLength(0);
      } else expect(["none", `var(--animate-${sample.properties[0]})`]).toContain(node.style.animation);
      // The shared loop's actual property, rather than its token/animation name.
      own(node, [sample.properties[0] === "spin" ? "transform" : "opacity"]);
      form = "data.transition/continuous";
    }
    const entry = record(
      sample.origin,
      sample.origin,
      node,
      controller,
      mode,
      form,
      sample.kind === "color" ? sample.properties : [sample.properties[0] === "spin" ? "transform" : "opacity"],
      "local",
    );
    if (sample.kind === "loop") entry.activity = node.style.animation === "none" ? "static" : "running";
    records.push(entry);
  }
  for (const [controller, sample] of presentationSamples) {
    if (sample.form !== "reveal/viewport" || !contains(sample.node)) continue;
    expect(sample.mode, "joint registered target current mode").toBe(mode);
    const grouped = sample.group === true;
    if (!grouped) expect(sample.scopeOrigin, "local Reveal scope belongs to its host instance").toBe(sample.origin);
    const owner = grouped ? sample.scopeOrigin : sample.origin;
    if (grouped) expect(owner, "group scope owner differs from its registered target").not.toBe(sample.origin);
    // This is the real scope.register result and target host, not a mounted
    // Group elsewhere, a slot label or a controller's separate group boolean.
    own(sample.node, ["opacity", "transform"]);
    records.push(
      record(
        sample.origin,
        owner,
        sample.node,
        controller,
        mode,
        sample.form,
        ["opacity", "transform"],
        grouped ? "registered-scope" : "local",
      ),
    );
  }
  for (const requirement of requirements) {
    const matches = records.filter(
      (entry) =>
        entry.owner.exports.includes(requirement.owner) &&
        entry.host.exports.includes(requirement.anchor) &&
        entry.host.slot === requirement.slot &&
        entry.form === requirement.form &&
        entry.mode === mode &&
        (!requirement.connection || entry.connection === requirement.connection) &&
        (!requirement.evidence || entry.evidence === requirement.evidence) &&
        (!requirement.activity || entry.activity === requirement.activity) &&
        JSON.stringify(entry.properties) === JSON.stringify([...requirement.properties].sort()),
    );
    expect(matches.length, `joint evidence required: ${JSON.stringify(requirement)} in ${mode}`).toBeGreaterThan(0);
  }
  return records;
}
