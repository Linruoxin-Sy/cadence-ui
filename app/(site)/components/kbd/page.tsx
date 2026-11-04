import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { KbdPreview } from "@/components/site/previews/kbd";

export function generateMetadata() {
  return getComponentMetadata("kbd");
}

export default function Page() {
  return <ComponentPage id="kbd" preview={KbdPreview} />;
}
