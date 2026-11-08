import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { AnimatedTextPreview } from "@/components/site/previews/animated-text";

export function generateMetadata() {
  return getComponentMetadata("animated-text");
}

export default function Page() {
  return <ComponentPage id="animated-text" preview={AnimatedTextPreview} />;
}
