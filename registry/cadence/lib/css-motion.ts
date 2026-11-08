"use client";

import { type Ref, useCallback, useEffect, useInsertionEffect, useLayoutEffect, useRef, useState } from "react";
import { type CadenceMode, transitionFor } from "./motion";
import { type MotionEnvironment, subscribeMotionEnvironment } from "./motion-environment";
import { motionScopeStyle } from "./motion-scope";
import type { CadenceMotion } from "./provider";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;

type MotionElement = HTMLElement | SVGElement;

type FamilyOwner = {
  node: MotionElement;
  classes: string | null;
  applied: Record<string, string>;
  allowed: boolean;
  request?: string;
};

/** Inspect the actual connection without adding a prop to a DOM spread. */
function bindings<T>(props: T, ownership: { current: FamilyOwner | null }): T & { controller(): FamilyOwner | null } {
  return Object.defineProperty(props, "controller", { value: () => ownership.current, enumerable: false }) as T & {
    controller(): FamilyOwner | null;
  };
}

function familyStyle(text: string | null, family: "transition" | "animation") {
  return (text ?? "")
    .split(";")
    .filter((declaration) =>
      new RegExp(`^\\s*(?:${family}(?:-[a-z-]+)?${family === "animation" ? "|opacity" : ""})\\s*:`).test(declaration),
    )
    .join(";");
}

function releaseFamily(owner: FamilyOwner | null) {
  if (!owner) return;
  for (const [key, value] of Object.entries(owner.applied))
    if (owner.node.style.getPropertyValue(key) === value) owner.node.style.removeProperty(key);
  owner.applied = {};
  owner.allowed = false;
}

/** Own only an otherwise unclaimed CSS family; preserve caller declarations. */
function acquireFamily(
  node: MotionElement,
  values: Record<string, string>,
  family: "transition" | "animation",
  previous: FamilyOwner | null,
): FamilyOwner {
  const classes = node.getAttribute("class");
  const keys =
    family === "transition"
      ? [
          "transition-property",
          "transition-duration",
          "transition-delay",
          "transition-timing-function",
          "transition-behavior",
        ]
      : Array.from(node.style).filter((key) => key === "animation" || key.startsWith("animation-"));
  const intact =
    previous?.node === node &&
    previous.allowed &&
    previous.classes === classes &&
    Object.entries(previous.applied).every(([key, value]) => node.style.getPropertyValue(key) === value);
  if (!intact) {
    releaseFamily(previous);
    const css = node.ownerDocument.defaultView?.getComputedStyle(node);
    const conflict =
      keys.some((key) => node.style.getPropertyValue(key) !== "") ||
      (family === "animation"
        ? css?.animationName.split(",").some((name) => name.trim() !== "" && name.trim() !== "none")
        : css?.transitionProperty !== "none" &&
          css?.transitionDuration.split(",").some((time) => parseFloat(time) > 0));
    if (conflict) return { node, classes, applied: {}, allowed: false };
  }
  const request = JSON.stringify(values);
  const probe = node.ownerDocument.createElement("span").style;
  if (!intact || previous?.request !== request)
    for (const [key, value] of Object.entries(values)) probe.setProperty(key, value);
  const canonical =
    intact && previous?.request === request
      ? previous.applied
      : Object.fromEntries(Object.keys(values).map((key) => [key, probe.getPropertyValue(key)]));
  for (const [key, value] of Object.entries(canonical))
    if (node.style.getPropertyValue(key) !== value) node.style.setProperty(key, value);
  return {
    node,
    classes,
    allowed: true,
    request,
    applied: Object.fromEntries(Object.keys(values).map((key) => [key, node.style.getPropertyValue(key)])),
  };
}

