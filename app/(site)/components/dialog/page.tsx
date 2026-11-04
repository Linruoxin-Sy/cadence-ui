import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { DialogPreview } from "@/components/site/previews/dialog";

export function generateMetadata() {
  return getComponentMetadata("dialog");
}

export default function Page() {
  return <ComponentPage id="dialog" preview={DialogPreview} />;
}
