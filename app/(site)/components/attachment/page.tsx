import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { AttachmentPreview } from "@/components/site/previews/attachment";

export function generateMetadata() {
  return getComponentMetadata("attachment");
}

export default function Page() {
  return <ComponentPage id="attachment" preview={AttachmentPreview} />;
}
