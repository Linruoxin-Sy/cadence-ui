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

/** First-screen HTML is natural paint. Only a later client insertion may enter. */
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
