"use client";

import { createContext } from "react";
import type { createViewportReveal } from "./viewport-reveal";

export const RevealScopeContext = createContext<ReturnType<typeof createViewportReveal> | null>(null);
export function createRevealEntrance() {
  let active = true;
  const listeners = new Set<() => void>();
  return {
    get active() {
      return active;
    },
    publish(next: boolean) {
      if (next === active) return;
      active = next;
      for (const listener of listeners) listener();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      listener();
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
export type RevealEntrance = ReturnType<typeof createRevealEntrance>;
export const RevealEntranceContext = createContext<RevealEntrance | null>(null);