function useCssConnection<T extends MotionElement>(
  externalRef: Ref<T> | undefined,
  signature: string,
  connect: (node: T) => (release?: boolean) => void,
) {
  const node = useRef<T | null>(null);
  const [, attached] = useState<T | null>(null);
  const configuration = useRef<{ signature: string; connect(node: T): (release?: boolean) => void } | null>(null);
  const connection = useRef<{ node: T; signature: string; disconnect(release?: boolean): void } | null>(null);
  const lease = useRef<object | null>(null);
  const reconcile = () => {
    const config = configuration.current;
    if (connection.current?.node === node.current && connection.current?.signature === config?.signature) return;
    connection.current?.disconnect(false);
    connection.current =
      node.current && config
        ? { node: node.current, signature: config.signature, disconnect: config.connect(node.current) }
        : null;
  };
  committed(() => {
    configuration.current = { signature, connect };
    reconcile();
  });
  committed(
    () => () => {
      connection.current?.disconnect();
      connection.current = null;
    },
    [],
  );
  const ref = useCallback(
    (element: T | null) => {
      const identity = {};
      lease.current = identity;
      connection.current?.disconnect();
      connection.current = null;
      node.current = element;
      attached(element);
      const cleanup = typeof externalRef === "function" ? externalRef(element) : undefined;
      if (externalRef && typeof externalRef !== "function") externalRef.current = element;
      const config = configuration.current;
      if (element && config)
        connection.current = { node: element, signature: config.signature, disconnect: config.connect(element) };
      return () => {
        if (lease.current === identity) {
          connection.current?.disconnect();
          connection.current = null;
          node.current = null;
          attached(null);
        }
        if (typeof cleanup === "function") cleanup();
        else if (typeof externalRef === "function") externalRef(null);
        else if (externalRef && externalRef.current === element) externalRef.current = null;
      };
    },
    [externalRef],
  );
  return { ref, node };
}
export const colorProperties = [
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
] as const;
export type ColorProperty = (typeof colorProperties)[number];

function properties(values: readonly ColorProperty[]) {
  if (!values.length || new Set(values).size !== values.length || values.some((p) => !colorProperties.includes(p)))
    throw new RangeError("state.color requires unique explicit colour properties");
  return values.join(", ");
}

// CSSOM keyframes resolve colour functions. Unknown syntax/topology is immediate.
function shadowShape(value: unknown) {
  if (typeof value !== "string" || value === "none") return null;
  const shape = value.replace(/(?:rgba?|hsla?|oklab|oklch|lab|lch|color)\([^)]*\)/gi, "").trim();
  return /^(?:inset|[\d\s.,+\-px])+$/i.test(shape) ? shape.replace(/\s+/g, " ") : null;
}

function cancelUnsafeShadows(node: MotionElement, owned: readonly ColorProperty[]) {
  for (const animation of node.getAnimations?.() ?? []) {
    const effect = animation.effect as KeyframeEffect | null;
    if (!("transitionProperty" in animation) || effect?.target !== node || effect.pseudoElement) continue;
    const property = String(animation.transitionProperty);
    if (!owned.includes(property as ColorProperty) || !property.endsWith("shadow")) continue;
    const frames = (animation.effect as KeyframeEffect | null)?.getKeyframes() ?? [];
    const key = property === "box-shadow" ? "boxShadow" : "textShadow";
    const shapes = frames.map((frame) => shadowShape(frame[key]));
    if (!shapes.length || shapes.some((shape) => shape === null || shape !== shapes[0])) animation.cancel();
  }
}

function cancelColors(node: MotionElement, owned: readonly ColorProperty[]) {
  for (const animation of node.getAnimations?.() ?? []) {
    const effect = animation.effect as KeyframeEffect | null;
    if (
      "transitionProperty" in animation &&
      effect?.target === node &&
      !effect.pseudoElement &&
      owned.includes(String(animation.transitionProperty) as ColorProperty)
    )
      animation.cancel();
  }
}

