import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { AccordionPreview } from "@/components/site/previews/accordion";

export function generateMetadata() {
  return getComponentMetadata("accordion");
}

export default function Page() {
  return <ComponentPage id="accordion" preview={AccordionPreview} />;
}
