// Test-only provenance. A record is built from one committed execution, one
// actual ref host and one connected controller, never independent tag sets.
import { expect } from "vitest";
import { type Execution, executionHost, mountedComponents } from "./component-execution";
import {
  type ControllerSource,
  controllerOrigins,
  controllerPropertyWrites,
  controllerSources,
  controllerWrites,
  cssPolicySamples,
  nativeEffects,
  nativeNodeWrites,
  nativePropertyWrites,
  policyScopes,
  presentationSamples,
  scalarControllerWrites,
  scalarValues,
} from "./motion-observer";

type Mode = "full" | "reduced" | "none";
export type JointMotionRecord = {
  owner: { item: string; exports: string[]; instance: number; module: string; digest: string };
  host: {
    item: string;
    exports: string[];
    instance: number;
    physical: number;
    site: string;
    slot: string;
    module: string;
    digest: string;
  };
  controller: number;
  form: string;
  properties: string[];
  mode: Mode;
  connection: "local" | "registered-scope";
  evidence: "executed-policy" | "registered-target" | "executed-commit";
  activity?: "running" | "static";
  preset?: string;
  target?: unknown;
  commits?: number;
  state?: string;
  writes?: number;
  controlExecuted?: boolean;
  zeroClock?: boolean;
  propertyWrites?: Record<string, number>;
  scalars?: number;
  parameters?: unknown;
  policyMode?: string;
  transition?: unknown;
  source?: ControllerSource;
  ancestors?: { exports: string[]; module: string; digest: string; instance: number }[];
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
const observedScopes = new WeakMap<ParentNode, Map<string, WeakSet<object>>>();
let serial = 0;
const identify = (object: object) => {
  if (!ids.has(object)) ids.set(object, ++serial);
  return ids.get(object) as number;
};
const anchor = (execution: Execution) => execution.exports.map((part) => `${execution.item}#${part}`);
export function jointPhysicalHost(record: JointMotionRecord) {
  for (const origin of mountedComponents.keys())
    for (const node of (origin as Execution).hosts.keys())
      if (identify(node) === record.host.physical && executionHost(origin as Execution, node)) return node;
}

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
  const physical = origin.hosts.get(node);
  const ancestors = [];
  const seen = new Set<Execution>();
  let parent = origin.parent;
  while (parent?.committed && !seen.has(parent)) {
    seen.add(parent);
    ancestors.push({
      exports: anchor(parent),
      module: parent.module,
      digest: parent.digest,
      instance: identify(parent),
    });
    parent = parent.parent;
  }
  return {
    owner: {
      item: owner.item,
      exports: anchor(owner),
      instance: identify(owner),
      module: owner.module,
      digest: owner.digest,
    },
    host: {
      item: origin.item,
      exports: anchor(origin),
      instance: identify(origin),
      physical: identify(node),
      site,
      slot: node.dataset.slot ?? "",
      module: physical?.module ?? origin.module,
      digest: physical?.digest ?? origin.digest,
    },
    controller: identify(controller),
    source: controllerSources.get(controller),
    mode: mode as Mode,
    form,
    properties: [...properties].sort(),
    connection,
    evidence: form === "reveal/viewport" ? "registered-target" : "executed-policy",
    ancestors,
  };
}

/** Only these observed policies are supported here. This does not infer target
 * applicability/N/A, other presentation properties, live cancellation or v2. */
