"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type { MotionHostRef } from "./motion-ref";
import { createMotionTransaction } from "./motion-transaction";
import { createNumberSnapshot, type NumberDisplay, type NumericValue } from "./number-plan";
import { createNumberPresentation, type NumberPresentationCommit } from "./number-presentation";
import type { CadenceMotion } from "./provider";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Numeric display adapter. Return the actual SSR value once, retain one native
 * Text node and commit formatting only when accepted inputs change. */
export function useNumberPresentation(
  host: MotionHostRef<HTMLElement>,
  value: NumericValue,
  cm: CadenceMotion,
  entity: unknown,
  options: Partial<
    Pick<NumberPresentationCommit, "cause" | "direction" | "compact" | "visible" | "externalGeometry">
  > & { display?: NumberDisplay; revision?: NumberPresentationCommit["revision"] } = {},
  supplied?: ReturnType<typeof createMotionTransaction>,
) {
  const initial = useRef<string | null>(null);
  if (initial.current === null) initial.current = createNumberSnapshot(value, options.display).text;
  const local = useRef<ReturnType<typeof createMotionTransaction> | null>(null);
  if (!local.current) local.current = createMotionTransaction();
  const transaction = supplied ?? local.current;
  const connected = useRef<{
    element: HTMLElement;
    identity: object | undefined;
    transaction: typeof transaction;
    controller: ReturnType<typeof createNumberPresentation>;
    source: object;
    value?: NumericValue;
    display?: NumberDisplay;
    snapshot?: ReturnType<typeof createNumberSnapshot>;
  } | null>(null);
  committed(() => {
    const old = connected.current;
    if (old && (old.element !== host.current || old.identity !== host.identity || old.transaction !== transaction)) {
      connected.current = null;
      old.controller.dispose();
    }
    if (!connected.current && host.current)
      connected.current = {
        element: host.current,
        identity: host.identity,
        transaction,
        controller: createNumberPresentation(host.current, transaction),
        source: {},
      };
    const connection = connected.current;
    host.invalidate = () => {
      connected.current = null;
      connection?.controller.dispose();
    };
    if (!connection) return;
    if (!connection.snapshot || !Object.is(value, connection.value) || options.display !== connection.display) {
      connection.snapshot = createNumberSnapshot(value, options.display);
      connection.value = value;
      connection.display = options.display;
    }
    connection.controller.commit({
      ...options,
      snapshot: connection.snapshot,
      entity,
      cm,
      visible: options.visible,
      revision: options.revision ?? transaction.revision("value", value, connection.source),
      direction: cm.reduced ? undefined : options.direction,
    });
  });
  committed(
    () => () => {
      const old = connected.current;
      connected.current = null;
      old?.controller.dispose();
      host.invalidate = undefined;
    },
    [host],
  );
  return initial.current;
}
