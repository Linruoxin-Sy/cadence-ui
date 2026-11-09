/** Test compiler adapter for independently copied source. */
import { useCallback, useLayoutEffect, useRef } from "react";
import { currentController, currentExecution, withController } from "./component-execution";
import {
  controllerOrigins,
  controllerPropertyWrites,
  controllerSources,
  controllerWrites,
  controlSamples,
  cssPolicySamples,
  nativeEffects,
  nativeNodeWrites,
  nativePropertyWrites,
  parameterCalls,
  parameterClockIsZero,
  parameterSamples,
  policyScopes,
  presentationSamples,
} from "./motion-observer";

const paintControllers = new WeakMap();
function recordProperties(node, properties) {
  const current = currentController();
  if (current && node.tagName === "CANVAS") paintControllers.set(node, current);
  const controller = current ?? paintControllers.get(node);
  const keys = [
    ...new Set(properties.map((key) => (/^(?:translate|rotate|scale|transform)/.test(key) ? "transform" : key))),
  ];
  for (const store of [nativePropertyWrites, ...(controller ? [controllerPropertyWrites] : [])]) {
    const owner = store === nativePropertyWrites ? node : controller;
    const values = store.get(owner) ?? new Map();
    for (const key of keys) values.set(key, (values.get(key) ?? 0) + 1);
    store.set(owner, values);
  }
}
function frameProperties(frames) {
  return [
    ...new Set(
      (Array.isArray(frames) ? frames : [frames])
        .flatMap((frame) => Object.keys(frame ?? {}))
        .filter((key) => !["offset", "computedOffset", "easing", "composite"].includes(key)),
    ),
  ];
}

export function observeNativeAnimation(node, args) {
  const animate = node.animate;
  const result = Reflect.apply(animate, node, args());
  if (node instanceof Element && result) {
    nativeNodeWrites.set(node, (nativeNodeWrites.get(node) ?? 0) + 1);
    const controller = currentController();
    if (controller) controllerWrites.set(controller, (controllerWrites.get(controller) ?? 0) + 1);
    recordProperties(node, frameProperties(result.effect?.getKeyframes?.() ?? []));
    if (controller) {
      const effects = nativeEffects.get(controller) ?? new Set();
      effects.add(result);
      nativeEffects.set(controller, effects);
    }
  }
  return result;
}
export function observeNativeKeyframes(effect, args, optionalReceiver, optionalMethod) {
  if (effect == null && optionalReceiver) return;
  const write = effect.setKeyframes;
  if (write == null && optionalMethod) return;
  const result = Reflect.apply(write, effect, args());
  if (effect.target instanceof Element) recordProperties(effect.target, frameProperties(effect.getKeyframes?.() ?? []));
  return result;
}
export function observeNativeStyle(node, key, value) {
  const style = node.style,
    before = style[key],
    next = value();
  style[key] = next;
  if (node instanceof Element && style[key] !== before)
    recordProperties(node, [key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)]);
  return next;
}

export function observeNativeDeclaration(node, property, write) {
  const before = node.style.getPropertyValue(property);
  const result = write();
  if (
    ["opacity", "transform", "width", "height"].includes(property) &&
    node.style.getPropertyValue(property) !== before
  ) {
    nativeNodeWrites.set(node, (nativeNodeWrites.get(node) ?? 0) + 1);
    recordProperties(node, [property]);
  }
  return result;
}

