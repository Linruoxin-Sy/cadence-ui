import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { TextareaPreview } from "@/components/site/previews/textarea";

export function generateMetadata() {
  return getComponentMetadata("textarea");
}

export default function Page() {
  return <ComponentPage id="textarea" preview={TextareaPreview} />;
}
