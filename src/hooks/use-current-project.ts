"use client";

import { useSearchParams } from "next/navigation";

/**
 * Devuelve el proyecto activo desde el query string (`?project=<name>`).
 *
 * Lo usan los hooks de estados (`useBacklogItemStates`, `useTaskStates`) para
 * saber a qué proyecto pertenece la cache y la request. Si no hay project en
 * la URL, retorna `null` y el caller cae al proyecto por defecto del ADO.
 */
export function useCurrentProject(): string | null {
  const params = useSearchParams();
  return params.get("project")?.trim() || null;
}