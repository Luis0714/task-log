"use client";

import { useCallback, useMemo, useState } from "react";

import { Plus } from "lucide-react";

import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { Button } from "@/components/ui/button";
import { ConfirmUnlinkDialog } from "@/components/news-stories/confirm-unlink-dialog";
import { NewsStoriesLinkedSection } from "@/components/news-stories/news-stories-linked-section";
import { NewsStoriesLinkDialog } from "@/components/news-stories/news-stories-link-dialog";
import { NewsStoriesReportedSection } from "@/components/news-stories/news-stories-reported-section";
import {
  NewsStoriesScopeFilters,
  type NewsStoriesScopeFiltersValue,
} from "@/components/news-stories/news-stories-scope-filters";
import { useNewsStories } from "@/hooks/news-stories/use-news-stories";
import type { ReportedNewsScope } from "@/lib/azure-devops/list-reported-news";
import {
  pruneTeamSelection,
  teamNamesForProjects,
} from "@/lib/filters/teams-by-project";
import type { ProjectTeamNewsStory } from "@/lib/db";
import { appToast } from "@/lib/toast";

export type NewsStoriesShellProps = Readonly<{
  catalog: AdoCatalogSnapshot;
  projects: ReadonlyArray<string>;
  /** Selección guardada del usuario para el scope `newsStories`. Si vacía,
   *  el selector empieza vacío (modo "Todos"). */
  initialSelectedProjects?: ReadonlyArray<string>;
  initialSelectedTeams?: ReadonlyArray<string>;
}>;

/**
 * Shell de la pantalla `/admin/novedades`. Composición:
 *
 *   <NewsStoriesScopeFilters>      ← multi-checkbox (proyectos × equipos)
 *   <NewsStoriesLinkedSection>     ← lista de HUs vinculadas (union de scopes)
 *   <NewsStoriesReportedSection>   ← novedades reportadas (union de scopes)
 *
 * Diálogos:
 *   - Link:  abre para vincular una HU al (proyecto, equipo) seleccionado.
 *           El primer proyecto + primer equipo definen la clave destino.
 *   - Unlink: confirma borrar una HU vinculada concreta.
 */
