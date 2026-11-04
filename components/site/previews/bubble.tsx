"use client";

import { useId, useRef, useState } from "react";
import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from "@/registry/cadence/bubble";
import { Button } from "@/registry/cadence/button";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { PreviewStack } from "./shell";

function Conversation() {
  const [expanded, setExpanded] = useState(false);
  return (
    <BubbleGroup role="group" aria-label="Review conversation" className="w-full max-w-lg gap-4">
      <Bubble variant="muted">
        <BubbleContent>The registry is ready for review.</BubbleContent>
      </Bubble>
      <Bubble align="end">
        <BubbleContent
          render={<button type="button" />}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Review the API, keyboard paths, and motion modes." : "Show the review checklist"}
        </BubbleContent>
      </Bubble>
      <Bubble variant="outline">
        <BubbleContent render={<a href="#links-and-buttons" />}>Read bubble examples</BubbleContent>
      </Bubble>
    </BubbleGroup>
  );
}

function Variants() {
  const variants = ["default", "secondary", "muted", "tinted", "outline", "ghost", "destructive"] as const;
  return (
    <BubbleGroup role="group" aria-label="Bubble variants" className="w-full max-w-lg gap-3">
      {variants.map((variant) => (
        <Bubble key={variant} variant={variant}>
          <BubbleContent>{variant === "destructive" ? "destructive: Message delivery failed." : variant}</BubbleContent>
        </Bubble>
      ))}
    </BubbleGroup>
  );
}

function Alignment() {
  return (
    <BubbleGroup role="group" aria-label="Message alignment" className="w-full max-w-lg gap-4">
      <Bubble variant="muted" align="start">
        <BubbleContent>Incoming: aligned to the start.</BubbleContent>
      </Bubble>
      <Bubble align="end">
        <BubbleContent>Outgoing: aligned to the end.</BubbleContent>
      </Bubble>
    </BubbleGroup>
  );
}

function ConsecutiveMessages() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <BubbleGroup role="group" aria-label="Alex's messages">
        <Bubble variant="muted">
          <BubbleContent>Alex: First thought.</BubbleContent>
        </Bubble>
        <Bubble variant="muted">
          <BubbleContent>
            Long content wraps:
            extremely-long-continuous-conversation-content-that-must-fit-within-a-small-mobile-viewport-without-overflow.
          </BubbleContent>
        </Bubble>
      </BubbleGroup>
      <BubbleGroup role="group" aria-label="Your reply">
        <Bubble align="end">
          <BubbleContent>You: I'll check both points.</BubbleContent>
        </Bubble>
      </BubbleGroup>
    </div>
  );
}

function LinksAndButtons() {
  const [selected, setSelected] = useState(false);
  const detailsId = useId();
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <BubbleGroup className="gap-4">
        <Bubble variant="outline">
          <BubbleContent render={<a href={`#${detailsId}`} />}>Read local message details</BubbleContent>
        </Bubble>
        <Bubble>
          <BubbleContent
            render={<button type="button" />}
            aria-pressed={selected}
            onClick={() => setSelected((value) => !value)}
          >
            {selected ? "Review reply selected" : "Select review reply"}
          </BubbleContent>
        </Bubble>
      </BubbleGroup>
      <p id={detailsId} className="text-sm text-muted-foreground">
        Message details stay in this local example.
      </p>
    </div>
  );
}

function Reactions() {
  const [liked, setLiked] = useState(false);
  const positions = [
    { side: "top", align: "start" },
    { side: "top", align: "end" },
    { side: "bottom", align: "start" },
    { side: "bottom", align: "end" },
  ] as const;
  return (
    <BubbleGroup role="group" aria-label="Reaction positions" className="w-full max-w-lg gap-10 py-6">
      {positions.map(({ side, align }) => (
        <Bubble key={`${side}-${align}`} variant="muted">
          <BubbleContent>
            Reactions at {side} / {align}.
          </BubbleContent>
          <BubbleReactions side={side} align={align} role="img" aria-label="Reaction: fire">
            🔥
          </BubbleReactions>
        </Bubble>
      ))}
      <Bubble variant="outline">
        <BubbleContent>Was this answer helpful?</BubbleContent>
        <BubbleReactions>
          <button
            type="button"
            className="rounded-full px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-pressed={liked}
            aria-label={`👍 ${liked ? 1 : 0} thumbs up`}
            onClick={() => setLiked((value) => !value)}
          >
            👍 {liked ? 1 : 0}
          </button>
        </BubbleReactions>
      </Bubble>
    </BubbleGroup>
  );
}

