"use client";

import type { CSSProperties, RefObject } from "react";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { currentBatch, type StyleBatch, subscribeNodes, withBatch } from "./invalidation";
import {
  cssEasing,
  defaultMotionTokens,
  type EffectiveMotionDurations,
  effectiveMotionTokenName,
  generatedMotionTime,
  inheritedMotionTokenName,
  isGeneratedMotionTime,
  type MotionTokenEntry,
  type MotionTokenValues,
  motionCssVersion,
  motionTokenCss,
  motionTokenEntries,
} from "./motion";

type MotionElement = HTMLElement | SVGElement;

const entries = motionTokenEntries();
const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const TOKEN_EVENT = "cadence:motion-tokens";
const probes = new WeakMap<Document, { host: HTMLElement; probe: HTMLElement }>();
const localConnections = new WeakMap<object, () => void>();

/** Ref cleanup is immediate even when a primitive detaches inside its own commit. */
export function disconnectMotionTokenScope(ref: RefObject<MotionElement | null>) {
  localConnections.get(ref)?.();
  localConnections.delete(ref);
}

function isolatedProbe(doc: Document, context: CSSStyleDeclaration, owner: MotionElement) {
  let value = probes.get(doc);
  if (!value) {
    const host = doc.createElement("span");
    host.setAttribute("data-cadence-token-probe", "");
    host.setAttribute("aria-hidden", "true");
    host.style.display = "none";
    const probe = doc.createElement("span");
    probe.style.cssText = "all:initial;display:none";
    host.attachShadow({ mode: "closed" }).appendChild(probe);
    doc.head.appendChild(host);
    value = { host, probe };
    probes.set(doc, value);
  }
  value.probe.lang = owner.closest("[lang]")?.getAttribute("lang") ?? doc.documentElement.lang;
  for (const name of [
    "font",
    ...Array.from(context).filter((name) => name.startsWith("font-")),
    "line-height",
    "writing-mode",
    "text-orientation",
    "direction",
  ])
    value.probe.style.setProperty(name, context.getPropertyValue(name));
  return value.probe;
}

export interface MotionScopeSnapshot {
  tokens: MotionTokenValues;
  effectiveDurations: EffectiveMotionDurations;
  supported: boolean;
  signature: string;
  owner: MotionElement | null;
  ready: boolean;
}

function snapshot(
  tokens: MotionTokenValues,
  effectiveDurations: EffectiveMotionDurations,
  supported: boolean,
  owner: MotionElement | null = null,
  ready = true,
): MotionScopeSnapshot {
  return {
    tokens,
    effectiveDurations,
    supported,
    owner,
    ready,
    signature: JSON.stringify([tokens, effectiveDurations, supported, ready]),
  };
}

export const defaultMotionScope = snapshot(defaultMotionTokens(), {}, false, null, false);

/** Call after a CSSOM-only edit or an application-specific non-DOM theme signal. The whole synchronous
 * fan-out shares one batch, so every scope evaluating the same chain node or the same token probe does it
 * once rather than once per scope. */
export function refreshCadenceMotionTokens() {
  if (typeof document === "undefined") return;
  const view = document.defaultView;
  if (view) withBatch(view, () => document.dispatchEvent(new Event(TOKEN_EVENT)));
  else document.dispatchEvent(new Event(TOKEN_EVENT));
}

/** Private fallbacks transport inputs without overriding the actual part's public CSS variables. */
export function motionScopeStyle(scope: MotionScopeSnapshot, timeScale: number): CSSProperties {
  const style: Record<string, string | number> = {
    "--cadence-time-scale": timeScale,
    "--cadence-recipe-enabled": timeScale === 0 ? 0 : 1,
  };
  if (!scope.supported) return style as CSSProperties;
  for (const entry of entries) {
    const group = scope.tokens[entry.group] as unknown as Record<
      string,
      number | readonly number[] | { visualDuration: number; bounce: number }
    >;
    const value = entry.field
      ? (group[entry.key] as { visualDuration: number; bounce: number })[entry.field]
      : group[entry.key];
    style[inheritedMotionTokenName(entry.name)] = motionTokenCss(entry, value as MotionTokenEntry["value"]);
  }
  for (const [key, value] of Object.entries(scope.effectiveDurations))
    style[effectiveMotionTokenName(key)] = generatedMotionTime(`${value}s`, 2);
  return style as CSSProperties;
}

