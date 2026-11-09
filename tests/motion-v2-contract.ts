import { createHmac } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, onTestFinished, vi } from "vitest";
import { checkMotionTargets } from "../scripts/motion-targets.mjs";
import { digest } from "../scripts/motion-v2.mjs";
import { type Execution, executionHost, executionModules, mountedComponents } from "./component-execution";
import { expectJointMotionEvidence, type JointMotionRecord, jointPhysicalHost } from "./joint-motion-evidence";
import { expectMotionContract } from "./motion-contract";
import { presentationSamples } from "./motion-observer";

type Mode = "full" | "reduced" | "none";
const evidenceKey = "__CADENCE_TEST_EVIDENCE_KEY__";
type SignedEvidence = { test: string; kind: string; rows: (V2ActionRecord | V2BoundaryRecord)[]; signature: string };
export type V2ActionRecord = {
  item: string;
  binding: string;
  preset: string;
  form: string;
  mode: Mode;
  relationship: string;
  anchor: string;
  slot: string;
  site: string;
  properties: string[];
  sources: Record<string, string>;
  changed: boolean;
  policy: boolean;
  live: boolean;
  controller: number;
  host: number;
  instance: number;
  scope: number;
};
export type V2BoundaryRecord = {
  item: string;
  capability: string;
  part: string;
  anchor: string;
  relationship: string;
  digest: string;
  slots: string[];
  live: boolean;
  native: boolean;
};
declare module "vitest" {
  interface TaskMeta {
    cadenceV2?: V2ActionRecord[];
    cadenceV2Boundaries?: V2BoundaryRecord[];
    cadenceV2Signed?: SignedEvidence[];
  }
}

/** No successful hand-authored target record is accepted by this helper. Resolve
 * the authoritative contract and installed source anew, then observe a real action. */
async function planFor(root: string) {
  const cached = plans.get(root);
  if (cached?.inputs.every(([file, sha]) => digest(readFileSync(file)) === sha)) return cached.plan;
  const registry = JSON.parse(readFileSync(path.join(root, "registry.json"), "utf8"));
  const result = await checkMotionTargets(root, registry);
  expect(result.problems, "v2 source/contract plan").toEqual([]);
  if (!result.v2) throw new Error("missing v2 plan");
  const files = new Set([
    "registry.json",
    ...registry.items.flatMap((item: { files?: { path: string }[] }) => (item.files ?? []).map((file) => file.path)),
    "docs/motion/README.md",
    "docs/motion/presets.md",
    ...readdirSync(path.join(root, "docs/motion/components"))
      .filter((file) => file.endsWith(".md"))
      .map((file) => `docs/motion/components/${file}`),
    ...result.v2.actions.flatMap((action) => Object.keys(action.sources)),
  ]);
  plans.set(root, {
    plan: result.v2,
    inputs: [...files].map((file) => {
      const absolute = path.resolve(root, file);
      return [absolute, digest(readFileSync(absolute))];
    }),
  });
  return result.v2;
}
const plans = new Map<
  string,
  { plan: NonNullable<Awaited<ReturnType<typeof checkMotionTargets>>["v2"]>; inputs: [string, string][] }
