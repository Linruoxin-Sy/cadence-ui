"use client";

import { type Ref, useCallback, useEffect, useInsertionEffect, useLayoutEffect, useRef, useState } from "react";
import { type CadenceMode, motionMilliseconds, transitionFor } from "./motion";
import { type MotionEnvironment, subscribeMotionEnvironment } from "./motion-environment";
import { motionScopeStyle } from "./motion-scope";
import {
  cssTransitionList,
  knownPresenceProperties,
  registerColorTransition,
  subscribePresenceProperties,
} from "./popup-presence";
import type { CadenceMotion } from "./provider";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;

type MotionElement = HTMLElement | SVGElement;

type FamilyOwner = {
  node: MotionElement;
  classes: string | null;
  applied: Record<string, string>;
  allowed: boolean;
  request?: string;
  base?: Record<string, string[]>;
  restore?: string;
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
function paintStyle(text: string | null) {
  return (text ?? "")
    .split(";")
    .filter((declaration) =>
      /^\s*(?:color(?:-scheme)?|background[\w-]*|opacity|filter|[\w-]*blend[\w-]*|--(?!motion-|cadence-|ease-)[\w-]+)\s*:/.test(
        declaration,
      ),
    )
    .join(";");
}

function releaseFamily(owner: FamilyOwner | null) {
  if (!owner) return;
  const intact = Object.entries(owner.applied).every(
    ([key, value]) => owner.node.style.getPropertyValue(key) === value,
  );
  for (const [key, value] of Object.entries(owner.applied))
    if (owner.node.style.getPropertyValue(key) === value) owner.node.style.removeProperty(key);
  owner.applied = {};
  owner.allowed = false;
  if (intact && owner.restore) owner.node.style.transition = owner.restore;
}

const cssList = cssTransitionList;
function composeTransition(values: Record<string, string>, base?: Record<string, string[]>) {
  if (!base) return values;
  const count = (values["transition-property"] ?? "").split(",").length;
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      [
        ...(base[key] ?? []),
        ...Array.from({ length: count }, (_, index) => cssList(value)[index % cssList(value).length]),
      ].join(", "),
    ]),
  );
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
  let base = intact ? previous?.base : undefined;
  let restore = intact ? previous?.restore : undefined;
  if (!intact || (base && previous?.request !== JSON.stringify(values))) {
    releaseFamily(previous);
    const css = node.ownerDocument.defaultView?.getComputedStyle(node);
    const presence = family === "transition" ? knownPresenceProperties(node) : undefined;
    const shared =
      presence &&
      css &&
      (css.transitionProperty === "none" ||
        cssList(css.transitionProperty).every((property) => presence.includes(property)));
    restore = shared && node.style.transition === "none" ? "none" : undefined;
    const conflict =
      (keys.some((key) => node.style.getPropertyValue(key) !== "") && !restore) ||
      (family === "animation"
        ? css?.animationName.split(",").some((name) => name.trim() !== "" && name.trim() !== "none")
        : css?.transitionProperty !== "none" &&
          css?.transitionDuration.split(",").some((time) => parseFloat(time) > 0) &&
          !shared);
    if (conflict) return { node, classes, applied: {}, allowed: false };
    const baseProperties =
      css?.transitionProperty === "none" ? (presence ?? []) : css ? cssList(css.transitionProperty) : [];
    base = shared
      ? Object.fromEntries(
          keys
            .filter((key) => key !== "transition-behavior")
            .map((key) => {
              const list = cssList(css.getPropertyValue(key));
              return [
                key,
                baseProperties.map((property, index) =>
                  key === "transition-property"
                    ? property
                    : list[index % list.length] || (key === "transition-timing-function" ? "ease" : "0s"),
                ),
              ];
            }),
        )
      : undefined;
    if (restore) node.style.removeProperty("transition");
  }
  const request = JSON.stringify(values);
  const probe = node.ownerDocument.createElement("span").style;
  if (!intact || previous?.request !== request)
    for (const [key, value] of Object.entries(composeTransition(values, base))) probe.setProperty(key, value);
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
    base,
    restore,
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
    const old = connection.current;
    connection.current = null;
    old?.disconnect(false);
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
      const old = connection.current;
      connection.current = null;
      old?.disconnect();
    },
    [],
  );
  const ref = useCallback(
    (element: T | null) => {
      const identity = {};
      lease.current = identity;
      const old = connection.current;
      connection.current = null;
      old?.disconnect();
      node.current = element;
      attached(element);
      const cleanup = typeof externalRef === "function" ? externalRef(element) : undefined;
      if (externalRef && typeof externalRef !== "function") externalRef.current = element;
      const config = configuration.current;
      if (element && config && lease.current === identity && node.current === element)
        connection.current = { node: element, signature: config.signature, disconnect: config.connect(element) };
      return () => {
        if (lease.current === identity) {
          const old = connection.current;
          connection.current = null;
          node.current = null;
          old?.disconnect();
          attached(null);
        }
        if (typeof cleanup === "function") cleanup();
        else if (typeof externalRef === "function") externalRef(null);
        else if (externalRef && lease.current === identity && externalRef.current === element)
          externalRef.current = null;
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

/** Reconcile the existing CSS owner, retaining its actual eased phase. No
 * sampled colour is pinned inline and no second property writer is allocated. */
function retimeColors(node: MotionElement, owned: readonly ColorProperty[], seconds: number) {
  for (const animation of node.getAnimations?.() ?? []) {
    const effect = animation.effect as KeyframeEffect | null;
    if (
      !("transitionProperty" in animation) ||
      effect?.target !== node ||
      effect.pseudoElement ||
      !owned.includes(String(animation.transitionProperty) as ColorProperty)
    )
      continue;
    const timing = effect.getTiming();
    const duration = Number(timing.duration);
    const time = typeof animation.currentTime === "number" ? animation.currentTime : null;
    if (!Number.isFinite(duration) || duration <= 0 || time === null) {
      animation.cancel();
      continue;
    }
    const phase = Math.max(0, Math.min(1, (time - (timing.delay ?? 0)) / duration));
    const next = motionMilliseconds(seconds);
    try {
      effect.updateTiming({ duration: next, delay: 0 });
      animation.currentTime = phase * next;
    } catch {
      animation.cancel();
    }
  }
}

/** One explicit CSS colour owner. It never samples/pins colour targets inline. */
export function useStateColor<T extends MotionElement>(
  externalRef: Ref<T> | undefined,
  cm: CadenceMotion,
  owned: readonly ColorProperty[],
  options: {
    /** Settle this owner at 0s on every commit, regardless of the colour clock. */
    immediate?: boolean;
    readability?: "verified" | "immediate";
    /**
     * Runtime predicate for hosts whose current paint makes a colour tween
     * unreadable. The CSS connection re-evaluates it, but the insertion-effect
     * fast path in this hook runs before that connection and cannot see the gate: it
     * rewrites `transition-duration` from the token clock on every render. If
     * the gate can be false for this host, pass the same condition as
     * `immediate` too. Otherwise the fast path overwrites a gated `0s` with the
     * token duration and the colour family is recorded as a conflict.
     */
    readabilityGate?: (node: MotionElement) => boolean;
    readabilityScope?: (node: MotionElement) => Element | null;
  } = {},
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
    // This path runs before the CSS connection, so it cannot consult
    // readabilityGate. Callers whose gate can be false must pass the same
    // condition as `immediate`; see the option's contract above.
    const suppress =
      immediate ||
      node === node.ownerDocument.activeElement ||
      node.contains(node.ownerDocument.activeElement) ||
      node.matches('[aria-invalid="true"], [data-invalid]:not([data-invalid="false"])') ||
      env?.hidden ||
      env?.immediate ||
      env?.themeOwned;
    const seconds = suppress ? 0 : (cm.transition("state.color").duration ?? 0);
    const duration = composeTransition(
      { "transition-property": property, "transition-duration": `${seconds}s` },
      record.base,
    )["transition-duration"];
    if (node.style.getPropertyValue("transition-duration") !== duration)
      node.style.setProperty("transition-duration", duration ?? "0s");
    record.applied["transition-duration"] = node.style.getPropertyValue("transition-duration");
  });
  const owner = useCssConnection(externalRef, signature, (node) => {
    let alive = true;
    const forgetColor = registerColorTransition(node, owned, () => {
      const record = ownership.current;
      return (
        alive &&
        record?.node === node &&
        record.allowed &&
        Object.entries(record.applied).every(([key, value]) => node.style.getPropertyValue(key) === value)
      );
    });
    let environment: MotionEnvironment;
    let focus = node === node.ownerDocument.activeElement || node.contains(node.ownerDocument.activeElement);
    const update = (env: MotionEnvironment) => {
      if (!alive) return;
      environment = env;
      environmentRef.current = env;
      const mode: CadenceMode = cm.disabled ? "none" : env.reduced ? "reduced" : cm.mode;
      const clock = transitionFor("state.color", mode, { timeScale: cm.timeScale }, cm.scope);
      const invalid = node.matches('[aria-invalid="true"], [data-invalid]:not([data-invalid="false"])');
      const seconds =
        immediate ||
        focus ||
        invalid ||
        env.hidden ||
        env.immediate ||
        env.themeOwned ||
        (options.readabilityGate && !options.readabilityGate(node))
          ? 0
          : (clock.duration ?? 0);
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
        if (seconds === 0) cancelColors(node, owned);
        else if (previousMode.current === "full" && mode === "reduced") retimeColors(node, owned, seconds);
        cancelUnsafeShadows(node, owned);
      }
      previousMode.current = mode;
    };
    const checkShadows = () => {
      if (alive && ownership.current?.node === node && ownership.current.allowed) {
        if (options.readabilityGate) update(environment);
        cancelUnsafeShadows(node, owned);
      }
    };
    const focusIn = () => {
      if (!alive) return;
      focus = true;
      update(environment);
    };
    const focusOut = () => {
      if (!alive) return;
      focus = false;
      update(environment);
    };
    node.addEventListener("transitionrun", checkShadows);
    node.addEventListener("focusin", focusIn);
    node.addEventListener("focusout", focusOut);
    const unsubscribe = subscribeMotionEnvironment(node.ownerDocument, update);
    const stopPresence = subscribePresenceProperties(node, () => {
      if (alive) update(environment);
    });
    const observer = new MutationObserver((records) => {
      if (!alive) return;
      if (
        records.some(
          (record) =>
            (options.readabilityGate &&
              record.attributeName === "style" &&
              record.target instanceof Element &&
              paintStyle(record.oldValue) !== paintStyle(record.target.getAttribute("style"))) ||
            record.attributeName !== "style" ||
            (record.target === node &&
              familyStyle(record.oldValue, "transition") !== familyStyle(node.getAttribute("style"), "transition")),
        )
      )
        update(environment);
    });
    observer.observe(node, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ["aria-invalid", "data-invalid", "class", "style"],
    });
    const region = options.readabilityScope?.(node);
    const relatedFocus = () => {
      if (alive) update(environment);
    };
    if (region) {
      observer.observe(region, {
        subtree: true,
        attributes: true,
        attributeOldValue: true,
        attributeFilter: ["class", "style", "aria-invalid", "data-invalid"],
      });
      region.addEventListener("focusin", relatedFocus);
      region.addEventListener("focusout", relatedFocus);
      let ancestor = region.parentElement;
      for (let depth = 0; ancestor && depth < 32; depth++, ancestor = ancestor.parentElement)
        observer.observe(ancestor, {
          attributes: true,
          attributeOldValue: true,
          attributeFilter: ["class", "style", "data-theme", "data-color-scheme"],
        });
    }
    return (release = true) => {
      alive = false;
      forgetColor();
      observer.disconnect();
      stopPresence();
      unsubscribe();
      node.removeEventListener("transitionrun", checkShadows);
      node.removeEventListener("focusin", focusIn);
      node.removeEventListener("focusout", focusOut);
      region?.removeEventListener("focusin", relatedFocus);
      region?.removeEventListener("focusout", relatedFocus);
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
    let alive = true;
    const view = node.ownerDocument.defaultView;
    if (!view) return () => {};
    let visible = false;
    let environment: MotionEnvironment;
    let opacityClasses: string | null | undefined;
    let inlineOpacity: string | undefined;
    let restingOpacity = 1;
    let themeOwned = false;
    const update = () => {
      if (!alive) return;
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
      if (!alive) return;
      const entry = entries.find((entry) => entry.target === node);
      if (entry) {
        visible = entry.isIntersecting && entry.intersectionRatio > 0;
        update();
      }
    });
    observer.observe(node);
    const changes = new MutationObserver((records) => {
      if (!alive) return;
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
      alive = false;
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
