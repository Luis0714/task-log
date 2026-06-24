"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { usePendingSelectField } from "@/hooks/filters/use-pending-select-field";
import { catalogToContextFields } from "@/lib/ado/catalog-context-fields";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { mergeAdoContextIntoSearchParams } from "@/lib/ado/parse-context-search-params";
import { resolveAdoContextUrlSyncTarget } from "@/lib/ado/sync-context-url";
import type { AdoContextSelectFieldsProps } from "@/lib/filters/context-selection-types";
import { formatSprintOptionLabel } from "@/lib/time-log/format-options";

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

  // Estado optimista: se actualiza de forma síncrona al elegir un valor,
  // sin esperar a que el servidor devuelva el nuevo catálogo.
  const [optimistic, setOptimistic] = useState<{
    project: string | null;
    team: string | null;
    sprintPath: string | null;
  }>({ project: null, team: null, sprintPath: null });

  // Limpia el estado optimista cuando la transición (navegación) termina.
  useEffect(() => {
    if (!isPending) {
      setOptimistic({ project: null, team: null, sprintPath: null });
    }
  }, [isPending]);

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

  // Handlers: actualizan el estado optimista de forma síncrona y luego
  // inician la transición de navegación en segundo plano.
  const onProjectChange = useCallback((value: string) => {
    setOptimistic({ project: value, team: "", sprintPath: "" });
    runPending("project", (v: string) => {
      pushContext({ project: v, team: "", sprint: "", sprintDay: "" });
    })(value);
  }, [pushContext, runPending]);

  const onTeamChange = useCallback((value: string) => {
    setOptimistic((prev) => ({ ...prev, team: value, sprintPath: "" }));
    runPending("team", (v: string) => {
      pushContext({ team: v, sprint: "", sprintDay: "" });
    })(value);
  }, [pushContext, runPending]);

  const onSprintChange = useCallback((value: string) => {
    setOptimistic((prev) => ({ ...prev, sprintPath: value }));
    runPending("sprint", (v: string) => {
      pushContext({ sprint: v, sprintDay: "" });
    })(value);
  }, [pushContext, runPending]);

  const teamsLoading = isPending && pendingField === "project";
  const sprintsLoading =
    isPending && (pendingField === "project" || pendingField === "team");

  // Valores de presentación: optimista mientras hay transición, luego del catálogo.
  const displayProject = optimistic.project ?? base.project;
  const displayTeam = optimistic.team !== null ? optimistic.team : base.team;
  const displaySprintPath =
    optimistic.sprintPath !== null ? optimistic.sprintPath : base.sprintPath;

  // Etiqueta formateada del sprint: usa el sprint optimista si existe en la lista.
  const optimisticSprint =
    optimistic.sprintPath !== null
      ? (catalog.sprints.find((s) => s.path === optimistic.sprintPath) ?? null)
      : null;
  const selectedSprintLabel = optimisticSprint
    ? formatSprintOptionLabel(optimisticSprint)
    : base.selectedSprintLabel;

  return {
    ...base,
    project: displayProject,
    team: displayTeam,
    sprintPath: displaySprintPath,
    teamSelectDisabled: !displayProject,
    sprintSelectDisabled: !displayTeam,
    selectedSprintLabel,
    teamsLoading,
    sprintsLoading,
    onProjectChange,
    onTeamChange,
    onSprintChange,
    refreshContext,
  };
}