>();
export async function prepareV2MotionPlan(root = process.cwd()) {
  await planFor(root);
}
function loadedSources(root: string, sources: Record<string, string>) {
  const result: Record<string, string> = {};
  for (const [file, expected] of Object.entries(sources)) {
    const absolute = path.resolve(root, file).replaceAll("\\", "/");
    expect(executionModules.get(absolute), `actual loaded module ${file}`).toBe(expected);
    expect(digest(readFileSync(absolute)), `current installed source ${file}`).toBe(expected);
    result[file] = expected;
  }
  return result;
}
const targetSignature = (record: JointMotionRecord) => JSON.stringify([record.target, record.state, record.activity]);
function paint(node: Element, properties: string[]) {
  const css = getComputedStyle(node);
  return JSON.stringify(properties.map((property) => css.getPropertyValue(property)));
}
function nativeState(node: Element) {
  const rect = node.getBoundingClientRect();
  return JSON.stringify([
    node.getAttribute("hidden"),
    node.getAttribute("aria-pressed"),
    node.getAttribute("aria-expanded"),
    node.getAttribute("aria-selected"),
    node.getAttribute("aria-valuenow"),
    node.getAttribute("data-state"),
    node.textContent,
    "value" in node ? (node as HTMLInputElement).value : null,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
  ]);
}
const spatialKey = /^(?:transform|[xyz]|translate[XYZ]|scale[XY]?|rotate[XYZ]?|skew[XY]?|width|height)$/;
const clockFields = [
  "duration",
  "delay",
  "type",
  "visualDuration",
  "stiffness",
  "damping",
  "mass",
  "bounce",
  "ease",
  "repeat",
  "repeatDelay",
  "repeatType",
];
function expectedControlClock(parameters: Record<string, unknown>, key: string) {
  return (parameters.transition ?? (key === "opacity" ? parameters.opacity : parameters.spatial)) as
    | Record<string, unknown>
    | undefined;
}
function matches(
  record: JointMotionRecord,
  action: {
    anchor: string;
    slot: string;
    targetForm: string;
    site: string;
    owner: string;
    hostOwner?: string;
    hostFile?: string;
  },
  root: string,
) {
  return (
    record.host.exports.includes(action.anchor) &&
    record.host.slot === action.slot &&
    record.host.site === action.site &&
    (record.form === action.targetForm || record.supportedForms?.includes(action.targetForm)) &&
    record.host.module ===
      path
        .resolve(root, action.hostFile ?? `registry/cadence/${action.hostOwner ?? action.owner}/index.tsx`)
        .replaceAll("\\", "/")
  );
}

/** Exercise a semantic update against the SAME live instance and physical host.
 * Registration alone, a no-op update, remount, wrong mode or a retired writer
 * cannot create action evidence. Browser dynamics remain an independent gate. */
