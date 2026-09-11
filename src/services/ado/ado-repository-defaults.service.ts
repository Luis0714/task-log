export async function saveDefaultRepositoryRequest(
  repository: string,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch("/api/ado/repository-defaults", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repository }),
    signal,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "No se pudo guardar el repositorio predeterminado.");
  }
}
