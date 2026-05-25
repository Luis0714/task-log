import { TimeLogPageShell } from "@/components/time-log/time-log-page-shell";
import { loadAdoCatalog } from "@/lib/ado/load-ado-catalog";
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
}: TimeLogShellServerProps) {
  const catalog = adoExecutionReady
    ? await loadAdoCatalog(defaultProject, sp)
    : await loadAdoCatalog(null, {});

  const shellBaseline: TimeLogServerBaseline = {
    catalog,
    teamMembers: [],
    backlogStates: [],
    taskStates: [],
    defaultOpenTaskState: null,
    nonWorkingDates: [],
  };

  return (
    <TimeLogPageShell
      serverBaseline={shellBaseline}
      adoExecutionReady={adoExecutionReady}
      notReadyMessage="Conecta Azure DevOps para registrar tiempo en Azure DevOps."
    />
  );
}
