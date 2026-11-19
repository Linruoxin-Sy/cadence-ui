"use client";

import { Loader2Icon } from "lucide-react";
import { usePresence } from "motion/react";
import type * as React from "react";
import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { cn } from "../lib/cn";
import { useContinuousMotion, useStateColor } from "../lib/css-motion";
import { createMeasuredGeometry, naturalGeometry } from "../lib/measured-geometry";
import { bindMotionParameters, geometryCompact } from "../lib/motion";
import { documentPresentation, usePresentationScope } from "../lib/motion-presence";
import { useMotionHostRef } from "../lib/motion-ref";
import { createMotionTransaction } from "../lib/motion-transaction";
import { useCadenceMotion } from "../lib/provider";
import { createSurfacePresence } from "../lib/surface-presence";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};

export interface SpinnerProps extends React.ComponentProps<"svg"> {}

type Connection = {
  host: SVGSVGElement;
  parent: ReturnType<typeof usePresentationScope>;
  commit(): void;
  cancel(): void;
  dispose(): void;
};

/**
 * The indeterminate wait: something is happening, and no progress value exists yet.
 *
 * Recipe: `data.transition` in its continuous form — the theme's `--animate-spin`
 * clock, handed to the real compositor by `useContinuousMotion` rather than a
 * Motion loop, because a spinner is next to the work the user is waiting on and
 * must not add a frame callback to it. Only `transform` (rotation) changes, so the
 * loop never triggers layout; it is released, not paused, while the glyph is
 * hidden, offscreen or retained for its exit fade.
 *
 * Motion contract:
 * - full: rotation while the status is current and visible
 * - reduced / none: the named glyph stands still, no rotation
 *
 * The same SVG owns its opacity entrance/exit, its foreground colour clock and its
 * own icon-size revision; none of those writers touch the rotation transform.
 *
 * a11y: `role="status"` with `aria-label="Loading"`. The label is what a screen
 * reader announces; the rotation is never the only signal. Pass a more specific
 * `aria-label` ("Saving invoice") when the surrounding text does not say what is
 * loading.
 */
function Spinner({ className, ref: callerRef, ...props }: SpinnerProps) {
  const { node, ref } = useMotionHostRef<SVGSVGElement>(callerRef);
  const cm = useCadenceMotion(node);
  const [present, remove] = usePresence();
  const parent = usePresentationScope();
  // SSR and the first client commit stay natural; only a later insertion animates.
  const hydration = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const initialHydration = useRef(hydration);
  const consumed = useRef(false);
  // Rotation is the busy state itself: a retained removal stops it before the fade.
  const loop = useContinuousMotion(ref, cm, "spin", present);
  const paint = useStateColor(loop.ref, cm, ["color"], { readability: "verified" });
  const latest = useRef({ cm, present, remove });
  const connection = useRef<Connection | null>(null);
  useEffect(() => {
    if (!parent && node.current) documentPresentation(node.current.ownerDocument).presented = true;
  }, [parent, node]);
  committed(() => {
    latest.current = { cm, present, remove };
    const host = node.current;
    if (connection.current?.host !== host || connection.current.parent !== parent) {
      connection.current?.dispose();
      connection.current = null;
    }
    if (!host) return;
    if (!connection.current) {
      const transaction = createMotionTransaction();
      // Stationary opacity only: the inline preset's `data.transition/opacity`
      // form cannot coexist with the loop's continuous form in one declaration.
      const opacity = createSurfacePresence(host);
      const geometry = createMeasuredGeometry(transaction);
      const unregister = geometry.register({
        host: node,
        content: host,
        axes: ["width", "height"],
        // The icon's own reserved box, read from its resolved geometry. Rotation
        // and the entrance never write either axis.
        measure() {
          const box = naturalGeometry(host);
          if (!box) return null;
          return {
            width: { size: box.width, readable: true, independent: true },
            height: { size: box.height, readable: true, independent: true },
          };
        },
      });
      let leaveParent = () => {};
      const entry: Connection = {
        host,
        parent,
        cancel() {
          geometry.settle();
          opacity.commit({
            present: latest.current.present,
            enter: false,
            cm: { ...latest.current.cm, timeScale: 0 },
            complete: () => {
              if (!latest.current.present) latest.current.remove?.();
            },
          });
        },
        commit() {
          const input = latest.current;
          const baseline = parent ?? documentPresentation(host.ownerDocument);
          const visible =
            !host.closest("[hidden],[inert]") &&
            baseline.available() &&
            (!host.checkVisibility || host.checkVisibility({ visibilityProperty: true, contentVisibilityAuto: true }));
          const owned = input.present && visible;
          // Only an explicit caller revision (class or inline box) is a measured
          // icon-size change; passive reflow and responsive sizing stay native.
          const revision = transaction.revision(
            "layout",
            JSON.stringify([host.getAttribute("class"), host.style.width, host.style.height]),
            host,
          );
          const parameters = input.cm.parameters(bindMotionParameters(geometryCompact, "geometry.resize/measured"));
          if (parameters.kind === "geometry")
            geometry.commit(revision, {
              reduced: input.cm.reduced,
              transition: parameters.transition,
              available: owned,
            });
          opacity.commit({
            present: input.present,
            enter:
              !consumed.current &&
              !initialHydration.current &&
              baseline.presented &&
              owned &&
              !baseline.node?.current?.hasAttribute("data-starting-style"),
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
          unregister();
          geometry.dispose();
          transaction.cancel();
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

  return (
    <Loader2Icon
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      {...props}
      {...loop}
      {...paint}
      data-motion={cm.mode}
      aria-hidden={!present ? true : props["aria-hidden"]}
      style={{ ...props.style, ...loop.style, ...paint.style }}
      className={cn("size-4", className)}
    />
  );
}

export { Spinner };
