import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { SpinnerPreview } from "@/components/site/previews/spinner";

export function generateMetadata() {
  return getComponentMetadata("spinner");
}

export default function Page() {
  return <ComponentPage id="spinner" preview={SpinnerPreview} />;
}