function UpdatingText() {
  const [messages, setMessages] = useState([{ id: "initial", text: "The registry is ready." }]);
  const [notice, setNotice] = useState("Local message updates only.");
  const helpId = useId();
  const append = () =>
    setMessages((items) =>
      items.map((item, index) => (index === 0 ? { ...item, text: `${item.text} Another local chunk.` } : item)),
    );
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setMessages((items) => [
              ...items,
              { id: `reply-${items.length}`, text: `Reply ${items.length + 1}: ready for review.` },
            ]);
            setNotice("A local reply was added.");
          }}
        >
          Add reply
        </Button>
        <Button variant="outline" onClick={append}>
          Append text
        </Button>
      </div>
      <p id={helpId} className="text-sm text-muted-foreground">
        Focus the first message and press F2 to append without moving focus.
      </p>
      <BubbleGroup role="group" aria-label="Updating conversation" className="gap-4">
        {messages.map((message, index) => (
          <Bubble key={message.id} variant="muted" data-message-id={message.id}>
            <BubbleContent
              render={<button type="button" />}
              aria-describedby={index === 0 ? helpId : undefined}
              onClick={() => setNotice(`Selected ${message.id}.`)}
              onKeyDown={(event) => {
                if (index === 0 && event.key === "F2") {
                  event.preventDefault();
                  append();
                }
              }}
            >
              {message.text}
            </BubbleContent>
          </Bubble>
        ))}
      </BubbleGroup>
      <p role="status" className="text-sm text-muted-foreground">
        {notice}
      </p>
    </div>
  );
}

function CustomParts() {
  const [count, setCount] = useState(0);
  const [align, setAlign] = useState<"start" | "end">("start");
  const content = useRef<HTMLElement>(null);
  const helpId = useId();
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <Button variant="outline" onClick={() => content.current?.focus()}>
        Focus custom reply
      </Button>
      <BubbleGroup role="group" aria-label="Custom reply" className="gap-4">
        <Bubble
          variant="outline"
          align={align}
          className="max-w-full"
          style={{ borderRadius: "var(--radius)" }}
          onKeyDown={(event) => {
            if (event.key === "F2") {
              event.preventDefault();
              setAlign((value) => (value === "start" ? "end" : "start"));
            }
          }}
        >
          <BubbleContent
            ref={(node) => {
              content.current = node;
            }}
            className="px-4"
            style={{ fontWeight: 500 }}
            aria-describedby={helpId}
            onClick={() => setCount((value) => value + 1)}
            render={(props, state) => (
              <button {...props} type="button" data-render-slot={(state as { slot?: string }).slot} />
            )}
          >
            Custom reply · {count}
          </BubbleContent>
        </Bubble>
      </BubbleGroup>
      <p id={helpId} className="text-sm text-muted-foreground">
        Enter or Space counts an activation. F2 changes alignment on the same node.
      </p>
    </div>
  );
}

function WithoutMotion() {
  return (
    <CadenceProvider mode="none">
      <BubbleGroup className="w-full max-w-lg">
        <Bubble variant="muted">
          <BubbleContent>This message is visible immediately.</BubbleContent>
        </Bubble>
      </BubbleGroup>
    </CadenceProvider>
  );
}

const examples = {
  variants: Variants,
  alignment: Alignment,
  "consecutive-messages": ConsecutiveMessages,
  "links-and-buttons": LinksAndButtons,
  reactions: Reactions,
  "updating-text": UpdatingText,
  "custom-parts": CustomParts,
  "without-motion": WithoutMotion,
};

export function BubblePreview({ example }: { example?: string }) {
  const Example = example ? examples[example as keyof typeof examples] : Conversation;
  if (!Example) throw new Error(`Unknown Bubble example: ${example}`);
  return (
    <PreviewStack>
      <Example />
    </PreviewStack>
  );
}
