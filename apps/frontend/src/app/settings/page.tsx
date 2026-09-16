import { redirect } from "next/navigation";

// Overnight session 2026-09-16: the standalone Settings page/tab is gone —
// its 2 real settings (language, KPI directional coloring) moved into the
// account dropdown (see components/shell/AccountMenu.tsx), and the
// data-sources table was dropped entirely ("les users ils s'en foutent de
// ça", Hachim). This route is kept only so any stale bookmark/link to
// /settings still lands somewhere sensible instead of 404ing.
//
// Note: the sandbox this session ran in refused file-deletion commands
// (rm / git rm), so the old page.tsx content (DataSourcesSection,
// fetchProviderStatuses wiring) could not be physically removed from the
// repo — it was replaced with this redirect instead. `page.module.css` in
// this same folder and `apps/frontend/src/lib/api/providersClient.ts` are
// now dead code for the same reason; safe to delete by hand, or ask a
// future session with delete permission to do it.
export default function SettingsPage() {
  redirect("/market");
}
