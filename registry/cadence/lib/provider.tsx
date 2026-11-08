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
          {children}
        </div>
      </MotionConfig>
    </CadenceContext.Provider>
  );
}

/** The resolved motion config. Falls back to the system preference when no provider is present. */
export function useCadenceMotion(ref?: RefObject<HTMLElement | null>): CadenceMotion {
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
export function useCadenceMotionScope<T extends HTMLElement>(externalRef?: Ref<T>) {
  const node = useRef<T | null>(null);
  const [, attached] = useState<T | null>(null);
  const cm = useCadenceMotion(node);
  const ref = useCallback(
    (element: T | null) => {
      if (!element) disconnectMotionTokenScope(node);
      node.current = element;
      attached(element);
      const cleanup = typeof externalRef === "function" ? externalRef(element) : undefined;
      if (externalRef && typeof externalRef !== "function") externalRef.current = element;
      return () => {
        node.current = null;
        disconnectMotionTokenScope(node);
        attached(null);
        if (typeof cleanup === "function") cleanup();
        else if (typeof externalRef === "function") externalRef(null);
        else if (externalRef) externalRef.current = null;
      };
    },
    [externalRef],
  );
  return { cm, ref };
}

/** Internal part context; keeps render children and nested portals in the owned token scope. */
export function withCadenceScope(cm: CadenceMotion, child: ReactNode) {
  return <CadenceContext.Provider value={{ ...cm, inheritedScope: cm.scope }}>{child}</CadenceContext.Provider>;
}
