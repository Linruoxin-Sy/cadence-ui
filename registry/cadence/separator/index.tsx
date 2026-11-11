"use client";

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import { usePresence } from "motion/react";
import { useContext, useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { cn } from "../lib/cn";
import { useStateColor } from "../lib/css-motion";
import { createInlinePresence } from "../lib/inline-presence";
import { createMeasuredGeometry, GeometryScope } from "../lib/measured-geometry";
import { bindMotionParameters, geometryCompact } from "../lib/motion";
import { documentPresentation, usePresentationScope } from "../lib/motion-presence";
import { useMotionHostRef } from "../lib/motion-ref";
import { createMotionTransaction } from "../lib/motion-transaction";
import { useCadenceMotion } from "../lib/provider";
import { observeSeparatorConstraints, separatorGeometry } from "../lib/separator-layout";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};

export interface SeparatorProps extends SeparatorPrimitive.Props {
  /**
   * Purely visual separator: sets `role="none"` and `aria-hidden` so screen
   * readers do not announce it. Upstream's Base UI separator is always
   * announced; this prop is additive, for markup ported from the Radix style.
   */
  decorative?: boolean;
}

/**
 * One native rule; opacity, explicit length and background have disjoint owners.
 */
function Separator({ className, orientation = "horizontal", decorative = false, ...props }: SeparatorProps) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(props.ref);
  const cm = useCadenceMotion(node);
  const [present, remove] = usePresence();
  const parent = usePresentationScope();
  const group = useContext(GeometryScope);
  const hydrated = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const initialHydration = useRef(hydrated),
    consumed = useRef(false);
  const connection = useRef<{
    host: HTMLElement;
    group: typeof group;
    parent: typeof parent;
    commit(): void;
    cancel(): void;
    dispose(): void;
  } | null>(null);
  const latest = useRef({ cm, present, remove, orientation });
  const paint = useStateColor(ref, cm, ["background-color"], {
    readability: "verified",
    readabilityGate: (host) => !host.textContent && !host.children.length,
  });
  useEffect(() => {
    if (!parent && node.current) documentPresentation(node.current.ownerDocument).presented = true;
  }, [parent, node]);
  committed(() => {
    latest.current = { cm, present, remove, orientation };
    const host = node.current;
    if (
      connection.current?.host !== host ||
      connection.current?.group !== group ||
      connection.current?.parent !== parent
    ) {
      connection.current?.dispose();
      connection.current = null;
    }
    if (!host) return;
    if (!connection.current) {
      const transaction = createMotionTransaction();
      const opacity = createInlinePresence(host, transaction);
      let geometry = group?.controller ?? createMeasuredGeometry();
      let unregister: (() => void) | undefined;
      let axis: "width" | "height" | null = null;
      let length: string | null = null;
      let lastOrientation = orientation;
      const baseline = parent ?? documentPresentation(host.ownerDocument);
      const constraints = group
        ? { prepare(_semantic: boolean) {}, commit() {}, dispose() {} }
        : observeSeparatorConstraints(host, () => geometry.settle());
      let leaveParent = () => {};
      const entry = {
        host,
        group,
        parent,
        cancel() {
          geometry.settle();
          opacity.commit({
            present: latest.current.present,
            enter: false,
            revision: latest.current.orientation,
            cm: { ...latest.current.cm, timeScale: 0 },
            complete: () => {
              if (!latest.current.present) latest.current.remove?.();
            },
          });
        },
        commit() {
          const input = latest.current;
          const visible =
            !host.closest("[hidden],[inert]") &&
            baseline.available() &&
            (!host.checkVisibility || host.checkVisibility({ visibilityProperty: true, contentVisibilityAuto: true }));
          const owned = input.present && visible;
          const nextAxis = input.orientation === "horizontal" ? "width" : "height";
          if (axis !== nextAxis) {
            unregister?.();
            if (!group) {
              geometry.dispose();
              geometry = createMeasuredGeometry();
            }
            axis = nextAxis;
            unregister = geometry.register({
              host: node,
              content: host,
              axes: ["width", "height"],
              observeChildren: true,
              textGeometry: true,
              measure: () => separatorGeometry(host, nextAxis),
            });
            length = null;
          }
          const nextLength = JSON.stringify([host.className, host.style[nextAxis]]);
          const semantic = length !== null && nextLength !== length && lastOrientation === input.orientation;
          constraints.prepare(semantic);
          const parameters = input.cm.parameters(bindMotionParameters(geometryCompact, "geometry.resize/measured"));
          if (group) group.request?.();
          else if (parameters.kind === "geometry")
            geometry.commit(transaction.revision("content", [input.orientation, nextLength].join("/")), {
              reduced: input.cm.reduced,
              transition: parameters.transition,
              available: owned,
            });
          constraints.commit();
          length = nextLength;
          lastOrientation = input.orientation;
          opacity.commit({
            present: input.present,
            enter:
              !consumed.current &&
              !initialHydration.current &&
              baseline.presented &&
              owned &&
              !baseline.node?.current?.hasAttribute("data-starting-style"),
            revision: input.orientation,
            cm:
              visible && !baseline.node?.current?.hasAttribute("data-starting-style")
                ? input.cm
                : { ...input.cm, timeScale: 0 },
            complete: () => {
              if (!latest.current.present) latest.current.remove?.();
            },
          });
          consumed.current = true;
        },
        dispose() {
          leaveParent();
          opacity.dispose();
          unregister?.();
          if (!group) geometry.dispose();
          transaction.cancel();
          constraints.dispose();
        },
      };
      if (parent) {
        const owner = parent.transaction.register(host);
        const join = () => owner.begin(parent.transaction.revision("presence", host, host), [], {}, entry.cancel);
        join();
        const off = parent.transaction.subscribeOpen(join);
        leaveParent = () => {
          off();
          owner.dispose();
        };
      }
      connection.current = entry;
    }
    connection.current.commit();
  });
  committed(
    () => () => {
      connection.current?.dispose();
      connection.current = null;
    },
    [],
  );
  const a11y = decorative ? { role: "none", "aria-hidden": true } : {};
  const callerStyle = props.style;

  return (
    <SeparatorPrimitive
      data-slot="separator"
      data-orientation={orientation}
      orientation={orientation}
      {...a11y}
      {...props}
      {...paint}
      data-motion={cm.mode}
      data-ending-style={present ? undefined : ""}
      aria-hidden={!present ? true : (props["aria-hidden"] ?? (decorative ? true : undefined))}
      inert={!present || props.inert || undefined}
      className={(state) =>
        cn(
          "shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
          typeof className === "function" ? className(state) : className,
        )
      }
      style={
        typeof callerStyle === "function"
          ? (state) => ({ ...paint.style, ...callerStyle(state) })
          : { ...paint.style, ...callerStyle }
      }
    />
  );
}

export { Separator };
