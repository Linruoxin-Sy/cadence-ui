import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { AlertDialogPreview } from "@/components/site/previews/alert-dialog";

export function generateMetadata() {
  return getComponentMetadata("alert-dialog");
}

export default function Page() {
  return <ComponentPage id="alert-dialog" preview={AlertDialogPreview} />;
}
