import { Sidebar } from "@/components/site/sidebar";
import { listComponentGroups, listGuides } from "@/lib/content";

/**
 * The shared chrome for `/docs/**` and `/components/**`. Both trees live in this
 * route group so the sidebar is never unmounted when the reader crosses between
 * them: a remount would restart its disclosure state and re-arm the row
 * entrance, so the navigation would replay on every section switch.
 *
 * The shell shares the header's centred site container, keeping the sidebar
 * aligned with the wordmark. The reading column is centred in the remaining
 * space, with its own measure (`max-w-3xl` in the page files).
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [groups, guides] = await Promise.all([listComponentGroups(), listGuides()]);

  return (
    <div className="mx-auto flex w-full max-w-site flex-col gap-8 px-4 md:flex-row md:px-6">
      <Sidebar groups={groups} guides={guides} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