const simpleNumber = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i;
const simpleUnit = /^([-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)\s*(ms|s|px|deg)$/i;

/** Committed client read only. No rectangle reads, rendering engines or animation writers.
 * `batch` shares the chain and probe reads with every other scope notified in the same delivery or publish.
 * Without one, the read still joins whatever batch the current synchronous work opened — a token publish
 * opens one for its whole `dispatchEvent` fan-out — and outside any batch it reads for itself, as a
 * commit-time refresh wants. */
export function readMotionTokenScope(
  element: MotionElement,
  inherited = defaultMotionScope,
  batch = currentBatch() ?? undefined,
): MotionScopeSnapshot {
  const view = element.ownerDocument.defaultView;
  if (!view) return inherited;
  const css = batch?.style(element) ?? view.getComputedStyle(element);
  const supported = css.getPropertyValue("--motion-source-version").trim() === String(motionCssVersion);
  if (!supported) return snapshot(defaultMotionTokens(), {}, false, element);
  const tokens = defaultMotionTokens();
  const evaluate = (raw: string, property: "transitionDuration" | "marginLeft" | "rotate" | "flexGrow") => {
    if (raw.includes("%") || /anchor(?:-size)?\(/i.test(raw))
      throw new RangeError("Motion token units cannot depend on percentage/anchor geometry");
    const measure = () => {
      const probe = isolatedProbe(element.ownerDocument, css, element);
      probe.style[property] = "";
      probe.style[property] = raw;
      if (!probe.style[property]) throw new RangeError(`Invalid motion token: ${raw}`);
      return view.getComputedStyle(probe)[property];
    };
    // The probe is one shared element whose font context is copied from this element, so a probe result is
    // only reusable for the element it was measured against — not document-wide.
    return batch ? batch.memo(element, `probe:${property}:${raw}`, measure) : measure();
  };
  const numeric = (raw: string, unit: MotionTokenEntry["unit"]): number => {
    let text = raw;
    if (!simpleNumber.test(text) && !simpleUnit.test(text))
      text = evaluate(
        text,
        unit === "s" ? "transitionDuration" : unit === "px" ? "marginLeft" : unit === "deg" ? "rotate" : "flexGrow",
      );
    const match = text.match(simpleUnit);
    if (
      match &&
      (unit === "s" ? !["s", "ms"].includes(match[2]?.toLowerCase() ?? "") : match[2]?.toLowerCase() !== unit)
    )
      throw new RangeError(`Motion token has the wrong unit: ${raw}`);
    const value = match
      ? Number(match[1]) / (match[2]?.toLowerCase() === "ms" ? 1000 : 1)
      : simpleNumber.test(text)
        ? Number(text)
        : Number.NaN;
    if (!match && unit !== "number" && value !== 0) throw new RangeError(`Motion token requires ${unit}: ${raw}`);
    if (!Number.isFinite(value) || value < 0) throw new RangeError(`Invalid non-negative motion token: ${raw}`);
    return value;
  };
  {
    for (const entry of entries) {
      const raw = css.getPropertyValue(entry.name).trim();
      if (!raw) throw new RangeError(`Missing or invalid motion token: ${entry.name}`);
      if (entry.group === "ease") {
        const match = raw.match(/^cubic-bezier\(\s*([^)]*)\)$/i);
        const values = match?.[1]?.split(",").map(Number) ?? cssEasing[raw.toLowerCase()];
        if (
          values?.length !== 4 ||
          !values.every(Number.isFinite) ||
          (values[0] ?? -1) < 0 ||
          (values[0] ?? 2) > 1 ||
          (values[2] ?? -1) < 0 ||
          (values[2] ?? 2) > 1
        )
          throw new RangeError(`Motion easing must be a finite cubic-bezier: ${raw}`);
        tokens.ease[entry.key as keyof MotionTokenValues["ease"]] = values as [number, number, number, number];
      } else if (entry.group === "spring") {
        const value = numeric(raw, entry.unit);
        if (entry.field === "bounce" && value > 0.95) throw new RangeError("Motion spring bounce exceeds 0.95");
        tokens.spring[entry.key as keyof MotionTokenValues["spring"]] = {
          ...tokens.spring[entry.key as keyof MotionTokenValues["spring"]],
          [entry.field ?? "visualDuration"]: value,
        };
      } else {
        (tokens[entry.group] as Record<string, number>)[entry.key] = numeric(raw, entry.unit);
      }
    }
    const effectiveDurations = { ...inherited.effectiveDurations };
    const ancestors: MotionElement[] = [];
    // A portal's physical document ancestors must not override its logical owner.
    const transport = element.closest<HTMLElement>("[data-cadence-scope]");
    const boundary = inherited.owner
      ? inherited.owner.contains(element)
        ? inherited.owner
        : (transport ?? element).parentElement
      : null;
    for (let node: MotionElement | null = element; node && node !== boundary; node = node.parentElement)
      ancestors.push(node);
    for (const node of ancestors.reverse()) {
      const style = node === element ? css : (batch?.style(node) ?? view.getComputedStyle(node));
      for (const key of Object.keys(tokens.duration) as (keyof typeof tokens.duration)[]) {
        const raw = style.getPropertyValue(`--motion-duration-${key}`).trim();
        if (raw && (!isGeneratedMotionTime(raw) || (node !== element && /\+\s*0s\s*\*\s*2\s*\)$/.test(raw)))) {
          const literal = raw.match(/^calc\(\s*([^()*]+?)\s*(?:\*\s*[01]\s*)?\+\s*0s\s*\*\s*2\s*\)$/)?.[1]?.trim();
          effectiveDurations[key] = numeric(literal ?? raw, "s");
        }
      }
    }
    return snapshot(tokens, effectiveDurations, true, element);
  }
}

