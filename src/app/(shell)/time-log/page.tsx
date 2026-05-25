import { Suspense } from "react";

import { TimeLogBodyServer } from "@/components/time-log/time-log-body-server";
import { TimeLogPageShell } from "@/components/time-log/time-log-page-shell";
import { ShellContentSkeleton } from "@/components/skeletons/shell-content-skeleton";
import { parseAdoContextSearchParams } from "@/lib/ado/parse-context-search-params";
import { getServerAuthBootstrap } from "@/lib/auth/server-state";
import { loadTimeLogBaseline } from "@/lib/time-log/load-time-log-baseline";
import { DEFAULT_WORK_ITEM_FILTERS } from "@/lib/schemas/work-item-filters";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TimeLogPage({ searchParams }: PageProps) {
  const sp = parseAdoContextSearchParams(await searchParams);
  const auth = await getServerAuthBootstrap();
  const defaultProject =
    auth.authMethod === "pat" ? auth.patProject : auth.defaultProject;
  const urlAssignee = sp.assignee ?? DEFAULT_WORK_ITEM_FILTERS.assignee;

  const serverBaseline = auth.adoExecutionReady
    ? await loadTimeLogBaseline(defaultProject, sp)
    : await loadTimeLogBaseline(null, {});

  const suspenseKey = [
    serverBaseline.catalog.project,
    serverBaseline.catalog.team,
    serverBaseline.catalog.sprintPath,
    urlAssignee,
  ].join("|");

  return (
    <TimeLogPageShell
      serverBaseline={serverBaseline}
      adoExecutionReady={auth.adoExecutionReady}
      notReadyMessage="Conecta Azure DevOps para registrar tiempo en Azure DevOps."
    >
      {auth.adoExecutionReady && serverBaseline.catalog.sprintPath ? (
        <Suspense key={suspenseKey} fallback={<ShellContentSkeleton />}>
          <TimeLogBodyServer
            adoExecutionReady={auth.adoExecutionReady}
            authMethod={auth.authMethod}
            defaultProject={defaultProject}
            serverBaseline={serverBaseline}
            urlAssignee={urlAssignee}
          />
        </Suspense>
      ) : null}
    </TimeLogPageShell>
  );
}
