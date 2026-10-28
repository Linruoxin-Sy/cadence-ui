"use client";

import { useState } from "react";
import { AnimatedTabs } from "@/registry/cadence/animated-tabs/animated-tabs";
import { FadeIn } from "@/registry/cadence/fade-in/fade-in";
import { MorphButton, type MorphButtonState } from "@/registry/cadence/morph-button/morph-button";
import { MotionAccordion } from "@/registry/cadence/motion-accordion/motion-accordion";
import { MotionDialog } from "@/registry/cadence/motion-dialog/motion-dialog";
import { NumberFlow } from "@/registry/cadence/number-flow/number-flow";
import { TextReveal } from "@/registry/cadence/text-reveal/text-reveal";

const panel = "rounded-xl border border-border bg-background p-6";

function Replay({ children }: { children: React.ReactNode }) {
  const [key, setKey] = useState(0);
  return (
    <div className="space-y-4">
      <div key={key}>{children}</div>
      <button
        type="button"
        onClick={() => setKey((value) => value + 1)}
        className="text-xs font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        Replay
      </button>
    </div>
  );
}

function FadeInDemo() {
  return (
    <Replay>
      <FadeIn>
        <div className="rounded-lg border border-border bg-muted/40 p-6">
          <p className="text-sm font-medium">Content arrives when it enters the viewport.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Opacity and a 12px rise, or opacity alone when motion is reduced.
          </p>
        </div>
      </FadeIn>
    </Replay>
  );
}

function TextRevealDemo() {
  return (
    <Replay>
      <TextReveal as="h3" className="text-2xl font-semibold tracking-tight">
        Motion that explains what just happened
      </TextReveal>
    </Replay>
  );
}

function NumberFlowDemo() {
  const [value, setValue] = useState(12480);
  return (
    <div className="space-y-4">
      <NumberFlow value={value} prefix="$" announce className="text-3xl font-semibold tracking-tight" />
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-md border border-border px-3 py-1.5 text-xs"
          onClick={() => setValue((v) => v + 1280)}
        >
          Add $1,280
        </button>
        <button
          type="button"
          className="rounded-md border border-border px-3 py-1.5 text-xs"
          onClick={() => setValue(980)}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function MorphButtonDemo() {
  const [state, setState] = useState<MorphButtonState>("idle");
  const labels = { idle: "Save changes", loading: "Saving", success: "Saved", error: "Try again" } as const;
  return (
    <div className="space-y-4">
      <MorphButton state={state} labels={labels} variant={state === "error" ? "danger" : "primary"}>
        Save changes
      </MorphButton>
      <div className="flex flex-wrap gap-2">
        {(["idle", "loading", "success", "error"] as const).map((next) => (
          <button
            key={next}
            type="button"
            onClick={() => setState(next)}
            className="rounded-md border border-border px-2.5 py-1 text-xs capitalize"
          >
            {next}
          </button>
        ))}
      </div>
    </div>
  );
}

function TabsDemo() {
  return (
    <AnimatedTabs
      defaultValue="overview"
      items={[
        { value: "overview", label: "Overview", content: "Workspace stats and activity, mounted only while selected." },
        {
          value: "projects",
          label: "Projects",
          content: "Milestones and deadlines. Switch tabs to see the shared indicator move.",
        },
        { value: "account", label: "Account", content: "Profile and preferences." },
      ]}
    />
  );
}

function AccordionDemo() {
  return (
    <MotionAccordion
      defaultValue="billing"
      items={[
        {
          value: "billing",
          trigger: "How does billing work?",
          content: "Monthly or yearly, cancel any time. The panel height springs instead of jumping.",
        },
        {
          value: "cancel",
          trigger: "Can I cancel?",
          content: "Yes, from settings. The open panel animates closed and the next one opens.",
        },
      ]}
    />
  );
}

function DialogDemo() {
  return (
    <MotionDialog
      trigger="Delete project"
      title="Delete this project?"
      description="This removes every deployment and cannot be undone."
    >
      <div className="flex justify-end gap-2">
        <button type="button" className="rounded-md border border-border px-3 py-1.5 text-xs">
          Cancel
        </button>
        <button type="button" className="rounded-md bg-destructive px-3 py-1.5 text-xs text-white">
          Delete project
        </button>
      </div>
    </MotionDialog>
  );
}

function ScrollProgressDemo() {
  return (
    <div className="space-y-3 text-sm text-muted-foreground">
      <div className="relative h-1 w-full overflow-hidden rounded-full bg-muted">
        <div className="absolute inset-y-0 left-0 w-2/3 rounded-full bg-foreground" />
      </div>
      <p>
        The real bar is pinned to the top of this page and follows the window scroll. It is decorative and hidden from
        assistive technology.
      </p>
      <p className="text-xs">
        Static illustration shown here; the installed component reads <code>useScroll()</code>.
      </p>
    </div>
  );
}

export function Preview({ id }: { id: string }) {
  switch (id) {
    case "fade-in":
      return <FadeInDemo />;
    case "text-reveal":
      return <TextRevealDemo />;
    case "number-flow":
      return <NumberFlowDemo />;
    case "morph-button":
      return <MorphButtonDemo />;
    case "animated-tabs":
      return <TabsDemo />;
    case "motion-accordion":
      return <AccordionDemo />;
    case "motion-dialog":
      return <DialogDemo />;
    case "scroll-progress":
      return <ScrollProgressDemo />;
    default:
      return <p className="text-sm text-muted-foreground">Preview coming soon.</p>;
  }
}

export function PreviewFrame({ id }: { id: string }) {
  return (
    <div className={panel} data-preview={id}>
      <Preview id={id} />
    </div>
  );
}