/** Only public token declarations matter; ordinary Motion/primitive style frames are ignored. */
function tokenStyle(text: string | null) {
  return (text ?? "")
    .split(";")
    .filter((declaration) =>
      /^\s*(?:--(?:motion-|ease-cadence-)[a-z0-9-]*|font(?:-[a-z-]+)?|line-height|writing-mode)\s*:/.test(declaration),
    )
    .join(";");
}

/** Attributes whose change can alter a public token declaration on a scope chain. */
const SCOPE_ATTRIBUTES = ["class", "style", "data-motion", "data-theme", "data-color-scheme", "lang", "dir"];

function observeScope(element: MotionElement, refresh: (batch?: StyleBatch) => void, root = false) {
  const doc = element.ownerDocument;
  const view = doc.defaultView;
  if (!view) return () => {};
  const chain: MotionElement[] = [];
  for (let node: MotionElement | null = element; node; node = node.parentElement) chain.push(node);
  // Same bus and same batch as the text and number hosts, so one root-level write reads each chain node and
  // evaluates each token probe once for every scope on the page instead of once per scope.
  const link = subscribeNodes({
    nodes: chain,
    attributes: SCOPE_ATTRIBUTES,
    onInvalidate(records, batch) {
      if (
        records.some(
          (record) =>
            record.attributeName !== "style" ||
            tokenStyle(record.oldValue) !== tokenStyle((record.target as Element).getAttribute("style")),
        )
      )
        refresh(batch);
    },
  });
  const reload = () => refresh();
  const stylesheetChanged = () => withBatch(view, () => doc.dispatchEvent(new Event(TOKEN_EVENT)));
  const head = root
    ? new MutationObserver((records) => {
        if (
          records.some(
            (record) =>
              record.type !== "childList" ||
              [...record.addedNodes, ...record.removedNodes].some(
                (node) => !(node instanceof HTMLElement && node.hasAttribute("data-cadence-token-probe")),
              ),
          )
        )
          stylesheetChanged();
      })
    : undefined;
  head?.observe(doc.head, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["href", "media", "disabled"],
  });
  view.addEventListener("resize", reload);
  doc.addEventListener(TOKEN_EVENT, reload);
  if (root) doc.head.addEventListener("load", stylesheetChanged, true);
  if (root) doc.fonts?.addEventListener("loadingdone", stylesheetChanged);
  const preference = root ? view.matchMedia("(prefers-reduced-motion: reduce)") : undefined;
  preference?.addEventListener("change", reload);
  return () => {
    link.dispose();
    head?.disconnect();
    view.removeEventListener("resize", reload);
    doc.removeEventListener(TOKEN_EVENT, reload);
    if (root) doc.head.removeEventListener("load", stylesheetChanged, true);
    if (root) doc.fonts?.removeEventListener("loadingdone", stylesheetChanged);
    preference?.removeEventListener("change", reload);
  };
}

