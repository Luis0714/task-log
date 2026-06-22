export type DeleteWorkItemResponse = {
  ok: boolean;
  errorMessage?: string;
};

export async function deleteWorkItemById(
  workItemId: number,
  project: string,
): Promise<DeleteWorkItemResponse> {
  const response = await fetch(`/api/ado/work-items/${workItemId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project }),
  });
  const body = (await response.json()) as { error?: string };

  if (response.ok) return { ok: true };

  return {
    ok: false,
    errorMessage: body.error ?? "No se pudo eliminar el elemento de trabajo.",
  };
}

export type TaskUpdatePayload = {
  project: string;
  state: string;
  workingDate: string;
  workingTime: string;
};

export type TaskUpdateResponse = {
  ok: boolean;
  errorMessage?: string;
};

export async function patchTaskWorkItem(
  taskId: number,
  payload: TaskUpdatePayload,
): Promise<TaskUpdateResponse> {
  const response = await fetch(`/api/ado/work-items/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = (await response.json()) as { error?: string };

  if (response.ok) return { ok: true };

  return {
    ok: false,
    errorMessage: body.error ?? "No se pudo guardar el estado.",
  };
}
