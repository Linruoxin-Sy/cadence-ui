"use client";

import { useEffect, useInsertionEffect, useLayoutEffect, useRef } from "react";
import type { MotionHostRef } from "./motion-ref";
import { createMotionTransaction } from "./motion-transaction";
import type { CadenceMotion } from "./provider";
import { createTextPresentation, type TextPresentationCommit } from "./text-presentation";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** One native Text node. A compound display may switch its controller without replacing the host. */
export function useTextPresentation(
  host: MotionHostRef<HTMLElement>,
  value: string,
  cm: CadenceMotion,
  entity: unknown,
  options: Partial<
    Pick<
      TextPresentationCommit,
      "locale" | "granularity" | "characterStagger" | "visible" | "capture" | "sourceRetired" | "nativeBaseline"
    >
  > & { enabled?: boolean; initialText?: string } = {},
  supplied?: ReturnType<typeof createMotionTransaction>,
) {
  const initial = useRef(options.initialText ?? value);
  const local = useRef<ReturnType<typeof createMotionTransaction> | null>(null);
  if (!local.current) local.current = createMotionTransaction();
  const transaction = supplied ?? local.current;
  type Connection = {
    element: HTMLElement;
    host: MotionHostRef<HTMLElement>;
    identity: object | undefined;
    transaction: typeof transaction;
    controller: ReturnType<typeof createTextPresentation>;
    source: object;
    dispose(): void;
  };
  const connected = useRef<Connection | null>(null);
  const enabled = options.enabled !== false;
  // Retire the previous form before any successor's layout commit can allocate paint.
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
        controller: createTextPresentation(host.current, transaction),
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
    connection.controller.commit({
      ...options,
      value,
      entity,
      cm,
      characterStagger: cm.reduced ? false : options.characterStagger,
      revision: transaction.revision("content", value, connection.source),
    });
  });
  committed(() => () => connected.current?.dispose(), []);
  return initial.current;
}
