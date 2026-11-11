"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useInsertionEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { captureHandoffOrigin, createCapturedHandoff } from "./captured-handoff";
import { createInlinePresence } from "./inline-presence";
import { createMeasuredGeometry, naturalGeometry } from "./measured-geometry";
import { bindMotionParameters, geometryCompact, motionMilliseconds, presenceExit, presencePopup } from "./motion";
import { subscribeMotionEnvironment } from "./motion-environment";
import { documentPresentation, usePresentationScope } from "./motion-presence";
import { type MotionHostRef, useMotionHostRef } from "./motion-ref";
import { createMotionTransaction } from "./motion-transaction";
import { type CadenceMotion, useCadenceMotion } from "./provider";
import { createTextSnapshot, diffText } from "./text-diff";
import { nativeTextContext, proveTextLayout } from "./text-layout";
import { useTextPresentation } from "./use-text-presentation";

export type SelectCandidate = {
  capture: ReturnType<typeof captureHandoffOrigin>;
  value: unknown;
  trigger: HTMLElement | null;
  event: Event;
  approved: boolean;
  taken?: boolean;
};
export function createSelectScope() {
  const transaction = createMotionTransaction();
  return {
    transaction,
    handoff: createCapturedHandoff(transaction),
    trigger: null as HTMLElement | null,
    candidate: null as SelectCandidate | null,
    baseline: 0,
    multiple: false,
    equal: (a: unknown, b: unknown) => Object.is(a, b),
    retire() {
      this.candidate?.capture?.dispose();
      this.candidate = null;
    },
  };
}
export const SelectMotion = createContext<ReturnType<typeof createSelectScope> | null>(null);
const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};

/** Trigger and value survive the popup's presentation scope and its exit. */
export function useSelectTrigger(host: MotionHostRef<HTMLElement>, cm: CadenceMotion) {
  const scope = useContext(SelectMotion),
    parent = usePresentationScope();
  const hydration = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const [hydrated] = useState(hydration);
  const consumed = useRef(false);
  const connection = useRef<{ node: HTMLElement; controller: ReturnType<typeof createInlinePresence> } | null>(null);
  committed(() => {
    const node = host.current;
    if (connection.current?.node !== node) {
      connection.current?.controller.dispose();
      connection.current = null;
    }
    if (!node) return;
    if (scope) scope.trigger = node;
    if (!connection.current) {
      const owner = parent ?? documentPresentation(node.ownerDocument);
      const enter =
        !consumed.current &&
        !hydrated &&
        owner.presented &&
        owner.available() &&
        !owner.node?.current?.hasAttribute("data-starting-style");
      consumed.current = true;
      connection.current = { node, controller: createInlinePresence(node) };
      connection.current.controller.commit({ present: true, enter, cm });
    } else connection.current.controller.commit({ present: true, enter: false, cm });
    host.invalidate = () => {
      connection.current?.controller.dispose();
      connection.current = null;
      scope?.handoff.cancel();
      if (scope?.trigger === node) scope.trigger = null;
    };
  });
  useEffect(() => {
    if (!parent && host.current) documentPresentation(host.current.ownerDocument).presented = true;
  });
  useInsertionEffect(
    () => () => {
      connection.current?.controller.dispose();
      scope?.handoff.cancel();
      if (scope?.trigger === host.current) scope.trigger = null;
    },
    [scope, host],
  );
}

/** Source proof is bounded, plain and tied to this actual pointer request. */
export function selectOrigin(source: HTMLElement, previous: string, next: string) {
  const diff = diffText(createTextSnapshot(previous), next);
  if (diff.immediate || diff.runs.length !== 1 || source.textContent !== next) return null;
  const run = diff.runs[0];
  if (!run?.incoming.length || !proveTextLayout(source, createTextSnapshot(next), { surfacePaint: true })) return null;
  const popup = source.closest<HTMLElement>('[data-slot="select-content"]');
  return captureHandoffOrigin(
    source,
    run.incoming.map((unit) => unit.text).join(""),
    null,
    popup?.parentElement ?? popup ?? source,
    run.after,
  );
}

