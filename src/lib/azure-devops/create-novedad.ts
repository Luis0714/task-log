import "server-only";

import {
  adoFetch,
  adoOrgBase,
  adoProjectBase,
} from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { listWorkItemTypeStates } from "@/lib/azure-devops/work-item-type-states";
import { pickDefaultOpenTaskState } from "@/lib/time-log/task-state-utils";
import {
  buildWorkingDateTimeValue,
  resolveAdoTimeZone,
} from "@/lib/azure-devops/working-date-field";
import {
  COMPLETED_WORK_FIELD,
  NOVEDAD_FIELDS,
  NOVEDAD_WORK_ITEM_TYPE,
  resolveTiempoNovedadFieldRef,
} from "@/lib/azure-devops/novedad-fields";

/**
 * Crea el work item custom "Novedades" como hijo de la HU de novedades
 * seleccionada (CA-28). Un único intento (sin reintentos ni idempotencia, por
 * decisión del producto). Espejo reducido de `createTaskUnderPbi`.
 */
export type CreateNovedadParams = Readonly<{
  /** HU de novedades destino (padre). */
  storyId: number;
  title: string;
  /** Identidad de Azure (uniqueName o displayName) a asignar. */
  assignedTo: string;
  description?: string;
  tipo: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  fechaReintegro: string;
  /** Tiempo ya convertido a horas (días × 8 se resuelve antes). */
  hours: number;
}>;

export type CreateNovedadResult =
  | { ok: true; workItemId: number; url: string }
  | { ok: false; status: number; body: string };

type JsonPatchOp =
  | { op: "add"; path: string; value: string | number }
  | { op: "add"; path: "/relations/-"; value: { rel: string; url: string } };

async function fetchStoryContext(
  auth: AdoCallerAuth,
  storyId: number,
): Promise<{ areaPath?: string; iterationPath?: string }> {
  const fields = [NOVEDAD_FIELDS.areaPath, NOVEDAD_FIELDS.iterationPath].join(",");
  const url = `${adoProjectBase(auth)}/_apis/wit/workitems/${storyId}?fields=${encodeURIComponent(
    fields,
  )}&api-version=7.1`;
  const res = await adoFetch(auth, url);
  if (!res.ok) return {};
  const data = (await res.json()) as { fields?: Record<string, string | undefined> };
  return {
    areaPath: data.fields?.[NOVEDAD_FIELDS.areaPath]?.trim() || undefined,
    iterationPath: data.fields?.[NOVEDAD_FIELDS.iterationPath]?.trim() || undefined,
  };
}

export async function createNovedadUnderStory(
  params: CreateNovedadParams,
  auth: AdoCallerAuth,
): Promise<CreateNovedadResult> {
  const timeZone = resolveAdoTimeZone();
  const [context, states, tiempoFieldRef] = await Promise.all([
    fetchStoryContext(auth, params.storyId),
    listWorkItemTypeStates(auth, NOVEDAD_WORK_ITEM_TYPE).catch(() => []),
    resolveTiempoNovedadFieldRef(auth),
  ]);

  const ops: JsonPatchOp[] = [
    { op: "add", path: `/fields/${NOVEDAD_FIELDS.title}`, value: params.title.trim() },
    { op: "add", path: `/fields/${NOVEDAD_FIELDS.assignedTo}`, value: params.assignedTo.trim() },
    { op: "add", path: `/fields/${NOVEDAD_FIELDS.tipo}`, value: params.tipo.trim() },
    {
      op: "add",
      path: `/fields/${NOVEDAD_FIELDS.fechaInicio}`,
      value: buildWorkingDateTimeValue(params.startDate, params.startTime, timeZone),
    },
    {
      op: "add",
      path: `/fields/${NOVEDAD_FIELDS.fechaFin}`,
      value: buildWorkingDateTimeValue(params.endDate, params.endTime, timeZone),
    },
    {
      op: "add",
      path: `/fields/${NOVEDAD_FIELDS.fechaReintegro}`,
      value: params.fechaReintegro,
    },
    { op: "add", path: `/fields/${tiempoFieldRef}`, value: params.hours },
  ];

  // El reporte de horas (HU-03) suma `Completed Work`; si "Tiempo Novedad" es un
  // campo distinto, escribir también Completed Work para no romper el reporte.
  if (tiempoFieldRef !== COMPLETED_WORK_FIELD) {
    ops.push({ op: "add", path: `/fields/${COMPLETED_WORK_FIELD}`, value: params.hours });
  }

  const stateName = pickDefaultOpenTaskState(states);
  if (stateName) {
    ops.push({ op: "add", path: `/fields/${NOVEDAD_FIELDS.state}`, value: stateName });
  }
  if (context.areaPath) {
    ops.push({ op: "add", path: `/fields/${NOVEDAD_FIELDS.areaPath}`, value: context.areaPath });
  }
  if (context.iterationPath) {
    ops.push({ op: "add", path: `/fields/${NOVEDAD_FIELDS.iterationPath}`, value: context.iterationPath });
  }

  const description = params.description?.trim();
  if (description) {
    ops.push({ op: "add", path: `/fields/${NOVEDAD_FIELDS.description}`, value: description });
  }

  ops.push({
    op: "add",
    path: "/relations/-",
    value: {
      rel: "System.LinkTypes.Hierarchy-Reverse",
      url: `${adoOrgBase(auth)}/_apis/wit/workitems/${params.storyId}`,
    },
  });

  const url = `${adoProjectBase(auth)}/_apis/wit/workitems/$${encodeURIComponent(
    NOVEDAD_WORK_ITEM_TYPE,
  )}?api-version=7.1`;

  const res = await adoFetch(auth, url, {
    method: "POST",
    headers: { "Content-Type": "application/json-patch+json" },
    body: JSON.stringify(ops),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, status: res.status, body: body.slice(0, 500) };
  }

  const created = (await res.json()) as { id?: number };
  if (!created.id) {
    return { ok: false, status: 502, body: "Azure DevOps no devolvió el ID de la novedad creada." };
  }

  return {
    ok: true,
    workItemId: created.id,
    url: `${adoProjectBase(auth)}/_workitems/edit/${created.id}`,
  };
}