export function useObserveControlPolicy(result, args, source) {
  const origin = currentExecution(),
    identity = useRef({}).current;
  const policy = parameterSamples.get(args[1]);
  controllerSources.set(identity, source);
  useLayoutEffect(() => {
    const node = args[4]?.current;
    if (!node || !policy) return;
    // Base UI may clone render-element props. Recover only the SAME actual
    // parameter invocation whose authored ref already owns this exact host.
    // An unrelated dependency/controller or matching slot cannot supply it.
    const owner = origin ?? (policy.origin?.hosts.has(node) ? policy.origin : undefined);
    const properties = [
      ...new Set(
        Object.keys(args[0]).map((key) =>
          /^(?:[xyz]|translate[XYZ]|scale[XY]?|rotate[XYZ]?|skew[XY]?)$/.test(key)
            ? "transform"
            : key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`),
        ),
      ),
    ];
    presentationSamples.set(identity, {
      node,
      origin: owner,
      form: policy.form,
      preset: policy.preset,
      mode: args[2],
      properties,
      executed: () => controlSamples.get(result),
      zeroClock: parameterClockIsZero(args[1]),
      parameters: policy.result,
      policyMode: policy.mode,
    });
    return () => presentationSamples.delete(identity);
  });
  return result;
}

export function observeResolvedParameters(result, binding, mode) {
  const policy = { preset: binding.preset.id, form: binding.form, mode, origin: currentExecution(), result };
  parameterCalls.push(policy);
  const mark = (value) => {
    if (!value || typeof value !== "object") return;
    parameterSamples.set(value, policy);
    for (const nested of Object.values(value)) mark(nested);
  };
  mark(result);
  return result;
}
export function observeTransitionComposite(transition, parts) {
  const policies = parts.map((part) => parameterSamples.get(part)).filter(Boolean);
  const policy = policies[0];
  if (
    policy &&
    policies.every((part) => part.form === policy.form && part.preset === policy.preset && part.mode === policy.mode)
  )
    parameterSamples.set(transition, policy);
  return transition;
}

export function observeCopiedController(controller, kind, args, source) {
  const origin = currentExecution();
  controllerOrigins.set(controller, origin);
  controllerSources.set(controller, source);
  if (kind === "createMeasuredGeometry") {
    const hosts = new Map(),
      register = controller.register.bind(controller),
      commit = controller.commit.bind(controller),
      dispose = controller.dispose.bind(controller);
    controller.register = (adapter) => {
      const key = {},
        release = register(adapter);
      hosts.set(key, adapter);
      return () => {
        hosts.delete(key);
        presentationSamples.delete(key);
        return release();
      };
    };
    controller.commit = (...input) => {
      const result = withController(controller, () => commit(...input));
      for (const [key, adapter] of hosts)
        if (adapter.host.current)
          presentationSamples.set(key, {
            controller,
            form: "geometry.resize/measured",
            node: adapter.host.current,
            origin,
            mode: adapter.host.current.dataset.motion ?? "",
            properties: [...adapter.axes],
            preset: parameterSamples.get(input[1].transition)?.preset,
            clock: input[1].transition,
            zeroClock: parameterClockIsZero(input[1].transition),
            immediate: input[1].reduced,
            target: input[0].target,
            revision: input[0],
          });
      return result;
    };
    controller.dispose = () => {
      for (const key of hosts.keys()) presentationSamples.delete(key);
      hosts.clear();
      return dispose();
    };
    return controller;
  }
  if (kind === "createViewportReveal") {
    const register = controller.register.bind(controller);
    const targets = new Set(),
      retire = controller.dispose.bind(controller);
    controller.dispose = () => {
      for (const target of targets) presentationSamples.delete(target);
      targets.clear();
      return retire();
    };
    controller.register = (...input) => {
      const targetOrigin = currentExecution(),
        target = register(...input);
      controllerSources.set(target, source);
      targets.add(target);
      let mode = input[2].mode;
      const record = () => {
        const old = presentationSamples.get(target);
        presentationSamples.set(target, {
          form: "reveal/viewport",
          node: input[0],
          origin: targetOrigin,
          scopeOrigin: origin,
          mode,
          group: args[0] !== undefined,
          properties: ["opacity", "transform"],
          preset: "viewport.reveal",
          zeroClock: input[2].timeScale === 0,
          state: target.state,
          commits: (old?.commits ?? 0) + (old?.state === target.state ? 0 : 1),
        });
      };
      const unsubscribe = target.subscribe(record),
        commit = target.commit.bind(target),
        dispose = target.dispose.bind(target);
      target.commit = (...update) => {
        mode = update[0].mode;
        const result = commit(...update);
        record();
        return result;
      };
      target.dispose = () => {
        unsubscribe();
        targets.delete(target);
        presentationSamples.delete(target);
        dispose();
      };
      return target;
    };
    return controller;
  }
  if (
    ![
      "createTextPresentation",
      "createNumberPresentation",
      "createSelectionProjection",
      "createContentTransition",
      "createSizeLinkedGeometry",
    ].includes(kind)
  )
    return controller;
  const commit = controller.commit.bind(controller),
    dispose = controller.dispose.bind(controller),
    keys = new Set(),
    sizeHosts = [{}, {}];
  const add = (key, sample) => {
    keys.add(key);
    presentationSamples.set(key, { ...sample, origin, commits: (presentationSamples.get(key)?.commits ?? 0) + 1 });
  };
  controller.commit = (...input) => {
    const offset = parameterCalls.length;
    const result = withController(controller, () => commit(...input));
    if (kind === "createTextPresentation" || kind === "createNumberPresentation") {
      const number = kind === "createNumberPresentation";
      const form = number ? "number.roll/reels" : "text.change/changed-runs";
      const preset = parameterCalls.slice(offset).find((policy) => policy.form === form)?.preset;
      add(controller, {
        form,
        node: args[0],
        mode: input[0].cm.mode,
        properties: number ? ["transform"] : ["opacity"],
        preset,
        zeroClock: parameterClockIsZero(parameterCalls.slice(offset).find((policy) => policy.form === form)?.result),
        target: number ? input[0].snapshot.text : input[0].value,
        revision: input[0].revision,
      });
    } else if (kind === "createSelectionProjection" && args[0].current)
      add(controller, {
        form: "layout.shared/selection",
        node: args[0].current,
        controller,
        mode: args[0].current.dataset.motion,
        properties: ["transform"],
        preset: parameterSamples.get(input[2])?.preset,
        target: input[1],
        revision: input[0],
        immediate: input[3],
        clock: input[2],
        zeroClock: parameterClockIsZero(input[2]),
      });
    else if (kind === "createSizeLinkedGeometry") {
      for (const [index, host, form] of [
        [0, args[0], "geometry.resize/measured"],
        [1, args[1], "layout.move/size-linked"],
      ])
        if (host.current)
          add(sizeHosts[index], {
            controller,
            form,
            node: host.current,
            mode: host.current.dataset.motion,
            properties: index === 0 || input[1]?.icon ? ["width"] : ["transform"],
            preset: parameterSamples.get(input[2])?.preset,
            clock: input[2],
            zeroClock: parameterClockIsZero(input[2]),
            immediate: input[3],
            target: input[1],
            revision: input[0],
          });
    } else if (kind === "createContentTransition")
      for (const paint of input[1])
        if (paint.host.current) {
          const form = input[3] ? "data.transition/month-grid" : "data.transition/directional-content";
          add(paint.host, {
            form,
            node: paint.host.current,
            controller,
            mode: input[2].mode,
            properties: ["opacity", "transform"],
            preset: parameterCalls.slice(offset).find((policy) => policy.form === form)?.preset,
            target: paint.direction,
            revision: input[0],
            immediate: input[2].reduced,
          });
        }
    return result;
  };
  controller.dispose = () => {
    for (const key of keys) presentationSamples.delete(key);
    keys.clear();
    dispose();
  };
  return controller;
}

export function observePolicyBinding(result, ownership) {
  policyScopes.set(result.controller, ownership);
  return result;
}

export function useObserveCopiedPolicy(result, kind, args) {
  const identity = useRef({}).current;
  const origin = currentExecution();
  const node = useRef(null);
  useLayoutEffect(() => {
    const immediate =
      args[3]?.immediate ||
      args[3]?.readability === "immediate" ||
      (args[3]?.readability !== "verified" && args[2].some?.((p) => p === "color" || p === "background-color"));
    cssPolicySamples.set(identity, {
      kind,
      origin,
      ref: node,
      controller: result.controller,
      properties: kind === "color" ? args[2] : [args[2]],
      mode: args[1].mode,
      seconds: kind === "color" ? (immediate ? 0 : args[1].transition("state.color").duration) : undefined,
    });
    return () => cssPolicySamples.delete(identity);
  });
  const ref = useCallback(
    (element) => {
      node.current = element;
      const release = result.ref(element);
      return () => {
        if (node.current === element) node.current = null;
        release();
      };
    },
    [result.ref],
  );
  return Object.defineProperty({ ...result, ref }, "controller", { value: result.controller, enumerable: false });
}
