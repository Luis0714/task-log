"use client";

import { Bookmark, BookmarkPlus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AdoContextTeamDefaultHintProps = {
  project: string;
  team: string;
  defaultProject: string | null;
  defaultTeam: string | null;
  pending?: boolean;
  disabled?: boolean;
  onSave?: () => void;
  className?: string;
};

function buildSaveLabel(
  project: string,
  team: string,
  defaultProject: string | null,
  defaultTeam: string | null,
): string {
  const projectChanged = project !== (defaultProject ?? "");
  const teamChanged = team !== (defaultTeam ?? "");

  if (projectChanged && teamChanged) return "Guardar proyecto y equipo como predeterminados";
  if (projectChanged) return "Guardar proyecto como predeterminado";
  return "Guardar equipo como predeterminado";
}

export function AdoContextTeamDefaultHint({
  project,
  team,
  defaultProject,
  defaultTeam,
  pending = false,
  disabled = false,
  onSave,
  className,
}: AdoContextTeamDefaultHintProps) {
  if (!team) return null;

  const isDefaultTeam = team === (defaultTeam ?? "");
  const isDefaultProject = project === (defaultProject ?? "");
  const isFullyDefault = isDefaultTeam && isDefaultProject;

  if (isFullyDefault) {
    return (
      <p
        className={cn(
          "text-muted-foreground flex items-start gap-1.5 text-xs leading-snug",
          className,
        )}
      >
        <Bookmark className="text-primary mt-0.5 size-3.5 shrink-0" aria-hidden />
        <span>Este es tu equipo y proyecto predeterminados al abrir la app.</span>
      </p>
    );
  }

  if (!onSave) return null;

  return (
    <Button
      type="button"
      variant="link"
      size="sm"
      className={cn("h-auto min-h-0 justify-start px-0 py-0 text-xs", className)}
      disabled={disabled || pending}
      onClick={onSave}
    >
      {pending ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      ) : (
        <BookmarkPlus className="size-3.5" aria-hidden />
      )}
      {pending ? "Guardando…" : buildSaveLabel(project, team, defaultProject, defaultTeam)}
    </Button>
  );
}
