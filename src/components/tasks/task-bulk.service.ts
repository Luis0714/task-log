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

/**
 * Elimina varias tareas en una sola llamada. Si una falla, las demás se siguen
 * intentando; el servidor devuelve el total esperado y el realmente eliminado.
 */
export async function bulkDeleteWorkItems(
  payload: BulkDeletePayload,
): Promise<BulkWorkItemResult> {
  const response = await fetch("/api/ado/work-items/bulk-delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = (await response.json()) as {
    ok?: boolean;
    expected?: number;
    deleted?: number;
    failed?: number[];
    error?: string;
  };

  if (!response.ok || !body.ok) {
    return {
      ok: false,
      expected: payload.ids.length,
      processed: 0,
      failed: payload.ids,
      errorMessage: body.error ?? "No se pudo eliminar las tareas.",
    };
  }

  return {
    ok: true,
    expected: body.expected ?? payload.ids.length,
    processed: body.deleted ?? 0,
    failed: body.failed ?? [],
  };
}

/**
 * Cambia el estado de varias tareas en una sola llamada. Misma resiliencia que
 * bulkDeleteWorkItems: si una tarea falla, las demás se siguen intentando.
 */
export async function bulkUpdateWorkItemsState(
  payload: BulkUpdateStatePayload,
): Promise<BulkWorkItemResult> {
  const response = await fetch("/api/ado/work-items/bulk-update-state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = (await response.json()) as {
    ok?: boolean;
    expected?: number;
    updated?: number;
    failed?: number[];
    error?: string;
  };

  if (!response.ok || !body.ok) {
    return {
      ok: false,
      expected: payload.ids.length,
      processed: 0,
      failed: payload.ids,
      errorMessage: body.error ?? "No se pudo cambiar el estado de las tareas.",
    };
  }

  return {
    ok: true,
    expected: body.expected ?? payload.ids.length,
    processed: body.updated ?? 0,
    failed: body.failed ?? [],
  };
}

export async function bulkReassignWorkItemsParent(
  payload: BulkReassignParentPayload,
): Promise<BulkWorkItemResult> {
  const response = await fetch("/api/ado/work-items/bulk-reassign-parent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = (await response.json()) as {
    ok?: boolean;
    expected?: number;
    updated?: number;
    failed?: number[];
    error?: string;
  };

  if (!response.ok || !body.ok) {
    return {
      ok: false,
      expected: payload.ids.length,
      processed: 0,
      failed: payload.ids,
      errorMessage: body.error ?? "No se pudo re-asignar la HU padre de las tareas.",
    };
  }

  return {
    ok: true,
    expected: body.expected ?? payload.ids.length,
    processed: body.updated ?? 0,
    failed: body.failed ?? [],
  };
}
