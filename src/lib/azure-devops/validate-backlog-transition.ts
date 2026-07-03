import {
  requiresCommittedDates,
  requiresQaResponsables,
} from "@/lib/work-items/pbi-state-transition";
import type { AdoWorkItemTypeState } from "@/lib/azure-devops/work-item-type-states";
import type { BacklogResponsableFieldConfig } from "@/lib/azure-devops/backlog-item-fields-config";

export type BacklogTransitionInput = {
  startDate?: string;
  targetDate?: string;
  responsables?: Readonly<Record<string, string>>;
};

export function validateBacklogStateTransition(
  targetState: string,
  input: BacklogTransitionInput,
  states: readonly AdoWorkItemTypeState[],
  configuredResponsableCount = 0,
  responsableFields: readonly BacklogResponsableFieldConfig[] = [],
): string | null {
  if (requiresCommittedDates(targetState, states)) {
    if (!input.startDate?.trim()) {
      return "Indica la fecha de inicio para pasar a Comprometido.";
    }
    if (!input.targetDate?.trim()) {
      return "Indica la fecha objetivo para pasar a Comprometido.";
    }
  }

  if (requiresQaResponsables(targetState, states)) {
    if (responsableFields.length === 0) {
      return (
        "Este proyecto no tiene campos Responsable configurados. " +
        "Ve a Configuración → Proceso y vincúlalos, o configúralos en .env.local " +
        "(AZDO_PBI_FIELD_*)."
      );
    }
    const inputResponsables = input.responsables ?? {};
    const missingLabels: string[] = [];
    for (const config of responsableFields) {
      const value = inputResponsables[config.referenceName]?.trim();
      if (value) continue;
      if (config.defaultToCurrentUser) continue; // se rellenará en el servidor
      missingLabels.push(config.label);
    }
    if (missingLabels.length > 0) {
      return `Indica los Responsables requeridos para pasar a QA: ${missingLabels.join(", ")}.`;
    }
  }

  // Backwards-compat: si alguien sigue pasando el viejo `configuredResponsableCount`,
  // mantenemos el mensaje legacy para proyectos sin campos nuevos.
  if (
    requiresQaResponsables(targetState, states) &&
    responsableFields.length === 0 &&
    configuredResponsableCount > 0 &&
    configuredResponsableCount < 3
  ) {
    return (
      "No se encontraron los campos Responsable en Azure DevOps. " +
      "Configura AZDO_PBI_FIELD_MAQUETACION, AZDO_PBI_FIELD_INTEGRADOR y AZDO_PBI_FIELD_QA en .env.local " +
      "(Reference Name del proceso)."
    );
  }

  return null;
}