export type UpdateBugInAdoPayload = {
  project: string;
  state: string;
  workingDate: string;
  completedWork: number;
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
    const data = (await res.json()) as { error?: string; detail?: string };

    if (!res.ok) {
      const message = [data.error, data.detail].filter(Boolean).join(" — ");
      return { ok: false, message: message || "No se pudo guardar el Bug." };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: "No se pudo guardar el bug." };
  }
}
