"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type { MotionHostRef } from "./motion-ref";
import type { CadenceMotion } from "./provider";
import type { createViewportReveal } from "./viewport-reveal";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
type Scope = ReturnType<typeof createViewportReveal>;

/** Internal physical-lifetime adapter. Group configuration belongs to its committed owner. */
export function useViewportReveal(host: MotionHostRef<HTMLElement>, cm: CadenceMotion, group: Scope) {
  const identity = useRef<object>({});
  const connection = useRef<{
    element: HTMLElement;
    physical: object | undefined;
    group: Scope;
    target: ReturnType<Scope["register"]>;
  } | null>(null);
  committed(() => {
    const old = connection.current;
    if (old && (old.element !== host.current || old.physical !== host.identity || old.group !== group)) {
      connection.current = null;
      old.target.dispose();
      identity.current = {};
    }
    if (!connection.current && host.current)
      connection.current = {
        element: host.current,
        physical: host.identity,
        group,
        target: group.register(host.current, identity.current, cm),
      };
    const current = connection.current;
    host.invalidate = () => {
      connection.current = null;
      current?.target.dispose();
      identity.current = {};
    };
    current?.target.commit(cm);
  });
  committed(
    () => () => {
      const old = connection.current;
      connection.current = null;
      old?.target.dispose();
      host.invalidate = undefined;
    },
    [host],
  );
}
