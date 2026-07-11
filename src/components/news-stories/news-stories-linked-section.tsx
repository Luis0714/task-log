"use client";

import { Loader2, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { NewsStoryValidationEntry } from "@/lib/news-stories/types";
import type { ProjectTeamNewsStory } from "@/lib/db";
import { cn } from "@/lib/utils";

export type NewsStoriesLinkedSectionProps = Readonly<{
  items: ReadonlyArray<ProjectTeamNewsStory>;
  loading: boolean;
  validationById: ReadonlyMap<string, NewsStoryValidationEntry>;
  validationLoading: boolean;
  validationError: string | null;
  onUnlink: (item: ProjectTeamNewsStory) => void;
  onRetryValidation: () => void;
}>;

export function NewsStoriesLinkedSection({
  items,
  loading,
  validationById,
  validationLoading,
  validationError,
  onUnlink,
  onRetryValidation,
}: NewsStoriesLinkedSectionProps) {
  const empty = !loading && items.length === 0;

  return (
    <section className="flex min-w-0 flex-col gap-3">
      <header className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold">HUs vinculadas</h2>
          <p className="text-muted-foreground text-xs">
            {describeLinkedCount(items.length)}
          </p>
        </div>
        {validationLoading ? (
          <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
            <Loader2 className="size-3 animate-spin" aria-hidden />
            Validando contra Azure…
          </span>
        ) : null}
      </header>

      {validationError ? (
        <div className="text-muted-foreground flex items-center justify-between gap-2 rounded-lg border border-dashed py-2 pl-3 pr-2 text-xs">
          <span>
            No se pudo validar el estado en Azure: {validationError}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onRetryValidation}
          >
            Reintentar
          </Button>
        </div>
      ) : null}

      {loading ? (
        <LinkedSkeleton />
      ) : empty ? (
        <p className="text-muted-foreground rounded-lg border border-dashed py-8 text-center text-sm">
          No hay HUs vinculadas a este (Proyecto, Equipo). Usa el buscador de
          abajo para añadir.
        </p>
      ) : (
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
              {items.map((row) => {
                const validation = validationById.get(row.id);
                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-border/40 border-t transition-colors hover:bg-muted/40",
                    )}
                  >
                    <td className="text-muted-foreground px-3 py-2 align-middle font-mono text-xs">
                      #{row.workItemId}
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <span className="line-clamp-1 block max-w-md">
                        {row.workItemTitleSnapshot ?? (
                          <span className="text-muted-foreground italic">
                            (HU sin título guardado)
                          </span>
                        )}
                      </span>
                      {renderRenamedHint(validation)}
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <ValidationBadge validation={validation} />
                    </td>
                    <td className="px-3 py-2 text-right align-middle">
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Desvincular"
                        onClick={() => onUnlink(row)}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ValidationBadge({
  validation,
}: Readonly<{ validation: NewsStoryValidationEntry | undefined }>) {
  if (!validation || validation.status === "active") {
    return (
      <span className="text-muted-foreground text-xs">
        {validation?.currentState ?? "Activa"}
      </span>
    );
  }
  if (validation.status === "deleted") {
    return (
      <Badge variant="destructive" className="shrink-0">
        Eliminada en Azure
      </Badge>
    );
  }
  return (
    <Badge variant="plan" className="shrink-0">
      Renombrada
    </Badge>
  );
}

function describeLinkedCount(count: number): string {
  if (count === 0) return "Ninguna HU vinculada todavía.";
  if (count === 1) return "1 HU vinculada.";
  return `${count} HUs vinculadas.`;
}

function renderRenamedHint(
  validation: NewsStoryValidationEntry | undefined,
): React.ReactNode {
  if (validation?.status !== "renamed") return null;
  const title = validation.currentTitle?.trim();
  if (!title) return null;
  return (
    <span className="text-muted-foreground mt-0.5 block text-xs">
      Renombrada a: {title}
    </span>
  );
}

function LinkedSkeleton() {
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
            <tr key={`skeleton-${idx}`} className="border-border/40 border-t">
              <td className="px-3 py-2 align-middle">
                <Skeleton className="h-4 w-16" />
              </td>
              <td className="px-3 py-2 align-middle">
                <Skeleton className="h-4 w-72 max-w-full" />
              </td>
              <td className="px-3 py-2 align-middle">
                <Skeleton className="h-4 w-20" />
              </td>
              <td className="px-3 py-2 text-right align-middle">
                <Skeleton className="ml-auto h-7 w-7" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}