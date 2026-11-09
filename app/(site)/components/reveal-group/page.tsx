import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { RevealGroupPreview } from "@/components/site/previews/reveal-group";

export function generateMetadata() {
  return getComponentMetadata("reveal-group");
}

export default function Page() {
  return <ComponentPage id="reveal-group" preview={RevealGroupPreview} />;
}