/** One explicit CSS colour owner. It never samples/pins colour targets inline. */
export function useStateColor<T extends MotionElement>(
  externalRef: Ref<T> | undefined,
  cm: CadenceMotion,
  owned: readonly ColorProperty[],
  options: { immediate?: boolean; readability?: "verified" | "immediate" } = {},
) {
  const previousMode = useRef<CadenceMode>(cm.mode);
  const ownership = useRef<FamilyOwner | null>(null);
  const environmentRef = useRef<MotionEnvironment | null>(null);
  const property = properties(owned);
  const immediate =
    options.immediate ||
    options.readability === "immediate" ||
    (options.readability !== "verified" && owned.some((p) => p === "color" || p === "background-color"));
  const signature = JSON.stringify([property, cm.mode, cm.timeScale, options, cm.scope.signature]);
  // Update an existing owner's clock before any layout effect samples a newly
  // committed state. No computed-style/layout reads or new ownership here.
  useInsertionEffect(() => {
    const record = ownership.current;
    if (!record?.allowed) return;
    if (Object.entries(record.applied).some(([key, value]) => record.node.style.getPropertyValue(key) !== value)) {
      releaseFamily(record);
      return;
    }
    const node = record.node;
    const env = environmentRef.current;
    const suppress =
      immediate ||
      node === node.ownerDocument.activeElement ||
      node.contains(node.ownerDocument.activeElement) ||
      node.matches('[aria-invalid="true"], [data-invalid]:not([data-invalid="false"])') ||
      env?.hidden ||
      env?.immediate ||
      env?.themeOwned;
    const seconds = suppress ? 0 : (cm.transition("state.color").duration ?? 0);
    if (node.style.getPropertyValue("transition-duration") !== `${seconds}s`)
      node.style.setProperty("transition-duration", `${seconds}s`);
    record.applied["transition-duration"] = node.style.getPropertyValue("transition-duration");
  });
  const owner = useCssConnection(externalRef, signature, (node) => {
    let environment: MotionEnvironment;
    let focus = node === node.ownerDocument.activeElement || node.contains(node.ownerDocument.activeElement);
    const update = (env: MotionEnvironment) => {
      environment = env;
      environmentRef.current = env;
      const mode: CadenceMode = cm.disabled ? "none" : env.reduced ? "reduced" : cm.mode;
      const clock = transitionFor("state.color", mode, { timeScale: cm.timeScale }, cm.scope);
      const invalid = node.matches('[aria-invalid="true"], [data-invalid]:not([data-invalid="false"])');
      const seconds =
        immediate || focus || invalid || env.hidden || env.immediate || env.themeOwned ? 0 : (clock.duration ?? 0);
      const old = ownership.current;
      // Flush suppressed cascade before restoring a clock, never an old target.
      if (old?.allowed && old.applied["transition-duration"] === "0s" && seconds > 0)
        node.ownerDocument.defaultView?.getComputedStyle(node).color;
      ownership.current = acquireFamily(
        node,
        {
          "transition-property": property,
          "transition-duration": `${seconds}s`,
          "transition-delay": "0s",
          "transition-timing-function": `cubic-bezier(${cm.scope.tokens.ease.out.join(",")})`,
        },
        "transition",
        old,
      );
      if (ownership.current.allowed) {
        if (seconds === 0 || (previousMode.current === "full" && mode !== "full")) cancelColors(node, owned);
        cancelUnsafeShadows(node, owned);
      }
      previousMode.current = mode;
    };
    const checkShadows = () => {
      if (ownership.current?.allowed) cancelUnsafeShadows(node, owned);
    };
    const focusIn = () => {
      focus = true;
      update(environment);
    };
    const focusOut = () => {
      focus = false;
      update(environment);
    };
    node.addEventListener("transitionrun", checkShadows);
    node.addEventListener("focusin", focusIn);
    node.addEventListener("focusout", focusOut);
    const unsubscribe = subscribeMotionEnvironment(node.ownerDocument, update);
    const observer = new MutationObserver((records) => {
      if (
        records.some(
          (record) =>
            record.attributeName !== "style" ||
            familyStyle(record.oldValue, "transition") !== familyStyle(node.getAttribute("style"), "transition"),
        )
      )
        update(environment);
    });
    observer.observe(node, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ["aria-invalid", "data-invalid", "class", "style"],
    });
    return (release = true) => {
      observer.disconnect();
      unsubscribe();
      node.removeEventListener("transitionrun", checkShadows);
      node.removeEventListener("focusin", focusIn);
      node.removeEventListener("focusout", focusOut);
      if (release) {
        releaseFamily(ownership.current);
        ownership.current = null;
      }
    };
  });
  committed(() => {
    if (owner.node.current && ownership.current?.allowed) cancelUnsafeShadows(owner.node.current, owned);
  });
  return bindings(
    {
      ref: owner.ref,
      "data-motion": cm.mode,
      "data-cadence-color": property,
      "data-cadence-scope": "",
      style: motionScopeStyle({ ...cm.inheritedScope, effectiveDurations: cm.scope.effectiveDurations }, cm.timeScale),
    },
    ownership,
  );
}

