"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { usePendingSelectField } from "@/hooks/filters/use-pending-select-field";
import { catalogToContextFields } from "@/lib/ado/catalog-context-fields";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { mergeAdoContextIntoSearchParams } from "@/lib/ado/parse-context-search-params";
import { resolveAdoContextUrlSyncTarget } from "@/lib/ado/sync-context-url";
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
  const searchParams = useSearchParams();

  const { isPending, pendingField, runPending } = usePendingSelectField();

  useEffect(() => {
    if (!adoExecutionReady) return;

    const syncTarget = resolveAdoContextUrlSyncTarget(catalog, {
      project: searchParams.get("project"),
      team: searchParams.get("team"),
      sprint: searchParams.get("sprint"),
    });

    if (!syncTarget?.shouldSync) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("project", catalog.project);
    params.set("team", catalog.team);
    params.set("sprint", syncTarget.sprintPath);

    router.replace(`${pathname}?${params.toString()}`);
  }, [
    adoExecutionReady,
    catalog,
    pathname,
    router,
    searchParams,
  ]);

  const pushContext = useCallback(
    (next: {
      project?: string;
      team?: string;
      sprint?: string;
      assignee?: string;
      sprintDay?: string;
    }) => {
      const resolvedSprint =
        next.sprint === ""
          ? undefined
          : (next.sprint ?? catalog.sprintPath);

      router.push(
        `${pathname}${mergeAdoContextIntoSearchParams(searchParams, {
          project: next.project ?? catalog.project,
          team: next.team ?? catalog.team,
          sprint: resolvedSprint,
          assignee: next.assignee ?? assignee,
          sprintDay:
            next.sprintDay !== undefined ? next.sprintDay : sprintDay,
        })}`,
      );
    },
    [
      assignee,
      catalog.project,
      catalog.sprintPath,
      catalog.team,
      pathname,
      router,
      searchParams,
      sprintDay,
    ],
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

  const onProjectChange = runPending("project", (value: string) => {
    pushContext({ project: value, team: "", sprint: "", sprintDay: "" });
  });

  const onTeamChange = runPending("team", (value: string) => {
    pushContext({ team: value, sprint: "", sprintDay: "" });
  });

  const onSprintChange = runPending("sprint", (value: string) => {
    pushContext({ sprint: value, sprintDay: "" });
  });

  const teamsLoading = isPending && pendingField === "project";
  const sprintsLoading =
    isPending && (pendingField === "project" || pendingField === "team");

  return {
    ...base,
    teamSelectDisabled: teamsLoading || base.teamSelectDisabled,
    sprintSelectDisabled: sprintsLoading || base.sprintSelectDisabled,
    teamsLoading,
    sprintsLoading,
    onProjectChange,
    onTeamChange,
    onSprintChange,
    refreshContext,
  };
}
