"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

import { catalogToContextFields } from "@/lib/ado/catalog-context-fields";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { buildAdoContextQuery } from "@/lib/ado/parse-context-search-params";
import type { AdoContextSelectFieldsProps } from "@/lib/filters/context-selection-types";

export type UseAdoContextUrlOptions = {
  catalog: AdoCatalogSnapshot;
  adoExecutionReady: boolean;
  assignee?: string;
  sprintDay?: string;
  workItemsCount?: number;
};

export type AdoContextUrlResult = AdoContextSelectFieldsProps & {
  refreshContext: () => void;
};

export function useAdoContextUrl({
  catalog,
  adoExecutionReady,
  assignee,
  sprintDay,
  workItemsCount = 0,
}: UseAdoContextUrlOptions): AdoContextUrlResult {
  const router = useRouter();
  const pathname = usePathname();

  const pushContext = useCallback(
    (next: {
      project?: string;
      team?: string;
      sprint?: string;
      assignee?: string;
      sprintDay?: string;
    }) => {
      router.push(
        `${pathname}${buildAdoContextQuery({
          project: next.project ?? catalog.project,
          team: next.team ?? catalog.team,
          sprint: next.sprint ?? catalog.sprintPath,
          assignee: next.assignee ?? assignee,
          sprintDay:
            next.sprintDay !== undefined ? next.sprintDay : sprintDay,
        })}`,
      );
    },
    [assignee, catalog.project, catalog.sprintPath, catalog.team, pathname, router, sprintDay],
  );

  const refreshContext = useCallback(() => {
    router.refresh();
  }, [router]);

  const base = useMemo(
    () =>
      catalogToContextFields(catalog, {
        adoExecutionReady,
        workItemsCount,
      }),
    [adoExecutionReady, catalog, workItemsCount],
  );

  const onProjectChange = useCallback(
    (value: string) => {
      pushContext({ project: value, team: "", sprint: "", sprintDay: "" });
    },
    [pushContext],
  );

  const onTeamChange = useCallback(
    (value: string) => {
      pushContext({ team: value, sprint: "", sprintDay: "" });
    },
    [pushContext],
  );

  const onSprintChange = useCallback(
    (value: string) => {
      pushContext({ sprint: value, sprintDay: "" });
    },
    [pushContext],
  );

  return {
    ...base,
    onProjectChange,
    onTeamChange,
    onSprintChange,
    refreshContext,
  };
}