/** Theme-clock status only. Removing its shorthand restores current cascade paint. */
export function useContinuousMotion<T extends MotionElement>(
  externalRef: Ref<T> | undefined,
  cm: CadenceMotion,
  animation: "spin" | "pulse",
  active = true,
) {
  const ownership = useRef<FamilyOwner | null>(null);
  const signature = JSON.stringify([cm.mode, animation, active]);
  const owner = useCssConnection(externalRef, signature, (node) => {
    const view = node.ownerDocument.defaultView;
    if (!view) return () => {};
    let visible = false;
    let environment: MotionEnvironment;
    let opacityClasses: string | null | undefined;
    let inlineOpacity: string | undefined;
    let restingOpacity = 1;
    let themeOwned = false;
    const update = () => {
      // Framework pulse keyframes assume resting opacity one. Keep semantic
      // caller dimming static rather than replacing it with a brighter loop.
      const classes = node.getAttribute("class");
      if (
        animation === "pulse" &&
        (classes !== opacityClasses ||
          environment.themeOwned !== themeOwned ||
          (node.style.opacity === "" && inlineOpacity !== ""))
      ) {
        releaseFamily(ownership.current);
        ownership.current = null;
        restingOpacity = Number(view.getComputedStyle(node).opacity);
        opacityClasses = classes;
      }
      themeOwned = environment.themeOwned;
      inlineOpacity = node.style.opacity;
      const compatibleOpacity =
        animation !== "pulse" || (node.style.opacity === "" ? restingOpacity : Number(node.style.opacity)) === 1;
      const allowed =
        compatibleOpacity &&
        active &&
        visible &&
        cm.mode === "full" &&
        !environment.reduced &&
        !environment.hidden &&
        !environment.immediate;
      ownership.current = acquireFamily(
        node,
        { animation: allowed ? `var(--animate-${animation})` : "none" },
        "animation",
        ownership.current,
      );
    };
    const unsubscribe = subscribeMotionEnvironment(node.ownerDocument, (next) => {
      environment = next;
      update();
    });
    const rect = node.getBoundingClientRect();
    visible =
      rect.width > 0 &&
      rect.height > 0 &&
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < view.innerHeight &&
      rect.left < view.innerWidth;
    update();
    const observer = new IntersectionObserver((entries) => {
      const entry = entries.find((entry) => entry.target === node);
      if (entry) {
        visible = entry.isIntersecting && entry.intersectionRatio > 0;
        update();
      }
    });
    observer.observe(node);
    const changes = new MutationObserver((records) => {
      if (
        records.some(
          (record) =>
            record.attributeName !== "style" ||
            familyStyle(record.oldValue, "animation") !== familyStyle(node.getAttribute("style"), "animation"),
        )
      )
        update();
    });
    changes.observe(node, { attributes: true, attributeOldValue: true, attributeFilter: ["class", "style"] });
    return (release = true) => {
      observer.disconnect();
      changes.disconnect();
      unsubscribe();
      if (release) {
        releaseFamily(ownership.current);
        ownership.current = null;
      }
    };
  });
  return bindings(
    {
      ref: owner.ref,
      "data-motion": cm.mode,
      "data-cadence-loop": animation,
      "data-cadence-scope": "",
      style: motionScopeStyle({ ...cm.inheritedScope, effectiveDurations: cm.scope.effectiveDurations }, cm.timeScale),
    },
    ownership,
  );
}
