"use client";

import { useRender } from "@base-ui/react/use-render";
import { useContext, useState } from "react";
import { cn } from "../lib/cn";
import { useMotionHostRef } from "../lib/motion-ref";
import { useCadenceMotion } from "../lib/provider";
import { createRevealEntrance, RevealEntranceContext, RevealScopeContext } from "../lib/reveal-context";
import { useViewportReveal } from "../lib/use-viewport-reveal";
import { createViewportReveal } from "../lib/viewport-reveal";

export type RevealProps = useRender.ComponentProps<"div", { slot: string; motion: string }>;

/** One native host; nested entrances are consumed by the containing Reveal. */
function Reveal({ render, className, ref: external, ...props }: RevealProps) {
  const inherited = useContext(RevealScopeContext);
  const nested = useContext(RevealEntranceContext);
  const [entrance] = useState(createRevealEntrance);
  const [local] = useState(() => createViewportReveal());
  const { node, ref } = useMotionHostRef<HTMLElement>(external);
  const cm = useCadenceMotion(node);
  useViewportReveal(node, cm, inherited ?? local, cm.reduced, { parent: nested, own: entrance });
  const element = useRender({
    defaultTagName: "div",
    render,
    ref,
    props: { ...props, className: cn(className), "data-slot": "reveal", "data-motion": cm.mode },
    state: { slot: "reveal", motion: cm.mode },
  });
  return <RevealEntranceContext value={entrance}>{element}</RevealEntranceContext>;
}

export { Reveal };
