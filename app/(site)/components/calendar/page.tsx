import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { CalendarPreview } from "@/components/site/previews/calendar";

export function generateMetadata() {
  return getComponentMetadata("calendar");
}

export default function Page() {
  return <ComponentPage id="calendar" preview={CalendarPreview} />;
}
