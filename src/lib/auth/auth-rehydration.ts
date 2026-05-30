export const AUTH_REHYDRATION_STORAGE_KEY = "taskpilot-auth-rehydrating";

export const AUTH_REHYDRATION_EVENT = "taskpilot-auth-rehydrating";

/** Marca que la UI debe mostrar skeletons hasta que el servidor confirme sesión ADO. */
export function beginAuthRehydration(): void {
  sessionStorage.setItem(AUTH_REHYDRATION_STORAGE_KEY, "1");
  window.dispatchEvent(new Event(AUTH_REHYDRATION_EVENT));
}

export function readAuthRehydratingFlag(): boolean {
  return sessionStorage.getItem(AUTH_REHYDRATION_STORAGE_KEY) === "1";
}

export function clearAuthRehydratingFlag(): void {
  sessionStorage.removeItem(AUTH_REHYDRATION_STORAGE_KEY);
}
