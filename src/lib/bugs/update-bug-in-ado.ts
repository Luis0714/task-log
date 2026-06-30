export type UpdateBugInAdoPayload = {
  project: string;
  state: string;
  workingDate?: string;
  completedWork: number;
  reopenedDate?: string;
  newParentId?: number;
};

export async function updateBugInAdo(
  bugId: number,
  payload: UpdateBugInAdoPayload,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const res = await fetch(`/api/ado/work-items/${bugId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { error?: string };

    if (!res.ok) {
      return {
        ok: false,
        message: data.error ?? "No se pudo guardar el bug.",
      };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: "No se pudo guardar el bug." };
  }
}
