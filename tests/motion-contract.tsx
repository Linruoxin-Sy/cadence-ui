import { expect, onTestFinished } from "vitest";
import { controlSamples, imperativeSamples, motionSamples, type Sample } from "./motion-observer";

declare module "vitest" {
  interface TaskMeta {
    cadenceModes?: string[];
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
  } = {},
) {
  for (const part of options.parts ?? []) expect(part).toBeInTheDocument();
  const nodes = [...(options.root ?? document).querySelectorAll<HTMLElement>("[data-motion][data-slot]")];
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
            ["animate-pulse", "animate-none"].includes(c) || (c === "animate-spin" && node.dataset.slot === "spinner"),
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
    observed > 0 || css || Boolean(options.behavior),
    "no observable motion writer; supply an engine/imperative behavior assertion",
  ).toBe(true);
  if (options.behavior) {
    const before = expect.getState().assertionCalls;
    options.behavior();
    expect(expect.getState().assertionCalls, "behavior must execute assertions").toBeGreaterThan(before);
  }
  onTestFinished(({ task }) => {
    const modes = (task.meta.cadenceModes ?? []) as string[];
    task.meta.cadenceModes = [...new Set([...modes, mode])];
  });
}
