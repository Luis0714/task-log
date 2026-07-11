"use client";

import { useCallback, useState } from "react";

import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { ConfirmLinkDialog } from "@/components/news-stories/confirm-link-dialog";
import { ConfirmUnlinkDialog } from "@/components/news-stories/confirm-unlink-dialog";
import { NewsStoriesLinkedSection } from "@/components/news-stories/news-stories-linked-section";
import {
  NewsStoriesScopeSelector,
  type NewsStoriesScopeValue,
} from "@/components/news-stories/news-stories-scope-selector";
import { NewsStoriesSearchSection } from "@/components/news-stories/news-stories-search-section";
import { useNewsStories } from "@/hooks/news-stories/use-news-stories";
import type { ProjectTeamNewsStory } from "@/lib/db";
import { appToast } from "@/lib/toast";
import type { AdoUserStoryHit } from "@/services/news-stories/news-stories.service";

export type NewsStoriesShellProps = Readonly<{
  catalog: AdoCatalogSnapshot;
  projects: ReadonlyArray<string>;
  teams: ReadonlyArray<string>;
}>;

/**
 * Punto de entrada del módulo de HUs de novedad. Sólo compone los
 * sub-componentes y mantiene el estado efímero de los diálogos de
 * confirmación; el resto del estado vive en `useNewsStories`.
 */
export function NewsStoriesShell({
  catalog,
  projects,
  teams,
}: NewsStoriesShellProps) {
  const [scope, setScope] = useState<NewsStoriesScopeValue>(() => ({
    projectId: catalog.defaultProject ?? "",
    teamId: catalog.defaultTeam ?? "",
  }));
  const [linkHit, setLinkHit] = useState<AdoUserStoryHit | null>(null);
  const [unlinkStory, setUnlinkStory] = useState<ProjectTeamNewsStory | null>(
    null,
  );

  const {
    linked,
    linkedLoading,
    validation,
    validationLoading,
    validationError,
    refreshValidation,
    searchInput,
    setSearchInput,
    searchResults,
    searching,
    searchError,
    retrySearch,
    link,
    unlink,
  } = useNewsStories(scope);

  const handleLink = useCallback(
    async (hit: AdoUserStoryHit): Promise<boolean> => {
      const result = await link(hit);
      if (!result.ok) {
        appToast.error(result.message);
        return false;
      }
      appToast.success("HU vinculada.");
      return true;
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

  const scopeReady = scope.projectId.length > 0;
  const scopeLabel = scope.teamId;

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-lg border p-4">
        <header className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold">Contexto</h2>
          <p className="text-muted-foreground text-xs">
            Selecciona el (Proyecto, Equipo) cuyas HUs de novedad quieres
            administrar. El equipo es opcional: déjalo vacío para configurar a
            nivel de proyecto.
          </p>
        </header>
        <NewsStoriesScopeSelector
          value={scope}
          onChange={setScope}
          projects={projects}
          teams={teams}
        />
      </section>

      <NewsStoriesLinkedSection
        items={linked}
        loading={linkedLoading}
        validationById={validation}
        validationLoading={validationLoading}
        validationError={validationError}
        onUnlink={setUnlinkStory}
        onRetryValidation={refreshValidation}
      />

      <NewsStoriesSearchSection
        query={searchInput}
        onQueryChange={setSearchInput}
        scopeReady={scopeReady}
        scopeLabel={scopeLabel}
        results={searchResults}
        searching={searching}
        error={searchError}
        onRetry={retrySearch}
        onLink={setLinkHit}
      />

      {linkHit ? (
        <ConfirmLinkDialog
          hit={linkHit}
          open
          onOpenChange={(open) => {
            if (!open) setLinkHit(null);
          }}
          onConfirm={() => handleLink(linkHit)}
        />
      ) : null}

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