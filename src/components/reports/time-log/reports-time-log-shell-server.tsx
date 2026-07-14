import { ReportsTimeLogPageShell } from "@/components/reports/time-log/reports-time-log-page-shell";
import { resolvePageCatalog } from "@/lib/ado/resolve-page-catalog";
import type { AdoContextSearchParams } from "@/lib/ado/types";
import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db";
import { USER_FILTER_SCOPES } from "@/lib/filters/user-filter-scopes";
import { resolveSavedScopesByProject } from "@/lib/news-stories/default-scopes";

export type ReportsTimeLogShellServerProps = Readonly<{
  sp: AdoContextSearchParams;
  defaultProject: string | null;
  adoExecutionReady: boolean;
}>;

export async function ReportsTimeLogShellServer({
  sp,
  defaultProject,
  adoExecutionReady,
}: ReportsTimeLogShellServerProps) {
  const catalog = await resolvePageCatalog(adoExecutionReady, defaultProject, sp);

  const saved = await loadSavedFilters();
  const savedScopes = resolveSavedScopesByProject(saved, {
    projects: catalog.projects.map((p) => p.name),
    teamsByProject: catalog.teamsByProject,
    defaultProject: catalog.defaultProject ?? null,
    defaultTeam: catalog.defaultTeam ?? null,
  });

  return (
    <ReportsTimeLogPageShell
      catalog={catalog}
      adoExecutionReady={adoExecutionReady}
      initialScopes={{
        projectIds: [...savedScopes.selectedProjects],
        teamIds: [...savedScopes.selectedTeams],
      }}
    />
  );
}

async function loadSavedFilters() {
  if (!isIronSessionConfigured()) return null;
  const session = await getTaskPilotSession();
  const userId = session.taskPilotUserId?.trim();
  if (!userId) return null;
  try {
    return await getRepositories().userFilterPreferences.getByUserAndScope(
      userId,
      USER_FILTER_SCOPES.timeLog,
    );
  } catch {
    return null;
  }
}