export function NewsStoriesShell({
  catalog,
  projects,
  initialSelectedProjects = [],
  initialSelectedTeams = [],
}: NewsStoriesShellProps) {
  const [scopeFilters, setScopeFilters] = useState<NewsStoriesScopeFiltersValue>(
    () => ({
      selectedProjects: [...initialSelectedProjects],
      selectedTeams: [...initialSelectedTeams],
    }),
  );

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkSaving, setLinkSaving] = useState(false);
  const [unlinkStory, setUnlinkStory] = useState<ProjectTeamNewsStory | null>(
    null,
  );

  const selectedProjectsArray = useMemo(
    () => Array.from(scopeFilters.selectedProjects),
    [scopeFilters.selectedProjects],
  );
  const selectedTeamsArray = useMemo(
    () => Array.from(scopeFilters.selectedTeams),
    [scopeFilters.selectedTeams],
  );

  // Los equipos ofrecidos dependen de los proyectos seleccionados; al cambiar
  // la selección se podan los equipos que dejan de estar disponibles.
  const teams = useMemo(
    () => teamNamesForProjects(catalog.teamsByProject, selectedProjectsArray),
    [catalog.teamsByProject, selectedProjectsArray],
  );
  const handleScopeFiltersChange = useCallback(
    (next: NewsStoriesScopeFiltersValue) => {
      setScopeFilters({
        selectedProjects: next.selectedProjects,
        selectedTeams: pruneTeamSelection(
          next.selectedTeams,
          teamNamesForProjects(catalog.teamsByProject, next.selectedProjects),
        ),
      });
    },
    [catalog.teamsByProject],
  );

  const {
    linked,
    linkedLoading,
    validation,
    validationLoading,
    validationError,
    refreshValidation,
    backlog,
    backlogLoading,
    link,
    unlink,
  } = useNewsStories({
    selectedProjects: selectedProjectsArray,
    selectedTeams: selectedTeamsArray,
  });

  // Para Vincular HU necesitamos un par (proyecto, equipo) único. Tomamos
  // el primero seleccionado de cada lista. Si no hay selección, el botón
  // queda deshabilitado.
  const firstProject = selectedProjectsArray[0];
  const firstTeam = selectedTeamsArray[0];
  const hasLinkTarget =
    Boolean(firstProject) && selectedTeamsArray.length <= 1;

  const handleLink = useCallback(
    async (
      item: Parameters<typeof link>[0],
      target: Parameters<typeof link>[1],
    ) => {
      setLinkSaving(true);
      try {
        const result = await link(item, target);
        if (!result.ok) {
          return { ok: false, message: result.message };
        }
        return { ok: true };
      } finally {
        setLinkSaving(false);
      }
    },
    [link],
  );

  const handleUnlink = useCallback(
    async (id: string): Promise<boolean> => {
      const result = await unlink(id);
      if (!result.ok) {
        appToast.error(result.message);
        return false;
      }
      appToast.success("HU desvinculada.");
      return true;
    },
    [unlink],
  );

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <NewsStoriesScopeFilters
        value={scopeFilters}
        onChange={handleScopeFiltersChange}
        projects={projects}
        teams={teams}
      />

      <NewsStoriesLinkedSection
        items={linked}
        loading={linkedLoading}
        validationById={validation}
        validationLoading={validationLoading}
        validationError={validationError}
        onUnlink={setUnlinkStory}
        onRetryValidation={refreshValidation}
        renderLinkTrigger={() => (
          <Button
            type="button"
            variant="outline"
            disabled={
              !hasLinkTarget ||
              backlogLoading ||
              linkSaving ||
              linkedLoading ||
              Boolean(catalog.defaultProject) === false
            }
            onClick={() => setLinkDialogOpen(true)}
            title={
              !firstProject
                ? "Selecciona un proyecto para vincular HUs"
                : !hasLinkTarget
                  ? "Reduce a un solo equipo para poder vincular"
                  : undefined
            }
          >
            <Plus className="size-4" aria-hidden />
            Vincular HU
          </Button>
        )}
      />

      <NewsStoriesLinkDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        pbis={backlog}
        scopeReady={Boolean(firstProject)}
        saving={linkSaving}
        onConfirm={async (item) => {
          if (!firstProject) {
            return { ok: false, message: "Selecciona un proyecto." };
          }
          return handleLink(item, {
            projectId: firstProject,
            teamId: firstTeam ?? null,
          });
        }}
      />

      <NewsStoriesReportedSection
        scopes={buildReportedScopes(
          selectedProjectsArray,
          selectedTeamsArray,
        )}
      />

      {unlinkStory ? (
        <ConfirmUnlinkDialog
          story={unlinkStory}
          open
          onOpenChange={(open) => {
            if (!open) setUnlinkStory(null);
          }}
          onConfirm={() => handleUnlink(unlinkStory.id)}
        />
      ) : null}
    </div>
  );
}

/**
 * Construye el universo multi-scope (proyectos × equipos) que consume la
 * sección de novedades reportadas. Si no hay equipos, cada proyecto se
 * serializa con `teamId = null` (a nivel de proyecto).
 */
function buildReportedScopes(
  projects: ReadonlyArray<string>,
  teams: ReadonlyArray<string>,
): ReadonlyArray<ReportedNewsScope> {
  if (projects.length === 0) return [];
  const result: ReportedNewsScope[] = [];
  for (const projectId of projects) {
    if (teams.length === 0) {
      result.push({ projectId, teamId: null });
    } else {
      for (const teamId of teams) {
        result.push({ projectId, teamId });
      }
    }
  }
  return result;
}
