import {
  looksLikeResponsableLabel,
  parseAdoRuleErrorDetails,
} from "@/lib/azure-devops/ado-rule-errors";
import { formatAdoErrorMessage } from "@/lib/errors/parse-ado-error";
import { USER_MESSAGES } from "@/lib/errors/user-messages";

/** Mensaje seguro para el usuario según la respuesta de ADO al actualizar un work item. */
export function mapAdoWorkItemUpdateError(
  status: number,
  body: string,
): string {
  if (status === 403) {
    return USER_MESSAGES.permissionsInsufficient;
  }

  const detail = body;

  if (detail.includes("Working Date") || detail.includes("Custom.WorkingDate")) {
    return USER_MESSAGES.workingDateRequired;
  }
  if (detail.includes("Completed Work") || detail.includes("CompletedWork")) {
    return USER_MESSAGES.completedWorkRequired;
  }
  if (detail.includes("Start Date") || detail.includes("StartDate")) {
    return USER_MESSAGES.startDateRequired;
  }
  if (detail.includes("Target Date") || detail.includes("TargetDate")) {
    return USER_MESSAGES.targetDateRequired;
  }

  // Primero intenta extraer un campo Responsable específico desde la respuesta TF401320
  // para devolver un mensaje accionable con el ReferenceName del campo que falta.
  const ruleDetails = parseAdoRuleErrorDetails(detail);
  const responsableDetail = ruleDetails.find((d) =>
    d.flags.required && d.flags.invalidEmpty && looksLikeResponsableLabel(d.label),
  );
  if (responsableDetail) {
    const role = inferResponsableRoleFromLabel(responsableDetail.label);
    if (role) {
      return USER_MESSAGES.responsableMissingField({
        roleLabel: role.label,
        fieldRef: responsableDetail.fieldReferenceName,
        fieldLabel: responsableDetail.label,
        envKey: role.envKey,
      });
    }
  }

  if (detail.includes("Responsable") || detail.includes("Maquetacion")) {
    return USER_MESSAGES.responsablesRequired;
  }

  if (status === 400 && detail.trim()) {
    return formatAdoErrorMessage(detail);
  }

  return USER_MESSAGES.workItemUpdateFailed;
}

type ResponsableRole = {
  label: string;
  envKey: string;
};

function inferResponsableRoleFromLabel(
  label: string | undefined,
): ResponsableRole | null {
  const normalized = (label ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");

  if (!normalized) return null;

  if (normalized.includes("maquet") || normalized.includes("disen") || normalized.includes("layout") || normalized.includes("mockup") || normalized.includes("front")) {
    return { label: "el Responsable Maquetación", envKey: "AZDO_PBI_FIELD_MAQUETACION" };
  }
  if (normalized.includes("integr") || normalized.includes("bridge") || normalized.includes("merge") || normalized.includes("deploy")) {
    return { label: "el Responsable Integrador", envKey: "AZDO_PBI_FIELD_INTEGRADOR" };
  }
  if (normalized.includes("qa") || normalized.includes("tester") || normalized.includes("quality") || normalized.includes("reviewer") || normalized.includes("prueba")) {
    return { label: "el Responsable QA", envKey: "AZDO_PBI_FIELD_QA" };
  }
  return null;
}