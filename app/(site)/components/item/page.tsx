import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { ItemPreview } from "@/components/site/previews/item";

export function generateMetadata() {
  return getComponentMetadata("item");
}

export default function Page() {
  return <ComponentPage id="item" preview={ItemPreview} />;
}
