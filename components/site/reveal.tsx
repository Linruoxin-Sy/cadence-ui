"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { distance, duration, ease, scale } from "@/registry/cadence/lib/motion";
import { useCadenceMotion } from "@/registry/cadence/lib/provider";

/** First paint stays visible. A row revealed after scrolling gets one token-backed entrance. */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const cm = useCadenceMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const box = node.getBoundingClientRect();
    if (box.bottom > 0 && box.top < window.innerHeight) return;
    setVisible(false);
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const show = cm.disabled || visible;
  const tween = cm.transition("reveal");
  const seconds = "duration" in tween ? Number(tween.duration ?? duration.base) : duration.base;
  return (
    <div
      ref={ref}
      onFocusCapture={() => setVisible(true)}
      className={className}
      data-motion={cm.mode}
      data-site-reveal
      style={{
        opacity: show ? 1 : 0,
        transform: cm.reduced || show ? "none" : `translateX(${distance.md}px) scale(${scale.in})`,
        filter: cm.reduced || show ? "none" : "blur(2px)",
        transition:
          cm.disabled || !show
            ? "none"
            : `${cm.reduced ? "opacity" : "opacity, transform, filter"}`
                .split(", ")
                .map((property) => `${property} ${seconds}s cubic-bezier(${ease.out.join(",")})`)
                .join(", "),
      }}
    >
      {children}
    </div>
  );
}
