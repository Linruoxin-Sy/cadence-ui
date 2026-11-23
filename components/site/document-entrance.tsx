"use client";

import { type ReactNode, type RefObject, useRef, useState } from "react";
import {
  createPresentationScope,
  MotionPresentation,
  usePresenceEntrance,
} from "@/registry/cadence/lib/motion-presence";
import { useCadenceMotion } from "@/registry/cadence/lib/provider";

export interface DocumentEntranceProps {
  children: ReactNode;
  className?: string;
  as?: "article" | "div" | "section";
}

/**
 * Visible-first site entrance (distribution guide §2.4, animation system §3.3).
 *
 * The server paints final content: this component writes no hidden style, so SSR, no-JS, print,
 * hydration and the first client commit are readable without a repair rule. Only a later eligible
 * client insertion — a route change or remount — may enter, and an entrance that is consumed is never
 * re-hidden or replayed. There is no intersection observer here: the document is already visible, so
 * the entrance has no viewport cause (unlike `Reveal`, which owns one).
 *
 * The outer node is the article's layout slot (the grid item on a component page's `xl` layout).
 */
export function DocumentEntrance({ children, className, as: Tag = "div" }: DocumentEntranceProps) {
  const ref = useRef<HTMLElement>(null);
  const cm = useCadenceMotion(ref);
  const [scope] = useState(createPresentationScope);
  usePresenceEntrance(ref, cm, "reveal", true);
  return (
    <div className="min-w-0" data-document-entrance-frame>
      <Tag ref={ref as RefObject<HTMLDivElement>} data-document-entrance data-motion={cm.mode} className={className}>
        <MotionPresentation scope={scope}>{children}</MotionPresentation>
      </Tag>
    </div>
  );
}
