import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { BubblePreview } from "@/components/site/previews/bubble";

export function generateMetadata() {
  return getComponentMetadata("bubble");
}

export default function Page() {
  return <ComponentPage id="bubble" preview={BubblePreview} />;
}
