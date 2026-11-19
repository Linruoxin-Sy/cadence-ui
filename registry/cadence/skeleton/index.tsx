"use client";

import type * as React from "react";
import { useEffect, useLayoutEffect, useRef } from "react";
import { cn } from "../lib/cn";
import { useContinuousMotion, useStateColor } from "../lib/css-motion";
import { createMeasuredGeometry, naturalGeometry } from "../lib/measured-geometry";
import { bindMotionParameters, geometryCompact } from "../lib/motion";
import { useMotionHostRef } from "../lib/motion-ref";
import { createMotionTransaction } from "../lib/motion-transaction";
import { useCadenceMotion } from "../lib/provider";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface SkeletonProps extends React.ComponentProps<"div"> {
  /** The region is still waiting. `false` stops the pulse without unmounting the
   * shape: the parent owns whether the placeholder exists at all. */
  busy?: boolean;
}

/**
 * A placeholder with the shape of the content that is loading.
 *
 * Recipe: `data.transition` in its continuous form — a theme-clock opacity
 * pulse, implemented in CSS rather than in Motion, because a list of placeholders
 * must not pay for forty animation loops on the main thread. Only `opacity`
 * changes, so the pulse cannot trigger layout.
 *
 * Motion contract:
 * - full: opacity pulse while the region is busy
 * - reduced / none: the same shape holds a static equivalent, no loop survives
 *
 * The placeholder also owns its measured box on an explicit shape revision
 * (`geometry.resize/measured`) and its surface paint (`state.color/surface`).
 *
 * a11y: a skeleton is decorative. The region that is loading carries
 * `aria-busy="true"`; the skeleton itself is never announced.
 */
function Skeleton({ busy = true, className, style, ref: callerRef, ...props }: SkeletonProps) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(callerRef);
  const cm = useCadenceMotion(node);
  const measured = useRef<ReturnType<typeof createMeasuredGeometry> | null>(null);
  const transaction = useRef<ReturnType<typeof createMotionTransaction> | null>(null);
  const pulse = useContinuousMotion(ref, cm, "pulse", busy);
  const paint = useStateColor(pulse.ref, cm, [
    "background-color",
    "border-top-color",
    "border-right-color",
    "border-bottom-color",
    "border-left-color",
    "box-shadow",
  ]);
  committed(() => {
    const host = node.current;
    if (!host) return;
    const current = transaction.current ?? createMotionTransaction();
    transaction.current = current;
    if (!measured.current) {
      const geometry = createMeasuredGeometry(current);
      geometry.register({
        host: node,
        content: host,
        axes: ["width", "height"],
        // Natural layout only: the placeholder's own box, read before any axis
        // it writes is applied. A passive flush re-reads it without committing.
        measure() {
          const box = naturalGeometry(host);
          if (!box) return null;
          return {
            width: { size: box.width, independent: true },
            height: { size: box.height, independent: true },
          };
        },
      });
      measured.current = geometry;
    }
    const parameters = cm.parameters(bindMotionParameters(geometryCompact, "geometry.resize/measured"));
    if (parameters.kind !== "geometry") return;
    // Only an explicit shape revision (a committed class or inline size) is a
    // measured resize; passive reflow and responsive sizing stay native.
    const revision = current.revision(
      "layout",
      JSON.stringify([className ?? "", host.style.width, host.style.height]),
      host,
    );
    measured.current.commit(revision, {
      reduced: cm.reduced,
      transition: parameters.transition,
      available: true,
    });
  });
  committed(
    () => () => {
      measured.current?.dispose();
      measured.current = null;
      transaction.current = null;
    },
    [],
  );

  return (
    <div
      data-slot="skeleton"
      data-state={busy ? "busy" : "idle"}
      {...props}
      {...pulse}
      {...paint}
      style={{ ...style, ...pulse.style, ...paint.style }}
      className={cn("rounded-md bg-accent", cm.reduced && "transform-none", className)}
    />
  );
}

export { Skeleton };
