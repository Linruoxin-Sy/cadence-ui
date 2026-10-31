"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

/**
 * One preview module per component, loaded on demand.
 *
 * The map stays explicit on purpose: a missing entry is a docs defect that the registry
 * check reports, not a silent fallback. Each entry is a `dynamic()` import rather than a
 * static one, so a component page downloads its own preview (and the component it renders)
 * instead of every preview and the whole library in the initial client bundle.
 */
export const previews: Record<string, ComponentType> = {
  button: dynamic(() => import("./button").then((mod) => ({ default: mod.ButtonPreview }))),
  badge: dynamic(() => import("./badge").then((mod) => ({ default: mod.BadgePreview }))),
  kbd: dynamic(() => import("./kbd").then((mod) => ({ default: mod.KbdPreview }))),
  separator: dynamic(() => import("./separator").then((mod) => ({ default: mod.SeparatorPreview }))),
  label: dynamic(() => import("./label").then((mod) => ({ default: mod.LabelPreview }))),
  input: dynamic(() => import("./input").then((mod) => ({ default: mod.InputPreview }))),
  textarea: dynamic(() => import("./textarea").then((mod) => ({ default: mod.TextareaPreview }))),
  card: dynamic(() => import("./card").then((mod) => ({ default: mod.CardPreview }))),
  "aspect-ratio": dynamic(() => import("./aspect-ratio").then((mod) => ({ default: mod.AspectRatioPreview }))),
  avatar: dynamic(() => import("./avatar").then((mod) => ({ default: mod.AvatarPreview }))),
  skeleton: dynamic(() => import("./skeleton").then((mod) => ({ default: mod.SkeletonPreview }))),
  dialog: dynamic(() => import("./dialog").then((mod) => ({ default: mod.DialogPreview }))),
  alert: dynamic(() => import("./alert").then((mod) => ({ default: mod.AlertPreview }))),
  empty: dynamic(() => import("./empty").then((mod) => ({ default: mod.EmptyPreview }))),
  item: dynamic(() => import("./item").then((mod) => ({ default: mod.ItemPreview }))),
  field: dynamic(() => import("./field").then((mod) => ({ default: mod.FieldPreview }))),
  "button-group": dynamic(() => import("./button-group").then((mod) => ({ default: mod.ButtonGroupPreview }))),
  "input-group": dynamic(() => import("./input-group").then((mod) => ({ default: mod.InputGroupPreview }))),
  breadcrumb: dynamic(() => import("./breadcrumb").then((mod) => ({ default: mod.BreadcrumbPreview }))),
  pagination: dynamic(() => import("./pagination").then((mod) => ({ default: mod.PaginationPreview }))),
  spinner: dynamic(() => import("./spinner").then((mod) => ({ default: mod.SpinnerPreview }))),
  checkbox: dynamic(() => import("./checkbox").then((mod) => ({ default: mod.CheckboxPreview }))),
  "radio-group": dynamic(() => import("./radio-group").then((mod) => ({ default: mod.RadioGroupPreview }))),
  switch: dynamic(() => import("./switch").then((mod) => ({ default: mod.SwitchPreview }))),
  slider: dynamic(() => import("./slider").then((mod) => ({ default: mod.SliderPreview }))),
  toggle: dynamic(() => import("./toggle").then((mod) => ({ default: mod.TogglePreview }))),
  "toggle-group": dynamic(() => import("./toggle-group").then((mod) => ({ default: mod.ToggleGroupPreview }))),
  "input-otp": dynamic(() => import("./input-otp").then((mod) => ({ default: mod.InputOtpPreview }))),
  progress: dynamic(() => import("./progress").then((mod) => ({ default: mod.ProgressPreview }))),
  "alert-dialog": dynamic(() => import("./alert-dialog").then((mod) => ({ default: mod.AlertDialogPreview }))),
  popover: dynamic(() => import("./popover").then((mod) => ({ default: mod.PopoverPreview }))),
  tooltip: dynamic(() => import("./tooltip").then((mod) => ({ default: mod.TooltipPreview }))),
  "hover-card": dynamic(() => import("./hover-card").then((mod) => ({ default: mod.HoverCardPreview }))),
  sheet: dynamic(() => import("./sheet").then((mod) => ({ default: mod.SheetPreview }))),
  drawer: dynamic(() => import("./drawer").then((mod) => ({ default: mod.DrawerPreview }))),
  select: dynamic(() => import("./select").then((mod) => ({ default: mod.SelectPreview }))),
  "dropdown-menu": dynamic(() => import("./dropdown-menu").then((mod) => ({ default: mod.DropdownMenuPreview }))),
  "context-menu": dynamic(() => import("./context-menu").then((mod) => ({ default: mod.ContextMenuPreview }))),
  "code-block": dynamic(() => import("./code-block").then((mod) => ({ default: mod.CodeBlockPreview }))),
};
