"use client";
import { useState } from "react";
import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from "@/registry/cadence/bubble";
import type { CadenceMode } from "@/registry/cadence/lib/motion";
import { CadenceProvider } from "@/registry/cadence/lib/provider";

const variants = ["default", "secondary", "muted", "tinted", "outline", "ghost", "destructive"] as const;
export function BubblePreview() {
  const [mode, setMode] = useState<CadenceMode>("full");
  const [variant, setVariant] = useState<(typeof variants)[number]>("muted");
  const [align, setAlign] = useState<"start" | "end">("start");
  const [side, setSide] = useState<"top" | "bottom">("bottom");
  const [reactionAlign, setReactionAlign] = useState<"start" | "end">("end");
  const [messages, setMessages] = useState([{ id: "initial", text: "The registry is ready." }]);
  const [liked, setLiked] = useState(false);
  const [notice, setNotice] = useState("Choose a reply or append local text.");
  return (
    <div className="flex w-full min-w-0 max-w-lg flex-col gap-5">
      <div className="flex flex-wrap gap-3 text-sm">
        <label>
          Bubble motion{" "}
          <select aria-label="Bubble motion" value={mode} onChange={(e) => setMode(e.target.value as CadenceMode)}>
            {["full", "reduced", "none"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Variant{" "}
          <select aria-label="Variant" value={variant} onChange={(e) => setVariant(e.target.value as typeof variant)}>
            {variants.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Alignment{" "}
          <select aria-label="Alignment" value={align} onChange={(e) => setAlign(e.target.value as typeof align)}>
            <option>start</option>
            <option>end</option>
          </select>
        </label>
        <label>
          Reaction side{" "}
          <select aria-label="Reaction side" value={side} onChange={(e) => setSide(e.target.value as typeof side)}>
            <option>bottom</option>
            <option>top</option>
          </select>
        </label>
        <label>
          Reaction alignment{" "}
          <select
            aria-label="Reaction alignment"
            value={reactionAlign}
            onChange={(e) => setReactionAlign(e.target.value as typeof reactionAlign)}
          >
            <option>end</option>
            <option>start</option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded border px-3 py-1 text-sm"
          onClick={() =>
            setMessages((m) => [...m, { id: crypto.randomUUID(), text: `Reply ${m.length + 1}: ready for review.` }])
          }
        >
          Add reply
        </button>
        <button
          type="button"
          className="rounded border px-3 py-1 text-sm"
          onClick={() =>
            setMessages((m) => m.map((v, i) => (i === 0 ? { ...v, text: `${v.text} Another local chunk.` } : v)))
          }
        >
          Append text
        </button>
      </div>
      <CadenceProvider mode={mode} timeScale={4}>
        <BubbleGroup role="group" aria-label="Local conversation" className="gap-8 py-5">
          {messages.map((message, i) => (
            <Bubble key={message.id} variant={variant} align={align} data-testid={`reply-${i}`}>
              <BubbleContent>
                {variant === "destructive" ? `Delivery failed: ${message.text}` : message.text}
              </BubbleContent>
              {i === 0 && (
                <BubbleReactions side={side} align={reactionAlign}>
                  <button
                    type="button"
                    className="rounded-full px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-pressed={liked}
                    aria-label="Thumbs up"
                    onClick={() => setLiked((v) => !v)}
                  >
                    👍 {liked ? 1 : 0}
                  </button>
                </BubbleReactions>
              )}
            </Bubble>
          ))}
          <Bubble align="end">
            <BubbleContent render={<button type="button" onClick={() => setNotice("Reply selected.")} />}>
              Show the review checklist
            </BubbleContent>
          </Bubble>
          <Bubble variant="outline">
            <BubbleContent render={<a href="#bubble-details" />}>Read bubble details</BubbleContent>
          </Bubble>
          <Bubble variant="ghost">
            <BubbleContent>
              Long content wraps:
              extremely-long-continuous-conversation-content-that-must-fit-within-a-small-mobile-viewport-without-overflow.
            </BubbleContent>
          </Bubble>
        </BubbleGroup>
      </CadenceProvider>
      <p role="status" className="text-sm text-muted-foreground">
        {notice}
      </p>
      <p id="bubble-details" className="text-sm text-muted-foreground">
        Local text only. Your application owns transport, message IDs, cancellation, retry and scroll position.
      </p>
    </div>
  );
}
