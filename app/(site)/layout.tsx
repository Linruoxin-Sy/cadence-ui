import { Sidebar } from "@/components/site/sidebar";
import { listComponentGroups, listGuides } from "@/lib/content";

/**
 * The shared chrome for `/docs/**` and `/components/**`. Both trees live in this
 * route group so the sidebar is never unmounted when the reader crosses between
 * them: a remount would restart its disclosure state and re-arm the row
 * entrance, so the navigation would replay on every section switch.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [groups, guides] = await Promise.all([listComponentGroups(), listGuides()]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 md:flex-row">
      <Sidebar groups={groups} guides={guides} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