export async function expectV2MotionAction(
  item: string,
  binding: string,
  mode: Mode,
  exercise: () => void | Promise<void>,
  options: { root?: string; container?: ParentNode } = {},
) {
  const root = options.root ?? process.cwd(),
    container = options.container ?? document;
  const plan = await planFor(root);
  const engine = await vi.importActual<typeof import("motion/react")>("motion/react");
  const actions = plan.actions.filter((action) => action.item === item && action.binding === binding);
  expect(actions.length, "declared v2 action").toBeGreaterThan(0);
  const selection = actions.map((action) => ({ anchor: action.anchor, slot: action.slot }));
  const before = expectJointMotionEvidence(mode, container, [], selection);
  const captures = actions.map((action) => {
    const candidates = before.filter((record) => matches(record, action, root));
    expect(candidates.length, "unique live physical action owner before change").toBe(1);
    const record = candidates[0];
    if (!record) throw new Error("missing physical record");
    const node = jointPhysicalHost(record);
    expect(node, "actual physical host").toBeTruthy();
    const visual = record.controlExecuted ? engine.visualElementStore.get(node as Element) : undefined;
    if (record.controlExecuted)
      expect(visual?.current, "actual Motion renderer must own this physical host").toBe(node);
    const values = Object.fromEntries(
      Object.keys((record.target ?? {}) as object).map((key) => [key, visual?.values.get(key)?.get()]),
    );
    return {
      action,
      record,
      node: node as Element,
      paint: paint(node as Element, action.properties),
      native: nativeState(node as Element),
      events: 0,
      values,
    };
  });
  const eventTypes = ["pointerdown", "pointerup", "keydown", "input", "change", "click"];
  const listeners = captures.map((capture) => {
    const listener = () => {
      capture.events++;
    };
    for (const type of eventTypes) capture.node.addEventListener(type, listener, { capture: true, passive: true });
    return listener;
  });
  try {
    await exercise();
  } finally {
    for (const [index, capture] of captures.entries())
      for (const type of eventTypes) capture.node.removeEventListener(type, listeners[index] as EventListener, true);
  }
  const after = expectJointMotionEvidence(mode, container, [], selection);
  const records: V2ActionRecord[] = [];
  for (const capture of captures) {
    const { action, record: old, node } = capture;
    if (!old) throw new Error("missing actual action origin");
    const candidates = after.filter(
      (record) =>
        matches(record, action, root) &&
        record.host.physical === old.host.physical &&
        record.host.instance === old.host.instance &&
        record.controller === old.controller &&
        record.owner.instance === old.owner.instance,
    );
    expect(candidates, "same export/host/controller lifetime after action").toHaveLength(1);
    const record = candidates[0];
    if (!record) throw new Error("retired action owner");
    expect(record.form, "the current action must execute its own phase, never borrow the opposite presence phase").toBe(
      action.targetForm,
    );
    expect(record.mode).toBe(mode);
    const exactSource = (module: string, sha: string, label: string) => {
      const entry = Object.entries(action.sources).find(
        ([file]) => path.resolve(root, file).replaceAll("\\", "/") === module,
      );
      expect(entry, `${label}: actual module must belong to the same installed action graph`).toBeTruthy();
      expect(sha, `${label}: actual creation/source bytes`).toBe(entry?.[1]);
    };
    exactSource(record.host.module, record.host.digest, "physical host");
    exactSource(record.owner.module, record.owner.digest, "committed export");
    expect(record.source, "actual controller creation module/source receipt").toBeTruthy();
    if (record.source) exactSource(record.source.module, record.source.digest, "actual controller");
    expect(record.properties).toEqual(action.properties);
    if (action.targetForm === "data.transition/continuous")
      expect(record.activity, "a full loop action needs an actually enabled owner; downgraded loops stay static").toBe(
        mode === "full" ? "running" : "static",
      );
    if (record.controlExecuted) {
      expect(record.policyMode, "actual parameter mode must match the owned host").toBe(mode);
      const visual = engine.visualElementStore.get(node);
      expect(visual?.current, "actual renderer host lifetime").toBe(node);
      const target = record.target as Record<string, unknown>,
        parameters = record.parameters as Record<string, unknown>;
      const transition = record.transition as import("motion/react").Transition;
      for (const key of Object.keys(target)) {
        const actual = engine.getValueTransition(transition, key) as Record<string, unknown>;
        const expected = expectedControlClock(parameters, key);
        expect(expected, `resolved clock for ${key}`).toBeTruthy();
        for (const field of clockFields)
          expect(
            actual?.[field] ?? (["delay", "repeat", "repeatDelay"].includes(field) ? 0 : undefined),
            `actual ${key}.${field}`,
          ).toEqual(expected?.[field] ?? (["delay", "repeat", "repeatDelay"].includes(field) ? 0 : undefined));
        const value = visual?.values.get(key);
        expect(value, `actual renderer value ${key}`).toBeTruthy();
        if (mode === "none" || (mode === "reduced" && spatialKey.test(key)) || record.zeroClock) {
          expect(value?.isAnimating(), `restricted ${key} writer must stop`).toBe(false);
          expect(value?.get(), `immediate semantic ${key} target`).toEqual(target[key]);
        }
      }
      if (action.targetForm === "feedback.press/scale") {
        expect(Object.keys(target)).toEqual(["scale"]);
        expect([1, parameters.scale], "authored press pose, including full zero versus none").toContain(target.scale);
      }
      if (action.targetForm === "state.morph/indicator") {
        for (const key of Object.keys(target))
          if (key.startsWith("rotate")) expect([0, parameters.rotation]).toContain(target[key]);
          else if (key.startsWith("scale")) expect([1, parameters.scale]).toContain(target[key]);
      }
      if (mode === "full" && !record.zeroClock)
        expect(
          record.commits ?? 0,
          "full controls must execute this update, not borrow a prior flight",
        ).toBeGreaterThan(old.commits ?? 0);
      if (mode === "full" && !record.zeroClock)
        for (const property of action.properties) {
          const keys = Object.keys(target).filter((key) =>
            property === "transform"
              ? spatialKey.test(key) && !["width", "height"].includes(key)
              : key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`) === property,
          );
          expect(
            keys.some(
              (key) => visual?.values.get(key)?.isAnimating() || capture.values[key] !== visual?.values.get(key)?.get(),
            ),
            `actual ${property} engine value must change or animate`,
          ).toBe(true);
        }
      const style = (visual?.getProps() as import("motion/react").HTMLMotionProps<"span"> | undefined)?.style;
      if (action.properties.includes("transform") && !("transform" in target))
        expect(style?.transform, "a caller transform cannot certify a library transform writer").toBeUndefined();
    }
    expect(node.isConnected).toBe(true);
    if (record.preset) expect(record.preset).toBe(action.preset);
    else expect(["state.color", "status.loop"]).toContain(action.preset);
    if (action.relationship === "composed") {
      expect(record.connection).toBe("registered-scope");
      expect(record.owner.instance).not.toBe(record.host.instance);
      expect(record.owner.item).toBe(item);
    } else {
      expect(record.connection).toBe("local");
      expect(record.owner.instance).toBe(record.host.instance);
      if (action.relationship === "inherited")
        expect(
          record.ancestors?.some(
            (ancestor) =>
              ancestor.exports.some((anchor) => anchor.startsWith(`${item}#`)) &&
              ancestor.module === path.resolve(root, `registry/cadence/${item}/index.tsx`).replaceAll("\\", "/"),
          ),
          "actual inherited instance path; another mounted dependency is insufficient",
        ).toBe(true);
    }
    const changed = action.targetForm.startsWith("state.color/")
      ? targetSignature(old) !== targetSignature(record)
      : targetSignature(old) !== targetSignature(record) ||
        (action.targetForm === "data.transition/continuous" && capture.paint !== paint(node, action.properties)) ||
        capture.native !== nativeState(node) ||
        (mode !== "full" && capture.events > 0 && (record.commits ?? 0) > (old.commits ?? 0));
    expect(changed, "execute a real target/paint change; connection or registration alone is insufficient").toBe(true);
    if (mode === "full" && record.evidence !== "executed-policy" && !record.controlExecuted && !record.zeroClock) {
      expect(
        record.writes ?? 0,
        "full action must execute an actual native/scalar writer; a commit or registration alone is insufficient",
      ).toBeGreaterThan(old.writes ?? 0);
      for (const property of action.properties)
        expect(
          record.propertyWrites?.[property] ?? 0,
          `actual ${property} writer must execute on this controller/host`,
        ).toBeGreaterThan(old.propertyWrites?.[property] ?? 0);
      if (
        !["text.change/changed-runs", "reveal/viewport", "data.transition/opacity", "exit.fade/opacity"].includes(
          action.targetForm,
        )
      )
        expect(
          record.scalars ?? 0,
          "actual scalar interpolation must start, beyond a native registration pose",
        ).toBeGreaterThan(old.scalars ?? 0);
    }
    if (record.evidence === "registered-target") {
      if (mode === "full" && targetSignature(old) !== targetSignature(record))
        expect(record.commits).toBeGreaterThan(old.commits ?? 0);
      if (mode !== "full") expect(record.state).toBe("visible");
    }
    // Existing helper executes the exact mode policy on the actual parts, then
    // this stricter row retains the source/action relationship without cross-test joins.
    expectMotionContract(mode, {
      root: container,
      ownerLocal: [node],
      behavior: () => expect(node.isConnected).toBe(true),
    });
    records.push({
      item,
      binding,
      preset: action.preset,
      form: action.targetForm,
      mode,
      relationship: action.relationship,
      anchor: action.anchor,
      slot: action.slot,
      site: action.site,
      properties: action.properties,
      sources: loadedSources(root, action.sources),
      changed,
      policy: true,
      live: node.isConnected,
      controller: record.controller,
      host: record.host.physical,
      instance: record.host.instance,
      scope: record.owner.instance,
    });
  }
  const verified = JSON.stringify(records);
  onTestFinished(({ task }) => {
    const rows: V2ActionRecord[] = JSON.parse(verified);
    task.meta.cadenceV2 ??= [];
    task.meta.cadenceV2.push(...rows);
    const payload = { test: task.id, kind: "actions", rows };
    task.meta.cadenceV2Signed ??= [];
    task.meta.cadenceV2Signed.push({
      ...payload,
      signature: createHmac("sha256", evidenceKey).update(JSON.stringify(payload)).digest("hex"),
    });
  });
  return records;
}

