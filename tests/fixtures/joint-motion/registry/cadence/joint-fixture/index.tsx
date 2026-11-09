// Non-published executable instrumentation specimens. No catalogue migration.
import type { Ref, RefObject } from "react";
import { useContinuousMotion, useStateColor } from "@/registry/cadence/lib/css-motion";
import { useCadenceMotion } from "@/registry/cadence/lib/provider";

export function Paint({
  external,
  caller = false,
  changed = false,
}: {
  external?: Ref<HTMLButtonElement>;
  caller?: boolean;
  changed?: boolean;
}) {
  const cm = useCadenceMotion();
  const paint = useStateColor(external, cm, ["background-color", "color"], { readability: "verified" });
  return (
    <button
      {...paint}
      type="button"
      data-slot="joint-paint"
      style={{
        ...paint.style,
        color: changed ? "#222" : "#111",
        backgroundColor: changed ? "#eee" : "#fff",
        ...(caller
          ? { transitionProperty: "background-color,color", transitionDuration: "0.16s", transitionDelay: "0s" }
          : {}),
      }}
    >
      Current
    </button>
  );
}

export function OtherPaint() {
  const cm = useCadenceMotion();
  const paint = useStateColor(undefined, cm, ["background-color", "color"]);
  return (
    <button {...paint} type="button" data-slot="joint-paint">
      Other export, identical slot
    </button>
  );
}

export function Loop() {
  const cm = useCadenceMotion();
  const loop = useContinuousMotion(undefined, cm, "pulse");
  return (
    <div {...loop} data-slot="joint-loop" role="status" style={{ opacity: 1 }}>
      Loading
    </div>
  );
}

export function Disconnected({ host }: { host: RefObject<HTMLButtonElement | null> }) {
  const cm = useCadenceMotion();
  const paint = useStateColor(undefined, cm, ["background-color", "color"]);
  return (
    <button data-motion={cm.mode} data-slot="joint-paint" ref={host} type="button" style={paint.style}>
      Disconnected
    </button>
  );
}

export function ForeignController() {
  const cm = useCadenceMotion();
  const paint = useStateColor(undefined, cm, ["background-color", "color"]);
  return <ForeignHost paint={paint} mode={cm.mode} />;
}

export function ForeignHost({ paint, mode }: { paint: ReturnType<typeof useStateColor>; mode: string }) {
  return (
    <button {...paint} data-motion={mode} data-slot="joint-paint" type="button">
      A different export owns this physical host
    </button>
  );
}

export function NativeEditor({ external, onChange }: { external?: Ref<HTMLInputElement>; onChange?: () => void }) {
  return (
    <input data-slot="joint-native" aria-label="Native editor" ref={external} defaultValue="keep" onChange={onChange} />
  );
}

export function SamePartBorrow({
  channel,
  receiver = false,
}: {
  channel: RefObject<ReturnType<typeof useStateColor> | null>;
  receiver?: boolean;
}) {
  const cm = useCadenceMotion();
  const paint = useStateColor(undefined, cm, ["background-color", "color"]);
  if (!receiver) channel.current = paint;
  return (
    <button {...(receiver ? channel.current : {})} data-motion={cm.mode} data-slot="joint-paint" type="button">
      Same export, different instance
    </button>
  );
}

export { Paint as AliasedPaint };
