"use client";

import { type ReactNode, useInsertionEffect, useState } from "react";
import { RevealScopeContext } from "../lib/reveal-context";
import { createViewportReveal, type ViewportRevealOptions } from "../lib/viewport-reveal";

export interface RevealGroupProps extends ViewportRevealOptions {
  children?: ReactNode;
}

/** No extra DOM/data-slot. Child registrations own and release every native resource. */
function RevealGroup({ children, ...options }: RevealGroupProps) {
  const [scope] = useState(() => createViewportReveal(options));
  // Cancel old presentation before any child layout registration uses the new policy.
  // configure only releases old writers; it performs no layout measurement or React update.
  useInsertionEffect(() => scope.configure(options));
  return <RevealScopeContext value={scope}>{children}</RevealScopeContext>;
}

export { RevealGroup };
