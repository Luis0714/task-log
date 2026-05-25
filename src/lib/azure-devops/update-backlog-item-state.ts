import "server-only";

import { getBacklogItemFetchFieldNames, resolveBacklogResponsableFields } from "@/lib/azure-devops/backlog-item-fields";
import {
  PBI_START_DATE_FIELD,
  PBI_TARGET_DATE_FIELD,
  type BacklogResponsableFieldConfig,
} from "@/lib/azure-devops/backlog-item-fields-config";
import type { BacklogResponsableFieldKey } from "@/lib/work-items/backlog-field-types";
import { adoFetch, adoAuthHeader, adoProjectBase } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { resolveIdentityPatchValue } from "@/lib/azure-devops/resolve-identity-patch-value";
import { validateBacklogStateTransition } from "@/lib/azure-devops/validate-backlog-transition";
import {
  buildScalarFieldPatchOps,
  type WorkItemFieldPatchOp,
} from "@/lib/azure-devops/work-item-patch";
import { listTeamMembers } from "@/lib/azure-devops/work-item-type-states";
import { toWorkingDateKey } from "@/lib/azure-devops/working-date-field";
import { requiresCommittedDates, requiresQaResponsables } from "@/lib/work-items/pbi-state-transition";

const SYSTEM_STATE = "System.State";

export type UpdateBacklogItemStateParams = {
  workItemId: number;
  state: string;
  team?: string;
  startDate?: string;
  targetDate?: string;
  responsableMaquetacion?: string;
  responsableIntegrador?: string;
  responsableQA?: string;
};

export type UpdateBacklogItemStateResult =
  | { ok: true; state: string }
  | { ok: false; status: number; body: string };

function authHeader(auth: AdoCallerAuth): string {
  return adoAuthHeader(auth);
}

const RESPONSABLE_PARAM_KEYS: Record<
  BacklogResponsableFieldKey,
  keyof Pick<
    UpdateBacklogItemStateParams,
    "responsableMaquetacion" | "responsableIntegrador" | "responsableQA"
  >
> = {
  maquetacion: "responsableMaquetacion",
  integrador: "responsableIntegrador",
  qa: "responsableQA",
};

async function buildBacklogTransitionPatchOps(
  auth: AdoCallerAuth,
  params: UpdateBacklogItemStateParams,
  existingFields: Record<string, string | number | undefined> | undefined,
  responsableFields: readonly BacklogResponsableFieldConfig[],
): Promise<WorkItemFieldPatchOp[]> {
  const ops: WorkItemFieldPatchOp[] = [];

  const startDate = toWorkingDateKey(params.startDate);
  const targetDate = toWorkingDateKey(params.targetDate);
  if (startDate) {
    ops.push(
      ...buildScalarFieldPatchOps(existingFields, [
        { fieldName: PBI_START_DATE_FIELD, value: startDate },
      ]),
    );
  }
  if (targetDate) {
    ops.push(
      ...buildScalarFieldPatchOps(existingFields, [
        { fieldName: PBI_TARGET_DATE_FIELD, value: targetDate },
      ]),
    );
  }

  const hasResponsableInput = responsableFields.some((config) => {
    const paramKey = RESPONSABLE_PARAM_KEYS[config.key];
    return Boolean(params[paramKey]?.trim());
  });

  if (hasResponsableInput) {
    const members = params.team?.trim()
      ? await listTeamMembers(auth, params.team.trim())
      : undefined;

    for (const config of responsableFields) {
      const paramKey = RESPONSABLE_PARAM_KEYS[config.key];
      const displayName = params[paramKey]?.trim();
      if (!displayName) continue;

      const patchValue = await resolveIdentityPatchValue(
        auth,
        displayName,
        params.team,
        members,
      );
      if (!patchValue) continue;

      ops.push(
        ...buildScalarFieldPatchOps(existingFields, [
          { fieldName: config.referenceName, value: patchValue },
        ]),
      );
    }
  }

  return ops;
}

export async function updateBacklogItemState(
  params: UpdateBacklogItemStateParams,
  auth: AdoCallerAuth,
): Promise<UpdateBacklogItemStateResult> {
  const state = params.state.trim();
  if (!state) {
    return { ok: false, status: 400, body: "El estado no puede estar vacío." };
  }

  const responsableFields = await resolveBacklogResponsableFields(auth);

  const validationError = validateBacklogStateTransition(state, params, responsableFields.length);
  if (validationError) {
    return { ok: false, status: 400, body: validationError };
  }

  const base = `${adoProjectBase(auth)}/_apis/wit/workitems`;
  const api = "api-version=7.1";
  const headers: Record<string, string> = {
    Authorization: authHeader(auth),
    "Content-Type": "application/json-patch+json",
  };

  const getFields = [SYSTEM_STATE, ...(await getBacklogItemFetchFieldNames(auth))].join(",");
  const getUrl = `${base}/${params.workItemId}?${api}&$fields=${encodeURIComponent(getFields)}`;
  const getRes = await adoFetch(auth, getUrl);

  if (!getRes.ok) {
    const body = await getRes.text();
    return {
      ok: false,
      status: getRes.status,
      body: body.slice(0, 500) || "No se pudo leer el work item antes de actualizar.",
    };
  }

  const wi = (await getRes.json()) as {
    fields?: Record<string, string | number | undefined>;
  };

  const patchOps = await buildBacklogTransitionPatchOps(
    auth,
    params,
    wi.fields,
    responsableFields,
  );
  patchOps.push({ op: "replace", path: `/fields/${SYSTEM_STATE}`, value: state });

  const patchUrl = `${base}/${params.workItemId}?${api}`;
  const patchRes = await adoFetch(auth, patchUrl, {
    method: "PATCH",
    headers,
    body: JSON.stringify(patchOps),
  });

  if (!patchRes.ok) {
    const body = await patchRes.text();
    return {
      ok: false,
      status: patchRes.status,
      body: body.slice(0, 500) || "No se pudo actualizar el estado del work item.",
    };
  }

  return { ok: true, state };
}
