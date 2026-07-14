export type BulkWorkItemResult = {
  ok: boolean;
  expected: number;
  processed: number;
  failed: number[];
  errorMessage?: string;
};

export type BulkDeletePayload = {
  project: string;
  ids: number[];
};

export type BulkUpdateStatePayload = {
  project: string;
  ids: number[];
  state: string;
  workingDate?: string;
  workingTime?: string;
};

export type BulkReassignParentPayload = {
  project: string;
  ids: number[];
  newParentId: number;
};

type BulkResponseBody = {
  ok?: boolean;
  expected?: number;
  deleted?: number;
  updated?: number;
  failed?: number[];
  error?: string;
};

/**
 * Ejecuta una operación bulk sobre work items. Si un item falla, los demás se
 * siguen intentando; el servidor devuelve el total esperado y el procesado
 * (`deleted` o `updated`, según la operación).
 */
async function postBulkWorkItems(
  endpoint: string,
  payload: { ids: number[] },
  fallbackErrorMessage: string,
): Promise<BulkWorkItemResult> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = (await response.json()) as BulkResponseBody;

  if (!response.ok || !body.ok) {
    return {
      ok: false,
      expected: payload.ids.length,
      processed: 0,
      failed: payload.ids,
      errorMessage: body.error ?? fallbackErrorMessage,
    };
  }

  return {
    ok: true,
    expected: body.expected ?? payload.ids.length,
    processed: body.deleted ?? body.updated ?? 0,
    failed: body.failed ?? [],
  };
}

export async function bulkDeleteWorkItems(
  payload: BulkDeletePayload,
): Promise<BulkWorkItemResult> {
  return postBulkWorkItems(
    "/api/ado/work-items/bulk-delete",
    payload,
    "No se pudo eliminar las tareas.",
  );
}

export async function bulkUpdateWorkItemsState(
  payload: BulkUpdateStatePayload,
): Promise<BulkWorkItemResult> {
  return postBulkWorkItems(
    "/api/ado/work-items/bulk-update-state",
    payload,
    "No se pudo cambiar el estado de las tareas.",
  );
}

export async function bulkReassignWorkItemsParent(
  payload: BulkReassignParentPayload,
): Promise<BulkWorkItemResult> {
  return postBulkWorkItems(
    "/api/ado/work-items/bulk-reassign-parent",
    payload,
    "No se pudo re-asignar la HU padre de las tareas.",
  );
}
