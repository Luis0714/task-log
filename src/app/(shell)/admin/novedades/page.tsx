import { redirect } from "next/navigation";

import { NewsStoriesShell } from "@/components/news-stories/news-stories-shell";
import { PageHeader } from "@/components/layout/page-header";
import type { AdoContextSearchParams } from "@/lib/ado/types";
import { getServerAuthBootstrap } from "@/lib/auth/server-state";
import { loadAssignmentsCatalog } from "@/lib/ado/load-assignments-catalog";
import { resolveFilterDefaults } from "@/services/user/resolve-filter-defaults";
import { USER_FILTER_SCOPES } from "@/lib/filters/user-filter-scopes";
import { resolveSavedScopes } from "@/lib/news-stories/default-scopes";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO.novedades);

export const dynamic = "force-dynamic";

export default async function AdminNovedadesPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<AdoContextSearchParams>;
}>) {
  const bootstrap = await getServerAuthBootstrap();
  if (!bootstrap.isManagement) redirect("/");

  const sp = (await (searchParams ?? Promise.resolve({}))) as AdoContextSearchParams;
  const [catalog, { filters: savedFilters }] = await Promise.all([
    loadAssignmentsCatalog(sp),
    resolveFilterDefaults(USER_FILTER_SCOPES.newsStories),
  ]);

  const catalogProjects = catalog.projects.map((p) => p.name);
  const catalogTeams = catalog.teams.map((t) => t.name);
  const savedScopes = resolveSavedScopes(savedFilters, {
    projects: catalogProjects,
    teams: catalogTeams,
    defaultProject: catalog.defaultProject,
    defaultTeam: catalog.defaultTeam,
  });

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6">
      <PageHeader
        title="Novedades"
        description="Selecciona los (Proyectos, Equipos) cuyas historias del backlog deseas vincular como novedad para el reporte."
      />
      <NewsStoriesShell
        catalog={catalog}
        projects={catalogProjects}
        teams={catalogTeams}
        initialSelectedProjects={savedScopes.selectedProjects}
        initialSelectedTeams={savedScopes.selectedTeams}
      />
    </div>
  );
}
