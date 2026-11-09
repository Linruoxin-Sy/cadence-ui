"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type { MotionHostRef } from "./motion-ref";
import type { CadenceMotion } from "./provider";
import type { RevealEntrance } from "./reveal-context";
import type { createViewportReveal } from "./viewport-reveal";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
type Scope = ReturnType<typeof createViewportReveal>;

/** Internal physical-lifetime adapter. Group configuration belongs to its committed owner. */
export function useViewportReveal(
  host: MotionHostRef<HTMLElement>,
  cm: CadenceMotion,
  group: Scope,
  bypass = false,
  entrance?: { parent: RevealEntrance | null; own: RevealEntrance },
) {
  const identity = useRef<object>({});
  const connection = useRef<{
    element: HTMLElement;
    physical: object | undefined;
    group: Scope;
    target: ReturnType<Scope["register"]>;
    release: () => void;
  } | null>(null);
  committed(() => {
    const old = connection.current;
    // Moving an existing native host to another group is a baseline, not another entrance.
    const transferred = old?.element === host.current && old.physical === host.identity && old.group !== group;
    if (old && (old.element !== host.current || old.physical !== host.identity || old.group !== group)) {
      connection.current = null;
      old.release();
      old.target.dispose();
      identity.current = {};
    }
    if (!connection.current && host.current) {
      const target = group.register(
        host.current,
        identity.current,
        cm,
        bypass || transferred || entrance?.parent?.active,
      );
      const publish = () => entrance?.own.publish(Boolean(entrance.parent?.active) || target.state !== "visible");
      const own = target.subscribe(publish);
      const parent = entrance?.parent?.subscribe(() => {
        if (entrance.parent?.active) target.reveal();
        publish();
      });
      connection.current = {
        element: host.current,
        physical: host.identity,
        group,
        target,
        release: () => {
          own();
          parent?.();
        },
      };
    }
    const current = connection.current;
    host.invalidate = () => {
      connection.current = null;
      current?.release();
      current?.target.dispose();
      identity.current = {};
    };
    current?.target.commit(cm);
    if (bypass) current?.target.reveal();
  });
  committed(
    () => () => {
      const old = connection.current;
      connection.current = null;
      old?.release();
      old?.target.dispose();
      host.invalidate = undefined;
    },
    [host],
  );
}
