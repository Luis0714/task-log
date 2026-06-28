"use client";

import { ClipboardList, Clock, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

type QuickAction = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

/**
 * Quick actions cortas que disparan el flujo principal del agente cuando el
 * usuario aún no escribió nada. Cada una es un atajo semántico al feature
 * correspondiente (log-work, create-tasks, sprint-review) — el copy refleja
 * la acción, NO la pantalla de ChatGPT.
 */
const ACTIONS: ReadonlyArray<QuickAction> = [
  {
    id: "log-hours",
    label: "Registrar mis horas",
    icon: Clock,
  },
  {
    id: "create-tasks",
    label: "Crear tareas",
    icon: ClipboardList,
  },
  {
    id: "sprint-status",
    label: "¿Cómo va mi sprint?",
    icon: TrendingUp,
  },
];

export type QuickActionPillsProps = {
  /**
   * Prompt a inyectar en el composer al hacer click. El padre se encarga
   * de `setMessage(prompt)` + focus en el textarea.
   */
  onPick?: (prompt: string) => void;
  className?: string;
};

/**
 * Pills de acciones rápidas que aparecen DEBAJO del composer en el empty
 * state. Cada pill es un botón con icono + label corto. Al hacer click
 * disparan el flujo del feature correspondiente (no abren otra pantalla).
 */
export function QuickActionPills({ onPick, className }: QuickActionPillsProps) {
  return (
    <div
      role="list"
      aria-label="Acciones rápidas"
      className={cn(
        "flex flex-wrap items-center justify-center gap-2",
        className,
      )}
    >
      {ACTIONS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="listitem"
          onClick={() => onPick?.(label)}
          aria-label={label}
          className="text-muted-foreground hover:text-foreground hover:bg-muted/60 inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3.5 py-1.5 text-xs transition-colors sm:text-sm"
        >
          <Icon className="size-3.5 shrink-0" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}
