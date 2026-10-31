import { Sidebar } from "@/components/site/sidebar";
import { listComponentGroups, listGuides } from "@/lib/content";

/**
 * The shared chrome for `/docs/**` and `/components/**`. Both trees live in this
 * route group so the sidebar is never unmounted when the reader crosses between
 * them: a remount would restart its disclosure state and re-arm the row
 * entrance, so the navigation would replay on every section switch.
 *
 * The shell is full-bleed, not a centred column: the sidebar starts at the
 * viewport's left edge, aligned with the site header's wordmark, and the reading
 * column is centred in whatever space is left. The measure lives on the article
 * (`max-w-3xl` in the page files), not here, so a page can still choose its own.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [groups, guides] = await Promise.all([listComponentGroups(), listGuides()]);

  return (
    <div className="flex w-full flex-col gap-8 px-6 md:flex-row">
      <Sidebar groups={groups} guides={guides} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
