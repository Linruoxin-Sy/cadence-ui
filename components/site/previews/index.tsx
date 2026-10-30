import type { ComponentType } from "react";
import { AlertPreview } from "./alert";
import { AspectRatioPreview } from "./aspect-ratio";
import { AvatarPreview } from "./avatar";
import { BadgePreview } from "./badge";
import { ButtonPreview } from "./button";
import { CardPreview } from "./card";
import { DialogPreview } from "./dialog";
import { EmptyPreview } from "./empty";
import { InputPreview } from "./input";
import { ItemPreview } from "./item";
import { KbdPreview } from "./kbd";
import { LabelPreview } from "./label";
import { SeparatorPreview } from "./separator";
import { SkeletonPreview } from "./skeleton";
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
  card: CardPreview,
  "aspect-ratio": AspectRatioPreview,
  avatar: AvatarPreview,
  skeleton: SkeletonPreview,
  dialog: DialogPreview,
  alert: AlertPreview,
  empty: EmptyPreview,
  item: ItemPreview,
};
