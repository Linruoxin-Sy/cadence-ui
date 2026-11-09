import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { AnimatedNumberPreview } from "@/components/site/previews/animated-number";

export function generateMetadata() {
  return getComponentMetadata("animated-number");
}

export default function Page() {
  return <ComponentPage id="animated-number" preview={AnimatedNumberPreview} />;
}