/** Only primitive known display strings are enhanced; numeric option labels are identities. */
export function SelectDisplay({
  value,
  selected,
  visible = true,
  valueLane = false,
}: {
  value: ReactNode;
  selected?: unknown;
  visible?: boolean;
  valueLane?: boolean;
}) {
  return typeof value === "string" || typeof value === "number" ? (
    <SelectText value={String(value)} selected={selected} visible={visible} valueLane={valueLane} />
  ) : (
    value
  );
}
function SelectText({
  value,
  selected,
  visible,
  valueLane,
}: {
  value: string;
  selected: unknown;
  visible: boolean;
  valueLane: boolean;
}) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node),
    scope = useContext(SelectMotion);
  const parent = usePresentationScope();
  const [entity] = useState(() => ({}));
  const baseline = useRef(scope?.baseline);
  const source = valueLane ? scope?.candidate : null;
  const accepted =
    !scope?.multiple && source?.approved && scope?.equal(selected, source.value) && scope.trigger === source.trigger;
  committed(() => {
    if (source && accepted) {
      source.capture?.retire();
      source.taken = true;
      if (scope?.candidate === source) scope.candidate = null;
    }
  });
  const text = useTextPresentation(
    node,
    value,
    cm,
    entity,
    {
      characterStagger: false,
      visible: visible && baseline.current === scope?.baseline && (parent?.available() ?? true),
      capture: accepted ? source?.capture : null,
      sourceRetired: true,
      deferHandoff: true,
    },
    valueLane ? scope?.transaction : parent?.transaction,
    valueLane ? scope?.handoff : undefined,
  );
  committed(() => {
    baseline.current = scope?.baseline;
  });
  return (
    <span ref={ref} data-slot="select-text" data-select-value-text={valueLane || undefined} data-motion={cm.mode}>
      {text}
    </span>
  );
}

/** Shared measured shell. Native allocation/alignment always has priority. */
export function useSelectGeometry(
  host: MotionHostRef<HTMLElement>,
  content: React.RefObject<HTMLElement | null>,
  value: unknown,
  cm: CadenceMotion,
  axis: "width" | "height",
  native = false,
) {
  const scope = useContext(SelectMotion);
  const [transaction] = useState(() => scope?.transaction ?? createMotionTransaction());
  const [geometry] = useState(() => createMeasuredGeometry(transaction));
  const source = useRef({}),
    baseline = useRef(scope?.baseline);
  const settings = useRef({ native });
  const connected = useRef<{ host: HTMLElement; content: HTMLElement; release(): void } | null>(null);
  committed(() => {
    settings.current = { native };
    const node = host.current,
      flow = content.current;
    if (connected.current && (connected.current.host !== node || connected.current.content !== flow)) {
      connected.current.release();
      connected.current = null;
    }
    if (node && flow && !connected.current) {
      const release = geometry.register({
        host,
        content: flow,
        axes: [axis],
        measure() {
          if (
            settings.current.native ||
            nativeTextContext(node) ||
            (axis === "height" && node.contains(node.ownerDocument.activeElement))
          )
            return null;
          const css = getComputedStyle(node),
            natural = naturalGeometry(flow);
          if (!natural || css.writingMode !== "horizontal-tb" || css.aspectRatio !== "auto") return null;
          const typed = node.computedStyleMap?.().get(axis)?.toString();
          if (typed && !["auto", "fit-content", "max-content"].includes(typed)) return null;
          const border =
            axis === "width"
              ? Number.parseFloat(css.paddingLeft) +
                Number.parseFloat(css.paddingRight) +
                Number.parseFloat(css.borderLeftWidth) +
                Number.parseFloat(css.borderRightWidth)
              : Number.parseFloat(css.paddingTop) +
                Number.parseFloat(css.paddingBottom) +
                Number.parseFloat(css.borderTopWidth) +
                Number.parseFloat(css.borderBottomWidth);
          const arrows =
            axis === "height"
              ? Array.from(node.children)
                  .filter((child) => child !== flow && child instanceof HTMLElement)
                  .reduce((sum, child) => sum + (naturalGeometry(child as HTMLElement)?.height ?? 0), 0)
              : 0;
          const size = natural[axis] + arrows + (css.boxSizing === "border-box" ? border : 0);
          if (!Number.isFinite(size)) return null;
          return { [axis]: { size, min: size, independent: true, readable: true } };
        },
      });
      // Focus had temporarily delegated the size axis to native layout. Leaving
      // it establishes today's natural baseline, not a new resize story.
      const focus = () =>
        queueMicrotask(() => {
          if (host.current === node && !node.contains(node.ownerDocument.activeElement)) geometry.settle();
        });
      node.addEventListener("focusout", focus);
      connected.current = {
        host: node,
        content: flow,
        release() {
          node.removeEventListener("focusout", focus);
          release();
        },
      };
    }
    const parameters = cm.parameters(bindMotionParameters(geometryCompact, "geometry.resize/measured"));
    if (parameters.kind === "geometry")
      geometry.commit(transaction.revision("content", value, source), {
        reduced: cm.reduced,
        transition: parameters.transition,
        available: !native && baseline.current === scope?.baseline,
      });
    baseline.current = scope?.baseline;
  });
  useInsertionEffect(
    () => () => {
      connected.current?.release();
      connected.current = null;
      geometry.dispose();
    },
    [geometry],
  );
}

