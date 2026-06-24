import "server-only";

import { getBacklogItemFetchFieldNames, resolveBacklogResponsableFields } from "@/lib/azure-devops/backlog-item-fields";
import {
  discoverBacklogResponsableFields,
} from "@/lib/azure-devops/backlog-item-field-discovery";
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
  buildScalarFieldPatchOp,
  buildScalarFieldPatchOps,
  type WorkItemFieldPatchOp,
} from "@/lib/azure-devops/work-item-patch";
import { listTeamMembers } from "@/lib/azure-devops/work-item-type-states";
import { toWorkingDateKey } from "@/lib/azure-devops/working-date-field";
import {
  buildWorkItemTagsPatchOp,
  buildWorkflowTagPatchOp,
  SYSTEM_TAGS_FIELD,
} from "@/lib/work-items/patch-user-story-workflow-tag";
import type { UserStoryWorkflowTagOption } from "@/lib/work-items/user-story-workflow-tags";
import {
  looksLikeResponsableLabel,
  parseAdoRuleErrorDetails,
} from "@/lib/azure-devops/ado-rule-errors";

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
  workflowTag?: UserStoryWorkflowTagOption;
  tags?: readonly string[];
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

function normalizeLabel(value: string | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/** Comparación laxa de etiquetas (mismo conjunto de tokens relevantes). */
function labelsMatch(a: string | undefined, b: string | undefined): boolean {
  const na = normalizeLabel(a);
  const nb = normalizeLabel(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  // Coincidencia si una contiene a la otra o comparten keywords.
  return na.includes(nb) || nb.includes(na);
}

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

  const getFields = [
    SYSTEM_STATE,
    SYSTEM_TAGS_FIELD,
    ...(await getBacklogItemFetchFieldNames(auth)),
  ].join(",");
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

  if (params.tags !== undefined) {
    const existingTags =
      typeof wi.fields?.[SYSTEM_TAGS_FIELD] === "string"
        ? wi.fields[SYSTEM_TAGS_FIELD]
        : undefined;
    patchOps.push(buildWorkItemTagsPatchOp(existingTags, params.tags));
  } else if (params.workflowTag !== undefined) {
    const existingTags =
      typeof wi.fields?.[SYSTEM_TAGS_FIELD] === "string"
        ? wi.fields[SYSTEM_TAGS_FIELD]
        : undefined;
    patchOps.push(buildWorkflowTagPatchOp(existingTags, params.workflowTag));
  }

  patchOps.push({ op: "replace", path: `/fields/${SYSTEM_STATE}`, value: state });

  const patchUrl = `${base}/${params.workItemId}?${api}`;
  const patchRes = await adoFetch(auth, patchUrl, {
    method: "PATCH",
    headers,
    body: JSON.stringify(patchOps),
  });

  if (!patchRes.ok) {
    const body = await patchRes.text();
    const retryResult = await retryBacklogResponsablesOnRuleError({
      auth,
      params,
      patchUrl,
      headers,
      body,
      patchOps,
      wiFields: wi.fields,
      responsableFields,
    });
    if (retryResult) return retryResult;

    return {
      ok: false,
      status: patchRes.status,
      body: body.slice(0, 500) || "No se pudo actualizar el estado del work item.",
    };
  }

  return { ok: true, state };
}

type RetryInput = {
  auth: AdoCallerAuth;
  params: UpdateBacklogItemStateParams;
  patchUrl: string;
  headers: Record<string, string>;
  body: string;
  patchOps: WorkItemFieldPatchOp[];
  wiFields: Record<string, string | number | undefined> | undefined;
  responsableFields: readonly BacklogResponsableFieldConfig[];
};

/**
 * Si ADO devuelve TF401320 indicando campos Responsable requeridos+vacíos,
 * intenta re-PATCHearlos con el valor que el usuario ya completó (si lo hay).
 * Si el campo no estaba en `responsableFields`, hace discovery on-demand.
 *
 * Devuelve `{ ok: true, state }` si el retry tuvo éxito, o `null` si no
 * había nada que reintentar (en cuyo caso el caller devuelve el fallo original).
 */
async function retryBacklogResponsablesOnRuleError(
  input: RetryInput,
): Promise<{ ok: true; state: string } | null> {
  const { auth, params, patchUrl, headers, body, patchOps, wiFields, responsableFields } = input;

  if (!body.includes("TF401320")) return null;

  const details = parseAdoRuleErrorDetails(body);
  if (details.length === 0) return null;

  const responsableByRef = new Map<string, BacklogResponsableFieldConfig>(
    responsableFields.map((f) => [f.referenceName, f]),
  );
  const patchedPaths = new Set(patchOps.map((op) => op.path));

  // Descubre candidatos no mapeados por etiqueta Responsable.
  const unknownResponsable = details.filter(
    (detail) =>
      !responsableByRef.has(detail.fieldReferenceName) &&
      looksLikeResponsableLabel(detail.label),
  );

  if (unknownResponsable.length > 0) {
    try {
      const fresh = await discoverBacklogResponsableFields(auth);
      for (const config of fresh) {
        if (!responsableByRef.has(config.referenceName)) {
          responsableByRef.set(config.referenceName, config);
        }
      }
      // Match por label si el ref no encajó exactamente.
      for (const detail of unknownResponsable) {
        if (responsableByRef.has(detail.fieldReferenceName)) continue;
        const candidate = fresh.find(
          (c) =>
            c.referenceName === detail.fieldReferenceName ||
            labelsMatch(c.label, detail.label),
        );
        if (candidate) responsableByRef.set(candidate.referenceName, candidate);
      }
    } catch {
      // Si el discovery falla (sin red, permisos), seguimos sólo con los campos conocidos.
    }
  }

  // Recolecta miembros del equipo una sola vez para todos los reintentos.
  const teamMembers = params.team?.trim()
    ? await listTeamMembers(auth, params.team.trim()).catch(() => undefined)
    : undefined;

  const retryOps: WorkItemFieldPatchOp[] = [...patchOps];

  for (const detail of details) {
    if (!detail.flags.required || !detail.flags.invalidEmpty) continue;
    const path = `/fields/${detail.fieldReferenceName}`;
    if (patchedPaths.has(path)) continue;

    const config = responsableByRef.get(detail.fieldReferenceName);
    if (!config) continue;

    const paramKey = RESPONSABLE_PARAM_KEYS[config.key];
    const displayName = params[paramKey]?.trim();
    if (!displayName) continue;

    const value = await resolveIdentityPatchValue(
      auth,
      displayName,
      params.team,
      teamMembers,
    );
    if (!value) continue;

    retryOps.push(buildScalarFieldPatchOp(wiFields, detail.fieldReferenceName, value));
    patchedPaths.add(path);
  }

  if (retryOps.length === patchOps.length) return null;

  const retryRes = await adoFetch(auth, patchUrl, {
    method: "PATCH",
    headers,
    body: JSON.stringify(retryOps),
  });

  if (!retryRes.ok) return null;

  return { ok: true, state: params.state.trim() };
}