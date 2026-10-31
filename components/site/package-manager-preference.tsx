"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { DEFAULT_PACKAGE_MANAGER, isPackageManager, PACKAGE_MANAGER_KEY, type PackageManager } from "./package-manager";

interface PackageManagerValue {
  manager: PackageManager;
  setManager: (manager: PackageManager) => void;
}

const PackageManagerContext = createContext<PackageManagerValue | null>(null);

/** Storage can be unavailable (privacy mode, a sandboxed frame); the default stands in. */
function readStored(): PackageManager {
  try {
    const stored = localStorage.getItem(PACKAGE_MANAGER_KEY);
    return isPackageManager(stored) ? stored : DEFAULT_PACKAGE_MANAGER;
  } catch {
    return DEFAULT_PACKAGE_MANAGER;
  }
}

/**
 * One package manager for the whole site.
 *
 * The choice belongs to the reader, not to a block: someone who runs pnpm does not
 * want to make the same choice on every page, and two switchers on one page that
 * could disagree are worse than no switcher. So the state lives above the tree and
 * every switcher renders it — a click in one block moves every block on the page, and
 * a click on any page is still there on the next visit.
 *
 * Precedence is `localStorage` → pnpm. The server cannot read storage, so the first
 * paint is pnpm and the effect corrects it after hydration. That is the same trade the
 * theme and the motion mode already make: the preference is a property of the reader,
 * not something the static HTML can promise.
 *
 * Another tab is the same reader, so a `storage` event from a sibling tab is applied
 * too; `storage` is the only event that crosses that boundary.
 */
export function PackageManagerProvider({ children }: { children: ReactNode }) {
  const [manager, setManagerState] = useState<PackageManager>(DEFAULT_PACKAGE_MANAGER);

  useEffect(() => {
    setManagerState(readStored());

    const onStorage = (event: StorageEvent) => {
      if (event.key !== PACKAGE_MANAGER_KEY) return;
      // A removed key is a reader who reset the preference, not a manager to show.
      if (event.newValue === null) setManagerState(DEFAULT_PACKAGE_MANAGER);
      else if (isPackageManager(event.newValue)) setManagerState(event.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setManager = useCallback((next: PackageManager) => {
    setManagerState(next);
    try {
      localStorage.setItem(PACKAGE_MANAGER_KEY, next);
    } catch {
      // the switch still works for this page.
    }
  }, []);

  return <PackageManagerContext.Provider value={{ manager, setManager }}>{children}</PackageManagerContext.Provider>;
}

/**
 * Read the site-wide choice. The fallback keeps a block rendered outside the provider
 * readable — it shows pnpm — but there is nothing to write the choice to, so it never
 * changes. Every switcher on this site renders inside the provider.
 */
export function usePackageManager(): PackageManagerValue {
  return useContext(PackageManagerContext) ?? { manager: DEFAULT_PACKAGE_MANAGER, setManager: () => {} };
}
