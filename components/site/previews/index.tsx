import type { ComponentType } from "react";
import { BadgePreview } from "./badge";
import { ButtonPreview } from "./button";
import { DialogPreview } from "./dialog";
import { KbdPreview } from "./kbd";
import { SeparatorPreview } from "./separator";

/**
 * One preview module per component. Keep the map explicit: a missing entry is a
 * docs defect that the registry check reports, not a silent fallback.
 */
export const previews: Record<string, ComponentType> = {
  button: ButtonPreview,
  badge: BadgePreview,
  kbd: KbdPreview,
  separator: SeparatorPreview,
  dialog: DialogPreview,
};
