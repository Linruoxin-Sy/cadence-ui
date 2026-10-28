"use client";

import { motion, type Variants } from "motion/react";
import { cn } from "../lib/cn";
import { stagger as staggerToken } from "../lib/motion";
import { useCadenceMotion } from "../lib/provider";

type TextTag = "h1" | "h2" | "h3" | "p" | "span";

export interface TextRevealProps {
  /** Plain text. Inline markup is intentionally not supported: it would break the word split. */
  children: string;
  /** Semantic element to render. Defaults to a paragraph. */
  as?: TextTag;
  /** Stagger between words in seconds. */
  stagger?: number;
  /** Delay before the first word in seconds. */
  delay?: number;
  /** Replay the reveal when the text re-enters the viewport. */
  once?: boolean;
  className?: string;
}

/**
 * Reveals a heading or paragraph word by word.
 *
 * Motion contract:
 * - enter: each word opacity 0 → 1, y 0.35em → 0, staggered by `stagger`
 * - reduced: the whole text fades once, no stagger, no offset
 * - none: end state immediately
 *
 * a11y: the visible words are `aria-hidden`; the element carries the full string
 * as `aria-label`, so screen readers announce the sentence exactly once.
 */
export function TextReveal({
  children,
  as: Tag = "p",
  stagger = staggerToken.word,
  delay = 0,
  once = true,
  className,
}: TextRevealProps) {
  const cm = useCadenceMotion();
  const words = children.split(/\s+/).filter(Boolean);

  if (cm.reduced || words.length < 2) {
    return (
      <Tag className={cn("inline-block", className)}>
        <motion.span
          data-slot="text-reveal"
          data-motion={cm.mode}
          className="inline"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once, margin: "-10% 0px" }}
          transition={cm.transition("reveal", { delay })}
        >
          {children}
        </motion.span>
      </Tag>
    );
  }

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren: delay } },
  };
  const word: Variants = {
    hidden: { opacity: 0, y: "0.35em" },
    show: { opacity: 1, y: 0, transition: cm.transition("text.reveal") },
  };

  return (
    <Tag className={cn("inline-block", className)} aria-label={children}>
      <motion.span
        data-slot="text-reveal"
        data-motion={cm.mode}
        aria-hidden="true"
        className="inline"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once, margin: "-10% 0px" }}
      >
        {words.map((text, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: duplicate words need the index to stay unique
          <span key={`${text}-${index}`}>
            <motion.span className="inline-block will-change-[opacity,transform]" variants={word}>
              {text}
            </motion.span>
            {index < words.length - 1 ? " " : null}
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}
