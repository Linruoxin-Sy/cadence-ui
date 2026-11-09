// Executed installed forms remain distinct from full component-v2 acceptance.
import { readFileSync } from "node:fs";
import { expect, onTestFinished } from "vitest";
import { targetMetadata } from "../scripts/motion-migration.mjs";
import {
  controlSamples,
  cssPolicySamples,
  imperativeSamples,
  motionSamples,
  mountedComponents,
  mountedExports,
  presentationSamples,
  type Sample,
} from "./motion-observer";

const legacySpinner =
  targetMetadata(readFileSync("docs/motion/components/spinner.md", "utf8")).metadata?.migration === "legacy";

declare module "vitest" {
  interface TaskMeta {
    cadenceModes?: string[];
    cadencePolicy?: Record<string, string[]>;
    cadencePolicyParts?: Record<string, Record<string, string[]>>;
    cadenceParts?: Record<string, string[]>;
    cadenceForms?: Record<string, string[]>;
    cadenceGroup?: string[];
    cadenceComponents?: Record<string, string[]>;
    cadenceExports?: Record<string, string[]>;
    cadenceCssParts?: Record<string, string[]>;
  }
}

type Mode = "full" | "reduced" | "none";
const geometry = /^(transform|x|y|z|translate.*|scale.*|rotate.*|skew.*|width|height)$/;
function moving(target: unknown, instantRotation = false): boolean {
  if (!target || typeof target !== "object") return false;
  return Object.entries(target).some(([key, value]) => {
    if (!geometry.test(key) || (instantRotation && key.startsWith("rotate"))) return false;
    const neutral = key === "transform" ? "none" : key.startsWith("scale") ? 1 : 0;
    return (Array.isArray(value) ? value : [value]).some((v) => v !== neutral);
  });
}
function zero(transition: Sample) {
  expect(transition, "none / instant geometry must have an explicit zero clock").toMatchObject({ duration: 0 });
  expect(transition.delay ?? 0).toBe(0);
  for (const value of Object.values(transition)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nested = value as Sample;
      zero({ duration: transition.duration, ...nested });
    }
  }
}

