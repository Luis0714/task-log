"use client";

import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdoUserStoryHit } from "@/services/news-stories/news-stories.service";

export type NewsStoriesSearchSectionProps = Readonly<{
  query: string;
  onQueryChange: (value: string) => void;
  scopeReady: boolean;
  scopeLabel: string;
  results: ReadonlyArray<AdoUserStoryHit>;
  searching: boolean;
  error: string | null;
  onRetry: () => void;
  onLink: (hit: AdoUserStoryHit) => void;
}>;

type SearchView =
  | { kind: "scoping" }
  | { kind: "idle" }
  | { kind: "searching" }
  | { kind: "error"; message: string }
  | { kind: "empty" }
  | { kind: "results"; hits: ReadonlyArray<AdoUserStoryHit> };

function resolveSearchView(props: NewsStoriesSearchSectionProps): SearchView {
  if (!props.scopeReady) return { kind: "scoping" };
  if (props.searching) return { kind: "searching" };
  if (props.error) return { kind: "error", message: props.error };
  if (props.query.trim().length === 0) return { kind: "idle" };
  if (props.results.length === 0) return { kind: "empty" };
  return { kind: "results", hits: props.results };
}

/**
 * Buscador de HUs de Azure DevOps. Filtra localmente las ya vinculadas para
 * no mostrar duplicados (la regla de unicidad es server-side, esto es UX).
 */
export function NewsStoriesSearchSection(props: NewsStoriesSearchSectionProps) {
  const { query, onQueryChange, scopeReady, scopeLabel, onLink } = props;
  const view = resolveSearchView(props);

  return (
    <section className="flex min-w-0 flex-col gap-3">
      <header className="flex flex-col gap-2">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold">Buscar y vincular</h2>
          <p className="text-muted-foreground text-xs">
            Mínimo 3 caracteres por título o pega un ID numérico. Filtra por
            nombre del proyecto{scopeLabel ? ` y del equipo ${scopeLabel}` : ""}.
          </p>
        </div>
        <div className="flex flex-col gap-1.5 sm:w-1/2">
          <Label htmlFor="news-search">Buscar HUs en Azure</Label>
          <div className="relative">
            <Search
              className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              id="news-search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Busca por título o ID…"
              className="pl-8"
              disabled={!scopeReady}
            />
          </div>
        </div>
      </header>

      <SearchView view={view} onLink={onLink} onRetry={props.onRetry} />
    </section>
  );
}

function SearchView({
  view,
  onLink,
  onRetry,
}: Readonly<{
  view: SearchView;
  onLink: (hit: AdoUserStoryHit) => void;
  onRetry: () => void;
}>) {
  if (view.kind === "scoping") {
    return (
      <EmptyState
        title="Selecciona un proyecto"
        description="Elige un (proyecto, equipo) arriba para buscar HUs en Azure DevOps."
      />
    );
  }
  if (view.kind === "idle") {
    return (
      <EmptyState
        title="Empieza a escribir"
        description="La búsqueda se ejecuta automáticamente al dejar de escribir."
      />
    );
  }
  if (view.kind === "empty") {
    return (
      <EmptyState
        title="Sin coincidencias"
        description="No encontramos HUs para esta búsqueda en el backlog del proyecto."
      />
    );
  }
  if (view.kind === "error") {
    return <SearchError message={view.message} onRetry={onRetry} />;
  }
  if (view.kind === "searching") {
    return <SearchSkeleton />;
  }
  return <ResultsTable hits={view.hits} onLink={onLink} />;
}

function ResultsTable({
  hits,
  onLink,
}: Readonly<{
  hits: ReadonlyArray<AdoUserStoryHit>;
  onLink: (hit: AdoUserStoryHit) => void;
}>) {
  return (
    <div className="border-border/60 overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
          <tr>
            <th className="px-3 py-2 text-left font-medium">ID</th>
            <th className="px-3 py-2 text-left font-medium">Título</th>
            <th className="px-3 py-2 text-left font-medium">Estado</th>
            <th className="px-3 py-2 text-right font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {hits.map((hit) => (
            <tr
              key={hit.id}
              className="border-border/40 border-t transition-colors hover:bg-muted/40"
            >
              <td className="text-muted-foreground px-3 py-2 align-middle font-mono text-xs">
                #{hit.id}
              </td>
              <td className="px-3 py-2 align-middle">
                <span className="line-clamp-1 block max-w-md" title={hit.title}>
                  {hit.title}
                </span>
              </td>
              <td className="text-muted-foreground px-3 py-2 align-middle text-xs">
                {hit.state || "—"}
              </td>
              <td className="px-3 py-2 text-right align-middle">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onLink(hit)}
                >
                  <Plus className="size-3.5" aria-hidden />
                  Vincular
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: Readonly<{ title: string; description: string }>) {
  return (
    <div className="text-muted-foreground rounded-lg border border-dashed py-8 text-center text-sm">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1">{description}</p>
    </div>
  );
}

function SearchError({
  message,
  onRetry,
}: Readonly<{ message: string; onRetry: () => void }>) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-6">
      <p className="text-destructive text-sm">{message}</p>
      <Button type="button" size="sm" variant="outline" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="border-border/60 overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
          <tr>
            <th className="px-3 py-2 text-left font-medium">ID</th>
            <th className="px-3 py-2 text-left font-medium">Título</th>
            <th className="px-3 py-2 text-left font-medium">Estado</th>
            <th className="px-3 py-2 text-right font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 3 }).map((_, idx) => (
            <tr key={`search-skeleton-${idx}`} className="border-border/40 border-t">
              <td className="px-3 py-2 align-middle">
                <Skeleton className="h-4 w-16" />
              </td>
              <td className="px-3 py-2 align-middle">
                <Skeleton className="h-4 w-72 max-w-full" />
              </td>
              <td className="px-3 py-2 align-middle">
                <Skeleton className="h-4 w-16" />
              </td>
              <td className="px-3 py-2 text-right align-middle">
                <Skeleton className="ml-auto h-7 w-20" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}