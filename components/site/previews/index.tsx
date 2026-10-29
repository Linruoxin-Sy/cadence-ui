import type { ComponentType } from "react";
import { BadgePreview } from "./badge";
import { ButtonPreview } from "./button";
import { DialogPreview } from "./dialog";
import { InputPreview } from "./input";
import { KbdPreview } from "./kbd";
import { LabelPreview } from "./label";
import { SeparatorPreview } from "./separator";
import { TextareaPreview } from "./textarea";

/**
 * One preview module per component. Keep the map explicit: a missing entry is a
 * docs defect that the registry check reports, not a silent fallback.
 */
export const previews: Record<string, ComponentType> = {
  button: ButtonPreview,
  badge: BadgePreview,
  kbd: KbdPreview,
  separator: SeparatorPreview,
  label: LabelPreview,
  input: InputPreview,
  textarea: TextareaPreview,
  dialog: DialogPreview,
};
