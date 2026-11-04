import "server-only";

import type { ComponentType } from "react";
import { assertComponentExample } from "@/lib/component-examples";
import { PreviewFrameClient } from "./preview-frame";

export type PreviewComponent = ComponentType<{ example?: string }>;

/** Both top and body specimens use the route's single preview reference. */
export function PreviewFrame({
  id,
  example,
  component: Component,
}: {
  id: string;
  example?: string;
  component: PreviewComponent;
}) {
  if (example !== undefined) assertComponentExample(id, example);
  return (
    <PreviewFrameClient id={id} example={example}>
      <Component example={example} />
    </PreviewFrameClient>
  );
}
