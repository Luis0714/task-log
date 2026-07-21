import { resolveCurrentSprint } from "@/lib/ado/resolve-current-sprint";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { WORK_ITEM_ASSIGNEE_ME } from "@/lib/schemas/work-item-filters";

export type SprintDataContext = {
  project: string;
  team: string;
  sprintPath: string;
  sprintStartDate: string | null;
  sprintFinishDate: string | null;
  assignee: string;
};

/**
 * Rango de fechas resuelto a partir del sprint del catálogo.
 *
 * Es el ÚNICO punto de extracción de las fechas de sprint que debería
 * consumir el Dashboard, los módulos de Bugs y Tareas, y las estadísticas.
 * El sprint nunca se usa como filtro directo sobre work items: solo
 * aporta este rango temporal, que es el único criterio de fecha en las
 * consultas.
 */
export type SprintDateRange = {
  project: string;
  team: string;
  sprintPath: string;
  /** Fecha civil YYYY-MM-DD (inclusiva) o null si el sprint no tiene fechas. */
  startDate: string | null;
  /** Fecha civil YYYY-MM-DD (inclusiva) o null si el sprint no tiene fechas. */
  finishDate: string | null;
};

export function resolveSprintDateRange(
  catalog: AdoCatalogSnapshot,
): SprintDateRange | null {
  if (!catalog.project || !catalog.team || !catalog.sprintPath) return null;
  const currentSprint = resolveCurrentSprint(catalog);
  return {
    project: catalog.project,
    team: catalog.team,
    sprintPath: catalog.sprintPath,
    startDate: currentSprint?.startDate ?? null,
    finishDate: currentSprint?.finishDate ?? null,
  };
}

export function catalogToSprintContext(
  catalog: AdoCatalogSnapshot,
  assignee = WORK_ITEM_ASSIGNEE_ME,
): SprintDataContext | null {
  const range = resolveSprintDateRange(catalog);
  if (!range) return null;
  return {
    project: range.project,
    team: range.team,
    sprintPath: range.sprintPath,
    sprintStartDate: range.startDate,
    sprintFinishDate: range.finishDate,
    assignee,
  };
}
