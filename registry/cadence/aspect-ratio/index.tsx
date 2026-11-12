"use client";

import { usePresence } from "motion/react";
import type * as React from "react";
import {
  Children,
  isValidElement,
  useEffect,
  useInsertionEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  observeRatioFrame,
  type RatioAxis,
  type RatioFrame,
  ratioAxis,
  ratioFrame,
  ratioGeometry,
} from "../lib/aspect-ratio-layout";
import { cn } from "../lib/cn";
import { useStateColor } from "../lib/css-motion";
import { createMeasuredGeometry } from "../lib/measured-geometry";
import { bindMotionParameters, geometryCompact, motionLimits } from "../lib/motion";
import { documentPresentation, usePresentationScope } from "../lib/motion-presence";
import { useMotionHostRef } from "../lib/motion-ref";
import { createMotionTransaction } from "../lib/motion-transaction";
import { useCadenceMotion } from "../lib/provider";
import { createSurfacePresence } from "../lib/surface-presence";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};

/** A wrapper that paints its own text cannot promise readable intermediate
 * surfaces, so its palette settles immediately instead. Bounded, and resolved
 * from the rendered tree rather than from a later DOM read. */
function paintsText(children: React.ReactNode, depth = 0, budget = { left: motionLimits.collectionVisuals }): boolean {
  if (typeof children === "string" || typeof children === "number") return true;
  if (depth > 2 || !children) return false;
  for (const child of Children.toArray(children)) {
    if (budget.left-- <= 0) return false;
    if (!isValidElement<{ children?: React.ReactNode }>(child)) continue;
    if (child.type === "img" || child.type === "video" || child.type === "svg") continue;
    if (paintsText(child.props.children, depth + 1, budget)) return true;
  }
  return false;
}

export interface AspectRatioProps extends React.ComponentProps<"div"> {
  /** Width ÷ height. `16 / 9` is a safe default for media, `1` for avatars. */
  ratio: number;
}

/**
 * Reserves a box at a fixed width-to-height ratio so media never shifts the
 * layout when it loads.
 *
 * An independent insertion fades the wrapper in on its own host. An intentional
 * `ratio` change interpolates the one physical dimension that the new ratio
 * moved — never the definite dimension and never the CSS ratio itself — and the
 * box returns to native sizing once that axis settles, so parent constraints
 * keep recomputing geometry. Media decode, passive resizing and an unsupported
 * constraint relationship stay native and immediate.
 *
 * The `--ratio` custom property is written after the caller's `style`, so a
 * consumer can pass a background or a filter without losing the ratio.
 */
function AspectRatio({ ratio, className, style: callerStyle, children, ...props }: AspectRatioProps) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(props.ref);
  const cm = useCadenceMotion(node);
  const [present, remove] = usePresence();
  const parent = usePresentationScope();
  const text = paintsText(children);
  const AspectRatioPaint = useStateColor(
    ref,
    cm,
    [
      "background-color",
      "border-top-color",
      "border-right-color",
      "border-bottom-color",
      "border-left-color",
      "box-shadow",
    ],
    {
      readability: "verified",
      immediate: text,
      readabilityGate: (host) => !host.textContent,
    },
  );
  const removal = useRef({ ready: false, pending: false, present, complete: remove });
  useInsertionEffect(() => {
    Object.assign(removal.current, { ready: false, present, complete: remove });
  });
  useEffect(() => {
    const delivery = removal.current;
    delivery.ready = true;
    if (delivery.pending && !delivery.present) delivery.complete?.();
    delivery.pending = false;
  });
  const hydration = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const initialHydration = useRef(hydration);
  const consumed = useRef(false);
  const presence = useRef<ReturnType<typeof createSurfacePresence> | null>(null);
  useEffect(() => {
    if (!parent && node.current) documentPresentation(node.current.ownerDocument).presented = true;
  }, [parent, node]);
  const [geometry] = useState(() => {
    const transaction = createMotionTransaction();
    return { transaction, controller: createMeasuredGeometry(transaction) };
  });
  const axis = useRef<RatioAxis | null>(null);
  const frame = useRef<RatioFrame | null>(null);
  const connection = useRef<{ host: HTMLElement; release(): void } | null>(null);
  const prepared = useRef({ ratio, policy: "" });
  useInsertionEffect(() => {
    // Capture the pre-change frame before React writes the new ratio.
    const policy = JSON.stringify([cm.mode, cm.timeScale, cm.scope.signature]);
    if (prepared.current.ratio !== ratio || prepared.current.policy !== policy) geometry.controller.prepare();
    prepared.current = { ratio, policy };
  }, [ratio, cm.mode, cm.timeScale, cm.scope.signature, geometry]);
  committed(() => {
    const host = node.current;
    if (connection.current && connection.current.host !== host) {
      connection.current.release();
      connection.current = null;
    }
    if (!host) return;
    if (!connection.current) {
      frame.current = ratioFrame(host);
      const stop = observeRatioFrame(host, (next) => {
        frame.current = next;
      });
      const release = geometry.controller.register({
        host: node,
        content: host,
        axes: ["width", "height"],
        observeChildren: true,
        textGeometry: true,
        measure: () => ratioGeometry(node.current, axis.current),
      });
      connection.current = {
        host,
        release() {
          stop();
          release();
        },
      };
    }
    if (!presence.current) presence.current = createSurfacePresence(host);
    const scope = parent ?? documentPresentation(host.ownerDocument);
    presence.current.commit({
      present,
      enter:
        !consumed.current &&
        !initialHydration.current &&
        scope.presented &&
        scope.available() &&
        !scope.node?.current?.hasAttribute("data-starting-style"),
      cm,
      complete: () => {
        const delivery = removal.current;
        if (delivery.present) return;
        if (delivery.ready) delivery.complete?.();
        else delivery.pending = true;
      },
    });
    consumed.current = true;
    const parameters = cm.parameters(bindMotionParameters(geometryCompact, "geometry.resize/measured"));
    if (parameters.kind !== "geometry") return;
    const nextAxis = ratioAxis(host, frame.current);
    axis.current = nextAxis;
    const next = ratioFrame(host);
    if (next) frame.current = next;
    // The destination is the native box itself, so box-sizing, intrinsic sizing
    // and caller min/max constraints are preserved rather than recomputed.
    geometry.controller.commit(
      geometry.transaction.revision("content", [ratio, nextAxis, next?.width ?? 0, next?.height ?? 0].join("/"), node),
      { reduced: cm.reduced, transition: parameters.transition, available: present && !!next },
    );
  });
  committed(
    () => () => {
      presence.current?.dispose();
      presence.current = null;
      connection.current?.release();
      connection.current = null;
      geometry.controller.dispose();
    },
    [geometry],
  );

  return (
    <div
      data-slot="aspect-ratio"
      {...props}
      {...AspectRatioPaint}
      data-motion={cm.mode}
      data-ending-style={present ? undefined : ""}
      aria-hidden={present ? props["aria-hidden"] : true}
      inert={!present || props.inert || undefined}
      className={cn("relative aspect-(--ratio)", className)}
      style={{ ...AspectRatioPaint.style, ...callerStyle, "--ratio": ratio } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

export { AspectRatio };
