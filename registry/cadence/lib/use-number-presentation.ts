"use client";

import { useEffect, useInsertionEffect, useLayoutEffect, useRef } from "react";
import type { MotionHostRef } from "./motion-ref";
import { createMotionTransaction } from "./motion-transaction";
import { createNumberSnapshot, type NumberDisplay, type NumericValue } from "./number-plan";
import { createNumberPresentation, type NumberPresentationCommit } from "./number-presentation";
import type { CadenceMotion } from "./provider";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Quantity controller on one retained native host, including compound primitive dispatch. */
export function useNumberPresentation(
  host: MotionHostRef<HTMLElement>,
  value: NumericValue,
  cm: CadenceMotion,
  entity: unknown,
  options: Partial<
    Pick<
      NumberPresentationCommit,
      "cause" | "direction" | "compact" | "visible" | "externalGeometry" | "retainEditedContent" | "nativeBaseline"
    >
  > & {
    display?: NumberDisplay;
    revision?: NumberPresentationCommit["revision"];
    enabled?: boolean;
    initialText?: string;
  } = {},
  supplied?: ReturnType<typeof createMotionTransaction>,
) {
  const initial = useRef<string | null>(null);
  if (initial.current === null)
    initial.current = options.initialText ?? createNumberSnapshot(value, options.display).text;
  const local = useRef<ReturnType<typeof createMotionTransaction> | null>(null);
  if (!local.current) local.current = createMotionTransaction();
  const transaction = supplied ?? local.current;
  type Connection = {
    element: HTMLElement;
    host: MotionHostRef<HTMLElement>;
    identity: object | undefined;
    transaction: typeof transaction;
    controller: ReturnType<typeof createNumberPresentation>;
    source: object;
    value?: NumericValue;
    display?: NumberDisplay;
    snapshot?: ReturnType<typeof createNumberSnapshot>;
    dispose(): void;
  };
  const connected = useRef<Connection | null>(null);
  const enabled = options.enabled !== false;
  useInsertionEffect(() => {
    if (!enabled) connected.current?.dispose();
  }, [enabled]);
  committed(() => {
    if (!enabled) {
      connected.current?.dispose();
      return;
    }
    const old = connected.current;
    if (
      old &&
      (old.host !== host ||
        old.element !== host.current ||
        old.identity !== host.identity ||
        old.transaction !== transaction)
    )
      old.dispose();
    if (!connected.current && host.current) {
      const connection: Connection = {
        element: host.current,
        host,
        identity: host.identity,
        transaction,
        controller: createNumberPresentation(host.current, transaction),
        source: {},
        dispose() {
          if (connected.current === connection) connected.current = null;
          if (host.invalidate === connection.dispose) host.invalidate = undefined;
          connection.controller.dispose();
        },
      };
      connected.current = connection;
    }
    const connection = connected.current;
    if (!connection) return;
    host.invalidate = connection.dispose;
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
  committed(() => () => connected.current?.dispose(), []);
  return initial.current;
}
