import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { CardPreview } from "@/components/site/previews/card";

export function generateMetadata() {
  return getComponentMetadata("card");
}

export default function Page() {
  return <ComponentPage id="card" preview={CardPreview} />;
}