/** Call after mounting/exercising the actual branch; portals are included. */
export function expectMotionContract(
  mode: Mode,
  options: {
    root?: ParentNode;
    instantImperative?: boolean;
    parts?: (Element | null)[];
    /** Required for engine/imperative writers that cannot be read from DOM/Motion props. */
    behavior?: () => void;
    policy?: ("color" | "loop")[];
    /** Exact installed forms, backed by executed controller commits on these hosts. */
    forms?: NonNullable<ReturnType<typeof presentationSamples.get>>["form"][];
  } = {},
) {
  for (const part of options.parts ?? []) expect(part).toBeInTheDocument();
  const nodes = [...(options.root ?? document).querySelectorAll<HTMLElement | SVGElement>("[data-motion][data-slot]")];
  expect(nodes.length, "render an animated part before asserting its contract").toBeGreaterThan(0);
  for (const node of nodes) {
    expect(node).toHaveAttribute("data-motion", mode);
    const classes = node.getAttribute("class") ?? "";
    if (mode !== "full") {
      // Only state-dependent geometry: static centering, placement and origins are legal.
      expect(classes).not.toMatch(
        /(?:starting-style|ending-style|starting|ending)[^ ]*:(?:scale-|translate-|transform-|\[transform:)/,
      );
      expect(classes).not.toContain("transition-[height]");
    }
    const loops = classes.split(/\s+/).filter((c) => /^animate-/.test(c));
    if (mode === "none") expect(loops.filter((c) => c !== "animate-none")).toEqual([]);
    if (mode === "reduced")
      expect(
        loops.every(
          (c) =>
            ["animate-pulse", "animate-none"].includes(c) ||
            (c === "animate-spin" && node.dataset.slot === "spinner" && legacySpinner),
        ),
      ).toBe(true);
    if (
      mode === "none" &&
      /transition-(?:opacity|transform|\[[^\]]*(?:opacity|transform|scale|height|width))/.test(classes) &&
      !classes.includes("transition-none")
    ) {
      const clocks = [...classes.matchAll(/duration-\(--([\w-]+)\)/g)].map((m) =>
        node.style.getPropertyValue(`--${m[1]}`),
      );
      expect(
        classes.includes("duration-0") ||
          node.style.transitionDuration === "0s" ||
          (clocks.length > 0 && clocks.every((c) => c === "0s" || c === "0ms")),
        `${node.dataset.slot}: none CSS clock`,
      ).toBe(true);
    }
  }
  if (mode === "none" || (mode === "reduced" && options.instantImperative)) {
    for (const call of imperativeSamples) zero((call[2] ?? {}) as Sample);
  }
  let observed = 0;
  for (const props of motionSamples.values()) {
    expect(props["data-motion"], "every observed Motion part carries the effective mode").toBe(mode);
    observed++;
    const control = controlSamples.get(props.animate as object);
    const transition = control?.transition ?? (props.transition as Sample | undefined);
    const target = control?.target ?? props.animate;
    const positional = ["switch-thumb", "progress-indicator"].includes(String(props["data-slot"]));
    if (mode !== "full") {
      expect(moving(props.whileTap) || moving(props.whileHover), "downgraded gesture transform").toBe(false);
      expect(props.layout || props.layoutId, "downgraded layout interpolation").toBeFalsy();
      if (positional) zero(transition ?? {});
      else {
        expect(
          moving(target, props["aria-hidden"] === "true" && transition?.duration === 0),
          "downgraded animated target geometry",
        ).toBe(false);
        expect(moving(props.initial), "downgraded initial geometry").toBe(false);
        expect(moving(props.exit), "downgraded exit geometry").toBe(false);
      }
    }
    if (mode === "none" && (transition || (target && typeof target === "object" && Object.keys(target).length)))
      zero(transition ?? {});
  }
  const css = nodes.some((n) => /animate-|duration-0|transition-(opacity|\[|none)/.test(n.getAttribute("class") ?? ""));
  expect(
    observed > 0 ||
      css ||
      Boolean(options.behavior) ||
      [...cssPolicySamples.values()].some((sample) => sample.ref.current && nodes.includes(sample.ref.current)),
    "no observable motion writer; supply an engine/imperative behavior assertion",
  ).toBe(true);
  if (options.behavior) {
    const before = expect.getState().assertionCalls;
    options.behavior();
    expect(expect.getState().assertionCalls, "behavior must execute assertions").toBeGreaterThan(before);
  }
  const policySlots = new Map<string, string[]>();
  for (const kind of options.policy ?? []) {
    const samples = [...cssPolicySamples.values()].filter(
      (sample) => sample.kind === kind && sample.ref.current && nodes.includes(sample.ref.current),
    );
    expect(samples.length, `execute an actual ${kind} owner before claiming policy evidence`).toBeGreaterThan(0);
    policySlots.set(
      kind,
      samples.map((sample) => sample.ref.current?.dataset.slot as string),
    );
    const ownership = new Map<HTMLElement | SVGElement, Set<string>>();
    for (const sample of samples) {
      const node = sample.ref.current as HTMLElement | SVGElement;
      expect(sample.controller()?.node, `actual ${kind} connection`).toBe(node);
      expect(sample.controller()?.allowed, `active ${kind} owner; caller CSS cannot certify shared execution`).toBe(
        true,
      );
      expect(sample.mode).toBe(mode);
      const owned = ownership.get(node) ?? new Set<string>();
      for (const property of sample.properties) {
        expect(owned.has(property), `duplicate ${property} owner`).toBe(false);
        owned.add(property);
      }
      ownership.set(node, owned);
      const style = getComputedStyle(node);
      if (kind === "color") {
        expect(style.transitionProperty.split(/,\s*/), "explicit colour properties").toEqual(sample.properties);
        expect(style.transitionDelay).toBe("0s");
        expect(style.transitionProperty).not.toContain("all");
        const immediate =
          node === node.ownerDocument.activeElement ||
          node.contains(node.ownerDocument.activeElement) ||
          node.matches('[aria-invalid="true"], [data-invalid]:not([data-invalid="false"])');
        expect(parseFloat(style.transitionDuration)).toBe(mode === "none" || immediate ? 0 : sample.seconds);
        expect(style.transitionProperty).not.toMatch(/outline|border-width|filter|opacity/);
      } else if (mode !== "full") {
        expect(node.style.animation, "v2 reduced/none status is static").toBe("none");
        expect((node.getAnimations?.() ?? []).filter((animation) => "animationName" in animation)).toHaveLength(0);
      } else expect(node.style.animation).toMatch(/^(?:none|var\(--animate-(?:spin|pulse)\))$/);
    }
  }
  const presentations = [...presentationSamples.values()].filter((sample) => nodes.includes(sample.node));
  for (const sample of presentations) {
    expect(sample.mode, `${sample.form} committed mode`).toBe(mode);
    if (mode !== "full" && sample.immediate !== undefined)
      expect(sample.immediate, `${sample.form} downgraded geometry is immediate`).toBe(true);
  }
  for (const form of options.forms ?? []) {
    const owners = presentations.filter(
      (sample) => sample.form === form && sample.mode === mode && sample.node.isConnected,
    );
    expect(owners.length, `execute an actual ${form} controller on the mounted part`).toBeGreaterThan(0);
  }
  const slots = nodes.map((node) => node.dataset.slot as string);
  const forms = presentations
    .filter((sample) => sample.mode === mode && sample.node.isConnected)
    .map((sample) => sample.form);
  const group = presentations.some((sample) => sample.group && sample.mode === mode && sample.node.isConnected);
  const components = [...new Set(mountedComponents.values())];
  const exports = [...new Set(mountedExports.values())];
  const cssParts = nodes
    .filter((node) =>
      /transition-(?:opacity|none|\[[^\]]*(?:opacity|scale|height|width))|duration-0/.test(
        node.getAttribute("class") ?? "",
      ),
    )
    .map((node) => node.dataset.slot as string);
  onTestFinished(({ task }) => {
    const modes = (task.meta.cadenceModes ?? []) as string[];
    task.meta.cadenceModes = [...new Set([...modes, mode])];
    for (const component of components) {
      task.meta.cadenceComponents ??= {};
      task.meta.cadenceComponents[component] = [...new Set([...(task.meta.cadenceComponents[component] ?? []), mode])];
    }
    for (const part of exports) {
      task.meta.cadenceExports ??= {};
      task.meta.cadenceExports[part] = [...new Set([...(task.meta.cadenceExports[part] ?? []), mode])];
    }
    for (const part of cssParts) {
      task.meta.cadenceCssParts ??= {};
      task.meta.cadenceCssParts[part] = [...new Set([...(task.meta.cadenceCssParts[part] ?? []), mode])];
    }
    for (const slot of slots) {
      task.meta.cadenceParts ??= {};
      task.meta.cadenceParts[slot] = [...new Set([...(task.meta.cadenceParts[slot] ?? []), mode])];
    }
    for (const form of forms) {
      task.meta.cadenceForms ??= {};
      task.meta.cadenceForms[form] = [...new Set([...(task.meta.cadenceForms[form] ?? []), mode])];
    }
    if (group) task.meta.cadenceGroup = [...new Set([...(task.meta.cadenceGroup ?? []), mode])];
    for (const kind of options.policy ?? []) {
      task.meta.cadencePolicy ??= {};
      task.meta.cadencePolicy[kind] = [...new Set([...(task.meta.cadencePolicy[kind] ?? []), mode])];
      task.meta.cadencePolicyParts ??= {};
      task.meta.cadencePolicyParts[kind] ??= {};
      for (const slot of policySlots.get(kind) ?? []) {
        const parts = task.meta.cadencePolicyParts[kind];
        parts[slot] = [...new Set([...(parts[slot] ?? []), mode])];
      }
    }
  });
}
