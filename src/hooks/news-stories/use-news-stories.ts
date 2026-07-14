"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  NewsStoriesValidationResponse,
  NewsStoryValidationEntry,
} from "@/lib/news-stories/types";
import {
  linkNewsStory as linkNewsStoryRequest,
  listNewsStories,
  unlinkNewsStory as unlinkNewsStoryRequest,
  validateNewsStories,
  type NewsStoriesServiceResult,
} from "@/services/news-stories/news-stories.service";
import { useBacklogPbis } from "@/hooks/use-backlog-pbis";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import type { ProjectTeamNewsStory } from "@/lib/db";
import { appToast } from "@/lib/toast";

export type NewsStoriesScope = Readonly<{
  selectedProjects: ReadonlyArray<string>;
  selectedTeams: ReadonlyArray<string>;
}>;

export type UseNewsStoriesResult = Readonly<{
  linked: ReadonlyArray<ProjectTeamNewsStory>;
  linkedLoading: boolean;
  validation: ReadonlyMap<string, NewsStoryValidationEntry>;
  validationLoading: boolean;
  validationError: string | null;
  refreshLinked: () => Promise<void>;
  refreshValidation: () => Promise<void>;

  /** HUs del backlog del PRIMER proyecto seleccionado (alimenta el picker
   *  de "Vincular HU"). El picker sigue siendo single-scope para que el
   *  link resultante tenga un (proyecto, equipo) único y bien definido. */
  backlog: ReadonlyArray<AdoWorkItemOptionDto>;
  backlogLoading: boolean;

  /**
   * Vincula la HU al (proyecto, equipo) indicado. Cuando la pantalla es
   * multi-scope, el shell decide a qué par vincular y lo pasa aquí.
   */
  link: (
    item: AdoWorkItemOptionDto,
    target: { projectId: string; teamId: string | null },
  ) => Promise<NewsStoriesServiceResult<ProjectTeamNewsStory>>;
  unlink: (id: string) => Promise<NewsStoriesServiceResult<{ ok: true }>>;
}>;

function mapValidationEntries(
  entries: ReadonlyArray<NewsStoryValidationEntry>,
): ReadonlyMap<string, NewsStoryValidationEntry> {
  const map = new Map<string, NewsStoryValidationEntry>();
  for (const entry of entries) {
    map.set(entry.id, entry);
  }
  return map;
}

/**
 * Orquesta el estado del módulo de HUs de novedad multi-scope:
 * - Lista las HUs vinculadas en BD para los (proyectos × equipos) seleccionados.
 * - Carga el backlog del PRIMER proyecto seleccionado (alimenta el picker de
 *   "Vincular HU"; el vínculo sigue siendo single-scope para tener un par
 *   (proyecto, equipo) único al guardar).
 * - Vincula / desvincula con feedback al usuario.
 *
 * Los componentes sólo orquestan presentación; este hook coordina fetching +
 * estado.
 */
export function useNewsStories(scope: NewsStoriesScope): UseNewsStoriesResult {
  const [linked, setLinked] = useState<ReadonlyArray<ProjectTeamNewsStory>>([]);
  const [linkedLoading, setLinkedLoading] = useState(false);

  const [validation, setValidation] = useState<
    ReadonlyMap<string, NewsStoryValidationEntry>
  >(new Map());
  const [validationLoading, setValidationLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const firstProject = scope.selectedProjects[0] ?? null;
  const { pbis: backlog, loading: backlogLoading } = useBacklogPbis({
    project: firstProject,
  });

  // Scopes estables para usar en deps de useCallback/useEffect — el caller
  // pasa arrays nuevos en cada render; queremos que las queries sólo se
  // disparen cuando el contenido cambia de verdad.
  const projectsKey = scope.selectedProjects.join("|");
  const teamsKey = scope.selectedTeams.join("|");

  const refreshLinked = useCallback(async () => {
    setLinkedLoading(true);
    const result = await listNewsStories({
      projects: scope.selectedProjects,
      teams: scope.selectedTeams,
    });
    setLinkedLoading(false);
    if (!result.ok) {
      appToast.error(result.message);
      setLinked([]);
      return;
    }
    setLinked(result.value);
  }, [projectsKey, teamsKey, scope.selectedProjects, scope.selectedTeams]);

  const refreshValidation = useCallback(async () => {
    setValidationLoading(true);
    setValidationError(null);
    const result = await validateNewsStories({
      projects: scope.selectedProjects,
      teams: scope.selectedTeams,
    });
    setValidationLoading(false);
    if (!result.ok) {
      setValidationError(result.message);
      setValidation(new Map());
      return;
    }
    setValidation(mapValidationEntries(result.value));
  }, [projectsKey, teamsKey, scope.selectedProjects, scope.selectedTeams]);

  useEffect(() => {
    void refreshLinked();
  }, [refreshLinked]);

  useEffect(() => {
    void refreshValidation();
  }, [refreshValidation]);

  const link = useCallback(
    async (
      item: AdoWorkItemOptionDto,
      target: { projectId: string; teamId: string | null },
    ) => {
      const created = await linkNewsStoryRequest({
        projectId: target.projectId,
        teamId: target.teamId,
        workItemId: item.id,
        workItemTitle: item.title,
      });
      if (created.ok) {
        await refreshLinked();
      }
      return created;
    },
    [refreshLinked],
  );

  const unlink = useCallback(
    async (id: string) => {
      const result = await unlinkNewsStoryRequest(id);
      if (result.ok) {
        await refreshLinked();
      }
      return result;
    },
    [refreshLinked],
  );

  return {
    linked,
    linkedLoading,
    validation,
    validationLoading,
    validationError,
    refreshLinked,
    refreshValidation,
    backlog,
    backlogLoading,
    link,
    unlink,
  };
}

export type { NewsStoriesValidationResponse };
