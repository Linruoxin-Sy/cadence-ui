import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { RevealPreview } from "@/components/site/previews/reveal";

export function generateMetadata() {
  return getComponentMetadata("reveal");
}

export default function Page() {
  return <ComponentPage id="reveal" preview={RevealPreview} />;
}
