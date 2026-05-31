"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type AdoContextTeamDefaultHintProps = {
  project: string;
  team: string;
  defaultProject: string | null;
  defaultTeam: string | null;
  pending?: boolean;
  disabled?: boolean;
  onSave?: () => void | Promise<void>;
  className?: string;
};

const DEFAULT_SCOPE_COPY =
  "Dashboard, registro de tiempo, tareas, bugs, historias de usuario y análisis de sprints.";

function isContextFullyDefault(
  project: string,
  team: string,
  defaultProject: string | null,
  defaultTeam: string | null,
): boolean {
  return project === (defaultProject ?? "") && team === (defaultTeam ?? "");
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
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!project || !team || !onSave) return null;

  const isFullyDefault = isContextFullyDefault(project, team, defaultProject, defaultTeam);
  const controlsDisabled = disabled || pending;

  async function handleConfirm() {
    try {
      await onSave?.();
      setDialogOpen(false);
    } catch {
      // El hook ya muestra el toast de error.
    }
  }

  return (
    <>
      <div className={cn("col-span-full space-y-1 pt-0.5", className)}>
        {isFullyDefault ? (
          <p className="text-muted-foreground text-xs leading-snug">
            Este proyecto y equipo son tu selección predeterminada al abrir la app.
          </p>
        ) : null}
        <button
          type="button"
          className={cn(
            "text-primary inline-flex items-center gap-1.5 text-xs font-medium underline underline-offset-2 transition-colors",
            "hover:text-primary/80 disabled:cursor-not-allowed disabled:opacity-50",
          )}
          disabled={controlsDisabled}
          onClick={() => setDialogOpen(true)}
        >
          {pending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Guardando…
            </>
          ) : (
            "Establecer como predeterminado"
          )}
        </button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Establecer como predeterminado</DialogTitle>
            <DialogDescription>
              {isFullyDefault
                ? "Estos valores ya son tu selección predeterminada. Puedes confirmarlos de nuevo si lo deseas."
                : "Se guardará tu selección actual como contexto inicial en toda la aplicación."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <span className="text-foreground font-medium">Proyecto:</span> {project}
              </li>
              <li>
                <span className="text-foreground font-medium">Equipo:</span> {team}
              </li>
            </ul>
            <p>
              Al abrir la app o entrar a una pantalla con filtros, estos valores se aplicarán por
              defecto en {DEFAULT_SCOPE_COPY} Podrás cambiarlos en cualquier momento sin perder tu
              predeterminado guardado.
            </p>
          </div>
          <DialogFooter showCloseButton={false}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleConfirm} disabled={pending}>
              {pending ? "Guardando…" : "Aceptar y guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
