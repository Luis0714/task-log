import { TimeLogPageShell } from "@/components/time-log/time-log-page-shell";
import { resolvePageCatalog } from "@/lib/ado/resolve-page-catalog";
import { getServerAuthProfile } from "@/lib/auth/server-state";
import { resolveAdoTimeZone } from "@/lib/azure-devops/working-date-field";
import type { AdoContextSearchParams } from "@/lib/ado/types";
import type { TimeLogServerBaseline } from "@/lib/time-log/load-time-log-baseline";

export type TimeLogShellServerProps = {
  sp: AdoContextSearchParams;
  defaultProject: string | null;
  adoExecutionReady: boolean;
};

export async function TimeLogShellServer({
  sp,
  defaultProject,
  adoExecutionReady,
}: Readonly<TimeLogShellServerProps>) {
  const [catalog, profile] = await Promise.all([
    resolvePageCatalog(adoExecutionReady, defaultProject, sp, {
      allowBacklogScope: true,
    }),
    getServerAuthProfile(),
  ]);

  const shellBaseline: TimeLogServerBaseline = {
    catalog,
    teamMembers: [],
    backlogStates: [],
    taskStates: [],
    defaultOpenTaskState: null,
    defaultCompletedTaskState: null,
    nonWorkingDates: [],
  };

  return (
    <TimeLogPageShell
      serverBaseline={shellBaseline}
      greetingName={profile.profileDisplayName ?? ""}
      timeZone={resolveAdoTimeZone()}
    />
  );
}
