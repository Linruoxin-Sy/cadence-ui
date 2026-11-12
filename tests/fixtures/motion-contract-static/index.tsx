import type { ReactNode } from "react";

/**
 * A deliberately static motion-contract gate fixture.
 *
 * It is not a shipped registry component. The contract declares one colour
 * action with no installed owner so the gate must reject it without borrowing a
 * live component's future migration state.
 */
export function StaticFixture({ children }: { children?: ReactNode }) {
  return <div data-slot="static-fixture">{children}</div>;
}
