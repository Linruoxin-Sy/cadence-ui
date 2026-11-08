"use client";

import type { Transition } from "motion/react";
import { MotionConfig } from "motion/react";
import {
  createContext,
  type ReactNode,
  type Ref,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { cn } from "./cn";
import {
  type CadenceMode,
  type MotionOptions,
  type MotionParameterBinding,
  type MotionParameterOptions,
  type MotionTokenValues,
  type Recipe,
  type ResolvedMotionParameters,
  resolveMotionParameters,
  transitionFor,
} from "./motion";
import { subscribeMotionEnvironment } from "./motion-environment";
import { MotionPresentation } from "./motion-presence";
import {
  defaultMotionScope,
  disconnectMotionTokenScope,
  type MotionScopeSnapshot,
  motionScopeStyle,
  useLocalMotionScope,
  useRootMotionScope,
} from "./motion-scope";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * The OS preference, read in a way React can hydrate.
 *
 * Motion's own `useReducedMotion` returns the media query result on the first
 * client render, while the server can only answer `false`. That is a hydration
 * mismatch on every `data-motion` attribute in the tree, and a production build
 * does not repair it: the server's `full` stays in the DOM, so a visitor who asks
 * for reduced motion keeps the full-duration tokens — the exact failure this
 * library promises not to have. Answering `false` for the server snapshot and the
 * real value for the client snapshot makes React render twice instead of
 * mismatching.
 */
function useSystemReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

export interface CadenceMotion {
  /** The effective mode: full, reduced (system preference or prop), or none. */
  mode: CadenceMode;
  /** True when transforms and layout animations should be dropped. */
  reduced: boolean;
  /**
   * True only for `mode === "none"`. `reduced` still allows opacity and colour
   * feedback, so a CSS-driven component must check this — not `reduced` — before
   * deciding that a transition has zero duration.
   */
  disabled: boolean;
  /** Recipe/portal clock multiplier; continuous CSS loops use theme --animate-* clocks. */
  timeScale: number;
  /** Resolve a recipe into a Motion transition for the current mode. */
  transition: (recipe: Recipe, options?: MotionOptions) => Transition;
  distance: MotionTokenValues["distance"];
  spring: MotionTokenValues["spring"];
  /** Internal committed scope data; not a component migration or an executor. */
  scope: MotionScopeSnapshot;
  inheritedScope: MotionScopeSnapshot;
  parameters: (binding: MotionParameterBinding, options?: MotionParameterOptions) => ResolvedMotionParameters;
}

const CadenceContext = createContext<CadenceMotion | null>(null);

const FALLBACK_MODE: CadenceMode = "full";

function createMotion(
  mode: CadenceMode,
  timeScale = 1,
  scope = defaultMotionScope,
  inheritedScope = scope,
): CadenceMotion {
  return {
    mode,
    reduced: mode !== "full",
    disabled: mode === "none",
    timeScale,
    transition: (recipe, options) => transitionFor(recipe, mode, { timeScale, ...options }, scope),
    distance: scope.tokens.distance,
    spring: scope.tokens.spring,
    scope,
    inheritedScope,
    parameters: (binding, options) =>
      resolveMotionParameters(binding, mode, {
        timeScale,
        tokens: scope.tokens,
        effectiveDurations: scope.effectiveDurations,
        ...options,
      }),
  };
}

export interface CadenceProviderProps {
  /**
   * Motion mode for everything inside. `reduced` drops transform/layout and shortens
   * timing; `none` disables animation entirely. The system
   * `prefers-reduced-motion` setting always wins over `full`.
   *
   * Omit it to inherit the enclosing provider's mode; pass it to override the
   * enclosing scope (a preview that must show motion inside a `none` page).
   */
  mode?: CadenceMode;
  /**
   * Multiplies recipe durations, springs and portal clocks. Continuous CSS loops
   * retain the theme's --animate-* timing. `1` (default) is the authored timing;
   * the docs site passes `4` for its 0.25× preview. Additive: it does not change
   * authored tokens, so a component looks the same at `1`. Omitting it inherits the
   * enclosing scale. Finite and non-negative; zero is immediate timing, preserving mode.
   */
  timeScale?: number;
  children: ReactNode;
  className?: string;
}

/**
 * Optional provider. It wires `prefers-reduced-motion` into one `MotionConfig`
 * and exposes the resolved mode to components. Components work without it; they
 * then follow the system preference only.
 *
 * Nesting is how a subtree specialises: an inner provider inherits whatever it
 * does not set, so `<CadenceProvider timeScale={4}>` slows a region down without
 * resetting the page's mode to `full`.
 */
export function CadenceProvider({ mode, timeScale, children, className }: CadenceProviderProps) {
  const parent = useContext(CadenceContext);
  const rootScope = useRootMotionScope();
  const inheritedScope = parent?.scope ?? rootScope;
  const ref = useRef<HTMLDivElement>(null);
  const scope = useLocalMotionScope(ref, inheritedScope);
  const requested = mode ?? parent?.mode ?? FALLBACK_MODE;
  const scale = timeScale ?? parent?.timeScale ?? 1;
  const systemReduced = useSystemReducedMotion();
  if (!Number.isFinite(scale) || scale < 0) throw new RangeError("timeScale must be finite and non-negative");
  const effective: CadenceMode = requested === "none" ? "none" : systemReduced ? "reduced" : requested;
  const value = createMotion(effective, scale, scope);

  return (
    <CadenceContext.Provider value={value}>
      <MotionConfig
        reducedMotion="user"
        transition={{
          duration: scope.tokens.duration.base * scale,
          ease: scope.tokens.ease.out,
        }}
      >
        <div
          ref={ref}
          data-motion={effective}
          data-cadence-scope=""
          style={motionScopeStyle(inheritedScope, scale)}
          className={cn("contents", className)}
        >
          <MotionPresentation>{children}</MotionPresentation>
        </div>
      </MotionConfig>
    </CadenceContext.Provider>
  );
}

/** The resolved motion config. Falls back to the system preference when no provider is present. */
export function useCadenceMotion(ref?: RefObject<HTMLElement | SVGElement | null>): CadenceMotion {
  const context = useContext(CadenceContext);
  const root = useRootMotionScope();
  const inherited = context?.scope ?? root;
  const scope = useLocalMotionScope(ref, inherited);
  const systemReduced = useSystemReducedMotion();
  return context && !ref
    ? context
    : createMotion(
        context?.mode ?? (systemReduced ? "reduced" : FALLBACK_MODE),
        context?.timeScale ?? 1,
        scope,
        inherited,
      );
}

/** Bind a real part without replacing its caller's React 19 cleanup ref. */
export function useCadenceMotionScope<T extends HTMLElement | SVGElement>(externalRef?: Ref<T>) {
  const node = useRef<T | null>(null);
  const connection = useRef<object | null>(null);
  const [element, attached] = useState<T | null>(null);
  const cm = useCadenceMotion(node);
  const ref = useCallback(
    (element: T | null) => {
      const identity = {};
      connection.current = identity;
      if (!element) disconnectMotionTokenScope(node);
      node.current = element;
      attached(element);
      const cleanup = typeof externalRef === "function" ? externalRef(element) : undefined;
      if (externalRef && typeof externalRef !== "function") externalRef.current = element;
      return () => {
        const current = connection.current === identity;
        if (current) {
          node.current = null;
          disconnectMotionTokenScope(node);
          attached(null);
        }
        if (typeof cleanup === "function") cleanup();
        else if (typeof externalRef === "function") externalRef(null);
        else if (externalRef && current && externalRef.current === element) externalRef.current = null;
      };
    },
    [externalRef],
  );
  return { cm, ref, element, node };
}

// A command can follow scrollIntoView before IO delivers its new record. Resolve
// ordinary rectangular clips without using pointer hitability as visibility.
function currentEngineVisibility(element: HTMLElement | SVGElement): boolean | null {
  const view = element.ownerDocument.defaultView;
  if (!view) return false;
  if (view.top !== view) return null;
  const bounds = element.getBoundingClientRect();
  let left = Math.max(0, bounds.left),
    right = Math.min(view.innerWidth, bounds.right),
    top = Math.max(0, bounds.top),
    bottom = Math.min(view.innerHeight, bounds.bottom);
  if (right <= left || bottom <= top) return false;
  const ancestors: { node: Element; style: CSSStyleDeclaration }[] = [];
  let aligned = true;
  for (let node: Element | null = element; node; node = node.parentElement) {
    if (ancestors.length === 32) return null;
    const style = view.getComputedStyle(node);
    if (
      style.display === "none" ||
      (node === element && style.visibility !== "visible") ||
      style.contentVisibility === "hidden"
    )
      return false;
    if (style.rotate !== "none" && Number.parseFloat(style.rotate) !== 0) aligned = false;
    if (style.perspective !== "none" || style.offsetPath !== "none") aligned = false;
    if (style.transform !== "none") {
      const matrix = new DOMMatrixReadOnly(style.transform);
      if (!matrix.is2D || matrix.b !== 0 || matrix.c !== 0 || matrix.a <= 0 || matrix.d <= 0) aligned = false;
    }
    if (style.scale !== "none" && style.scale.split(" ").some((value) => Number(value) <= 0)) aligned = false;
    ancestors.push({ node, style });
  }
  if (ancestors[ancestors.length - 1]?.node !== element.ownerDocument.documentElement) return null;
  for (const { node, style } of ancestors) {
    if (style.display === "contents") continue;
    const paintContainment = /paint|strict|content/.test(style.contain);
    const x = node !== element && (style.overflowX !== "visible" || paintContainment),
      y = node !== element && (style.overflowY !== "visible" || paintContainment);
    const path = style.clipPath;
    if (!x && !y && path === "none" && style.clip === "auto") continue;
    if (!aligned || style.clip !== "auto") return null;
    if (!(node instanceof HTMLElement)) return null;
    const rect = node === element ? bounds : node.getBoundingClientRect();
    const scaleX = node.offsetWidth ? rect.width / node.offsetWidth : 1,
      scaleY = node.offsetHeight ? rect.height / node.offsetHeight : 1;
    if (x) {
      const edge = rect.left + node.clientLeft * scaleX;
      left = Math.max(left, edge);
      right = Math.min(right, edge + node.clientWidth * scaleX);
    }
    if (y) {
      const edge = rect.top + node.clientTop * scaleY;
      top = Math.max(top, edge);
      bottom = Math.min(bottom, edge + node.clientHeight * scaleY);
    }
    if (path !== "none") {
      const match = /^inset\(([^()]+)\)$/.exec(path);
      const values = match?.[1]?.split(/\s+/);
      if (!values || values.length > 4 || values.some((value) => !/^-?(?:\d+\.?\d*|\.\d+)(?:px|%)$/.test(value)))
        return null;
      const a = values[0];
      if (!a) return null;
      const b = values[1] ?? a,
        c = values[2] ?? a,
        d = values[3] ?? b;
      const length = (value: string, size: number, scale: number) =>
        Number.parseFloat(value) * (value.endsWith("%") ? size / 100 : scale);
      left = Math.max(left, rect.left + length(d, rect.width, scaleX));
      right = Math.min(right, rect.right - length(b, rect.width, scaleX));
      top = Math.max(top, rect.top + length(a, rect.height, scaleY));
      bottom = Math.min(bottom, rect.bottom - length(c, rect.height, scaleY));
    }
    if (right <= left || bottom <= top) return false;
  }
  return true;
}

/** Internal engine lifetime gate. Cancellation runs in the signal, before React's next paint. */
export function useEngineEnvironment(
  element: HTMLElement | SVGElement | null,
  cancel: () => void,
  observeViewport = true,
) {
  const blocked = useRef(false);
  const revalidate = useRef(() => blocked.current);
  const [unavailable, setUnavailable] = useState(false);
  const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
  committed(() => {
    if (!element) return;
    let visible = true;
    let suspended = false;
    let sampledAt = Number.NEGATIVE_INFINITY;
    let alive = true;
    const ownsEnvironment = () => alive;
    const update = () => {
      if (!ownsEnvironment()) return;
      blocked.current = suspended || !visible;
      if (blocked.current) cancel();
      if (ownsEnvironment()) setUnavailable(blocked.current);
    };
    const unsubscribe = subscribeMotionEnvironment(element.ownerDocument, (environment) => {
      if (!ownsEnvironment()) return;
      suspended = environment.hidden || environment.immediate;
      update();
    });
    if (!observeViewport)
      return () => {
        alive = false;
        unsubscribe();
      };
    const rect = element.getBoundingClientRect();
    const view = element.ownerDocument.defaultView;
    visible = Boolean(
      view &&
        rect.width &&
        rect.height &&
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < view.innerHeight &&
        rect.left < view.innerWidth,
    );
    update();
    const recover = () => {
      if (!ownsEnvironment()) return true;
      if (!blocked.current || suspended) return blocked.current;
      const current = currentEngineVisibility(element);
      if (current === null) return true;
      sampledAt = view?.performance.now() ?? sampledAt;
      if (current !== visible) {
        visible = current;
        if (current) {
          observer.takeRecords();
          observer.unobserve(element);
          observer.observe(element);
        }
        update();
      }
      return ownsEnvironment() ? blocked.current : true;
    };
    revalidate.current = recover;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!ownsEnvironment()) return;
        let latest: IntersectionObserverEntry | undefined;
        for (const entry of entries)
          if (entry.target === element && (!latest || entry.time >= latest.time)) latest = entry;
        if (!latest) return;
        if (latest.time < sampledAt) {
          // An IO frame timestamp can precede a command within that frame.
          // Retain fresh visible actions, but never discard a real newer hide.
          if ((!latest.isIntersecting || latest.intersectionRatio === 0) && currentEngineVisibility(element) !== true) {
            visible = false;
            update();
          }
          return;
        }
        sampledAt = latest.time;
        visible = latest.isIntersecting && latest.intersectionRatio > 0;
        update();
      },
      { threshold: Number.EPSILON },
    );
    observer.observe(element);
    return () => {
      alive = false;
      observer.takeRecords();
      observer.disconnect();
      unsubscribe();
      if (revalidate.current === recover) revalidate.current = () => blocked.current;
    };
  }, [element, cancel, observeViewport]);
  return { unavailable, blocked, revalidate };
}

/** Internal part context; keeps render children and nested portals in the owned token scope. */
export function withCadenceScope(cm: CadenceMotion, child: ReactNode) {
  return <CadenceContext.Provider value={{ ...cm, inheritedScope: cm.scope }}>{child}</CadenceContext.Provider>;
}
