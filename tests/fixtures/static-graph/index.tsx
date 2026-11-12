import type { ReactNode } from "react";

/**
 * A deliberately motion-free gate fixture.
 *
 * It is not a shipped registry component. Installation and motion gates use it
 * instead of borrowing a live component, so a later migration cannot turn an
 * unrelated fixture red.
 */
export function StaticFixture({ children }: { children?: ReactNode }) {
  return <div data-slot="static-fixture">{children}</div>;
}
