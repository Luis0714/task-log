import { redirect } from "next/navigation";

import { NewsStoriesShell } from "@/components/news-stories/news-stories-shell";
import type { AdoContextSearchParams } from "@/lib/ado/types";
import { getServerAuthBootstrap } from "@/lib/auth/server-state";
import { loadAssignmentsCatalog } from "@/lib/ado/load-assignments-catalog";

export const dynamic = "force-dynamic";

export default async function AdminNovedadesPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<AdoContextSearchParams>;
}>) {
  const bootstrap = await getServerAuthBootstrap();
  if (!bootstrap.isManagement) redirect("/");

  const sp = (await (searchParams ?? Promise.resolve({}))) as AdoContextSearchParams;
  const catalog = await loadAssignmentsCatalog(sp);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6">
      <NewsStoriesShell
        catalog={catalog}
        projects={catalog.projects.map((p) => p.name)}
        teams={catalog.teams.map((t) => t.name)}
      />
    </div>
  );
}
