import catalog from "@/components/site/previews/examples.json";

export const componentExamples: Readonly<Record<string, readonly string[]>> = catalog;

/** A document can only render named specimens registered for that component. */
export function assertComponentExample(component: string | undefined, name: string): asserts component is string {
  if (!component || !Object.hasOwn(componentExamples, component) || !componentExamples[component]?.includes(name)) {
    throw new Error(`Unknown component example: ${component ?? "guide"}/${name}`);
  }
}