let rootScope = defaultMotionScope;
const rootListeners = new Set<() => void>();
let stopRoot: (() => void) | undefined;
function subscribeRoot(listener: () => void) {
  rootListeners.add(listener);
  if (!stopRoot) {
    const refresh = (batch?: StyleBatch) => {
      const next = readMotionTokenScope(document.documentElement, defaultMotionScope, batch);
      if (next.signature !== rootScope.signature) {
        rootScope = next;
        for (const notify of rootListeners) notify();
      }
    };
    stopRoot = observeScope(document.documentElement, refresh, true);
    refresh();
  }
  return () => {
    rootListeners.delete(listener);
    if (!rootListeners.size) {
      stopRoot?.();
      stopRoot = undefined;
      probes.get(document)?.host.remove();
      probes.delete(document);
    }
  };
}

export function useRootMotionScope() {
  return useSyncExternalStore(
    subscribeRoot,
    () => rootScope,
    () => defaultMotionScope,
  );
}

function localScopeStore(initial: MotionScopeSnapshot) {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    read: () => value,
    server: () => initial,
    publish(next: MotionScopeSnapshot) {
      if (value.signature === next.signature && value.owner === next.owner) return;
      value = next;
      for (const listener of listeners) listener();
    },
  };
}

export function useLocalMotionScope(ref: RefObject<MotionElement | null> | undefined, inherited: MotionScopeSnapshot) {
  const [store] = useState(() => localScopeStore(inherited));
  const value = useSyncExternalStore(store.subscribe, store.read, store.server);
  const parent = useRef(inherited);
  const observed = useRef<{ node: MotionElement; stop: () => void } | null>(null);
  committed(() => {
    parent.current = inherited;
    const node = ref?.current;
    if (!node) {
      observed.current?.stop();
      observed.current = null;
      return;
    }
    const refresh = (batch?: StyleBatch) => {
      const next = readMotionTokenScope(node, parent.current, batch);
      store.publish(next);
    };
    if (observed.current?.node !== node) {
      observed.current?.stop();
      observed.current = { node, stop: observeScope(node, refresh) };
    }
    if (ref)
      localConnections.set(ref, () => {
        observed.current?.stop();
        observed.current = null;
      });
    refresh();
  });
  committed(
    () => () => {
      observed.current?.stop();
      observed.current = null;
      if (ref) localConnections.delete(ref);
    },
    [],
  );
  return ref ? value : inherited;
}