export function expectJointMotionEvidence(
  mode: Mode,
  root: ParentNode,
  requirements: JointMotionRequirement[],
  selection?: { anchor: string; slot: string }[],
) {
  const records: JointMotionRecord[] = [];
  const contains = (node: Element) => node.isConnected && (root === node || root.contains(node));
  const selected = (origin: Execution | undefined, node: Element) =>
    !selection ||
    selection.some(
      (part) =>
        part.slot === node.getAttribute("data-slot") &&
        origin?.exports.some((exported) => `${origin.item}#${exported}` === part.anchor),
    );
  const properties = new Map<Element, Set<string>>();
  const own = (node: Element, keys: readonly string[]) => {
    const set = properties.get(node) ?? new Set<string>();
    for (const property of keys) {
      expect(set.has(property), `joint duplicate ${property} writer on one physical host`).toBe(false);
      set.add(property);
    }
    properties.set(node, set);
  };
  const liveControllers = new Set(
    [...presentationSamples.entries()]
      .filter(([, sample]) => contains(sample.node) && selected(sample.origin, sample.node))
      .map(([key, sample]) => sample.controller ?? key),
  );
  const scopeKey = JSON.stringify(selection ?? null);
  let scopes = observedScopes.get(root);
  if (!scopes) {
    scopes = new Map();
    observedScopes.set(root, scopes);
  }
  let observed = scopes.get(scopeKey);
  if (!observed) {
    observed = new WeakSet();
    scopes.set(scopeKey, observed);
  }
  for (const controller of new Set([...nativeEffects.keys(), ...scalarValues.keys()])) {
    const effects = nativeEffects.get(controller) ?? [];
    const origin = controllerOrigins.get(controller);
    const connected = origin && [...origin.hosts.keys()].some((node) => contains(node) && selected(origin, node));
    if (connected) observed.add(controller);
    if (!connected && !observed.has(controller)) continue;
    if (!liveControllers.has(controller) || mode === "none")
      for (const effect of effects)
        expect(["idle", "finished"], "retired/none controller cannot retain a native writer").toContain(
          effect.playState,
        );
    const opacityOnlyReduced = [...presentationSamples.entries()].some(
      ([key, sample]) =>
        (sample.controller ?? key) === controller &&
        /^(?:text\.change\/|data\.transition\/(?:directional-content|month-grid))/.test(sample.form),
    );
    if (!liveControllers.has(controller) || mode === "none" || (mode === "reduced" && !opacityOnlyReduced))
      for (const value of scalarValues.get(controller) ?? [])
        expect(value.isAnimating(), "downgrade must cancel the actual scalar writer").toBe(false);
  }
  for (const sample of cssPolicySamples.values()) {
    const node = sample.ref.current;
    if (!node || !contains(node) || !selected(sample.origin, node)) continue;
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
      policyScopes.get(sample.controller) ?? controller,
      mode,
      form,
      sample.kind === "color" ? sample.properties : [sample.properties[0] === "spin" ? "transform" : "opacity"],
      "local",
    );
    entry.source = controllerSources.get(controller);
    if (sample.kind === "color") {
      const animations = node.getAnimations?.() ?? [];
      for (const animation of animations) {
        const effect = animation.effect as KeyframeEffect | null;
        const keys = (effect?.getKeyframes?.() ?? []).flatMap((frame) =>
          Object.keys(frame).map((key) => key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)),
        );
        if (
          !("transitionProperty" in animation) &&
          effect?.target === node &&
          keys.some((key) => sample.properties.includes(key))
        )
          expect(["idle", "finished"], "a caller/native animation cannot certify a shared colour writer").toContain(
            animation.playState,
          );
      }
      entry.target = sample.properties.map((property) => {
        const animation = animations.find(
          (animation) => "transitionProperty" in animation && animation.transitionProperty === property,
        );
        const frame = (animation?.effect as KeyframeEffect | null)?.getKeyframes?.().at(-1);
        const camel = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        return [property, frame?.[property] ?? frame?.[camel] ?? style.getPropertyValue(property)];
      });
    }
    if (sample.kind === "loop") entry.activity = node.style.animation === "none" ? "static" : "running";
    records.push(entry);
  }
  for (const [controller, sample] of presentationSamples) {
    if (!contains(sample.node) || !selected(sample.origin, sample.node)) continue;
    if (sample.form !== "reveal/viewport") {
      if (!sample.properties?.length) continue;
      const executed = sample.executed?.();
      if (sample.executed) expect(executed, "actual controller set/start execution required").toBeTruthy();
      if (sample.revision && "current" in sample.revision && typeof sample.revision.current === "function")
        expect(sample.revision.current(), "actual semantic revision must still be current").toBe(true);
      if (/^(?:text\.change|number\.roll)\//.test(sample.form))
        expect(sample.node.textContent, "controller must commit the exact current native value").toBe(sample.target);
      const clock = executed?.transition ?? sample.clock;
      const checkZero = (value: unknown) => {
        if (!value || typeof value !== "object") return;
        for (const [key, nested] of Object.entries(value)) {
          if (key === "duration" || key === "delay") expect(nested, `none ${key}`).toBe(0);
          if (nested && typeof nested === "object") checkZero(nested);
        }
      };
      if (mode === "none" && clock) {
        if ("duration" in (clock as object))
          expect((clock as { duration?: number }).duration, "none actual controller clock").toBe(0);
        checkZero(clock);
      }
      expect(sample.mode, "joint committed controller current mode").toBe(mode);
      if (mode !== "full" && sample.immediate !== undefined) expect(sample.immediate).toBe(true);
      if (mode !== "full") {
        for (const animation of sample.node.getAnimations?.({ subtree: true }) ?? []) {
          const keys = (animation.effect as KeyframeEffect | null)?.getKeyframes?.() ?? [];
          if (mode === "none" || keys.some((frame) => "transform" in frame || "width" in frame || "height" in frame))
            expect(["finished", "idle"]).toContain(animation.playState);
        }
      }
      own(sample.node, sample.properties);
      const realController = sample.controller ?? controller;
      const painted =
        sample.form.startsWith("text.change/") || sample.form.startsWith("number.roll/")
          ? controllerPropertyWrites.get(realController)
          : nativePropertyWrites.get(sample.node);
      records.push({
        ...record(
          sample.origin,
          sample.origin,
          sample.node,
          realController,
          mode,
          sample.form,
          sample.properties,
          "local",
        ),
        evidence: "executed-commit",
        preset: sample.preset,
        target: executed?.target ?? sample.target,
        commits: executed?.calls ?? sample.commits,
        writes: controllerWrites.get(realController) ?? 0,
        propertyWrites: Object.fromEntries(painted ?? []),
        scalars: scalarControllerWrites.get(realController) ?? 0,
        zeroClock: sample.zeroClock,
        parameters: sample.parameters,
        policyMode: sample.policyMode,
        transition: executed?.transition,
        controlExecuted: !!sample.executed && !!executed,
      });
      continue;
    }
    expect(sample.mode, "joint registered target current mode").toBe(mode);
    const grouped = sample.group === true;
    if (!grouped) expect(sample.scopeOrigin, "local Reveal scope belongs to its host instance").toBe(sample.origin);
    const owner = grouped ? sample.scopeOrigin : sample.origin;
    if (grouped) expect(owner, "group scope owner differs from its registered target").not.toBe(sample.origin);
    // This is the real scope.register result and target host, not a mounted
    // Group elsewhere, a slot label or a controller's separate group boolean.
    own(sample.node, ["opacity", "transform"]);
    records.push({
      ...record(
        sample.origin,
        owner,
        sample.node,
        controller,
        mode,
        sample.form,
        ["opacity", "transform"],
        grouped ? "registered-scope" : "local",
      ),
      preset: sample.preset,
      commits: sample.commits,
      state: sample.state,
      writes: nativeNodeWrites.get(sample.node) ?? 0,
      propertyWrites: Object.fromEntries(nativePropertyWrites.get(sample.node) ?? []),
      zeroClock: sample.zeroClock,
    });
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
