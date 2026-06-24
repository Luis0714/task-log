import "server-only";

import { resolveAdoProfile } from "@/lib/auth/resolve-ado-profile";
import { getBacklogItemFetchFieldNames, resolveBacklogResponsableFields } from "@/lib/azure-devops/backlog-item-fields";
import { discoverBacklogResponsableFields } from "@/lib/azure-devops/backlog-item-field-discovery";
import {
  type BacklogResponsableFieldConfig,
} from "@/lib/azure-devops/backlog-item-fields-config";
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
  /**
   * Mapa `referenceName → displayName` para los Responsables del proyecto.
   * El admin los configura en `project_configurations.responsable_fields`.
   * Si falta un valor y el campo tiene `defaultToCurrentUser=true`, se usa
   * el usuario logueado como Responsable.
   */
  responsables?: Readonly<Record<string, string>>;
  workflowTag?: UserStoryWorkflowTagOption;
  tags?: readonly string[];
};

export type UpdateBacklogItemStateResult =
  | { ok: true; state: string }
  | { ok: false; status: number; body: string };

function authHeader(auth: AdoCallerAuth): string {
  return adoAuthHeader(auth);
}

function normalizeLabel(value: string | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function labelsMatch(a: string | undefined, b: string | undefined): boolean {
  const na = normalizeLabel(a);
  const nb = normalizeLabel(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  return na.includes(nb) || nb.includes(na);
}

/**
 * Para cada Responsable configurado, devuelve el displayName a usar:
 * 1) `params.responsables[ref]` (lo que el usuario completó en el form).
 * 2) Si el campo tiene `defaultToCurrentUser=true`, el displayName del usuario logueado.
 * 3) Si no, cadena vacía (no se patchea).
 */
async function resolveResponsableDisplayNames(
  auth: AdoCallerAuth,
  params: UpdateBacklogItemStateParams,
  responsableFields: readonly BacklogResponsableFieldConfig[],
): Promise<Map<string, string>> {
  const inputResponsables = params.responsables ?? {};
  const needDefaults = responsableFields.some(
    (config) =>
      config.defaultToCurrentUser &&
      !inputResponsables[config.referenceName]?.trim(),
  );

  let currentUserDisplayName: string | null = null;
  if (needDefaults) {
    const profile = await resolveAdoProfile(auth);
    currentUserDisplayName = profile?.displayName?.trim() || null;
  }

  const resolved = new Map<string, string>();
  for (const config of responsableFields) {
    const explicit = inputResponsables[config.referenceName]?.trim();
    if (explicit) {
      resolved.set(config.referenceName, explicit);
      continue;
    }
    if (config.defaultToCurrentUser && currentUserDisplayName) {
      resolved.set(config.referenceName, currentUserDisplayName);
    }
  }
  return resolved;
}

async function buildBacklogTransitionPatchOps(
  auth: AdoCallerAuth,
  params: UpdateBacklogItemStateParams,
  existingFields: Record<string, string | number | undefined> | undefined,
  _responsableFields: readonly BacklogResponsableFieldConfig[],
  resolvedResponsables: ReadonlyMap<string, string>,
): Promise<WorkItemFieldPatchOp[]> {
  const ops: WorkItemFieldPatchOp[] = [];

  const startDate = toWorkingDateKey(params.startDate);
  const targetDate = toWorkingDateKey(params.targetDate);
  if (startDate) {
    ops.push(
      ...buildScalarFieldPatchOps(existingFields, [
        { fieldName: "Microsoft.VSTS.Scheduling.StartDate", value: startDate },
      ]),
    );
  }
  if (targetDate) {
    ops.push(
      ...buildScalarFieldPatchOps(existingFields, [
        { fieldName: "Microsoft.VSTS.Scheduling.TargetDate", value: targetDate },
      ]),
    );
  }

  if (resolvedResponsables.size > 0) {
    const members = params.team?.trim()
      ? await listTeamMembers(auth, params.team.trim())
      : undefined;

    for (const [refName, displayName] of resolvedResponsables) {
      const patchValue = await resolveIdentityPatchValue(
        auth,
        displayName,
        params.team,
        members,
      );
      if (!patchValue) continue;
      ops.push(
        ...buildScalarFieldPatchOps(existingFields, [
          { fieldName: refName, value: patchValue },
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

  const validationError = validateBacklogStateTransition(state, params, responsableFields.length, responsableFields);
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

  const resolvedResponsables = await resolveResponsableDisplayNames(
    auth,
    params,
    responsableFields,
  );

  const patchOps = await buildBacklogTransitionPatchOps(
    auth,
    params,
    wi.fields,
    responsableFields,
    resolvedResponsables,
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
      resolvedResponsables,
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
  resolvedResponsables: ReadonlyMap<string, string>;
  patchUrl: string;
  headers: Record<string, string>;
  body: string;
  patchOps: WorkItemFieldPatchOp[];
  wiFields: Record<string, string | number | undefined> | undefined;
  responsableFields: readonly BacklogResponsableFieldConfig[];
};

async function retryBacklogResponsablesOnRuleError(
  input: RetryInput,
): Promise<{ ok: true; state: string } | null> {
  const {
    auth, params, resolvedResponsables, patchUrl, headers, body, patchOps,
    wiFields, responsableFields,
  } = input;

  if (!body.includes("TF401320")) return null;

  const details = parseAdoRuleErrorDetails(body);
  if (details.length === 0) return null;

  const responsableByRef = new Map<string, BacklogResponsableFieldConfig>(
    responsableFields.map((f) => [f.referenceName, f]),
  );
  const patchedPaths = new Set(patchOps.map((op) => op.path));

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
      // discovery falló (sin red / permisos); sólo con los campos conocidos.
    }
  }

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

    // Usa el valor resuelto por defecto (puede venir del usuario, del current user o del params).
    let displayName = resolvedResponsables.get(detail.fieldReferenceName) ?? "";
    if (!displayName) {
      const explicit = params.responsables?.[detail.fieldReferenceName]?.trim();
      if (explicit) displayName = explicit;
    }
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