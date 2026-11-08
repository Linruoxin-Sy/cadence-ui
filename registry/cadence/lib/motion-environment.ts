/** Shared signals, scoped to a document. No animation discovery or global patches. */
export interface MotionEnvironment {
  hidden: boolean;
  immediate: boolean;
  reduced: boolean;
  themeOwned: boolean;
}

type Listener = (environment: MotionEnvironment) => void;
const documents = new WeakMap<
  Document,
  {
    listeners: Set<Listener>;
    read(): MotionEnvironment;
    notify(): void;
    dispose(): void;
    themeDepth: number;
  }
>();

function environment(doc: Document) {
  const existing = documents.get(doc);
  if (existing) return existing;
  const view = doc.defaultView;
  const queries = ["(prefers-reduced-motion: reduce)", "(forced-colors: active)", "print"].map((q) =>
    view?.matchMedia(q),
  );
  let suspended = false;
  let printing = false;
  const state = {
    listeners: new Set<Listener>(),
    themeDepth: 0,
    read: (): MotionEnvironment => ({
      hidden: suspended || doc.visibilityState === "hidden",
      immediate: printing || Boolean(queries[1]?.matches || queries[2]?.matches),
      reduced: Boolean(queries[0]?.matches),
      themeOwned: state.themeDepth > 0,
    }),
    notify: () => {
      for (const listener of state.listeners) listener(state.read());
    },
    dispose: () => {
      for (const query of queries) query?.removeEventListener("change", state.notify);
      doc.removeEventListener("visibilitychange", state.notify);
      view?.removeEventListener("pagehide", hide);
      view?.removeEventListener("pageshow", show);
      view?.removeEventListener("beforeprint", beforePrint);
      view?.removeEventListener("afterprint", afterPrint);
      documents.delete(doc);
    },
  };
  const hide = () => {
    suspended = true;
    state.notify();
  };
  const show = () => {
    suspended = false;
    state.notify();
  };
  const beforePrint = () => {
    printing = true;
    state.notify();
  };
  const afterPrint = () => {
    printing = false;
    state.notify();
  };
  for (const query of queries) query?.addEventListener("change", state.notify);
  doc.addEventListener("visibilitychange", state.notify);
  view?.addEventListener("pagehide", hide);
  view?.addEventListener("pageshow", show);
  view?.addEventListener("beforeprint", beforePrint);
  view?.addEventListener("afterprint", afterPrint);
  documents.set(doc, state);
  return state;
}

export function subscribeMotionEnvironment(doc: Document, listener: Listener) {
  const state = environment(doc);
  state.listeners.add(listener);
  listener(state.read());
  return () => {
    state.listeners.delete(listener);
    if (!state.listeners.size && !state.themeDepth) state.dispose();
  };
}

/** The theme owner commits synchronously; local colour owners fold that change. */
export function coordinateMotionTheme(doc: Document, commit: () => void) {
  const state = environment(doc);
  state.themeDepth++;
  state.notify();
  try {
    commit();
  } finally {
    state.themeDepth--;
    state.notify();
    if (!state.listeners.size && !state.themeDepth) state.dispose();
  }
}
