import {
  requiresCommittedDates,
  requiresQaResponsables,
} from "@/lib/work-items/pbi-state-transition";

export type BacklogTransitionInput = {
  startDate?: string;
  targetDate?: string;
  responsableMaquetacion?: string;
  responsableIntegrador?: string;
  responsableQA?: string;
};

export function validateBacklogStateTransition(
  targetState: string,
  input: BacklogTransitionInput,
  configuredResponsableCount = 0,
): string | null {
  if (requiresCommittedDates(targetState)) {
    if (!input.startDate?.trim()) {
      return "Indica la Start Date para pasar a Committed.";
    }
    if (!input.targetDate?.trim()) {
      return "Indica la Target Date para pasar a Committed.";
    }
  }

  if (requiresQaResponsables(targetState)) {
    if (configuredResponsableCount < 3) {
      return (
        "No se encontraron los campos Responsable en Azure DevOps. " +
        "Configura AZDO_PBI_FIELD_MAQUETACION, AZDO_PBI_FIELD_INTEGRADOR y AZDO_PBI_FIELD_QA en .env.local " +
        "(Reference Name del proceso)."
      );
    }
    if (!input.responsableMaquetacion?.trim()) {
      return "Indica el Responsable Maquetación para pasar a QA.";
    }
    if (!input.responsableIntegrador?.trim()) {
      return "Indica el Responsable Integrador para pasar a QA.";
    }
    if (!input.responsableQA?.trim()) {
      return "Indica el Responsable QA para pasar a QA.";
    }
  }

  return null;
}
