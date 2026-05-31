export type SaveAdoContextDefaultsPayload = {
  project: string;
  team: string;
};

export async function saveAdoContextDefaultsRequest(
  payload: SaveAdoContextDefaultsPayload,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch("/api/ado/context-defaults", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "No se pudo guardar el proyecto y equipo predeterminados.");
  }
}