/** Parameter-backed popup paint; Base UI still waits on the real native handles. */
export function createSelectPopup(node: HTMLElement) {
  const transaction = createMotionTransaction(),
    owner = transaction.register(node);
  let current: { open: boolean; cm: CadenceMotion; enter: boolean } | null = null;
  let handles: Animation[] = [],
    alive = true,
    epoch = 0,
    blocked = false;
  let lease: ReturnType<typeof owner.begin>;
  const cancel = () => {
    epoch++;
    for (const handle of handles) handle.cancel();
    handles = [];
    lease?.cancel();
  };
  const settleEntry = () => {
    if (current?.open) cancel();
  };
  for (const type of ["focusin", "pointerdown", "click", "keydown", "beforematch"])
    node.addEventListener(type, settleEntry, true);
  const unsubscribe = subscribeMotionEnvironment(node.ownerDocument, (e) => {
    blocked = e.hidden || e.immediate;
    if (blocked || (e.reduced && current?.cm.mode === "full")) cancel();
  });
  return {
    commit(input: { open: boolean; cm: CadenceMotion; enter: boolean }) {
      const previous = current;
      current = input;
      const enter = input.cm.parameters(bindMotionParameters(presencePopup, "popup.anchored/presence"));
      const exit = input.cm.parameters(bindMotionParameters(presenceExit, "exit.fade/opacity"));
      if (!alive || enter.kind !== "visual" || exit.kind !== "visual") return;
      const changed = previous ? previous.open !== input.open : input.enter;
      const downgrade = previous?.cm.mode === "full" && input.cm.reduced;
      if (!changed && !downgrade && !input.cm.disabled && input.cm.timeScale !== 0) return;
      const css = getComputedStyle(node),
        opacity = handles.length ? css.opacity : undefined;
      cancel();
      const clocks = input.open ? enter : exit;
      const immediate = blocked || input.cm.disabled || input.cm.timeScale === 0 || clocks.opacity.duration === 0;
      if (
        typeof node.animate !== "function" ||
        (input.open && (immediate || node.contains(node.ownerDocument.activeElement)))
      )
        return;
      if ((!changed && !downgrade && !immediate) || css.visibility === "hidden" || css.display === "none") return;
      // Caller opacity/transform families retain their native authority.
      if (
        node.style.opacity ||
        css.transitionProperty
          .split(",")
          .some(
            (property, index) =>
              ["all", "opacity", "transform", "scale", "translate"].includes(property.trim()) &&
              Number.parseFloat(
                css.transitionDuration.split(",")[index % css.transitionDuration.split(",").length] ?? "0",
              ) > 0,
          ) ||
        node
          .getAnimations()
          .some((a) =>
            (a.effect as KeyframeEffect | null)?.getKeyframes().some((f) => "opacity" in f || "transform" in f),
          )
      )
        return;
      const spatial = input.open && !immediate && !input.cm.reduced && css.transform === "none" && css.scale === "none";
      const revision = transaction.revision("presence", input.open, node),
        generation = epoch;
      lease = owner.begin(revision, spatial ? ["opacity", "transform"] : ["opacity"], {}, () => {
        for (const handle of handles) handle.cancel();
        handles = [];
      });
      if (!lease?.current()) return;
      handles = [
        node.animate(
          [
            { opacity: immediate ? 0 : (opacity ?? (input.open ? 0 : css.opacity)) },
            { opacity: input.open ? css.opacity : 0 },
          ],
          {
            duration: motionMilliseconds(immediate ? 0 : Number(clocks.opacity.duration)),
            easing: `cubic-bezier(${input.cm.scope.tokens.ease[input.open ? "out" : "in"].join(",")})`,
            fill: "both",
          },
        ),
      ];
      if (spatial)
        handles.push(
          node.animate([{ transform: `scale(${enter.scale})` }, { transform: "none" }], {
            duration: motionMilliseconds(Number(enter.spatial.duration)),
            easing: `cubic-bezier(${input.cm.scope.tokens.ease.out.join(",")})`,
            fill: "both",
          }),
        );
      void Promise.allSettled(handles.map((h) => h.finished)).then(() => {
        if (alive && generation === epoch && input.open) cancel();
      });
    },
    dispose() {
      alive = false;
      cancel();
      owner.dispose();
      unsubscribe();
      for (const type of ["focusin", "pointerdown", "click", "keydown", "beforematch"])
        node.removeEventListener(type, settleEntry, true);
    },
  };
}
