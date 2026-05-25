import { Suspense } from "react";

import { TimeLogBodyStreamLoader } from "@/components/time-log/time-log-body-stream-loader";
import { TimeLogShellServer } from "@/components/time-log/time-log-shell-server";
import { TimeLogFormSkeleton } from "@/components/skeletons/time-log-form-skeleton";
import { TimeLogShellSkeleton } from "@/components/skeletons/time-log-shell-skeleton";
import { parseAdoContextSearchParams } from "@/lib/ado/parse-context-search-params";
import { getServerAuthBootstrap } from "@/lib/auth/server-state";
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

  return (
    <div className="flex w-full flex-col gap-5 pb-6">
      <Suspense fallback={<TimeLogShellSkeleton />}>
        <TimeLogShellServer
          sp={sp}
          defaultProject={defaultProject}
          adoExecutionReady={auth.adoExecutionReady}
        />
      </Suspense>

      {auth.adoExecutionReady ? (
        <Suspense fallback={<TimeLogFormSkeleton />}>
          <TimeLogBodyStreamLoader
            sp={sp}
            defaultProject={defaultProject}
            adoExecutionReady={auth.adoExecutionReady}
            authMethod={auth.authMethod}
            urlAssignee={urlAssignee}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
