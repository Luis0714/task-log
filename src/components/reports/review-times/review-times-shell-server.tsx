import { ReviewTimesPageShell } from "@/components/reports/review-times/review-times-page-shell";
import { resolveAdoTimeZone } from "@/lib/azure-devops/working-date-field";
import { loadGitRepositories } from "@/lib/git/load-git-repositories";
import { currentMonthKey } from "@/lib/review-times/month";

export type ReviewTimesShellServerProps = Readonly<{
  defaultProject: string | null;
  adoExecutionReady: boolean;
}>;

export async function ReviewTimesShellServer({
  defaultProject,
  adoExecutionReady,
}: ReviewTimesShellServerProps) {
  const timeZone = resolveAdoTimeZone();
  const monthKey = currentMonthKey(timeZone);
  const loaded = await loadRepositoryNames(adoExecutionReady, defaultProject);

  return (
    <ReviewTimesPageShell
      project={defaultProject}
      repositories={loaded.repositories}
      initialMonthKey={monthKey}
      timeZone={timeZone}
      repositoryError={loaded.error}
      adoExecutionReady={adoExecutionReady}
    />
  );
}

async function loadRepositoryNames(
  adoExecutionReady: boolean,
  project: string | null,
): Promise<{ repositories: string[]; error: string | null }> {
  if (!adoExecutionReady || !project) return { repositories: [], error: null };
  try {
    return { repositories: await loadGitRepositories(project), error: null };
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "No se pudieron cargar los repositorios.";
    return { repositories: [], error: message };
  }
}
