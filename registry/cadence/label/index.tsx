"use client";

import { useIsPresent } from "motion/react";
import {
  type ComponentProps,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { cn } from "../lib/cn";
import { useStateColor } from "../lib/css-motion";
import { createInlineEntrance } from "../lib/inline-entrance";
import { labelColourReadable, labelGeometry, observeLabelConstraints } from "../lib/label-layout";
import { createMeasuredGeometry, GeometryScope } from "../lib/measured-geometry";
import { bindMotionParameters, geometryCompact } from "../lib/motion";
import {
  createPresentationScope,
  documentPresentation,
  MotionPresentation,
  usePresentationScope,
} from "../lib/motion-presence";
import { useMotionHostRef } from "../lib/motion-ref";
import { useCadenceMotion } from "../lib/provider";
import { useNumberPresentation } from "../lib/use-number-presentation";
import { useTextPresentation } from "../lib/use-text-presentation";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};
type Scope = ReturnType<typeof createPresentationScope>;

export interface LabelProps extends ComponentProps<"label"> {}

/** Native association and rich descendants remain live through every revision. */
function Label({ className, children, ...props }: LabelProps) {
  const { node, ref } = useMotionHostRef<HTMLLabelElement>(props.ref);
  const cm = useCadenceMotion(node);
  const present = useIsPresent();
  const parent = usePresentationScope();
  const [scope] = useState(() => createPresentationScope(node));
  const [association, setAssociation] = useState(() => ({ target: props.htmlFor, entity: {} }));
  if (association.target !== props.htmlFor) setAssociation({ target: props.htmlFor, entity: {} });
  const group = useContext(GeometryScope);
  const hydrated = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const initialHydration = useRef(hydrated),
    consumed = useRef(false);
  const entrance = useRef<ReturnType<typeof createInlineEntrance> | null>(null);
  const connection = useRef<{
    host: HTMLElement;
    group: typeof group;
    content: HTMLElement;
    dispose(): void;
    commit(): void;
  } | null>(null);
  const latest = useRef({ cm, children, present });
  const paint = useStateColor(ref, cm, ["color"], {
    readability: "verified",
    readabilityGate: labelColourReadable,
    readabilityScope: (host) => host.parentElement,
  });
  const plain = typeof children === "string" || typeof children === "number";
  useEffect(() => {
    if (!parent && node.current) documentPresentation(node.current.ownerDocument).presented = true;
  }, [parent, node]);
  committed(() => {
    latest.current = { cm, children, present };
    const host = node.current;
    if (!host) return;
    if (!entrance.current) entrance.current = createInlineEntrance(host);
    const baseline = parent ?? documentPresentation(host.ownerDocument);
    const visible = host.checkVisibility
      ? host.checkVisibility({ visibilityProperty: true, contentVisibilityAuto: true })
      : host.getClientRects().length > 0;
    const inherited =
      !present ||
      !visible ||
      !!host.closest('[hidden],[inert],[aria-hidden="true"]') ||
      !baseline.available() ||
      baseline.node?.current?.hasAttribute("data-starting-style");
    entrance.current.commit({
      // Label owns independent insertion only. A parent close/reopen must not
      // become a second false-to-true presence cause on the retained label.
      present: true,
      cm: inherited ? { ...cm, timeScale: 0 } : cm,
      enter: !consumed.current && !initialHydration.current && baseline.presented && !inherited,
    });
    consumed.current = true;
    if (present && baseline.available()) scope.transaction.open();
    else scope.transaction.close();
    const content = host.querySelector<HTMLElement>("[data-slot=label-text],[data-slot=label-number]");
    if (
      connection.current &&
      (connection.current.host !== host || connection.current.group !== group || connection.current.content !== content)
    )
      connection.current.dispose();
    if (!connection.current && content) {
      const controller = group?.controller ?? createMeasuredGeometry(scope.transaction);
      const unregister = controller.register({
        host: node,
        content,
        axes: ["width", "height"],
        destinationWidth: () => content.getBoundingClientRect().width,
        textGeometry: true,
        measure: () => labelGeometry(host, content),
      });
      const constraints = observeLabelConstraints(host, content, () => {
        scope.transaction.cancel();
        controller.settle();
        entrance.current?.commit({ present: true, enter: false, cm: { ...latest.current.cm, timeScale: 0 } });
      });
      const entry = {
        host,
        group,
        content,
        value: children,
        commit() {
          const input = latest.current;
          constraints.prepare(!Object.is(entry.value, input.children));
          entry.value = input.children;
          const parameters = input.cm.parameters(bindMotionParameters(geometryCompact, "geometry.resize/measured"));
          if (group) group.request?.();
          else if (parameters.kind === "geometry")
            controller.commit(scope.transaction.revision("content", input.children), {
              reduced: input.cm.reduced,
              transition: parameters.transition,
              available: input.present && baseline.available(),
            });
          constraints.commit();
        },
        dispose() {
          constraints.dispose();
          unregister();
          if (!group) controller.dispose();
          if (connection.current === entry) connection.current = null;
        },
      };
      connection.current = entry;
    }
    connection.current?.commit();
  });
  committed(() => {
    const host = node.current;
    if (!host || !parent) return;
    const owner = parent.transaction.register(host);
    const join = () =>
      owner.begin(parent.transaction.revision("presence", host, host), [], {}, () => {
        scope.transaction.close();
        entrance.current?.commit({ present: true, enter: false, cm: { ...latest.current.cm, timeScale: 0 } });
      });
    join();
    const off = parent.transaction.subscribeOpen(join);
    return () => {
      off();
      owner.dispose();
    };
  }, [node, parent, scope]);
  committed(
    () => () => {
      entrance.current?.dispose();
      entrance.current = null;
      connection.current?.dispose();
      scope.transaction.close();
    },
    [scope],
  );
  return (
    <MotionPresentation scope={scope}>
      {/* biome-ignore lint/a11y/noLabelWithoutControl: caller supplies htmlFor or wraps its control. */}
      <label
        data-slot="label"
        {...props}
        {...paint}
        data-motion={cm.mode}
        className={cn(
          "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          className,
        )}
        style={{ ...paint.style, ...props.style }}
      >
        {plain ? (
          typeof children === "number" ? (
            <LabelNumber value={children} scope={scope} visible={present} entity={association.entity} />
          ) : (
            <LabelText value={children} scope={scope} visible={present} entity={association.entity} />
          )
        ) : (
          children
        )}
      </label>
    </MotionPresentation>
  );
}

function LabelText({
  value,
  scope,
  visible,
  entity,
}: {
  value: string;
  scope: Scope;
  visible: boolean;
  entity: object;
}) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(
    node,
    value,
    cm,
    entity,
    { characterStagger: false, visible, stripGeometry: true },
    scope.transaction,
  );
  return (
    <span ref={ref} data-slot="label-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}
function LabelNumber({
  value,
  scope,
  visible,
  entity,
}: {
  value: number;
  scope: Scope;
  visible: boolean;
  entity: object;
}) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useNumberPresentation(
    node,
    value,
    cm,
    entity,
    { compact: true, visible, cause: "independent", retainEditedContent: true },
    scope.transaction,
  );
  return (
    <span ref={ref} data-slot="label-number" data-motion={cm.mode}>
      {text}
    </span>
  );
}

export { Label };
