import { useState } from "react";
import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from "../../registry/cadence/bubble";

/** Real registry parts; shape changes belong to this regression input, not site configuration. */
export function BubbleMotionFixture() {
  const variants = ["muted", "outline", "secondary", "tinted", "ghost", "destructive", "default"] as const;
  const [variantIndex, setVariantIndex] = useState(0);
  const [align, setAlign] = useState<"start" | "end">("start");
  const [side, setSide] = useState<"top" | "bottom">("bottom");
  const [reactionAlign, setReactionAlign] = useState<"start" | "end">("end");
  const [liked, setLiked] = useState(false);
  const [messages, setMessages] = useState([{ id: "initial", text: "Initial message" }]);
  return (
    <div>
      <button
        type="button"
        onClick={() =>
          setMessages((items) => [...items, { id: `reply-${items.length}`, text: `Reply ${items.length}` }])
        }
      >
        Add fixture reply
      </button>
      <BubbleGroup className="gap-10 py-6">
        {messages.map((message, index) => (
          <Bubble key={message.id} data-testid={`reply-${index}`} variant={variants[variantIndex]} align={align}>
            <BubbleContent
              render={<button type="button" />}
              onKeyDown={(event) => {
                if (event.key === "F2") setVariantIndex((value) => (value + 1) % variants.length);
                else if (event.key === "F3") setAlign((value) => (value === "start" ? "end" : "start"));
                else if (event.key === "F4") setSide((value) => (value === "bottom" ? "top" : "bottom"));
                else if (event.key === "F6") setReactionAlign((value) => (value === "end" ? "start" : "end"));
                else if (event.key === "F7")
                  setMessages((items) =>
                    items.map((item, i) =>
                      i === index ? { ...item, text: `${item.text} Another local chunk.` } : item,
                    ),
                  );
                else return;
                event.preventDefault();
              }}
            >
              {message.text}
            </BubbleContent>
            {index === 0 && (
              <BubbleReactions side={side} align={reactionAlign}>
                <button
                  type="button"
                  aria-label="Thumbs up"
                  aria-pressed={liked}
                  onClick={() => setLiked((value) => !value)}
                >
                  👍 {liked ? 1 : 0}
                </button>
              </BubbleReactions>
            )}
          </Bubble>
        ))}
      </BubbleGroup>
    </div>
  );
}
