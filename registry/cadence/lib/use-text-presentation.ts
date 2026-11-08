"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type { MotionHostRef } from "./motion-ref";
import { createMotionTransaction } from "./motion-transaction";
import type { CadenceMotion } from "./provider";
import { createTextPresentation, type TextPresentationCommit } from "./text-presentation";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Internal string-only adapter; render the returned SSR text exactly once.
 * Caller keeps the native host, props/events/ref and semantic slot identity.
 * Rich children and absent/falsy branches are resolved *before* this boundary.
 */
export function useTextPresentation(
  host: MotionHostRef<HTMLElement>,
  value: string,
  cm: CadenceMotion,
  entity: unknown,
  options: Partial<
    Pick<TextPresentationCommit, "locale" | "characterStagger" | "visible" | "capture" | "sourceRetired">
  > = {},
  supplied?: ReturnType<typeof createMotionTransaction>,
) {
  const initial = useRef(value);
  const local = useRef<ReturnType<typeof createMotionTransaction> | null>(null);
  if (!local.current) local.current = createMotionTransaction();
  const transaction = supplied ?? local.current;
  const connected = useRef<{
    element: HTMLElement;
    identity: object | undefined;
    transaction: typeof transaction;
    controller: ReturnType<typeof createTextPresentation>;
    source: object;
  } | null>(null);
  committed(() => {
    const old = connected.current;
    if (old && (old.element !== host.current || old.identity !== host.identity || old.transaction !== transaction)) {
      connected.current = null;
      old.controller.dispose();
    }
    if (!connected.current && host.current) {
      connected.current = {
        element: host.current,
        identity: host.identity,
        transaction,
        controller: createTextPresentation(host.current, transaction),
        source: {},
      };
    }
    const connection = connected.current;
    host.invalidate = () => {
      connected.current = null;
      connection?.controller.dispose();
    };
    // Explicit full/reduced/none branch; never enter a hidden initial state.
    connection?.controller.commit({
      ...options,
      value,
      entity,
      cm,
      characterStagger: cm.reduced ? false : options.characterStagger,
      revision: transaction.revision("content", value, connection.source),
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
