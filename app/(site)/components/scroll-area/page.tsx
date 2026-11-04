import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { ScrollAreaPreview } from "@/components/site/previews/scroll-area";

export function generateMetadata() {
  return getComponentMetadata("scroll-area");
}

export default function Page() {
  return <ComponentPage id="scroll-area" preview={ScrollAreaPreview} />;
}
