"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import type { ProjectTeamNewsStory } from "@/lib/db";
import { appToast } from "@/lib/toast";

export type NewsStoriesShellProps = Readonly<{
  catalog: AdoCatalogSnapshot;
  projects: string[];
  teams: string[];
}>;

type AdoUserStoryHit = {
  id: number;
  title: string;
  state: string;
  areaPath: string | null;
};

const SEARCH_DEBOUNCE_MS = 350;

export function NewsStoriesShell({
  catalog,
  projects,
  teams,
}: NewsStoriesShellProps) {
  const [scope, setScope] = useState<{ project: string; team: string }>(() => ({
    project: catalog.defaultProject ?? "",
    team: catalog.defaultTeam ?? "",
  }));
  const [linked, setLinked] = useState<ProjectTeamNewsStory[]>([]);
  const [linkedLoading, setLinkedLoading] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<AdoUserStoryHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [linking, setLinking] = useState<AdoUserStoryHit | null>(null);
  const [confirmUnlink, setConfirmUnlink] = useState<ProjectTeamNewsStory | null>(
    null,
  );
  const [unlinking, setUnlinking] = useState(false);

  const loadLinked = useCallback(async () => {
    if (!scope.project) {
      setLinked([]);
      return;
    }
    setLinkedLoading(true);
    try {
      const params = new URLSearchParams({ projectId: scope.project });
      if (scope.team) params.set("teamId", scope.team);
      const res = await fetch(`/api/news-stories?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        setLinked([]);
        return;
      }
      const body = (await res.json()) as { stories: ProjectTeamNewsStory[] };
      setLinked(body.stories);
    } catch {
      setLinked([]);
    } finally {
      setLinkedLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    void loadLinked();
  }, [loadLinked]);

  useEffect(() => {
    if (searchInput.trim().length < 3) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }
    const ac = new AbortController();
    const handle = setTimeout(async () => {
      if (!scope.project) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      setSearchError(null);
      try {
        const params = new URLSearchParams({
          project: scope.project,
          q: searchInput.trim(),
        });
        if (scope.team) params.set("team", scope.team);
        const res = await fetch(
          `/api/ado/news-stories?${params.toString()}`,
          { cache: "no-store", signal: ac.signal },
        );
        if (!res.ok) {
          setSearchError("No se pudo buscar en Azure DevOps.");
          setSearchResults([]);
          return;
        }
        const body = (await res.json()) as { stories: AdoUserStoryHit[] };
        const linkedIds = new Set(linked.map((row) => row.workItemId));
        setSearchResults(
          body.stories.filter((hit) => !linkedIds.has(hit.id)),
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setSearchError("No se pudo buscar en Azure DevOps.");
      } finally {
        setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      ac.abort();
      clearTimeout(handle);
    };
  }, [searchInput, scope, linked]);

  async function handleLinkConfirm(): Promise<boolean> {
    if (!linking) return false;
    try {
      const res = await fetch("/api/news-stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: scope.project,
          teamId: scope.team || null,
          workItemId: linking.id,
          workItemTitle: linking.title,
        }),
      });
      if (res.status === 409) {
        appToast.error("Esta HU ya está vinculada.");
        return false;
      }
      if (!res.ok) {
        appToast.error("No se pudo vincular la HU.");
        return false;
      }
      appToast.success("HU vinculada.");
      setSearchResults((prev) => prev.filter((hit) => hit.id !== linking.id));
      await loadLinked();
      return true;
    } catch {
      appToast.error("No se pudo vincular la HU.");
      return false;
    }
  }

  async function handleUnlinkConfirm(): Promise<boolean> {
    if (!confirmUnlink) return false;
    setUnlinking(true);
    try {
      const res = await fetch(`/api/news-stories/${confirmUnlink.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        appToast.error("No se pudo desvincular.");
        return false;
      }
      appToast.success("HU desvinculada.");
      setConfirmUnlink(null);
      await loadLinked();
      return true;
    } catch {
      appToast.error("No se pudo desvincular.");
      return false;
    } finally {
      setUnlinking(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <header className="space-y-1">
        <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
          Historias de Novedad
        </h1>
        <p className="text-muted-foreground text-sm">
          Configura las HUs de Azure DevOps que el reporte reconocerá como
          novedades dentro de cada (Proyecto, Equipo).
        </p>
      </header>

      <section className="flex flex-col gap-4 rounded-lg border p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="news-scope-project">Proyecto</Label>
            <select
              id="news-scope-project"
              value={scope.project}
              onChange={(e) =>
                setScope((s) => ({ ...s, project: e.target.value }))
              }
              className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
            >
              <option value="">Selecciona un proyecto</option>
              {projects.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="news-scope-team">Equipo (opcional)</Label>
            <select
              id="news-scope-team"
              value={scope.team}
              onChange={(e) =>
                setScope((s) => ({ ...s, team: e.target.value }))
              }
              className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
            >
              <option value="">A nivel proyecto</option>
              {teams.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <header className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">
            HUs vinculadas{" "}
            <span className="text-muted-foreground text-xs font-normal">
              ({linked.length})
            </span>
          </h2>
        </header>
        {linkedLoading ? (
          <LinkedSkeleton />
        ) : linked.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border border-dashed py-8 text-center text-sm">
            No hay HUs vinculadas a este (Proyecto, Equipo). Usa el buscador
            de abajo para añadir.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {linked.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-4 px-4 py-2 text-sm"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">
                    #{row.workItemId}
                  </span>
                  <span className="truncate">
                    {row.workItemTitleSnapshot ?? `(HU sin título guardado)`}
                  </span>
                </div>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Desvincular"
                  onClick={() => setConfirmUnlink(row)}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <header className="flex flex-col gap-2">
          <h2 className="text-base font-semibold">Buscar y vincular</h2>
          <div className="relative">
            <Search
              className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              id="news-search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Busca por título o ID en el backlog del proyecto…"
              className="pl-8"
              disabled={!scope.project}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Mínimo 3 caracteres. Filtra por nombre del proyecto
            {scope.team ? ` y del equipo ${scope.team}` : ""}.
          </p>
        </header>
        {searching ? (
          <SearchSkeleton />
        ) : searchError ? (
          <p className="text-destructive rounded-lg border border-dashed py-6 text-center text-sm">
            {searchError}
          </p>
        ) : !scope.project ? (
          <p className="text-muted-foreground rounded-lg border border-dashed py-6 text-center text-sm">
            Selecciona un proyecto para buscar HUs en Azure DevOps.
          </p>
        ) : searchInput.trim().length === 0 ? (
          <p className="text-muted-foreground rounded-lg border border-dashed py-6 text-center text-sm">
            Empieza a escribir para buscar.
          </p>
        ) : searchResults.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border border-dashed py-6 text-center text-sm">
            Sin coincidencias en el backlog.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {searchResults.map((hit) => (
              <li
                key={hit.id}
                className="flex items-center justify-between gap-4 px-4 py-2 text-sm"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">
                    #{hit.id}
                  </span>
                  <span className="truncate" title={hit.title}>
                    {hit.title}
                  </span>
                  {hit.state ? (
                    <span className="text-muted-foreground text-xs">
                      {hit.state}
                    </span>
                  ) : null}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setLinking(hit)}
                >
                  <Plus className="size-3.5" aria-hidden />
                  Vincular
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {linking ? (
        <ConfirmLinkDialog hit={linking} onConfirm={handleLinkConfirm} />
      ) : null}
      {confirmUnlink ? (
        <ConfirmUnlinkDialog
          story={confirmUnlink}
          submitting={unlinking}
          onConfirm={handleUnlinkConfirm}
        />
      ) : null}
    </div>
  );
}

function ConfirmLinkDialog({
  hit,
  onConfirm,
}: {
  hit: AdoUserStoryHit;
  onConfirm: () => Promise<boolean>;
}) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vincular HU de novedad</DialogTitle>
          <DialogDescription>
            #{hit.id} · {hit.title}
          </DialogDescription>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">
          Esta HU será reconocida como novedad dentro del (Proyecto, Equipo)
          actualmente seleccionado.
        </p>
        <DialogFooter>
          <DialogClose
            render={<Button variant="outline" disabled={submitting} />}
          >
            Cancelar
          </DialogClose>
          <Button
            type="button"
            disabled={submitting}
            onClick={async () => {
              setSubmitting(true);
              const ok = await onConfirm();
              setSubmitting(false);
              if (ok) window.location.reload();
            }}
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Vincular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmUnlinkDialog({
  story,
  submitting,
  onConfirm,
}: {
  story: ProjectTeamNewsStory;
  submitting: boolean;
  onConfirm: () => Promise<boolean>;
}) {
  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Desvincular HU</DialogTitle>
          <DialogDescription>
            #{story.workItemId} ·{" "}
            {story.workItemTitleSnapshot ?? "(sin título guardado)"}
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm">
          La HU dejará de contar como novedad en este (Proyecto, Equipo). Podrás
          volver a vincularla después.
        </p>
        <DialogFooter>
          <DialogClose
            render={<Button variant="outline" disabled={submitting} />}
          >
            Cancelar
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            disabled={submitting}
            onClick={async () => {
              const ok = await onConfirm();
              if (ok) window.location.reload();
            }}
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Desvincular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LinkedSkeleton() {
  return (
    <ul className="divide-y rounded-lg border">
      {Array.from({ length: 3 }).map((_, idx) => (
        <li key={idx} className="flex items-center gap-4 px-4 py-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-6 w-6" />
        </li>
      ))}
    </ul>
  );
}

function SearchSkeleton() {
  return (
    <ul className="divide-y rounded-lg border">
      {Array.from({ length: 3 }).map((_, idx) => (
        <li key={idx} className="flex items-center gap-4 px-4 py-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-7 w-20" />
        </li>
      ))}
    </ul>
  );
}