/** Native and N/A boundaries use real exported parts and physical hosts. They
 * never manufacture a recipe, provider or mode branch for a static tier label. */
export async function expectV2NativeBoundaries(item: string, options: { root?: string; container?: ParentNode } = {}) {
  const root = options.root ?? process.cwd(),
    container = options.container ?? document;
  const plan = await planFor(root);
  const records: V2BoundaryRecord[] = [];
  for (const boundary of plan.boundaries.filter((boundary) => boundary.item === item)) {
    const [owner, exported] = boundary.anchor.split("#");
    const executions = [...mountedComponents.keys()]
      .map((key) => key as Execution)
      .filter(
        (execution) =>
          execution.committed &&
          execution.item === owner &&
          execution.exports.includes(exported) &&
          execution.module === path.resolve(root, boundary.file).replaceAll("\\", "/"),
      );
    expect(executions.length, `actual native ${boundary.anchor}`).toBeGreaterThan(0);
    const nodes = executions.flatMap((execution) =>
      [...execution.hosts.keys()].filter(
        (node) =>
          executionHost(execution, node) &&
          container.contains(node) &&
          boundary.slots.includes(node.getAttribute("data-slot") ?? ""),
      ),
    );
    expect([...new Set(nodes.map((node) => node.getAttribute("data-slot")))].sort()).toEqual(
      [...boundary.slots].sort(),
    );
    for (const node of nodes) {
      const animations = (node as HTMLElement).getAnimations?.() ?? [];
      const capabilityForm =
        boundary.capability === "Changed text"
          ? /^text\.change\//
          : boundary.capability === "Changed numbers"
            ? /^number\.roll\//
            : boundary.capability === "Size"
              ? /^geometry\.resize\//
              : boundary.capability.includes("colour")
                ? /^state\.color\//
                : /^(?:reveal\/|enter\.pop\/|exit\.fade\/|popup\.anchored\/|data\.transition\/opacity$)/;
      const ownsCapability = [...presentationSamples.values()].some(
        (sample) => sample.node === node && capabilityForm.test(sample.form),
      );
      const relevant =
        boundary.capability === "Size"
          ? /^(width|height)$/
          : boundary.capability.includes("colour")
            ? /color|shadow|fill|stroke/i
            : boundary.capability === "Appearance"
              ? /opacity|transform/
              : /opacity|transform/;
      for (const animation of animations) {
        const frames = (animation.effect as KeyframeEffect | null)?.getKeyframes?.() ?? [];
        expect(
          ownsCapability &&
            frames.some((frame) => Object.keys(frame).some((key) => relevant.test(key))) &&
            animation.playState === "running",
          "native/N/A boundary cannot hide a live capability writer",
        ).toBe(false);
      }
    }
    expect(executions.every((execution) => execution.digest === boundary.digest)).toBe(true);
    records.push({
      item,
      capability: boundary.capability,
      part: boundary.part,
      anchor: boundary.anchor,
      relationship: boundary.relationship,
      digest: boundary.digest,
      slots: boundary.slots,
      live: true,
      native: true,
    });
  }
  const verified = JSON.stringify(records);
  onTestFinished(({ task }) => {
    const rows: V2BoundaryRecord[] = JSON.parse(verified);
    task.meta.cadenceV2Boundaries ??= [];
    task.meta.cadenceV2Boundaries.push(...rows);
    const payload = { test: task.id, kind: "boundaries", rows };
    task.meta.cadenceV2Signed ??= [];
    task.meta.cadenceV2Signed.push({
      ...payload,
      signature: createHmac("sha256", evidenceKey).update(JSON.stringify(payload)).digest("hex"),
    });
  });
  return records;
}
